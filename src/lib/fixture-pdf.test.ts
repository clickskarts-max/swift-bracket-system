import { test } from "node:test";
import { ok, deepEqual, equal, throws } from "node:assert/strict";
import { buildFixturePdf, type FixturePdfInput } from "./fixture-pdf";
import { fixturePdfModel } from "./fixture-pdf-model";
import type { Match } from "./queries";
import { buildFixtureWord } from "./fixture-word";
import { unzipSync } from "fflate";

const match = (id: string, match_no: number, scheduled_at: string, status = "scheduled"): Match => ({
  id, match_no, scheduled_at, status, tournament_id: "cup", owner_id: "owner",
  team_a_id: "home", team_b_id: "away", placeholder_a: null, placeholder_b: null,
  score_a: status === "forfeit" ? 20 : null, score_b: status === "forfeit" ? 0 : null,
  group_label: "A", stage: "league", round_name: "League", round_index: 1, leg: 1,
  venue_id: null, venue: null, court: null, referee: null, notes: null,
  periods: {}, player_stats: [], player_of_match_id: null, created_at: "", updated_at: "",
});
const input: FixturePdfInput = {
  tournamentName: "Test Cup",
  matches: [match("second", 11, "2026-11-24T05:00:00Z"), match("first", 1, "2026-11-24T03:00:00Z", "forfeit"), match("cancelled", 2, "2026-11-25T03:00:00Z", "cancelled")],
  label: (_, side) => ({ name: side === "a" ? "Home Club" : "Away Club" }),
  venue: () => "Sports Hall", matchday: () => "Matchday 1",
};

test("fixture PDF uses playing-order numbers and excludes cancelled games", async () => {
  const pdf = await buildFixturePdf(input).text();
  ok(pdf.startsWith("%PDF"));
  ok(pdf.includes("(M1)") && pdf.includes("(M2)"));
  ok(pdf.indexOf("(M1)") < pdf.indexOf("(M2)"));
  ok(!pdf.includes("(M11)"));
  ok(!pdf.includes("(M3)"));
});

test("fixture PDF labels forfeits separately and includes the awarded score", async () => {
  const pdf = await buildFixturePdf(input).text();
  ok(pdf.includes("(FORFEIT)"));
  ok(pdf.includes("(20 - 0)"));
});

test("blank tie-sheet leaves teams and results empty and includes drawing space", async () => {
  const pdf = await buildFixturePdf(input, 24).text();
  ok(pdf.includes("(24)"));
  ok(!pdf.includes("Home Club"));
  ok(!pdf.includes("20 - 0"));
  ok(pdf.includes("Tie-sheet drawing / team assignments"));
});

test("column selection omits unselected fields and blanks only requested values", () => {
  const model = fixturePdfModel(input, { columns: [{ key: "number" }, { key: "home", blank: true }, { key: "away" }] });
  const first = model.days[0]?.matches[0];
  ok(first);
  deepEqual(model.columns.map(column => model.cell(first, column)), ["M1", "", "Away Club"]);
  equal(first.team_a_id, "home");
  throws(() => fixturePdfModel(input, { columns: [] }), /at least one column/);
});

test("blank column headings fall back to existing labels", () => {
  const model = fixturePdfModel(input, { columns: [{ key: "home", heading: "  " }, { key: "away", heading: "Visitor" }] });
  deepEqual(model.headings, ["Home team", "Visitor"]);
});

test("PDF groups retain two-team rosters and fixtures remain separated by local days", () => {
  const model = fixturePdfModel({ ...input, teams: [{ id: "home", name: "Home Club", group_label: "A" }, { id: "away", name: "Away Club", group_label: "A" }], matches: [...input.matches, match("next", 3, "2026-11-25T03:00:00Z")] });
  deepEqual(model.groups, [["Group A", ["Home Club", "Away Club"]]]);
  deepEqual(model.days.map(day => day.matches.length), [2, 1]);
});

test("custom PDF retains parent link, saved daily limits and group table before fixtures", async () => {
  const pdf = await buildFixturePdf({ ...input, tournamentUrl: "https://example.com/public/tournament/test-cup", teams: [{ id: "home", name: "Home Club", group_label: "A" }], settings: { timingMode: "fixed", startDate: "2026-11-24", startTime: "09:00", leagueLimit: 5, leagueDays: 4, knockoutLimit: 2, knockoutDays: 2, restHours: 2, durationMinutes: 90, restDates: [] } }, undefined, { heading: "Championship Fixtures", columns: [{ key: "number" }, { key: "home", blank: true }, { key: "away" }] }).text();
  ok(pdf.includes("https://example.com/public/tournament/test-cup"));
  ok(pdf.includes("League: 5/day x 4 days"));
  ok(pdf.indexOf("Group assignments") < pdf.indexOf("(M1)"));
});
test("tie sheet layout leaves team names empty when home and away are blank", async () => {
  const pdf = await buildFixturePdf({ ...input, teams: [{ id: "home", name: "Home Club", group_label: "A" }, { id: "away", name: "Away Club", group_label: "A" }] }, undefined, { layout: "tiesheet", columns: [{ key: "number" }, { key: "home", blank: true }, { key: "away", blank: true }] }).text();
  ok(pdf.startsWith("%PDF"));
  ok(!pdf.includes("Home Club") && !pdf.includes("Away Club"));
  ok(pdf.includes("(Pool - A)") && pdf.includes("(Vs)"));
});

