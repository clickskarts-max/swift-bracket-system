import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAdSettings } from "@/lib/ads.functions";
import { SmartAdSlot } from "@/components/ads/smart-ad-slot";

const DISMISS_KEY = "ecluid-sticky-ad-dismissed";

/**
 * Optional bottom-of-viewport banner, mobile only, dismissible.
 * Dismissal is remembered for the session (sessionStorage, no tracking).
 */
export function StickyMobileAd({ tournamentId }: { tournamentId?: string | undefined }) {
  const { data: settings } = useAdSettings();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed) return null;
  if (settings?.public_ads_enabled === false) return null;
  if (settings?.sticky_mobile_enabled !== true) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur md:hidden">
      <div className="relative mx-auto flex max-w-md items-center gap-2 px-2 py-1.5">
        <span className="rounded bg-secondary/60 px-1 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
          Ad
        </span>
        <SmartAdSlot placement="sticky-mobile" tournamentId={tournamentId} className="flex-1" />
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss advertisement"
          className="rounded-full p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
