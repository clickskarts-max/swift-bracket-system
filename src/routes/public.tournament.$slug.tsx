/**
 * Leia o arquivo instrucoes.md em anexo e siga as instruções. Analise também os demais arquivos anexados.
 */
import { useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, MapPin, Navigation } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BrandWordmark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { TipoffCountdown } from "@/components/tipoff-countdown";
import { EmptyState, ScoreLine, StatusPill, TeamChip } from "@/components/data-bits";
import { StandingsTab } from "@/components/tabs/standings-tab";
import { BracketTab } from "@/components/tabs/bracket-tab";
import { MatchBreakdown } from "@/components/match-breakdown";
import { formatDate, formatDateRangeInline } from "@/lib/app";
import { TOURNAMENT_FORMATS } from "@/lib/formats";
import { useBranding } from "@/hooks/use-branding";
import {
  useMatches,
  usePublicPlayers,
  usePublicSponsors,
  usePublicTeams,
  useTournamentBySlug,
  useVenues,
} from "@/lib/queries";


export const Route = createFileRoute("/public/tournament/$slug")({
  head: ({ params }) => {
    const title = `${params.slug.replace(/-/g, " ")} — Ecluid Basketball`;
    const description =
      "Live fixtures, results, standings, brackets and teams for this basketball tournament.";
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
  const { data: teams = [] } = usePublicTeams(tournament?.id ?? "");
  const { data: matches = [] } = useMatches(tournament?.id ?? "");
  const { data: sponsors = [] } = usePublicSponsors(tournament?.id ?? "");
  const { data: players = [] } = usePublicPlayers(tournament?.id ?? "");
  const { data: venues = [] } = useVenues(tournament?.id ?? "");
  const { data: org } = useBranding();

  // Update document title for SEO
  useEffect(() => {
    if (tournament) {
      const brandName = org?.brand_name || org?.name || "Ecluid Basketball";
      document.title = `${tournament.name} | ${brandName}`;
    }
  }, [tournament, org]);


  const venueById = useMemo(() => new Map(venues.map((v) => [v.id, v])), [venues]);

  const matchdayByDate = useMemo(() => {
    const keys = [
      ...new Set(
        matches.filter((m) => !!m.scheduled_at).map((m) => dayKeyFromIso(m.scheduled_at as string)),
      ),
    ].sort();
    return new Map(keys.map((k, i) => [k, i + 1]));
  }, [matches]);

  if (isLoading) return <p className="p-8 text-sm text-muted-foreground">Loading tournament…</p>;
  if (!tournament || !tournament.is_public)
    return (
      <div className="p-8">
        <EmptyState
          title="Tournament unavailable"
          description="This tournament is private or no longer exists."
        />
      </div>
    );

  const teamById = new Map(teams.map((t) => [t.id, t]));
  const side = (id: string | null, fallback: string | null) =>
    (id ? teamById.get(id) : undefined) ?? {
      name: fallback ?? "TBD",
      logo_url: null,
      jersey_color: null,
    };
  const header = sponsors.filter((s) => s.placement === "public_header");
  const footer = sponsors.filter((s) => s.placement !== "public_header");
  const upcoming = matches.filter((m) => m.status !== "completed");
  const results = matches.filter((m) => m.status === "completed");

  const matchdayLabel = (m: (typeof matches)[number]) => {
    if (!m.scheduled_at) return "Unscheduled";
    const md = matchdayByDate.get(dayKeyFromIso(m.scheduled_at)) ?? 1;
    return `Matchday ${md}`;
  };

  const groupByMatchday = (list: (typeof matches)[number][], descending = false) => {
    const map = new Map<string, (typeof matches)[number][]>();
    for (const m of list) {
      const key = matchdayLabel(m);
      map.set(key, [...(map.get(key) ?? []), m]);
    }
    const compareMatch = (a: (typeof matches)[number], b: (typeof matches)[number]) => {
      const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
      const timeDiff = descending ? tb - ta : ta - tb;
      if (timeDiff !== 0) return timeDiff;
      
      const numA = a.match_no ?? Number.POSITIVE_INFINITY;
      const numB = b.match_no ?? Number.POSITIVE_INFINITY;
      return descending ? numB - numA : numA - numB;
    };

    const entries = [...map.entries()].map(
      ([k, items]) => [k, [...items].sort(compareMatch)] as [string, (typeof matches)[number][]],
    );
    
    const groupTime = (items: (typeof matches)[number][]) => {
      const times = items
        .map((m) => (m.scheduled_at ? new Date(m.scheduled_at).getTime() : null))
        .filter((t): t is number => t !== null);
      if (times.length === 0) return Number.POSITIVE_INFINITY;
      return descending ? Math.max(...times) : Math.min(...times);
    };

    return entries.sort(([, a], [, b]) => {
      const valA = groupTime(a);
      const valB = groupTime(b);
      return descending ? valB - valA : valA - valB;
    });
  };

  const MatchRow = ({ m }: { m: (typeof matches)[number] }) => {
    const a = side(m.team_a_id, m.placeholder_a);
    const b = side(m.team_b_id, m.placeholder_b);
    const venue = m.venue_id ? venueById.get(m.venue_id) : null;
    return (
      <div className="surface-card p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {m.match_no ? `M${m.match_no}` : m.round_name || "—"}
          </span>
          {venue && (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <MapPin className="h-3 w-3 text-primary/70" />
              {venue.google_maps_url ? (
                <a
                  href={venue.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary hover:underline"
                >
                  {venue.name}
                </a>
              ) : (
                <span>{venue.name}</span>
              )}
            </div>
          )}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-6">
          <TeamChip
            name={a.name}
            logoUrl={a.logo_url}
            color={a.jersey_color}
            size="lg"
            className="min-w-0"
          />
          <div className="flex flex-col items-center gap-1.5">
            <ScoreLine scoreA={m.score_a} scoreB={m.score_b} final={m.status === "completed"} />
            <span className="text-center text-xs text-muted-foreground">
              {m.status === "completed" ? (
                formatDate(m.scheduled_at)
              ) : (
                <TipoffCountdown scheduledAt={m.scheduled_at} />
              )}
            </span>
            <StatusPill status={m.status} />
          </div>
          <TeamChip
            name={b.name}
            logoUrl={b.logo_url}
            color={b.jersey_color}
            size="lg"
            className="min-w-0 flex-row-reverse justify-start text-right"
          />
        </div>
        <MatchBreakdown
          periods={(m as { periods?: unknown }).periods}
          playerStats={(m as { player_stats?: unknown }).player_stats}
          playerOfMatchId={(m as { player_of_match_id?: string | null }).player_of_match_id ?? null}
          teamAId={m.team_a_id}
          teamBId={m.team_b_id}
          teamAName={a.name}
          teamBName={b.name}
          players={players}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/">
            <BrandWordmark />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {header.map((s) =>
              s.logo_url ? (
                <img
                  key={s.id}
                  src={s.logo_url}
                  alt={s.name}
                  loading="lazy"
                  className="h-7 object-contain"
                />
              ) : (
                <Badge key={s.id} variant="outline">
                  {s.name}
                </Badge>
              ),
            )}
          </div>
        </div>
      </header>

      <section className="hero-surface court-texture border-b border-border/60">
        {tournament.banner_url && (
          <img src={tournament.banner_url} alt="" className="h-44 w-full object-cover sm:h-60" />
        )}
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex flex-wrap items-center gap-4">
            {tournament.logo_url && (
              <img src={tournament.logo_url} alt="" className="h-14 w-14 rounded-xl object-cover" />
            )}
            <div>
              <h1 className="font-display text-3xl font-bold sm:text-4xl">{tournament.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {TOURNAMENT_FORMATS.find((f) => f.value === tournament.format)?.label}
              </p>
            </div>
            <StatusPill status={tournament.status} />
          </div>
          {tournament.description && (
            <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{tournament.description}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-primary" />
              {formatDateRangeInline(tournament.start_date, tournament.end_date)}
            </span>
            {venues.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {venues.map((v) => (
                  <div key={v.id} className="flex items-center gap-1.5">
                    <Navigation className="h-4 w-4 text-primary" />
                    {v.google_maps_url ? (
                      <a
                        href={v.google_maps_url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-primary hover:underline"
                      >
                        {v.name}
                      </a>
                    ) : (
                      <span>{v.name}</span>
                    )}
                  </div>
                ))}
              </div>
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
              <EmptyState
                title="Fixtures coming soon"
                description="The schedule has not been published yet."
              />
            ) : (
              <div className="space-y-6">
                {groupByMatchday(upcoming).map(([label, list]) => (
                  <div key={label}>
                    <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                      {label}
                    </h3>
                    <div className="space-y-2">
                      {list.map((m) => (
                        <MatchRow key={m.id} m={m} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="results">
            {results.length === 0 ? (
              <EmptyState
                title="No results yet"
                description="Completed matches will appear here with final scores."
              />
            ) : (
              <div className="space-y-6">
                {groupByMatchday(results, true).map(([label, list]) => (
                  <div key={label}>
                    <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                      {label}
                    </h3>
                    <div className="space-y-2">
                      {list.map((m) => (
                        <MatchRow key={m.id} m={m} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="standings">
            <StandingsTab teams={teams} matches={matches} tournament={tournament ?? null} />
          </TabsContent>
          <TabsContent value="bracket">
            <BracketTab teams={teams} matches={matches} />
          </TabsContent>
          <TabsContent value="teams">
            {teams.length === 0 ? (
              <EmptyState title="No teams announced" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {teams.map((t) => (
                  <div key={t.id} className="surface-card p-4">
                    <TeamChip name={t.name} logoUrl={t.logo_url} color={t.jersey_color} size="lg" />
                    <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                      {t.group_label && <p>Group {t.group_label}</p>}
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
            <p className="mb-4 text-center text-xs uppercase tracking-widest text-muted-foreground">
              Our partners
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {footer.map((s) =>
                s.logo_url ? (
                  <img
                    key={s.id}
                    src={s.logo_url}
                    alt={s.name}
                    loading="lazy"
                    className="h-10 object-contain"
                  />
                ) : (
                  <Badge key={s.id} variant="outline" className="capitalize">
                    {s.name} · {s.tier}
                  </Badge>
                ),
              )}
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-border/60 py-10 text-center text-xs text-muted-foreground bg-secondary/5">
        <div className="flex flex-col items-center gap-2">
          <BrandWordmark />
          <p className="mt-2">
            {org?.footer_text || `© ${new Date().getFullYear()} ${org?.brand_name || org?.name || "Ecluid Basketball"}`}
            {org?.powered_by_enabled !== false && (
              <span className="block mt-1 opacity-50 italic">Powered by Ecluid Basketball · Professional Tournament Management</span>
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
