import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";

const schema = z.object({
  timingMode: z.enum(["daily", "fixed"]),
  startDate: z.string(),
  startTime: z.string(),
  leagueLimit: z.number().int().min(0).max(24),
  knockoutLimit: z.number().int().min(1).max(24),
  restHours: z.number().min(0).max(168),
  durationMinutes: z.number().int().min(30).max(240),
  leagueDays: z.number().int().min(0).max(60),
  knockoutDays: z.number().int().min(1).max(60),
  restDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(60).default([]),
});
export type FixtureSettings = z.infer<typeof schema>;

export function readFixtureSettings(config: Json, startDate: string | null): FixtureSettings {
  const saved = config && typeof config === "object" && !Array.isArray(config) ? config["fixture_settings"] : null;
  const parsed = schema.safeParse(saved);
  return parsed.success ? parsed.data : {
    timingMode: "fixed", startDate: startDate ?? "", startTime: "09:00",
    leagueLimit: 5, knockoutLimit: 2, restHours: 2, durationMinutes: 90,
    leagueDays: 4, knockoutDays: 2, restDates: [],
  };
}

export function withFixtureSettings(config: Json, settings: FixtureSettings): Json {
  return {
    ...(config && typeof config === "object" && !Array.isArray(config) ? config : {}),
    fixture_settings: schema.parse(settings),
  };
}