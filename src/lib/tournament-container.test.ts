import { test } from "node:test";
import { deepStrictEqual, strictEqual } from "node:assert";
import { tournamentContainerValues } from "./tournament-container";
import { competitionEvents, isEventDirectory } from "./event-details";

test("creating a tournament leaves competition setup to its events", () => {
  const parent = tournamentContainerValues({ name: "National Games", slug: "national-games" });
  strictEqual(parent.team_count, 0);
  strictEqual(parent.event_type, null);
  deepStrictEqual(parent.teams, []);
  strictEqual(isEventDirectory({ parent_tournament_id: null, config: parent.config ?? {} }, 0), true);
});

test("a parent supports multiple independently formatted events", () => {
  const rows = [
    { id: "parent", parent_tournament_id: null, event_type: null, config: { event_container: true }, format: "league" },
    { id: "men", parent_tournament_id: "parent", event_type: "5x5_men", config: {}, format: "league" },
    { id: "women", parent_tournament_id: "parent", event_type: "3x3_women", config: {}, format: "group_knockout" },
  ];
  deepStrictEqual(competitionEvents(rows).map(event => [event.id, event.format]), [["men", "league"], ["women", "group_knockout"]]);
});