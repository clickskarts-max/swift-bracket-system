import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import NepaliDatePkg from "nepali-date-converter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Field, EmptyState } from "@/components/data-bits";
import { ImageUpload } from "@/components/image-upload";
import { POSITIONS } from "@/lib/app";
import { usePlayers, useTeams, useUpsert, useRemove, type Player } from "@/lib/queries";

type NepaliDateLike = {
  getYear(): number;
  getMonth(): number;
  getDate(): number;
  toJsDate(): Date;
};
type NepaliDateCtor = { new (value: string): NepaliDateLike; fromAD(date: Date): NepaliDateLike };
const NepaliDate = ((NepaliDatePkg as unknown as { default?: unknown }).default ??
  NepaliDatePkg) as NepaliDateCtor;
const pad2 = (n: number) => String(n).padStart(2, "0");
const toBs = (ad: Date) => {
  const bs = NepaliDate.fromAD(ad);
  return `${bs.getYear()}-${pad2(bs.getMonth() + 1)}-${pad2(bs.getDate())}`;
};
const toAd = (bs: string) => new NepaliDate(bs).toJsDate() as Date;
const calcAge = (dob: Date) => {
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    now.getMonth() < dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
  if (beforeBirthday) years -= 1;
  return Math.max(0, years);
};

const schema = z.object({ name: z.string().trim().min(1, "Player name is required").max(80) });

type SocialPlatform =
  "instagram" | "facebook" | "tiktok" | "youtube" | "x" | "website" | "whatsapp";

type SocialLink = { platform: SocialPlatform; value: string };

type Draft = {
  id?: string;
  name: string;
  team_id: string | null;
  jersey_number: number | null;
  position: string | null;
  age: number | null;
  height_cm: number | null;
  height_unit: "cm" | "ft";
  height_ft: number | null;
  height_in: number | null;
  dob_ad: string | null; // YYYY-MM-DD
  dob_bs: string | null; // YYYY-MM-DD (Bikram Sambat)
  photo_url: string | null;
  socials: SocialLink[];
  meta: Record<string, unknown>;
};

