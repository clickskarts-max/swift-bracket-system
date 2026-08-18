import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const TEAM_COLS = "id, tournament_id, name, short_name, logo_url, jersey_color, group_label, seed";
const SPONSOR_COLS = "id, tournament_id, name, logo_url, tier, placement";

/** Anonymous, session-less client so public pages only ever read anon-visible columns. */
const anonClient = () =>
  createClient<Database>(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

export const getPublicTournamentData = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().trim().min(1).max(200) }).parse(data))
  .handler(async ({ data }) => {
    const supabase = anonClient();
    const { data: tournament } = await supabase
      .from("tournaments")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();

    if (!tournament) return { tournament: null, teams: [], matches: [], sponsors: [] };

    const [teams, matches, sponsors] = await Promise.all([
      supabase.from("teams").select(TEAM_COLS).eq("tournament_id", tournament.id).order("name"),
      supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournament.id)
        .order("round_index")
        .order("match_no"),
      supabase.from("sponsors").select(SPONSOR_COLS).eq("tournament_id", tournament.id).order("name"),
    ]);

    return {
      tournament,
      teams: teams.data ?? [],
      matches: matches.data ?? [],
      sponsors: sponsors.data ?? [],
    };
  });
