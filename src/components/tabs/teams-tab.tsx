import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Field, EmptyState, TeamChip } from "@/components/data-bits";
import { ImageUpload } from "@/components/image-upload";
import { useTeams, usePlayers, useUpsert, useRemove, type Team } from "@/lib/queries";

const schema = z.object({
  name: z.string().trim().min(1, "Team name is required").max(80),
  short_name: z.string().trim().max(10).nullable(),
});

type SocialPlatform =
  "instagram" | "facebook" | "tiktok" | "youtube" | "x" | "website" | "whatsapp";

type SocialLink = { platform: SocialPlatform; value: string };

type TeamSocials = {
  away_jersey_color?: string | null;
  coach?: { phone?: string | null; email?: string | null };
  manager?: { phone?: string | null; email?: string | null };
  links?: SocialLink[];
};

type Draft = {
  id?: string;
  name: string;
  short_name: string | null;
  jersey_color: string; // home jersey color
  away_jersey_color: string;
  logo_url: string | null;
  coach_name: string | null;
  manager_name: string | null;
  coach_phone: string | null;
  coach_email: string | null;
  manager_phone: string | null;
  manager_email: string | null;
  socials: SocialLink[];
};

const blank = (): Draft => ({
  name: "",
  short_name: null,
  jersey_color: "#ff6b1a",
  away_jersey_color: "#111827",
  logo_url: null,
  coach_name: null,
  manager_name: null,
  coach_phone: null,
  coach_email: null,
  manager_phone: null,
  manager_email: null,
  socials: [],
});

export function TeamsTab({ tournamentId }: { tournamentId: string }) {
  const { data: teams = [] } = useTeams(tournamentId);
  const { data: players = [] } = usePlayers(tournamentId);
  const save = useUpsert("teams", [["teams", tournamentId]]);
  const remove = useRemove("teams", [
    ["teams", tournamentId],
    ["players", tournamentId],
    ["matches", tournamentId],
  ]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(blank());

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const submit = () => {
    const parsed = schema.safeParse(draft);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }

    const socials: TeamSocials = {
      away_jersey_color: draft.away_jersey_color,
      coach: { phone: draft.coach_phone, email: draft.coach_email },
      manager: { phone: draft.manager_phone, email: draft.manager_email },
      links: draft.socials.filter((s) => s.value.trim().length > 0),
    };

    save.mutate(
      {
        ...(draft.id ? { id: draft.id } : {}),
        tournament_id: tournamentId,
        name: draft.name,
        short_name: draft.short_name,
        jersey_color: draft.jersey_color,
        logo_url: draft.logo_url,
        coach_name: draft.coach_name,
        manager_name: draft.manager_name,
        socials,
      },
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
    const socials = (t.socials as TeamSocials | null) ?? {};
    const links = Array.isArray(socials.links) ? socials.links : [];
    setDraft({
      id: t.id,
      name: t.name,
      short_name: t.short_name,
      jersey_color: t.jersey_color ?? "#ff6b1a",
      away_jersey_color: socials.away_jersey_color ?? "#111827",
      logo_url: t.logo_url,
      coach_name: t.coach_name,
      manager_name: t.manager_name,
      coach_phone: socials.coach?.phone ?? null,
      coach_email: socials.coach?.email ?? null,
      manager_phone: socials.manager?.phone ?? null,
      manager_email: socials.manager?.email ?? null,
      socials: links as SocialLink[],
    });
    setOpen(true);
  };

  const addSocial = () =>
    setDraft((d) => ({ ...d, socials: [...d.socials, { platform: "instagram", value: "" }] }));
  const updateSocial = (idx: number, next: Partial<SocialLink>) =>
    setDraft((d) => ({
      ...d,
      socials: d.socials.map((s, i) => (i === idx ? { ...s, ...next } : s)),
    }));
  const removeSocial = (idx: number) =>
    setDraft((d) => ({ ...d, socials: d.socials.filter((_, i) => i !== idx) }));

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
              <Plus className="mr-1.5 h-4 w-4" /> Add team
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{draft.id ? "Edit team" : "Add team"}</DialogTitle>
            </DialogHeader>

            <div className="mb-6 flex flex-col items-center justify-center text-center">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Team logo
              </Label>
              <div className="mt-2">
                <ImageUpload
                  value={draft.logo_url}
                  onChange={(url) => set("logo_url", url)}
                  folder="team-logos"
                  rounded="rounded-full"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">PNG or JPG, up to 5 MB</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Team name">
                <Input value={draft.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Short code">
                <Input
                  maxLength={10}
                  value={draft.short_name ?? ""}
                  onChange={(e) => set("short_name", e.target.value || null)}
                />
              </Field>

              <Field label="Home jersey color">
                <Input
                  type="color"
                  value={draft.jersey_color}
                  onChange={(e) => set("jersey_color", e.target.value)}
                  className="h-10 p-1"
                />
              </Field>
              <Field label="Away jersey color">
                <Input
                  type="color"
                  value={draft.away_jersey_color}
                  onChange={(e) => set("away_jersey_color", e.target.value)}
                  className="h-10 p-1"
                />
              </Field>

              <Field label="Coach name">
                <Input
                  value={draft.coach_name ?? ""}
                  onChange={(e) => set("coach_name", e.target.value || null)}
                />
              </Field>
              <Field label="Coach phone">
                <Input
                  value={draft.coach_phone ?? ""}
                  onChange={(e) => set("coach_phone", e.target.value || null)}
                />
              </Field>
              <Field label="Coach email">
                <Input
                  type="email"
                  value={draft.coach_email ?? ""}
                  onChange={(e) => set("coach_email", e.target.value || null)}
                />
              </Field>

              <Field label="Manager name">
                <Input
                  value={draft.manager_name ?? ""}
                  onChange={(e) => set("manager_name", e.target.value || null)}
                />
              </Field>
              <Field label="Manager phone">
                <Input
                  value={draft.manager_phone ?? ""}
                  onChange={(e) => set("manager_phone", e.target.value || null)}
                />
              </Field>
              <Field label="Manager email">
                <Input
                  type="email"
                  value={draft.manager_email ?? ""}
                  onChange={(e) => set("manager_email", e.target.value || null)}
                />
              </Field>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Social media
                </p>
                <Button type="button" variant="outline" size="sm" onClick={addSocial}>
                  Add handle
                </Button>
              </div>
              {draft.socials.length === 0 ? (
                <p className="text-sm text-muted-foreground">No social handles yet.</p>
              ) : (
                <div className="space-y-2">
                  {draft.socials.map((s, idx) => (
                    <div key={`${s.platform}-${idx}`} className="flex flex-wrap items-center gap-2">
                      <select
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        value={s.platform}
                        onChange={(e) =>
                          updateSocial(idx, { platform: e.target.value as SocialPlatform })
                        }
                      >
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="tiktok">TikTok</option>
                        <option value="youtube">YouTube</option>
                        <option value="x">X</option>
                        <option value="website">Website</option>
                        <option value="whatsapp">WhatsApp</option>
                      </select>
                      <Input
                        className="min-w-56 flex-1"
                        value={s.value}
                        placeholder="@handle or link"
                        onChange={(e) => updateSocial(idx, { value: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSocial(idx)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={submit} disabled={save.isPending}>
              {draft.id ? "Save team" : "Add team"}
            </Button>
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
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => edit(t)}
                    aria-label="Edit team"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete team"
                    className="text-destructive hover:text-destructive"
                    onClick={() =>
                      remove.mutate(t.id, { onSuccess: () => toast.success("Team removed") })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
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
