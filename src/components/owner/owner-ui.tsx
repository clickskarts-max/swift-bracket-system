import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Clickable breadcrumb trail: Owner / Section / Detail */
export function OwnerBreadcrumb({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground"
    >
      <Link to="/dashboard" className="shrink-0 hover:text-foreground">
        Owner
      </Link>
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-1">
          <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />
          {item.onClick ? (
            <button type="button" onClick={item.onClick} className="truncate hover:text-foreground">
              {item.label}
            </button>
          ) : (
            <span className="truncate text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function OwnerPageHeader({
  title,
  description,
  action,
  breadcrumb,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  breadcrumb?: ReactNode;
}) {
  return (
    <header className="space-y-3">
      {breadcrumb}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}

/** Horizontally scrollable secondary navigation. */
export function NestedTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <div
        role="tablist"
        className="flex min-w-max items-center gap-1 border-b border-border/60 px-1"
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={value === t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              value === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "warn";
}) {
  return (
    <div className="rounded-xl border border-border/60 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-2xl font-semibold tabular-nums sm:text-3xl",
          tone === "warn" && "text-amber-500",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-500",
  live: "bg-emerald-500/15 text-emerald-500",
  scheduled: "bg-sky-500/15 text-sky-500",
  upcoming: "bg-sky-500/15 text-sky-500",
  draft: "bg-muted text-muted-foreground",
  paused: "bg-amber-500/15 text-amber-500",
  completed: "bg-primary/15 text-primary",
  archived: "bg-muted text-muted-foreground",
  suspended: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  const key = (status || "").toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
        STATUS_TONE[key] ?? "bg-secondary text-muted-foreground",
      )}
    >
      {status || "unknown"}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 p-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary/50" />
      ))}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/60">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{title}</h2>
          {description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function CountBadge({ children }: { children: ReactNode }) {
  return <Badge variant="secondary">{children}</Badge>;
}

export function LinkButton({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link to={to as never}>{children}</Link>
    </Button>
  );
}
