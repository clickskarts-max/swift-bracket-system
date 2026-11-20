import { test } from "node:test";
import { deepStrictEqual, strictEqual } from "node:assert";
import { readGroupCapacities, tournamentPayload } from "./tournament-payload";

test("creation stores uneven capacities in config, not nonexistent columns", () => {
  const payload = tournamentPayload({ name: "Test", group_capacities: { A: 3, B: 4 }, teams: [], venues: [] });
  deepStrictEqual(payload, { name: "Test", config: { group_capacities: { A: 3, B: 4 } } });
  deepStrictEqual(readGroupCapacities(payload["config"] as { group_capacities: { A: number; B: number } }), { A: 3, B: 4 });
});

test("settings preserve championship and other configuration while saving capacities", () => {
  deepStrictEqual(tournamentPayload({ id: "tournament", config: { champion_team_id: "champion", finals_best_of: 3 }, group_capacities: { A: 5, B: 4 }, teams: [], venues: [] }), {
    id: "tournament", config: { champion_team_id: "champion", finals_best_of: 3, group_capacities: { A: 5, B: 4 } },
  });
});

test("updates without capacities leave existing config untouched", () => {
  deepStrictEqual(tournamentPayload({ status: "completed" }), { status: "completed" });
  strictEqual(readGroupCapacities({ group_capacities: { A: "invalid" } }), null);
});