import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/data-bits";
import { ImageUpload } from "@/components/image-upload";
import { STATUSES, uniqueSlug } from "@/lib/app";
import { tournamentContainerValues } from "@/lib/tournament-container";
import type { TournamentValues } from "@/components/tournament-form";
import type { Tournament } from "@/lib/queries";

export function TournamentContainerForm({ initial, pending, onSubmit }: {
  initial?: Tournament;
  pending?: boolean;
  onSubmit: (values: TournamentValues) => void;
}) {
  const [values, setValues] = useState(() => tournamentContainerValues(initial ?? {}));
  const set = <K extends keyof TournamentValues>(key: K, value: TournamentValues[K]) =>
    setValues(current => ({ ...current, [key]: value }));

  return <form className="space-y-6" onSubmit={(event) => {
    event.preventDefault();
    if (values.name.trim().length < 2 || values.name.trim().length > 120) { toast.error("Enter a tournament name between 2 and 120 characters"); return; }
    if (values.slug.trim().length < 2 || values.slug.trim().length > 64) { toast.error("Enter a public URL slug between 2 and 64 characters"); return; }
    if (values.start_date && values.end_date && values.end_date < values.start_date) { toast.error("End date must be on or after the start date"); return; }
    onSubmit(tournamentContainerValues({ ...values, name: values.name.trim(), slug: values.slug.trim() }));
  }}>
    <section className="space-y-5 border-b border-border pb-6">
      <h2 className="font-display text-lg font-semibold">Tournament details</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Logo image"><ImageUpload value={values.logo_url} onChange={url => set("logo_url", url)} folder="tournament-logos" /></Field>
        <div className="space-y-4">
          <Field label="Tournament name"><Input value={values.name} maxLength={120} onChange={event => { set("name", event.target.value); if (!initial) set("slug", uniqueSlug(event.target.value)); }} placeholder="10th National Games" required /></Field>
          <Field label="Public URL slug" hint={`/public/tournament/${values.slug || "your-slug"}`}><Input value={values.slug} maxLength={64} onChange={event => set("slug", event.target.value)} required /></Field>
        </div>
        <Field label="Start date (optional)"><Input type="date" value={values.start_date ?? ""} onChange={event => set("start_date", event.target.value || null)} /></Field>
        <Field label="End date (optional)"><Input type="date" value={values.end_date ?? ""} onChange={event => set("end_date", event.target.value || null)} /></Field>
        <Field label="Venue (optional)"><Input value={values.venue ?? ""} maxLength={200} onChange={event => set("venue", event.target.value || null)} /></Field>
        <Field label="Status"><Select value={values.status} onValueChange={value => set("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(status => <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>)}</SelectContent></Select></Field>
        <div className="sm:col-span-2"><Field label="Description (optional)"><Textarea value={values.description ?? ""} maxLength={2000} onChange={event => set("description", event.target.value || null)} /></Field></div>
      </div>
      <div className="flex items-center justify-between gap-4"><span className="text-sm font-medium">Public tournament page</span><Switch aria-label="Public tournament page" checked={values.is_public} onCheckedChange={value => set("is_public", value)} /></div>
    </section>
    <div className="flex justify-end"><Button type="submit" disabled={pending} className="w-full sm:w-auto">{pending ? "Saving…" : initial ? "Save tournament" : "Create tournament"}<ChevronRight className="ml-2 h-4 w-4" /></Button></div>
  </form>;
}