const blank = (): Draft => ({
  name: "",
  team_id: null,
  jersey_number: null,
  position: null,
  age: null,
  height_cm: null,
  height_unit: "cm",
  height_ft: null,
  height_in: null,
  dob_ad: null,
  dob_bs: null,
  photo_url: null,
  socials: [],
  meta: {},
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

  const addSocial = () =>
    setDraft((d) => ({ ...d, socials: [...d.socials, { platform: "instagram", value: "" }] }));
  const updateSocial = (idx: number, next: Partial<SocialLink>) =>
    setDraft((d) => ({
      ...d,
      socials: d.socials.map((s, i) => (i === idx ? { ...s, ...next } : s)),
    }));
  const removeSocial = (idx: number) =>
    setDraft((d) => ({ ...d, socials: d.socials.filter((_, i) => i !== idx) }));

  const submit = () => {
    const parsed = schema.safeParse(draft);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    save.mutate(
      {
        ...(draft.id ? { id: draft.id } : {}),
        tournament_id: tournamentId,
        name: draft.name,
        team_id: draft.team_id,
        jersey_number: draft.jersey_number,
        position: draft.position,
        age: draft.age,
        height_cm: draft.height_cm,
        photo_url: draft.photo_url,
        stats: {
          ...draft.meta,
          dob_ad: draft.dob_ad,
          dob_bs: draft.dob_bs,
          height_unit: draft.height_unit,
          height_ft: draft.height_ft,
          height_in: draft.height_in,
          socials: draft.socials.filter((s) => s.value.trim().length > 0),
        },
      },
      {
        onSuccess: () => {
          toast.success(draft.id ? "Player updated" : "Player added");
          setOpen(false);
          setDraft(blank());
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const edit = (p: Player) => {
    const meta = (p.stats as Record<string, unknown> | null) ?? {};
    const dob_ad = typeof meta["dob_ad"] === "string" ? (meta["dob_ad"] as string) : null;
    const dob_bs = typeof meta["dob_bs"] === "string" ? (meta["dob_bs"] as string) : null;
    const height_unit = (meta["height_unit"] === "ft" ? "ft" : "cm") as "cm" | "ft";
    const height_ft = typeof meta["height_ft"] === "number" ? (meta["height_ft"] as number) : null;
    const height_in = typeof meta["height_in"] === "number" ? (meta["height_in"] as number) : null;
    const socials = Array.isArray(meta["socials"]) ? (meta["socials"] as SocialLink[]) : [];

    setDraft({
      id: p.id,
      name: p.name,
      team_id: p.team_id,
      jersey_number: p.jersey_number,
      position: p.position,
      age: p.age,
      height_cm: p.height_cm,
      height_unit,
      height_ft,
      height_in,
      dob_ad,
      dob_bs,
      photo_url: p.photo_url,
      socials,
      meta,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All teams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teams</SelectItem>
            {teams.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) setDraft(blank());
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> Add player
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{draft.id ? "Edit player" : "Add player"}</DialogTitle>
            </DialogHeader>

            <div className="mb-6 flex flex-col items-center justify-center text-center">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Player photo
              </Label>
              <div className="mt-2">
                <ImageUpload
                  value={draft.photo_url}
                  onChange={(url) => set("photo_url", url)}
                  folder="player-photos"
                  rounded="rounded-full"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">PNG or JPG, up to 5 MB</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <Input value={draft.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Team">
                <Select
                  value={draft.team_id ?? "none"}
                  onValueChange={(v) => set("team_id", v === "none" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Jersey #">
                <Input
                  type="number"
                  value={draft.jersey_number ?? ""}
                  onChange={(e) =>
                    set("jersey_number", e.target.value ? Number(e.target.value) : null)
                  }
                />
              </Field>
              <Field label="Position">
                <Select
                  value={draft.position ?? "none"}
                  onValueChange={(v) => set("position", v === "none" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {POSITIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Date of birth (AD)">
                <Input
                  type="date"
                  value={draft.dob_ad ?? ""}
                  onChange={(e) => {
                    const v = e.target.value || null;
                    set("dob_ad", v);
                    if (!v) {
                      set("dob_bs", null);
                      set("age", null);
                      return;
                    }
                    const dob = new Date(`${v}T00:00:00`);
                    set("dob_bs", toBs(dob));
                    set("age", calcAge(dob));
                  }}
                />
              </Field>
              <Field label="Date of birth (BS)">
                <Input
                  value={draft.dob_bs ?? ""}
                  placeholder="2081-01-01"
                  onChange={(e) => {
                    const v = e.target.value || null;
                    set("dob_bs", v);
                    if (!v) {
                      set("dob_ad", null);
                      set("age", null);
                      return;
                    }
                    try {
                      const dob = toAd(v);
                      const adStr = dob.toISOString().slice(0, 10);
                      set("dob_ad", adStr);
                      set("age", calcAge(dob));
                    } catch {
                      set("dob_ad", null);
                      set("age", null);
                    }
                  }}
                />
              </Field>
              <Field label="Age (auto)">
                <Input value={draft.age ?? ""} disabled placeholder="—" />
              </Field>
              <Field label="Height">
                <div className="flex gap-2">
                  <Select
                    value={draft.height_unit}
                    onValueChange={(v) => set("height_unit", v as "cm" | "ft")}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cm">cm</SelectItem>
                      <SelectItem value="ft">ft</SelectItem>
                    </SelectContent>
                  </Select>
                  {draft.height_unit === "cm" ? (
                    <Input
                      type="number"
                      value={draft.height_cm ?? ""}
                      placeholder="cm"
                      onChange={(e) => {
                        const cm = e.target.value ? Number(e.target.value) : null;
                        set("height_cm", cm);
                        if (cm == null) {
                          set("height_ft", null);
                          set("height_in", null);
                          return;
                        }
                        const totalIn = cm / 2.54;
                        const ft = Math.floor(totalIn / 12);
                        const inch = Math.round(totalIn - ft * 12);
                        set("height_ft", ft);
                        set("height_in", inch);
                      }}
                    />
                  ) : (
                    <div className="grid flex-1 grid-cols-2 gap-2">
                      <Input
                        type="number"
                        value={draft.height_ft ?? ""}
                        placeholder="ft"
                        onChange={(e) => {
                          const ft = e.target.value ? Number(e.target.value) : null;
                          set("height_ft", ft);
                          const inch = draft.height_in ?? 0;
                          if (ft == null) {
                            set("height_cm", null);
                            return;
                          }
                          set("height_cm", Math.round((ft * 12 + inch) * 2.54));
                        }}
                      />
                      <Input
                        type="number"
                        value={draft.height_in ?? ""}
                        placeholder="in"
                        onChange={(e) => {
                          const inch = e.target.value ? Number(e.target.value) : null;
                          set("height_in", inch);
                          const ft = draft.height_ft ?? 0;
                          if (inch == null) {
                            set("height_cm", null);
                            return;
                          }
                          set("height_cm", Math.round((ft * 12 + inch) * 2.54));
                        }}
                      />
                    </div>
                  )}
                </div>
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
              {draft.id ? "Save player" : "Add player"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No players yet"
          description="Build rosters and track per-player statistics."
        />
      ) : (
        <div className="surface-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>#</TableHead>
                <TableHead>Pos</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Height</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => {
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        {p.photo_url ? (
                          <img
                            src={p.photo_url}
                            alt=""
                            className="h-7 w-7 rounded-full object-cover ring-1 ring-border"
                          />
                        ) : (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                            {p.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        {p.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{teamName(p.team_id)}</TableCell>
                    <TableCell>{p.jersey_number ?? "—"}</TableCell>
                    <TableCell>{p.position ?? "—"}</TableCell>
                    <TableCell>{p.age ?? "—"}</TableCell>
                    <TableCell>{p.height_cm ? `${p.height_cm} cm` : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => edit(p)}
                        aria-label="Edit player"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Delete player"
                        className="text-destructive hover:text-destructive"
                        onClick={() =>
                          remove.mutate(p.id, { onSuccess: () => toast.success("Player removed") })
                        }
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
