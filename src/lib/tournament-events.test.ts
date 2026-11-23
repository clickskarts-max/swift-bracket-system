import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { availableEventTypes, BASKETBALL_EVENTS, isBasketballEvent, tournamentFamily } from "./tournament-events";

describe("basketball tournament events", () => {
  test("National Games supports the four requested events", () => {
    assert.deepEqual(BASKETBALL_EVENTS.map((event) => event.value), ["5x5_men", "5x5_women", "3x3_men", "3x3_women"]);
    assert.equal(isBasketballEvent("3x3_men"), true);
    assert.equal(isBasketballEvent("football"), false);
  });
  test("event switcher includes only the selected parent and its events", () => {
    const rows = [
      { id: "parent", parent_tournament_id: null, event_type: "5x5_men" },
      { id: "women", parent_tournament_id: "parent", event_type: "5x5_women" },
      { id: "other", parent_tournament_id: null, event_type: "3x3_men" },
      { id: "unrelated", parent_tournament_id: "other", event_type: "3x3_women" },
    ];
    assert.deepEqual(tournamentFamily(rows, "parent").map((row) => row.id), ["parent", "women"]);
    assert.equal(rows[1]?.parent_tournament_id, "parent");
  });
  test("used categories cannot be offered a second time", () => {
    assert.deepEqual(availableEventTypes([
      { id: "root", parent_tournament_id: null, event_type: "5x5_men" },
      { id: "child", parent_tournament_id: "root", event_type: "3x3_women" },
    ]).map((row) => row.value), ["5x5_women", "3x3_men"]);
  });
  test("existing unlabelled tournaments are preserved as the main event", () => {
    const original = { id: "legacy", parent_tournament_id: null, event_type: null, matches: ["M1", "M11"] };
    assert.equal(tournamentFamily([original], "legacy")[0], original);
    assert.equal(availableEventTypes([original]).length, 4);
    assert.deepEqual(original.matches, ["M1", "M11"]);
  });
});