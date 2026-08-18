export type MatchDraft = {
  match_no: number;
  stage: string;
  round_name: string;
  round_index: number;
  leg: number;
  group_label: string | null;
  team_a_id: string | null;
  team_b_id: string | null;
  placeholder_a: string | null;
  placeholder_b: string | null;
};

export type TeamRef = {
  id: string;
  name: string;
  group_label?: string | null;
  seed?: number | null;
};

export const TOURNAMENT_FORMATS = [
  { value: "single_elimination", label: "Single elimination" },
  { value: "double_elimination", label: "Double elimination" },
  { value: "round_robin", label: "Round robin (multi-leg)" },
  { value: "league", label: "League" },
  { value: "group_knockout", label: "Group stage + knockout" },
] as const;

export const PLAYOFF_FORMATS = [
  { value: "none", label: "No playoff — league table decides" },
  { value: "top2_final", label: "Top 2 — straight final" },
  { value: "top4_semis", label: "Top 4 — semifinals + final (1v4, 2v3)" },
  { value: "top4_ipl", label: "Top 4 — Qualifier / Eliminator / Qualifier 2 / Final" },
  { value: "top6_ipl", label: "Top 6 — wildcards + qualifiers + final" },
] as const;

const mk = (
  n: number,
  stage: string,
  round_name: string,
  round_index: number,
  a: string | TeamRef | null,
  b: string | TeamRef | null,
  leg = 1,
  group_label: string | null = null,
): MatchDraft => ({
  match_no: n,
  stage,
  round_name,
  round_index,
  leg,
  group_label,
  team_a_id: typeof a === "object" && a ? a.id : null,
  team_b_id: typeof b === "object" && b ? b.id : null,
  placeholder_a: typeof a === "string" ? a : null,
  placeholder_b: typeof b === "string" ? b : null,
});

/** Circle-method round robin. legs >= 1; even legs mirror home/away. */
export function roundRobin(
  teams: TeamRef[],
  legs = 1,
  startNo = 1,
  groupLabel: string | null = null,
): MatchDraft[] {
  const list = [...teams];
  if (list.length < 2) return [];
  const bye = list.length % 2 === 1;
  if (bye) list.push({ id: "__bye__", name: "BYE" });
  const n = list.length;
  const half = n / 2;
  const out: MatchDraft[] = [];
  let no = startNo;
  let roundIndex = 1;
  for (let leg = 1; leg <= legs; leg++) {
    const rotation = [...list];
    for (let r = 0; r < n - 1; r++) {
      for (let i = 0; i < half; i++) {
        const home = rotation[i]!;
        const away = rotation[n - 1 - i]!;
        if (home.id === "__bye__" || away.id === "__bye__") continue;
        const swap = leg % 2 === 0;
        out.push(
          mk(
            no++,
            groupLabel ? "group" : "league",
            groupLabel
              ? `Group ${groupLabel} · Round ${leg} · Matchday ${r + 1}`
              : `Round ${leg} · Matchday ${r + 1}`,
            roundIndex,
            swap ? away : home,
            swap ? home : away,
            leg,
            groupLabel,
          ),
        );
      }
      roundIndex++;
      const fixed = rotation[0]!;
      const rest = rotation.slice(1);
      rest.unshift(rest.pop()!);
      rotation.splice(0, rotation.length, fixed, ...rest);
    }
  }
  return out;
}

const roundLabel = (teamsInRound: number) => {
  if (teamsInRound <= 2) return "Final";
  if (teamsInRound <= 4) return "Semifinal";
  if (teamsInRound <= 8) return "Quarterfinal";
  if (teamsInRound <= 16) return "Round of 16";
  return `Round of ${teamsInRound}`;
};

export function singleElimination(teams: TeamRef[], startNo = 1): MatchDraft[] {
  if (teams.length < 2) return [];
  let size = 1;
  while (size < teams.length) size *= 2;
  const seeded: (TeamRef | null)[] = Array.from({ length: size }, (_, i) => teams[i] ?? null);
  const out: MatchDraft[] = [];
  let no = startNo;
  let roundIndex = 1;
  let current: (TeamRef | string | null)[] = seeded;
  while (current.length > 1) {
    const next: (TeamRef | string | null)[] = [];
    const label = roundLabel(current.length);
    for (let i = 0; i < current.length; i += 2) {
      const a = current[i] ?? null;
      const b = current[i + 1] ?? null;
      if (a && !b) {
        next.push(a);
        continue;
      }
      const id = no++;
      out.push(mk(id, "knockout", label, roundIndex, a as never, b as never));
      next.push(`Winner M${id}`);
    }
    current = next;
    roundIndex++;
  }
  return out;
}

