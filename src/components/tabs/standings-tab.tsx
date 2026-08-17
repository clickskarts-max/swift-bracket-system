import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, TeamChip } from "@/components/data-bits";
import { computeStandings } from "@/lib/standings";
import type { Match, Team } from "@/lib/queries";

export function StandingsTable({ teams, matches, groupLabel }: { teams: Team[]; matches: Match[]; groupLabel?: string | null }) {
  const rows = useMemo(
    () =>
      computeStandings(
        teams.map((t) => ({ id: t.id, name: t.name, logo_url: t.logo_url, jersey_color: t.jersey_color, group_label: t.group_label })),
        matches.map((m) => ({
          team_a_id: m.team_a_id, team_b_id: m.team_b_id, score_a: m.score_a, score_b: m.score_b,
          status: m.status, stage: m.stage, group_label: m.group_label,
        })),
        { groupLabel: groupLabel ?? null },
      ),
    [teams, matches, groupLabel],
  );

  if (rows.length === 0) return <EmptyState title="No standings yet" description="Add teams and record match results to build the table." />;

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
            <TableHead className="text-center">PF</TableHead>
            <TableHead className="text-center">PA</TableHead>
            <TableHead className="text-center">Diff</TableHead>
            <TableHead className="text-center">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.team.id}>
              <TableCell className="font-display font-bold text-primary">{r.rank}</TableCell>
              <TableCell>
                <TeamChip name={r.team.name} logoUrl={r.team.logo_url ?? null} color={r.team.jersey_color ?? null} />
              </TableCell>
              <TableCell className="text-center tabular-nums">{r.played}</TableCell>
              <TableCell className="text-center tabular-nums">{r.wins}</TableCell>
              <TableCell className="text-center tabular-nums">{r.losses}</TableCell>
              <TableCell className="text-center tabular-nums">{r.pointsFor}</TableCell>
              <TableCell className="text-center tabular-nums">{r.pointsAgainst}</TableCell>
              <TableCell className="text-center tabular-nums">{r.diff > 0 ? `+${r.diff}` : r.diff}</TableCell>
              <TableCell className="text-center font-semibold tabular-nums">{r.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function StandingsTab({ teams, matches }: { teams: Team[]; matches: Match[] }) {
  const groups = [...new Set(teams.map((t) => t.group_label).filter(Boolean))] as string[];
  if (groups.length > 1) {
    return (
      <div className="space-y-6">
        {groups.sort().map((g) => (
          <div key={g}>
            <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">Group {g}</h3>
            <StandingsTable teams={teams} matches={matches} groupLabel={g} />
          </div>
        ))}
      </div>
    );
  }
  return <StandingsTable teams={teams} matches={matches} />;
}
