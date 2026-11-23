import { useState } from "react";
import { Download, FileDown, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deliverFile } from "@/lib/download-file";
import type { FixturePdfInput } from "@/lib/fixture-pdf";

export function FixturePdfDownload({ input }: { input: FixturePdfInput }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("filled");
  const [rows, setRows] = useState(24);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState<{ blob: Blob; filename: string } | null>(null);
  const validRows = Number.isInteger(rows) && rows >= 1 && rows <= 200;
  const count = input.matches.filter(match => match.status !== "cancelled").length;
  const prepare = async () => {
    setBusy(true);
    setReady(null);
    try {
      const { buildFixturePdf } = await import("@/lib/fixture-pdf");
      const blob = buildFixturePdf(input, mode === "blank" ? rows : undefined);
      const name = input.tournamentName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "tournament";
      setReady({ blob, filename: `${name}-${mode === "blank" ? "blank-tie-sheet" : "fixtures"}.pdf` });
    } catch {
      toast.error("Could not prepare the PDF. Please try again.");
    } finally { setBusy(false); }
  };
  return <Dialog open={open} onOpenChange={value => { setOpen(value); setReady(null); }}>
    <Button variant="outline" onClick={() => { setReady(null); setOpen(true); }}><FileDown className="mr-1.5 h-4 w-4" />Download PDF</Button>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>Download fixture PDF</DialogTitle></DialogHeader>
      <Tabs value={mode} onValueChange={value => { setMode(value); setReady(null); }}>
        <TabsList className="w-full"><TabsTrigger className="flex-1" value="filled">Fixture sheet</TabsTrigger><TabsTrigger className="flex-1" value="blank">Blank tie-sheet</TabsTrigger></TabsList>
      </Tabs>
      {mode === "blank" ? <label className="space-y-2 text-sm font-medium">Blank match rows<Input aria-label="Blank match rows" type="number" min={1} max={200} value={rows} onChange={event => { setRows(Number(event.target.value)); setReady(null); }} />{!validRows && <span role="alert" className="block text-xs text-destructive">Choose 1–200 rows.</span>}</label> : <p className="text-sm text-muted-foreground">{count} active games · All matchdays</p>}
      <div className="flex justify-end gap-2">
        {ready ? <Button onClick={() => { void deliverFile(ready.blob, ready.filename).catch(() => toast.error("Could not download the PDF.")); }}><Download className="mr-1.5 h-4 w-4" />Download PDF</Button> : <Button disabled={busy || (mode === "blank" ? !validRows : count === 0)} onClick={prepare}>{busy ? <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" /> : <FileDown className="mr-1.5 h-4 w-4" />}{busy ? "Preparing…" : "Prepare PDF"}</Button>}
      </div>
    </DialogContent>
  </Dialog>;
}