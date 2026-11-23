import { useMemo, useState } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  ChevronLeft,
  ClipboardList,
  Handshake,
  KeyRound,
  LayoutDashboard,
  Megaphone,
  Menu,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { OverviewPanel } from "@/components/owner/overview-panel";
import { UsersPanel } from "@/components/owner/users-panel";
import { KeysPanel } from "@/components/owner/keys-panel";
import { AuditPanel } from "@/components/owner/audit-panel";
import { TournamentsPanel } from "@/components/owner/tournaments-panel";
import { AdvertisingPanel } from "@/components/owner/advertising-panel";
import { SponsorsPanel } from "@/components/owner/sponsors-panel";
import { AnalyticsPanel } from "@/components/owner/analytics-panel";
import { PlatformPanel } from "@/components/owner/platform-panel";
import {
  NestedTabs,
  OwnerBreadcrumb,
  OwnerPageHeader,
  SectionCard,
  StatusBadge,
} from "@/components/owner/owner-ui";
import { useTournaments } from "@/lib/queries";
import { useAdCampaigns } from "@/lib/ads.functions";
import { useAuditLog } from "@/lib/owner";
import { OWNER_EMAIL } from "@/lib/activation";
import { cn } from "@/lib/utils";

type SectionKey =
  "dashboard" | "tournaments" | "advertising" | "sponsors" | "users" | "platform" | "analytics";

const SECTIONS: {
  key: SectionKey;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
  tabs: { key: string; label: string }[];
}[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Manage tournaments, advertising, sponsors and platform operations.",
    tabs: [],
  },
  {
    key: "tournaments",
    label: "Tournaments",
    icon: Trophy,
    description: "Administer every tournament on the platform.",
    tabs: [
      { key: "overview", label: "Overview" },
      { key: "active", label: "Active" },
      { key: "upcoming", label: "Upcoming" },
      { key: "completed", label: "Completed" },
      { key: "management", label: "Management" },
    ],
  },
  {
    key: "advertising",
    label: "Advertising",
    icon: Megaphone,
    description: "Campaigns, creatives, inventory and delivery.",
    tabs: [
      { key: "overview", label: "Overview" },
      { key: "campaigns", label: "Campaigns" },
      { key: "inventory", label: "Ad inventory" },
      { key: "placements", label: "Placements" },
      { key: "analytics", label: "Analytics" },
      { key: "settings", label: "Settings" },
    ],
  },
  {
    key: "sponsors",
    label: "Sponsors",
    icon: Handshake,
    description: "Sponsor relationships and sponsorship performance.",
    tabs: [
      { key: "overview", label: "Overview" },
      { key: "sponsors", label: "Sponsors" },
      { key: "packages", label: "Packages" },
      { key: "analytics", label: "Analytics" },
      { key: "settings", label: "Settings" },
    ],
  },
  {
    key: "users",
    label: "Users",
    icon: Users,
    description: "Users, access keys and administrative history.",
    tabs: [
      { key: "users", label: "Users" },
      { key: "keys", label: "Activation keys" },
      { key: "audit", label: "Audit log" },
    ],
  },
  {
    key: "platform",
    label: "Platform",
    icon: Settings2,
    description: "Platform-level configuration.",
    tabs: [
      { key: "general", label: "General" },
      { key: "branding", label: "Branding" },
      { key: "public", label: "Public pages" },
      { key: "features", label: "Features" },
      { key: "integrations", label: "Integrations" },
      { key: "system", label: "System" },
    ],
  },
  {
    key: "analytics",
    label: "Analytics",
    icon: BarChart3,
    description: "Platform-wide reporting and insights.",
    tabs: [
      { key: "overview", label: "Overview" },
      { key: "tournaments", label: "Tournaments" },
      { key: "advertising", label: "Advertising" },
      { key: "sponsors", label: "Sponsors" },
      { key: "traffic", label: "Traffic" },
    ],
  },
];

const SECTION_KEYS = SECTIONS.map((s) => s.key);

