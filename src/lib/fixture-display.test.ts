import { test } from "node:test";
import { deepStrictEqual, strictEqual } from "node:assert";
import { fixtureDisplayNumbers } from "./fixture-display";

const fixtures = [
  { id: "a1", match_no: 1, scheduled_at: "2026-12-01T09:00:00Z", status: "completed" },
  { id: "a2", match_no: 2, scheduled_at: "2026-12-01T12:00:00Z", status: "scheduled" },
  { id: "b1", match_no: 11, scheduled_at: "2026-12-01T10:30:00Z", status: "scheduled" },
  { id: "b2", match_no: 12, scheduled_at: "2026-12-02T09:00:00Z", status: "scheduled" },
];

test("M11 in the second playing slot displays as M2, with subsequent games numbered in order", () => {
  deepStrictEqual([...fixtureDisplayNumbers(fixtures)], [["a1", 1], ["b1", 2], ["a2", 3], ["b2", 4]]);
  strictEqual(fixtures[2]?.match_no, 11);
});

test("moving a fixture changes its displayed number without rewriting its reference number", () => {
  const moved = fixtures.map(match => match.id === "b1" ? { ...match, scheduled_at: "2026-12-02T10:30:00Z" } : match);
  strictEqual(fixtureDisplayNumbers(moved).get("b1"), 4);
  strictEqual(moved[2]?.match_no, 11);
});

test("cancelled games are omitted and undated games follow dated fixtures", () => {
  const numbers = fixtureDisplayNumbers([...fixtures,
    { id: "cancelled", match_no: 3, scheduled_at: "2026-12-01T08:00:00Z", status: "cancelled" },
    { id: "undated", match_no: 4, scheduled_at: null, status: "scheduled" },
  ]);
  strictEqual(numbers.has("cancelled"), false);
  strictEqual(numbers.get("undated"), 5);
});