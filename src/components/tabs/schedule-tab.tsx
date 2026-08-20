import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, ChevronDown, ChevronUp, List, Pencil, Plus, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { formatDate, MATCH_STATUSES, toLocalInput } from "@/lib/app";
import { generateSchedule } from "@/lib/formats";
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
  type Match,
  type Tournament,
} from "@/lib/queries";

const pad2 = (n: number) => String(n).padStart(2, "0");
const dayKeyFromIso = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const stripMatchday = (label: string) =>
  label
    .replace(/\s*·\s*matchday\s*\d+\s*/gi, "")
    .replace(/\bmatchday\s*\d+\b/gi, "")
    .trim();

export function ScheduleTab({ tournament }: { tournament: Tournament }) {
  const tournamentId = tournament.id;
  const { data: matches = [] } = useMatches(tournamentId);
  const { data: teams = [] } = useTeams(tournamentId);
  const { data: players = [] } = usePlayers(tournamentId);
  const save = useUpsert("matches", [["matches", tournamentId]]);
  const qc = useQueryClient();
  const [bucket, setBucket] = useState<"fixtures" | "results">("fixtures");
  const [editing, setEditing] = useState<Match | null>(null);
  const [mode, setMode] = useState<"game" | "score">("game");
  const [busy, setBusy] = useState(false);

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
      const drafts = generateSchedule({
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
      if (drafts.length === 0) throw new Error("This configuration produced no matches");
      const del = await supabase.from("matches").delete().eq("tournament_id", tournamentId);
      if (del.error) throw new Error(del.error.message);
      const ins = await supabase
        .from("matches")
        .insert(drafts.map((d) => ({ ...d, tournament_id: tournamentId, owner_id })));
      if (ins.error) throw new Error(ins.error.message);
      await qc.invalidateQueries({ queryKey: ["matches", tournamentId] });
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
        matches.filter((m) => !!m.scheduled_at).map((m) => dayKeyFromIso(m.scheduled_at as string)),
      ),
    ].sort();
    return new Map(keys.map((k, i) => [k, i + 1]));
  }, [matches]);

  const listGroupKey = (m: Match) => {
    const base = stripMatchday(m.round_name ?? `Round ${m.round_index}`);
    if (!m.scheduled_at) return base;
    const md = matchdayByDate.get(dayKeyFromIso(m.scheduled_at)) ?? 1;
    return `${base} · Matchday ${md}`;
  };

  const moveMatchDay = async (list: Match[], deltaDays: number) => {
    const scheduled = list.filter((m) => !!m.scheduled_at);
    if (scheduled.length === 0) return;
    setBusy(true);
    try {
      const updates = await Promise.all(
        scheduled.map(async (m) => {
          const d = new Date(m.scheduled_at as string);
          d.setDate(d.getDate() + deltaDays);
          return supabase.from("matches").update({ scheduled_at: d.toISOString() }).eq("id", m.id);
        }),
      );
      const firstError = updates.map((u) => u.error).find(Boolean);
      if (firstError) throw new Error(firstError.message);
      await qc.invalidateQueries({ queryKey: ["matches", tournamentId] });
      toast.success(`Moved ${scheduled.length} matches`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not move this match day");
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
    const pool = matches.filter((m) =>
      bucket === "results" ? m.status === "completed" : m.status !== "completed",
    );
    for (const m of pool) {
      const key = bucket === "results" ? resultGroupKey(m) : listGroupKey(m);
      map.set(key, [...(map.get(key) ?? []), m]);
    }
    const compareMatch = (a: Match, b: Match) => {
      const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
      return (
        ta - tb ||
        (a.match_no ?? Number.POSITIVE_INFINITY) - (b.match_no ?? Number.POSITIVE_INFINITY)
      );
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

    // Sort groups by earliest tip-off time (ascending). Unscheduled groups naturally go last.
    return entries.sort(([, la], [, lb]) => groupTime(la) - groupTime(lb));
  }, [matches, bucket, matchdayByDate]);

  const completedCount = matches.filter((m) => m.status === "completed").length;

  return (
    <div className="space-y-4">
      <Tabs value={bucket} onValueChange={(v) => setBucket(v as "fixtures" | "results")}>
        <TabsList>
          <TabsTrigger value="fixtures">Upcoming ({matches.length - completedCount})</TabsTrigger>
          <TabsTrigger value="results">Completed ({completedCount})</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <List className="h-4 w-4" />
          <span>Rounds</span>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" disabled={busy}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Generate schedule
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Regenerate the full schedule?</AlertDialogTitle>
              <AlertDialogDescription>
                All existing matches, scores and match details for this tournament will be replaced
                by a fresh fixture list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={regenerate}>Generate</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {grouped.length === 0 ? (
        <EmptyState
          title={bucket === "results" ? "No completed matches yet" : "No upcoming matches"}
          description={
            bucket === "results"
              ? "Matches move here automatically once their final score is saved."
              : "Generate the fixture list from your teams and format."
          }
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([round, list]) => (
            <div key={round}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  {round}
                </h3>
                {list.some((m) => !!m.scheduled_at) && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Move match day earlier"
                      disabled={busy}
                      onClick={() => moveMatchDay(list, -1)}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Move match day later"
                      disabled={busy}
                      onClick={() => moveMatchDay(list, 1)}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {list.map((m) => {
                  const a = label(m, "a");
                  const b = label(m, "b");
                  return (
                    <div key={m.id} className="surface-card p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                          M{m.match_no ?? "—"}
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
                            final={m.status === "completed"}
                          />
                          <span className="text-center text-xs text-muted-foreground">
                            {m.status === "completed" ? (
                              formatDate(m.scheduled_at)
                            ) : (
                              <TipoffCountdown scheduledAt={m.scheduled_at} />
                            )}
                          </span>
                        </div>
                        <TeamChip
                          name={b.name}
                          logoUrl={b.logo_url}
                          color={b.jersey_color}
                          className="min-w-0 flex-row-reverse justify-start text-right"
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-end gap-1">
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
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <MatchDialog
        match={editing}
        mode={mode}
        teams={teams.map((t) => ({ id: t.id, name: t.name }))}
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
  mode,
  teams,
  players,
  onClose,
  onSave,
  pending,
}: {
  match: Match | null;
  mode: "game" | "score";
  teams: { id: string; name: string }[];
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
  const addOvertime = () =>
    setPeriods((p) => ({ a: [...p.a, null], b: [...p.b, null] }));
  const removeOvertime = () =>
    setPeriods((p) =>
      p.a.length > QUARTERS ? { a: p.a.slice(0, -1), b: p.b.slice(0, -1) } : p,
    );

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
            {mode === "score" ? "Score data" : "Game data"} · Match {draft.match_no ?? ""}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {mode === "game" && (
          <>
          <Field label="Match number">
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
              onClick={() =>
                {
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
                }
              }
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
          <Field label="Home score">
            <Input
              type="number"
              min={0}
              disabled={usePeriods}
              value={usePeriods ? totalA : (draft.score_a ?? "")}
              onChange={(e) => set("score_a", e.target.value ? Number(e.target.value) : null)}
            />
          </Field>
          <Field label="Away score">
            <Input
              type="number"
              min={0}
              disabled={usePeriods}
              value={usePeriods ? totalB : (draft.score_b ?? "")}
              onChange={(e) => set("score_b", e.target.value ? Number(e.target.value) : null)}
            />
          </Field>
          </>
          )}
          {mode === "game" && (
          <>
          <Field label="Tip-off">
            <Input
              type="datetime-local"
              value={toLocalInput(draft.scheduled_at)}
              onChange={(e) =>
                set("scheduled_at", e.target.value ? new Date(e.target.value).toISOString() : null)
              }
            />
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
          <Select
            value={potm ?? "none"}
            onValueChange={(v) => setPotm(v === "none" ? null : v)}
          >
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
              {([
                ["a", draft.team_a_id] as const,
                ["b", draft.team_b_id] as const,
              ]).map(([side, teamId]) => {
                const roster = rosterFor(teamId);
                if (roster.length === 0) return null;
                const teamName =
                  teams.find((t) => t.id === teamId)?.name ??
                  (side === "a" ? (draft.placeholder_a ?? "Home") : (draft.placeholder_b ?? "Away"));
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
                        {(["points", "rebounds", "assists", "fouls"] as const).map((k) => (
                          <td key={k} className="p-1">
                            <Input
                              type="number"
                              min={0}
                              className="h-9 w-16 text-center"
                              value={s[k]}
                              onChange={(e) => setStat(p.id, k, e.target.value)}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
                  </div>
                );
              })}
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
              player_stats: stats.filter(
                (s) => s.points || s.rebounds || s.assists || s.fouls,
              ),
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
