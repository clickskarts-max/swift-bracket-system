import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, TeamChip } from "@/components/data-bits";
import { computeStandings } from "@/lib/standings";
import type { Match, Team, Tournament } from "@/lib/queries";

type StandingsTeamLike = Pick<
  Team,
  "id" | "name" | "logo_url" | "jersey_color" | "group_label"
>;

const playoffSlots = (tournament: Tournament | null) => {
  if (!tournament) return 0;
  const { format, playoff_format, qualifiers_per_group } = tournament;
  if (format === "group_knockout") return qualifiers_per_group || 0;
  if (!playoff_format || playoff_format === "none") return 0;
  if (playoff_format.startsWith("top2")) return 2;
  if (playoff_format.startsWith("top4")) return 4;
  if (playoff_format.startsWith("top6")) return 6;
  return 0;
};

const fmtWinPct = (v: number) => {
  const s = v.toFixed(3);
  // NBA-style: 0.560 -> .560
  return s.startsWith("0") ? s.slice(1) : s;
};

function StandingsLegend({ tournament }: { tournament: Tournament | null }) {
  const isLeague = tournament?.format === "league";
  
  return (
    <div className="surface-card border border-border/70 p-4 text-xs text-muted-foreground">
      <div className="mb-3 flex flex-wrap gap-x-6 gap-y-2 border-b border-border/40 pb-3">
        <span className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground">Points:</span>
          {isLeague ? (
            <span className="text-primary">Win: 2 · Loss: 1 · Forfeit: 0</span>
          ) : (
            <span className="text-primary">Win: 2 · Loss: 0</span>
          )}
        </span>
      </div>
      
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <span>
          <span className="font-semibold text-foreground">P</span> Played
        </span>
        <span>
          <span className="font-semibold text-foreground">W</span> Wins
        </span>
        <span>
          <span className="font-semibold text-foreground">L</span> Losses
        </span>
        <span>
          <span className="font-semibold text-foreground">PF</span> Points For
        </span>
        <span>
          <span className="font-semibold text-foreground">PA</span> Points Against
        </span>
        <span>
          <span className="font-semibold text-foreground">Diff</span> Point Differential
        </span>
        <span>
          <span className="font-semibold text-foreground">Pts</span> Points
        </span>
        <span>
          <span className="font-semibold text-foreground">WIN%</span> Win Percentage
        </span>
        <span>
          <span className="font-semibold text-foreground">OT</span> Overtime
        </span>
        <span>
          <span className="font-semibold text-foreground">LAST 3</span> Last 3 Games
        </span>
        <span>
          <span className="font-semibold text-foreground">STREAK</span> Current Streak
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
        <span>
          <span className="font-semibold text-success">x</span> Clinched Playoff Berth
        </span>
        <span>
          <span className="font-semibold text-destructive">o</span> Eliminated from Playoffs
        </span>
      </div>
    </div>
  );
}

function PointDistribution({ tournament }: { tournament: Tournament | null }) {
  const format = tournament?.format ?? "league";
  const isLeague = format === "league";

  return (
    <div className="surface-card border border-border/70 p-4">
      <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Point Distribution
      </h3>
      <div className="mt-3 grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center justify-center rounded-lg bg-success/5 p-3 text-center border border-success/20">
          <span className="text-2xl font-bold text-success">2</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Win</span>
        </div>
        {isLeague ? (
          <>
            <div className="flex flex-col items-center justify-center rounded-lg bg-warning/5 p-3 text-center border border-warning/20">
              <span className="text-2xl font-bold text-warning">1</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Loss</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg bg-destructive/5 p-3 text-center border border-destructive/20">
              <span className="text-2xl font-bold text-destructive">0</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Forfeit</span>
            </div>
          </>
        ) : (
          <div className="col-span-2 flex flex-col items-center justify-center rounded-lg bg-destructive/5 p-3 text-center border border-destructive/20">
            <span className="text-2xl font-bold text-destructive">0</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Loss</span>
          </div>
        )}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed italic">
        {isLeague 
          ? "Points are awarded per game according to FIBA classification rules: 2 for a win, 1 for a loss, and 0 for a loss by forfeit." 
          : "Standard tournament points: 2 points for a win and 0 points for a loss."}
      </p>
    </div>
  );
}

