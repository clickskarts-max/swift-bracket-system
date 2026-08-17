import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary-foreground",
        className,
      )}
      style={{ backgroundImage: "var(--gradient-primary)" }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3v18M5.5 5.5c3.6 3.2 3.6 9.8 0 13M18.5 5.5c-3.6 3.2-3.6 9.8 0 13" />
      </svg>
    </span>
  );
}

export function BrandWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      {!compact && (
        <span className="font-display text-lg font-bold leading-none tracking-tight">
          Ecluid<span className="text-gradient"> Basketball</span>
        </span>
      )}
    </span>
  );
}
