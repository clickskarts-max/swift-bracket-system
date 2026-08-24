import { useEffect, useMemo, useState } from "react";
import { Check, Globe, Search, Target, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useTournaments } from "@/lib/queries";
import {
  useCampaignTournaments,
  useSetCampaignTournaments,
  useUpdateAdCampaign,
  type AdCampaign,
} from "@/lib/ads.functions";

type Mode = "all" | "selected" | "none";

const MODES: { value: Mode; label: string; description: string }[] = [
  { value: "all", label: "All Tournaments", description: "Serve on every eligible public tournament page." },
  { value: "selected", label: "Selected Tournaments", description: "Serve only on tournaments you pick below." },
  { value: "none", label: "No Tournaments", description: "Never serve — useful for drafts and testing." },
];

export function TournamentTargeting({ campaign }: { campaign: AdCampaign }) {
  const { data: tournaments = [], isLoading: loadingTournaments } = useTournaments();
  const { data: linked = [], isLoading: loadingLinks } = useCampaignTournaments(campaign.id);
  const setTournaments = useSetCampaignTournaments();
  const updateCampaign = useUpdateAdCampaign();

  const [mode, setMode] = useState<Mode>(campaign.tournament_targeting_mode ?? "all");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [previewId, setPreviewId] = useState<string>("");

  useEffect(() => setMode(campaign.tournament_targeting_mode ?? "all"), [campaign.tournament_targeting_mode]);
  useEffect(() => setSelected(linked), [linked]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tournaments;
    return tournaments.filter((t: any) =>
      [t.name, t.format, t.status].filter(Boolean).some((v: string) => String(v).toLowerCase().includes(q)),
    );
  }, [tournaments, search]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const dirty =
    mode !== (campaign.tournament_targeting_mode ?? "all") ||
    selected.length !== linked.length ||
    selected.some((id) => !linked.includes(id));

  const handleSave = async () => {
    try {
      await updateCampaign.mutateAsync({ id: campaign.id, tournament_targeting_mode: mode } as any);
      await setTournaments.mutateAsync({
        campaignId: campaign.id,
        tournamentIds: mode === "selected" ? selected : [],
      });
      toast.success("Tournament targeting saved");
    } catch {
      toast.error("Failed to save targeting");
    }
  };

  const invalid = mode === "selected" && selected.length === 0;

  const previewEligible = useMemo(() => {
    if (!previewId) return null;
    if (mode === "none") return { ok: false, reason: "Targeting mode is set to No Tournaments" };
    if (mode === "selected" && !selected.includes(previewId))
      return { ok: false, reason: "Tournament is not in the selected list" };
    if (!campaign.ad_creatives_count && campaign.status !== "active")
      return { ok: true, reason: "Tournament matches targeting (campaign is not active yet)" };
    return { ok: true, reason: "Tournament matches targeting" };
  }, [previewId, mode, selected, campaign]);

  return (
    <div className="space-y-6">
      <div className="surface-card border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Tournament Targeting</h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={cn(
                "text-left rounded-lg border p-4 transition-colors",
                mode === m.value ? "border-primary bg-primary/5" : "border-border/60 hover:border-border",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{m.label}</span>
                {mode === m.value && <Check className="h-4 w-4 text-primary" />}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{m.description}</p>
            </button>
          ))}
        </div>

        {mode === "all" && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Globe className="h-4 w-4" /> This campaign is eligible on all public tournament pages.
          </p>
        )}

        {mode === "selected" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <Label className="text-sm">
                {selected.length} tournament{selected.length === 1 ? "" : "s"} selected
              </Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelected(tournaments.map((t: any) => t.id))}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
                  Clear All
                </Button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search tournaments by name, format or status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="max-h-80 overflow-auto rounded-lg border border-border/60 divide-y divide-border/40">
              {loadingTournaments || loadingLinks ? (
                <p className="p-4 text-sm text-muted-foreground">Loading tournaments...</p>
              ) : filtered.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No tournaments match your search.</p>
              ) : (
                filtered.map((t: any) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <Checkbox checked={selected.includes(t.id)} onCheckedChange={() => toggle(t.id)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">
                        {String(t.format || "").replace(/-/g, " ")} · {t.status}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>

            {invalid && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <XCircle className="h-4 w-4" /> No tournaments selected — this campaign will not serve anywhere.
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={!dirty || setTournaments.isPending || updateCampaign.isPending}>
            Save Targeting
          </Button>
          {dirty && <span className="text-[11px] text-muted-foreground">Unsaved changes</span>}
        </div>
      </div>

      <div className="surface-card border rounded-xl p-6 space-y-3">
        <h3 className="font-semibold text-sm">Preview On Tournament</h3>
        <select
          className="h-10 w-full rounded-md border border-border/60 bg-background px-3 text-sm"
          value={previewId}
          onChange={(e) => setPreviewId(e.target.value)}
        >
          <option value="">Select tournament…</option>
          {tournaments.map((t: any) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {previewEligible && (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant={previewEligible.ok ? "default" : "secondary"}>
              {previewEligible.ok ? "Eligible" : "Not eligible"}
            </Badge>
            <span className="text-muted-foreground">{previewEligible.reason}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function targetingSummary(campaign: {
  tournament_targeting_mode?: Mode;
  ad_campaign_tournaments?: { tournament_id: string }[];
}) {
  const mode = campaign.tournament_targeting_mode ?? "all";
  if (mode === "all") return "All Tournaments";
  if (mode === "none") return "None";
  const count = campaign.ad_campaign_tournaments?.length ?? 0;
  return count === 0 ? "No tournaments selected" : `${count} Tournament${count === 1 ? "" : "s"}`;
}
