import { formatDate, isFinalStatus } from "@/lib/app";
import { fixtureDisplayNumbers } from "@/lib/fixture-display";
import type { FixtureSettings } from "@/lib/fixture-settings";
import type { Match } from "@/lib/queries";

export const FIXTURE_PDF_COLUMNS = [
  { key: "number", label: "Match" }, { key: "day", label: "Matchday" },
  { key: "date", label: "Date / time" }, { key: "group", label: "Group / round" },
  { key: "home", label: "Home team" }, { key: "score", label: "Score" },
  { key: "away", label: "Away team" }, { key: "venue", label: "Venue" },
  { key: "status", label: "Status" },
] as const;
export type FixturePdfColumnKey = typeof FIXTURE_PDF_COLUMNS[number]["key"];
export type FixturePdfColumn = { key: FixturePdfColumnKey; heading?: string; blank?: boolean };
export type FixturePdfOptions = {
  heading?: string;
  subheading?: string;
  columns?: FixturePdfColumn[];
  showGroups?: boolean;
  logo?: string;
};
export type FixturePdfInput = {
  tournamentName: string;
  tournamentUrl?: string;
  logoUrl?: string | null;
  format?: string;
  startDate?: string | null;
  endDate?: string | null;
  settings?: FixtureSettings;
  teams?: { id: string; name: string; group_label: string | null }[];
  matches: Match[];
  label: (match: Match, side: "a" | "b") => { name: string };
  venue: (match: Match) => string;
  matchday: (match: Match) => string;
};

export function fixturePdfModel(input: FixturePdfInput, options: FixturePdfOptions = {}) {
  const columns: FixturePdfColumn[] = options.columns ?? FIXTURE_PDF_COLUMNS.map(({ key }) => ({ key }));
  if (!columns.length) throw new Error("Select at least one column.");
  const numbers = fixtureDisplayNumbers(input.matches);
  const ordered = input.matches.filter(match => match.status !== "cancelled")
    .sort((a, b) => (numbers.get(a.id) ?? 0) - (numbers.get(b.id) ?? 0));
  const days = new Map<string, { label: string; date: string; matches: Match[] }>();
  for (const match of ordered) {
    const day = match.scheduled_at ? new Date(match.scheduled_at).toLocaleDateString("en-CA") : "undated";
    const entry = days.get(day) ?? { label: input.matchday(match), date: match.scheduled_at ? `${formatDate(match.scheduled_at)} BS` : "Date TBD", matches: [] };
    entry.matches.push(match);
    days.set(day, entry);
  }
  const cell = (match: Match, column: FixturePdfColumn): string => {
    if (column.blank) return "";
    const values: Record<FixturePdfColumnKey, string> = {
      number: `M${numbers.get(match.id) ?? ""}`, day: input.matchday(match),
      date: match.scheduled_at ? `${formatDate(match.scheduled_at)}\n${new Date(match.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "TBD",
      group: match.group_label ? `Group ${match.group_label}` : match.round_name ?? match.stage,
      home: input.label(match, "a").name, away: input.label(match, "b").name,
      score: isFinalStatus(match.status) ? `${match.score_a ?? 0} - ${match.score_b ?? 0}` : "",
      venue: input.venue(match), status: match.status === "forfeit" ? "FORFEIT" : match.status === "completed" ? "Final" : match.status,
    };
    return values[column.key];
  };
  const groups = new Map<string, string[]>();
  for (const team of input.teams ?? []) {
    const label = team.group_label ? `Group ${team.group_label}` : "Teams";
    groups.set(label, [...(groups.get(label) ?? []), team.name]);
  }
  return { columns, days: [...days.values()], groups: [...groups].sort(([a], [b]) => a.localeCompare(b)), cell,
    headings: columns.map(column => column.heading?.trim() || FIXTURE_PDF_COLUMNS.find(item => item.key === column.key)?.label || column.key),
    gameCount: ordered.length };
}