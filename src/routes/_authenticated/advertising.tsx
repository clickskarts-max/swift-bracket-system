import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/data-bits";
import { useAdCampaigns, useAdStats } from "@/lib/ads.functions";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusPill } from "@/components/data-bits";

export const Route = createFileRoute("/_authenticated/advertising" as any)({
  component: AdvertisingPage,
});

function AdvertisingPage() {
  const { data: campaigns = [], isLoading } = useAdCampaigns();
  const { data: stats } = useAdStats();

  const ctr = stats && stats.impressions > 0 
    ? ((stats.clicks / stats.impressions) * 100).toFixed(2) 
    : "0.00";

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
                  <TableHead>Creatives</TableHead>
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
                      <TableCell>{c.ad_creatives?.length || 0}</TableCell>
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
