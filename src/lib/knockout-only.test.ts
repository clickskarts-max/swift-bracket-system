import { test } from "node:test";
import { ok, strictEqual } from "node:assert";
import { scheduleFixtureDates } from "./fixture-timing";

test("knockout-only plan with 0 league days gives each team one game per day", () => {
  const d = (no: number, a: string | null, b: string | null, pa?: string, pb?: string) =>
    ({ match_no: no, stage: "knockout", round_name: "R", round_index: no > 2 ? 1 : 0, leg: 1, group_label: null, team_a_id: a, team_b_id: b, placeholder_a: pa ?? null, placeholder_b: pb ?? null }) as any;
  const drafts = [d(1, "a", "b"), d(2, "c", "d"), d(3, null, null, "Winner M1", "Winner M2")];
  const out = scheduleFixtureDates(drafts, [], { startDate: "2026-11-24", startTime: "09:00", leagueMatchesPerDay: 0, knockoutMatchesPerDay: 2, minimumRestHours: 0, matchDurationMinutes: 90, phaseDays: { league: 0, knockout: 2 } });
  strictEqual(out.length, 3);
  const day = (n: number) => new Date(out.find((m) => m.match_no === n)!.scheduled_at).getDate();
  strictEqual(day(1), day(2));
  ok(day(3) > day(1));
});
