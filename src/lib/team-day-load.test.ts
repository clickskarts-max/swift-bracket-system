import { test } from "node:test";
import { deepStrictEqual, strictEqual } from "node:assert";
import { teamDayLoads } from "./team-day-load";

const game = (id: string, time: string, a: string | null, b: string | null, status = "scheduled") => ({
  id, scheduled_at: `2026-12-01T${time}:00Z`, team_a_id: a, team_b_id: b, status,
});

test("identifies which and how many teams have two games on one day", () => {
  const days = teamDayLoads([game("1", "09:00", "a", "b"), game("2", "12:00", "c", "a"), game("3", "15:00", "b", "d")]);
  strictEqual(days.length, 1);
  strictEqual(days[0]?.teams.length, 2);
  deepStrictEqual(days[0]?.teams.map(team => [team.teamId, team.games.length]), [["a", 2], ["b", 2]]);
});
test("does not combine games on different days or invent unknown teams", () => {
  const otherDay = { ...game("2", "12:00", "a", null), scheduled_at: "2026-12-02T12:00:00Z" };
  strictEqual(teamDayLoads([game("1", "09:00", "a", null), otherDay]).length, 0);
});
test("counts the first completed game when a second game is still due, but excludes forfeits and cancellations", () => {
  const matches = [game("1", "09:00", "a", "b", "completed"), game("2", "12:00", "a", "c"), game("3", "15:00", "b", "c", "forfeit"), game("4", "16:00", "b", "c", "cancelled")];
  deepStrictEqual(teamDayLoads(matches)[0]?.teams.map(team => team.teamId), ["a"]);
  strictEqual(teamDayLoads(matches.map(match => ({ ...match, status: "completed" }))).length, 0);
});
test("reports three games accurately and recalculates after individual date movement", () => {
  const matches = [game("1", "09:00", "a", "b"), game("2", "12:00", "a", "c"), game("3", "15:00", "a", "d")];
  strictEqual(teamDayLoads(matches)[0]?.teams[0]?.games.length, 3);
  strictEqual(teamDayLoads(matches.map(match => match.id === "3" ? { ...match, scheduled_at: "2026-12-02T15:00:00Z" } : match))[0]?.teams[0]?.games.length, 2);
});