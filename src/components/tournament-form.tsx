import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { 
  MapPin, ChevronLeft, ChevronRight, ImagePlus, X, Users, RefreshCw, 
  Trash2, Trophy, ArrowRight, Lock, Unlock, Play, Search, Edit2, GripVertical, Check, ListOrdered
} from "lucide-react";
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
// Badge imported from ui below
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Field } from "@/components/data-bits";
import { ImageUpload } from "@/components/image-upload";
import { PoolDraw } from "@/components/pool-draw";
import { TOURNAMENT_FORMATS, PLAYOFF_FORMATS } from "@/lib/formats";
import { STATUSES, mapsUrl, uniqueSlug } from "@/lib/app";
import type { Tournament } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type TeamValue = {
  id?: string;
  name: string;
  logo_url: string | null;
  group_label: string | null;
  is_locked?: boolean;
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
  const [showPoolDraw, setShowPoolDraw] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTeamIdx, setEditingTeamIdx] = useState<number | null>(null);
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

  const setVenue = (index: number, venue: Partial<VenueValue>) => {
    setValues((v) => {
      const nextVenues = [...(v.venues || [])];
      if (nextVenues[index]) {
        nextVenues[index] = { ...nextVenues[index], ...venue } as VenueValue;
      }
      return { ...v, venues: nextVenues };
    });
  };

  const addVenue = () => {
    setValues((v) => ({
      ...v,
      venues: [...(v.venues || []), { name: "", address: null, google_maps_url: null }],
    }));
  };

  const removeVenue = (index: number) => {
    setValues((v) => {
      const nextVenues = (v.venues || []).filter((_, i) => i !== index);
      return { ...v, venues: nextVenues };
    });
  };

  const shuffleGroups = () => {
    setValues((v) => {
      const teams = [...(v.teams || [])];
      const groups = v.group_count || 1;
      const teamsPerGroup = Math.ceil(v.team_count / groups);
      
      const lockedTeams = teams.filter(t => t.is_locked && t.group_label);
      const eligibleTeams = teams.filter(t => !t.is_locked || !t.group_label);
      
      // Randomize eligible teams
      for (let i = eligibleTeams.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [eligibleTeams[i], eligibleTeams[j]] = [eligibleTeams[j]!, eligibleTeams[i]!] as [TeamValue, TeamValue];
      }

      const nextTeams: TeamValue[] = [...lockedTeams];
      
      const counts: Record<string, number> = {};
      lockedTeams.forEach(t => {
        if (t.group_label) counts[t.group_label] = (counts[t.group_label] || 0) + 1;
      });

      let eligibleIdx = 0;
      for (let i = 0; i < groups; i++) {
        const label = String.fromCharCode(65 + i);
        let currentCount = counts[label] || 0;
        while (currentCount < teamsPerGroup && eligibleIdx < eligibleTeams.length) {
          nextTeams.push({ ...eligibleTeams[eligibleIdx]!, group_label: label });
          eligibleIdx++;
          currentCount++;
        }
      }

      while (eligibleIdx < eligibleTeams.length) {
        nextTeams.push(eligibleTeams[eligibleIdx]!);
        eligibleIdx++;
      }

      // Restore original order based on original indices if we want to keep the roster list stable
      // But for knockout, the shuffle result IS the new state.
      return { ...v, teams: nextTeams };
    });
    toast.success("Teams shuffled successfully.");
  };

  const clearGroups = () => {
    setValues((v) => ({
      ...v,
      teams: (v.teams || []).map(t => t.is_locked ? t : { ...t, group_label: null })
    }));
    toast.success("Group assignments cleared");
    setShowClearConfirm(false);
  };

  const poolDraw = () => {
    // Before opening pool draw, ensure we sync current assignments
    setShowPoolDraw(true);
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

    if (currentStep === 3) {
      if (!values.start_date || !values.end_date) {
        toast.error("Tournament dates are required");
        return false;
      }
      const start = new Date(values.start_date);
      const end = new Date(values.end_date);
      if (end < start) {
        toast.error("End date must be on or after the tournament start date.");
        return false;
      }
      const venues = values.venues || [];
      if (venues.length === 0) {
        toast.error("Add at least one venue before continuing.");
        return false;
      }
      for (let i = 0; i < venues.length; i++) {
        if (!venues[i]?.name.trim()) {
          toast.error(`Venue ${i + 1} name is required`);
          return false;
        }
      }
    }

    return true;
  };

  const next = () => {
    if (!validateStep(step)) return;

    if (step === 2 && isGroupKnockout) {
      // Step 2 is now the combined "Teams & Group Draw" for knockout
      const teams = values.teams || [];
      const unassigned = teams.filter(t => !t.group_label);
      if (unassigned.length > 0) {
        toast.error(`${unassigned.length} teams have not been assigned to a group.`);
        return;
      }
    } else if (step === 3 && !isGroupKnockout) {
      submit();
      return;
    }
    
    if (step === 4 && isGroupKnockout) {
      submit();
      return;
    }

    setStep((s) => s + 1);

    setStep((s) => s + 1);
    window.scrollTo(0, 0);
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

  const renderStep2 = () => {
    if (isGroupKnockout) return renderCombinedStep2();
    
    return (
      <div className="space-y-6">
        <div className="surface-card p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="font-display text-lg font-bold">Teams Roster</h2>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{values.team_count} Teams</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(values.teams || []).map((team, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                <div className="w-10 h-10 shrink-0">
                  <ImageUpload 
                    value={team.logo_url}
                    onChange={(url) => setTeam(idx, { logo_url: url })}
                    folder="team-logos"
                    className="!gap-0 !p-0"
                  />
                </div>
                <Input
                  value={team.name}
                  onChange={(e) => setTeam(idx, { name: e.target.value })}
                  placeholder={`Team ${idx + 1}`}
                  className="bg-background border-border/60"
                />
              </div>
            ))}
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

  const renderCombinedStep2 = () => {
    const teams = values.teams || [];
    const filteredTeams = teams.map((t, i) => ({ ...t, originalIdx: i })).filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const groups = Array.from({ length: values.group_count }, (_, i) => String.fromCharCode(65 + i));
    const teamsPerGroup = Math.ceil(values.team_count / (values.group_count || 1));

    return (
      <TooltipProvider>
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="surface-card p-0 overflow-hidden border-primary/20 shadow-xl shadow-primary/5">
            <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-border/40 bg-muted/20">
              <div className="space-y-1">
                <h2 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Teams & Group Draw
                </h2>
                <p className="text-sm text-muted-foreground">Manage your roster and assign groups in one workspace.</p>
              </div>
              <div className="flex items-center gap-3">
                 <div className="text-lg font-bold font-display px-4 py-2 rounded-xl bg-background border-2 border-primary/20 flex items-center gap-2">
                  <span className="text-primary">{values.team_count}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-sans">Total Teams</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-[1fr_350px]">
              {/* Left Column: Team Roster Workspace */}
              <div className="p-6 border-r border-border/40 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search teams..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-muted/30 border-border/40 focus:border-primary/50 transition-all rounded-full"
                    />
                  </div>
                </div>

                <div className="border rounded-xl overflow-hidden bg-background/50 backdrop-blur-sm">
                  <div className="grid grid-cols-[50px_60px_1fr_120px] gap-4 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 border-b bg-muted/10">
                    <div className="text-center">#</div>
                    <div>Logo</div>
                    <div>Team Identity</div>
                    <div>Assignment</div>
                  </div>

                  <ScrollArea className="h-[550px]">
                    <div className="divide-y divide-border/20">
                      {filteredTeams.map((team) => {
                        const isEditing = editingTeamIdx === team.originalIdx;
                        return (
                          <div 
                            key={team.originalIdx} 
                            className={cn(
                              "grid grid-cols-[50px_60px_1fr_120px] gap-4 items-center px-4 py-3 transition-all hover:bg-primary/5",
                              team.group_label && "bg-primary/[0.02]"
                            )}
                          >
                            <div className="text-xs font-mono text-muted-foreground text-center">
                              {team.originalIdx + 1}
                            </div>
                            
                            <div className="relative group w-11 h-11">
                              <div className="h-full w-full rounded-xl bg-muted/50 border border-border/60 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                                {team.logo_url ? (
                                  <img src={team.logo_url} alt="" className="h-full w-full object-contain p-1" />
                                ) : (
                                  <Users className="h-5 w-5 text-muted-foreground/30" />
                                )}
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/60 rounded-xl">
                                <ImageUpload 
                                  value={team.logo_url}
                                  onChange={(url) => setTeam(team.originalIdx, { logo_url: url })}
                                  folder="team-logos"
                                  className="!gap-0 !p-0"
                                  rounded="rounded-xl"
                                />
                              </div>
                            </div>

                            <div className="group/name relative">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    autoFocus
                                    value={team.name}
                                    onChange={(e) => setTeam(team.originalIdx, { name: e.target.value })}
                                    onBlur={() => setEditingTeamIdx(null)}
                                    onKeyDown={(e) => e.key === 'Enter' && setEditingTeamIdx(null)}
                                    className="h-8 text-sm focus-visible:ring-primary/30"
                                  />
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingTeamIdx(null)}>
                                    <Check className="h-4 w-4 text-green-500" />
                                  </Button>
                                </div>
                              ) : (
                                <div 
                                  className="flex items-center gap-2 cursor-text group"
                                  onClick={() => setEditingTeamIdx(team.originalIdx)}
                                >
                                  <span className="font-semibold text-sm truncate max-w-[180px]">{team.name}</span>
                                  <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Select
                                value={team.group_label || "unassigned"}
                                onValueChange={(v) => {
                                  const newGroup = v === "unassigned" ? null : v;
                                  setTeam(team.originalIdx, { 
                                    group_label: newGroup,
                                    is_locked: !!newGroup
                                  });
                                }}
                              >
                                <SelectTrigger className={cn(
                                  "h-8 text-[11px] font-bold px-3 border-border/40 rounded-lg",
                                  team.group_label ? "bg-primary text-primary-foreground border-transparent" : "bg-background"
                                )}>
                                  <SelectValue placeholder="-" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned" className="text-xs">No Group</SelectItem>
                                  {groups.map((g) => {
                                    const count = teams.filter(t => t.group_label === g).length;
                                    const isFull = count >= teamsPerGroup && team.group_label !== g;
                                    return (
                                      <SelectItem key={g} value={g} disabled={isFull} className="text-xs">
                                        Group {g} {isFull ? "(Full)" : ""}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              
                              {team.group_label && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                                      onClick={() => setTeam(team.originalIdx, { is_locked: !team.is_locked })}
                                    >
                                      {team.is_locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {team.is_locked ? "Locked: Won't be changed by Shuffle" : "Unlocked: Can be shuffled"}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Right Column: Groups Workspace */}
              <div className="bg-muted/10 p-6 flex flex-col gap-6">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Quick Actions
                  </h3>
                  <div className="grid gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={shuffleGroups} 
                      className="justify-start border-border/60 bg-background/50 hover:bg-primary/5 hover:border-primary/40 rounded-xl h-11"
                    >
                      <RefreshCw className="mr-3 h-4 w-4 text-primary" /> 
                      <span className="font-semibold">Shuffle All</span>
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={poolDraw} 
                      className="justify-start shadow-lg shadow-primary/20 rounded-xl h-11 bg-primary hover:bg-primary/90"
                    >
                      <Trophy className="mr-3 h-4 w-4" /> 
                      <span className="font-semibold">Pool Draw</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowClearConfirm(true)} 
                      className="justify-start text-destructive hover:bg-destructive/5 rounded-xl h-11"
                    >
                      <Trash2 className="mr-3 h-4 w-4" /> 
                      <span className="font-semibold">Reset Assignments</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 flex-1 min-h-0">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                    Group Overview
                  </h3>
                  <ScrollArea className="h-[400px] pr-4 -mr-4">
                    <div className="grid gap-3">
                      {groups.map((g) => {
                        const groupTeams = teams.filter(t => t.group_label === g);
                        const isFull = groupTeams.length >= teamsPerGroup;
                        
                        return (
                          <div 
                            key={g} 
                            className={cn(
                              "p-4 rounded-2xl border transition-all duration-300",
                              isFull ? "border-green-500/30 bg-green-500/5" : "border-border/60 bg-background shadow-sm"
                            )}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-[10px] font-black text-primary">{g}</span>
                                </div>
                                <span className="font-bold text-sm">Group {g}</span>
                              </div>
                              <Badge variant={isFull ? "default" : "outline"} className={cn(
                                "text-[10px] font-bold rounded-full px-2 h-5",
                                isFull ? "bg-green-500 hover:bg-green-500 text-white" : "border-primary/20 text-primary"
                              )}>
                                {groupTeams.length} / {teamsPerGroup}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {groupTeams.map((t) => (
                                <div key={t.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/20 text-[11px] font-medium animate-in fade-in slide-in-from-left-1">
                                  <div className="h-4 w-4 rounded bg-background border border-border/40 flex items-center justify-center overflow-hidden shrink-0">
                                    {t.logo_url ? (
                                      <img src={t.logo_url} alt="" className="h-full w-full object-contain p-0.5" />
                                    ) : (
                                      <Users className="h-2 w-2 text-muted-foreground" />
                                    )}
                                  </div>
                                  <span className="truncate flex-1">{t.name}</span>
                                  {t.is_locked && <Lock className="h-2.5 w-2.5 text-muted-foreground/40" />}
                                </div>
                              ))}
                              {groupTeams.length === 0 && (
                                <div className="text-[10px] text-muted-foreground/40 italic py-2 text-center bg-muted/5 rounded-lg border border-dashed border-border/40">
                                  Waiting for teams...
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button variant="ghost" onClick={back} className="rounded-xl px-6 h-12">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Format
            </Button>
            <Button onClick={next} disabled={pending} className="px-10 h-12 font-bold rounded-xl shadow-xl shadow-primary/20">
              Continue to Venues <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <PoolDraw 
            open={showPoolDraw}
            onOpenChange={setShowPoolDraw}
            teams={teams}
            groupCount={values.group_count}
            teamsPerGroup={teamsPerGroup}
            onApply={(drawn) => set("teams", drawn)}
          />

          <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
            <AlertDialogContent className="rounded-2xl border-primary/20">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-display font-bold">Reset assignments?</AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  This will move all teams back to the "Unassigned" pool. Your team names and logos will be preserved.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3">
                <AlertDialogCancel className="rounded-xl">Keep Current</AlertDialogCancel>
                <AlertDialogAction onClick={clearGroups} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
                  Reset Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TooltipProvider>
    );
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="surface-card space-y-4 p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-lg font-semibold text-primary">Step 1: Basics & Branding</h2>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-4">
            <Field label="Logo image">
               <ImageUpload 
                value={values.logo_url}
                onChange={(url) => set("logo_url", url)}
                folder="tournament-logos"
              />
            </Field>
            <Field label="Banner image">
               <ImageUpload 
                value={values.banner_url}
                onChange={(url) => set("banner_url", url)}
                folder="tournament-banners"
              />
            </Field>
          </div>
          
          <div className="space-y-4">
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
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-border/40">
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

              <Field
                label="Teams per Group"
                hint="Editing this updates the total number of teams."
              >
                <Input
                  type="number"
                  min={1}
                  value={isUnevenGroups ? "" : teamsPerGroup || ""}
                  placeholder={isUnevenGroups ? "Uneven" : "—"}
                  onChange={(e) => {
                    const per = Number(e.target.value) || 0;
                    const groups = values.group_count || 1;
                    if (per > 0) set("team_count", per * groups);
                  }}
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


  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="surface-card space-y-6 p-5">
        <div className="space-y-1">
          <h2 className="font-display text-lg font-semibold text-primary">Schedule & Venues</h2>
          <p className="text-sm text-muted-foreground">
            Set the tournament dates and add the venues where matches will be played.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start Date">
            <Input
              type="date"
              value={values.start_date ?? ""}
              onChange={(e) => set("start_date", e.target.value || null)}
            />
          </Field>
          <Field label="End Date">
            <Input
              type="date"
              value={values.end_date ?? ""}
              onChange={(e) => set("end_date", e.target.value || null)}
            />
          </Field>
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Tournament Venues
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVenue}
              className="text-xs"
            >
              <ChevronRight className="mr-1 h-3 w-3 rotate-90" /> + Add Venue
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(values.venues || []).map((v, idx) => (
              <div key={idx} className="group relative space-y-3 rounded-lg border border-border bg-muted/30 p-4 transition-colors hover:border-primary/50">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => {
                    if (window.confirm(`Delete "${v.name || `Venue ${idx + 1}`}"?`)) {
                      removeVenue(idx);
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
                
                <Field label="Venue Name">
                  <Input
                    value={v.name}
                    onChange={(e) => setVenue(idx, { name: e.target.value })}
                    placeholder="e.g. National Sports Complex"
                    className="h-8 text-sm"
                  />
                </Field>

                <Field label="Location / Address">
                  <Input
                    value={v.address ?? ""}
                    onChange={(e) => setVenue(idx, { address: e.target.value || null })}
                    placeholder="e.g. Tripureshwor, Kathmandu"
                    className="h-8 text-sm"
                  />
                </Field>

                <Field label="Google Maps Link">
                  <div className="flex gap-1.5">
                    <Input
                      value={v.google_maps_url ?? ""}
                      onChange={(e) => setVenue(idx, { google_maps_url: e.target.value || null })}
                      placeholder="https://maps.google.com/..."
                      className="h-8 text-sm"
                    />
                    {v.google_maps_url && (
                      <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" asChild>
                        <a href={v.google_maps_url} target="_blank" rel="noreferrer">
                          <MapPin className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                  </div>
                </Field>

                <Field label="Optional Notes">
                  <Input
                    value={v.notes ?? ""}
                    onChange={(e) => setVenue(idx, { notes: e.target.value || null })}
                    placeholder="e.g. Main basketball hall"
                    className="h-8 text-sm"
                  />
                </Field>
              </div>
            ))}
          </div>

          {(values.venues || []).length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">No venues added yet.</p>
              <Button
                type="button"
                variant="link"
                onClick={addVenue}
                className="mt-1 h-auto p-0 text-xs font-semibold text-primary"
              >
                + Add at least one venue
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="surface-card space-y-4 p-5">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Additional Details
        </h3>
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
        <Button onClick={next} className="w-full sm:w-auto">
          {isGroupKnockout ? "Continue to Venues" : submitLabel} 
          {isGroupKnockout && <ChevronRight className="ml-1.5 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );


  const totalSteps = isGroupKnockout ? 4 : 3;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2 overflow-x-auto py-2 no-scrollbar">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
          <div key={s} className="flex items-center shrink-0">
            <div 
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                step >= s 
                  ? "bg-primary text-white ring-4 ring-primary/20 scale-110" 
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </div>
            {s < totalSteps && (
              <div className={`h-[2px] w-12 mx-2 rounded-full ${step > s ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>
      
      <div className="mb-6">
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">
          Step {step} of {totalSteps}
        </h2>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && isGroupKnockout && (
          <div className="surface-card p-10 text-center space-y-4">
             <Trophy className="h-16 w-16 text-primary mx-auto opacity-20" />
             <div>
               <h2 className="text-2xl font-display font-bold">Ready to Create</h2>
               <p className="text-muted-foreground">Review your settings and finalize the tournament.</p>
             </div>
             <div className="flex justify-center gap-4 pt-4">
               <Button variant="outline" onClick={back}>Back</Button>
               <Button onClick={submit} disabled={pending} size="lg" className="px-10 font-bold">
                 {pending ? "Creating..." : submitLabel}
               </Button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ children, variant = "default", className }: { children: React.ReactNode, variant?: "default" | "outline", className?: string }) {
  const variants = {
    default: "bg-primary text-primary-foreground border-transparent",
    outline: "text-muted-foreground border-border",
    secondary: "bg-secondary text-secondary-foreground border-transparent",
    destructive: "bg-destructive text-destructive-foreground border-transparent",
  };
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      variants[variant as keyof typeof variants] || variants.default,
      className
    )}>
      {children}
    </span>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}>
      {children}
    </label>
  );
}

