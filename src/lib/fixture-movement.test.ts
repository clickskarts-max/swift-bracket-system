import { test } from "node:test";
import { deepStrictEqual, strictEqual, throws } from "node:assert";
import { planFixtureMove, type MovableFixture } from "./fixture-movement";

const matches: MovableFixture[] = [
  { id: "a", match_no: 1, scheduled_at: "2026-12-01T09:00:00Z", status: "scheduled", team_a_id: "a1", team_b_id: "a2", placeholder_a: null, placeholder_b: null },
  { id: "b", match_no: 2, scheduled_at: "2026-12-01T10:30:00Z", status: "scheduled", team_a_id: "b1", team_b_id: "b2", placeholder_a: null, placeholder_b: null },
];
test("up/down swaps individual fixture slots across groups without renumbering games", () => {
  const updates = planFixtureMove(matches, "a", "down", 2, 90);
  deepStrictEqual(updates.map((m) => [m.id, m.scheduled_at]), [["a", "2026-12-01T10:30:00Z"], ["b", "2026-12-01T09:00:00Z"]]);
  strictEqual(matches[0]?.match_no, 1);
  deepStrictEqual(planFixtureMove(matches, "b", "up", 2, 90).map((m) => m.id), ["b", "a"]);
});
test("previous/next day changes only the selected game and keeps its time", () => {
  strictEqual(planFixtureMove(matches, "a", "next-day", 2, 90)[0]?.scheduled_at, "2026-12-02T09:00:00.000Z");
  strictEqual(planFixtureMove(matches, "a", "previous-day", 2, 90)[0]?.scheduled_at, "2026-11-30T09:00:00.000Z");
  strictEqual(planFixtureMove(matches, "a", "next-day", 2, 90).length, 1);
});
test("movement protects started games and minimum rest", () => {
  throws(() => planFixtureMove(matches.map((m) => ({ ...m, status: "completed" })), "a", "down", 2, 90), /Only scheduled/);
  const repeated = matches.map((m) => ({ ...m, team_a_id: "same-team" }));
  throws(() => planFixtureMove(repeated, "a", "down", 2, 90), /minimum rest/);
});
test("moving down past the last game of a day joins the next matchday", () => {
  const base = { status: "scheduled", team_a_id: null, team_b_id: null };
  const ms: MovableFixture[] = [
    { ...base, id: "x", match_no: 1, scheduled_at: "2026-11-27T08:15:00.000Z", placeholder_a: "1st Group C", placeholder_b: "2nd Group D" },
    { ...base, id: "y", match_no: 2, scheduled_at: "2026-11-28T03:15:00.000Z", placeholder_a: "1st Group B", placeholder_b: "2nd Group A" },
  ];
  const u = planFixtureMove(ms, "x", "down", 2, 90);
  strictEqual(u.length, 1);
  strictEqual(u[0]?.scheduled_at, "2026-11-28T04:45:00.000Z");
});
