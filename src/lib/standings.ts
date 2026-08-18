export type StandingsMatch = {
  team_a_id: string | null;
  team_b_id: string | null;
  score_a: number | null;
  score_b: number | null;
  status: string;
  stage: string;
  group_label?: string | null;
  scheduled_at?: string | null;
  match_no?: number | null;
};

export type StandingsTeam = {
  id: string;
  name: string;
  logo_url?: string | null;
  jersey_color?: string | null;
  group_label?: string | null;
};

export type StandingRow = {
  rank: number;
  team: StandingsTeam;
  played: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  diff: number;
  points: number;
  winPct: number;
  ot: string;
  last3: string;
  streak: string;
  scheduled: number;
  remaining: number;
};

const LEAGUE_STAGES = new Set(["league", "group"]);

export function computeStandings(
  teams: StandingsTeam[],
  matches: StandingsMatch[],
  opts: { winPoints?: number; lossPoints?: number; groupLabel?: string | null } = {},
): StandingRow[] {
  const winPoints = opts.winPoints ?? 2;
  const lossPoints = opts.lossPoints ?? 0;
  const pool = teams.filter((t) => (opts.groupLabel ? (t.group_label ?? "") === opts.groupLabel : true));
  const base = new Map<string, StandingRow>(
    pool.map((t) => [
      t.id,
      {
        rank: 0,
        team: t,
        played: 0,
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        diff: 0,
        points: 0,
        winPct: 0,
        ot: "0-0",
        last3: "0-0",
        streak: "—",
        scheduled: 0,
        remaining: 0,
      },
    ]),
  );

  const completedOutcomes = new Map<string, { order: number; outcome: "W" | "L" }[]>();
  const bumpOutcome = (teamId: string, order: number, outcome: "W" | "L") =>
    completedOutcomes.set(teamId, [...(completedOutcomes.get(teamId) ?? []), { order, outcome }]);

  for (const m of matches) {
    if (!LEAGUE_STAGES.has(m.stage)) continue;
    if (m.status === "cancelled" || m.status === "postponed") continue;
    const a = m.team_a_id ? base.get(m.team_a_id) : undefined;
    const b = m.team_b_id ? base.get(m.team_b_id) : undefined;
    if (!a || !b) continue;

    // Scheduled count (includes played + upcoming)
    a.scheduled++;
    b.scheduled++;

    if (m.score_a == null || m.score_b == null) continue;
    a.played++;
    b.played++;
    a.pointsFor += m.score_a;
    a.pointsAgainst += m.score_b;
    b.pointsFor += m.score_b;
    b.pointsAgainst += m.score_a;
    if (m.score_a > m.score_b) {
      a.wins++;
      b.losses++;
      const order = m.scheduled_at ? new Date(m.scheduled_at).getTime() : (m.match_no ?? 0);
      bumpOutcome(a.team.id, order, "W");
      bumpOutcome(b.team.id, order, "L");
    } else if (m.score_b > m.score_a) {
      b.wins++;
      a.losses++;
      const order = m.scheduled_at ? new Date(m.scheduled_at).getTime() : (m.match_no ?? 0);
      bumpOutcome(a.team.id, order, "L");
      bumpOutcome(b.team.id, order, "W");
    }
  }

  const rows = [...base.values()].map((r) => ({
    ...r,
    diff: r.pointsFor - r.pointsAgainst,
    points: r.wins * winPoints + r.losses * lossPoints,
    winPct: r.played ? r.wins / r.played : 0,
    remaining: Math.max(0, r.scheduled - r.played),
  }));

  // Post-process form stats: last3 + streak
  rows.forEach((r) => {
    const list = (completedOutcomes.get(r.team.id) ?? []).sort((x, y) => x.order - y.order);
    const last = list.slice(-3);
    const w = last.filter((x) => x.outcome === "W").length;
    const l = last.length - w;
    r.last3 = `${w}-${l}`;
    if (list.length === 0) {
      r.streak = "—";
      return;
    }
    const tail = list[list.length - 1]!.outcome;
    let n = 0;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i]!.outcome !== tail) break;
      n++;
    }
    r.streak = `${tail}${n}`;
  });

  rows.sort(
    (x, y) =>
      y.points - x.points || y.winPct - x.winPct || y.diff - x.diff || y.pointsFor - x.pointsFor || x.team.name.localeCompare(y.team.name),
  );
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}
