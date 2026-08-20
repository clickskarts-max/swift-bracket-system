import { useState } from "react";
import { MapPin } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/data-bits";
import { TOURNAMENT_FORMATS, PLAYOFF_FORMATS } from "@/lib/formats";
import { STATUSES, mapsUrl, uniqueSlug } from "@/lib/app";
import type { Tournament } from "@/lib/queries";

export type TournamentValues = {
  name: string;
  slug: string;
  format: string;
  legs: number;
  playoff_format: string;
  group_count: number;
  qualifiers_per_group: number;
  team_count: number;
  start_date: string | null;
  end_date: string | null;
  venue: string | null;
  venue_map_url: string | null;
  status: string;
  logo_url: string | null;
  banner_url: string | null;
  description: string | null;
  is_public: boolean;
};

const schema = z.object({
  name: z.string().trim().min(2, "Tournament name is required").max(120),
  slug: z.string().trim().min(2).max(64),
  legs: z.number().int().min(1).max(6),
  team_count: z.number().int().min(2, "Must be greater than 1").max(256),
  group_count: z.number().int().min(0).max(16),
  qualifiers_per_group: z.number().int().min(1).max(256),
  description: z.string().max(2000).nullable(),
  venue: z.string().max(200).nullable(),
});

const empty = (): TournamentValues => ({
  name: "",
  slug: "",
  format: "league",
  legs: 1,
  playoff_format: "none",
  group_count: 0,
  qualifiers_per_group: 1,
  team_count: 0,
  start_date: null,
  end_date: null,
  venue: null,
  venue_map_url: null,
  status: "draft",
  logo_url: null,
  banner_url: null,
  description: null,
  is_public: true,
});

