import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="surface-card animate-rise p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="surface-card court-texture flex flex-col items-center gap-3 px-6 py-14 text-center">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  live: "bg-success/15 text-success border-success/40",
  completed: "bg-success/15 text-success border-success/40",
  upcoming: "bg-accent/15 text-accent border-accent/40",
  scheduled: "bg-accent/15 text-accent border-accent/40",
  draft: "bg-muted text-muted-foreground border-border",
  archived: "bg-muted text-muted-foreground border-border",
  postponed: "bg-warning/15 text-warning border-warning/40",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export function StatusPill({ status }: { status: string }) {
  const live = status === "live";
  return (
    <Badge variant="outline" className={cn("capitalize", STATUS_STYLES[status] ?? STATUS_STYLES["draft"])}>
      {live && <span className="mr-1.5 inline-flex h-2 w-2 animate-pulse rounded-full bg-success" aria-hidden="true" />}
      {status === "completed" ? "Final" : live ? "Live" : status}
    </Badge>
  );
}

export function TeamChip({
  name,
  logoUrl,
  color,
  className,
}: {
  name: string;
  logoUrl?: string | null;
  color?: string | null;
  className?: string;
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      {logoUrl ? (
        <img src={logoUrl} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-border" />
      ) : (
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-background"
          style={{ backgroundColor: color || "var(--primary)" }}
        >
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <span className="truncate text-sm font-medium">{name}</span>
    </span>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ScoreLine({
  scoreA,
  scoreB,
  final,
  className,
}: {
  scoreA: number | null;
  scoreB: number | null;
  final?: boolean;
  className?: string;
}) {
  const has = scoreA != null && scoreB != null;
  const tone = (mine: number | null, other: number | null) => {
    if (!has || !final || mine == null || other == null || mine === other) return "text-foreground";
    return mine > other ? "text-success" : "text-destructive";
  };
  return (
    <span className={cn("font-display text-2xl font-extrabold tabular-nums sm:text-3xl", className)}>
      <span className={tone(scoreA, scoreB)}>{scoreA ?? "–"}</span>
      <span className="mx-1.5 text-muted-foreground">:</span>
      <span className={tone(scoreB, scoreA)}>{scoreB ?? "–"}</span>
    </span>
  );
}
