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
  live: "bg-destructive/15 text-destructive border-destructive/40",
  completed: "bg-success/15 text-success border-success/40",
  upcoming: "bg-accent/15 text-accent border-accent/40",
  scheduled: "bg-accent/15 text-accent border-accent/40",
  draft: "bg-muted text-muted-foreground border-border",
  archived: "bg-muted text-muted-foreground border-border",
  postponed: "bg-warning/15 text-warning border-warning/40",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("capitalize", STATUS_STYLES[status] ?? STATUS_STYLES.draft)}>
      {status === "completed" ? "Final" : status}
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
