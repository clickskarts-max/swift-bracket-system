import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MoreVertical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  useAdCampaigns,
  useAdStats,
  useAdSettings,
  useUpdateAdSettings,
  type AdSettings,
} from "@/lib/ads.functions";
import { PlacementRulesPanel } from "@/components/ads/placement-rules-panel";
import { CATEGORY_META, inventoryByCategory, type InventoryCategory } from "@/lib/ad-inventory";
import {
  EmptyState,
  KpiCard,
  LoadingSkeleton,
  SectionCard,
  StatusBadge,
} from "@/components/owner/owner-ui";

export function AdvertisingPanel({ tab }: { tab: string }) {
  const { data: campaigns = [], isLoading } = useAdCampaigns();
  const { data: stats } = useAdStats();
  const [search, setSearch] = useState("");

  const impressions = stats?.impressions ?? 0;
  const clicks = stats?.clicks ?? 0;
  const ctr = impressions ? ((clicks / impressions) * 100).toFixed(2) : "0.00";

  const creatives = campaigns.reduce((n, c) => n + (c.ad_creatives?.length ?? 0), 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "active");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return campaigns;
    return campaigns.filter((c) => `${c.name} ${c.advertiser ?? ""}`.toLowerCase().includes(term));
  }, [campaigns, search]);

  if (isLoading) return <LoadingSkeleton />;

  if (tab === "inventory" || tab === "placements") {
    return (
      <div className="space-y-4">
        {(Object.keys(CATEGORY_META) as InventoryCategory[]).map((category) => (
          <SectionCard
            key={category}
            title={CATEGORY_META[category].label}
            description={CATEGORY_META[category].description}
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {inventoryByCategory(category).map((item) => {
                const active = campaigns.filter((c) =>
                  (c.campaign_inventory ?? []).some(
                    (i) => i.inventory_key === item.key && i.enabled,
                  ),
                ).length;
                return (
                  <div key={item.key} className="rounded-lg border border-border/60 p-3">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      {item.sizes?.length ? <span>{item.sizes.join(" · ")}</span> : null}
                      <span>{item.tournamentScoped ? "Tournament page" : "All pages"}</span>
                      <span>{active} campaign(s)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        ))}
      </div>
    );
  }

  if (tab === "settings") {
    return <AdvertisingSettings />;
  }

  if (tab === "analytics") {
    return (
      <SectionCard
        title="Advertising analytics"
        description="Managed in the Ads & Sponsors workspace."
        action={
          <Button asChild size="sm" variant="outline">
            <Link to="/advertising">Open workspace</Link>
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <KpiCard label="Impressions" value={impressions} />
          <KpiCard label="Clicks" value={clicks} />
          <KpiCard label="CTR" value={`${ctr}%`} />
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-5">
      {tab === "overview" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Active campaigns"
            value={activeCampaigns.length}
            hint={`${campaigns.length} total`}
          />
          <KpiCard label="Impressions" value={impressions} />
          <KpiCard label="Clicks" value={clicks} hint={`${ctr}% CTR`} />
          <KpiCard label="Creatives" value={creatives} />
        </div>
      )}

      <SectionCard
        title="Campaigns"
        description="Open a campaign to manage creatives, targeting and inventory."
        action={
          <Button asChild size="sm">
            <Link to="/advertising">New campaign</Link>
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns"
              className="pl-9"
            />
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              title="No campaigns yet"
              description="Create your first advertising campaign to start displaying ads across tournament pages."
              action={
                <Button asChild>
                  <Link to="/advertising">Create campaign</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {filtered.map((c) => (
                <li
                  key={c.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <StatusBadge status={c.status} />
                      {c.advertiser && <span className="truncate">{c.advertiser}</span>}
                      <span>{c.ad_creatives?.length ?? 0} creatives</span>
                    </div>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Actions for ${c.name}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-52 p-1">
                      <Link
                        to="/advertising/campaign/$id"
                        params={{ id: c.id }}
                        className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
                      >
                        Open campaign
                      </Link>
                      <Link
                        to="/advertising/campaign/$id"
                        params={{ id: c.id }}
                        className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
                      >
                        Creatives &amp; targeting
                      </Link>
                      <Link
                        to="/advertising"
                        className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
                      >
                        Ads workspace
                      </Link>
                    </PopoverContent>
                  </Popover>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

const MASTER_TOGGLES: { key: keyof AdSettings; label: string; hint: string }[] = [
  { key: "public_ads_enabled", label: "Public ads", hint: "Master switch for all public pages" },
  { key: "sponsorships_enabled", label: "Sponsorships", hint: "Sponsor identity strips" },
  { key: "native_ads_enabled", label: "Native ads", hint: "Sponsored cards inside content" },
  { key: "sticky_mobile_enabled", label: "Sticky mobile", hint: "Anchored bottom unit on phones" },
  { key: "adsense_fallback_enabled", label: "AdSense fallback", hint: "Fill unsold inventory" },
];

function AdvertisingSettings() {
  const { data: settings } = useAdSettings();
  const update = useUpdateAdSettings();

  const setFlag = (key: keyof AdSettings, value: boolean) => {
    update.mutate(
      { ...(settings as AdSettings), [key]: value },
      {
        onSuccess: () => toast.success("Settings updated"),
        onError: (e: any) => toast.error(e?.message ?? "Update failed"),
      },
    );
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title="Global ad controls"
        description="Master switches applied across every public page."
        action={
          <Button asChild size="sm" variant="outline">
            <Link to="/advertising">Open workspace</Link>
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {MASTER_TOGGLES.map((t) => (
            <div
              key={t.key as string}
              className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3"
            >
              <div>
                <p className="text-sm font-medium">{t.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t.hint}</p>
              </div>
              <Switch
                checked={Boolean(settings?.[t.key])}
                disabled={!settings || update.isPending}
                onCheckedChange={(v) => setFlag(t.key, v)}
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <PlacementRulesPanel />
    </div>
  );
}
