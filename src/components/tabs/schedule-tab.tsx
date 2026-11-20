import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  CalendarArrowUp,
  CalendarArrowDown,
  List,
  Table2,
  LayoutList,
  Pencil,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Save,
  X,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ScoreLine, StatusPill, TeamChip, Field } from "@/components/data-bits";
import { TipoffCountdown } from "@/components/tipoff-countdown";
import { FixtureSheet } from "@/components/tabs/fixture-sheet";
import { TeamDayNotice } from "@/components/tabs/team-day-notice";
import { formatDate, isFinalStatus, MATCH_STATUSES, toLocalInput } from "@/lib/app";
import { generateSchedule } from "@/lib/formats";
import { scheduleFixtureDates } from "@/lib/fixture-timing";
import { readFixtureSettings, withFixtureSettings } from "@/lib/fixture-settings";
import { planFixtureDateUpdates } from "@/lib/fixture-date-updates";
import { planFixtureMove, type FixtureMove } from "@/lib/fixture-movement";
import { fixtureDisplayNumbers } from "@/lib/fixture-display";
import {
  QUARTERS,
  emptyPeriods,
  emptyStatLine,
  hasPeriodScores,
  parsePeriods,
  parsePlayerStats,
  periodLabel,
  periodTotal,
  type PeriodScores,
  type PlayerStatLine,
} from "@/lib/periods";
import {
  useMatches,
  usePlayers,
  useTeams,
  useUpsert,
  useVenues,
  type Match,
  type Tournament,
  type Venue,
} from "@/lib/queries";

