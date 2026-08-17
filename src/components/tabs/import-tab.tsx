import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileUp, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/data-bits";
import { analyzeSchedule, extractTextFromFile, type ParsedSchedule } from "@/lib/importer";
import { TOURNAMENT_FORMATS, PLAYOFF_FORMATS } from "@/lib/formats";
import { useTeams, type Tournament } from "@/lib/queries";

const label = (list: readonly { value: string; label: string }[], v: string) => list.find((i) => i.value === v)?.label ?? v;

export function ImportTab({ tournament }: { tournament: Tournament }) {
  const qc = useQueryClient();
  const { data: existingTeams = [] } = useTeams(tournament.id);
  const [parsing, setParsing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<ParsedSchedule | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { toast.error("File is larger than 15 MB"); return; }
    setParsing(true);
    try {
      const text = await extractTextFromFile(file);
      const parsed = analyzeSchedule(text);
      setResult(parsed);
      toast.success(parsed.fixtures.length ? `${parsed.fixtures.length} fixtures detected` : "File read, but no fixtures found");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read this file");
    } finally {
      setParsing(false);
    }
  };

  const apply = async () => {
    if (!result) return;
    setApplying(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const owner_id = userData.user?.id;
      if (!owner_id) throw new Error("Sign in required");

      const byName = new Map(existingTeams.map((t) => [t.name.toLowerCase(), t.id]));
      const missing = result.teams.filter((n) => !byName.has(n.toLowerCase()));
      if (missing.length) {
        const ins = await supabase
          .from("teams")
          .insert(missing.map((name) => ({ name, tournament_id: tournament.id, owner_id })))
          .select("id, name");
        if (ins.error) throw new Error(ins.error.message);
        (ins.data ?? []).forEach((t) => byName.set(t.name.toLowerCase(), t.id));
      }

      const del = await supabase.from("matches").delete().eq("tournament_id", tournament.id);
      if (del.error) throw new Error(del.error.message);

      const rounds = [...new Set(result.fixtures.map((f) => f.roundName ?? "Round 1"))];
      const rows = result.fixtures.map((f, i) => ({
        tournament_id: tournament.id,
        owner_id,
        match_no: f.matchNo ?? i + 1,
        stage: /final|qualifier|eliminator|semi|quarter|playoff/i.test(f.roundName ?? "") ? "playoff" : "league",
        round_name: f.roundName ?? "Round 1",
        round_index: Math.max(0, rounds.indexOf(f.roundName ?? "Round 1")),
        leg: 1,
        team_a_id: byName.get(f.teamA.toLowerCase()) ?? null,
        team_b_id: byName.get(f.teamB.toLowerCase()) ?? null,
        placeholder_a: byName.has(f.teamA.toLowerCase()) ? null : f.teamA,
        placeholder_b: byName.has(f.teamB.toLowerCase()) ? null : f.teamB,
        notes: [f.dateLabel, f.time].filter(Boolean).join(" · ") || null,
        status: "scheduled",
      }));
      const ins = await supabase.from("matches").insert(rows);
      if (ins.error) throw new Error(ins.error.message);

      const upd = await supabase
        .from("tournaments")
        .update({
          format: result.detectedFormat,
          legs: result.detectedLegs,
          playoff_format: result.detectedPlayoff,
          team_count: byName.size,
        })
        .eq("id", tournament.id);
      if (upd.error) throw new Error(upd.error.message);

      await Promise.all([
        qc.invalidateQueries({ queryKey: ["matches", tournament.id] }),
        qc.invalidateQueries({ queryKey: ["teams", tournament.id] }),
        qc.invalidateQueries({ queryKey: ["tournament", tournament.id] }),
      ]);
      toast.success(`Imported ${rows.length} matches`);
      setResult(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="surface-card court-texture flex flex-col items-center gap-3 p-8 text-center">
        <FileUp className="h-8 w-8 text-primary" />
        <h3 className="font-display text-lg font-semibold">Import fixtures from a file</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Upload a PDF, XML, CSV or text schedule. Ecluid detects teams, rounds, match numbers and the tournament format.
        </p>
        <Field label="Schedule file">
          <Input
            type="file"
            accept=".pdf,.xml,.txt,.csv,.md"
            onChange={(e) => handleFile(e.target.files?.[0])}
            disabled={parsing}
          />
        </Field>
        {parsing && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Reading file…</p>}
      </div>

      {result && (
        <div className="surface-card animate-rise space-y-4 p-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{label(TOURNAMENT_FORMATS, result.detectedFormat)}</Badge>
            <Badge variant="outline">{result.detectedLegs} leg(s)</Badge>
            <Badge variant="outline">{label(PLAYOFF_FORMATS, result.detectedPlayoff)}</Badge>
            <Badge variant="secondary">{result.teams.length} teams</Badge>
            <Badge variant="secondary">{result.fixtures.length} fixtures</Badge>
          </div>
          {result.notes.length > 0 && (
            <ul className="list-inside list-disc text-xs text-muted-foreground">
              {result.notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          )}
          <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
            {result.fixtures.slice(0, 100).map((f, i) => (
              <div key={`${f.teamA}-${f.teamB}-${i}`} className="flex items-center justify-between border-b border-border/60 px-3 py-2 text-sm last:border-0">
                <span className="truncate">{f.matchNo ? `M${f.matchNo} · ` : ""}{f.teamA} vs {f.teamB}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{[f.roundName, f.time].filter(Boolean).join(" · ")}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={apply} disabled={applying || result.fixtures.length === 0}>
              <Wand2 className="mr-1.5 h-4 w-4" /> Apply import
            </Button>
            <Button variant="ghost" onClick={() => setResult(null)}>Discard</Button>
          </div>
          <p className="text-xs text-muted-foreground">Applying replaces the current match list and adds any missing teams.</p>
        </div>
      )}
    </div>
  );
}
