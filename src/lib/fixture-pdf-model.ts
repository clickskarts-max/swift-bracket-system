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
  blankPools?: boolean;
  logo?: string;
  layout?: "table" | "tiesheet";
  gameTimes?: Record<string, string>;
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
      date: options.gameTimes?.[match.id] !== undefined ? options.gameTimes[match.id] ?? "" : match.scheduled_at ? `${formatDate(match.scheduled_at)}\n${new Date(match.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "TBD",
      group: match.group_label ? `Group ${match.group_label}` : match.round_name ?? match.stage,
      home: input.label(match, "a").name, away: input.label(match, "b").name,
      score: isFinalStatus(match.status) ? `${match.score_a ?? 0} - ${match.score_b ?? 0}` : "",
      venue: input.venue(match), status: match.status === "forfeit" ? "FORFEIT" : match.status === "completed" ? "Final" : match.status,
    };
    return values[column.key];
  };
  const groups = new Map<string, string[]>();
  const groupIds = new Map<string, string[]>();
  for (const team of input.teams ?? []) {
    const label = team.group_label ? `Group ${team.group_label}` : "Teams";
    const blankPool = options.blankPools || columns.some(column => column.key === "home" && column.blank) && columns.some(column => column.key === "away" && column.blank);
    groups.set(label, [...(groups.get(label) ?? []), blankPool ? "" : team.name]);
    groupIds.set(label, [...(groupIds.get(label) ?? []), team.id]);
  }
  const seeds = new Map<string, number>();
  for (const [, ids] of groupIds) ids.forEach((id, index) => seeds.set(id, index + 1));
  const blankTeams = columns.some(column => (column.key === "home" || column.key === "away") && column.blank);
  const tieColumns: { key: FixturePdfColumnKey | "teams"; heading: string }[] = [];
  for (const column of columns) {
    if (column.key === "home" || column.key === "away") {
      if (!tieColumns.some(item => item.key === "teams")) tieColumns.push({ key: "teams", heading: columns.filter(item => item.key === "home" || item.key === "away").map(item => item.heading?.trim()).filter(Boolean).join(" / ") || "Teams" });
    } else tieColumns.push({ key: column.key, heading: column.heading?.trim() || ({ number: "Match No.", group: "Pool", date: "Time" } as Partial<Record<FixturePdfColumnKey, string>>)[column.key] || FIXTURE_PDF_COLUMNS.find(item => item.key === column.key)?.label || column.key });
  }
  const tieCell = (match: Match, key: FixturePdfColumnKey | "teams") => {
    if (key === "teams") return `${columns.some(item => item.key === "home") ? cell(match, columns.find(item => item.key === "home") ?? { key: "home" }) : ""}     Vs     ${columns.some(item => item.key === "away") ? cell(match, columns.find(item => item.key === "away") ?? { key: "away" }) : ""}`;
    const column = columns.find(item => item.key === key) ?? { key };
    if (column.blank) return "";
    if (key === "date") return options.gameTimes?.[match.id] ?? (match.scheduled_at ? new Date(match.scheduled_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "");
    if (key === "number") return cell(match, column).replace(/^M/, "");
    if (key === "group") return match.group_label ?? match.round_name ?? "";
    return cell(match, column);
  };
  return { columns, tieColumns, tieCell, seeds, blankTeams, days: [...days.values()], groups: [...groups].sort(([a], [b]) => a.localeCompare(b)), cell,
    headings: columns.map(column => column.heading?.trim() || FIXTURE_PDF_COLUMNS.find(item => item.key === column.key)?.label || column.key),
    gameCount: ordered.length };
}