const pad2 = (n: number) => String(n).padStart(2, "0");
const dayKeyFromIso = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export function ScheduleTab({ tournament }: { tournament: Tournament }) {
  const tournamentId = tournament.id;
  const { data: matches = [] } = useMatches(tournamentId);
  const { data: teams = [] } = useTeams(tournamentId);
  const { data: players = [] } = usePlayers(tournamentId);
  const { data: venues = [] } = useVenues(tournamentId);
  const save = useUpsert("matches", [["matches", tournamentId]]);
  const qc = useQueryClient();
  const [bucket, setBucket] = useState<"fixtures" | "results">("fixtures");
  const [view, setView] = useState("cards");
  const [editing, setEditing] = useState<Match | null>(null);
  const [mode, setMode] = useState<"game" | "score">("game");
  const [busy, setBusy] = useState(false);
  const [generationOpen, setGenerationOpen] = useState(false);
  const [settingsOnly, setSettingsOnly] = useState(false);
  const [applying, setApplying] = useState(false);
  const [updatingDates, setUpdatingDates] = useState(false);
  const [savedSettings] = useState(() => readFixtureSettings(tournament.config, tournament.start_date));
  const [startDate, setStartDate] = useState(savedSettings.startDate);
  const [startTime, setStartTime] = useState(savedSettings.startTime);
  const [leagueLimit, setLeagueLimit] = useState(savedSettings.leagueLimit);
  const [knockoutLimit, setKnockoutLimit] = useState(savedSettings.knockoutLimit);
  const [restHours, setRestHours] = useState(savedSettings.restHours);
  const [durationMinutes, setDurationMinutes] = useState(savedSettings.durationMinutes);
  const [timingMode, setTimingMode] = useState<string>(savedSettings.timingMode);
  const [leagueDays, setLeagueDays] = useState(savedSettings.leagueDays);
  const [knockoutDays, setKnockoutDays] = useState(savedSettings.knockoutDays);
  const generationPreview = useMemo(() => {
    if (timingMode !== "fixed") return null;
    try {
      const drafts = settingsOnly && matches.length
        ? matches.filter((m) => m.status !== "cancelled").map((m) => {
            if (m.match_no === null) throw new Error("Give every fixture a match number before updating dates.");
            return { ...m, match_no: m.match_no, round_name: m.round_name ?? "" };
          })
        : generateSchedule({ format: tournament.format, legs: tournament.legs, qualifiersPerGroup: tournament.qualifiers_per_group, playoffFormat: tournament.playoff_format, teams });
      const fixtures = scheduleFixtureDates(drafts, teams, {
        startDate, startTime, leagueMatchesPerDay: leagueLimit,
        knockoutMatchesPerDay: knockoutLimit,
        minimumRestHours: restHours, matchDurationMinutes: durationMinutes,
        phaseDays: { league: leagueDays, knockout: knockoutDays },
      });
      const daily = new Map<string, number>();
      fixtures.forEach((m) => { const key = dayKeyFromIso(m.scheduled_at); daily.set(key, (daily.get(key) ?? 0) + 1); });
      return { fixtures, daily: [...daily], error: "" };
    } catch (error) {
      return { fixtures: [], daily: [], error: error instanceof Error ? error.message : "Cannot fit the schedule" };
    }
  }, [settingsOnly, matches, timingMode, teams, tournament, startDate, startTime, leagueDays, knockoutDays, leagueLimit, knockoutLimit, restHours, durationMinutes]);
  const visibleMatches = useMemo(
    () => matches.filter((match) => match.status !== "cancelled"),
    [matches],
  );
  const displayNumbers = useMemo(() => fixtureDisplayNumbers(matches), [matches]);

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const swapSides = (m: Match) => {
    save.mutate(
      {
        id: m.id,
        tournament_id: m.tournament_id,
        team_a_id: m.team_b_id,
        team_b_id: m.team_a_id,
        placeholder_a: m.placeholder_b,
        placeholder_b: m.placeholder_a,
        score_a: m.score_b,
        score_b: m.score_a,
      },
      {
        onSuccess: () => toast.success("Home and away switched"),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const label = (m: Match, side: "a" | "b") => {
    const id = side === "a" ? m.team_a_id : m.team_b_id;
    const team = id ? teamById.get(id) : undefined;
    return (
      team ?? {
        name: (side === "a" ? m.placeholder_a : m.placeholder_b) ?? "TBD",
        logo_url: null,
        jersey_color: null,
      }
    );
  };

  const applySettings = async () => {
    setApplying(true);
    try {
      if (generationPreview?.error) throw new Error(generationPreview.error);
      if (timingMode !== "daily" && timingMode !== "fixed") throw new Error("Choose a scheduling plan");
      if (timingMode === "daily") scheduleFixtureDates([], teams, {
        startDate, startTime, leagueMatchesPerDay: leagueLimit, knockoutMatchesPerDay: knockoutLimit,
        minimumRestHours: restHours, matchDurationMinutes: durationMinutes,
      });
      const current = await supabase.from("tournaments").select("config").eq("id", tournamentId).single();
      if (current.error) throw new Error(current.error.message);
      const config = withFixtureSettings(current.data.config, {
        timingMode, startDate, startTime, leagueLimit, knockoutLimit, restHours, durationMinutes, leagueDays, knockoutDays,
      });
      const updated = await supabase.from("tournaments").update({ config }).eq("id", tournamentId).select("id").single();
      if (updated.error) throw new Error(updated.error.message);
      await qc.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      setGenerationOpen(false);
      toast.success("Fixture settings applied — existing matches unchanged");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not apply fixture settings");
    } finally { setApplying(false); }
  };

  const updateFixtureDates = async () => {
    setUpdatingDates(true);
    try {
      const current = await supabase.from("matches").select("*").eq("tournament_id", tournamentId);
      if (current.error) throw new Error(current.error.message);
      const dates = planFixtureDateUpdates(current.data, teams, {
        startDate, startTime, leagueMatchesPerDay: leagueLimit, knockoutMatchesPerDay: knockoutLimit,
        minimumRestHours: restHours, matchDurationMinutes: durationMinutes,
        ...(timingMode === "fixed" ? { phaseDays: { league: leagueDays, knockout: knockoutDays } } : {}),
      });
      const result = await supabase.rpc("update_fixture_dates", { _tournament_id: tournamentId, _dates: dates });
      if (result.error) throw new Error(result.error.message);
      await qc.invalidateQueries({ queryKey: ["matches", tournamentId] });
      setGenerationOpen(false);
      toast.success(`${result.data} fixture dates updated — matchups and scores unchanged`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update fixture dates");
    } finally { setUpdatingDates(false); }
  };

  const regenerate = async () => {
    if (teams.length < 2) {
      toast.error("Add at least two teams first");
      return;
    }
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const owner_id = userData.user?.id;
      if (!owner_id) throw new Error("Sign in required");
      const untimedDrafts = generateSchedule({
        format: tournament.format,
        legs: tournament.legs,
        qualifiersPerGroup: tournament.qualifiers_per_group,
        playoffFormat: tournament.playoff_format,
        teams: teams.map((t) => ({
          id: t.id,
          name: t.name,
          group_label: t.group_label,
          seed: t.seed,
        })),
      });
      if (generationPreview?.error) throw new Error(generationPreview.error);
      const drafts = generationPreview?.fixtures ?? scheduleFixtureDates(untimedDrafts, teams, {
        startDate, startTime, leagueMatchesPerDay: leagueLimit,
        knockoutMatchesPerDay: knockoutLimit, minimumRestHours: restHours,
        matchDurationMinutes: durationMinutes,
      });
      if (drafts.length === 0) throw new Error("This configuration produced no matches");
      const del = await supabase.from("matches").delete().eq("tournament_id", tournamentId);
      if (del.error) throw new Error(del.error.message);
      const ins = await supabase
        .from("matches")
        .insert(drafts.map((d) => ({ ...d, tournament_id: tournamentId, owner_id })));
      if (ins.error) throw new Error(ins.error.message);
      await qc.invalidateQueries({ queryKey: ["matches", tournamentId] });
      setGenerationOpen(false);
      toast.success(`${drafts.length} matches generated`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate the schedule");
    } finally {
      setBusy(false);
    }
  };

  const matchdayByDate = useMemo(() => {
    const keys = [
      ...new Set(
        visibleMatches
          .filter((m) => !!m.scheduled_at)
          .map((m) => dayKeyFromIso(m.scheduled_at as string)),
      ),
    ].sort();
    return new Map(keys.map((k, i) => [k, i + 1]));
  }, [visibleMatches]);

  const listGroupKey = (m: Match) => {
    if (!m.scheduled_at) return "Unscheduled";
    const md = matchdayByDate.get(dayKeyFromIso(m.scheduled_at)) ?? 1;
    return `Matchday ${md} · ${formatDate(m.scheduled_at)}`;
  };

  const moveIndividualMatch = async (match: Match, direction: FixtureMove) => {
    setBusy(true);
    try {
      const current = await supabase.from("matches").select("*").eq("tournament_id", tournamentId);
      if (current.error) throw new Error(current.error.message);
      const settings = readFixtureSettings(tournament.config, tournament.start_date);
      const updates = planFixtureMove(current.data, match.id, direction, settings.restHours, settings.durationMinutes);
      const result = await supabase.rpc("move_fixture_slots", { _tournament_id: tournamentId, _moves: updates });
      if (result.error) throw new Error(result.error.message);
      await qc.invalidateQueries({ queryKey: ["matches", tournamentId] });
      toast.success(direction === "up" || direction === "down" ? "Match order updated" : "Match day updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not move this game");
    } finally {
      setBusy(false);
    }
  };

  const resultGroupKey = (m: Match) => {
    if (!m.scheduled_at) return "Unscheduled";
    const md = matchdayByDate.get(dayKeyFromIso(m.scheduled_at)) ?? 1;
    return `Matchday ${md}`;
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Match[]>();
    const pool = visibleMatches.filter((m) =>
      bucket === "results" ? isFinalStatus(m.status) : !isFinalStatus(m.status),
    );
    for (const m of pool) {
      const key = bucket === "results" ? resultGroupKey(m) : listGroupKey(m);
      map.set(key, [...(map.get(key) ?? []), m]);
    }
    const desc = bucket === "results";
    const compareMatch = (a: Match, b: Match) => {
      const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
      const base =
        ta - tb ||
        (a.match_no ?? Number.POSITIVE_INFINITY) - (b.match_no ?? Number.POSITIVE_INFINITY);
      return desc ? -base : base;
    };

    const entries = [...map.entries()].map(
      ([k, list]) => [k, [...list].sort(compareMatch)] as [string, Match[]],
    );
    const groupTime = (list: Match[]) =>
      Math.min(
        ...list.map((m) =>
          m.scheduled_at ? new Date(m.scheduled_at).getTime() : Number.POSITIVE_INFINITY,
        ),
      );

    // Completed matches: newest first. Upcoming: earliest tip-off first.
    return entries.sort(([, la], [, lb]) =>
      desc ? groupTime(lb) - groupTime(la) : groupTime(la) - groupTime(lb),
    );

  }, [visibleMatches, bucket, matchdayByDate]);

  const completedCount = visibleMatches.filter((m) => isFinalStatus(m.status)).length;

  return (
    <div className="min-w-0 max-w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2 font-semibold">
          <List className="h-4 w-4 text-primary" />
          <span>Fixtures</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" disabled={busy} onClick={() => { setSettingsOnly(true); setGenerationOpen(true); }}>
          <SlidersHorizontal className="mr-1.5 h-4 w-4" /> Fixture settings
        </Button>
        <AlertDialog open={generationOpen} onOpenChange={setGenerationOpen}>
          <AlertDialogTrigger asChild>
            <Button disabled={busy} onClick={() => setSettingsOnly(false)}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Generate schedule
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-h-[90dvh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>{settingsOnly ? "Fixture settings" : "Regenerate the full schedule?"}</AlertDialogTitle>
              <AlertDialogDescription>
                {settingsOnly ? "Apply settings saves the plan only. Update fixture dates applies this plan to current games without replacing matchups or scores." : "All existing matches, scores and match details for this tournament will be replaced by a fresh fixture list."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Field label="Scheduling plan">
              <Select value={timingMode} onValueChange={(value) => { setTimingMode(value); }}>
                <SelectTrigger aria-label="Scheduling plan"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily match limits</SelectItem>
                  <SelectItem value="fixed">Fixed tournament days</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="First match date"><Input aria-label="First match date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
              <Field label="Daily start time"><Input aria-label="Daily start time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></Field>
              {timingMode === "fixed" ? <>
                <Field label="League days"><Input aria-label="League days" type="number" min={1} max={60} value={leagueDays} onChange={(e) => setLeagueDays(Number(e.target.value))} /></Field>
                <Field label="Knockout days"><Input aria-label="Knockout days" type="number" min={1} max={60} value={knockoutDays} onChange={(e) => setKnockoutDays(Number(e.target.value))} /></Field>
              </> : null}
                <Field label="League matches per day"><Input aria-label="League matches per day" type="number" min={1} max={24} value={leagueLimit} onChange={(e) => setLeagueLimit(Number(e.target.value))} /></Field>
                <Field label="Knockout matches per day"><Input aria-label="Knockout matches per day" type="number" min={1} max={24} value={knockoutLimit} onChange={(e) => setKnockoutLimit(Number(e.target.value))} /></Field>
              <Field label="Minimum team rest (hours)"><Input aria-label="Minimum team rest (hours)" type="number" min={0} max={168} value={restHours} onChange={(e) => setRestHours(Number(e.target.value))} /></Field>
              <Field label="Game duration (minutes)"><Input aria-label="Game duration (minutes)" type="number" min={30} max={240} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} /></Field>
            </div>
            <p className="text-xs font-medium text-primary">League: at most 2 games per team in a day, with no team assigned a second double-game day.</p>
            {generationPreview && <div className="space-y-2 text-sm">
              <p className="font-semibold">{leagueDays + knockoutDays} days · League days 1–{leagueDays} · Knockout days {leagueDays + 1}–{leagueDays + knockoutDays}</p>
              <p>League: {leagueLimit} matches/day × {leagueDays} days = {leagueLimit * leagueDays} match capacity</p>
              <p>Knockout: {knockoutLimit} matches/day × {knockoutDays} days = {knockoutLimit * knockoutDays} match capacity</p>
              {generationPreview.error ? <p role="alert" className="text-destructive">{generationPreview.error}</p> :
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">{generationPreview.daily.map(([date, count]) => <p key={date}>{formatDate(date)} · {count} matches</p>)}</div>}
            </div>}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={applying || updatingDates}>Cancel</AlertDialogCancel>
              {settingsOnly ? <>
                <Button variant="outline" disabled={applying || updatingDates || !!generationPreview?.error} onClick={applySettings}><Save className="mr-1.5 h-4 w-4" />{applying ? "Applying…" : "Apply settings"}</Button>
                <Button disabled={applying || updatingDates || !visibleMatches.length || !!generationPreview?.error} onClick={updateFixtureDates}><RefreshCw className="mr-1.5 h-4 w-4" />{updatingDates ? "Updating…" : "Update fixture dates"}</Button>
              </> : <Button disabled={busy || !!generationPreview?.error} onClick={regenerate}>{busy ? "Generating…" : "Generate"}</Button>}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
      <Tabs value={bucket} onValueChange={(v) => setBucket(v as "fixtures" | "results")}>
        <TabsList>
          <TabsTrigger value="fixtures">Upcoming ({visibleMatches.length - completedCount})</TabsTrigger>
          <TabsTrigger value="results">Completed ({completedCount})</TabsTrigger>
        </TabsList>
      </Tabs>
      <Tabs value={view} onValueChange={setView}>
        <TabsList aria-label="Fixture view">
          <TabsTrigger value="cards"><LayoutList className="mr-1.5 h-4 w-4" />Cards</TabsTrigger>
          <TabsTrigger value="sheet"><Table2 className="mr-1.5 h-4 w-4" />Sheet</TabsTrigger>
        </TabsList>
      </Tabs>
      </div>

      {bucket === "fixtures" && <TeamDayNotice matches={matches} teams={teams} displayNumbers={displayNumbers} matchdayByDate={matchdayByDate} />}

      {grouped.length === 0 ? (
        <EmptyState
          title={bucket === "results" ? "No completed matches yet" : "No upcoming matches"}
          description={
            bucket === "results"
              ? "Matches move here automatically once their final score is saved."
              : "Generate the fixture list from your teams and format."
          }
        />
      ) : view === "sheet" ? (
        <FixtureSheet grouped={grouped} displayNumbers={displayNumbers} label={label} venues={venues} busy={busy || save.isPending}
          onMove={moveIndividualMatch} onSwap={swapSides}
          onEdit={(match) => { setMode("game"); setEditing(match); }}
          onScore={(match) => { setMode("score"); setEditing(match); }} />
      ) : (
        <div className="space-y-6">
          {grouped.map(([round, list]) => (
            <div key={round}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  {round}
                </h3>
              </div>
              <div className="space-y-2">
                {list.map((m) => {
                  const a = label(m, "a");
                  const b = label(m, "b");
                  return (
                    <div key={m.id} data-match-id={m.id} className="surface-card p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                          M{displayNumbers.get(m.id) ?? "—"}
                          {m.group_label ? <span className="ml-2 font-semibold text-primary">Group {m.group_label}</span> : <span className="ml-2">{m.round_name ?? m.stage}</span>}
                        </span>
                        <StatusPill status={m.status} />
                      </div>
                      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-6">
                        <TeamChip
                          name={a.name}
                          logoUrl={a.logo_url}
                          color={a.jersey_color}
                          className="min-w-0"
                        />
                        <div className="flex flex-col items-center gap-1.5">
                          <ScoreLine
                            scoreA={m.score_a}
                            scoreB={m.score_b}
                            final={isFinalStatus(m.status)}
                          />
                          <span className="text-center text-xs text-muted-foreground">
                            {isFinalStatus(m.status) ? (
                              formatDate(m.scheduled_at)
                            ) : (
                              <TipoffCountdown scheduledAt={m.scheduled_at} />
                            )}
                          </span>
                          {m.scheduled_at && <span className="text-xs font-medium text-muted-foreground">{new Date(m.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                        </div>
                        <TeamChip
                          name={b.name}
                          logoUrl={b.logo_url}
                          color={b.jersey_color}
                          className="min-w-0 flex-row-reverse justify-start text-right"
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <TooltipProvider delayDuration={150}>
                          <div className="flex items-center gap-1">
                            {m.status === "scheduled" && ([
                              { direction: "up", label: "Move game up", Icon: ChevronUp },
                              { direction: "down", label: "Move game down", Icon: ChevronDown },
                              { direction: "previous-day", label: "Move game to previous day", Icon: CalendarArrowUp },
                              { direction: "next-day", label: "Move game to next day", Icon: CalendarArrowDown },
                            ] as const).map(({ direction, label: controlLabel, Icon }) => (
                              <Tooltip key={direction}>
                                <TooltipTrigger asChild><Button size="icon" variant="ghost" aria-label={`${controlLabel} M${displayNumbers.get(m.id)}`} disabled={busy || !m.scheduled_at} onClick={() => moveIndividualMatch(m, direction)}><Icon className="h-4 w-4" /></Button></TooltipTrigger>
                                <TooltipContent>{controlLabel}</TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        </TooltipProvider>
                        <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Switch home and away"
                          onClick={() => swapSides(m)}
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Edit match"
                          onClick={() => {
                            setMode("game");
                            setEditing(m);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setMode("score");
                            setEditing(m);
                          }}
                        >
                          Score
                        </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <MatchDialog
        match={editing}
        displayNumber={editing ? displayNumbers.get(editing.id) ?? null : null}
        mode={mode}
        teams={teams.map((t) => ({ id: t.id, name: t.name }))}
        venues={venues}
        players={players.map((p) => ({
          id: p.id,
          name: p.name,
          team_id: p.team_id,
          jersey_number: p.jersey_number,
        }))}
        onClose={() => setEditing(null)}
        pending={save.isPending}
        onSave={(values) =>
          save.mutate(values, {
            onSuccess: () => {
              toast.success("Match saved");
              setEditing(null);
            },
            onError: (e) => toast.error(e.message),
          })
        }
      />
    </div>
  );
}

function MatchDialog({
  match,
  displayNumber,
  mode,
  teams,
  venues,
  players,
  onClose,
  onSave,
  pending,
}: {
  match: Match | null;
  displayNumber: number | null;
  mode: "game" | "score";
  teams: { id: string; name: string }[];
  venues: Venue[];
  players: { id: string; name: string; team_id: string | null; jersey_number: number | null }[];
  onClose: () => void;
  onSave: (values: Record<string, unknown> & { id: string }) => void;
  pending: boolean;
}) {
  const [draft, setDraft] = useState<Match | null>(match);
  const [periods, setPeriods] = useState<PeriodScores>(() =>
    parsePeriods((match as { periods?: unknown } | null)?.periods),
  );
  const [stats, setStats] = useState<PlayerStatLine[]>(() =>
    parsePlayerStats((match as { player_stats?: unknown } | null)?.player_stats),
  );
  const [potm, setPotm] = useState<string | null>(
    (match as { player_of_match_id?: string | null } | null)?.player_of_match_id ?? null,
  );
  if (match && draft?.id !== match.id) {
    setDraft(match);
    setPeriods(parsePeriods((match as { periods?: unknown }).periods));
    setStats(parsePlayerStats((match as { player_stats?: unknown }).player_stats));
    setPotm((match as { player_of_match_id?: string | null }).player_of_match_id ?? null);
  }
  if (!draft) return null;
  const set = <K extends keyof Match>(k: K, v: Match[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  const usePeriods = hasPeriodScores(periods);
  const totalA = periodTotal(periods.a);
  const totalB = periodTotal(periods.b);
  const scoreA = usePeriods ? totalA : draft.score_a;
  const scoreB = usePeriods ? totalB : draft.score_b;
  const setCell = (side: "a" | "b", index: number, raw: string) =>
    setPeriods((p) => {
      const next = { a: [...p.a], b: [...p.b] };
      next[side][index] = raw === "" ? null : Number(raw);
      return next;
    });
  const addOvertime = () => setPeriods((p) => ({ a: [...p.a, null], b: [...p.b, null] }));
  const removeOvertime = () =>
    setPeriods((p) => (p.a.length > QUARTERS ? { a: p.a.slice(0, -1), b: p.b.slice(0, -1) } : p));

  const rosterFor = (teamId: string | null) =>
    teamId ? players.filter((p) => p.team_id === teamId) : [];
  const matchRoster = [...rosterFor(draft.team_a_id), ...rosterFor(draft.team_b_id)];
  const statFor = (playerId: string) =>
    stats.find((s) => s.player_id === playerId) ?? emptyStatLine(playerId);
  const setStat = (playerId: string, key: keyof PlayerStatLine, raw: string) => {
    const value = raw === "" ? 0 : Number(raw);
    setStats((list) => {
      const exists = list.some((s) => s.player_id === playerId);
      const next = exists
        ? list.map((s) => (s.player_id === playerId ? { ...s, [key]: value } : s))
        : [...list, { ...emptyStatLine(playerId), [key]: value }];
      return next;
    });
  };

  return (
    <Dialog open={!!match} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "score" ? "Score data" : "Game data"} · Match {displayNumber ?? draft.match_no ?? ""}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {mode === "game" && (
            <>
              <div className="rounded-lg border border-border p-3 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Forfeit (FIBA Art. 20)
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Opponent wins 20–0. The forfeiting team gets 0 classification points.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["a", "b"] as const).map((side) => {
                    const id = side === "a" ? draft.team_a_id : draft.team_b_id;
                    const name =
                      teams.find((t) => t.id === id)?.name ??
                      (side === "a" ? draft.placeholder_a : draft.placeholder_b) ??
                      (side === "a" ? "Home" : "Away");
                    const active =
                      draft.status === "forfeit" &&
                      (side === "a" ? draft.score_a === 0 : draft.score_b === 0);
                    return (
                      <Button
                        key={side}
                        type="button"
                        size="sm"
                        variant={active ? "destructive" : "outline"}
                        disabled={!draft.team_a_id || !draft.team_b_id}
                        onClick={() => {
                          setDraft((d) =>
                            d
                              ? {
                                  ...d,
                                  status: "forfeit",
                                  score_a: side === "a" ? 0 : 20,
                                  score_b: side === "a" ? 20 : 0,
                                }
                              : d,
                          );
                          setPeriods(emptyPeriods());
                          setStats([]);
                          setPotm(null);
                        }}
                      >
                        {name} forfeits
                      </Button>
                    );
                  })}
                  {draft.status === "forfeit" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setDraft((d) =>
                          d ? { ...d, status: "scheduled", score_a: null, score_b: null } : d,
                        )
                      }
                    >
                      Clear forfeit
                    </Button>
                  )}
                </div>
              </div>
              <Field label="Reference match number">
                <Input
                  type="number"
                  min={1}
                  value={draft.match_no ?? ""}
                  onChange={(e) => set("match_no", e.target.value ? Number(e.target.value) : null)}
                />
              </Field>
              <Field label="Home / away">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setPeriods((p) => ({ a: p.b, b: p.a }));
                    setDraft((d) =>
                      d
                        ? {
                            ...d,
                            team_a_id: d.team_b_id,
                            team_b_id: d.team_a_id,
                            placeholder_a: d.placeholder_b,
                            placeholder_b: d.placeholder_a,
                            score_a: d.score_b,
                            score_b: d.score_a,
                          }
                        : d,
                    );
                  }}
                >
                  <ArrowLeftRight className="mr-1.5 h-3.5 w-3.5" /> Switch sides
                </Button>
              </Field>
              <Field label="Home team">
                <Select
                  value={draft.team_a_id ?? "none"}
                  onValueChange={(v) => set("team_a_id", v === "none" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={draft.placeholder_a ?? "TBD"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{draft.placeholder_a ?? "TBD"}</SelectItem>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Away team">
                <Select
                  value={draft.team_b_id ?? "none"}
                  onValueChange={(v) => set("team_b_id", v === "none" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={draft.placeholder_b ?? "TBD"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{draft.placeholder_b ?? "TBD"}</SelectItem>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}
          {mode === "score" && (
            <>
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-base font-bold">
                    {teams.find((t) => t.id === draft.team_a_id)?.name ??
                      draft.placeholder_a ??
                      "Home team"}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Home
                  </span>
                </div>
                <Input
                  type="number"
                  min={0}
                  disabled={usePeriods}
                  value={usePeriods ? totalA : (draft.score_a ?? "")}
                  onChange={(e) => set("score_a", e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-base font-bold">
                    {teams.find((t) => t.id === draft.team_b_id)?.name ??
                      draft.placeholder_b ??
                      "Away team"}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Away
                  </span>
                </div>
                <Input
                  type="number"
                  min={0}
                  disabled={usePeriods}
                  value={usePeriods ? totalB : (draft.score_b ?? "")}
                  onChange={(e) => set("score_b", e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </>
          )}
          {mode === "game" && (
            <>
              <Field label="Tip-off">
                <Input
                  type="datetime-local"
                  value={toLocalInput(draft.scheduled_at)}
                  onChange={(e) =>
                    set(
                      "scheduled_at",
                      e.target.value ? new Date(e.target.value).toISOString() : null,
                    )
                  }
                />
              </Field>
              <Field label="Venue">
                <Select
                  value={(draft.venue_id as string) || "none"}
                  onValueChange={(v) => set("venue_id", v === "none" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select venue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No venue</SelectItem>
                    {venues.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={draft.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATCH_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Venue">
                <Input
                  value={draft.venue ?? ""}
                  onChange={(e) => set("venue", e.target.value || null)}
                />
              </Field>
              <Field label="Court">
                <Input
                  value={draft.court ?? ""}
                  onChange={(e) => set("court", e.target.value || null)}
                />
              </Field>
              <Field label="Referee">
                <Input
                  value={draft.referee ?? ""}
                  onChange={(e) => set("referee", e.target.value || null)}
                />
              </Field>
              <Field label="Notes">
                <Input
                  value={draft.notes ?? ""}
                  onChange={(e) => set("notes", e.target.value || null)}
                />
              </Field>
            </>
          )}
        </div>

        {mode === "score" && (
          <div className="mt-4 rounded-xl border border-border/60 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Score by quarter
              </p>
              <div className="flex items-center gap-1.5">
                {periods.a.length > QUARTERS && (
                  <Button type="button" variant="ghost" size="sm" onClick={removeOvertime}>
                    <X className="mr-1 h-3.5 w-3.5" /> Remove OT
                  </Button>
                )}
                <Button type="button" variant="outline" size="sm" onClick={addOvertime}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add OT
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="p-1 text-left font-medium">Team</th>
                    {periods.a.map((_, i) => (
                      <th key={i} className="p-1 text-center font-medium">
                        {periodLabel(i)}
                      </th>
                    ))}
                    <th className="p-1 text-center font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(["a", "b"] as const).map((side) => (
                    <tr key={side}>
                      <td className="max-w-[9rem] truncate p-1 text-xs">
                        {side === "a"
                          ? (teams.find((t) => t.id === draft.team_a_id)?.name ??
                            draft.placeholder_a ??
                            "Home")
                          : (teams.find((t) => t.id === draft.team_b_id)?.name ??
                            draft.placeholder_b ??
                            "Away")}
                      </td>
                      {periods[side].map((v, i) => (
                        <td key={i} className="p-1">
                          <Input
                            type="number"
                            min={0}
                            className="h-9 w-16 text-center"
                            value={v ?? ""}
                            onChange={(e) => setCell(side, i, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="p-1 text-center font-display font-bold">
                        {side === "a" ? totalA : totalB}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Entering quarter scores auto-updates the total score. Leave blank to enter totals
              manually.
            </p>
          </div>
        )}

        {mode === "score" && (
          <div className="mt-4 rounded-xl border border-border/60 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Player of the match
            </p>
            <Select value={potm ?? "none"} onValueChange={(v) => setPotm(v === "none" ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select player…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No award</SelectItem>
                {matchRoster.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.jersey_number != null ? `#${p.jersey_number} ` : ""}
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Player stats
            </p>
            {matchRoster.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Add players to both teams to record game stats.
              </p>
            ) : (
              <div className="space-y-4">
                {[["a", draft.team_a_id] as const, ["b", draft.team_b_id] as const].map(
                  ([side, teamId]) => {
                    const roster = rosterFor(teamId);
                    if (roster.length === 0) return null;
                    const teamName =
                      teams.find((t) => t.id === teamId)?.name ??
                      (side === "a"
                        ? (draft.placeholder_a ?? "Home")
                        : (draft.placeholder_b ?? "Away"));
                    return (
                      <div key={side} className="overflow-x-auto">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
                          {teamName}
                        </p>
                        <table className="w-full min-w-[420px] text-sm">
                          <thead>
                            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                              <th className="p-1 text-left font-medium">Player</th>
                              <th className="p-1 text-center font-medium">PTS</th>
                              <th className="p-1 text-center font-medium">REB</th>
                              <th className="p-1 text-center font-medium">AST</th>
                              <th className="p-1 text-center font-medium">PF</th>
                            </tr>
                          </thead>
                          <tbody>
                            {roster.map((p) => {
                              const s = statFor(p.id);
                              return (
                                <tr key={p.id}>
                                  <td className="max-w-[10rem] truncate p-1 text-xs">
                                    {p.jersey_number != null ? `#${p.jersey_number} ` : ""}
                                    {p.name}
                                  </td>
                                  {(["points", "rebounds", "assists", "fouls"] as const).map(
                                    (k) => (
                                      <td key={k} className="p-1">
                                        <Input
                                          type="number"
                                          min={0}
                                          className="h-9 w-16 text-center"
                                          value={s[k]}
                                          onChange={(e) => setStat(p.id, k, e.target.value)}
                                        />
                                      </td>
                                    ),
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </div>
        )}

        <Button
          disabled={pending}
          onClick={() =>
            onSave({
              id: draft.id,
              status:
                scoreA != null && scoreB != null && draft.status === "scheduled"
                  ? "completed"
                  : draft.status,
              match_no: draft.match_no,
              placeholder_a: draft.placeholder_a,
              placeholder_b: draft.placeholder_b,
              team_a_id: draft.team_a_id,
              team_b_id: draft.team_b_id,
              score_a: scoreA,
              score_b: scoreB,
              periods: usePeriods ? periods : emptyPeriods(),
              player_of_match_id: potm,
              player_stats: stats.filter((s) => s.points || s.rebounds || s.assists || s.fouls),
              scheduled_at: draft.scheduled_at,
              venue: draft.venue,
              court: draft.court,
              referee: draft.referee,
              notes: draft.notes,
              tournament_id: draft.tournament_id,
              stage: draft.stage,
              round_index: draft.round_index,
            })
          }
        >
          {mode === "score" ? "Save score" : "Save match"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
