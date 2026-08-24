import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useOwnerOverview } from "@/lib/owner";
import { KpiCard, LoadingSkeleton, SectionCard } from "@/components/owner/owner-ui";

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="truncate text-muted-foreground">{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-secondary">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function AnalyticsPanel({ tab }: { tab: string }) {
  const { data, isLoading } = useOwnerOverview();
  if (isLoading || !data) return <LoadingSkeleton />;

  const ctr = data.ad_analytics.impressions
    ? ((data.ad_analytics.clicks / data.ad_analytics.impressions) * 100).toFixed(2)
    : "0.00";

  const tournamentMax = Math.max(
    data.tournaments.total,
    data.tournaments.active,
    data.tournaments.completed,
    1,
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Tournaments" value={data.tournaments.total} />
        <KpiCard label="Active" value={data.tournaments.active} />
        <KpiCard label="Ad impressions" value={data.ad_analytics.impressions} />
        <KpiCard label="CTR" value={`${ctr}%`} hint={`${data.ad_analytics.clicks} clicks`} />
      </div>

      {(tab === "overview" || tab === "tournaments") && (
        <SectionCard title="Tournament mix" description="Distribution by lifecycle status.">
          <div className="space-y-3">
            <Bar label="Active" value={data.tournaments.active} max={tournamentMax} />
            <Bar label="Draft" value={data.tournaments.draft} max={tournamentMax} />
            <Bar label="Completed" value={data.tournaments.completed} max={tournamentMax} />
            <Bar label="Public pages" value={data.tournaments.public} max={tournamentMax} />
          </div>
        </SectionCard>
      )}

      {(tab === "overview" || tab === "advertising" || tab === "sponsors") && (
        <SectionCard
          title="Advertising & sponsors"
          description="Aggregated delivery across all campaigns."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/advertising">Open workspace</Link>
            </Button>
          }
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <KpiCard label="Campaigns" value={data.advertising.campaigns} />
            <KpiCard label="Active" value={data.advertising.active} />
            <KpiCard label="Sponsors" value={data.sponsors.total} />
          </div>
        </SectionCard>
      )}

      {tab === "traffic" && (
        <SectionCard title="Traffic" description="Public delivery signals available today.">
          <div className="grid gap-3 sm:grid-cols-3">
            <KpiCard label="Public tournaments" value={data.tournaments.public} />
            <KpiCard label="Ad impressions" value={data.ad_analytics.impressions} />
            <KpiCard label="Ad clicks" value={data.ad_analytics.clicks} />
          </div>
        </SectionCard>
      )}
    </div>
  );
}
