import { test } from "node:test";
import { strictEqual, deepStrictEqual, throws } from "node:assert";
import { generateSchedule } from "./formats";
import { planFixtureDateUpdates } from "./fixture-date-updates";

const teams = Array.from({ length: 10 }, (_, i) => ({ id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`, name: `Team ${i + 1}`, group_label: i < 5 ? "A" : "B" }));
const matches = generateSchedule({ format: "group_knockout", legs: 1, qualifiersPerGroup: 2, playoffFormat: "none", teams }).map((m) => ({ ...m, id: `match-${m.match_no}`, status: "scheduled" }));
const timing = { startDate: "2026-12-01", startTime: "09:00", leagueMatchesPerDay: 5, knockoutMatchesPerDay: 2, minimumRestHours: 2, matchDurationMinutes: 90, phaseDays: { league: 4, knockout: 2 } };

test("date-only updates preserve all 23 fixture identities and assign five league games per day over four days", () => {
  const updates = planFixtureDateUpdates(matches, teams, timing);
  deepStrictEqual(updates.map((m) => m.id).sort(), matches.map((m) => m.id).sort());
  const counts = new Map<string, number>();
  for (const update of updates) {
    deepStrictEqual(Object.keys(update).sort(), ["id", "scheduled_at"]);
    if (matches.find((m) => m.id === update.id)?.stage !== "group") continue;
    const date = new Date(update.scheduled_at).toDateString();
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }
  strictEqual(counts.size, 4);
  deepStrictEqual([...counts.values()], [5, 5, 5, 5]);
});

test("completed and forfeited fixtures prevent bulk redating of historical games", () => {
  for (const status of ["completed", "forfeit", "live"])
    throws(() => planFixtureDateUpdates(matches.map((m, i) => i === 0 ? { ...m, status } : m), teams, timing), /before games have started/);
});

test("cancelled historical fixtures are never updated", () => {
  const first = matches[0];
  if (!first) throw new Error("Expected a fixture");
  const updates = planFixtureDateUpdates([...matches, { ...first, id: "cancelled", status: "cancelled" }], teams, timing);
  strictEqual(updates.some((m) => m.id === "cancelled"), false);
});