export function doubleElimination(teams: TeamRef[], startNo = 1): MatchDraft[] {
  const winners = singleElimination(teams, startNo);
  if (!winners.length) return [];
  const out = [...winners];
  let no = startNo + winners.length;
  // Losers bracket: pair losers of each winners-bracket round progressively.
  const rounds = new Map<number, MatchDraft[]>();
  winners.forEach((m) => rounds.set(m.round_index, [...(rounds.get(m.round_index) ?? []), m]));
  let carry: string[] = [];
  const roundKeys = [...rounds.keys()].sort((a, b) => a - b);
  let lbRound = 1;
  for (const key of roundKeys) {
    const losers = (rounds.get(key) ?? []).map((m) => `Loser M${m.match_no}`);
    const pool = [...carry, ...losers];
    carry = [];
    for (let i = 0; i < pool.length; i += 2) {
      if (!pool[i + 1]) {
        carry.push(pool[i]!);
        continue;
      }
      const id = no++;
      out.push(mk(id, "losers", `Losers Round ${lbRound}`, 100 + lbRound, pool[i]!, pool[i + 1]!));
      carry.push(`Winner M${id}`);
    }
    lbRound++;
  }
  const grandFinalOpponent = carry[0] ?? "Losers Bracket Winner";
  const wbFinal = winners[winners.length - 1]!;
  out.push(
    mk(no++, "final", "Grand Final", 200, `Winner M${wbFinal.match_no}`, grandFinalOpponent),
  );
  return out;
}

/**
 * Knockout stage after group play, following the reference format document.
 * 2 groups -> semis, 4 groups -> quarters, 8 groups -> pre-quarters.
 */
export function groupKnockout(groupLabels: string[], startNo = 1): MatchDraft[] {
  const g = groupLabels.length;
  const out: MatchDraft[] = [];
  let no = startNo;
  const W = (l: string) => `Winner ${l}`;
  const R = (l: string) => `Runner-up ${l}`;
  if (g >= 8) {
    const [a, b, c, d, e, f, gg, h] = groupLabels;
    const pairs: [string, string][] = [
      [W(a!), R(c!)],
      [W(b!), R(d!)],
      [W(c!), R(a!)],
      [W(d!), R(b!)],
      [W(e!), R(gg!)],
      [W(f!), R(h!)],
      [W(gg!), R(e!)],
      [W(h!), R(f!)],
    ];
    const pq = pairs.map(([x, y]) => {
      const id = no++;
      out.push(mk(id, "knockout", "Pre-Quarterfinal", 1, x, y));
      return `Winner M${id}`;
    });
    const qf: string[] = [];
    for (let i = 0; i < pq.length; i += 2) {
      const id = no++;
      out.push(mk(id, "knockout", "Quarterfinal", 2, pq[i]!, pq[i + 1]!));
      qf.push(`Winner M${id}`);
    }
    const sf: string[] = [];
    const semiPairs: [number, number][] = [
      [0, 2],
      [1, 3],
    ];
    for (const [x, y] of semiPairs) {
      const id = no++;
      out.push(mk(id, "knockout", "Semifinal", 3, qf[x]!, qf[y]!));
      sf.push(`Winner M${id}`);
    }
    out.push(mk(no++, "final", "Final", 4, sf[0]!, sf[1]!));
    return out;
  }
  if (g >= 4) {
    const [a, b, c, d] = groupLabels;
    const pairs: [string, string][] = [
      [W(a!), R(c!)],
      [W(c!), R(a!)],
      [W(b!), R(d!)],
      [W(d!), R(b!)],
    ];
    const qf = pairs.map(([x, y]) => {
      const id = no++;
      out.push(mk(id, "knockout", "Quarterfinal", 1, x, y));
      return `Winner M${id}`;
    });
    const sf: string[] = [];
    for (let i = 0; i < qf.length; i += 2) {
      const id = no++;
      out.push(mk(id, "knockout", "Semifinal", 2, qf[i]!, qf[i + 1]!));
      sf.push(`Winner M${id}`);
    }
    out.push(mk(no++, "final", "Final", 3, sf[0]!, sf[1]!));
    return out;
  }
  if (g >= 2) {
    const [a, b] = groupLabels;
    const s1 = no++;
    out.push(mk(s1, "knockout", "Semifinal", 1, W(a!), R(b!)));
    const s2 = no++;
    out.push(mk(s2, "knockout", "Semifinal", 1, W(b!), R(a!)));
    out.push(mk(no++, "final", "Final", 2, `Winner M${s1}`, `Winner M${s2}`));
    return out;
  }
  return out;
}

