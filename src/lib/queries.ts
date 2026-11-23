import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { tournamentPayload } from "@/lib/tournament-payload";
import { tournamentFamily } from "@/lib/tournament-events";

export type Tournament = Tables<"tournaments">;
export type Team = Tables<"teams">;
export type Player = Tables<"players">;
export type Match = Tables<"matches">;
export type Sponsor = Tables<"sponsors">;
export type Organization = Tables<"organizations">;
export type Venue = Tables<"tournament_venues">;

const unwrap = <T>({ data, error }: { data: T; error: { message: string } | null }) => {
  if (error) throw new Error(error.message);
  return data;
};

/** Tournaments the signed-in user may access (owned, workspace role, or tournament role). */
export const useTournaments = () =>
  useQuery({
    queryKey: ["tournaments"],
    queryFn: async () =>
      (unwrap(await supabase.rpc("my_accessible_tournaments")) ?? []) as Tournament[],
  });

export const useTournament = (id: string) =>
  useQuery({
    queryKey: ["tournament", id],
    queryFn: async () =>
      unwrap(
        await supabase.from("tournaments").select("*").eq("id", id).maybeSingle(),
      ) as Tournament | null,
    enabled: !!id,
  });

export const useTournamentBySlug = (slug: string) =>
  useQuery({
    queryKey: ["tournament-slug", slug],
    queryFn: async () =>
      unwrap(
        await supabase.from("tournaments").select("*").eq("slug", slug).maybeSingle(),
      ) as Tournament | null,
    enabled: !!slug,
  });

export const useTournamentEvents = (tournament: Tournament | null | undefined, publicOnly = false) => {
  const parentId = tournament?.parent_tournament_id ?? tournament?.id ?? "";
  return useQuery({
    queryKey: ["tournament-events", parentId, publicOnly],
    enabled: !!parentId,
    queryFn: async () => {
      let query = supabase.from("tournaments").select("*")
        .or(`id.eq.${parentId},parent_tournament_id.eq.${parentId}`);
      if (publicOnly) query = query.eq("is_public", true).eq("archived", false);
      const rows = unwrap(await query) ?? [];
      return tournamentFamily(rows, parentId);
    },
  });
};

export const useTeams = (tournamentId: string) =>
  useQuery({
    queryKey: ["teams", tournamentId],
    queryFn: async () =>
      unwrap(
        await supabase
          .from("teams")
          .select("*")
          .eq("tournament_id", tournamentId)
          .order("group_label")
          .order("name"),
      ) as Team[],
    enabled: !!tournamentId,
  });

export const usePlayers = (tournamentId: string) =>
  useQuery({
    queryKey: ["players", tournamentId],
    queryFn: async () =>
      unwrap(
        await supabase.from("players").select("*").eq("tournament_id", tournamentId).order("name"),
      ) as Player[],
    enabled: !!tournamentId,
  });

export const useMatches = (tournamentId: string) =>
  useQuery({
    queryKey: ["matches", tournamentId],
    queryFn: async () =>
      unwrap(
        await supabase
          .from("matches")
          .select("*")
          .eq("tournament_id", tournamentId)
          .order("round_index")
          .order("match_no"),
      ) as Match[],
    enabled: !!tournamentId,
  });

export const useSponsors = (tournamentId: string) =>
  useQuery({
    queryKey: ["sponsors", tournamentId],
    queryFn: async () =>
      unwrap(
        await supabase.from("sponsors").select("*").eq("tournament_id", tournamentId).order("name"),
      ) as Sponsor[],
    enabled: !!tournamentId,
  });

export const useVenues = (tournamentId: string) =>
  useQuery({
    queryKey: ["venues", tournamentId],
    queryFn: async () =>
      unwrap(
        await supabase
          .from("tournament_venues")
          .select("*")
          .eq("tournament_id", tournamentId)
          .order("name"),
      ) as Venue[],
    enabled: !!tournamentId,
  });

export const useOrganization = () =>
  useQuery({
    queryKey: ["organization"],
    queryFn: async () =>
      unwrap(await supabase.from("organizations").select("*").maybeSingle()) as Organization | null,
  });

/* Public (anon) reads: only columns granted to the anon role. */
const PUBLIC_TEAM_COLS =
  "id,tournament_id,name,short_name,logo_url,jersey_color,group_label,seed,socials,created_at,updated_at";

export type PublicTeam = Pick<
  Team,
  | "id"
  | "tournament_id"
  | "name"
  | "short_name"
  | "logo_url"
  | "jersey_color"
  | "group_label"
  | "seed"
>;
export type PublicSponsor = Pick<
  Sponsor,
  "id" | "tournament_id" | "name" | "logo_url" | "tier" | "placement"
>;

export const usePublicTeams = (tournamentId: string) =>
  useQuery({
    queryKey: ["public-teams", tournamentId],
    queryFn: async () =>
      unwrap(
        await supabase
          .from("teams")
          .select(PUBLIC_TEAM_COLS)
          .eq("tournament_id", tournamentId)
          .order("group_label")
          .order("name"),
      ) as unknown as PublicTeam[],
    enabled: !!tournamentId,
  });

export const usePublicSponsors = (tournamentId: string) =>
  useQuery({
    queryKey: ["public-sponsors", tournamentId],
    queryFn: async () =>
      unwrap(
        await supabase.rpc("get_public_sponsors", { p_tournament_id: tournamentId }),
      ) as unknown as PublicSponsor[],
    enabled: !!tournamentId,
  });

export const useShowcaseTournament = () =>
  useQuery({
    queryKey: ["showcase-tournament"],
    queryFn: async () =>
      unwrap(
        await supabase
          .from("tournaments")
          .select("*")
          .eq("id", "b524ae7e-553a-4125-bf6e-c50c46b8c1ba")
          .maybeSingle(),
      ) as Tournament | null,
  });

type TableName =
  | "tournaments"
  | "teams"
  | "players"
  | "matches"
  | "sponsors"
  | "organizations"
  | "tournament_venues";

export function useUpsert(table: TableName, invalidate: unknown[][]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown> & { id?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const owner_id = userData.user?.id;
      if (!owner_id) throw new Error("You need to be signed in");
      const tableValues = table === "tournaments" ? tournamentPayload(values) : values;
      const payload = { ...tableValues, owner_id } as never;
      const query = values.id
        ? supabase.from(table).update(payload).eq("id", values.id).select().maybeSingle()
        : supabase.from(table).insert(payload).select().maybeSingle();
      return unwrap(await query);
    },
    onSuccess: () => invalidate.forEach((key) => qc.invalidateQueries({ queryKey: key })),
  });
}

export function useRemove(table: TableName, invalidate: unknown[][]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => invalidate.forEach((key) => qc.invalidateQueries({ queryKey: key })),
  });
}

const PUBLIC_PLAYER_COLS = "id,tournament_id,team_id,name,photo_url,jersey_number,position,stats";

export type PublicPlayer = Pick<
  Player,
  "id" | "tournament_id" | "team_id" | "name" | "photo_url" | "jersey_number" | "position"
>;

export const usePublicPlayers = (tournamentId: string) =>
  useQuery({
    queryKey: ["public-players", tournamentId],
    queryFn: async () =>
      unwrap(
        await supabase
          .from("players")
          .select(PUBLIC_PLAYER_COLS)
          .eq("tournament_id", tournamentId)
          .order("name"),
      ) as unknown as PublicPlayer[],
    enabled: !!tournamentId,
  });
