import type { Tournament } from "./queries";
import { eventLabel, type BasketballEvent } from "./tournament-events";
import { readGroupCapacities } from "./tournament-payload";

/** Copy setup only: all participants and competition history get fresh identities. */
export function eventCloneDefaults(source: Tournament, parent: Tournament, category: BasketballEvent) {
  const sourceConfig = source.config && typeof source.config === "object" && !Array.isArray(source.config) ? source.config : {};
  const config = Object.fromEntries(
    ["group_capacities", "fixture_settings", "finals_best_of"].flatMap((key) => sourceConfig[key] === undefined ? [] : [[key, structuredClone(sourceConfig[key])]]),
  );
  const capacities = readGroupCapacities(source.config);
  const groups = source.format === "group_knockout"
    ? Array.from({ length: source.group_count }, (_, index) => String.fromCharCode(65 + index))
    : [];
  const slots = groups.flatMap((group, index) => Array.from({
    length: capacities?.[group] ?? Math.floor(source.team_count / groups.length) + (index < source.team_count % groups.length ? 1 : 0),
  }, () => group));
  return {
    name: `${parent.name} — ${eventLabel(category)}`,
    slug: "",
    event_type: category,
    format: source.format,
    team_count: source.team_count,
    group_count: source.group_count,
    qualifiers_per_group: source.qualifiers_per_group,
    legs: source.legs,
    playoff_format: source.playoff_format,
    start_date: source.start_date,
    end_date: source.end_date,
    venue: source.venue,
    venue_map_url: source.venue_map_url,
    logo_url: source.logo_url,
    is_public: source.is_public,
    status: "draft",
    config,
    group_capacities: capacities,
    teams: Array.from({ length: source.team_count }, (_, index) => ({
      name: `Team ${index + 1}`, logo_url: null, group_label: slots[index] ?? null,
    })),
  };
}