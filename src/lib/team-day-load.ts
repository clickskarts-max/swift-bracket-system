type TeamDayFixture = {
  id: string;
  scheduled_at: string | null;
  status: string;
  team_a_id: string | null;
  team_b_id: string | null;
};

export function teamDayLoads<T extends TeamDayFixture>(matches: readonly T[]) {
  const days = new Map<string, Map<string, T[]>>();
  for (const match of matches) {
    if (!match.scheduled_at || !["scheduled", "live", "completed"].includes(match.status)) continue;
    const date = new Date(match.scheduled_at);
    if (!Number.isFinite(date.getTime())) continue;
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const teams = days.get(day) ?? new Map<string, T[]>();
    for (const teamId of new Set([match.team_a_id, match.team_b_id])) {
      if (!teamId) continue;
      const games = teams.get(teamId) ?? [];
      if (!games.some(game => game.id === match.id)) games.push(match);
      teams.set(teamId, games);
    }
    days.set(day, teams);
  }
  return [...days].sort(([a], [b]) => a.localeCompare(b)).flatMap(([day, teams]) => {
    const repeated = [...teams].filter(([, games]) => games.length >= 2 && games.some(game => game.status !== "completed"))
      .map(([teamId, games]) => ({ teamId, games: games.sort((a, b) => Date.parse(a.scheduled_at ?? "") - Date.parse(b.scheduled_at ?? "")) }));
    return repeated.length ? [{ day, teams: repeated }] : [];
  });
}