export function TournamentForm({
  initial,
  submitLabel,
  onSubmit,
  pending,
}: {
  initial?: Tournament | null;
  submitLabel: string;
  onSubmit: (values: TournamentValues) => void;
  pending?: boolean;
}) {
  const [values, setValues] = useState<TournamentValues>(
    initial
      ? {
          name: initial.name,
          slug: initial.slug,
          format: initial.format,
          legs: initial.legs,
          playoff_format: initial.playoff_format,
          group_count: initial.group_count,
          qualifiers_per_group: initial.qualifiers_per_group ?? 1,
          team_count: initial.team_count,
          start_date: initial.start_date,
          end_date: initial.end_date,
          venue: initial.venue,
          venue_map_url: initial.venue_map_url,
          status: initial.status,
          logo_url: initial.logo_url,
          banner_url: initial.banner_url,
          description: initial.description,
          is_public: initial.is_public,
        }
      : empty(),
  );

  const set = <K extends keyof TournamentValues>(key: K, value: TournamentValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const submit = () => {
    const next = { ...values, slug: values.slug || uniqueSlug(values.name) };
    const parsed = schema.safeParse(next);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    onSubmit(next);
  };

  const isLeague = values.format === "league";
  const isGroupKnockout = values.format === "group_knockout";

  const teamsPerGroup =
    isGroupKnockout && values.group_count > 0 ? values.team_count / values.group_count : 0;
  const isUnevenGroups = teamsPerGroup > 0 && !Number.isInteger(teamsPerGroup);
  const knockoutTeams = isGroupKnockout ? values.group_count * values.qualifiers_per_group : 0;

  const isValidKnockoutSize = (size: number) => {
    if (size <= 0) return false;
    // Check if it's a power of 2
    return (size & (size - 1)) === 0;
  };

  const knockoutRoundLabel = (size: number) => {
    if (size === 2) return "Final";
    if (size === 4) return "Semi-finals → Final";
    if (size === 8) return "Quarter-finals → Semi-finals → Final";
    if (size === 16) return "Round of 16 → Quarter-finals → Semi-finals → Final";
    return `${size}-team bracket`;
  };

  return (
    <div className="space-y-6">
      <div className="surface-card space-y-4 p-5">
        <h2 className="font-display text-lg font-semibold">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tournament name">
            <Input
              value={values.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (!initial) set("slug", uniqueSlug(e.target.value));
              }}
              placeholder="Ecluid Summer Classic"
            />
          </Field>
          <Field label="Public URL slug" hint={`/public/tournament/${values.slug || "your-slug"}`}>
            <Input
              value={values.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="summer-classic"
            />
          </Field>
          <Field label="Format">
            <Select value={values.format} onValueChange={(v) => set("format", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOURNAMENT_FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={values.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {isRoundRobin && (
            <Field
              label="Legs (times each pair meets)"
              hint="1 = single round robin, 2 = double, 3+ supported"
            >
              <Input
                type="number"
                min={1}
                max={6}
                value={values.legs}
                onChange={(e) => set("legs", Number(e.target.value) || 1)}
              />
            </Field>
          )}
          {values.format === "league" && (
            <Field label="Playoff after league">
              <Select value={values.playoff_format} onValueChange={(v) => set("playoff_format", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAYOFF_FORMATS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          {values.format === "group_knockout" && (
            <Field
              label="Number of groups / pools"
              hint="2, 4 or 8 groups follow the reference knockout mapping"
            >
              <Input
                type="number"
                min={0}
                max={16}
                value={values.group_count}
                onChange={(e) => set("group_count", Number(e.target.value) || 0)}
              />
            </Field>
          )}
          <Field label="Number of teams">
            <Input
              type="number"
              min={0}
              value={values.team_count}
              onChange={(e) => set("team_count", Number(e.target.value) || 0)}
            />
          </Field>
        </div>
      </div>

      <div className="surface-card space-y-4 p-5">
        <h2 className="font-display text-lg font-semibold">Schedule & venue</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date">
            <Input
              type="date"
              value={values.start_date ?? ""}
              onChange={(e) => set("start_date", e.target.value || null)}
            />
          </Field>
          <Field label="End date">
            <Input
              type="date"
              value={values.end_date ?? ""}
              onChange={(e) => set("end_date", e.target.value || null)}
            />
          </Field>
          <Field label="Venue">
            <Input
              value={values.venue ?? ""}
              onChange={(e) => {
                set("venue", e.target.value || null);
                set("venue_map_url", mapsUrl(e.target.value));
              }}
              placeholder="National Sports Complex, Kathmandu"
            />
          </Field>
          <Field label="Google Maps link" hint="Auto-filled from the venue, editable">
            <div className="flex gap-2">
              <Input
                value={values.venue_map_url ?? ""}
                onChange={(e) => set("venue_map_url", e.target.value || null)}
                placeholder="https://maps.google.com/..."
              />
              {values.venue_map_url && (
                <Button variant="outline" size="icon" asChild>
                  <a
                    href={values.venue_map_url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open map"
                  >
                    <MapPin className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </Field>
        </div>
      </div>

      <div className="surface-card space-y-4 p-5">
        <h2 className="font-display text-lg font-semibold">Branding</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Logo image URL">
            <Input
              value={values.logo_url ?? ""}
              onChange={(e) => set("logo_url", e.target.value || null)}
              placeholder="https://..."
            />
          </Field>
          <Field label="Banner image URL">
            <Input
              value={values.banner_url ?? ""}
              onChange={(e) => set("banner_url", e.target.value || null)}
              placeholder="https://..."
            />
          </Field>
        </div>
        <Field label="Description">
          <Textarea
            rows={4}
            value={values.description ?? ""}
            onChange={(e) => set("description", e.target.value || null)}
            placeholder="Tell fans what this competition is about."
          />
        </Field>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">Public tournament page</p>
            <p className="text-xs text-muted-foreground">
              Anyone with the link can view fixtures, standings and brackets.
            </p>
          </div>
          <Switch checked={values.is_public} onCheckedChange={(v) => set("is_public", v)} />
        </div>
      </div>

      <Button size="lg" onClick={submit} disabled={pending} className="w-full sm:w-auto">
        {submitLabel}
      </Button>
    </div>
  );
}
