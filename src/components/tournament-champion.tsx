import { Trophy } from "lucide-react";
import { TeamChip } from "@/components/data-bits";
import type { Match, Team, Tournament } from "@/lib/queries";

type ChampionTeam = Pick<Team, "id" | "name" | "logo_url" | "jersey_color">;

const configuredChampionId = (config: Tournament["config"]) => {
  if (!config || typeof config !== "object" || Array.isArray(config)) return null;
  const value = (config as Record<string, unknown>)["champion_team_id"];
  return typeof value === "string" ? value : null;
};

const finalSeriesLeader = (matches: Match[]) => {
  const wins = new Map<string, number>();
  matches
    .filter(
      (match) =>
        match.stage === "final" &&
        (match.status === "completed" || match.status === "forfeit") &&
        match.team_a_id &&
        match.team_b_id &&
        match.score_a != null &&
        match.score_b != null &&
        match.score_a !== match.score_b,
    )
    .forEach((match) => {
      if (match.score_a == null || match.score_b == null) return;
      const winnerId = match.score_a > match.score_b ? match.team_a_id : match.team_b_id;
      if (winnerId) wins.set(winnerId, (wins.get(winnerId) ?? 0) + 1);
    });

  return [...wins.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
};

export function TournamentChampion({
  tournament,
  teams,
  matches,
}: {
  tournament: Tournament;
  teams: ChampionTeam[];
  matches: Match[];
}) {
  if (tournament.status !== "completed") return null;

  const championId = configuredChampionId(tournament.config) ?? finalSeriesLeader(matches);
  const champion = teams.find((team) => team.id === championId);

  return (
    <section className="mb-6 border-y border-success/30 bg-success/10 px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
          <Trophy className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-success">
            Tournament ended · Champions
          </p>
          {champion ? (
            <TeamChip
              name={champion.name}
              logoUrl={champion.logo_url}
              color={champion.jersey_color}
              size="lg"
              className="mt-1 px-0"
            />
          ) : (
            <p className="mt-1 font-display text-xl font-bold">Championship complete</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Best-of-three final won 2–0.</p>
        </div>
      </div>
    </section>
  );
}