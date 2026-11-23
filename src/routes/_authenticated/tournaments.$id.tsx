import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ChevronRight, ExternalLink, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/app-shell";
import { EmptyState, StatCard, StatusPill } from "@/components/data-bits";
import { TournamentForm } from "@/components/tournament-form";
import { TeamsTab } from "@/components/tabs/teams-tab";
import { PlayersTab } from "@/components/tabs/players-tab";
import { ScheduleTab } from "@/components/tabs/schedule-tab";
import { StandingsTab } from "@/components/tabs/standings-tab";
import { BracketTab } from "@/components/tabs/bracket-tab";
import { SponsorsTab } from "@/components/tabs/sponsors-tab";
import { formatDateRangeInline, isFinalStatus } from "@/lib/app";
import { TOURNAMENT_FORMATS } from "@/lib/formats";
import { useMatches, usePlayers, useTeams, useTournament, useTournamentEvents, useUpsert } from "@/lib/queries";
import { TournamentEventSwitcher } from "@/components/tournament-event-switcher";
import { EventsTab } from "@/components/tabs/events-tab";
import { eventLabel } from "@/lib/tournament-events";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeProgression } from "@/lib/progression";
import { TournamentChampion } from "@/components/tournament-champion";

export const Route = createFileRoute("/_authenticated/tournaments/$id")({
  validateSearch: (search: Record<string, unknown>): { view?: "event" } => (
    search["view"] === "event" ? { view: "event" } : {}
  ),
  head: () => ({
    meta: [
      { title: "Tournament control room — Ecluid Basketball" },
      {
        name: "description",
        content:
          "Teams, rosters, fixtures, live scores, standings, brackets and sponsors for your tournament.",
      },
      { property: "og:title", content: "Tournament control room — Ecluid Basketball" },
      { property: "og:description", content: "Manage teams, fixtures, results and standings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TournamentDetail,
});

function TournamentDetail() {
  const { id } = Route.useParams();
  const { view } = Route.useSearch();
  const { data: tournament, isLoading } = useTournament(id);
  const { data: events = [] } = useTournamentEvents(tournament);
  const { data: teams = [] } = useTeams(id);
  const { data: players = [] } = usePlayers(id);
  const { data: matches = [] } = useMatches(id);
  const update = useUpsert("tournaments", [["tournaments"], ["tournament", id], ["tournament-events"], ["tournament-slug"]]);
  const qc = useQueryClient();
  const syncing = useRef(false);

  useEffect(() => {
    if (!tournament || syncing.current || !matches.length) return;
    const updates = computeProgression(teams, matches, tournament.format);
    if (!updates.length) return;
    syncing.current = true;
    (async () => {
      let ok = 0;
      for (const { id: mid, ...patch } of updates) {
        const { error } = await supabase.from("matches").update(patch).eq("id", mid);
        if (!error) ok++;
      }
      if (ok) {
        toast.success(`Playoff schedule updated (${ok} match${ok > 1 ? "es" : ""})`);
        await qc.invalidateQueries({ queryKey: ["matches", id] });
      }
      syncing.current = false;
    })();
  }, [matches, teams, tournament, id, qc]);


  if (isLoading) return <p className="text-sm text-muted-foreground">Loading tournament…</p>;
  if (!tournament)
    return (
      <EmptyState
        title="Tournament not found"
        description="It may have been deleted."
        action={
          <Link to="/dashboard">
            <Button className="mt-2">Back to dashboard</Button>
          </Link>
        }
      />
    );

  const visibleMatches = matches.filter((m) => m.status !== "cancelled");
  const played = visibleMatches.filter((m) => isFinalStatus(m.status)).length;
  const parentId = tournament.parent_tournament_id ?? id;
  const parent = events.find((event) => event.id === parentId);
  const showEvent = !!tournament.parent_tournament_id || view === "event";

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/dashboard" className="hover:text-foreground">Tournaments</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/tournaments/$id" params={{ id: parentId }} search={{}} className="hover:text-foreground">{parent?.name ?? tournament.name}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/tournaments/$id" params={{ id: parentId }} search={{}} className="hover:text-foreground">Events</Link>
        {showEvent && <><ChevronRight className="h-3.5 w-3.5" /><span className="text-foreground">{tournament.event_type ? eventLabel(tournament.event_type) : "Current event"}</span></>}
      </nav>
      <PageHeader
        title={tournament.name}
        description={`${tournament.event_type ? `${eventLabel(tournament.event_type)} · ` : ""}${TOURNAMENT_FORMATS.find((f) => f.value === tournament.format)?.label ?? ""}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={tournament.status} />
            {tournament.is_public && (
              <Link
                to="/public/tournament/$slug"
                params={{ slug: tournament.slug }}
                target="_blank"
              >
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Public page
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <TournamentEventSwitcher tournament={tournament} events={events} />

      {!showEvent ? <section aria-label="Events" className="space-y-4">
        <h2 className="text-lg font-semibold">Events</h2>
        <EventsTab key={parentId} tournament={tournament} events={events} />
      </section> : <>
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDateRangeInline(tournament.start_date, tournament.end_date)}
        </span>
        {tournament.venue && (
          <a
            className="flex items-center gap-1 hover:text-primary"
            href={tournament.venue_map_url ?? "#"}
            target="_blank"
            rel="noreferrer"
          >
            <MapPin className="h-3.5 w-3.5" />
            {tournament.venue}
          </a>
        )}
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {teams.length} teams · {players.length} players
        </span>
      </div>

      <TournamentChampion tournament={tournament} teams={teams} matches={matches} />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Teams" value={teams.length} />
        <StatCard label="Players" value={players.length} />
        <StatCard label="Matches" value={visibleMatches.length} />
        <StatCard label="Played" value={`${played}/${visibleMatches.length}`} />
      </div>

      <Tabs defaultValue="schedule">
        <div className="-mx-4 mb-4 overflow-x-auto px-4">
          <TabsList className="w-max">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="bracket">Playoffs</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="schedule">
          <ScheduleTab key={id} tournament={tournament} />
        </TabsContent>
        <TabsContent value="standings">
          <StandingsTab teams={teams} matches={matches} tournament={tournament ?? null} />
        </TabsContent>
        <TabsContent value="bracket">
          <BracketTab teams={teams} matches={matches} />
        </TabsContent>
        <TabsContent value="teams">
          <TeamsTab tournamentId={id} />
        </TabsContent>
        <TabsContent value="players">
          <PlayersTab tournamentId={id} />
        </TabsContent>
        <TabsContent value="sponsors">
          <SponsorsTab tournamentId={id} />
        </TabsContent>
        <TabsContent value="settings">
          <TournamentForm
            key={id}
            initial={tournament}
            submitLabel="Save changes"
            pending={update.isPending}
            onSubmit={(values) =>
              update.mutate(
                { ...values, id },
                {
                  onSuccess: () => toast.success("Tournament updated"),
                  onError: (e) => toast.error(e.message),
                },
              )
            }
          />
        </TabsContent>
        <TabsContent value="events"><EventsTab key={tournament.parent_tournament_id ?? id} tournament={tournament} events={events} /></TabsContent>
      </Tabs>
      </>}
    </div>
  );
}
