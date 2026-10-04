import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { EmptyState, TeamChip } from "@/components/data-bits";
import { TipoffCountdown } from "@/components/tipoff-countdown";
import type { Match, Team } from "@/lib/queries";
import { formatDate, isFinalStatus } from "@/lib/app";
import { AutoAdRegion } from "@/components/ads/auto-ad-region";

type BracketTeamLike = Pick<Team, "id" | "name" | "logo_url" | "jersey_color">;

const KNOCKOUT_STAGES = new Set(["knockout", "playoff", "final", "losers", "winners"]);

const formatGameTime = (scheduledAt?: string | null) => {
  if (!scheduledAt) return null;
  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

export function BracketTab({ teams, matches }: { teams: BracketTeamLike[]; matches: Match[] }) {
  const rounds = useMemo(() => {
    const ko = matches.filter((m) => KNOCKOUT_STAGES.has(m.stage));
    const map = new Map<number, Match[]>();
    ko.forEach((m) => map.set(m.round_index, [...(map.get(m.round_index) ?? []), m]));
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [matches]);

  const side = (id: string | null, fallback: string | null) =>
    teams.find((t) => t.id === id) ?? {
      name: fallback ?? "TBD",
      logo_url: null,
      jersey_color: null,
    };

  if (rounds.length === 0)
    return (
      <EmptyState
        title="No bracket yet"
        description="Generate a schedule with a knockout or playoff stage to see the bracket."
      />
    );

  return (
    <div className="space-y-8">
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-6">
          {rounds.map(([roundIndex, list]) => {
            const names = new Set(list.map((m) => m.round_name));
            const baseName = (list[0]?.round_name ?? `Round ${roundIndex}`).replace(
              /\s*·\s*Game\s*\d+.*$/i,
              "",
            );
            const showPerCardName = names.size > 1;
            return (
            <div key={roundIndex} className="flex w-64 flex-col justify-around gap-4">
              <h3 className="font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {baseName}
              </h3>
              {list.map((m) => {
                const aWin = m.score_a != null && m.score_b != null && m.score_a > m.score_b;
                const bWin = m.score_a != null && m.score_b != null && m.score_b > m.score_a;
                const isConditional = /\bif\s+(?:needed|necessary)\b/i.test(m.round_name ?? "");
                const qualifier = isConditional
                  ? "If necessary"
                  : (m.round_name?.match(/\(([^)]+)\)\s*$/)?.[1] ?? null);
                const cardLabel = m.round_name?.replace(/\s*\([^)]+\)\s*$/, "") ?? null;
                const gameTime = formatGameTime(m.scheduled_at);
                return (
                  <div key={m.id} className="surface-card animate-rise divide-y divide-border p-0">
                    {(showPerCardName || isConditional) && cardLabel && (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 pt-2">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          {cardLabel}
                        </span>
                        {qualifier && (
                          <span className="rounded-full border border-primary/40 bg-primary/10 px-1.5 py-px text-[9px] font-semibold normal-case tracking-normal text-primary">
                            {qualifier}
                          </span>
                        )}
                      </div>
                    )}
                    <div
                      className={`flex items-center justify-between px-3 py-2 text-sm ${aWin ? "font-semibold text-primary" : ""}`}
                    >
                      <TeamChip
                        name={side(m.team_a_id, m.placeholder_a).name}
                        logoUrl={side(m.team_a_id, m.placeholder_a).logo_url}
                        color={side(m.team_a_id, m.placeholder_a).jersey_color}
                        className="min-w-0"
                      />
                      <span className="tabular-nums">{m.score_a ?? "–"}</span>
                    </div>
                    <div
                      className={`flex items-center justify-between px-3 py-2 text-sm ${bWin ? "font-semibold text-primary" : ""}`}
                    >
                      <TeamChip
                        name={side(m.team_b_id, m.placeholder_b).name}
                        logoUrl={side(m.team_b_id, m.placeholder_b).logo_url}
                        color={side(m.team_b_id, m.placeholder_b).jersey_color}
                        className="min-w-0"
                      />
                      <span className="tabular-nums">{m.score_b ?? "–"}</span>
                    </div>
                    <div className="flex items-start gap-1.5 px-3 py-1.5 text-[11px] text-muted-foreground">
                      <CalendarDays className="mt-0.5 h-3 w-3 shrink-0" />
                      <span className="flex flex-col">
                        <span>
                          {formatDate(m.scheduled_at)}
                          {gameTime ? ` · ${gameTime}` : ""}
                        </span>
                        {!isFinalStatus(m.status) && (
                          <TipoffCountdown scheduledAt={m.scheduled_at} showDate={false} />
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            );
          })}
        </div>
      </div>
      <AutoAdRegion context="knockout" className="pt-8" />
    </div>
  );
}
