import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  disconnectIntegrationFn,
  listIntegrationRunsFn,
  listIntegrationsFn,
  runIntegrationActionFn,
  saveIntegrationFn,
  setIntegrationEnabledFn,
} from "@/lib/integrations.functions";
import type { IntegrationRow, IntegrationRun } from "./registry";

const KEY = ["integrations"];

export function useIntegrations() {
  const fn = useServerFn(listIntegrationsFn);
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await fn()) as unknown as IntegrationRow[],
    staleTime: 15_000,
  });
}

export function useIntegrationRuns(integrationId: string | null) {
  const fn = useServerFn(listIntegrationRunsFn);
  return useQuery({
    queryKey: [...KEY, "runs", integrationId],
    queryFn: async () =>
      (await fn({ data: { integrationId: integrationId! } })) as unknown as IntegrationRun[],
    enabled: !!integrationId,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

export function useSaveIntegration() {
  const fn = useServerFn(saveIntegrationFn);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: {
      provider: string;
      displayName?: string | null;
      config?: Record<string, unknown>;
      secrets?: Record<string, string>;
    }) => fn({ data: input }),
    onSuccess: invalidate,
  });
}

export function useSetIntegrationEnabled() {
  const fn = useServerFn(setIntegrationEnabledFn);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: { integrationId: string; enabled: boolean }) => fn({ data: input }),
    onSuccess: invalidate,
  });
}

export function useRunIntegrationAction() {
  const fn = useServerFn(runIntegrationActionFn);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: { integrationId: string; kind: "test" | "sync" }) => fn({ data: input }),
    onSuccess: invalidate,
  });
}

export function useDisconnectIntegration() {
  const fn = useServerFn(disconnectIntegrationFn);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (integrationId: string) => fn({ data: { integrationId } }),
    onSuccess: invalidate,
  });
}
