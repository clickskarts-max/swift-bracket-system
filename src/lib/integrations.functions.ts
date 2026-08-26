import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listIntegrationsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listIntegrations } = await import("@/lib/integrations/service.server");
    return listIntegrations(context.supabase as any, context.userId);
  });

export const listIntegrationRunsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { integrationId: string }) => input)
  .handler(async ({ data, context }) => {
    const { listRuns } = await import("@/lib/integrations/service.server");
    return listRuns(context.supabase as any, data.integrationId);
  });

export const saveIntegrationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      provider: string;
      displayName?: string | null;
      config?: Record<string, unknown>;
      secrets?: Record<string, string>;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { saveIntegration } = await import("@/lib/integrations/service.server");
    return saveIntegration(context.supabase as any, context.userId, data);
  });

export const setIntegrationEnabledFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { integrationId: string; enabled: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { setEnabled } = await import("@/lib/integrations/service.server");
    return setEnabled(context.supabase as any, data.integrationId, data.enabled);
  });

export const runIntegrationActionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { integrationId: string; kind: "test" | "sync" }) => input)
  .handler(async ({ data, context }) => {
    const { runIntegrationAction } = await import("@/lib/integrations/service.server");
    return runIntegrationAction(context.supabase as any, context.userId, data.integrationId, data.kind);
  });

export const disconnectIntegrationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { integrationId: string }) => input)
  .handler(async ({ data, context }) => {
    const { disconnectIntegration } = await import("@/lib/integrations/service.server");
    return disconnectIntegration(context.supabase as any, data.integrationId);
  });
