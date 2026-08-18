import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Field } from "@/components/data-bits";
import { SPONSOR_TIERS } from "@/lib/app";
import { useSponsors, useUpsert, useRemove, type Sponsor } from "@/lib/queries";

const PLACEMENTS = ["public_header", "public_footer", "sidebar", "scoreboard", "jersey"] as const;
const schema = z.object({ name: z.string().trim().min(1, "Sponsor name is required").max(100) });

type Draft = {
  id?: string;
  name: string;
  tier: string;
  placement: string;
  logo_url: string | null;
  amount: number | null;
  contact_person: string | null;
  notes: string | null;
};

const blank = (): Draft => ({
  name: "",
  tier: "gold",
  placement: "public_header",
  logo_url: null,
  amount: null,
  contact_person: null,
  notes: null,
});

export function SponsorsTab({ tournamentId }: { tournamentId: string }) {
  const { data: sponsors = [] } = useSponsors(tournamentId);
  const save = useUpsert("sponsors", [["sponsors", tournamentId]]);
  const remove = useRemove("sponsors", [["sponsors", tournamentId]]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(blank());
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const submit = () => {
    const parsed = schema.safeParse(draft);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    save.mutate(
      { ...draft, tournament_id: tournamentId },
      {
        onSuccess: () => {
          toast.success("Sponsor saved");
          setOpen(false);
          setDraft(blank());
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const edit = (s: Sponsor) => {
    setDraft({
      id: s.id,
      name: s.name,
      tier: s.tier ?? "gold",
      placement: s.placement ?? "public_header",
      logo_url: s.logo_url,
      amount: s.amount,
      contact_person: s.contact_person,
      notes: s.notes,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) setDraft(blank());
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> Add sponsor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{draft.id ? "Edit sponsor" : "Add sponsor"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Sponsor name">
                <Input value={draft.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Tier">
                <Select value={draft.tier} onValueChange={(v) => set("tier", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPONSOR_TIERS.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Placement">
                <Select value={draft.placement} onValueChange={(v) => set("placement", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLACEMENTS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Amount">
                <Input
                  type="number"
                  value={draft.amount ?? ""}
                  onChange={(e) => set("amount", e.target.value ? Number(e.target.value) : null)}
                />
              </Field>
              <Field label="Logo URL">
                <Input
                  value={draft.logo_url ?? ""}
                  onChange={(e) => set("logo_url", e.target.value || null)}
                />
              </Field>
              <Field label="Contact person">
                <Input
                  value={draft.contact_person ?? ""}
                  onChange={(e) => set("contact_person", e.target.value || null)}
                />
              </Field>
            </div>
            <Field label="Notes">
              <Textarea
                rows={3}
                value={draft.notes ?? ""}
                onChange={(e) => set("notes", e.target.value || null)}
              />
            </Field>
            <Button onClick={submit} disabled={save.isPending}>
              Save sponsor
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {sponsors.length === 0 ? (
        <EmptyState
          title="No sponsors yet"
          description="Add partners with tiers and choose where their logo appears."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sponsors.map((s) => (
            <div key={s.id} className="surface-card animate-rise p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {s.logo_url && (
                    <img
                      src={s.logo_url}
                      alt=""
                      loading="lazy"
                      className="mb-2 h-10 rounded object-contain"
                    />
                  )}
                  <p className="truncate font-medium">{s.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge variant="outline" className="capitalize">
                      {s.tier}
                    </Badge>
                    <Badge variant="secondary">{(s.placement ?? "").replace(/_/g, " ")}</Badge>
                  </div>
                </div>
                <div className="flex shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Edit sponsor"
                    onClick={() => edit(s)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete sponsor"
                    className="text-destructive hover:text-destructive"
                    onClick={() =>
                      remove.mutate(s.id, { onSuccess: () => toast.success("Sponsor removed") })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
