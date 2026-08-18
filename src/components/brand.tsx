import { cn } from "@/lib/utils";
import ecluidIcon from "@/assets/brand/ecluid-icon.png";
import ecluidLogoWhite from "@/assets/brand/ecluid-logo-white.png";
import ecluidLogoNavy from "@/assets/brand/ecluid-logo-navy.png";

export function BrandMark({ className }: { className?: string }) {
  return <img src={ecluidIcon} alt="Ecluid" className={cn("h-9 w-auto shrink-0", className)} />;
}

export function BrandWordmark({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return <BrandMark />;
  }

  return (
    <span className="flex items-center gap-2.5">
      {/* Light-on-dark wordmark: shown when dark theme is active. */}
      <img src={ecluidLogoWhite} alt="Ecluid" className="h-7 w-auto shrink-0 light:hidden" />
      {/* Navy wordmark: shown only when the light theme is active. */}
      <img src={ecluidLogoNavy} alt="Ecluid" className="hidden h-7 w-auto shrink-0 light:block" />
    </span>
  );
}
