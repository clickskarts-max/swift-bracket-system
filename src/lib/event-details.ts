import type { Json } from "@/integrations/supabase/types";
import { eventLabel } from "./tournament-events";

export const EVENT_AGE_GROUPS = [
  { value: "open", label: "Open / no age group" },
  { value: "u25", label: "Under 25" },
  { value: "u19", label: "Under 19" },
] as const;
export type EventAgeGroup = "u25" | "u19";
export function eventConfig(config: Json | undefined): Record<string, Json | undefined> {
  return config && typeof config === "object" && !Array.isArray(config) ? config : {};
}
export function eventAgeGroup(config: Json | undefined): EventAgeGroup | null {
  const value = eventConfig(config)["age_group"];
  return value === "u25" || value === "u19" ? value : null;
}
export function eventTitle(event: { event_type: string | null; config: Json }) {
  const age = eventAgeGroup(event.config);
  return `${eventLabel(event.event_type)}${age ? ` · ${age === "u25" ? "Under 25" : "Under 19"}` : ""}`;
}
export function competitionEvents<T extends { id: string; parent_tournament_id: string | null; event_type: string | null; config: Json }>(events: T[]) {
  return events.filter(event => event.parent_tournament_id !== null || (event.event_type !== null && eventConfig(event.config)["event_container"] !== true));
}
export function isEventDirectory(tournament: { parent_tournament_id: string | null; config: Json }, childCount: number) {
  return !tournament.parent_tournament_id && (eventConfig(tournament.config)["event_container"] === true || childCount > 0);
}