export type PeriodScores = { a: (number | null)[]; b: (number | null)[] };

export const QUARTERS = 4;

export const emptyPeriods = (): PeriodScores => ({
  a: Array.from({ length: QUARTERS }, () => null),
  b: Array.from({ length: QUARTERS }, () => null),
});

const toCell = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

export function parsePeriods(raw: unknown): PeriodScores {
  const base = emptyPeriods();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const rec = raw as { a?: unknown; b?: unknown };
  const a = Array.isArray(rec.a) ? rec.a.map(toCell) : [];
  const b = Array.isArray(rec.b) ? rec.b.map(toCell) : [];
  const len = Math.max(QUARTERS, a.length, b.length);
  return {
    a: Array.from({ length: len }, (_, i) => a[i] ?? null),
    b: Array.from({ length: len }, (_, i) => b[i] ?? null),
  };
}

export const hasPeriodScores = (p: PeriodScores) =>
  [...p.a, ...p.b].some((v) => v != null);

export const periodTotal = (cells: (number | null)[]) =>
  cells.reduce<number>((sum, v) => sum + (v ?? 0), 0);

export const periodLabel = (index: number) =>
  index < QUARTERS ? `Q${index + 1}` : `OT${index - QUARTERS + 1}`;

export type PlayerStatLine = {
  player_id: string;
  points: number;
  rebounds: number;
  assists: number;
  fouls: number;
};

export const emptyStatLine = (playerId: string): PlayerStatLine => ({
  player_id: playerId,
  points: 0,
  rebounds: 0,
  assists: 0,
  fouls: 0,
});

const toNum = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export function parsePlayerStats(raw: unknown): PlayerStatLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .filter((r) => typeof r['player_id'] === "string")
    .map((r) => ({
      player_id: r['player_id'] as string,
      points: toNum(r['points']),
      rebounds: toNum(r['rebounds']),
      assists: toNum(r['assists']),
      fouls: toNum(r['fouls']),
    }));
}
