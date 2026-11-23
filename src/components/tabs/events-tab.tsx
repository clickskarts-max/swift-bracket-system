import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, StatusPill } from "@/components/data-bits";
import { supabase } from "@/integrations/supabase/client";
import { useTournaments, type Tournament } from "@/lib/queries";
import { useTournamentPermissions } from "@/lib/permissions";
import { availableEventTypes, BASKETBALL_EVENTS, eventLabel } from "@/lib/tournament-events";

export function EventsTab({ tournament, events }: { tournament: Tournament; events: Tournament[] }) {
  const parentId = tournament.parent_tournament_id ?? tournament.id;
  const parent = events.find((event) => event.id === parentId);
  const { data: permissions = [] } = useTournamentPermissions(parentId);
  const { data: tournaments = [] } = useTournaments();
  const qc = useQueryClient();
  const [mainCategory, setMainCategory] = useState(parent?.event_type ?? "unassigned");
  const [existingId, setExistingId] = useState("");
  const [linkCategory, setLinkCategory] = useState("");
  const available = availableEventTypes(events);
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
    {parent && canEdit && <div className="flex flex-wrap items-end gap-3 border-b border-border pb-5">
      <Field label="Current main event category">
        <Select value={mainCategory} onValueChange={setMainCategory}>
          <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {BASKETBALL_EVENTS.filter((event) => event.value === parent.event_type || available.some((item) => item.value === event.value)).map((event) => <SelectItem key={event.value} value={event.value}>{event.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Button disabled={update.isPending} onClick={() => update.mutate({ id: parentId, event_type: mainCategory === "unassigned" ? null : mainCategory })}><Save className="mr-2 h-4 w-4" />Save category</Button>
    </div>}
    <div className="grid gap-3 sm:grid-cols-2">
      {BASKETBALL_EVENTS.map((category) => {
        const event = events.find((row) => row.event_type === category.value);
        return <div key={category.value} className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
          <div><h3 className="font-semibold">{category.label}</h3><p className="mt-1 text-xs text-muted-foreground">{event ? `${event.team_count} teams` : "Not added"}</p></div>
          {event ? <div className="flex items-center gap-2"><StatusPill status={event.status} /><Link to="/tournaments/$id" params={{ id: event.id }}><Button variant="outline" size="sm">Open event</Button></Link></div>
            : canEdit && <Link to="/tournaments/new" search={{ parent: parentId, event: category.value }}><Button variant="outline" size="sm"><Plus className="mr-1.5 h-4 w-4" />Add event</Button></Link>}
        </div>;
      })}
    </div>
    {!parent?.event_type && <p className="text-sm text-muted-foreground">Current teams and fixtures: {eventLabel(parent?.event_type)} (category unassigned).</p>}
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