function TieBreakProcedures({ tournament }: { tournament: Tournament | null }) {
  const format = tournament?.format ?? "league";
  const playoff = tournament?.playoff_format ?? "none";
  const hasGroups = format === "group_knockout" || format === "group_stage" || format === "group";
  const hasPlayoffs = playoff !== "none";
  const hasPlayIn = playoff === "top6_ipl";
  const isQualifierEliminator = playoff === "top4_ipl" || playoff === "top6_ipl";

  return (
    <div className="surface-card border border-border/70 p-4 text-sm">
      <h3 className="font-display text-base font-semibold">
        Play-In and Playoff Tie-Break Procedures
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        These rules apply when teams are level on points in the league table. Tie-breaks are
        resolved top-to-bottom until the tie is broken.
      </p>

      {hasGroups ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Group stage
          </p>
          <ul className="list-inside list-decimal text-sm text-muted-foreground">
            <li>Head-to-head record (among tied teams)</li>
            <li>Head-to-head point differential (among tied teams)</li>
            <li>Overall point differential (Diff)</li>
            <li>Overall points for (PF)</li>
            <li>Coin toss / organizer decision</li>
          </ul>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            League table
          </p>
          <ul className="list-inside list-decimal text-sm text-muted-foreground">
            <li>Head-to-head record</li>
            <li>Head-to-head point differential</li>
            <li>Overall point differential (Diff)</li>
            <li>Overall points for (PF)</li>
            <li>Coin toss / organizer decision</li>
          </ul>
        </div>
      )}

      {hasPlayoffs ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Playoff seeding
          </p>
          <ul className="list-inside list-decimal text-sm text-muted-foreground">
            <li>Higher seed is the team ranked higher after tie-breaks</li>
            <li>If seeding affects home court, higher seed gets home advantage</li>
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          No playoffs are enabled for this tournament format.
        </p>
      )}

      {isQualifierEliminator && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Qualifier / Eliminator rules
          </p>
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            <li>
              <span className="font-semibold text-foreground">Qualifier 1</span>: Seed 1 vs Seed 2.
              Winner goes directly to the Final. Loser gets a second chance in Qualifier 2.
            </li>
            {playoff === "top4_ipl" ? (
              <>
                <li>
                  <span className="font-semibold text-foreground">Eliminator</span>: Seed 3 vs Seed
                  4. Loser is eliminated. Winner advances to Qualifier 2.
                </li>
              </>
            ) : (
              <>
                <li>
                  <span className="font-semibold text-foreground">Wildcards</span>: Seed 3 vs Seed 6
                  (Wildcard 1) and Seed 4 vs Seed 5 (Wildcard 2). Losers are eliminated. Winners
                  advance to the Eliminator.
                </li>
                <li>
                  <span className="font-semibold text-foreground">Eliminator</span>: Winner Wildcard
                  1 vs Winner Wildcard 2. Loser is eliminated. Winner advances to Qualifier 2.
                </li>
              </>
            )}
            <li>
              <span className="font-semibold text-foreground">Qualifier 2</span>: Loser Qualifier 1
              vs Winner Eliminator. Loser is eliminated. Winner advances to the Final.
            </li>
            <li>
              <span className="font-semibold text-foreground">Final</span>: Winner Qualifier 1 vs
              Winner Qualifier 2. Winner is Champion.
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">
            If a tie affects the last spot that qualifies for any of these games, the league
            tie-break procedure above decides who qualifies.
          </p>
        </div>
      )}

      {hasPlayIn && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Play-In (Top 6 format)
          </p>
          <ul className="list-inside list-decimal text-sm text-muted-foreground">
            <li>Play-in spots are decided by league ranking after tie-breaks</li>
            <li>
              If two teams are tied for the last play-in spot, apply the same league tie-breaks
              above
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

function statusMarker(
  row: ReturnType<typeof computeStandings>[number],
  all: ReturnType<typeof computeStandings>,
  slots: number,
  winPoints: number,
  lossPoints: number,
  show: boolean,
): "x" | "o" | null {
  if (!show || slots <= 0) return null;
  // Simple bounds-based clinch/elimination (no tie-break math).
  const minPts = row.points;
  const maxPts = row.points + row.remaining * winPoints;
  const others = all.filter((r) => r.team.id !== row.team.id);
  
  // For clinch/elimination logic, use the same win/loss points as the table
  const canBeatMin = others.filter((r) => r.points + r.remaining * winPoints > minPts).length;
  if (canBeatMin < slots) return "x";
  const alreadyAboveMyMax = others.filter((r) => r.points > maxPts).length;
  if (alreadyAboveMyMax >= slots) return "o";
  return null;
}

export function StandingsTable({
  teams,
  matches,
  groupLabel,
  tournament,
}: {
  teams: StandingsTeamLike[];
  matches: Match[];
  groupLabel?: string | null;
  tournament: Tournament | null;
}) {
  const rows = useMemo(
    () =>
      computeStandings(
        teams.map((t) => ({
          id: t.id,
          name: t.name,
          logo_url: t.logo_url,
          jersey_color: t.jersey_color,
          group_label: t.group_label,
        })),
        matches.map((m) => ({
          team_a_id: m.team_a_id,
          team_b_id: m.team_b_id,
          score_a: m.score_a,
          score_b: m.score_b,
          status: m.status,
          stage: m.stage,
          group_label: m.group_label,
          scheduled_at: m.scheduled_at,
          match_no: m.match_no,
        })),
        { 
          groupLabel: groupLabel ?? null,
          format: tournament?.format
        },
      ),
    [teams, matches, groupLabel],
  );

  if (rows.length === 0)
    return (
      <EmptyState
        title="No standings yet"
        description="Add teams and record match results to build the table."
      />
    );

  const slots = playoffSlots(tournament);
  const isLeague = tournament?.format === "league";
  const winPoints = 2;
  const lossPoints = isLeague ? 1 : 0;
  const showMarkers = matches.some(
    (m) => m.status === "completed" && m.score_a != null && m.score_b != null,
  );

  return (
    <div className="surface-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-center">P</TableHead>
            <TableHead className="text-center">W</TableHead>
            <TableHead className="text-center">L</TableHead>
            <TableHead className="text-center">WIN%</TableHead>
            <TableHead className="text-center">OT</TableHead>
            <TableHead className="text-center">PF</TableHead>
            <TableHead className="text-center">PA</TableHead>
            <TableHead className="text-center">Diff</TableHead>
            <TableHead className="text-center">Pts</TableHead>
            <TableHead className="text-center">LAST 3</TableHead>
            <TableHead className="text-center">STREAK</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.team.id}>
              <TableCell className="font-display font-bold text-primary">{r.rank}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <TeamChip
                    name={r.team.name}
                    logoUrl={r.team.logo_url ?? null}
                    color={r.team.jersey_color ?? null}
                  />
                  {(() => {
                    const mark = statusMarker(r, rows, slots, winPoints, lossPoints, showMarkers);
                    if (!mark) return null;
                    return (
                      <span className={mark === "x" ? "text-success" : "text-destructive"}>
                        {mark}
                      </span>
                    );
                  })()}
                </div>
              </TableCell>
              <TableCell className="text-center tabular-nums">{r.played}</TableCell>
              <TableCell className="text-center tabular-nums">{r.wins}</TableCell>
              <TableCell className="text-center tabular-nums">{r.losses}</TableCell>
              <TableCell className="text-center tabular-nums">{fmtWinPct(r.winPct)}</TableCell>
              <TableCell className="text-center tabular-nums">{r.ot}</TableCell>
              <TableCell className="text-center tabular-nums">{r.pointsFor}</TableCell>
              <TableCell className="text-center tabular-nums">{r.pointsAgainst}</TableCell>
              <TableCell className="text-center tabular-nums">
                {r.diff > 0 ? `+${r.diff}` : r.diff}
              </TableCell>
              <TableCell className="text-center font-semibold tabular-nums">{r.points}</TableCell>
              <TableCell className="text-center tabular-nums">{r.last3}</TableCell>
              <TableCell className="text-center tabular-nums">{r.streak}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function StandingsTab({
  teams,
  matches,
  tournament,
}: {
  teams: StandingsTeamLike[];
  matches: Match[];
  tournament: Tournament | null;
}) {
  const isGroupKnockout = tournament?.format === "group_knockout";
  const groups = [...new Set(teams.map((t) => t.group_label).filter(Boolean))] as string[];
  
  if (isGroupKnockout || groups.length > 1) {
    // For group knockout, we must show groups even if only one group label exists or even if none (though creation now enforces it)
    // If no group labels found, but it is group knockout, we might have a data issue, but we'll fallback to showing what we have.
    const sortedGroups = groups.length > 0 ? groups.sort() : ["A"];

    return (
      <div className="space-y-12">
        {sortedGroups.map((g) => (
          <div key={g} className="space-y-4">
            <div className="flex items-center gap-3 border-l-4 border-primary pl-4">
              <h3 className="font-display text-2xl font-bold uppercase tracking-tight">
                Group {g}
              </h3>
            </div>
            
            <StandingsTable
              teams={teams}
              matches={matches}
              groupLabel={g}
              tournament={tournament}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <PointDistribution tournament={tournament} />
              <StandingsLegend tournament={tournament} />
            </div>
          </div>
        ))}
        <TieBreakProcedures tournament={tournament} />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <StandingsTable teams={teams} matches={matches} tournament={tournament} />
      <StandingsLegend tournament={tournament} />
      <TieBreakProcedures tournament={tournament} />
    </div>
  );
}