export const Route = createFileRoute("/_authenticated/owner")({
  head: () => ({ meta: [
    { title: "Platform administration — Ecluid Basketball" },
    { name: "description", content: "Administer tournament accounts, activation plans, advertising and platform activity." },
    { property: "og:title", content: "Platform administration — Ecluid Basketball" },
    { property: "og:description", content: "Manage basketball tournament accounts and platform operations." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  validateSearch: (search: Record<string, unknown>) => ({
    section: (SECTION_KEYS.includes(search["section"] as SectionKey)
      ? (search["section"] as SectionKey)
      : "dashboard") as SectionKey,
    tab: typeof search["tab"] === "string" ? (search["tab"] as string) : undefined,
  }),
  beforeLoad: ({ context }) => {
    if (context.user.email?.toLowerCase() !== OWNER_EMAIL) throw redirect({ to: "/dashboard" });
  },
  component: OwnerAdmin,
});

/** Maps legacy overview issue keys onto the new sections. */
const ISSUE_SECTION: Record<string, SectionKey> = {
  overview: "dashboard",
  users: "users",
  keys: "users",
  audit: "users",
  tournaments: "tournaments",
  advertising: "advertising",
  health: "analytics",
};

function OwnerAdmin() {
  const { section, tab } = Route.useSearch();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const current = SECTIONS.find((s) => s.key === section) ?? SECTIONS[0]!;
  const activeTab = tab && current.tabs.some((t) => t.key === tab) ? tab : current.tabs[0]?.key;

  const go = (next: SectionKey, nextTab?: string) => {
    navigate({
      to: "/owner",
      search: { section: next, tab: nextTab },
    });
    setMobileOpen(false);
  };

  const nav = (onPick?: () => void, showLabels = true) => (
    <nav className="space-y-1" aria-label="Owner sections">
      {SECTIONS.map((s) => {
        const Icon = s.icon;
        const active = s.key === current.key;
        return (
          <button
            key={s.key}
            type="button"
            title={s.label}
            onClick={() => {
              go(s.key);
              onPick?.();
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              showLabels ? "justify-start" : "justify-center",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {showLabels && <span className="truncate">{s.label}</span>}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
      <aside className={cn("hidden shrink-0 lg:block", collapsed ? "w-[68px]" : "w-56")}>
        <div className="sticky top-20 space-y-3 rounded-xl border border-border/60 p-2">
          <div
            className={cn(
              "flex items-center gap-2 px-1",
              collapsed ? "justify-center" : "justify-between",
            )}
          >
            {!collapsed && (
              <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" /> Owner
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setCollapsed((c) => !c)}
            >
              <ChevronLeft
                className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
              />
            </Button>
          </div>
          {nav(undefined, !collapsed)}
        </div>
      </aside>

      <div className="min-w-0 space-y-5">
        <div className="flex items-center gap-2 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="mr-1 h-4 w-4" /> Sections
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" /> Owner
              </p>
              {nav(() => setMobileOpen(false))}
            </SheetContent>
          </Sheet>
          <span className="truncate text-sm text-muted-foreground">{current.label}</span>
        </div>

        <OwnerPageHeader
          title={current.key === "dashboard" ? "Owner Dashboard" : current.label}
          description={current.description}
          breadcrumb={
            <OwnerBreadcrumb
              items={[
                { label: current.label, onClick: () => go(current.key) },
                ...(current.key !== "dashboard" && activeTab
                  ? [
                      {
                        label: current.tabs.find((t) => t.key === activeTab)?.label ?? activeTab,
                      },
                    ]
                  : []),
              ]}
            />
          }
          action={
            current.key === "dashboard" ? (
              <Button asChild size="sm">
                <Link to="/tournaments/new">
                  <Plus className="mr-1 h-4 w-4" /> Tournament
                </Link>
              </Button>
            ) : undefined
          }
        />

        {current.tabs.length > 0 && activeTab && (
          <NestedTabs
            tabs={current.tabs}
            value={activeTab}
            onChange={(key) => go(current.key, key)}
          />
        )}

        {current.key === "dashboard" && <DashboardHome onNavigate={go} />}
        {current.key === "tournaments" && <TournamentsPanel tab={activeTab ?? "overview"} />}
        {current.key === "advertising" && <AdvertisingPanel tab={activeTab ?? "overview"} />}
        {current.key === "sponsors" && <SponsorsPanel tab={activeTab ?? "overview"} />}
        {current.key === "users" && (
          <>
            {activeTab === "users" && <UsersPanel />}
            {activeTab === "keys" && <KeysPanel />}
            {activeTab === "audit" && <AuditPanel />}
          </>
        )}
        {current.key === "platform" && <PlatformPanel tab={activeTab ?? "general"} />}
        {current.key === "analytics" && <AnalyticsPanel tab={activeTab ?? "overview"} />}
      </div>
    </div>
  );
}

function DashboardHome({ onNavigate }: { onNavigate: (s: SectionKey, tab?: string) => void }) {
  const { data: tournaments = [] } = useTournaments();
  const { data: campaigns = [] } = useAdCampaigns();
  const { data: audit = [] } = useAuditLog(8);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return null;
    return {
      tournaments: tournaments.filter((t) => t.name.toLowerCase().includes(term)).slice(0, 5),
      campaigns: campaigns.filter((c) => c.name.toLowerCase().includes(term)).slice(0, 5),
    };
  }, [query, tournaments, campaigns]);

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tournaments, campaigns, sponsors or users..."
          className="pl-9"
        />
      </div>

      {results && (
        <SectionCard title="Search results" description="Grouped by category.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                Tournaments
              </p>
              {results.tournaments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matches.</p>
              ) : (
                results.tournaments.map((t) => (
                  <Link
                    key={t.id}
                    to="/tournaments/$id"
                    params={{ id: t.id }}
                    className="block truncate rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
                  >
                    {t.name}
                  </Link>
                ))
              )}
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                Campaigns
              </p>
              {results.campaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matches.</p>
              ) : (
                results.campaigns.map((c) => (
                  <Link
                    key={c.id}
                    to="/advertising/campaign/$id"
                    params={{ id: c.id }}
                    className="block truncate rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
                  >
                    {c.name}
                  </Link>
                ))
              )}
            </div>
          </div>
        </SectionCard>
      )}

      <OverviewPanel onNavigate={(key) => onNavigate(ISSUE_SECTION[key] ?? "dashboard")} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Recent tournaments"
          description="Newest first."
          action={
            <Button variant="outline" size="sm" onClick={() => onNavigate("tournaments")}>
              View all
            </Button>
          }
        >
          {tournaments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tournaments yet.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {tournaments.slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                  <Link
                    to="/tournaments/$id"
                    params={{ id: t.id }}
                    className="min-w-0 truncate text-sm hover:underline"
                  >
                    {t.name}
                  </Link>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Recent activity"
          description="Owner actions, newest first."
          action={
            <Button variant="outline" size="sm" onClick={() => onNavigate("users", "audit")}>
              Audit log
            </Button>
          }
        >
          {audit.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recorded activity yet.</p>
          ) : (
            <ul className="space-y-2">
              {audit.slice(0, 6).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">{e.action}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(e.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Quick actions" description="Uses the existing creation flows.">
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/tournaments/new">
              <Plus className="mr-1 h-4 w-4" /> Tournament
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/advertising">
              <Plus className="mr-1 h-4 w-4" /> Campaign
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => onNavigate("sponsors")}>
            <Handshake className="mr-1 h-4 w-4" /> Sponsors
          </Button>
          <Button size="sm" variant="outline" onClick={() => onNavigate("users", "keys")}>
            <KeyRound className="mr-1 h-4 w-4" /> Activation key
          </Button>
          <Button size="sm" variant="outline" onClick={() => onNavigate("users", "audit")}>
            <ClipboardList className="mr-1 h-4 w-4" /> Audit log
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
