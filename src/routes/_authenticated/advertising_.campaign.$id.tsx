import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { 
  useAdCampaigns, 
  AdCampaign, 
  AdCreative, 
  useUpdateAdCampaign,
  useDeleteAdCampaign,
  useCampaignInventory,
  useCampaignPerformance
} from "@/lib/ads.functions";
import { useState, useMemo } from "react";
import { 
  BarChart3, 
  ImageIcon, 
  Layout, 
  Settings2, 
  Target, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronLeft,
  Info,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  ExternalLink,
  MoreVertical,
  Layers,
  Globe
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard, StatusPill } from "@/components/data-bits";
import { toast } from "sonner";
import { CampaignDetailDrawer } from "@/components/ads/campaign-detail-drawer";
import { TournamentTargeting, targetingSummary } from "@/components/ads/tournament-targeting";
import { InventoryManagement } from "@/components/ads/inventory-management";
import { SponsorCreatives } from "@/components/ads/sponsor-creatives";
import { INVENTORY_BY_KEY } from "@/lib/ad-inventory";

export const Route = createFileRoute("/_authenticated/advertising_/campaign/$id")({
  component: CampaignWorkspace,
});

const TABS = ["overview", "creatives", "inventory", "targeting", "performance", "settings"] as const;

function CampaignWorkspace() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: campaigns = [], isLoading } = useAdCampaigns();
  const updateCampaign = useUpdateAdCampaign();
  const deleteCampaign = useDeleteAdCampaign();
  const { data: inventoryRows = [] } = useCampaignInventory(id);
  const { data: perf = [] } = useCampaignPerformance(id);
  
  const [activeTab, setActiveTab] = useState<string>("overview");

  const campaign = useMemo(() => 
    campaigns.find(c => c.id === id), 
    [campaigns, id]
  );

  const totals = useMemo(
    () =>
      perf.reduce(
        (acc, r) => ({ impressions: acc.impressions + r.impressions, clicks: acc.clicks + r.clicks }),
        { impressions: 0, clicks: 0 },
      ),
    [perf],
  );


  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading campaign workspace...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Campaign not found.</p>
        <Button variant="outline" onClick={() => navigate({ to: "/advertising" })}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Advertising
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this campaign?")) {
      try {
        await deleteCampaign.mutateAsync(campaign.id);
        toast.success("Campaign deleted");
        navigate({ to: "/advertising" });
      } catch (e) {
        toast.error("Failed to delete campaign");
      }
    }
  };

  const toggleStatus = () => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    if (newStatus === 'active') {
      const missing: string[] = [];
      if (campaign.ad_creatives.length === 0) missing.push("Add at least one creative");
      if ((campaign.tournament_targeting_mode ?? 'all') === 'selected'
        && (campaign.ad_campaign_tournaments?.length ?? 0) === 0) missing.push("Select at least one tournament");
      if ((campaign.tournament_targeting_mode ?? 'all') === 'none') missing.push("Set tournament targeting to All or Selected");
      if (missing.length > 0) {
        toast.error("Campaign cannot be activated", { description: missing.join(" · ") });
        setActiveTab("targeting");
        return;
      }
    }
    updateCampaign.mutate({ id: campaign.id, status: newStatus });
  };

  const readiness = {
    details: true,
    creatives: campaign.ad_creatives.length > 0,
    inventory: inventoryRows.length > 0,
    targeting: (campaign.tournament_targeting_mode ?? 'all') !== 'selected' || (campaign.ad_campaign_tournaments?.length ?? 0) > 0,
  };


  const isReady = Object.values(readiness).every(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <button 
          onClick={() => navigate({ to: "/advertising" })}
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Ads & Sponsors
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{campaign.name}</span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold">{campaign.name}</h1>
            <StatusPill status={campaign.status} />
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            Advertiser: <span className="text-foreground font-medium">{campaign.advertiser || "Direct"}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant={campaign.status === 'active' ? "outline" : "default"}
            onClick={toggleStatus}
            className="gap-2"
          >
            {campaign.status === 'active' ? (
              <><Pause className="h-4 w-4" /> Pause</>
            ) : (
              <><Play className="h-4 w-4" /> Activate</>
            )}
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive gap-2">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent space-x-6">
          {TABS.map((tab) => (
            <TabsTrigger 
              key={tab}
              value={tab} 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-3 capitalize"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Impressions" value={totals.impressions.toLocaleString()} />
            <StatCard label="Clicks" value={totals.clicks.toLocaleString()} />
            <StatCard
              label="Avg. CTR"
              value={`${totals.impressions ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : "0.00"}%`}
            />
            <StatCard label="Inventory units" value={inventoryRows.length} />
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="surface-card p-6 border rounded-xl space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" /> Setup Readiness
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Campaign Details", status: readiness.details },
                    { label: "Creatives Uploaded", status: readiness.creatives, sub: "Add at least one ad unit" },
                    { label: "Inventory Assigned", status: readiness.inventory, sub: "Pick the slots this campaign may serve in" },
                    { label: "Targeting Configured", status: readiness.targeting },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{step.label}</span>
                        {step.sub && !step.status && <span className="text-[10px] text-muted-foreground">{step.sub}</span>}
                      </div>
                      {step.status ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  ))}
                </div>
                {!isReady && (
                  <Button className="w-full mt-4" onClick={() => setActiveTab("creatives")}>
                    Complete Setup
                  </Button>
                )}
              </div>

              <div className="surface-card p-6 border rounded-xl">
                <h3 className="font-semibold mb-4">Quick Details</h3>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Priority</p>
                    <p className="font-medium capitalize">{campaign.priority}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Auto Placement</p>
                    <p className="font-medium">{campaign.allow_auto_placement ? "Enabled" : "Disabled"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Tournament Targeting</p>
                    <p className="font-medium">{targetingSummary(campaign)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Start Date</p>
                    <p className="font-medium">Direct Delivery</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">{new Date(campaign.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="surface-card p-6 border rounded-xl">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" /> Coverage
                </h3>
                <div className="space-y-4">
                  {[
                    { label: "Leaderboard (728x90)", status: campaign.ad_creatives.some(c => c.size_preset === 'leaderboard') },
                    { label: "Rectangle (300x250)", status: campaign.ad_creatives.some(c => c.size_preset === 'medium-rectangle') },
                    { label: "Mobile Banner", status: campaign.ad_creatives.some(c => c.size_preset === 'mobile-banner' || c.size_preset === 'large-mobile-banner') },
                  ].map((size, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{size.label}</span>
                      <Badge variant={size.status ? "default" : "secondary"}>
                        {size.status ? "Active" : "Missing"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="creatives" className="pt-4 mt-0">
          <CampaignDetailDrawer 
            campaign={campaign as any} 
            open={true} 
            onOpenChange={() => {}} 
            forceTab="creatives"
            inline
          />
        </TabsContent>

        <TabsContent value="placements" className="pt-4 mt-0">
          <div className="surface-card p-8 border rounded-xl text-center">
            <Layout className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="font-semibold text-lg mb-2">Placement Targeting</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              Configure specific zones or tournament pages where this campaign should be prioritized.
            </p>
            <Badge variant="outline" className="px-4 py-1">Advanced Mode Required</Badge>
          </div>
        </TabsContent>

        <TabsContent value="targeting" className="pt-4 mt-0">
          <TournamentTargeting campaign={campaign} />
        </TabsContent>

        <TabsContent value="performance" className="pt-4 mt-0">
          <div className="surface-card p-8 border rounded-xl text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="font-semibold text-lg mb-2">Detailed Analytics</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              Track impressions, clicks, and CTR breakdown by creative and placement.
            </p>
            <Badge variant="outline" className="px-4 py-1">Data Processing...</Badge>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="pt-4 mt-0">
           <CampaignDetailDrawer 
            campaign={campaign as any} 
            open={true} 
            onOpenChange={() => {}} 
            forceTab="settings"
            inline
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
