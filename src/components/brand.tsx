import { cn } from "@/lib/utils";
import ecluidIcon from "@/assets/brand/ecluid-icon.png";
import ecluidLogoWhite from "@/assets/brand/ecluid-logo-white.png";
import ecluidLogoNavy from "@/assets/brand/ecluid-logo-navy.png";
import { useBranding } from "@/hooks/use-branding";

export function BrandMark({ className }: { className?: string }) {
  const { data: org } = useBranding();

  if (org?.logo_url) {
    return (
      <img
        src={org.logo_url}
        alt={org.name}
        className={cn("h-9 w-auto shrink-0 object-contain", className)}
      />
    );
  }

  return <img src={ecluidIcon} alt="Ecluid" className={cn("h-9 w-auto shrink-0", className)} />;
}

export function BrandWordmark({ compact = false }: { compact?: boolean }) {
  const { data: org } = useBranding();

  if (compact) {
    return <BrandMark />;
  }

  if (org) {
    const displayName = org.brand_name || org.name;
    const logoUrl = org.logo_url;
    const logoDarkUrl = org.logo_dark_url || logoUrl;

    return (
      <span className="flex items-center gap-2.5">
        {logoUrl ? (
          <>
            <img
              src={logoDarkUrl || logoUrl}
              alt={displayName}
              className="h-7 w-auto shrink-0 object-contain light:hidden"
            />
            <img
              src={logoUrl}
              alt={displayName}
              className="hidden h-7 w-auto shrink-0 object-contain light:block"
            />
          </>
        ) : (
          <span className="font-display text-xl font-bold tracking-tight uppercase text-primary">
            {displayName}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2.5">
      <img src={ecluidLogoWhite} alt="Ecluid" className="h-7 w-auto shrink-0 light:hidden" />
      <img src={ecluidLogoNavy} alt="Ecluid" className="hidden h-7 w-auto shrink-0 light:block" />
    </span>
  );
}
