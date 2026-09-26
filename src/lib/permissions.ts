/**
 * Access control — client side (UX only).
 *
 * The real security boundary is the database: every table is protected by
 * row-level rules that call `has_tournament_permission(tournament, permission)`
 * and every access-management action is a server function that re-checks the
 * caller. This module only mirrors those rules so the UI can hide actions.
 *
 * Resolution order (same as the database):
 *   1. Tournament owner (creator = workspace owner)  -> full access
 *   2. Workspace role in the tournament's workspace   -> role permissions
 *   3. Tournament role for that one tournament        -> role permissions
 * (2) and (3) are combined; neither ever reaches another workspace or tournament.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Permission =
  | "tournament.view"
  | "tournament.edit"
  | "tournament.delete"
  | "teams.view"
  | "teams.create"
  | "teams.edit"
  | "teams.delete"
  | "players.view"
  | "players.create"
  | "players.edit"
  | "players.delete"
  | "games.view"
  | "games.create"
  | "games.edit"
  | "games.delete"
  | "games.score"
  | "games.finalize"
  | "statistics.view"
  | "statistics.edit"
  | "standings.view"
  | "users.view"
  | "users.invite"
  | "users.remove"
  | "users.manage_roles";

export const TOURNAMENT_ROLES = [
  { value: "tournament_admin", label: "Tournament Admin", hint: "Everything in this tournament, including access" },
  { value: "tournament_editor", label: "Editor", hint: "Teams, players, schedule and games — no access control" },
  { value: "scorekeeper", label: "Scorekeeper", hint: "Enter scores, forfeits, fouls and player stats" },
  { value: "statistician", label: "Statistician", hint: "Enter and edit player statistics" },
  { value: "tournament_viewer", label: "Viewer", hint: "Read-only" },
] as const;

export const ACCOUNT_ROLES = [
  { value: "account_owner", label: "Owner", hint: "Full control of the workspace" },
  { value: "account_admin", label: "Admin", hint: "Manage people and every tournament in the workspace" },
  { value: "account_member", label: "Member", hint: "Access only to tournaments they are added to" },
  { value: "account_viewer", label: "Viewer", hint: "Read-only view of every tournament in the workspace" },
] as const;

export const roleLabel = (role: string | null | undefined) =>
  [...TOURNAMENT_ROLES, ...ACCOUNT_ROLES].find((r) => r.value === role)?.label ?? role ?? "—";

/** Mirror of the `role_permissions` table (source of truth lives in the database). */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  tournament_admin: [
    "tournament.view", "tournament.edit", "tournament.delete",
    "teams.view", "teams.create", "teams.edit", "teams.delete",
    "players.view", "players.create", "players.edit", "players.delete",
    "games.view", "games.create", "games.edit", "games.delete", "games.score", "games.finalize",
    "statistics.view", "statistics.edit", "standings.view",
    "users.view", "users.invite", "users.remove", "users.manage_roles",
  ],
  tournament_editor: [
    "tournament.view", "tournament.edit",
    "teams.view", "teams.create", "teams.edit", "teams.delete",
    "players.view", "players.create", "players.edit", "players.delete",
    "games.view", "games.create", "games.edit", "games.delete",
    "statistics.view", "standings.view",
  ],
  scorekeeper: [
    "tournament.view", "teams.view", "players.view", "games.view",
    "games.score", "games.finalize", "statistics.view", "statistics.edit", "standings.view",
  ],
  statistician: [
    "tournament.view", "teams.view", "players.view", "games.view",
    "statistics.view", "statistics.edit", "standings.view",
  ],
  tournament_viewer: [
    "tournament.view", "teams.view", "players.view", "games.view", "statistics.view", "standings.view",
  ],
};

export const hasPermission = (perms: readonly string[] | undefined, p: Permission) =>
  !!perms?.includes(p);

/** Rows of the access matrix shown to admins. */
export const ACCESS_MATRIX: { label: string; perm: Permission }[] = [
  { label: "View tournament", perm: "tournament.view" },
  { label: "Edit tournament", perm: "tournament.edit" },
  { label: "Manage users", perm: "users.manage_roles" },
  { label: "Manage teams", perm: "teams.edit" },
  { label: "Manage games", perm: "games.edit" },
  { label: "Score games / forfeits", perm: "games.score" },
  { label: "Edit statistics", perm: "statistics.edit" },
  { label: "View standings", perm: "standings.view" },
  { label: "Delete tournament", perm: "tournament.delete" },
];

/** Tabs a role can see inside a tournament. */
export function visibleTournamentTabs(perms: readonly string[]) {
  const can = (p: Permission) => perms.includes(p);
  return {
    schedule: can("games.view"),
    standings: can("standings.view"),
    bracket: can("games.view"),
    teams: can("teams.view"),
    players: can("players.view"),
    sponsors: can("tournament.edit"),
    access: can("users.view"),
    settings: can("tournament.edit"),
  };
}

export const useTournamentPermissions = (tournamentId: string) =>
  useQuery({
    queryKey: ["tournament-permissions", tournamentId],
    enabled: !!tournamentId,
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_tournament_permissions", {
        _tournament_id: tournamentId,
      });
      if (error) throw new Error(error.message);
      return (data ?? []) as string[];
    },
  });

export type MyAccount = { account_id: string; role: string; name: string | null };

export const useMyAccounts = () =>
  useQuery({
    queryKey: ["my-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_my_accounts");
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as MyAccount[];
    },
  });

/** Invalidate every permission-derived cache after an access change. */
export function useInvalidateAccess() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["tournament-permissions"] });
    qc.invalidateQueries({ queryKey: ["tournament-access"] });
    qc.invalidateQueries({ queryKey: ["account-access"] });
    qc.invalidateQueries({ queryKey: ["my-accounts"] });
    qc.invalidateQueries({ queryKey: ["tournaments"] });
  };
}

export const inviteLink = (token: string) =>
  `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${token}`;
