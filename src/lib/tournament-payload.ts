import type { Json } from "@/integrations/supabase/types";

export function readGroupCapacities(config: Json | undefined): Record<string, number> | null {
  if (!config || typeof config !== "object" || Array.isArray(config)) return null;
  const capacities = config["group_capacities"];
  if (!capacities || typeof capacities !== "object" || Array.isArray(capacities)) return null;
  const entries = Object.entries(capacities);
  if (!entries.every(([, value]) => typeof value === "number" && Number.isInteger(value) && value >= 0)) return null;
  return Object.fromEntries(entries) as Record<string, number>;
}

/** Form-only collections must never be sent as tournament table columns. */
export function tournamentPayload(values: Record<string, unknown>) {
  const { teams: _teams, venues: _venues, group_capacities, ...payload } = values;
  if (group_capacities !== undefined) {
    const config = payload["config"];
    payload["config"] = {
      ...(config && typeof config === "object" && !Array.isArray(config) ? config : {}),
      group_capacities,
    };
  }
  return payload;
}