import type { MatchDraft, TeamRef } from "./formats";

export type FixtureTiming = {
  startDate: string;
  startTime: string;
  leagueMatchesPerDay: number;
  knockoutMatchesPerDay: number;
  minimumRestHours: number;
  matchDurationMinutes: number;
};

export function scheduleFixtureDates(drafts: MatchDraft[], teams: TeamRef[], options: FixtureTiming) {
  const { leagueMatchesPerDay, knockoutMatchesPerDay, minimumRestHours, matchDurationMinutes } = options;
  if (![leagueMatchesPerDay, knockoutMatchesPerDay].every((n) => Number.isInteger(n) && n >= 1 && n <= 24))
    throw new Error("Matches per day must be between 1 and 24");
  if (!Number.isFinite(minimumRestHours) || minimumRestHours < 0 || minimumRestHours > 168)
    throw new Error("Minimum rest must be between 0 and 168 hours");
  if (!Number.isInteger(matchDurationMinutes) || matchDurationMinutes < 30 || matchDurationMinutes > 240)
    throw new Error("Game duration must be between 30 and 240 minutes");
  const start = new Date(`${options.startDate}T${options.startTime}`);
  if (!Number.isFinite(start.getTime())) throw new Error("Choose a valid start date and time");
  if (start.getHours() * 60 + start.getMinutes() + matchDurationMinutes > 1440)
    throw new Error("Choose an earlier daily start time so a full game fits before midnight");
  const duration = matchDurationMinutes * 60_000;
  const rest = minimumRestHours * 3_600_000;
  const isLeague = (m: MatchDraft) => m.stage === "league" || m.stage === "group";
  const ordered = [...drafts].sort((a, b) => Number(!isLeague(a)) - Number(!isLeague(b)) || a.round_index - b.round_index || a.match_no - b.match_no);
  const participants = new Map<number, Set<string>>();
  const ends = new Map<number, number>();
  const lastEnd = new Map<string, number>();
  const counts = new Map<string, { league: number; knockout: number }>();
  let cursor = start.getTime();
  let leagueEnd = 0;
  const result: (MatchDraft & { scheduled_at: string })[] = [];
  for (const match of ordered) {
    const possible = new Set<string>();
    let ready = isLeague(match) ? 0 : leagueEnd + rest;
    for (const [id, placeholder] of [[match.team_a_id, match.placeholder_a], [match.team_b_id, match.placeholder_b]]) {
      if (id) possible.add(id);
      if (!placeholder) continue;
      const dependency = /(?:Winner|Loser|Runner-up)\s+M(\d+)/i.exec(placeholder);
      if (dependency?.[1]) {
        const no = Number(dependency[1]);
        const source = participants.get(no);
        const end = ends.get(no);
        if (!source || end === undefined) throw new Error(`Missing prerequisite for match ${match.match_no}`);
        source.forEach((team) => possible.add(team));
        ready = Math.max(ready, end + rest);
      } else {
        const group = /Group\s+([A-Z]+)/i.exec(placeholder)?.[1] ?? /__winner_([A-Z]+)__/i.exec(placeholder)?.[1];
        teams.filter((t) => !group || t.group_label?.toUpperCase() === group.toUpperCase()).forEach((t) => possible.add(t.id));
      }
    }
    possible.forEach((team) => { ready = Math.max(ready, (lastEnd.get(team) ?? 0) + rest); });
    let time = Math.max(cursor, ready);
    const kind = isLeague(match) ? "league" : "knockout";
    const limit = isLeague(match) ? leagueMatchesPerDay : knockoutMatchesPerDay;
    for (;;) {
      const date = new Date(time);
      const opening = new Date(date);
      opening.setHours(start.getHours(), start.getMinutes(), 0, 0);
      time = Math.max(time, opening.getTime());
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const day = counts.get(key) ?? { league: 0, knockout: 0 };
      const closing = new Date(opening);
      closing.setHours(24, 0, 0, 0);
      if (day[kind] < limit && time + duration <= closing.getTime()) {
        day[kind]++;
        counts.set(key, day);
        break;
      }
      opening.setDate(opening.getDate() + 1);
      time = opening.getTime();
    }
    const end = time + duration;
    participants.set(match.match_no, possible);
    ends.set(match.match_no, end);
    possible.forEach((team) => lastEnd.set(team, end));
    if (isLeague(match)) leagueEnd = Math.max(leagueEnd, end);
    cursor = end;
    result.push({ ...match, scheduled_at: new Date(time).toISOString() });
  }
  return result;
}