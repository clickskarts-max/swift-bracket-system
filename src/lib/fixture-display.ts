type DisplayFixture = {
  id: string;
  scheduled_at: string | null;
  match_no: number | null;
  status: string;
};

// Keep stored numbers intact: knockout prerequisites refer to those numbers.
export function fixtureDisplayNumbers(matches: readonly DisplayFixture[]): Map<string, number> {
  const time = (match: DisplayFixture) => {
    const timestamp = match.scheduled_at ? Date.parse(match.scheduled_at) : NaN;
    return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
  };
  const ordered = matches.filter(match => match.status !== "cancelled").sort((a, b) =>
    (time(a) - time(b) || 0) ||
    ((a.match_no ?? Number.POSITIVE_INFINITY) - (b.match_no ?? Number.POSITIVE_INFINITY) || 0) ||
    a.id.localeCompare(b.id)
  );
  return new Map(ordered.map((match, index) => [match.id, index + 1]));
}