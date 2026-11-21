import { test } from "node:test";
import { strictEqual, deepStrictEqual } from "node:assert";
import { groupStructureError, balancedGroupCapacity } from "./group-structure";
import { calculateGroupCapacities, generateSchedule } from "./formats";

test("10 teams in four groups allows two groups of two teams", () => {
  strictEqual(groupStructureError(10, 4), null);
  deepStrictEqual(["A", "B", "C", "D"].map(l => balancedGroupCapacity(10, 4, l)), [3, 3, 2, 2]);
  const capacities = calculateGroupCapacities(10, 4);
  deepStrictEqual(Object.values(capacities ?? {}).sort(), [2, 2, 3, 3]);
});

test("two teams per group are valid and fewer cannot supply two qualifiers", () => {
  strictEqual(groupStructureError(8, 4), null);
  strictEqual(groupStructureError(7, 4), "At least 8 teams are required for 4 groups (2 teams per group).");
});

test("uneven groups generate one game for each two-team group and eight knockout qualifiers", () => {
  const teams = ["A", "A", "A", "B", "B", "B", "C", "C", "D", "D"].map((group_label, i) => ({
    id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`, name: `Team ${i + 1}`, group_label,
  }));
  const matches = generateSchedule({ format: "group_knockout", legs: 1, playoffFormat: "none", teams });
  strictEqual(matches.filter(m => m.stage === "group").length, 8);
  strictEqual(matches.filter(m => m.group_label === "C").length, 1);
  strictEqual(matches.filter(m => m.group_label === "D").length, 1);
  strictEqual(matches.filter(m => m.round_name === "Quarterfinal").length, 4);
});