export type MovableFixture = {
  id: string;
  scheduled_at: string | null;
  status: string;
  match_no: number | null;
  team_a_id: string | null;
  team_b_id: string | null;
  placeholder_a: string | null;
  placeholder_b: string | null;
};
export type FixtureMove = "up" | "down" | "previous-day" | "next-day";

export function planFixtureMove(matches: MovableFixture[], id: string, move: FixtureMove, restHours: number, durationMinutes: number) {
  const ordered = matches.filter((m) => m.status !== "cancelled" && m.scheduled_at)
    .sort((a, b) => Date.parse(a.scheduled_at ?? "") - Date.parse(b.scheduled_at ?? "") || (a.match_no ?? 0) - (b.match_no ?? 0));
  const index = ordered.findIndex((m) => m.id === id);
  const match = ordered[index];
  if (!match?.scheduled_at || match.status !== "scheduled") throw new Error("Only scheduled games with a date can be moved.");
  const updates = [{ id, expected_at: match.scheduled_at, scheduled_at: match.scheduled_at }];
  const dayOf = (iso: string) => new Date(iso).toDateString();
  const matchDay = dayOf(match.scheduled_at);
  const days = [...new Set(ordered.map((m) => dayOf(m.scheduled_at ?? "")))];
  const dayIndex = days.indexOf(matchDay);
  const step = move === "up" || move === "previous-day" ? -1 : 1;
  const neighbour = ordered[index + step];
  if ((move === "up" || move === "down") && neighbour?.scheduled_at && dayOf(neighbour.scheduled_at) === matchDay) {
    if (neighbour.status !== "scheduled") throw new Error("Cannot swap with a game that has already started.");
    if (neighbour.scheduled_at === match.scheduled_at) throw new Error("Set distinct game times before reordering these games.");
    updates[0] = { id, expected_at: match.scheduled_at, scheduled_at: neighbour.scheduled_at };
    updates.push({ id: neighbour.id, expected_at: neighbour.scheduled_at, scheduled_at: match.scheduled_at });
  } else if (move === "up" || move === "down") {
    // At a matchday edge: move the game into the adjacent matchday, after that day's last game.
    const targetDay = days[dayIndex + step];
    if (!targetDay) throw new Error("This game is already at the end of the schedule.");
    const dayGames = ordered.filter((m) => m.id !== id && dayOf(m.scheduled_at ?? "") === targetDay);
    const last = dayGames[dayGames.length - 1]!;
    updates[0] = { id, expected_at: match.scheduled_at, scheduled_at: new Date(Date.parse(last.scheduled_at ?? "") + durationMinutes * 60_000).toISOString() };
  } else {
    const targetDay = days[dayIndex + step];
    const date = new Date(match.scheduled_at);
    if (targetDay) {
      const t = new Date(targetDay);
      date.setFullYear(t.getFullYear(), t.getMonth(), t.getDate());
    } else date.setDate(date.getDate() + step);
    updates[0] = { id, expected_at: match.scheduled_at, scheduled_at: date.toISOString() };
  }
  const changed = new Map(updates.map((m) => [m.id, m.scheduled_at]));
  const proposed = ordered.map((m) => ({ ...m, scheduled_at: changed.get(m.id) ?? m.scheduled_at ?? "" }))
    .sort((a, b) => Date.parse(a.scheduled_at) - Date.parse(b.scheduled_at));
  const lastEnd = new Map<string, number>();
  const byNumber = new Map(proposed.map((m) => [m.match_no, m]));
  for (const m of proposed) {
    const start = Date.parse(m.scheduled_at);
    const paths = [m.team_a_id ?? m.placeholder_a, m.team_b_id ?? m.placeholder_b].filter((path): path is string => !!path);
    for (const path of paths) {
      const end = lastEnd.get(path);
      if (end !== undefined && start < end + restHours * 3_600_000)
        throw new Error("This move would overlap games or shorten a team's minimum rest. Choose another time.");
      lastEnd.set(path, start + durationMinutes * 60_000);
    }
    for (const placeholder of [m.placeholder_a, m.placeholder_b]) {
      const sourceNo = /(?:Winner|Loser|Runner-up)\s+M(\d+)/i.exec(placeholder ?? "")?.[1];
      if (!sourceNo) continue;
      const source = byNumber.get(Number(sourceNo));
      if (!source || start < Date.parse(source.scheduled_at) + durationMinutes * 60_000 + restHours * 3_600_000)
        throw new Error("This game must stay after its prerequisite game and rest time.");
    }
  }
  return updates;
}