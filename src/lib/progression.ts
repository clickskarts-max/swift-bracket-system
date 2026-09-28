import { computeStandings, type StandingsTeam } from "@/lib/standings";
import { isFinalStatus } from "@/lib/app";

type PMatch = {
  id: string;
  match_no: number | null;
  stage: string;
  status: string;
  group_label: string | null;
  team_a_id: string | null;
  team_b_id: string | null;
  placeholder_a: string | null;
  placeholder_b: string | null;
  score_a: number | null;
  score_b: number | null;
};

export type SlotUpdate = { id: string; team_a_id?: string; team_b_id?: string };

const LEAGUE = new Set(["league", "group"]);
const counts = (m: PMatch) => m.status !== "cancelled" && m.status !== "postponed";

/**
 * Works out which team fills each playoff/knockout placeholder
 * ("Seed 1", "1st Group A", "Winner M12", "Loser M3", ...) once the
 * matches it depends on are finished. Only fills empty slots.
 */
export function computeProgression(
  teams: StandingsTeam[],
  matches: PMatch[],
  format: string | null | undefined,
): SlotUpdate[] {
  const work = matches.map((m) => ({ ...m }));
  const leagueMatches = work.filter((m) => LEAGUE.has(m.stage) && counts(m));
  const leagueDone = (group?: string) => {
    const list = group
      ? leagueMatches.filter((m) => (m.group_label ?? "").toUpperCase() === group)
      : leagueMatches;
    return list.length > 0 && list.every((m) => isFinalStatus(m.status));
  };
  const standingsCache = new Map<string, ReturnType<typeof computeStandings>>();
  const standing = (group: string | null, rank: number) => {
    const key = group ?? "__all__";
    if (!standingsCache.has(key))
      standingsCache.set(
        key,
        computeStandings(teams, leagueMatches, { groupLabel: group, format }),
      );
    return standingsCache.get(key)![rank - 1]?.team.id ?? null;
  };
  const byNo = new Map<number, PMatch>();
  work.forEach((m) => m.match_no != null && byNo.set(m.match_no, m));

  const resolve = (ph: string | null): string | null => {
    if (!ph) return null;
    const p = ph.trim();
    let r = p.match(/^Seed (\d+)$/i);
    if (r) return leagueDone() ? standing(null, Number(r[1])) : null;
    r = p.match(/^__winner_([A-Z]+)__$/i);
    if (r) {
      const g = r[1]!.toUpperCase();
      return leagueDone(g) ? standing(g, 1) : null;
    }
    r = p.match(/^(\d+)(?:st|nd|rd|th)(?: Group)? ([A-Z]+)$/i);
    if (r) {
      const g = r[2]!.toUpperCase();
      return leagueDone(g) ? standing(g, Number(r[1])) : null;
    }
    r = p.match(/^(Winner|Loser|Runner-up) M(\d+)$/i);
    if (r) {
      const m = byNo.get(Number(r[2]));
      if (!m || !isFinalStatus(m.status) || !m.team_a_id || !m.team_b_id) return null;
      if (m.score_a == null || m.score_b == null || m.score_a === m.score_b) return null;
      const aWon = m.score_a > m.score_b;
      const wantWinner = r[1]!.toLowerCase() === "winner";
      return wantWinner === aWon ? m.team_a_id : m.team_b_id;
    }
    return null;
  };

  const updates = new Map<string, SlotUpdate>();
  for (let pass = 0; pass < 8; pass++) {
    let changed = false;
    for (const m of work) {
      if (LEAGUE.has(m.stage)) continue;
      if (!m.team_a_id) {
        const t = resolve(m.placeholder_a);
        if (t) {
          m.team_a_id = t;
          updates.set(m.id, { ...(updates.get(m.id) ?? { id: m.id }), team_a_id: t });
          changed = true;
        }
      }
      if (!m.team_b_id) {
        const t = resolve(m.placeholder_b);
        if (t) {
          m.team_b_id = t;
          updates.set(m.id, { ...(updates.get(m.id) ?? { id: m.id }), team_b_id: t });
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  return [...updates.values()];
}
