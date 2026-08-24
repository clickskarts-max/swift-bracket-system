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
  useCreateAdCreative,
  useDeleteAdCreative,
  AdCampaign,
  AdCreative
} from "@/lib/ads.functions";
import { Button } from "@/components/ui/button";
import { Plus, Settings2, ShieldCheck, Globe, Trash2, Edit2, ExternalLink, Image as ImageIcon, BarChart3, Info, Eye } from "lucide-react";
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

  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null);
  const [isCreativeDialogOpen, setIsCreativeDialogOpen] = useState(false);

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
          <TabsTrigger value="creatives">Creatives</TabsTrigger>
          <TabsTrigger value="settings">
            <Settings2 className="mr-2 h-4 w-4" />
            Settings
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
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.advertiser || "—"}</TableCell>
                      <TableCell>
                        <StatusPill status={c.status} />
                      </TableCell>
                      <TableCell className="capitalize">{c.priority}</TableCell>
                      <TableCell>
                        <Badge variant={c.allow_auto_placement ? "default" : "secondary"} className="text-[10px]">
                          {c.allow_auto_placement ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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

        <TabsContent value="creatives">
          {allCreatives.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/60 bg-muted/20 py-12 text-muted-foreground">
              <ImageIcon className="h-8 w-8 mb-4 opacity-20" />
              <p className="text-sm">No creatives uploaded yet</p>
              <Button variant="link" onClick={() => setIsCreativeDialogOpen(true)}>Add your first creative</Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {allCreatives.map((creative) => (
                <Card key={creative.id} className="overflow-hidden group">
                  <div className="aspect-video relative overflow-hidden bg-muted">
                    <img 
                      src={creative.media_url} 
                      alt="" 
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                    <div className="absolute top-2 right-2">
                       <Badge variant="secondary" className="backdrop-blur-sm bg-background/60">
                         {creative.type.toUpperCase()}
                       </Badge>
                    </div>
                  </div>
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium truncate flex-1">{creative.name || "Untitled"}</p>
                      <Badge variant="outline" className="text-[9px] px-1 h-4">
                        {creative.campaignName}
                      </Badge>
                    </div>
                    {creative.destination_url && (
                      <a 
                        href={creative.destination_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary flex items-center hover:underline"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Target URL
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CampaignDialog 
        open={isCampaignDialogOpen} 
        onOpenChange={setIsCampaignDialogOpen} 
        campaign={selectedCampaign}
      />
      <CreativeDialog 
        open={isCreativeDialogOpen} 
        onOpenChange={setIsCreativeDialogOpen}
        campaigns={campaigns}
      />
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

function CreativeDialog({ 
  open, 
  onOpenChange,
  campaigns
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  campaigns: AdCampaign[]
}) {
  const createCreative = useCreateAdCreative();
  const [formData, setFormData] = useState({ 
    name: '', 
    campaign_id: '', 
    type: 'image' as AdCreative['type'], 
    media_url: '' as string | null,
    destination_url: '' 
  });

  useMemo(() => {
    if (open) {
      setFormData({
        name: '',
        campaign_id: campaigns[0]?.id || '',
        type: 'image',
        media_url: null,
        destination_url: ''
      });
    }
  }, [open, campaigns]);

  const handleSubmit = async () => {
    if (!formData.media_url) {
      toast.error("Please upload a creative image");
      return;
    }
    try {
      await createCreative.mutateAsync({
        name: formData.name || 'Untitled Creative',
        campaign_id: formData.campaign_id,
        type: formData.type,
        media_url: formData.media_url,
        destination_url: formData.destination_url || null
      });
      toast.success("Creative added");
      onOpenChange(false);
    } catch (e) {
      toast.error("Failed to add creative");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Ad Creative</DialogTitle>
          <DialogDescription>
            Upload an image and link it to a campaign.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label>Creative Name</Label>
            <Input 
              placeholder="e.g. Header Banner v1" 
              value={formData.name} 
              onChange={e => setFormData(prev => ({...prev, name: e.target.value}))} 
            />
          </div>
          <div className="grid gap-2">
            <Label>Link to Campaign</Label>
            <Select 
              value={formData.campaign_id} 
              onValueChange={v => setFormData(prev => ({...prev, campaign_id: v}))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Creative Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={v => setFormData(prev => ({...prev, type: v as any}))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Standard Image</SelectItem>
                <SelectItem value="animated">Animated GIF/WebP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Ad Creative Image</Label>
            <ImageUpload 
              value={formData.media_url} 
              onChange={url => setFormData(prev => ({...prev, media_url: url}))}
              folder="creatives"
              bucket="ad-creatives"
              className="aspect-video"
            />
          </div>
          <div className="grid gap-2">
            <Label>Destination URL (Optional)</Label>
            <Input 
              type="url"
              placeholder="https://example.com/promo" 
              value={formData.destination_url} 
              onChange={e => setFormData(prev => ({...prev, destination_url: e.target.value}))} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!formData.media_url || !formData.campaign_id}>
            Add Creative
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
