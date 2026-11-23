import type { TournamentValues } from "@/components/tournament-form";
import { eventConfig } from "./event-details";

export function tournamentContainerValues(details: Partial<TournamentValues>): TournamentValues {
  return {
    name: details.name ?? "",
    slug: details.slug ?? "",
    start_date: details.start_date ?? null,
    end_date: details.end_date ?? null,
    venue: details.venue ?? null,
    venue_map_url: details.venue_map_url ?? null,
    status: details.status ?? "draft",
    logo_url: details.logo_url ?? null,
    banner_url: details.banner_url ?? null,
    description: details.description ?? null,
    is_public: details.is_public ?? true,
    config: { ...eventConfig(details.config), event_container: true },
    event_type: null,
    // Required legacy columns are neutral storage defaults, not parent competition settings.
    format: "league",
    legs: 1,
    playoff_format: "none",
    group_count: 0,
    qualifiers_per_group: 2,
    team_count: 0,
    teams: [],
    venues: [],
  };
}