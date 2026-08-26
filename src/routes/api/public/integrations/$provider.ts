import { createFileRoute } from "@tanstack/react-router";

/**
 * Inbound webhook receiver for integrations.
 *
 * POST /api/public/integrations/<provider>?integration_id=<uuid>
 * Signature is verified by the provider handler before anything is stored,
 * and events are de-duplicated on (integration_id, event_id).
 */
export const Route = createFileRoute("/api/public/integrations/$provider")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const url = new URL(request.url);
        const integrationId = url.searchParams.get("integration_id");
        if (!integrationId) return new Response("Missing integration_id", { status: 400 });

        const body = await request.text();
        if (body.length > 512_000) return new Response("Payload too large", { status: 413 });

        const { PROVIDER_HANDLERS } = await import("@/lib/integrations/providers.server");
        const handler = PROVIDER_HANDLERS[params.provider];
        if (!handler?.verifyInbound) return new Response("Not found", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: integration } = await (supabaseAdmin as any)
          .from("integrations")
          .select("id, provider, enabled")
          .eq("id", integrationId)
          .eq("provider", params.provider)
          .maybeSingle();
        if (!integration) return new Response("Not found", { status: 404 });
        if (!integration.enabled) return new Response("Integration disabled", { status: 409 });

        const { data: cred } = await (supabaseAdmin as any)
          .from("integration_credentials")
          .select("secrets")
          .eq("integration_id", integrationId)
          .maybeSingle();

        const ok = await handler.verifyInbound({
          body,
          headers: request.headers,
          secrets: (cred?.secrets ?? {}) as Record<string, string>,
        });
        if (!ok) return new Response("Invalid signature", { status: 401 });

        let payload: Record<string, unknown>;
        try {
          payload = JSON.parse(body) as Record<string, unknown>;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const eventId =
          request.headers.get("x-ecluid-event-id") ??
          (typeof payload["id"] === "string" ? (payload["id"] as string) : null);
        if (!eventId) return new Response("Missing event id", { status: 400 });

        const { error } = await (supabaseAdmin as any).from("integration_events").insert({
          integration_id: integrationId,
          provider: params.provider,
          event_id: eventId,
          event_type: typeof payload["event"] === "string" ? payload["event"] : null,
          payload,
          processed_at: new Date().toISOString(),
        });

        // Duplicate delivery: acknowledge without re-processing.
        if (error && !error.message.includes("duplicate key")) {
          console.error("integration webhook insert failed", error.message);
          return new Response("Storage error", { status: 500 });
        }

        return new Response(JSON.stringify({ ok: true, duplicate: !!error }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
