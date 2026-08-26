import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type OwnerUser = {
  id: string;
  email: string;
  role: string;
  status: string;
  activated_until: string | null;
  created_at: string;
  tournament_count: number;
};

export type ActivationKey = Tables<"activation_keys">;
export type AuditEntry = Tables<"audit_log">;

export type OwnerOverview = {
  users: {
    total: number;
    active: number;
    expiring_soon: number;
    expired: number;
    suspended: number;
  };
  tournaments: {
    total: number;
    active: number;
    draft: number;
    completed: number;
    archived: number;
    public: number;
  };
  sponsors: { total: number; missing_logo: number };
  advertising: { campaigns: number; active: number; ending_soon: number };
  ad_analytics: { impressions: number; clicks: number };
  health: {
    campaigns_without_creative: number;
    tournaments_without_matches: number;
    matches_missing_teams: number;
    completed_without_score: number;
    expired_owners_with_active_tournaments: number;
  };
};

const unwrap = <T>({ data, error }: { data: T; error: { message: string } | null }) => {
  if (error) throw new Error(error.message);
  return data;
};

export const useOwnerOverview = () =>
  useQuery({
    queryKey: ["owner", "overview"],
    queryFn: async () => unwrap(await supabase.rpc("owner_overview")) as unknown as OwnerOverview,
    staleTime: 30_000,
  });

export const useOwnerUsers = () =>
  useQuery({
    queryKey: ["owner", "users"],
    queryFn: async () => (unwrap(await supabase.rpc("owner_list_users")) ?? []) as OwnerUser[],
  });

export const useActivationKeys = () =>
  useQuery({
    queryKey: ["owner", "keys"],
    queryFn: async () =>
      (unwrap(
        await supabase
          .from("activation_keys")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
      ) ?? []) as ActivationKey[],
  });

export const useAuditLog = (limit = 100) =>
  useQuery({
    queryKey: ["owner", "audit", limit],
    queryFn: async () =>
      (unwrap(
        await supabase
          .from("audit_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit),
      ) ?? []) as AuditEntry[],
  });

function useOwnerMutation<TVars>(fn: (vars: TVars) => Promise<unknown>, keys: string[][]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => keys.forEach((key) => qc.invalidateQueries({ queryKey: key })),
  });
}

export const useCreateKey = () =>
  useOwnerMutation<{
    plan: string;
    days?: number | null;
    maxRedemptions?: number;
    assignedEmail?: string | null;
    note?: string | null;
    expiresAt?: string | null;
  }>(
    async (vars) =>
      unwrap(
        await supabase.rpc("owner_create_key", {
          input_plan: vars.plan,
          input_max_redemptions: vars.maxRedemptions ?? 1,
          ...(vars.days != null ? { input_days: vars.days } : {}),
          ...(vars.assignedEmail ? { input_assigned_email: vars.assignedEmail } : {}),
          ...(vars.note ? { input_note: vars.note } : {}),
          ...(vars.expiresAt ? { input_expires_at: vars.expiresAt } : {}),
        }),
      ) as string,

    [
      ["owner", "keys"],
      ["owner", "audit"],
    ],
  );

export const useRevokeKey = () =>
  useOwnerMutation<string>(
    async (id) => unwrap(await supabase.rpc("owner_revoke_activation_key", { input_id: id })),
    [
      ["owner", "keys"],
      ["owner", "audit"],
    ],
  );

export const useDeleteKey = () =>
  useOwnerMutation<string>(
    async (id) => unwrap(await supabase.rpc("owner_delete_key", { input_id: id })),
    [
      ["owner", "keys"],
      ["owner", "audit"],
    ],
  );

export const useSetUserStatus = () =>
  useOwnerMutation<{ email: string; status: "active" | "suspended" }>(
    async ({ email, status }) =>
      unwrap(
        await supabase.rpc("owner_set_user_status", { input_email: email, input_status: status }),
      ),
    [
      ["owner", "users"],
      ["owner", "overview"],
      ["owner", "audit"],
    ],
  );

export const useSetUserAccess = () =>
  useOwnerMutation<{ email: string; until?: string | null; unlimited?: boolean }>(
    async ({ email, until, unlimited }) =>
      unwrap(
        await supabase.rpc("owner_set_user_access", {
          input_email: email,
          input_unlimited: unlimited ?? false,
          ...(until ? { input_until: until } : {}),
        }),
      ),
    [
      ["owner", "users"],
      ["owner", "overview"],
      ["owner", "audit"],
    ],
  );

export const KEY_PLANS = [
  { value: "1_day", label: "1 day" },
  { value: "7_days", label: "7 days" },
  { value: "1_month", label: "30 days" },
  { value: "90_days", label: "90 days" },
  { value: "1_year", label: "1 year" },
  { value: "lifetime", label: "Lifetime" },
  { value: "custom", label: "Custom (days)" },
] as const;

export function accessLabel(until: string | null) {
  if (!until) return "Not activated";
  const time = new Date(until).getTime();
  if (!Number.isFinite(time)) return "Unlimited";
  if (time > Date.now() + 1000 * 60 * 60 * 24 * 365 * 50) return "Unlimited";
  return `${time > Date.now() ? "Until" : "Expired"} ${new Date(until).toLocaleDateString()}`;
}
