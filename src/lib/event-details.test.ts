import { test } from "node:test";
import { strictEqual, deepStrictEqual } from "node:assert";
import { eventAgeGroup, competitionEvents, isEventDirectory } from "./event-details";

test("Under 25 and Under 19 are optional, distinct age divisions", () => {
  strictEqual(eventAgeGroup({ age_group: "u25" }), "u25");
  strictEqual(eventAgeGroup({ age_group: "u19" }), "u19");
  strictEqual(eventAgeGroup({}), null);
  strictEqual(eventAgeGroup({ age_group: null }), null);
});
test("parent container is not an event and child competitions remain separate", () => {
  const rows = [
    { id: "parent", parent_tournament_id: null, event_type: null, config: { event_container: true } },
    { id: "u25", parent_tournament_id: "parent", event_type: "5x5_men", config: { age_group: "u25" } },
    { id: "u19", parent_tournament_id: "parent", event_type: "5x5_men", config: { age_group: "u19" } },
  ];
  deepStrictEqual(competitionEvents(rows).map(row => row.id), ["u25", "u19"]);
  strictEqual(isEventDirectory(rows[0] ?? { parent_tournament_id: null, config: {} }, 2), true);
});
test("single tournaments keep their public fixtures rather than becoming a directory", () => {
  strictEqual(isEventDirectory({ parent_tournament_id: null, config: {} }, 0), false);
  strictEqual(isEventDirectory({ parent_tournament_id: "parent", config: {} }, 0), false);
  strictEqual(isEventDirectory({ parent_tournament_id: null, config: { event_container: true } }, 0), true);
});