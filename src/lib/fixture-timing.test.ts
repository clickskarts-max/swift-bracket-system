import { test } from "node:test";
import { strictEqual, ok, throws } from "node:assert";
import { generateSchedule, type TeamRef } from "./formats";
import { scheduleFixtureDates, type FixtureTiming } from "./fixture-timing";

const teams: TeamRef[] = Array.from({ length: 4 }, (_, i) => ({ id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`, name: `Team ${i + 1}` }));
const options: FixtureTiming = { startDate: "2026-12-01", startTime: "09:00", leagueMatchesPerDay: 2, knockoutMatchesPerDay: 1, minimumRestHours: 24, matchDurationMinutes: 90 };
const drafts = () => generateSchedule({ format: "league", legs: 2, playoffFormat: "top4_ipl", teams });

test("league daily limit is 2 and knockout daily limit is 1", () => {
  const counts = new Map<string, number>();
  const fixtures = scheduleFixtureDates(drafts(), teams, options);
  strictEqual(fixtures.length, 16);
  for (const m of fixtures) {
    const league = m.stage === "league";
    const key = `${new Date(m.scheduled_at).toDateString()}-${league}`;
    const count = (counts.get(key) ?? 0) + 1;
    counts.set(key, count);
    ok(count <= (league ? 2 : 1));
  }
});

test("teams receive at least 24 hours rest after the 90-minute game ends", () => {
  const ends = new Map<string, number>();
  for (const m of scheduleFixtureDates(drafts(), teams, options).filter((m) => m.stage === "league")) {
    const start = Date.parse(m.scheduled_at);
    for (const id of [m.team_a_id, m.team_b_id]) {
      if (!id) continue;
      const end = ends.get(id);
      if (end !== undefined) ok(start - end >= 24 * 3_600_000);
      ends.set(id, start + 90 * 60_000);
    }
  }
});

test("knockout games allow rest after prerequisites and the league phase", () => {
  const fixtures = scheduleFixtureDates(drafts(), teams, options);
  const leagueEnd = Math.max(...fixtures.filter((m) => m.stage === "league").map((m) => Date.parse(m.scheduled_at) + 90 * 60_000));
  for (const m of fixtures.filter((m) => m.stage !== "league")) {
    ok(Date.parse(m.scheduled_at) >= leagueEnd + 24 * 3_600_000);
    for (const placeholder of [m.placeholder_a, m.placeholder_b]) {
      const no = /M(\d+)/.exec(placeholder ?? "")?.[1];
      if (!no) continue;
      const parent = fixtures.find((f) => f.match_no === Number(no));
      ok(parent);
      ok(Date.parse(m.scheduled_at) >= Date.parse(parent.scheduled_at) + 90 * 60_000 + 24 * 3_600_000);
    }
  }
});

test("invalid daily limits fail before fixtures are changed", () => {
  throws(() => scheduleFixtureDates(drafts(), teams, { ...options, leagueMatchesPerDay: 0 }));
});

test("group knockout scheduling respects dependencies with uneven groups", () => {
  const grouped = teams.map((t, i) => ({ ...t, group_label: i < 2 ? "A" : "B" }));
  const generated = generateSchedule({ format: "group_knockout", legs: 1, qualifiersPerGroup: 2, playoffFormat: "none", teams: grouped });
  const fixtures = scheduleFixtureDates(generated, grouped, options);
  strictEqual(fixtures.length, 5);
  const final = fixtures.find((m) => m.stage === "final");
  ok(final);
  for (const semi of fixtures.filter((m) => m.stage === "knockout"))
    ok(Date.parse(final.scheduled_at) - Date.parse(semi.scheduled_at) >= 24 * 3_600_000 + 90 * 60_000);
});

test("late daily start that cannot fit a game is rejected", () => {
  throws(() => scheduleFixtureDates(drafts(), teams, { ...options, startTime: "23:30" }));
});

const tenTeams: TeamRef[] = Array.from({ length: 10 }, (_, i) => ({ id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`, name: `Team ${i + 1}`, group_label: i < 5 ? "A" : "B" }));
const sixDayDrafts = () => generateSchedule({ format: "group_knockout", legs: 1, qualifiersPerGroup: 2, playoffFormat: "none", teams: tenTeams });
const sixDayOptions: FixtureTiming = { ...options, leagueMatchesPerDay: 5, knockoutMatchesPerDay: 2, minimumRestHours: 2, phaseDays: { league: 4, knockout: 2 } };

test("10 teams: 20 league games occupy days 1–4 and 3 knockout games occupy days 5–6", () => {
  const fixtures = scheduleFixtureDates(sixDayDrafts(), tenTeams, sixDayOptions);
  strictEqual(fixtures.length, 23);
  const counts = new Map<number, number>();
  for (const m of fixtures) {
    const day = new Date(m.scheduled_at).getDate();
    if (m.stage === "group") ok(day >= 1 && day <= 4);
    else ok(day === 5 || day === 6);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  strictEqual(JSON.stringify([...counts]), JSON.stringify([[1, 5], [2, 5], [3, 5], [4, 5], [5, 2], [6, 1]]));
  strictEqual(new Set(fixtures.map((m) => m.match_no)).size, 23);
});

test("fixed-window league teams and advancing teams receive 2 hours rest after game end", () => {
  const fixtures = scheduleFixtureDates(sixDayDrafts(), tenTeams, sixDayOptions);
  const ends = new Map<string, number>();
  for (const m of fixtures) {
    for (const id of [m.team_a_id, m.team_b_id]) {
      if (!id) continue;
      const last = ends.get(id);
      if (last !== undefined) ok(Date.parse(m.scheduled_at) - last >= 2 * 3_600_000);
      ends.set(id, Date.parse(m.scheduled_at) + 90 * 60_000);
    }
  }
  const final = fixtures.find((m) => m.stage === "final");
  ok(final);
  for (const semi of fixtures.filter((m) => m.stage === "knockout"))
    ok(Date.parse(final.scheduled_at) - Date.parse(semi.scheduled_at) >= 90 * 60_000 + 2 * 3_600_000);
});

test("impossible six-day rest constraints fail instead of spilling past day 6", () => {
  throws(() => scheduleFixtureDates(sixDayDrafts(), tenTeams, { ...sixDayOptions, minimumRestHours: 72 }), /Cannot fit/);
});

test("duplicate knockout matchups are rejected", () => {
  const source = sixDayDrafts();
  const semi = source.find((m) => m.stage === "knockout");
  ok(semi);
  throws(() => scheduleFixtureDates([...source, { ...semi, match_no: 99 }], tenTeams, sixDayOptions), /Duplicate knockout/);
});