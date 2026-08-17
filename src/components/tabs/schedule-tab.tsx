import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, CalendarDays, List, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ScoreLine, StatusPill, TeamChip, Field } from "@/components/data-bits";
import { MATCH_STATUSES, formatDateTime, toLocalInput } from "@/lib/app";
import { generateSchedule } from "@/lib/formats";
import { useMatches, useTeams, useUpsert, useRemove, type Match, type Tournament } from "@/lib/queries";

export function ScheduleTab({ tournament }: { tournament: Tournament }) {
  const tournamentId = tournament.id;
  const { data: matches = [] } = useMatches(tournamentId);
  const { data: teams = [] } = useTeams(tournamentId);
  const save = useUpsert("matches", [["matches", tournamentId]]);
  const remove = useRemove("matches", [["matches", tournamentId]]);
  const qc = useQueryClient();
  const [view, setView] = useState("list");
  const [bucket, setBucket] = useState<"fixtures" | "results">("fixtures");
  const [editing, setEditing] = useState<Match | null>(null);
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
      { onSuccess: () => toast.success("Home and away switched"), onError: (e) => toast.error(e.message) },
    );
  };

  const label = (m: Match, side: "a" | "b") => {
    const id = side === "a" ? m.team_a_id : m.team_b_id;
    const team = id ? teamById.get(id) : undefined;
    return team ?? { name: (side === "a" ? m.placeholder_a : m.placeholder_b) ?? "TBD", logo_url: null, jersey_color: null };
  };

  const regenerate = async () => {
    if (teams.length < 2) { toast.error("Add at least two teams first"); return; }
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const owner_id = userData.user?.id;
      if (!owner_id) throw new Error("Sign in required");
      const drafts = generateSchedule({
        format: tournament.format,
        legs: tournament.legs,
        playoffFormat: tournament.playoff_format,
        teams: teams.map((t) => ({ id: t.id, name: t.name, group_label: t.group_label, seed: t.seed })),
      });
      if (drafts.length === 0) throw new Error("This configuration produced no matches");
      const del = await supabase.from("matches").delete().eq("tournament_id", tournamentId);
      if (del.error) throw new Error(del.error.message);
      const ins = await supabase.from("matches").insert(drafts.map((d) => ({ ...d, tournament_id: tournamentId, owner_id })));
      if (ins.error) throw new Error(ins.error.message);
      await qc.invalidateQueries({ queryKey: ["matches", tournamentId] });
      toast.success(`${drafts.length} matches generated`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate the schedule");
    } finally {
      setBusy(false);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Match[]>();
    const pool = matches.filter((m) => (bucket === "results" ? m.status === "completed" : m.status !== "completed"));
    for (const m of pool) {
      const key =
        view === "calendar"
          ? m.scheduled_at
            ? new Date(m.scheduled_at).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })
            : "Unscheduled"
          : m.round_name ?? `Round ${m.round_index}`;
      map.set(key, [...(map.get(key) ?? []), m]);
    }
    return [...map.entries()];
  }, [matches, view, bucket]);

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
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="list"><List className="mr-1.5 h-3.5 w-3.5" /> Rounds</TabsTrigger>
            <TabsTrigger value="calendar"><CalendarDays className="mr-1.5 h-3.5 w-3.5" /> Calendar</TabsTrigger>
          </TabsList>
        </Tabs>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" disabled={busy}><RefreshCw className="mr-1.5 h-4 w-4" /> Generate schedule</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Regenerate the full schedule?</AlertDialogTitle>
              <AlertDialogDescription>
                All existing matches, scores and match details for this tournament will be replaced by a fresh fixture list.
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
              : "Generate the fixture list from your teams and format, or import one from a file."
          }
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([round, list]) => (
            <div key={round}>
              <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">{round}</h3>
              <div className="space-y-2">
                {list.map((m) => {
                  const a = label(m, "a");
                  const b = label(m, "b");
                  return (
                    <div key={m.id} className="surface-card flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
                      <span className="w-10 shrink-0 text-xs text-muted-foreground">M{m.match_no ?? "—"}</span>
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <TeamChip name={a.name} logoUrl={a.logo_url} color={a.jersey_color} className="flex-1" />
                        <ScoreLine scoreA={m.score_a} scoreB={m.score_b} final={m.status === "completed"} />
                        <TeamChip name={b.name} logoUrl={b.logo_url} color={b.jersey_color} className="flex-1 justify-end text-right" />
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="hidden text-xs text-muted-foreground sm:inline">{formatDateTime(m.scheduled_at)}</span>
                        <StatusPill status={m.status} />
                        <Button size="icon" variant="ghost" aria-label="Switch home and away" onClick={() => swapSides(m)}>
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" aria-label="Edit match" onClick={() => setEditing(m)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon" variant="ghost" aria-label="Delete match"
                          className="text-destructive hover:text-destructive"
                          onClick={() => remove.mutate(m.id, { onSuccess: () => toast.success("Match removed") })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
        teams={teams.map((t) => ({ id: t.id, name: t.name }))}
        onClose={() => setEditing(null)}
        pending={save.isPending}
        onSave={(values) =>
          save.mutate(values, {
            onSuccess: () => { toast.success("Match saved"); setEditing(null); },
            onError: (e) => toast.error(e.message),
          })
        }
      />
    </div>
  );
}

function MatchDialog({
  match, teams, onClose, onSave, pending,
}: {
  match: Match | null;
  teams: { id: string; name: string }[];
  onClose: () => void;
  onSave: (values: Record<string, unknown> & { id: string }) => void;
  pending: boolean;
}) {
  const [draft, setDraft] = useState<Match | null>(match);
  if (match && draft?.id !== match.id) setDraft(match);
  if (!draft) return null;
  const set = <K extends keyof Match>(k: K, v: Match[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  return (
    <Dialog open={!!match} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Match {draft.match_no ?? ""} · {draft.round_name}</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
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
                )
              }
            >
              <ArrowLeftRight className="mr-1.5 h-3.5 w-3.5" /> Switch sides
            </Button>
          </Field>
          <Field label="Home team">
            <Select value={draft.team_a_id ?? "none"} onValueChange={(v) => set("team_a_id", v === "none" ? null : v)}>
              <SelectTrigger><SelectValue placeholder={draft.placeholder_a ?? "TBD"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{draft.placeholder_a ?? "TBD"}</SelectItem>
                {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Away team">
            <Select value={draft.team_b_id ?? "none"} onValueChange={(v) => set("team_b_id", v === "none" ? null : v)}>
              <SelectTrigger><SelectValue placeholder={draft.placeholder_b ?? "TBD"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{draft.placeholder_b ?? "TBD"}</SelectItem>
                {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Home score">
            <Input type="number" min={0} value={draft.score_a ?? ""} onChange={(e) => set("score_a", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Away score">
            <Input type="number" min={0} value={draft.score_b ?? ""} onChange={(e) => set("score_b", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Tip-off">
            <Input
              type="datetime-local"
              value={toLocalInput(draft.scheduled_at)}
              onChange={(e) => set("scheduled_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
            />
          </Field>
          <Field label="Status">
            <Select value={draft.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MATCH_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Venue"><Input value={draft.venue ?? ""} onChange={(e) => set("venue", e.target.value || null)} /></Field>
          <Field label="Court"><Input value={draft.court ?? ""} onChange={(e) => set("court", e.target.value || null)} /></Field>
          <Field label="Referee"><Input value={draft.referee ?? ""} onChange={(e) => set("referee", e.target.value || null)} /></Field>
          <Field label="Notes"><Input value={draft.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} /></Field>
        </div>
        <Button
          disabled={pending}
          onClick={() =>
            onSave({
              id: draft.id,
              status:
                draft.score_a != null && draft.score_b != null && draft.status === "scheduled"
                  ? "completed"
                  : draft.status,
              match_no: draft.match_no,
              placeholder_a: draft.placeholder_a, placeholder_b: draft.placeholder_b,
              team_a_id: draft.team_a_id, team_b_id: draft.team_b_id,
              score_a: draft.score_a, score_b: draft.score_b,
              scheduled_at: draft.scheduled_at,
              venue: draft.venue, court: draft.court, referee: draft.referee, notes: draft.notes,
              tournament_id: draft.tournament_id, stage: draft.stage, round_index: draft.round_index,
            })
          }
        >
          Save match
        </Button>
      </DialogContent>
    </Dialog>
  );
}
