/**
 * Server-only provider handlers.
 *
 * Each provider implements `test` and (optionally) `sync`. Credentials are
 * passed in from `integration_credentials`; they never leave the server.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type ProviderContext = {
  integrationId: string;
  userId: string;
  /** User-scoped client (RLS applies) for reading the app's own data. */
  supabase: SupabaseClient<any, any, any>;
  secrets: Record<string, string>;
  config: Record<string, unknown>;
};

export type ProviderResult = { ok: boolean; message: string; items?: number };

export type ProviderHandler = {
  test: (ctx: ProviderContext) => Promise<ProviderResult>;
  sync?: (ctx: ProviderContext) => Promise<ProviderResult>;
  /** Verifies an inbound webhook request. Return false to reject with 401. */
  verifyInbound?: (args: {
    body: string;
    headers: Headers;
    secrets: Record<string, string>;
  }) => Promise<boolean>;
};

/** fetch with bounded retries + Retry-After / 429 / 5xx handling. */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempts = 3,
): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      if (res.status === 429 || res.status >= 500) {
        const retryAfter = Number(res.headers.get("retry-after"));
        if (i === attempts - 1) return res;
        const waitMs =
          Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2 ** i * 500;
        await new Promise((r) => setTimeout(r, Math.min(waitMs, 5000)));
        continue;
      }
      return res;
    } catch (e) {
      lastError = e;
      if (i === attempts - 1) break;
      await new Promise((r) => setTimeout(r, 2 ** i * 500));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Network request failed");
}

async function hmacHex(secret: string, body: string) {
  const { createHmac } = await import("crypto");
  return createHmac("sha256", secret).update(body).digest("hex");
}

/** Recently completed matches with scores, for outbound notifications. */
async function recentResults(ctx: ProviderContext, sinceHours = 24) {
  const since = new Date(Date.now() - sinceHours * 3600_000).toISOString();
  const { data, error } = await ctx.supabase
    .from("matches")
    .select(
      "id, match_no, score_a, score_b, status, updated_at, tournament_id, team_a_id, team_b_id",
    )
    .eq("owner_id", ctx.userId)
    .eq("status", "completed")
    .not("score_a", "is", null)
    .gte("updated_at", since)
    .order("updated_at", { ascending: false })
    .limit(25);
  if (error) throw new Error(error.message);
  return data ?? [];
}

const slack: ProviderHandler = {
  async test(ctx) {
    const url = ctx.secrets["webhook_url"];
    if (!url) return { ok: false, message: "Missing incoming webhook URL." };
    const res = await fetchWithRetry(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "✅ Ecluid Basketball connected to this channel." }),
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, message: `Slack responded ${res.status}: ${text}` };
    return { ok: true, message: "Test message delivered to Slack." };
  },
  async sync(ctx) {
    const url = ctx.secrets["webhook_url"];
    if (!url) return { ok: false, message: "Missing incoming webhook URL." };
    const results = await recentResults(ctx);
    if (results.length === 0)
      return { ok: true, message: "No new results in the last 24 hours.", items: 0 };
    const lines = results.map(
      (m: any) => `• Match ${m.match_no ?? "—"}: ${m.score_a} – ${m.score_b}`,
    );
    const res = await fetchWithRetry(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: `*Latest results*\n${lines.join("\n")}` }),
    });
    if (!res.ok)
      return { ok: false, message: `Slack responded ${res.status}: ${await res.text()}` };
    return {
      ok: true,
      message: `Posted ${results.length} result(s) to Slack.`,
      items: results.length,
    };
  },
};

const outgoingWebhook: ProviderHandler = {
  async test(ctx) {
    const endpoint = ctx.secrets["endpoint_url"];
    if (!endpoint) return { ok: false, message: "Missing endpoint URL." };
    const body = JSON.stringify({ event: "ping", sent_at: new Date().toISOString() });
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (ctx.secrets["signing_secret"]) {
      headers["x-ecluid-signature"] = await hmacHex(ctx.secrets["signing_secret"], body);
    }
    const res = await fetchWithRetry(endpoint, { method: "POST", headers, body });
    if (!res.ok)
      return { ok: false, message: `Endpoint responded ${res.status}: ${await res.text()}` };
    return { ok: true, message: "Endpoint accepted the ping." };
  },
  async sync(ctx) {
    const endpoint = ctx.secrets["endpoint_url"];
    if (!endpoint) return { ok: false, message: "Missing endpoint URL." };
    const results = await recentResults(ctx);
    if (results.length === 0) return { ok: true, message: "Nothing new to send.", items: 0 };
    const body = JSON.stringify({
      event: "match.completed.batch",
      sent_at: new Date().toISOString(),
      matches: results,
    });
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (ctx.secrets["signing_secret"]) {
      headers["x-ecluid-signature"] = await hmacHex(ctx.secrets["signing_secret"], body);
    }
    const res = await fetchWithRetry(endpoint, { method: "POST", headers, body });
    if (!res.ok)
      return { ok: false, message: `Endpoint responded ${res.status}: ${await res.text()}` };
    return { ok: true, message: `Sent ${results.length} result(s).`, items: results.length };
  },
  async verifyInbound({ body, headers, secrets }) {
    const secret = secrets["inbound_secret"];
    if (!secret) return false;
    const provided = headers.get("x-ecluid-signature") ?? "";
    const expected = await hmacHex(secret, body);
    if (provided.length !== expected.length) return false;
    const { timingSafeEqual } = await import("crypto");
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  },
};

export const PROVIDER_HANDLERS: Record<string, ProviderHandler> = {
  slack,
  webhook: outgoingWebhook,
};
