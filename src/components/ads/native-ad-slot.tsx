import { useEffect, useMemo, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { useAdSettings, useRecordAdEvent, useTournamentInventory } from "@/lib/ads.functions";
import type { AdCreative, ServedCampaign } from "@/lib/ads.functions";
import { cn } from "@/lib/utils";

interface NativeAdSlotProps {
  tournamentId?: string | undefined;
  className?: string | undefined;
}

const isSafeUrl = (url: string | null | undefined) => !!url && /^https:\/\//i.test(url);

/**
 * Native "Sponsored" card designed to sit between major sections.
 * Always disclosed, never injected inside fixtures, standings, brackets or draws.
 */
export function NativeAdSlot({ tournamentId, className }: NativeAdSlotProps) {
  const { data: settings } = useAdSettings();
  const { data: map } = useTournamentInventory(tournamentId);
  const record = useRecordAdEvent();
  const ref = useRef<HTMLDivElement>(null);
  const recorded = useRef(false);

  const served = useMemo(() => {
    const campaigns = map?.["native-card"] ?? [];
    for (const c of campaigns) {
      const creative = c.ad_creatives?.find(
        (cr) => cr.creative_role === "native" && cr.status !== "disabled",
      );
      if (creative) return { campaign: c as ServedCampaign, creative: creative as AdCreative };
    }
    return null;
  }, [map]);

  const enabled =
    !!served && settings?.public_ads_enabled !== false && settings?.native_ads_enabled !== false;

  useEffect(() => {
    if (!enabled || !served || recorded.current || !ref.current) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.5) {
          timer = setTimeout(() => {
            if (recorded.current) return;
            recorded.current = true;
            record.mutate({
              campaign_id: served.campaign.id,
              creative_id: served.creative.id,
              tournament_id: tournamentId || null,
              type: "impression",
              page: window.location.pathname,
              ...({ inventory_key: "native-card" } as Record<string, unknown>),
            });
          }, 1000);
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, served?.creative.id]);

  if (!enabled || !served) return null;

  const { campaign, creative } = served;
  const href = isSafeUrl(creative.destination_url) ? creative.destination_url! : null;

  const onClick = () => {
    record.mutate({
      campaign_id: campaign.id,
      creative_id: creative.id,
      tournament_id: tournamentId || null,
      type: "click",
      page: window.location.pathname,
      ...({ inventory_key: "native-card" } as Record<string, unknown>),
    });
  };

  const body = (
    <div className="flex items-center gap-4 p-4 sm:p-5">
      {creative.media_url && (
        <img
          src={creative.media_url}
          alt={creative.alt_text || creative.sponsor_name || creative.name}
          loading="lazy"
          className="h-14 w-14 shrink-0 rounded-lg object-contain sm:h-16 sm:w-16"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded bg-secondary/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Sponsored
          </span>
          {creative.sponsor_name && (
            <span className="truncate text-[11px] text-muted-foreground">
              {creative.sponsor_name}
            </span>
          )}
        </div>
        <p className="mt-1.5 truncate font-display text-base font-semibold">
          {creative.headline || creative.name}
        </p>
        {creative.body_text && (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{creative.body_text}</p>
        )}
      </div>
      {href && (
        <span className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium sm:inline-flex">
          {creative.cta_label || "Learn more"} <ArrowRight className="h-3.5 w-3.5" />
        </span>
      )}
    </div>
  );

  return (
    <div ref={ref} className={cn("surface-card overflow-hidden", className)}>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
          onClick={onClick}
          className="block transition-colors hover:bg-secondary/20"
        >
          {body}
        </a>
      ) : (
        body
      )}
    </div>
  );
}
