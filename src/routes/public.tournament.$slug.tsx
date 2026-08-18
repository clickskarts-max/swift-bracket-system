import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BrandWordmark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { TipoffCountdown } from "@/components/tipoff-countdown";
import { EmptyState, ScoreLine, StatusPill, TeamChip } from "@/components/data-bits";
import { StandingsTab } from "@/components/tabs/standings-tab";
import { BracketTab } from "@/components/tabs/bracket-tab";
import { formatDate, formatDateRangeInline } from "@/lib/app";
import { TOURNAMENT_FORMATS } from "@/lib/formats";
import { useMatches, useSponsors, useTeams, useTournamentBySlug } from "@/lib/queries";

export const Route = createFileRoute("/public/tournament/$slug")({
  head: ({ params }) => {
    const title = `${params.slug.replace(/-/g, " ")} — Ecluid Basketball`;
    const description = "Live fixtures, results, standings, brackets and teams for this basketball tournament.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: PublicTournament,
});

const pad2 = (n: number) => String(n).padStart(2, "0");
const dayKeyFromIso = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

function PublicTournament() {
  const { slug } = Route.useParams();
  const { data: tournament, isLoading } = useTournamentBySlug(slug);
  const { data: teams = [] } = useTeams(tournament?.id ?? "");
  const { data: matches = [] } = useMatches(tournament?.id ?? "");
  const { data: sponsors = [] } = useSponsors(tournament?.id ?? "");

  const matchdayByDate = useMemo(() => {
    const keys = [...new Set(matches.filter((m) => !!m.scheduled_at).map((m) => dayKeyFromIso(m.scheduled_at as string)))].sort();
    return new Map(keys.map((k, i) => [k, i + 1]));
  }, [matches]);

  if (isLoading) return <p className="p-8 text-sm text-muted-foreground">Loading tournament…</p>;
  if (!tournament || !tournament.is_public)
    return (
      <div className="p-8">
        <EmptyState title="Tournament unavailable" description="This tournament is private or no longer exists." />
      </div>
    );

  const teamById = new Map(teams.map((t) => [t.id, t]));
  const side = (id: string | null, fallback: string | null) =>
    (id ? teamById.get(id) : undefined) ?? { name: fallback ?? "TBD", logo_url: null, jersey_color: null };
  const header = sponsors.filter((s) => s.placement === "public_header");
  const footer = sponsors.filter((s) => s.placement !== "public_header");
  const upcoming = matches.filter((m) => m.status !== "completed");
  const results = matches.filter((m) => m.status === "completed");

  const matchdayLabel = (m: (typeof matches)[number]) => {
    if (!m.scheduled_at) return "Unscheduled";
    const md = matchdayByDate.get(dayKeyFromIso(m.scheduled_at)) ?? 1;
    return `Matchday ${md}`;
  };

  const groupByMatchday = (list: (typeof matches)[number][]) => {
    const map = new Map<string, (typeof matches)[number][]>();
    for (const m of list) {
      const key = matchdayLabel(m);
      map.set(key, [...(map.get(key) ?? []), m]);
    }
    const compareMatch = (a: (typeof matches)[number], b: (typeof matches)[number]) => {
      const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
      return ta - tb || (a.match_no ?? Number.POSITIVE_INFINITY) - (b.match_no ?? Number.POSITIVE_INFINITY);
    };

    const entries = [...map.entries()].map(([k, items]) => [k, [...items].sort(compareMatch)] as [string, (typeof matches)[number][]]);
    const groupTime = (items: (typeof matches)[number][]) =>
      Math.min(...items.map((m) => (m.scheduled_at ? new Date(m.scheduled_at).getTime() : Number.POSITIVE_INFINITY)));
    return entries.sort(([, a], [, b]) => groupTime(a) - groupTime(b));
  };

  const MatchRow = ({ m }: { m: (typeof matches)[number] }) => {
    const a = side(m.team_a_id, m.placeholder_a);
    const b = side(m.team_b_id, m.placeholder_b);
    return (
      <div className="surface-card p-4">
        <p className="mb-2 text-center text-[11px] uppercase tracking-widest text-muted-foreground sm:text-left">{m.round_name}</p>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-6">
          <TeamChip name={a.name} logoUrl={a.logo_url} color={a.jersey_color} className="min-w-0" />
          <div className="flex flex-col items-center gap-1.5">
            <ScoreLine scoreA={m.score_a} scoreB={m.score_b} final={m.status === "completed"} />
            <span className="text-center text-xs text-muted-foreground">
              {m.status === "completed" ? formatDate(m.scheduled_at) : <TipoffCountdown scheduledAt={m.scheduled_at} />}
            </span>
            <StatusPill status={m.status} />
          </div>
          <TeamChip
            name={b.name}
            logoUrl={b.logo_url}
            color={b.jersey_color}
            className="min-w-0 flex-row-reverse justify-start text-right"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/"><BrandWordmark /></Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {header.map((s) => (s.logo_url ? <img key={s.id} src={s.logo_url} alt={s.name} loading="lazy" className="h-7 object-contain" /> : <Badge key={s.id} variant="outline">{s.name}</Badge>))}
          </div>
        </div>
      </header>

      <section className="hero-surface court-texture border-b border-border/60">
        {tournament.banner_url && <img src={tournament.banner_url} alt="" className="h-44 w-full object-cover sm:h-60" />}
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex flex-wrap items-center gap-4">
            {tournament.logo_url && <img src={tournament.logo_url} alt="" className="h-14 w-14 rounded-xl object-cover" />}
            <div>
              <h1 className="font-display text-3xl font-bold sm:text-4xl">{tournament.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {TOURNAMENT_FORMATS.find((f) => f.value === tournament.format)?.label}
              </p>
            </div>
            <StatusPill status={tournament.status} />
          </div>
          {tournament.description && <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{tournament.description}</p>}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="mt-0.5 h-3.5 w-3.5" />
              {formatDateRangeInline(tournament.start_date, tournament.end_date)}
            </span>
            {tournament.venue && (
              <a className="flex items-center gap-1 hover:text-primary" href={tournament.venue_map_url ?? "#"} target="_blank" rel="noreferrer">
                <MapPin className="h-3.5 w-3.5" />{tournament.venue}
              </a>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Tabs defaultValue="fixtures">
          <div className="-mx-4 mb-4 overflow-x-auto px-4">
            <TabsList className="w-max">
              <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
              <TabsTrigger value="results">Results ({results.length})</TabsTrigger>
              <TabsTrigger value="standings">Standings</TabsTrigger>
              <TabsTrigger value="bracket">Playoffs</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="fixtures">
            {upcoming.length === 0 ? (
              <EmptyState title="Fixtures coming soon" description="The schedule has not been published yet." />
            ) : (
              <div className="space-y-6">
                {groupByMatchday(upcoming).map(([label, list]) => (
                  <div key={label}>
                    <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">{label}</h3>
                    <div className="space-y-2">
                      {list.map((m) => <MatchRow key={m.id} m={m} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="results">
            {results.length === 0 ? (
              <EmptyState title="No results yet" description="Completed matches will appear here with final scores." />
            ) : (
              <div className="space-y-6">
                {groupByMatchday(results).map(([label, list]) => (
                  <div key={label}>
                    <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">{label}</h3>
                    <div className="space-y-2">
                      {list.map((m) => <MatchRow key={m.id} m={m} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="standings"><StandingsTab teams={teams} matches={matches} tournament={tournament ?? null} /></TabsContent>
          <TabsContent value="bracket"><BracketTab teams={teams} matches={matches} /></TabsContent>
          <TabsContent value="teams">
            {teams.length === 0 ? (
              <EmptyState title="No teams announced" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {teams.map((t) => (
                  <div key={t.id} className="surface-card p-4">
                    <TeamChip name={t.name} logoUrl={t.logo_url} color={t.jersey_color} />
                    <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                      {t.group_label && <p>Group {t.group_label}</p>}
                      {t.coach_name && <p>Coach: {t.coach_name}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {footer.length > 0 && (
        <section className="border-t border-border/60 py-8">
          <div className="mx-auto max-w-5xl px-4">
            <p className="mb-4 text-center text-xs uppercase tracking-widest text-muted-foreground">Our partners</p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {footer.map((s) =>
                s.logo_url ? (
                  <img key={s.id} src={s.logo_url} alt={s.name} loading="lazy" className="h-10 object-contain" />
                ) : (
                  <Badge key={s.id} variant="outline" className="capitalize">{s.name} · {s.tier}</Badge>
                ),
              )}
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        Powered by Ecluid Basketball
      </footer>
    </div>
  );
}
