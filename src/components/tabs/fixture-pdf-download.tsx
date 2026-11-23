import { useRef, useState } from "react";
import { Download, FileDown, LoaderCircle, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deliverFile } from "@/lib/download-file";
import { FIXTURE_PDF_COLUMNS, type FixturePdfColumn, type FixturePdfInput } from "@/lib/fixture-pdf-model";

async function logoPng(src: string): Promise<string> {
  const image = new Image(); image.crossOrigin = "anonymous"; image.src = src;
  await image.decode();
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 600 / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not load logo");
  const side = Math.max(canvas.width, canvas.height);
  canvas.width = side; canvas.height = side;
  context.drawImage(image, (side - image.naturalWidth * scale) / 2, (side - image.naturalHeight * scale) / 2, image.naturalWidth * scale, image.naturalHeight * scale);
  return canvas.toDataURL("image/png");
}

export function FixturePdfDownload({ input }: { input: FixturePdfInput }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("filled");
  const [heading, setHeading] = useState("");
  const [subheading, setSubheading] = useState("");
  const [columns, setColumns] = useState<FixturePdfColumn[]>(FIXTURE_PDF_COLUMNS.map(({ key }) => ({ key })));
  const [showGroups, setShowGroups] = useState(true);
  const [logo, setLogo] = useState<string | null>(null);
  const [useParentLogo, setUseParentLogo] = useState(true);
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState<{ blob: Blob; filename: string } | null>(null);
  const count = input.matches.filter(match => match.status !== "cancelled").length;
  const invalidate = () => setReady(null);
  const uploadLogo = async (file: File | undefined) => {
    if (!file) return;
    invalidate();
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { toast.error("Choose a PNG, JPG or WebP logo up to 5 MB."); return; }
    setBusy(true);
    const url = URL.createObjectURL(file);
    try { setLogo(await logoPng(url)); setUseParentLogo(true); }
    catch { toast.error("Could not read this logo."); }
    finally { URL.revokeObjectURL(url); setBusy(false); }
  };
  const prepare = async () => {
    setBusy(true); invalidate();
    try {
      const { buildFixturePdf } = await import("@/lib/fixture-pdf");
      const source = useParentLogo ? logo ?? input.logoUrl : null;
      const image = source ? await logoPng(source) : undefined;
      const blob = buildFixturePdf({ ...input, ...(input.tournamentUrl ? { tournamentUrl: new URL(input.tournamentUrl, window.location.origin).href } : {}) }, undefined, { heading, subheading: subheading.trim() || (mode === "blank" ? "Blank tie-sheet" : "Fixture sheet"), columns, showGroups, ...(image ? { logo: image } : {}) });
      const name = input.tournamentName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "tournament";
      setReady({ blob, filename: `${name}-${mode === "blank" ? "blank-tie-sheet" : "fixtures"}.pdf` });
    } catch { toast.error("Could not prepare the PDF. Check the logo or remove it and try again."); }
    finally { setBusy(false); }
  };
  return <Dialog open={open} onOpenChange={value => { setOpen(value); invalidate(); }}>
    <Button variant="outline" onClick={() => { invalidate(); setOpen(true); }}><FileDown className="mr-1.5 h-4 w-4" />Download PDF</Button>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>Download fixture PDF</DialogTitle></DialogHeader>
      <p className="min-w-0 break-words text-sm text-muted-foreground">{input.tournamentName} · {input.teams?.length ?? 0} teams · {count} active games</p>
      <fieldset disabled={busy} className="min-w-0 space-y-4">
        <Tabs value={mode} onValueChange={value => { setMode(value); setColumns(current => current.map(column => ({ ...column, blank: value === "blank" && ["home", "away", "date", "score"].includes(column.key) }))); invalidate(); }}>
          <TabsList className="w-full"><TabsTrigger className="flex-1" value="filled">Current fixture</TabsTrigger><TabsTrigger className="flex-1" value="blank">Blank tie-sheet</TabsTrigger></TabsList>
        </Tabs>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-medium">Custom heading<Input aria-label="Custom heading" maxLength={120} placeholder={input.tournamentName} value={heading} onChange={event => { setHeading(event.target.value); invalidate(); }} /></label>
          <label className="space-y-1 text-sm font-medium">Subheading<Input aria-label="Subheading" maxLength={160} placeholder="Fixture sheet" value={subheading} onChange={event => { setSubheading(event.target.value); invalidate(); }} /></label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {useParentLogo && (logo || input.logoUrl) && <img src={logo ?? input.logoUrl ?? ""} alt="PDF logo" className="h-12 w-12 object-contain" />}
          <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Upload PDF logo" className="hidden" onChange={event => { void uploadLogo(event.target.files?.[0]); event.target.value = ""; }} />
          <Button variant="outline" onClick={() => fileInput.current?.click()}><Upload className="mr-1.5 h-4 w-4" />Upload logo</Button>
          {(logo || input.logoUrl) && <Button variant="ghost" size="icon" aria-label="Remove PDF logo" title="Remove PDF logo" onClick={() => { setLogo(null); setUseParentLogo(false); invalidate(); }}><X className="h-4 w-4" /></Button>}
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-primary" checked={showGroups} onChange={event => { setShowGroups(event.target.checked); invalidate(); }} />Group table above fixtures</label>
        <div className="space-y-2">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3.5rem] gap-2 text-xs font-semibold text-muted-foreground"><span>Include column</span><span>Custom column heading</span><span>Blank</span></div>
          {FIXTURE_PDF_COLUMNS.map(item => {
            const column = columns.find(column => column.key === item.key);
            const update = (change: Partial<FixturePdfColumn>) => { setColumns(current => current.map(column => column.key === item.key ? { ...column, ...change } : column)); invalidate(); };
            return <div key={item.key} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3.5rem] items-center gap-2 border-b border-border pb-2">
              <label className="flex min-w-0 items-center gap-2 text-sm"><input type="checkbox" className="shrink-0 accent-primary" aria-label={`Include ${item.label}`} checked={Boolean(column)} onChange={event => { setColumns(current => event.target.checked ? FIXTURE_PDF_COLUMNS.flatMap(itemColumn => itemColumn.key === item.key ? [{ key: item.key, blank: mode === "blank" && ["home", "away", "date", "score"].includes(item.key) }] : current.filter(column => column.key === itemColumn.key)) : current.filter(column => column.key !== item.key)); invalidate(); }} />{item.label}</label>
              <Input aria-label={`${item.label} heading`} disabled={!column} placeholder={item.label} maxLength={60} value={column?.heading ?? ""} onChange={event => update({ heading: event.target.value })} />
              <input type="checkbox" className="justify-self-center accent-primary" aria-label={`Leave ${item.label} blank`} disabled={!column} checked={column?.blank ?? false} onChange={event => update({ blank: event.target.checked })} />
            </div>;
          })}
        </div>
      </fieldset>
      {!columns.length && <p role="alert" className="text-sm text-destructive">Select at least one column.</p>}
      <div className="flex justify-end gap-2">
        {ready ? <Button onClick={() => { void deliverFile(ready.blob, ready.filename).catch(() => toast.error("Could not download the PDF.")); }}><Download className="mr-1.5 h-4 w-4" />Download PDF</Button> : <Button disabled={busy || !columns.length || count === 0} onClick={prepare}>{busy ? <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" /> : <FileDown className="mr-1.5 h-4 w-4" />}{busy ? "Preparing…" : "Prepare PDF"}</Button>}
      </div>
    </DialogContent>
  </Dialog>;
}
