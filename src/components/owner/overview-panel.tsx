import { AlertTriangle, ArrowRight, CheckCircle2, Megaphone, Trophy, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useOwnerOverview } from "@/lib/owner";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-secondary/40 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "warn";
}) {
  return (
    <div className="rounded-xl border border-border/60 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={`mt-1 font-display text-3xl font-semibold tabular-nums ${
          tone === "warn" ? "text-amber-500" : ""
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function OverviewPanel({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { data, isLoading, error } = useOwnerOverview();

  if (isLoading)
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  if (error || !data)
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error ? error.message : "Unable to load overview."}
      </p>
    );

  const ctr = data.ad_analytics.impressions
    ? ((data.ad_analytics.clicks / data.ad_analytics.impressions) * 100).toFixed(2)
    : "0.00";

  const issues = [
    {
      count: data.health.campaigns_without_creative,
      label: "Campaigns without a creative",
      tab: "advertising",
    },
    {
      count: data.health.tournaments_without_matches,
      label: "Tournaments without fixtures",
      tab: "tournaments",
    },
    {
      count: data.health.matches_missing_teams,
      label: "Completed matches missing a team",
      tab: "health",
    },
    {
      count: data.health.completed_without_score,
      label: "Completed matches without a score",
      tab: "health",
    },
    {
      count: data.health.expired_owners_with_active_tournaments,
      label: "Expired organizers owning active tournaments",
      tab: "users",
    },
  ].filter((i) => i.count > 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Users" value={data.users.total} hint={`${data.users.active} active`} />
        <Kpi
          label="Tournaments"
          value={data.tournaments.total}
          hint={`${data.tournaments.active} running`}
        />
        <Kpi
          label="Campaigns"
          value={data.advertising.campaigns}
          hint={`${data.advertising.active} active · ${ctr}% CTR`}
        />
        <Kpi
          label="Needs attention"
          value={issues.reduce((sum, i) => sum + i.count, 0)}
          hint={issues.length ? `${issues.length} check(s) failing` : "All checks passing"}
          tone={issues.length ? "warn" : "default"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {issues.length ? (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            )}
            Needs attention
          </CardTitle>
          <CardDescription>Read-only checks — nothing is modified automatically.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {issues.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No issues detected across users, tournaments or advertising.
            </p>
          ) : (
            issues.map((issue) => (
              <button
                key={issue.label}
                onClick={() => onNavigate(issue.tab)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-border/60 p-3 text-left text-sm transition-colors hover:bg-secondary"
              >
                <span className="min-w-0 truncate">{issue.label}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary">{issue.count}</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </span>
              </button>
            ))
          )}
          <div className="pt-2 text-xs text-muted-foreground">
            Manage advertising in the{" "}
            <Link to="/advertising" className="underline">
              Ads &amp; Sponsors
            </Link>{" "}
            workspace.
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" /> Users
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Stat label="Total" value={data.users.total} />
            <Stat label="Active" value={data.users.active} />
            <Stat label="Expiring 7d" value={data.users.expiring_soon} />
            <Stat label="Expired" value={data.users.expired} />
            <Stat label="Suspended" value={data.users.suspended} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-primary" /> Tournaments
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Stat label="Total" value={data.tournaments.total} />
            <Stat label="Active" value={data.tournaments.active} />
            <Stat label="Draft" value={data.tournaments.draft} />
            <Stat label="Completed" value={data.tournaments.completed} />
            <Stat label="Archived" value={data.tournaments.archived} />
            <Stat label="Public" value={data.tournaments.public} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Megaphone className="h-4 w-4 text-primary" /> Advertising &amp; sponsors
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Stat label="Campaigns" value={data.advertising.campaigns} />
            <Stat label="Active" value={data.advertising.active} />
            <Stat label="Ending 7d" value={data.advertising.ending_soon} />
            <Stat label="Impressions" value={data.ad_analytics.impressions} />
            <Stat label="Clicks" value={data.ad_analytics.clicks} />
            <Stat label="CTR" value={`${ctr}%`} />
            <Stat label="Sponsors" value={data.sponsors.total} />
            <Stat label="No logo" value={data.sponsors.missing_logo} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
