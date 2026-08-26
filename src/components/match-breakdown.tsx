import { Trophy } from "lucide-react";
import {
  hasPeriodScores,
  parsePeriods,
  parsePlayerStats,
  periodLabel,
  periodTotal,
} from "@/lib/periods";

export type BreakdownPlayer = {
  id: string;
  name: string;
  team_id: string | null;
  jersey_number?: number | null;
};

export function MatchBreakdown({
  periods: rawPeriods,
  playerStats: rawStats,
  playerOfMatchId,
  teamAId,
  teamBId,
  teamAName,
  teamBName,
  players,
}: {
  periods: unknown;
  playerStats: unknown;
  playerOfMatchId: string | null;
  teamAId: string | null;
  teamBId: string | null;
  teamAName: string;
  teamBName: string;
  players: BreakdownPlayer[];
}) {
  const periods = parsePeriods(rawPeriods);
  const stats = parsePlayerStats(rawStats);
  const showPeriods = hasPeriodScores(periods);
  const potm = playerOfMatchId ? players.find((p) => p.id === playerOfMatchId) : undefined;
  if (!showPeriods && stats.length === 0 && !potm) return null;

  const byId = new Map(players.map((p) => [p.id, p]));
  const sideStats = (teamId: string | null) =>
    stats
      .filter((s) => (byId.get(s.player_id)?.team_id ?? null) === teamId)
      .sort((a, b) => b.points - a.points);

  return (
    <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
      {showPeriods && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[360px] text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="p-1 text-left font-medium">Team</th>
                {periods.a.map((_, i) => (
                  <th key={i} className="p-1 text-center font-medium">
                    {periodLabel(i)}
                  </th>
                ))}
                <th className="p-1 text-center font-medium">T</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  [teamAName, periods.a],
                  [teamBName, periods.b],
                ] as const
              ).map(([name, cells]) => (
                <tr key={name} className="border-t border-border/40">
                  <td className="max-w-[9rem] truncate p-1">{name}</td>
                  {cells.map((v, i) => (
                    <td key={i} className="p-1 text-center tabular-nums">
                      {v ?? "–"}
                    </td>
                  ))}
                  <td className="p-1 text-center font-bold tabular-nums">{periodTotal(cells)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {potm && (
        <p className="flex items-center gap-1.5 text-xs">
          <Trophy className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">Player of the match:</span>
          <span className="font-semibold">{potm.name}</span>
        </p>
      )}

      {stats.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              [teamAName, sideStats(teamAId)],
              [teamBName, sideStats(teamBId)],
            ] as const
          ).map(([name, rows]) =>
            rows.length === 0 ? null : (
              <div key={name}>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {name}
                </p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="p-1 text-left font-medium">Player</th>
                      <th className="p-1 text-center font-medium">PTS</th>
                      <th className="p-1 text-center font-medium">REB</th>
                      <th className="p-1 text-center font-medium">AST</th>
                      <th className="p-1 text-center font-medium">PF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((s) => (
                      <tr key={s.player_id} className="border-t border-border/40">
                        <td className="max-w-[10rem] truncate p-1">
                          {byId.get(s.player_id)?.name ?? "Player"}
                        </td>
                        <td className="p-1 text-center tabular-nums">{s.points}</td>
                        <td className="p-1 text-center tabular-nums">{s.rebounds}</td>
                        <td className="p-1 text-center tabular-nums">{s.assists}</td>
                        <td className="p-1 text-center tabular-nums">{s.fouls}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
