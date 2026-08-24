import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTournaments } from "@/lib/queries";
import { useAdStats } from "@/lib/ads.functions";
import {
  EmptyState,
  KpiCard,
  LoadingSkeleton,
  SectionCard,
  StatusBadge,
} from "@/components/owner/owner-ui";

type SponsorRow = {
  id: string;
  name: string;
  tier: string | null;
  logo_url: string | null;
  tournament_id: string;
};

const useAllSponsors = () =>
  useQuery({
    queryKey: ["owner", "sponsors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sponsors")
        .select("id, name, tier, logo_url, tournament_id")
        .order("name");
      if (error) throw new Error(error.message);
      return (data ?? []) as SponsorRow[];
    },
  });

export function SponsorsPanel({ tab }: { tab: string }) {
  const { data: sponsors = [], isLoading } = useAllSponsors();
  const { data: tournaments = [] } = useTournaments();
  const { data: stats } = useAdStats();
  const [search, setSearch] = useState("");

  const tournamentName = useMemo(
    () => new Map(tournaments.map((t) => [t.id, t.name])),
    [tournaments],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sponsors;
    return sponsors.filter((s) => s.name.toLowerCase().includes(term));
  }, [sponsors, search]);

  if (isLoading) return <LoadingSkeleton />;

  const sponsoredTournaments = new Set(sponsors.map((s) => s.tournament_id)).size;

  if (tab === "packages" || tab === "settings") {
    return (
      <SectionCard
        title={tab === "packages" ? "Sponsorship packages" : "Sponsor settings"}
        description="Sponsorship inventory and master toggles live in the Ads & Sponsors workspace."
        action={
          <Button asChild size="sm" variant="outline">
            <Link to="/advertising">Open workspace</Link>
          </Button>
        }
      >
        <p className="text-sm text-muted-foreground">
          Sponsorship slots (Title Sponsor, Presenting Partner and more) are configured per campaign
          under Inventory.
        </p>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-5">
      {(tab === "overview" || tab === "analytics") && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Sponsors" value={sponsors.length} />
          <KpiCard label="Sponsored tournaments" value={sponsoredTournaments} />
          <KpiCard label="Ad impressions" value={stats?.impressions ?? 0} />
          <KpiCard label="Ad clicks" value={stats?.clicks ?? 0} />
        </div>
      )}

      <SectionCard title="Sponsors" description="Sponsors are managed inside each tournament.">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sponsors"
              className="pl-9"
            />
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              title="No sponsors yet"
              description="Add sponsors from a tournament's Sponsors tab to show them on public pages."
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((s) => (
                <li
                  key={s.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-lg border border-border/60 p-3"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-secondary text-xs font-semibold">
                    {s.logo_url ? (
                      <img src={s.logo_url} alt={s.name} className="h-full w-full object-contain" />
                    ) : (
                      s.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <StatusBadge status={s.tier || "active"} />
                      <Link
                        to="/tournaments/$id"
                        params={{ id: s.tournament_id }}
                        className="truncate underline-offset-2 hover:underline"
                      >
                        {tournamentName.get(s.tournament_id) ?? "Tournament"}
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
