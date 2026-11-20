import type { MatchDraft, TeamRef } from "./formats";
import { scheduleFixtureDates, type FixtureTiming } from "./fixture-timing";

type ExistingFixture = Omit<MatchDraft, "match_no" | "round_name"> & {
  id: string;
  match_no: number | null;
  round_name: string | null;
  status: string;
};

export function planFixtureDateUpdates(matches: ExistingFixture[], teams: TeamRef[], timing: FixtureTiming) {
  const active = matches.filter((match) => match.status !== "cancelled");
  if (!active.length) throw new Error("No existing fixtures. Generate the schedule first.");
  if (active.some((match) => match.status !== "scheduled"))
    throw new Error("Fixture dates can only be updated before games have started. Edit remaining games individually.");
  const ids = new Map<number, string>();
  const drafts = active.map((match): MatchDraft => {
    const no = match.match_no;
    if (no === null || ids.has(no)) throw new Error("Give every fixture a unique match number before updating dates.");
    ids.set(no, match.id);
    return { ...match, match_no: no, round_name: match.round_name ?? "" };
  });
  return scheduleFixtureDates(drafts, teams, timing).map((match) => {
    const id = ids.get(match.match_no);
    if (!id) throw new Error("Fixture not found");
    return { id, scheduled_at: match.scheduled_at };
  });
}