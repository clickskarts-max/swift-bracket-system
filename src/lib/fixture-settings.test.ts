import { test } from "node:test";
import { deepStrictEqual, strictEqual } from "node:assert";
import { readFixtureSettings, withFixtureSettings } from "./fixture-settings";

test("saved four league days and two knockout days survive reloading", () => {
  const settings = readFixtureSettings({}, "2026-12-01");
  strictEqual(settings.leagueDays, 4);
  strictEqual(settings.knockoutDays, 2);
  deepStrictEqual(readFixtureSettings(withFixtureSettings({}, settings), null), settings);
});

test("applying fixture settings preserves champion and group capacities", () => {
  const config = { champion_team_id: "champion", group_capacities: { A: 5, B: 5 } };
  deepStrictEqual(withFixtureSettings(config, readFixtureSettings(config, "2026-12-01")), {
    ...config, fixture_settings: readFixtureSettings(config, "2026-12-01"),
  });
});

test("fixed settings preserve five league matches per day for four days (20 matches)", () => {
  const settings = { ...readFixtureSettings({}, "2026-12-01"), leagueLimit: 5, leagueDays: 4 };
  const reloaded = readFixtureSettings(withFixtureSettings({}, settings), null);
  strictEqual(reloaded.leagueLimit, 5);
  strictEqual(reloaded.leagueDays, 4);
  strictEqual(reloaded.leagueLimit * reloaded.leagueDays, 20);
});