/** Playoff brackets driven by league standings seeds. */
export function playoffMatches(kind: string, startNo = 1): MatchDraft[] {
  const out: MatchDraft[] = [];
  let no = startNo;
  const seed = (n: number) => `Seed ${n}`;
  if (kind === "top2_final") {
    out.push(mk(no++, "final", "Final", 300, seed(1), seed(2)));
  } else if (kind === "top4_semis") {
    const s1 = no++;
    out.push(mk(s1, "playoff", "Semifinal 1", 300, seed(1), seed(4)));
    const s2 = no++;
    out.push(mk(s2, "playoff", "Semifinal 2", 300, seed(2), seed(3)));
    out.push(mk(no++, "final", "Final", 301, `Winner M${s1}`, `Winner M${s2}`));
  } else if (kind === "top4_ipl") {
    const q1 = no++;
    out.push(mk(q1, "playoff", "Qualifier 1", 300, seed(1), seed(2)));
    const el = no++;
    out.push(mk(el, "playoff", "Eliminator", 300, seed(3), seed(4)));
    const q2 = no++;
    out.push(mk(q2, "playoff", "Qualifier 2", 301, `Loser M${q1}`, `Winner M${el}`));
    out.push(mk(no++, "final", "Final", 302, `Winner M${q1}`, `Winner M${q2}`));
  } else if (kind === "top6_ipl") {
    const w1 = no++;
    out.push(mk(w1, "playoff", "Wildcard 1", 300, seed(3), seed(6)));
    const w2 = no++;
    out.push(mk(w2, "playoff", "Wildcard 2", 300, seed(4), seed(5)));
    const q1 = no++;
    out.push(mk(q1, "playoff", "Qualifier 1", 301, seed(1), seed(2)));
    const el = no++;
    out.push(mk(el, "playoff", "Eliminator", 301, `Winner M${w1}`, `Winner M${w2}`));
    const q2 = no++;
    out.push(mk(q2, "playoff", "Qualifier 2", 302, `Loser M${q1}`, `Winner M${el}`));
    out.push(mk(no++, "final", "Final", 303, `Winner M${q1}`, `Winner M${q2}`));
  }
  return out;
}

export type GenerateOptions = {
  format: string;
  legs: number;
  playoffFormat: string;
  teams: TeamRef[];
};

export function generateSchedule({
  format,
  legs,
  playoffFormat,
  teams,
}: GenerateOptions): MatchDraft[] {
  if (format === "single_elimination") return singleElimination(teams);
  if (format === "double_elimination") return doubleElimination(teams);
  if (format === "group_knockout") {
    const groups = new Map<string, TeamRef[]>();
    teams.forEach((t) => {
      const label = (t.group_label || "A").toUpperCase();
      groups.set(label, [...(groups.get(label) ?? []), t]);
    });
    const labels = [...groups.keys()].sort();
    let out: MatchDraft[] = [];
    let no = 1;
    for (const label of labels) {
      const rr = roundRobin(groups.get(label) ?? [], legs, no, label);
      no += rr.length;
      out = out.concat(rr);
    }
    return out.concat(groupKnockout(labels, no));
  }
  // league / round robin
  const rr = roundRobin(teams, legs);
  const playoffs = playoffMatches(playoffFormat, rr.length + 1);
  return rr.concat(playoffs);
}
