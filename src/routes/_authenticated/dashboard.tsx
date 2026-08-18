import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Archive, CalendarDays, ExternalLink, MapPin, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/app-shell";
import { EmptyState, StatCard, StatusPill } from "@/components/data-bits";
import { useTournaments, useUpsert, useRemove } from "@/lib/queries";
import { formatDateRangeInline } from "@/lib/app";
import { TOURNAMENT_FORMATS } from "@/lib/formats";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Ecluid Basketball" },
      { name: "description", content: "All your basketball tournaments, live status, teams and fixtures in one place." },
      { property: "og:title", content: "Dashboard — Ecluid Basketball" },
      { property: "og:description", content: "Manage every basketball tournament you run." },
    ],
  }),
  component: Dashboard,
});

const formatLabel = (value: string) => TOURNAMENT_FORMATS.find((f) => f.value === value)?.label ?? value;

function Dashboard() {
  const { data: tournaments = [], isLoading } = useTournaments();
  const update = useUpsert("tournaments", [["tournaments"]]);
  const remove = useRemove("tournaments", [["tournaments"]]);
  const [tab, setTab] = useState("active");

  const visible = tournaments.filter((t) => (tab === "archived" ? t.archived : !t.archived));
  const live = tournaments.filter((t) => t.status === "live" && !t.archived).length;

  return (
    <div>
      <PageHeader
        title="Tournaments"
        description="Create, run and publish your basketball competitions."
        action={
          <Link to="/tournaments/new">
            <Button><Plus className="mr-1.5 h-4 w-4" /> New tournament</Button>
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Tournaments" value={tournaments.filter((t) => !t.archived).length} />
        <StatCard label="Live now" value={live} />
        <StatCard label="Archived" value={tournaments.filter((t) => t.archived).length} />
        <StatCard label="Public pages" value={tournaments.filter((t) => t.is_public && !t.archived).length} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading tournaments…</p>
      ) : visible.length === 0 ? (
        <EmptyState
          title={tab === "archived" ? "Nothing archived" : "No tournaments yet"}
          description="Create your first tournament, add teams and generate the entire fixture list automatically."
          action={
            <Link to="/tournaments/new">
              <Button className="mt-2"><Plus className="mr-1.5 h-4 w-4" /> Create tournament</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((t) => (
            <div key={t.id} className="surface-card animate-rise overflow-hidden transition-transform hover:-translate-y-0.5">
              {t.banner_url && (
                <img src={t.banner_url} alt="" loading="lazy" className="h-28 w-full object-cover" />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {t.logo_url && <img src={t.logo_url} alt="" loading="lazy" className="h-10 w-10 rounded-lg object-cover" />}
                    <div className="min-w-0">
                      <Link
                        to="/tournaments/$id"
                        params={{ id: t.id }}
                        className="truncate font-display text-lg font-semibold hover:text-primary"
                      >
                        {t.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{formatLabel(t.format)}</p>
                    </div>
                  </div>
                  <StatusPill status={t.status} />
                </div>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDateRangeInline(t.start_date, t.end_date)}
                  </span>
                  {t.venue && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{t.venue}</span>}
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{t.team_count} teams</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to="/tournaments/$id" params={{ id: t.id }}>
                    <Button size="sm">Manage</Button>
                  </Link>
                  {t.is_public && (
                    <Link to="/public/tournament/$slug" params={{ slug: t.slug }} target="_blank">
                      <Button size="sm" variant="outline"><ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Public page</Button>
                    </Link>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      update.mutate(
                        { id: t.id, archived: !t.archived, status: !t.archived ? "archived" : "draft" },
                        { onSuccess: () => toast.success(t.archived ? "Restored" : "Archived") },
                      )
                    }
                  >
                    <Archive className="mr-1.5 h-3.5 w-3.5" /> {t.archived ? "Restore" : "Archive"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete “{t.name}”?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently removes the tournament with all its teams, players, matches and sponsors.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => remove.mutate(t.id, { onSuccess: () => toast.success("Tournament deleted") })}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
