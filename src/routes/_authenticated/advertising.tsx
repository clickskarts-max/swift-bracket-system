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
import { Plus, Settings2, ShieldCheck, Globe, Trash2, Edit2, ExternalLink, Image as ImageIcon, BarChart3, Info } from "lucide-react";
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
import { useState } from "react";
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

export const Route = createFileRoute("/_authenticated/advertising")({
  component: AdvertisingPage,
});

function AdvertisingPage() {
  const { data: campaigns = [], isLoading } = useAdCampaigns();
  const { data: stats } = useAdStats();
  const { data: settings } = useAdSettings();
  const updateSettings = useUpdateAdSettings();

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advertising"
        description="Manage commercial ads, sponsorships and track performance."
        action={
          <Button>
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
          <TabsTrigger value="placements">Placements</TabsTrigger>
          <TabsTrigger value="settings">
            <Settings2 className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
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
                        <Badge variant={c.allow_auto_placement ? "default" : "outline"} className="text-[10px]">
                          {c.allow_auto_placement ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
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
                {settings && Object.entries(settings.page_rules).map(([page, enabled]) => (
                  <div key={page} className="flex items-center justify-between">
                    <Label className="capitalize cursor-pointer" htmlFor={`rule-${page}`}>
                      {page.replace('_', ' ')}
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
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
             <div className="flex aspect-video items-center justify-center rounded-lg border-2 border-dashed border-border/60 bg-muted/20 text-muted-foreground">
                <p className="text-xs">No creatives uploaded</p>
             </div>
          </div>
        </TabsContent>

        <TabsContent value="placements">
          <div className="rounded-lg border border-border/60 bg-card p-6">
            <p className="text-sm text-muted-foreground">Placements are system-defined and can be targeted in campaign settings.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

