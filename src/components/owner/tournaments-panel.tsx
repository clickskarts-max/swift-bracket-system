import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink, MoreVertical, Plus, Search, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTournaments } from "@/lib/queries";
import {
  EmptyState,
  KpiCard,
  LoadingSkeleton,
  SectionCard,
  StatusBadge,
} from "@/components/owner/owner-ui";

const TAB_FILTER: Record<string, (status: string, archived: boolean) => boolean> = {
  overview: () => true,
  active: (s) => s === "active",
  upcoming: (s) => s === "draft" || s === "scheduled" || s === "upcoming",
  completed: (s) => s === "completed",
  management: () => true,
};

export function TournamentsPanel({ tab }: { tab: string }) {
  const { data: tournaments = [], isLoading, error } = useTournaments();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const match = TAB_FILTER[tab] ?? (() => true);
    return tournaments.filter(
      (t) =>
        match(t.status, t.archived) &&
        (!term || `${t.name} ${t.slug}`.toLowerCase().includes(term)),
    );
  }, [tournaments, tab, search]);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <p className="text-sm text-destructive">{(error as Error).message}</p>;

  const counts = {
    total: tournaments.length,
    active: tournaments.filter((t) => t.status === "active").length,
    completed: tournaments.filter((t) => t.status === "completed").length,
    published: tournaments.filter((t) => t.is_public).length,
  };

  return (
    <div className="space-y-5">
      {tab === "overview" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Tournaments" value={counts.total} />
          <KpiCard label="Active" value={counts.active} />
          <KpiCard label="Completed" value={counts.completed} />
          <KpiCard label="Public pages" value={counts.published} />
        </div>
      )}

      <SectionCard
        title={tab === "management" ? "Tournament management" : "Tournaments"}
        description="Quick actions open the existing tournament workspace."
        action={
          <Button asChild size="sm">
            <Link to="/tournaments/new">
              <Plus className="mr-1 h-4 w-4" /> Tournament
            </Link>
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tournaments"
              className="pl-9"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="No tournaments here"
              description="Create a tournament to start managing fixtures, standings and sponsors."
              action={
                <Button asChild>
                  <Link to="/tournaments/new">Create tournament</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {filtered.map((t) => (
                <li
                  key={t.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <Trophy className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate text-sm font-medium">{t.name}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <StatusBadge status={t.status} />
                      <span className="truncate">/{t.slug}</span>
                      <span>{t.team_count} teams</span>
                    </div>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Actions for ${t.name}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-52 p-1">
                      <Link
                        to="/tournaments/$id"
                        params={{ id: t.id }}
                        className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
                      >
                        Manage tournament
                      </Link>
                      <a
                        href={`/public/tournament/${t.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
                      >
                        Public page <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <Link
                        to="/advertising"
                        className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
                      >
                        Assign ads
                      </Link>
                      <Link
                        to="/tournaments/$id"
                        params={{ id: t.id }}
                        className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
                      >
                        Sponsors &amp; settings
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
