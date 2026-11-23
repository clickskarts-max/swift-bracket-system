import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/data-bits";
import { eventTitle } from "@/lib/event-details";
import { formatDateRangeInline } from "@/lib/app";
import { TOURNAMENT_FORMATS } from "@/lib/formats";
import type { Tournament } from "@/lib/queries";

export function PublicEventDirectory({ events }: { events: Tournament[] }) {
  return <section aria-label="Tournament event directory" className="space-y-5">
    <div className="flex items-center justify-between border-b border-border pb-4"><h2 className="font-display text-2xl font-semibold">Events</h2><span className="text-sm text-muted-foreground">{events.length} competitions</span></div>
    {events.length === 0 ? <p className="py-8 text-muted-foreground">Events will be announced soon.</p> : <div className="grid gap-4 sm:grid-cols-2">
      {events.map(event => <article key={event.id} className="surface-card flex flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3">{event.logo_url ? <img src={event.logo_url} alt="" className="h-12 w-12 shrink-0 object-contain" /> : <Trophy className="h-8 w-8 shrink-0 text-primary" />}<h3 className="font-display text-xl font-semibold">{eventTitle(event)}</h3></div><StatusPill status={event.status} /></div>
        <p className="text-sm text-muted-foreground">{event.name}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"><span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{event.team_count} teams</span><span>{TOURNAMENT_FORMATS.find(format => format.value === event.format)?.label ?? event.format}</span><span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{formatDateRangeInline(event.start_date, event.end_date)}</span></div>
        <Link to="/public/tournament/$slug" params={{ slug: event.slug }} className="mt-auto"><Button variant="outline" className="w-full justify-between">View event<ArrowUpRight className="h-4 w-4" /></Button></Link>
      </article>)}
    </div>}
  </section>;
}