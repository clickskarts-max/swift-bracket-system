import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/data-bits";
import { 
  useAdCampaigns, 
  useAdStats, 
  useAdSettings, 
  useUpdateAdSettings,
  useCreateAdCampaign,
  useUpdateAdCampaign,
  useDeleteAdCampaign,
  useAdPlacements,
  AdCampaign,
  AdCreative
} from "@/lib/ads.functions";
import { CampaignDetailDrawer } from "@/components/ads/campaign-detail-drawer";
import { Button } from "@/components/ui/button";
import { Plus, Settings2, ShieldCheck, Globe, Trash2, Edit2, ExternalLink, Image as ImageIcon, BarChart3, Info, Eye, LayoutDashboard } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusPill } from "@/components/data-bits";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/image-upload";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/advertising")({
  component: AdvertisingPage,
});

function AdvertisingPage() {
  const { data: campaignsData = [], isLoading } = useAdCampaigns();
  const { data: stats } = useAdStats();
  const { data: settings } = useAdSettings();
  const updateSettings = useUpdateAdSettings();
  const deleteCampaign = useDeleteAdCampaign();
  const navigate = useNavigate();

  const [selectedCampaign, setSelectedCampaign] = useState<(AdCampaign & { ad_creatives: AdCreative[] }) | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);

  // Safely handle campaigns array
  const campaigns = Array.isArray(campaignsData) ? campaignsData : [];

  const ctr = stats && stats.impressions > 0 
    ? ((stats.clicks / stats.impressions) * 100).toFixed(2) 
    : "0.00";

  const handleToggleAutoPlacement = (checked: boolean) => {
    updateSettings.mutate({ auto_placement_enabled: checked }, {
      onSuccess: () => toast.success("Auto-placement settings updated"),
    });
  };

  const handleIntensityChange = (value: string) => {
    updateSettings.mutate({ auto_placement_intensity: value as 'low' | 'balanced' | 'high' }, {
      onSuccess: () => toast.success("Placement intensity updated"),
    });
  };

  const handlePageRuleChange = (page: string, checked: boolean) => {
    if (!settings) return;
    const newRules = { ...settings.page_rules, [page]: checked };
    updateSettings.mutate({ page_rules: newRules }, {
      onSuccess: () => toast.success(`Page rule for ${page} updated`),
    });
  };

  const handleDeleteCampaign = async (id: string) => {
    if (confirm("Are you sure you want to delete this campaign? All associated analytics will be lost.")) {
      try {
        await deleteCampaign.mutateAsync(id);
        toast.success("Campaign deleted");
      } catch (e) {
        toast.error("Failed to delete campaign");
      }
    }
  };

  // Flatten all creatives from all campaigns
  const allCreatives = useMemo(() => {
    return campaigns.flatMap(c => (c.ad_creatives || []).map((cr: AdCreative) => ({ ...cr, campaignName: c.name })));
  }, [campaigns]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ads & Sponsors"
        description="Manage commercial ads, sponsorships and track performance."
        action={
          <Button onClick={() => {
              setSelectedCampaign(null);
              setIsCampaignDialogOpen(true);
            }}>
            <Plus className="mr-2 h-4 w-4" /> Create Campaign
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="Active Campaigns" 
          value={campaigns.filter(c => c.status === 'active').length} 
        />
        <StatCard 
          label="Impressions" 
          value={stats?.impressions || 0} 
        />
        <StatCard 
          label="Clicks" 
          value={stats?.clicks || 0} 
        />
        <StatCard 
          label="Avg. CTR" 
          value={`${ctr}%`} 
        />
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="settings">
            <Settings2 className="mr-2 h-4 w-4" />
            Global Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Advertiser</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Creatives</TableHead>
                  <TableHead>Auto</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading campaigns...
                    </TableCell>
                  </TableRow>
                ) : campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No campaigns found. Create your first one to start serving ads.
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        <button 
                          onClick={() => navigate({ to: `/advertising/campaign/${c.id}` })}
                          className="hover:text-primary hover:underline text-left transition-colors"
                        >
                          {c.name}
                        </button>
                      </TableCell>
                      <TableCell>{c.advertiser || "—"}</TableCell>
                      <TableCell>
                        <StatusPill status={c.status} />
                      </TableCell>
                      <TableCell className="capitalize">{c.priority}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {c.ad_creatives?.length || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.allow_auto_placement ? "default" : "secondary"} className="text-[10px]">
                          {c.allow_auto_placement ? "On" : "Off"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="h-8 gap-1"
                            onClick={() => navigate({ to: `/advertising/campaign/${c.id}` })}
                          >
                            <LayoutDashboard className="h-3.5 w-3.5" />
                            Manage
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setSelectedCampaign(c);
                              setIsCampaignDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteCampaign(c.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        

        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="surface-card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Smart Auto Placement</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically place eligible ads in safe areas.
                  </p>
                </div>
                <Switch 
                  checked={settings?.auto_placement_enabled ?? true} 
                  onCheckedChange={handleToggleAutoPlacement}
                />
              </div>

              <div className="space-y-3">
                <Label>Auto Placement Intensity</Label>
                <Select 
                  value={settings?.auto_placement_intensity ?? 'balanced'} 
                  onValueChange={handleIntensityChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select intensity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Conservative)</SelectItem>
                    <SelectItem value="balanced">Balanced (Default)</SelectItem>
                    <SelectItem value="high">High (Maximum Reach)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground italic">
                  Intensity controls how many auto-ads appear on a single page relative to content length.
                </p>
              </div>
            </div>

            <div className="surface-card p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Public Page Rules</h3>
              </div>
              
              <div className="space-y-4">
                {settings && settings.page_rules && Object.entries(settings.page_rules).map(([page, enabled]) => (
                  <div key={page} className="flex items-center justify-between">
                    <Label className="capitalize cursor-pointer" htmlFor={`rule-${page}`}>
                      {page.replace(/_/g, ' ')}
                    </Label>
                    <Switch 
                      id={`rule-${page}`}
                      checked={enabled} 
                      onCheckedChange={(checked) => handlePageRuleChange(page, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

      </Tabs>

      <CampaignDialog 
        open={isCampaignDialogOpen} 
        onOpenChange={(open) => {
          setIsCampaignDialogOpen(open);
          if (!open) setSelectedCampaign(null);
        }} 
        campaign={selectedCampaign}
      />
      {selectedCampaign && (
        <CampaignDetailDrawer
          open={isDetailOpen}
          onOpenChange={(open) => {
            setIsDetailOpen(open);
            if (!open) setSelectedCampaign(null);
          }}
          campaign={selectedCampaign}
        />
      )}
    </div>
  );
}

function CampaignDialog({ 
  open, 
  onOpenChange, 
  campaign 
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  campaign: AdCampaign | null
}) {
  const createCampaign = useCreateAdCampaign();
  const updateCampaign = useUpdateAdCampaign();
  
  const [formData, setFormData] = useState({ 
    name: '', 
    advertiser: '', 
    priority: 'normal' as AdCampaign['priority'], 
    allow_auto_placement: true,
    status: 'active' as AdCampaign['status']
  });

  useMemo(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        advertiser: campaign.advertiser || '',
        priority: campaign.priority,
        allow_auto_placement: campaign.allow_auto_placement,
        status: campaign.status
      });
    } else {
      setFormData({
        name: '',
        advertiser: '',
        priority: 'normal',
        allow_auto_placement: true,
        status: 'active'
      });
    }
  }, [campaign, open]);

  const handleSubmit = async () => {
    try {
      if (campaign) {
        await updateCampaign.mutateAsync({ 
          id: campaign.id, 
          name: formData.name,
          advertiser: formData.advertiser,
          priority: formData.priority,
          allow_auto_placement: formData.allow_auto_placement,
          status: formData.status
        });
        toast.success("Campaign updated");
      } else {
        await createCampaign.mutateAsync({
          name: formData.name,
          advertiser: formData.advertiser,
          priority: formData.priority,
          allow_auto_placement: formData.allow_auto_placement,
          status: formData.status,
          weight: 1
        });
        toast.success("Campaign created");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error("Failed to save campaign");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{campaign ? "Edit Campaign" : "Create Campaign"}</DialogTitle>
          <DialogDescription>
            Configure your advertising campaign details.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input 
              id="name"
              placeholder="e.g. Summer Championship Sponsor" 
              value={formData.name} 
              onChange={e => setFormData(prev => ({...prev, name: e.target.value}))} 
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="advertiser">Advertiser</Label>
            <Input 
              id="advertiser"
              placeholder="e.g. Nike, Red Bull, etc." 
              value={formData.advertiser} 
              onChange={e => setFormData(prev => ({...prev, advertiser: e.target.value}))} 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={v => setFormData(prev => ({...prev, priority: v as any}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="guaranteed">Guaranteed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={v => setFormData(prev => ({...prev, status: v as any}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20">
            <div className="space-y-0.5">
              <Label>Allow Auto Placement</Label>
              <p className="text-[11px] text-muted-foreground">
                Let the AI place this ad in recommended slots.
              </p>
            </div>
            <Switch 
              checked={formData.allow_auto_placement} 
              onCheckedChange={v => setFormData(prev => ({...prev, allow_auto_placement: v}))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!formData.name}>
            {campaign ? "Save Changes" : "Create Campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

