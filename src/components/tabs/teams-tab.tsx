import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, EmptyState, TeamChip } from "@/components/data-bits";
import { useTeams, usePlayers, useUpsert, useRemove, type Team } from "@/lib/queries";

const schema = z.object({
  name: z.string().trim().min(1, "Team name is required").max(80),
  short_name: z.string().trim().max(10).nullable(),
  group_label: z.string().trim().max(4).nullable(),
});

type Draft = {
  id?: string;
  name: string;
  short_name: string | null;
  group_label: string | null;
  jersey_color: string;
  logo_url: string | null;
  coach_name: string | null;
  manager_name: string | null;
  contact: string | null;
  seed: number | null;
};

const blank = (): Draft => ({
  name: "",
  short_name: null,
  group_label: null,
  jersey_color: "#ff6b1a",
  logo_url: null,
  coach_name: null,
  manager_name: null,
  contact: null,
  seed: null,
});

export function TeamsTab({ tournamentId }: { tournamentId: string }) {
  const { data: teams = [] } = useTeams(tournamentId);
  const { data: players = [] } = usePlayers(tournamentId);
  const save = useUpsert("teams", [["teams", tournamentId]]);
  const remove = useRemove("teams", [["teams", tournamentId], ["players", tournamentId], ["matches", tournamentId]]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(blank());

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const submit = () => {
    const parsed = schema.safeParse(draft);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Check the form"); return; }
    save.mutate(
      { ...draft, tournament_id: tournamentId, group_label: draft.group_label?.toUpperCase() ?? null },
      {
        onSuccess: () => {
          toast.success(draft.id ? "Team updated" : "Team added");
          setOpen(false);
          setDraft(blank());
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const edit = (t: Team) => {
    setDraft({
      id: t.id,
      name: t.name,
      short_name: t.short_name,
      group_label: t.group_label,
      jersey_color: t.jersey_color ?? "#ff6b1a",
      logo_url: t.logo_url,
      coach_name: t.coach_name,
      manager_name: t.manager_name,
      contact: t.contact,
      seed: t.seed,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setDraft(blank()); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1.5 h-4 w-4" /> Add team</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{draft.id ? "Edit team" : "Add team"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Team name"><Input value={draft.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field label="Short code"><Input maxLength={10} value={draft.short_name ?? ""} onChange={(e) => set("short_name", e.target.value || null)} /></Field>
              <Field label="Group / pool" hint="A, B, C… for group stage formats">
                <Input maxLength={4} value={draft.group_label ?? ""} onChange={(e) => set("group_label", e.target.value || null)} />
              </Field>
              <Field label="Seed"><Input type="number" value={draft.seed ?? ""} onChange={(e) => set("seed", e.target.value ? Number(e.target.value) : null)} /></Field>
              <Field label="Jersey color">
                <Input type="color" value={draft.jersey_color} onChange={(e) => set("jersey_color", e.target.value)} className="h-10 p-1" />
              </Field>
              <Field label="Logo URL"><Input value={draft.logo_url ?? ""} onChange={(e) => set("logo_url", e.target.value || null)} /></Field>
              <Field label="Coach"><Input value={draft.coach_name ?? ""} onChange={(e) => set("coach_name", e.target.value || null)} /></Field>
              <Field label="Manager"><Input value={draft.manager_name ?? ""} onChange={(e) => set("manager_name", e.target.value || null)} /></Field>
              <Field label="Contact"><Input value={draft.contact ?? ""} onChange={(e) => set("contact", e.target.value || null)} /></Field>
            </div>
            <Button onClick={submit} disabled={save.isPending}>{draft.id ? "Save team" : "Add team"}</Button>
          </DialogContent>
        </Dialog>
      </div>

      {teams.length === 0 ? (
        <EmptyState title="No teams yet" description="Add teams before generating the schedule." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <div key={t.id} className="surface-card animate-rise p-4">
              <div className="flex items-start justify-between gap-2">
                <TeamChip name={t.name} logoUrl={t.logo_url} color={t.jersey_color} />
                <div className="flex shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => edit(t)} aria-label="Edit team"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete team"
                    className="text-destructive hover:text-destructive"
                    onClick={() => remove.mutate(t.id, { onSuccess: () => toast.success("Team removed") })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                {t.group_label && <p>Group {t.group_label}</p>}
                {t.coach_name && <p>Coach: {t.coach_name}</p>}
                <p>{players.filter((p) => p.team_id === t.id).length} players</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
