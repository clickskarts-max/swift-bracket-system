import { useState, useEffect } from "react";
import { MapPin, ChevronLeft, ChevronRight, ImagePlus, X } from "lucide-react";
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
import { ImageUpload } from "@/components/image-upload";
import { TOURNAMENT_FORMATS, PLAYOFF_FORMATS } from "@/lib/formats";
import { STATUSES, mapsUrl, uniqueSlug } from "@/lib/app";
import type { Tournament } from "@/lib/queries";

export type TeamValue = {
  id?: string;
  name: string;
  logo_url: string | null;
  group_label: string | null;
};

export type VenueValue = {
  id?: string;
  name: string;
  address: string | null;
  google_maps_url: string | null;
  notes?: string | null;
};

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
  teams?: TeamValue[];
  venues?: VenueValue[];
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
  teams: [],
  venues: [{ name: "", address: null, google_maps_url: null }],
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
  const [step, setStep] = useState(1);
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
          teams: [], // Handled separately if needed, but usually creation only
        }
      : empty(),
  );

  // Initialize teams when team_count changes in Step 1
  useEffect(() => {
    if (!initial && values.team_count > 0 && (!values.teams || values.teams.length === 0)) {
      const initialTeams = Array.from({ length: values.team_count }, (_, i) => ({
        name: `Team ${i + 1}`,
        logo_url: null,
        group_label: null,
      }));
      setValues((v) => ({ ...v, teams: initialTeams }));
    } else if (!initial && values.teams && values.teams.length !== values.team_count) {
      // Adjust teams array length if team_count changes
      setValues((v) => {
        const nextTeams = [...(v.teams || [])];
        if (nextTeams.length < values.team_count) {
          for (let i = nextTeams.length; i < values.team_count; i++) {
            nextTeams.push({ name: `Team ${i + 1}`, logo_url: null, group_label: null });
          }
        } else if (nextTeams.length > values.team_count) {
          nextTeams.splice(values.team_count);
        }
        return { ...v, teams: nextTeams };
      });
    }
  }, [values.team_count, initial]);

  const set = <K extends keyof TournamentValues>(key: K, value: TournamentValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const setTeam = (index: number, team: Partial<TeamValue>) => {
    setValues((v) => {
      const nextTeams = [...(v.teams || [])];
      if (nextTeams[index]) {
        nextTeams[index] = { ...nextTeams[index], ...team } as TeamValue;
      }
      return { ...v, teams: nextTeams };
    });
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      if (!values.name.trim()) {
        toast.error("Tournament name is required");
        return false;
      }
      if (values.team_count < 2) {
        toast.error("At least 2 teams are required");
        return false;
      }
      const isGroupKnockout = values.format === "group_knockout";
      if (isGroupKnockout) {
        const knockoutTeams = values.group_count * values.qualifiers_per_group;
        const isValidKnockoutSize = (size: number) => size > 0 && (size & (size - 1)) === 0;
        if (!isValidKnockoutSize(knockoutTeams)) {
          toast.error(`Invalid knockout size (${knockoutTeams}). Must be 2, 4, 8, or 16.`);
          return false;
        }
      }
    }

    if (currentStep === 2) {
      const teams = values.teams || [];
      const names = new Set();
      for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        if (!team) continue;
        const name = team.name.trim();
        if (!name) {
          toast.error(`Team ${i + 1} name cannot be blank`);
          return false;
        }
        if (names.has(name)) {
          toast.error(`A team with name "${name}" already exists`);
          return false;
        }
        names.add(name);
      }

      // Group capacity validation
      if (values.format === "group_knockout" && values.group_count > 0) {
        const teamsPerGroup = Math.ceil(values.team_count / values.group_count);
        const groupCounts: Record<string, number> = {};
        for (let j = 0; j < teams.length; j++) {
          const team = teams[j];
          if (team?.group_label) {
            groupCounts[team.group_label] = (groupCounts[team.group_label] || 0) + 1;
            if (groupCounts[team.group_label]! > teamsPerGroup) {
              toast.error(
                `Group ${team.group_label} already has the maximum of ${teamsPerGroup} teams.`,
              );
              return false;
            }
          }
        }
      }
    }

    return true;
  };

  const next = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
      window.scrollTo(0, 0);
    }
  };

  const back = () => {
    setStep((s) => s - 1);
    window.scrollTo(0, 0);
  };

  const submit = () => {
    const nextVal = { ...values, slug: values.slug || uniqueSlug(values.name) };
    const parsed = schema.safeParse(nextVal);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    onSubmit(nextVal);
  };

  const isLeague = values.format === "league";
  const isGroupKnockout = values.format === "group_knockout";
  const teamsPerGroup = isGroupKnockout && values.group_count > 0 ? values.team_count / values.group_count : 0;
  const isUnevenGroups = teamsPerGroup > 0 && !Number.isInteger(teamsPerGroup);
  const knockoutTeams = isGroupKnockout ? values.group_count * values.qualifiers_per_group : 0;

  const knockoutRoundLabel = (size: number) => {
    if (size === 2) return "Final";
    if (size === 4) return "Semi-finals → Final";
    if (size === 8) return "Quarter-finals → Semi-finals → Final";
    if (size === 16) return "Round of 16 → Quarter-finals → Semi-finals → Final";
    return `${size}-team bracket`;
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="surface-card space-y-4 p-5">
        <h2 className="font-display text-lg font-semibold text-primary">Step 1: Basics & Format</h2>
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
          <div className="col-span-full">
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
          </div>
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
          {(isLeague || isGroupKnockout) && (
            <Field
              label={isGroupKnockout ? "Group Stage Legs" : "Legs (times each pair meets)"}
              hint={isGroupKnockout ? "Group stage pairings." : "1 = single round robin, 2 = double"}
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

          {isLeague && (
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

          {isGroupKnockout && (
            <>
              <Field label="Number of Teams">
                <Input
                  type="number"
                  min={2}
                  value={values.team_count}
                  onChange={(e) => set("team_count", Number(e.target.value) || 0)}
                />
              </Field>

              <Field label="Number of Groups">
                <Input
                  type="number"
                  min={1}
                  max={16}
                  value={values.group_count}
                  onChange={(e) => set("group_count", Number(e.target.value) || 0)}
                />
                {isUnevenGroups && (
                  <p className="mt-1 text-xs text-destructive">
                    Warning: Teams cannot be evenly distributed.
                  </p>
                )}
              </Field>

              <Field label="Teams per Group">
                <Input
                  type="text"
                  readOnly
                  disabled
                  value={isUnevenGroups ? "Uneven" : teamsPerGroup || "—"}
                  className="bg-muted"
                />
              </Field>

              <Field
                label="Qualifiers from Each Group"
                hint="Top teams advancing to knockout."
              >
                <Input
                  type="number"
                  min={1}
                  max={Math.floor(teamsPerGroup) || 1}
                  value={values.qualifiers_per_group}
                  onChange={(e) => set("qualifiers_per_group", Number(e.target.value) || 1)}
                />
              </Field>

              <div className="col-span-full space-y-3 rounded-lg bg-muted/50 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Tournament Structure
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground">Total Teams</p>
                    <p className="font-medium">{values.team_count}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Groups</p>
                    <p className="font-medium">
                      {values.group_count} ({Math.floor(teamsPerGroup)} teams each)
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Knockout Stage</p>
                    <p className={`font-medium ${!(knockoutTeams > 0 && (knockoutTeams & (knockoutTeams - 1)) === 0) ? "text-destructive" : ""}`}>
                      {knockoutTeams} Teams
                    </p>
                  </div>
                  <div className="col-span-full">
                    <p className="text-muted-foreground">Rounds</p>
                    <p className="font-medium">{knockoutRoundLabel(knockoutTeams)}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {!isGroupKnockout && (
            <Field label="Number of teams">
              <Input
                type="number"
                min={2}
                value={values.team_count}
                onChange={(e) => set("team_count", Number(e.target.value) || 0)}
              />
            </Field>
          )}
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={next} className="w-full sm:w-auto">
          Next Step <ChevronRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const groups = Array.from({ length: values.group_count }, (_, i) => String.fromCharCode(65 + i));
    const teams = values.teams || [];

    return (
      <div className="space-y-6">
        <div className="surface-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-primary">Step 2: Team Details</h2>
            <div className="text-sm text-muted-foreground">
              {teams.length} teams total
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="hidden grid-cols-[80px_1fr_150px] gap-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
              <div>Logo</div>
              <div>Team Name</div>
              <div>{values.format === "group_knockout" ? "Group" : ""}</div>
            </div>

            <div className="space-y-3">
              {teams.map((team, idx) => (
                <div key={idx} className="flex flex-col gap-4 rounded-lg border border-border p-3 sm:grid sm:grid-cols-[80px_1fr_150px] sm:items-center">
                  <div className="flex justify-center sm:justify-start">
                    <div className="relative group">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted border border-border flex items-center justify-center">
                        {team.logo_url ? (
                          <img src={team.logo_url} alt="" className="h-full w-full object-contain" />
                        ) : (
                          <ImagePlus className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-lg">
                        <ImageUpload 
                          value={team.logo_url}
                          onChange={(url) => setTeam(idx, { logo_url: url })}
                          folder="team-logos"
                          className="!p-0"
                          rounded="rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <Label className="mb-1.5 block text-xs sm:hidden">Team Name</Label>
                    <Input
                      value={team.name}
                      onChange={(e) => setTeam(idx, { name: e.target.value })}
                      placeholder={`Team ${idx + 1}`}
                      className="w-full"
                    />
                  </div>

                  {values.format === "group_knockout" && (
                    <div>
                      <Label className="mb-1.5 block text-xs sm:hidden">Group</Label>
                      <Select
                        value={team.group_label || "none"}
                        onValueChange={(v) => setTeam(idx, { group_label: v === "none" ? null : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="No group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No group</SelectItem>
                          {groups.map((g) => (
                            <SelectItem key={g} value={g}>
                              Group {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" onClick={back}>
            <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
          <Button onClick={next} className="w-full sm:w-auto">
            Next Step <ChevronRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="surface-card space-y-4 p-5">
        <h2 className="font-display text-lg font-semibold text-primary">Step 3: Schedule & Venue</h2>
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
          <Field label="Google Maps link">
            <div className="flex gap-2">
              <Input
                value={values.venue_map_url ?? ""}
                onChange={(e) => set("venue_map_url", e.target.value || null)}
                placeholder="https://maps.google.com/..."
              />
              {values.venue_map_url && (
                <Button variant="outline" size="icon" asChild>
                  <a href={values.venue_map_url} target="_blank" rel="noreferrer">
                    <MapPin className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </Field>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={back}>
          <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
        <Button onClick={next} className="w-full sm:w-auto">
          Next Step <ChevronRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="surface-card space-y-4 p-5">
        <h2 className="font-display text-lg font-semibold text-primary">Step 4: Branding & Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Logo image URL">
             <ImageUpload 
              value={values.logo_url}
              onChange={(url) => set("logo_url", url)}
              folder="tournament-logos"
            />
          </Field>
          <Field label="Banner image URL">
             <ImageUpload 
              value={values.banner_url}
              onChange={(url) => set("banner_url", url)}
              folder="tournament-banners"
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
            <p className="text-xs text-muted-foreground">Anyone with the link can view.</p>
          </div>
          <Switch checked={values.is_public} onCheckedChange={(v) => set("is_public", v)} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={back}>
          <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
        <Button size="lg" onClick={submit} disabled={pending} className="w-full sm:w-auto">
          {submitLabel}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2 overflow-x-auto py-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center shrink-0">
            <div 
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                step >= s ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </div>
            {s < 4 && (
              <div className={`h-[2px] w-8 mx-2 ${step > s ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>
      
      <div className="mb-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Step {step} of 4
        </p>
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </div>
  );
}

// Add a Label helper if missing from UI components (it was imported from radix/react-label but let's be safe)
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>
      {children}
    </label>
  );
}
