import { Link } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/data-bits";
import { eventLabel } from "@/lib/tournament-events";
import type { Tournament } from "@/lib/queries";

export function TournamentEventSwitcher({ tournament, events, publicPage = false }: {
  tournament: Tournament; events: Tournament[]; publicPage?: boolean;
}) {
  if (publicPage && events.length < 2 && !tournament.event_type) return null;
  const parent = events.find((event) => event.id === (tournament.parent_tournament_id ?? tournament.id));
  return (
    <section aria-label="Tournament events" className="mb-6 border-y border-border py-4">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <Layers className="h-4 w-4 text-primary" />
        <span className="font-semibold">{parent?.name ?? tournament.name}</span>
        <span className="text-muted-foreground">· {events.length} event{events.length === 1 ? "" : "s"}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {events.map((event) => {
          const content = <Button variant={event.id === tournament.id ? "default" : "outline"} size="sm" className="h-auto min-h-9 gap-2 whitespace-normal py-2 text-left">
            {eventLabel(event.event_type)} <StatusPill status={event.status} />
          </Button>;
          return publicPage ? (
            <Link key={event.id} to="/public/tournament/$slug" params={{ slug: event.slug }} aria-current={event.id === tournament.id ? "page" : undefined}>{content}</Link>
          ) : (
            <Link key={event.id} to="/tournaments/$id" params={{ id: event.id }} search={{ view: "event" }} aria-current={event.id === tournament.id ? "page" : undefined}>{content}</Link>
          );
        })}
      </div>
    </section>
  );
}