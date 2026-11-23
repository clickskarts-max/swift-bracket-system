import { test } from "node:test";
import { ok } from "node:assert/strict";
import { buildFixturePdf, type FixturePdfInput } from "./fixture-pdf";
import type { Match } from "./queries";

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