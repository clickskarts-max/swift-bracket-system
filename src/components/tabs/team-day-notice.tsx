import { useMemo } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { formatDate } from "@/lib/app";
import { teamDayLoads } from "@/lib/team-day-load";
import type { Match, Team } from "@/lib/queries";

export function TeamDayNotice({ matches, teams, displayNumbers, matchdayByDate }: {
  matches: Match[];
  teams: Team[];
  displayNumbers: Map<string, number>;
  matchdayByDate: Map<string, number>;
}) {
  const days = useMemo(() => teamDayLoads(matches), [matches]);
  const teamById = new Map(teams.map(team => [team.id, team]));
  const uniqueTeams = new Set(days.flatMap(day => day.teams.map(team => team.teamId))).size;
  if (!days.length) return null;

  return <details open className="border-y border-primary/30 bg-primary/5 px-3 py-3">
    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
      <div className="flex min-w-0 items-start gap-2">
        <CalendarDays aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <h3 className="text-sm font-semibold">Teams playing multiple games in one day</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{uniqueTeams} {uniqueTeams === 1 ? "team" : "teams"} · {days.length} {days.length === 1 ? "matchday" : "matchdays"}</p>
        </div>
      </div>
      <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
    </summary>
    <div className="mt-3 divide-y divide-border">
      {days.map(day => <div key={day.day} className="py-3 first:pt-0 last:pb-0">
        <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
          <span className="font-bold text-primary">Matchday {matchdayByDate.get(day.day) ?? "—"}</span>
          <span className="font-medium">{formatDate(day.teams[0]?.games[0]?.scheduled_at)}</span>
          <span className="text-muted-foreground">{day.teams.length} {day.teams.length === 1 ? "team" : "teams"}</span>
        </div>
        <ul className="grid gap-x-6 gap-y-2 md:grid-cols-2">
          {day.teams.map(({ teamId, games }) => <li key={teamId} className="min-w-0 text-xs">
            <div className="flex flex-wrap items-baseline gap-2"><span className="font-semibold">{teamById.get(teamId)?.name ?? "Team unavailable"}</span><span className="font-semibold text-primary">{games.length} matches</span></div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
              {games.map(game => <span key={game.id}>M{displayNumbers.get(game.id) ?? "—"} · {new Date(game.scheduled_at ?? "").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{game.status === "completed" ? " (played)" : ""}</span>)}
            </div>
          </li>)}
        </ul>
      </div>)}
    </div>
  </details>;
}