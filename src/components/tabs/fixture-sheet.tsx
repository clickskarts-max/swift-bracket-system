import { useState } from "react";
import { ArrowLeftRight, CalendarArrowDown, CalendarArrowUp, ChevronDown, ChevronUp, Pencil, Search, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScoreLine, StatusPill, TeamChip } from "@/components/data-bits";
import { formatDate, isFinalStatus } from "@/lib/app";
import type { Match, Venue } from "@/lib/queries";
import type { FixtureMove } from "@/lib/fixture-movement";

type Side = { name: string; logo_url: string | null; jersey_color: string | null };

export function FixtureSheet({ grouped, label, venues, busy, onMove, onSwap, onEdit, onScore }: {
  grouped: [string, Match[]][];
  label: (match: Match, side: "a" | "b") => Side;
  venues: Venue[];
  busy: boolean;
  onMove: (match: Match, direction: FixtureMove) => void;
  onSwap: (match: Match) => void;
  onEdit: (match: Match) => void;
  onScore: (match: Match) => void;
}) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const rows = grouped.flatMap(([day, matches]) => matches.map(match => ({ day, match }))).filter(({ day, match }) =>
    [day, `M${match.match_no}`, label(match, "a").name, label(match, "b").name, match.group_label ? `Group ${match.group_label}` : match.round_name, match.status]
      .some(value => value?.toLowerCase().includes(query))
  );

  return <TooltipProvider delayDuration={150}>
    <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input aria-label="Search matches" placeholder="Search teams, match, group or day" className="pl-9" value={search} onChange={event => setSearch(event.target.value)} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{rows.length} matches</span>
    </div>
    <div className="w-full min-w-0 max-w-full overflow-hidden border border-border [&>div]:max-h-[70dvh]">
      <Table aria-label="Fixture sheet" className="min-w-[1080px] [&_td]:py-1.5">
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            {['Match', 'Day / time', 'Group / round', 'Home', 'Score', 'Away', 'Venue', 'Status', 'Manage'].map(title => <TableHead key={title} className="whitespace-nowrap">{title}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ day, match: m }) => {
            const a = label(m, "a");
            const b = label(m, "b");
            const actions = [
              ...(m.status === "scheduled" ? [
                { title: "Move game up", Icon: ChevronUp, run: () => onMove(m, "up"), disabled: busy || !m.scheduled_at },
                { title: "Move game down", Icon: ChevronDown, run: () => onMove(m, "down"), disabled: busy || !m.scheduled_at },
                { title: "Move game to previous day", Icon: CalendarArrowUp, run: () => onMove(m, "previous-day"), disabled: busy || !m.scheduled_at },
                { title: "Move game to next day", Icon: CalendarArrowDown, run: () => onMove(m, "next-day"), disabled: busy || !m.scheduled_at },
              ] : []),
              { title: "Switch home and away", Icon: ArrowLeftRight, run: () => onSwap(m), disabled: busy },
              { title: "Edit match", Icon: Pencil, run: () => onEdit(m), disabled: busy },
              { title: "Enter score", Icon: SquarePen, run: () => onScore(m), disabled: busy },
            ];
            return <TableRow key={m.id} data-match-id={m.id}>
              <TableCell className="font-semibold tabular-nums">M{m.match_no ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap text-xs">
                <div className="font-medium">{day.split(" · ")[0]}</div>
                <div className="text-muted-foreground">{m.scheduled_at ? `${formatDate(m.scheduled_at)} · ${new Date(m.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "TBD"}</div>
              </TableCell>
              <TableCell className="max-w-36 text-xs"><span className={m.group_label ? "font-medium text-primary" : "text-muted-foreground"}>{m.group_label ? `Group ${m.group_label}` : m.round_name ?? m.stage}</span></TableCell>
              <TableCell className="max-w-44"><TeamChip name={a.name} logoUrl={a.logo_url} color={a.jersey_color} className="gap-2 px-0" /></TableCell>
              <TableCell className="whitespace-nowrap"><ScoreLine scoreA={m.score_a} scoreB={m.score_b} final={isFinalStatus(m.status)} className="text-base sm:text-base" /></TableCell>
              <TableCell className="max-w-44"><TeamChip name={b.name} logoUrl={b.logo_url} color={b.jersey_color} className="gap-2 px-0" /></TableCell>
              <TableCell className="max-w-32 text-xs">{venues.find(venue => venue.id === m.venue_id)?.name ?? "—"}</TableCell>
              <TableCell><StatusPill status={m.status} /></TableCell>
              <TableCell>
                <div className="flex items-center">
                  {actions.map(({ title, Icon, run, disabled }) => <Tooltip key={title}>
                    <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={`${title} M${m.match_no}`} disabled={disabled} onClick={run}><Icon className="h-3.5 w-3.5" /></Button></TooltipTrigger>
                    <TooltipContent>{title}</TooltipContent>
                  </Tooltip>)}
                </div>
              </TableCell>
            </TableRow>;
          })}
          {!rows.length && <TableRow><TableCell colSpan={9} className="h-24 text-center text-muted-foreground">No matching games</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  </TooltipProvider>;
}