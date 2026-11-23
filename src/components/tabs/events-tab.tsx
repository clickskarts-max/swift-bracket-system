import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Link2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/data-bits";
import { supabase } from "@/integrations/supabase/client";
import { useTournaments, type Tournament } from "@/lib/queries";
import { useTournamentPermissions } from "@/lib/permissions";
import { BASKETBALL_EVENTS } from "@/lib/tournament-events";
import { competitionEvents, eventTitle } from "@/lib/event-details";

export function EventsTab({ tournament, events }: { tournament: Tournament; events: Tournament[] }) {
  const parentId = tournament.parent_tournament_id ?? tournament.id;
  const parent = events.find((event) => event.id === parentId);
  const { data: permissions = [] } = useTournamentPermissions(parentId);
  const { data: tournaments = [] } = useTournaments();
  const qc = useQueryClient();
  const [existingId, setExistingId] = useState("");
  const [linkCategory, setLinkCategory] = useState("");
  const [cloneSource, setCloneSource] = useState(tournament.id);
  const [cloneCategory, setCloneCategory] = useState("");
  const available = BASKETBALL_EVENTS;
  const competitions = competitionEvents(events);
  const canEdit = permissions.includes("tournament.edit");
  const update = useMutation({
    mutationFn: async (values: { id: string; event_type: string | null; parent_tournament_id?: string }) => {
      const { id, ...patch } = values;
      const { data, error } = await supabase.from("tournaments").update(patch).eq("id", id).select("id").single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: async () => {
      await Promise.all(["tournaments", "tournament", "tournament-slug", "tournament-events"].map((key) => qc.invalidateQueries({ queryKey: [key] })));
      setExistingId(""); setLinkCategory("");
      toast.success("Tournament events updated — fixtures unchanged");
    },
    onError: (error) => toast.error(error.message),
  });
  const candidates = tournaments.filter((row) => row.id !== parentId && !row.parent_tournament_id && row.owner_id === parent?.owner_id && !tournaments.some((child) => child.parent_tournament_id === row.id));

  return <div className="space-y-6">
    {canEdit && <Link to="/tournaments/new" search={{ parent: parentId }}><Button><Plus className="mr-2 h-4 w-4" />Create event</Button></Link>}
    {competitions.length > 0 && <div className="grid gap-3 sm:grid-cols-2">{competitions.map(event => <div key={event.id} className="surface-card flex flex-wrap items-center justify-between gap-3 p-4"><div><h3 className="font-semibold">{eventTitle(event)}</h3><p className="mt-1 text-xs text-muted-foreground">{event.team_count} teams</p></div><Link to="/tournaments/$id" params={{ id: event.id }} search={{ view: "event" }}><Button variant="outline" size="sm">Open event</Button></Link></div>)}</div>}
    <div className="grid gap-3 sm:grid-cols-2">
      {BASKETBALL_EVENTS.map((category) => {
        return <div key={category.value} className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
          <div><h3 className="font-semibold">{category.label}</h3></div>
          {canEdit && <Link to="/tournaments/new" search={{ parent: parentId, event: category.value }}><Button variant="outline" size="sm"><Plus className="mr-1.5 h-4 w-4" />Add event</Button></Link>}
        </div>;
      })}
    </div>
    {canEdit && available.length > 0 && <div className="space-y-3 border-t border-border pt-5">
      <h3 className="font-semibold">Clone an event</h3>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Copy setup from"><Select value={cloneSource} onValueChange={setCloneSource}><SelectTrigger className="w-64 max-w-full"><SelectValue /></SelectTrigger><SelectContent>{events.map((row) => <SelectItem key={row.id} value={row.id}>{row.event_type ? eventTitle(row) : row.name}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="New event category"><Select value={cloneCategory} onValueChange={setCloneCategory}><SelectTrigger className="w-52 max-w-full"><SelectValue placeholder="Select event" /></SelectTrigger><SelectContent>{available.map((event) => <SelectItem key={event.value} value={event.value}>{event.label}</SelectItem>)}</SelectContent></Select></Field>
        {cloneSource && cloneCategory ? <Link to="/tournaments/new" search={{ parent: parentId, event: cloneCategory, clone: cloneSource }}><Button variant="outline"><Copy className="mr-2 h-4 w-4" />Clone event</Button></Link> : <Button variant="outline" disabled><Copy className="mr-2 h-4 w-4" />Clone event</Button>}
      </div>
    </div>}
    {canEdit && candidates.length > 0 && available.length > 0 && <div className="space-y-3 border-t border-border pt-5">
      <h3 className="font-semibold">Link an existing event</h3>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Existing tournament"><Select value={existingId} onValueChange={setExistingId}><SelectTrigger className="w-64 max-w-full"><SelectValue placeholder="Select tournament" /></SelectTrigger><SelectContent>{candidates.map((row) => <SelectItem value={row.id} key={row.id}>{row.name}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Event category"><Select value={linkCategory} onValueChange={setLinkCategory}><SelectTrigger className="w-52"><SelectValue placeholder="Select event" /></SelectTrigger><SelectContent>{available.map((event) => <SelectItem key={event.value} value={event.value}>{event.label}</SelectItem>)}</SelectContent></Select></Field>
        <Button disabled={!existingId || !linkCategory || update.isPending} onClick={() => update.mutate({ id: existingId, parent_tournament_id: parentId, event_type: linkCategory })}><Link2 className="mr-2 h-4 w-4" />Link event</Button>
      </div>
    </div>}
  </div>;
}