test("tie sheet layout shows team names when not blank", async () => {
  const pdf = await buildFixturePdf(input, undefined, { layout: "tiesheet" }).text();
  ok(pdf.includes("(Home Club)") && pdf.includes("(Away Club)"));
});

const poolInput: FixturePdfInput = { ...input, teams: [{ id: "home", name: "Home Club", group_label: "A" }, { id: "away", name: "Away Club", group_label: "B" }] };

test("blank pools preserve A and B and roster slots without altering fixture teams", () => {
  const model = fixturePdfModel(poolInput, { blankPools: true });
  deepEqual(model.groups, [["Group A", [""]], ["Group B", [""]]]);
  const first = model.days[0]?.matches[0];
  ok(first);
  equal(model.cell(first, { key: "home" }), "Home Club");
  equal(poolInput.teams?.[0]?.name, "Home Club");
});

test("blank pool PDF omits roster names while keeping pool labels and numbered slots", async () => {
  const pdf = await buildFixturePdf({ ...poolInput, matches: [] }, undefined, { layout: "tiesheet", blankPools: true }).text();
  ok(pdf.includes("(Pool - A)") && pdf.includes("(Pool - B)"));
  ok(pdf.includes("(1. )"));
  ok(!pdf.includes("Home Club") && !pdf.includes("Away Club"));
});

test("Word blanks pool and fixture team names when requested and retains days", async () => {
  const blob = await buildFixtureWord(poolInput, { layout: "tiesheet", blankPools: true, columns: [{ key: "number" }, { key: "home", blank: true }, { key: "away", blank: true }] });
  equal(blob.type, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  const entries = unzipSync(new Uint8Array(await blob.arrayBuffer()));
  const xmlBytes = entries["word/document.xml"];
  ok(xmlBytes);
  const xml = new TextDecoder().decode(xmlBytes);
  ok(xml.includes("Pool - A") && xml.includes("Pool - B"));
  ok(xml.includes("Matchday 1") && xml.includes("Vs"));
  ok(!xml.includes("Home Club") && !xml.includes("Away Club"));
});

test("Word keeps fixture names when only pool names are blank", async () => {
  const blob = await buildFixtureWord(poolInput, { layout: "tiesheet", blankPools: true });
  const entries = unzipSync(new Uint8Array(await blob.arrayBuffer()));
  const xmlBytes = entries["word/document.xml"];
  ok(xmlBytes);
  const xml = new TextDecoder().decode(xmlBytes);
  equal(xml.split("Home Club").length - 1, 2);
  equal(xml.split("Away Club").length - 1, 2);
});

test("download column order is shared by detailed and tie sheets", () => {
  const model = fixturePdfModel(input, { columns: [{ key: "date" }, { key: "away" }, { key: "home" }, { key: "number" }] });
  deepEqual(model.columns.map(column => column.key), ["date", "away", "home", "number"]);
  deepEqual(model.tieColumns.map(column => column.key), ["date", "teams", "number"]);
});

test("five custom game times on each of five days only change export values", () => {
  const matches = Array.from({ length: 25 }, (_, index) => match(`game-${index}`, index + 1, `2026-11-${24 + Math.floor(index / 5)}T${String(3 + index % 5).padStart(2, "0")}:00:00Z`));
  const original = JSON.stringify(matches);
  const times = ["09:00", "11:00", "13:00", "15:00", "17:00"];
  const gameTimes = Object.fromEntries(matches.map((game, index) => [game.id, times[index % 5] ?? ""]));
  const model = fixturePdfModel({ ...input, matches }, { gameTimes, columns: [{ key: "date" }] });
  equal(model.days.length, 5);
  for (const day of model.days) {
    equal(day.matches.length, 5);
    deepEqual(day.matches.map(game => model.cell(game, { key: "date" })), times);
    deepEqual(day.matches.map(game => model.tieCell(game, "date")), times);
  }
  equal(JSON.stringify(matches), original);
  const first = matches[0];
  ok(first);
  equal(model.cell(first, { key: "date", blank: true }), "");
});

test("PDF and Word include reordered custom times and respect blank times", async () => {
  const options = { layout: "tiesheet" as const, columns: [{ key: "date" as const }, { key: "number" as const }], gameTimes: { first: "09:17", second: "11:43" } };
  const pdf = await buildFixturePdf(input, undefined, options).text();
  ok(pdf.includes("(09:17)") && pdf.includes("(11:43)"));
  const blob = await buildFixtureWord(input, options);
  const bytes = unzipSync(new Uint8Array(await blob.arrayBuffer()))["word/document.xml"];
  ok(bytes);
  const xml = new TextDecoder().decode(bytes);
  ok(xml.includes("09:17") && xml.includes("11:43"));
  const blank = await buildFixturePdf(input, undefined, { ...options, columns: [{ key: "date", blank: true }, { key: "number" }] }).text();
  ok(!blank.includes("09:17") && !blank.includes("11:43"));
});
