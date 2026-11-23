import { test } from "node:test";
import { deepStrictEqual, strictEqual } from "node:assert";
import type { Tournament } from "./queries";
import { eventCloneDefaults } from "./event-clone";

const source: Tournament = {
  id: "source", owner_id: "owner", name: "Games", slug: "games",
  parent_tournament_id: null, event_type: "5x5_men", format: "group_knockout",
  team_count: 10, group_count: 4, qualifiers_per_group: 2, legs: 2,
  playoff_format: "top4_semis", start_date: "2026-11-23", end_date: "2026-11-28",
  venue: "Court", venue_map_url: null, logo_url: null, banner_url: null,
  description: null, is_public: true, archived: false, status: "completed",
  config: { group_capacities: { A: 3, B: 3, C: 2, D: 2 }, fixture_settings: { leaguePerDay: 5 }, finals_best_of: 3, champion_team_id: "old-team", unrelated_ids: ["old-match"] },
  created_at: "2026-11-01", updated_at: "2026-11-01",
};

test("event clone keeps the same team count and match format", () => {
  const clone = eventCloneDefaults(source, source, "5x5_women");
  strictEqual(clone.team_count, 10);
  strictEqual(clone.teams.length, 10);
  strictEqual(clone.format, "group_knockout");
  strictEqual(clone.legs, 2);
  strictEqual(clone.group_count, 4);
  strictEqual(clone.qualifiers_per_group, 2);
  strictEqual(clone.playoff_format, "top4_semis");
  deepStrictEqual(clone.teams.map((team) => team.group_label), ["A", "A", "A", "B", "B", "B", "C", "C", "D", "D"]);
});

test("clone starts a separate draft without identities or competition results", () => {
  const clone = eventCloneDefaults(source, source, "3x3_women");
  strictEqual(clone.status, "draft");
  strictEqual(clone.event_type, "3x3_women");
  strictEqual(clone.slug, "");
  strictEqual("id" in clone, false);
  strictEqual("matches" in clone, false);
  strictEqual("champion_team_id" in clone.config, false);
  strictEqual("unrelated_ids" in clone.config, false);
  deepStrictEqual(clone.teams[0], { name: "Team 1", logo_url: null, group_label: "A" });
  strictEqual(source.status, "completed");
  deepStrictEqual(source.config, { group_capacities: { A: 3, B: 3, C: 2, D: 2 }, fixture_settings: { leaguePerDay: 5 }, finals_best_of: 3, champion_team_id: "old-team", unrelated_ids: ["old-match"] });
});

test("clone retains independent schedule settings and final series length", () => {
  const clone = eventCloneDefaults(source, source, "5x5_women");
  deepStrictEqual(clone.config, { group_capacities: { A: 3, B: 3, C: 2, D: 2 }, fixture_settings: { leaguePerDay: 5 }, finals_best_of: 3 });
  strictEqual(clone.start_date, "2026-11-23");
  strictEqual(clone.end_date, "2026-11-28");
  strictEqual(clone.venue, "Court");
  strictEqual(clone.config["fixture_settings"] === (source.config as Record<string, unknown>)["fixture_settings"], false);
});

test("league clones have fresh teams without pool assignments", () => {
  const clone = eventCloneDefaults({ ...source, format: "league", group_count: 0, config: {} }, source, "3x3_men");
  strictEqual(clone.format, "league");
  strictEqual(clone.teams.length, 10);
  deepStrictEqual(clone.teams.map((team) => team.group_label), Array(10).fill(null));
});