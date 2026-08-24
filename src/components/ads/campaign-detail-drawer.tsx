import { useState, useMemo } from "react";
import { 
  AdCampaign, 
  AdCreative, 
  useCreateAdCreative,
  useUpdateAdCampaign,
  useDeleteAdCreative,
  useUpdateAdCreative
} from "@/lib/ads.functions";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  ImageIcon, 
  Layout, 
  Settings2, 
  Target, 
  Plus, 
  Trash2, 
  Edit2, 
  Eye, 
  ExternalLink,
  Info,
  Globe
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { StatusPill, StatCard } from "@/components/data-bits";
import { toast } from "sonner";
import { AD_SIZE_PRESETS, detectImageDimensions, matchPreset } from "@/lib/ad-utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ImageUpload } from "@/components/image-upload";

interface CampaignDetailDrawerProps {
  campaign: AdCampaign & { ad_creatives: AdCreative[] };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forceTab?: string;
  inline?: boolean;
}

export function CampaignDetailDrawer({ campaign, open, onOpenChange, forceTab, inline = false }: CampaignDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState(forceTab || "overview");
  const [isAddCreativeOpen, setIsAddCreativeOpen] = useState(false);
  const [editingCreative, setEditingCreative] = useState<AdCreative | null>(null);
  const updateCampaign = useUpdateAdCampaign();
  const deleteCreative = useDeleteAdCreative();

  const ctr = useMemo(() => {
    // In a real app, this would come from analytics for this specific campaign
    return "0.00";
  }, [campaign]);

  const handleDeleteCreative = async (id: string) => {
    if (confirm("Delete this creative?")) {
      try {
        await deleteCreative.mutateAsync(id);
        toast.success("Creative deleted");
      } catch (e) {
        toast.error("Failed to delete creative");
      }
    }
  };

  const coverage = useMemo(() => {
    const formats = {
      desktop: campaign.ad_creatives.some(c => c.size_preset === 'leaderboard' || c.size_preset === 'large-leaderboard'),
      mobile: campaign.ad_creatives.some(c => c.size_preset === 'mobile-banner' || c.size_preset === 'large-mobile-banner'),
      rectangle: campaign.ad_creatives.some(c => c.size_preset === 'medium-rectangle' || c.size_preset === 'large-rectangle'),
    };
    return formats;
  }, [campaign.ad_creatives]);

  const content = (
    <div className={inline ? "" : "max-h-[90vh] overflow-y-auto"}>
      {!inline && (
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between pr-8">
            <div className="space-y-1">
              <DialogTitle className="text-2xl">{campaign.name}</DialogTitle>
              <DialogDescription>
                {campaign.advertiser || "Direct Advertiser"} • <StatusPill status={campaign.status} />
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={campaign.status === 'active' ? "outline" : "default"}
                size="sm"
                onClick={() => updateCampaign.mutate({ 
                  id: campaign.id, 
                  status: campaign.status === 'active' ? 'paused' : 'active' 
                })}
              >
                {campaign.status === 'active' ? 'Pause Campaign' : 'Activate Campaign'}
              </Button>
            </div>
          </div>
        </DialogHeader>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className={inline ? "" : "mt-4"}>
        {!inline && (
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="creatives">Creatives</TabsTrigger>
            <TabsTrigger value="placements">Placements</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        )}

          <TabsContent value="overview" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Impressions" value="0" />
              <StatCard label="Clicks" value="0" />
              <StatCard label="CTR" value={`${ctr}%`} />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm uppercase text-muted-foreground flex items-center gap-2">
                  <Info className="h-4 w-4" /> Details
                </h4>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <span className="text-muted-foreground">Priority</span>
                  <span className="capitalize font-medium">{campaign.priority}</span>
                  <span className="text-muted-foreground">Auto Placement</span>
                  <span>{campaign.allow_auto_placement ? "Enabled" : "Disabled"}</span>
                  <span className="text-muted-foreground">Creatives</span>
                  <span>{campaign.ad_creatives.length} Units</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm uppercase text-muted-foreground flex items-center gap-2">
                  <Layout className="h-4 w-4" /> Smart Coverage
                </h4>
                <div className="space-y-2">
                  {Object.entries(coverage).map(([key, active]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{key}</span>
                      <Badge variant={active ? "default" : "secondary"}>
                        {active ? "✓ Active" : "✕ Missing"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="creatives" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Campaign Creatives</h3>
              <Button size="sm" onClick={() => setIsAddCreativeOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Creative
              </Button>
            </div>

            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Creative</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaign.ad_creatives.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No creatives in this campaign.
                      </TableCell>
                    </TableRow>
                  ) : (
                    campaign.ad_creatives.map((cr) => (
                      <TableRow key={cr.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-16 bg-muted rounded overflow-hidden flex-shrink-0">
                              {cr.media_url ? (
                                <img src={cr.media_url} className="h-full w-full object-cover" alt="" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <ImageIcon className="h-4 w-4 opacity-20" />
                                </div>
                              )}
                            </div>
                            <span className="font-medium">{cr.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {cr.size_preset?.replace(/-/g, ' ') || 'Custom'}
                          </Badge>
                          {cr.width && cr.height && (
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {cr.width} × {cr.height}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] uppercase">
                            {cr.provider_type === 'adsense' ? 'AdSense' : cr.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={cr.status === 'active' ? "default" : "secondary"}>
                            {cr.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setEditingCreative(cr);
                                setIsAddCreativeOpen(true);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive"
                              onClick={() => handleDeleteCreative(cr.id)}
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

          <TabsContent value="placements" className="pt-4">
            <div className="surface-card p-6 text-center text-muted-foreground">
              Placement targeting configuration coming soon.
            </div>
          </TabsContent>

          <TabsContent value="performance" className="pt-4">
            <div className="surface-card p-6 text-center text-muted-foreground">
              Detailed performance analytics coming soon.
            </div>
          </TabsContent>

          <TabsContent value="settings" className="pt-4">
            <div className="surface-card p-6 text-center text-muted-foreground">
              Advanced campaign settings.
            </div>
          </TabsContent>
        </Tabs>

        {!inline && (
          <DialogFooter className="mt-6 pt-6 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        )}
      </div>
    );

    if (inline) {
      return (
        <>
          {content}
          <CreativeDialog 
            open={isAddCreativeOpen}
            onOpenChange={(open) => {
              setIsAddCreativeOpen(open);
              if (!open) setEditingCreative(null);
            }}
            campaignId={campaign.id}
            creative={editingCreative}
          />
        </>
      );
    }

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl p-0">
          <div className="p-6">
            {content}
          </div>
        </DialogContent>

        <CreativeDialog 
          open={isAddCreativeOpen}
          onOpenChange={(open) => {
            setIsAddCreativeOpen(open);
            if (!open) setEditingCreative(null);
          }}
          campaignId={campaign.id}
          creative={editingCreative}
        />
      </Dialog>
    );
}
  campaignId,
  creative
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  campaignId: string,
  creative?: AdCreative | null
}) {
  const createCreative = useCreateAdCreative();
  const updateCreative = useUpdateAdCreative();
  const [step, setStep] = useState(1);
  const [source, setSource] = useState<'upload' | 'html' | 'adsense'>('upload');
  
  const [formData, setFormData] = useState({ 
    name: '', 
    type: 'image' as AdCreative['type'], 
    media_url: null as string | null,
    html_content: '',
    destination_url: '',
    size_preset: 'leaderboard',
    width: null as number | null,
    height: null as number | null,
    is_responsive: false,
    provider_config: {} as any
  });

  const resetForm = () => {
    if (creative) {
      setStep(3);
      setSource(creative.provider_type === 'adsense' ? 'adsense' : creative.type === 'html' ? 'html' : 'upload');
      setFormData({
        name: creative.name,
        type: creative.type,
        media_url: creative.media_url,
        html_content: creative.html_content || '',
        destination_url: creative.destination_url || '',
        size_preset: creative.size_preset || 'leaderboard',
        width: creative.width,
        height: creative.height,
        is_responsive: creative.is_responsive || false,
        provider_config: creative.provider_config || {}
      });
    } else {
      setStep(1);
      setSource('upload');
      setFormData({
        name: '',
        type: 'image',
        media_url: null,
        html_content: '',
        destination_url: '',
        size_preset: 'leaderboard',
        width: null,
        height: null,
        is_responsive: false,
        provider_config: {}
      });
    }
  };

  useMemo(() => {
    if (open) resetForm();
  }, [open, creative]);

  const handleFileUpload = async (url: string | null, file?: File) => {
    if (!url) {
      setFormData(prev => ({ ...prev, media_url: null }));
      return;
    }
    setFormData(prev => ({ ...prev, media_url: url }));
    if (file) {
      try {
        const dimensions = await detectImageDimensions(file);
        const preset = matchPreset(dimensions.width, dimensions.height);
        setFormData(prev => ({
          ...prev,
          width: dimensions.width,
          height: dimensions.height,
          size_preset: preset ? preset.id : 'custom'
        }));
        
        if (preset) {
          toast.success(`Matched preset: ${preset.label}`);
        } else {
          toast.info(`Detected custom size: ${dimensions.width}×${dimensions.height}`);
        }
      } catch (e) {
        console.error("Dimension detection failed", e);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const creativeType: AdCreative['type'] = source === 'html' ? 'html' : 'image';
      const providerType: AdCreative['provider_type'] = source === 'adsense' ? 'adsense' : 'direct';
      
      const payload = {
        name: formData.name || `${source.toUpperCase()} Creative`,
        campaign_id: campaignId,
        type: creativeType,
        provider_type: providerType,
        media_url: formData.media_url || '',
        html_content: formData.html_content,
        destination_url: formData.destination_url || null,
        width: formData.width,
        height: formData.height,
        size_preset: formData.size_preset,
        is_responsive: formData.is_responsive,
        provider_config: formData.provider_config,
        status: 'active' as const
      };

      if (creative) {
        await updateCreative.mutateAsync({ id: creative.id, ...payload });
        toast.success("Creative updated");
      } else {
        await createCreative.mutateAsync(payload);
        toast.success("Creative added to campaign");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(creative ? "Failed to update creative" : "Failed to add creative");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Creative</DialogTitle>
          <DialogDescription>
            Step {step} of 3: {step === 1 ? 'Choose Source' : step === 2 ? 'Select Size' : 'Configure Asset'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'upload', icon: ImageIcon, label: 'Upload Asset', desc: 'Image, GIF, or WebP' },
                { id: 'html', icon: Layout, label: 'HTML Creative', desc: 'Custom sandboxed HTML' },
                { id: 'adsense', icon: Globe, label: 'Ad Provider', desc: 'Google AdSense unit' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSource(s.id as any);
                    setStep(2);
                  }}
                  className="flex flex-col items-center p-4 border rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-center space-y-2 group"
                >
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <div className="font-semibold text-sm">{s.label}</div>
                  <div className="text-[10px] text-muted-foreground">{s.desc}</div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Label>Select Ad Size Preset</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AD_SIZE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setFormData(prev => ({ 
                        ...prev, 
                        size_preset: p.id,
                        width: p.width,
                        height: p.height,
                        is_responsive: p.id === 'responsive'
                      }));
                      setStep(3);
                    }}
                    className={`p-3 border rounded-lg text-left hover:border-primary transition-all ${formData.size_preset === p.id ? 'border-primary bg-primary/5' : ''}`}
                  >
                    <div className="text-xs font-semibold">{p.label}</div>
                    <div className="text-[10px] text-muted-foreground">{p.description}</div>
                    {p.width && p.height && (
                      <div 
                        className="mt-2 bg-muted rounded border border-border/50 opacity-40"
                        style={{ 
                          width: '100%', 
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <div 
                          className="bg-primary/20" 
                          style={{ 
                            width: `${Math.min(p.width / 10, 100)}%`, 
                            height: `${Math.min(p.height / 10, 15)}px` 
                          }} 
                        />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <Button variant="ghost" className="w-full" onClick={() => setStep(1)}>Back to Source</Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="grid gap-2">
                <Label>Creative Name</Label>
                <Input 
                  placeholder="e.g. Summer Special Banner" 
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              {source === 'upload' && (
                <div className="grid gap-2">
                  <Label>Image Asset</Label>
                  <ImageUpload 
                    value={formData.media_url}
                    onChange={handleFileUpload}
                    folder="creatives"
                    bucket="ad-creatives"
                    className="aspect-video"
                  />
                  {formData.width && (
                    <div className="text-[10px] bg-muted p-2 rounded flex justify-between">
                      <span>Detected: {formData.width} × {formData.height}</span>
                      <span className="text-primary font-medium">Match: {formData.size_preset}</span>
                    </div>
                  )}
                </div>
              )}

              {source === 'html' && (
                <div className="grid gap-2">
                  <Label>HTML Content</Label>
                  <textarea 
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                    placeholder="<div>Your ad here</div>"
                    value={formData.html_content}
                    onChange={e => setFormData(prev => ({ ...prev, html_content: e.target.value }))}
                  />
                </div>
              )}

              {source === 'adsense' && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <div className="grid gap-2">
                    <Label>Client ID (ca-pub-xxx)</Label>
                    <Input 
                      placeholder="ca-pub-1234567890" 
                      value={formData.provider_config.client_id || ''}
                      onChange={e => setFormData(prev => ({ 
                        ...prev, 
                        provider_config: { ...prev.provider_config, client_id: e.target.value } 
                      }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Slot ID</Label>
                    <Input 
                      placeholder="1234567890" 
                      value={formData.provider_config.slot_id || ''}
                      onChange={e => setFormData(prev => ({ 
                        ...prev, 
                        provider_config: { ...prev.provider_config, slot_id: e.target.value } 
                      }))}
                    />
                  </div>
                </div>
              )}

              {source !== 'adsense' && (
                <div className="grid gap-2">
                  <Label>Destination URL</Label>
                  <Input 
                    placeholder="https://example.com" 
                    value={formData.destination_url}
                    onChange={e => setFormData(prev => ({ ...prev, destination_url: e.target.value }))}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                <Button className="flex-1" onClick={handleSubmit}>Add Creative</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
