export const BASKETBALL_EVENTS = [
  { value: "5x5_men", label: "5-on-5 Men" },
  { value: "5x5_women", label: "5-on-5 Women" },
  { value: "3x3_men", label: "3-on-3 Men" },
  { value: "3x3_women", label: "3-on-3 Women" },
] as const;

export type BasketballEvent = (typeof BASKETBALL_EVENTS)[number]["value"];
export const isBasketballEvent = (value: unknown): value is BasketballEvent =>
  BASKETBALL_EVENTS.some((event) => event.value === value);
export const eventLabel = (value: string | null | undefined) =>
  BASKETBALL_EVENTS.find((event) => event.value === value)?.label ?? "Main event";

type EventRecord = { id: string; parent_tournament_id: string | null; event_type: string | null };
/** Scope the switcher to exactly one parent; never mix competition data. */
export function tournamentFamily<T extends EventRecord>(rows: T[], parentId: string): T[] {
  return rows.filter((row) => row.id === parentId || row.parent_tournament_id === parentId)
    .sort((a, b) => {
      if (a.id === parentId) return -1;
      if (b.id === parentId) return 1;
      return BASKETBALL_EVENTS.findIndex((e) => e.value === a.event_type) - BASKETBALL_EVENTS.findIndex((e) => e.value === b.event_type);
    });
}

export function availableEventTypes(rows: EventRecord[]) {
  return BASKETBALL_EVENTS.filter((event) => !rows.some((row) => row.event_type === event.value));
}