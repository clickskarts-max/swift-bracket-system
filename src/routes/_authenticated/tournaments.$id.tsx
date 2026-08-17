import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ExternalLink, MapPin, Users } from "lucide-react";
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
import { ImportTab } from "@/components/tabs/import-tab";
import { formatDate } from "@/lib/app";
import { TOURNAMENT_FORMATS } from "@/lib/formats";
import { useMatches, usePlayers, useTeams, useTournament, useUpsert } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/tournaments/$id")({
  head: () => ({
    meta: [
      { title: "Tournament control room — Ecluid Basketball" },
      { name: "description", content: "Teams, rosters, fixtures, live scores, standings, brackets and sponsors for your tournament." },
      { property: "og:title", content: "Tournament control room — Ecluid Basketball" },
      { property: "og:description", content: "Manage teams, fixtures, results and standings." },
    ],
  }),
  component: TournamentDetail,
});

function TournamentDetail() {
  const { id } = Route.useParams();
  const { data: tournament, isLoading } = useTournament(id);
  const { data: teams = [] } = useTeams(id);
  const { data: players = [] } = usePlayers(id);
  const { data: matches = [] } = useMatches(id);
  const update = useUpsert("tournaments", [["tournaments"], ["tournament", id]]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading tournament…</p>;
  if (!tournament)
    return (
      <EmptyState
        title="Tournament not found"
        description="It may have been deleted."
        action={<Link to="/dashboard"><Button className="mt-2">Back to dashboard</Button></Link>}
      />
    );

  const played = matches.filter((m) => m.status === "completed").length;

  return (
    <div>
      <PageHeader
        title={tournament.name}
        description={TOURNAMENT_FORMATS.find((f) => f.value === tournament.format)?.label}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={tournament.status} />
            {tournament.is_public && (
              <Link to="/public/tournament/$slug" params={{ slug: tournament.slug }} target="_blank">
                <Button variant="outline" size="sm"><ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Public page</Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(tournament.start_date)} – {formatDate(tournament.end_date)}</span>
        {tournament.venue && (
          <a className="flex items-center gap-1 hover:text-primary" href={tournament.venue_map_url ?? "#"} target="_blank" rel="noreferrer">
            <MapPin className="h-3.5 w-3.5" />{tournament.venue}
          </a>
        )}
        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{teams.length} teams · {players.length} players</span>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Teams" value={teams.length} />
        <StatCard label="Players" value={players.length} />
        <StatCard label="Matches" value={matches.length} />
        <StatCard label="Played" value={`${played}/${matches.length}`} />
      </div>

      <Tabs defaultValue="schedule">
        <div className="-mx-4 mb-4 overflow-x-auto px-4">
          <TabsList className="w-max">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="bracket">Bracket</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="schedule"><ScheduleTab tournament={tournament} /></TabsContent>
        <TabsContent value="standings"><StandingsTab teams={teams} matches={matches} /></TabsContent>
        <TabsContent value="bracket"><BracketTab teams={teams} matches={matches} /></TabsContent>
        <TabsContent value="teams"><TeamsTab tournamentId={id} /></TabsContent>
        <TabsContent value="players"><PlayersTab tournamentId={id} /></TabsContent>
        <TabsContent value="sponsors"><SponsorsTab tournamentId={id} /></TabsContent>
        <TabsContent value="import"><ImportTab tournament={tournament} /></TabsContent>
        <TabsContent value="settings">
          <TournamentForm
            initial={tournament}
            submitLabel="Save changes"
            pending={update.isPending}
            onSubmit={(values) =>
              update.mutate({ ...values, id }, { onSuccess: () => toast.success("Tournament updated"), onError: (e) => toast.error(e.message) })
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
