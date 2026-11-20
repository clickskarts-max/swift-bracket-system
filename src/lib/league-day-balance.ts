import type { MatchDraft } from "./formats";

/** Search within the saved calendar: at most two games/day and one double-game day/team. */
export function balanceLeagueDates(matches: MatchDraft[], start: Date, days: number, limit: number, duration: number, rest: number) {
  const participants = (match: MatchDraft) => [...new Set([match.team_a_id, match.team_b_id])].filter((id): id is string => !!id);
  const totals = new Map<string, number>();
  matches.forEach(match => participants(match).forEach(id => totals.set(id, (totals.get(id) ?? 0) + 1)));
  if ([...totals.values()].some(total => total > days + 1))
    throw new Error("Cannot fit league games without repeating a team's double-game day. Add league days.");
  const quotas: number[] = [];
  let remaining = matches.length;
  for (let day = 0; day < days; day++) {
    const quota = Math.min(limit, Math.ceil(remaining / (days - day)));
    quotas.push(quota);
    remaining -= quota;
  }
  let attempts = 0;
  type Dated = MatchDraft & { scheduled_at: string };
  const opening = (day: number) => {
    const date = new Date(start);
    date.setDate(date.getDate() + day);
    return date.getTime();
  };
  const search = (pending: MatchDraft[], day: number, slot: number, cursor: number, daily: Map<string, number>, doubled: Set<string>, lastEnd: Map<string, number>, previousGroup: string | null, result: Dated[]): Dated[] | null => {
    if (!pending.length) return result;
    if (day >= days || ++attempts > 200_000) return null;
    if (slot >= (quotas[day] ?? 0)) return search(pending, day + 1, 0, opening(day + 1), new Map(), doubled, lastEnd, previousGroup, result);
    const closing = new Date(opening(day));
    closing.setHours(24, 0, 0, 0);
    const candidates = pending.flatMap(match => {
      const ids = participants(match);
      if (ids.some(id => (daily.get(id) ?? 0) >= 2 || ((daily.get(id) ?? 0) >= 1 && doubled.has(id)))) return [];
      const time = Math.max(cursor, ...ids.map(id => (lastEnd.get(id) ?? (opening(day) - rest)) + rest));
      return time + duration <= closing.getTime() ? [{ match, ids, time }] : [];
    }).sort((a, b) => a.time - b.time || Number(a.match.group_label === previousGroup) - Number(b.match.group_label === previousGroup) || a.match.round_index - b.match.round_index || a.match.match_no - b.match.match_no);
    for (const candidate of candidates) {
      const nextDaily = new Map(daily), nextDoubled = new Set(doubled), nextEnd = new Map(lastEnd);
      candidate.ids.forEach(id => {
        const count = (nextDaily.get(id) ?? 0) + 1;
        nextDaily.set(id, count);
        if (count === 2) nextDoubled.add(id);
        nextEnd.set(id, candidate.time + duration);
      });
      const nextPending = pending.filter(match => match !== candidate.match);
      const demand = new Map<string, number>();
      nextPending.forEach(match => participants(match).forEach(id => demand.set(id, (demand.get(id) ?? 0) + 1)));
      const futureDays = days - day - 1;
      // Reserve enough remaining appearances for every team, not just the next fixture.
      if ([...demand].some(([id, count]) => count > Math.max(0, 1 - (nextDaily.get(id) ?? 0)) + futureDays + (nextDoubled.has(id) ? 0 : 1))) continue;
      const found = search(nextPending, day, slot + 1, candidate.time + duration, nextDaily, nextDoubled, nextEnd, candidate.match.group_label, [...result, { ...candidate.match, scheduled_at: new Date(candidate.time).toISOString() }]);
      if (found) return found;
    }
    return null;
  };
  const result = search([...matches].sort((a, b) => a.round_index - b.round_index || a.match_no - b.match_no), 0, 0, start.getTime(), new Map(), new Set(), new Map(), null, []);
  if (!result) throw new Error("Cannot fit league games with this rest time and no repeated double-game days. Add days, start earlier, or adjust rest.");
  return result;
}