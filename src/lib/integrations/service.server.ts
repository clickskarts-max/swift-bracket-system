/**
 * Server-only integration service: owns credential storage, run logging and
 * provider dispatch. Never imported from the browser.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { PROVIDER_HANDLERS } from "./providers.server";

type Db = SupabaseClient<any, any, any>;

const asAny = (c: Db) => c as unknown as SupabaseClient<any, any, any>;

export async function listIntegrations(supabase: Db, userId: string) {
  const { data, error } = await asAny(supabase)
    .from("integrations")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const ids = (data ?? []).map((r: any) => r.id);
  const configured: Record<string, string[]> = {};
  if (ids.length) {
    const { data: creds } = await (supabaseAdmin as any)
      .from("integration_credentials")
      .select("integration_id, secrets")
      .in("integration_id", ids);
    for (const c of creds ?? []) {
      configured[c.integration_id] = Object.keys(c.secrets ?? {}).filter(
        (k) => !!(c.secrets ?? {})[k],
      );
    }
  }
  return (data ?? []).map((r: any) => ({ ...r, configured_secrets: configured[r.id] ?? [] }));
}

export async function listRuns(supabase: Db, integrationId: string) {
  const { data, error } = await asAny(supabase)
    .from("integration_sync_runs")
    .select("*")
    .eq("integration_id", integrationId)
    .order("started_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Creates or updates an integration and merges (never clears) its secrets. */
export async function saveIntegration(
  supabase: Db,
  userId: string,
  input: {
    provider: string;
    displayName?: string | null;
    config?: Record<string, unknown>;
    secrets?: Record<string, string>;
  },
) {
  if (!PROVIDER_HANDLERS[input.provider]) throw new Error("Unknown provider");

  const { data: row, error } = await asAny(supabase)
    .from("integrations")
    .upsert(
      {
        owner_id: userId,
        provider: input.provider,
        display_name: input.displayName ?? null,
        config: input.config ?? {},
      },
      { onConflict: "owner_id,provider" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const provided = Object.fromEntries(
    Object.entries(input.secrets ?? {}).filter(([, v]) => typeof v === "string" && v.length > 0),
  );

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing } = await (supabaseAdmin as any)
    .from("integration_credentials")
    .select("secrets")
    .eq("integration_id", row.id)
    .maybeSingle();

  const merged = { ...(existing?.secrets ?? {}), ...provided };
  if (Object.keys(merged).length) {
    const { error: credErr } = await (supabaseAdmin as any)
      .from("integration_credentials")
      .upsert({ integration_id: row.id, secrets: merged, updated_at: new Date().toISOString() });
    if (credErr) throw new Error(credErr.message);
  }

  const hasSecrets = Object.keys(merged).length > 0;
  await asAny(supabase)
    .from("integrations")
    .update({ status: hasSecrets ? "connected" : "disconnected", last_error: null })
    .eq("id", row.id);

  return { id: row.id as string };
}

export async function setEnabled(supabase: Db, integrationId: string, enabled: boolean) {
  const { error } = await asAny(supabase)
    .from("integrations")
    .update({ enabled })
    .eq("id", integrationId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function disconnectIntegration(supabase: Db, integrationId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // RLS on the parent row is the authorization check: if the user cannot see
  // the integration, the delete below affects nothing.
  const { data: owned, error } = await asAny(supabase)
    .from("integrations")
    .select("id")
    .eq("id", integrationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!owned) throw new Error("Integration not found");

  await (supabaseAdmin as any).from("integration_credentials").delete().eq("integration_id", integrationId);
  const { error: delErr } = await asAny(supabase).from("integrations").delete().eq("id", integrationId);
  if (delErr) throw new Error(delErr.message);
  return { ok: true };
}

/** Runs `test` or `sync` for an integration, with run logging and status updates. */
export async function runIntegrationAction(
  supabase: Db,
  userId: string,
  integrationId: string,
  kind: "test" | "sync",
) {
  const { data: row, error } = await asAny(supabase)
    .from("integrations")
    .select("*")
    .eq("id", integrationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("Integration not found");

  const handler = PROVIDER_HANDLERS[row.provider];
  if (!handler) throw new Error("Unknown provider");
  const fn = kind === "sync" ? handler.sync : handler.test;
  if (!fn) return { ok: false, message: "This integration does not support sync." };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: cred } = await (supabaseAdmin as any)
    .from("integration_credentials")
    .select("secrets")
    .eq("integration_id", integrationId)
    .maybeSingle();

  const { data: run } = await (supabaseAdmin as any)
    .from("integration_sync_runs")
    .insert({ integration_id: integrationId, kind, status: "running" })
    .select("id")
    .single();

  if (kind === "sync") {
    await asAny(supabase).from("integrations").update({ status: "syncing" }).eq("id", integrationId);
  }

  let result: { ok: boolean; message: string; items?: number };
  try {
    result = await fn({
      integrationId,
      userId,
      supabase,
      secrets: (cred?.secrets ?? {}) as Record<string, string>,
      config: (row.config ?? {}) as Record<string, unknown>,
    });
  } catch (e) {
    result = { ok: false, message: e instanceof Error ? e.message : "Unexpected error" };
  }

  await (supabaseAdmin as any)
    .from("integration_sync_runs")
    .update({
      status: result.ok ? "success" : "error",
      items_processed: result.items ?? 0,
      message: result.message.slice(0, 500),
      finished_at: new Date().toISOString(),
    })
    .eq("id", run?.id);

  await asAny(supabase)
    .from("integrations")
    .update({
      status: result.ok ? "connected" : "error",
      last_error: result.ok ? null : result.message.slice(0, 500),
      ...(kind === "sync" && result.ok ? { last_synced_at: new Date().toISOString() } : {}),
    })
    .eq("id", integrationId);

  return result;
}
