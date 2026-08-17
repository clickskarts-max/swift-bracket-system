import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Field, EmptyState } from "@/components/data-bits";
import { POSITIONS } from "@/lib/app";
import { usePlayers, useTeams, useUpsert, useRemove, type Player } from "@/lib/queries";

const STAT_KEYS = ["points", "rebounds", "assists", "steals", "blocks", "fouls"] as const;
type StatKey = (typeof STAT_KEYS)[number];
type Stats = Partial<Record<StatKey, number>>;

const schema = z.object({ name: z.string().trim().min(1, "Player name is required").max(80) });

type Draft = {
  id?: string;
  name: string;
  team_id: string | null;
  jersey_number: number | null;
  position: string | null;
  age: number | null;
  height_cm: number | null;
  photo_url: string | null;
  stats: Stats;
};

const blank = (): Draft => ({
  name: "", team_id: null, jersey_number: null, position: null, age: null, height_cm: null, photo_url: null, stats: {},
});

export function PlayersTab({ tournamentId }: { tournamentId: string }) {
  const { data: players = [] } = usePlayers(tournamentId);
  const { data: teams = [] } = useTeams(tournamentId);
  const save = useUpsert("players", [["players", tournamentId]]);
  const remove = useRemove("players", [["players", tournamentId]]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [draft, setDraft] = useState<Draft>(blank());

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const teamName = (id: string | null) => teams.find((t) => t.id === id)?.name ?? "Unassigned";
  const rows = players.filter((p) => filter === "all" || p.team_id === filter);

  const submit = () => {
    const parsed = schema.safeParse(draft);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Check the form"); return; }
    save.mutate(
      { ...draft, tournament_id: tournamentId, stats: draft.stats },
      {
        onSuccess: () => { toast.success(draft.id ? "Player updated" : "Player added"); setOpen(false); setDraft(blank()); },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const edit = (p: Player) => {
    setDraft({
      id: p.id, name: p.name, team_id: p.team_id, jersey_number: p.jersey_number, position: p.position,
      age: p.age, height_cm: p.height_cm, photo_url: p.photo_url, stats: (p.stats as Stats) ?? {},
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-52"><SelectValue placeholder="All teams" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teams</SelectItem>
            {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setDraft(blank()); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1.5 h-4 w-4" /> Add player</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{draft.id ? "Edit player" : "Add player"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><Input value={draft.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field label="Team">
                <Select value={draft.team_id ?? "none"} onValueChange={(v) => set("team_id", v === "none" ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Jersey #"><Input type="number" value={draft.jersey_number ?? ""} onChange={(e) => set("jersey_number", e.target.value ? Number(e.target.value) : null)} /></Field>
              <Field label="Position">
                <Select value={draft.position ?? "none"} onValueChange={(v) => set("position", v === "none" ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Age"><Input type="number" value={draft.age ?? ""} onChange={(e) => set("age", e.target.value ? Number(e.target.value) : null)} /></Field>
              <Field label="Height (cm)"><Input type="number" value={draft.height_cm ?? ""} onChange={(e) => set("height_cm", e.target.value ? Number(e.target.value) : null)} /></Field>
              <Field label="Photo URL"><Input value={draft.photo_url ?? ""} onChange={(e) => set("photo_url", e.target.value || null)} /></Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {STAT_KEYS.map((k) => (
                <Field key={k} label={k}>
                  <Input
                    type="number"
                    value={draft.stats[k] ?? ""}
                    onChange={(e) => set("stats", { ...draft.stats, [k]: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </Field>
              ))}
            </div>
            <Button onClick={submit} disabled={save.isPending}>{draft.id ? "Save player" : "Add player"}</Button>
          </DialogContent>
        </Dialog>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No players yet" description="Build rosters and track per-player statistics." />
      ) : (
        <div className="surface-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>#</TableHead>
                <TableHead>Pos</TableHead>
                {STAT_KEYS.map((k) => <TableHead key={k} className="capitalize">{k.slice(0, 3)}</TableHead>)}
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => {
                const stats = (p.stats as Stats) ?? {};
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{teamName(p.team_id)}</TableCell>
                    <TableCell>{p.jersey_number ?? "—"}</TableCell>
                    <TableCell>{p.position ?? "—"}</TableCell>
                    {STAT_KEYS.map((k) => <TableCell key={k}>{stats[k] ?? 0}</TableCell>)}
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => edit(p)} aria-label="Edit player"><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button
                        size="icon" variant="ghost" aria-label="Delete player"
                        className="text-destructive hover:text-destructive"
                        onClick={() => remove.mutate(p.id, { onSuccess: () => toast.success("Player removed") })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
