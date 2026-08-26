import { useEffect, useRef, useMemo } from "react";
import { useTournamentInventory, useRecordAdEvent, useAdSettings } from "@/lib/ads.functions";
import type { AdCreative, ServedCampaign } from "@/lib/ads.functions";
import { INVENTORY_BY_KEY } from "@/lib/ad-inventory";
import { cn } from "@/lib/utils";

interface SponsorSlotProps {
  inventory: string;
  tournamentId?: string | undefined;
  /** Section title rendered above the sponsor lockup (e.g. "STANDINGS"). */
  title?: string | undefined;
  className?: string | undefined;
  /** Show every eligible campaign instead of only the top one (partner strips). */
  multiple?: boolean | undefined;
  align?: "left" | "center" | undefined;
}

const isSafeUrl = (url: string | null | undefined) => !!url && /^https:\/\//i.test(url);

const pickSponsorCreative = (c: ServedCampaign): AdCreative | null =>
  c.ad_creatives?.find(
    (cr) => cr.creative_role === "sponsor_identity" && cr.status !== "disabled",
  ) ?? null;

function useViewability(
  ref: React.RefObject<HTMLElement | null>,
  onView: () => void,
  active: boolean,
) {
  const recorded = useRef(false);
  useEffect(() => {
    if (!active || recorded.current || !ref.current) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.5) {
          timer = setTimeout(() => {
            if (recorded.current) return;
            recorded.current = true;
            onView();
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
    // onView is stable enough for this fire-once tracker
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}

function SponsorLockup({
  campaign,
  creative,
  inventoryKey,
  tournamentId,
  relationship,
}: {
  campaign: ServedCampaign;
  creative: AdCreative;
  inventoryKey: string;
  tournamentId?: string | undefined;
  relationship: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const record = useRecordAdEvent();

  useViewability(
    ref,
    () =>
      record.mutate({
        campaign_id: campaign.id,
        creative_id: creative.id,
        tournament_id: tournamentId || null,
        type: "impression",
        page: typeof window !== "undefined" ? window.location.pathname : null,
        ...({ inventory_key: inventoryKey } as Record<string, unknown>),
      }),
    true,
  );

  const label = creative.sponsor_label || relationship;
  const name = creative.sponsor_name || campaign.advertiser || campaign.name;
  const href = isSafeUrl(creative.destination_url) ? creative.destination_url! : null;

  const onClick = () => {
    record.mutate({
      campaign_id: campaign.id,
      creative_id: creative.id,
      tournament_id: tournamentId || null,
      type: "click",
      page: typeof window !== "undefined" ? window.location.pathname : null,
      ...({ inventory_key: inventoryKey } as Record<string, unknown>),
    });
  };

  const visual = creative.media_url ? (
    <img
      src={creative.media_url}
      alt={creative.alt_text || name}
      width={creative.width ?? 120}
      height={creative.height ?? 32}
      loading="lazy"
      className="h-8 w-auto max-w-[160px] object-contain sm:h-9"
    />
  ) : (
    <span className="font-display text-sm font-semibold">{name}</span>
  );

  return (
    <div ref={ref} className="flex items-center gap-2.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
          onClick={onClick}
        >
          {visual}
        </a>
      ) : (
        visual
      )}
    </div>
  );
}

/**
 * Renders a tournament sponsorship treatment. Fails safe: if anything is
 * missing (settings off, no campaign, no sponsor identity creative) it
 * renders nothing and never affects surrounding tournament content.
 */
export function SponsorSlot({
  inventory,
  tournamentId,
  title,
  className,
  multiple = false,
  align = "left",
}: SponsorSlotProps) {
  const def = INVENTORY_BY_KEY[inventory];
  const { data: settings } = useAdSettings();
  const { data: map } = useTournamentInventory(tournamentId);

  const served = useMemo(() => {
    if (!def || !map) return [];
    const campaigns = map[inventory] ?? [];
    const withCreative = campaigns
      .map((c) => ({ campaign: c, creative: pickSponsorCreative(c) }))
      .filter((x): x is { campaign: ServedCampaign; creative: AdCreative } => !!x.creative);
    // Exclusive inventory: only the highest-priority commitment serves.
    return multiple && !def.exclusive ? withCreative : withCreative.slice(0, 1);
  }, [def, map, inventory, multiple]);

  if (!def) return null;
  if (settings && settings.public_ads_enabled === false) return null;
  if (settings && settings.sponsorships_enabled === false) return null;
  if (served.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-2",
        align === "center" ? "justify-center" : "justify-between",
        className,
      )}
    >
      {title && (
        <span className="font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
      )}
      <div className="flex flex-wrap items-center gap-5">
        {served.map(({ campaign, creative }) => (
          <SponsorLockup
            key={campaign.id}
            campaign={campaign}
            creative={creative}
            inventoryKey={inventory}
            tournamentId={tournamentId}
            relationship={def.relationship ?? "Presented by"}
          />
        ))}
      </div>
    </div>
  );
}
