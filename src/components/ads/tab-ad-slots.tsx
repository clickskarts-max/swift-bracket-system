/**
 * Rule-driven ad rendering for the public tournament tabs.
 *
 * Everything here reads the owner's backend placement rules
 * (ad_settings.slot_rules) so nothing is hardcoded on the page.
 */
import { createContext, useContext, useMemo, useRef } from "react";
import { usePublicAdSettings } from "@/lib/ads.functions";
import {
  PUBLIC_TABS,
  resolveTabRule,
  inlineSlotIndexes,
  type PublicTabKey,
  type SlotRules,
  type TabPlacementRule,
} from "@/lib/ad-placement-rules";
import { SmartAdSlot } from "./smart-ad-slot";
import { NativeAdSlot } from "./native-ad-slot";
import { SponsorSlot } from "./sponsor-slot";

interface Ctx {
  rules: SlotRules;
  publicAdsEnabled: boolean;
}

const PlacementCtx = createContext<Ctx>({ rules: {}, publicAdsEnabled: true });

export function PlacementRulesProvider({
  ownerId,
  children,
}: {
  ownerId?: string | undefined;
  children: React.ReactNode;
}) {
  const { data: settings } = usePublicAdSettings(ownerId);
  const value = useMemo<Ctx>(
    () => ({
      rules: (settings?.slot_rules ?? {}) as SlotRules,
      publicAdsEnabled: settings?.public_ads_enabled !== false,
    }),
    [settings],
  );
  return <PlacementCtx.Provider value={value}>{children}</PlacementCtx.Provider>;
}

export function useTabRule(tab: PublicTabKey): TabPlacementRule & { active: boolean } {
  const { rules, publicAdsEnabled } = useContext(PlacementCtx);
  const rule = resolveTabRule(rules, tab);
  return { ...rule, active: publicAdsEnabled && rule.enabled };
}

/** Tracks how many units a tab has already rendered so `max` is respected. */
function useBudget(tab: PublicTabKey, rule: TabPlacementRule & { active: boolean }) {
  const used = useRef<Record<string, number>>({});
  return {
    take(id: string) {
      if (!rule.active) return false;
      const total = Object.values(used.current).reduce((a, b) => a + b, 0);
      if (used.current[id]) return true;
      if (total >= rule.max) return false;
      used.current[id] = 1;
      return true;
    },
    tab,
  };
}

const sponsorInventoryFor = (tab: PublicTabKey) =>
  PUBLIC_TABS.find((t) => t.key === tab)?.sponsorInventory ?? "fixtures-sponsor";

/**
 * Renders the top/bottom units + optional native card + sponsor strip for a tab,
 * strictly following the backend rules.
 */
export function TabAdBlock({
  tab,
  position,
  tournamentId,
  title,
  className,
}: {
  tab: PublicTabKey;
  position: "top" | "bottom";
  tournamentId?: string | undefined;
  title?: string | undefined;
  className?: string | undefined;
}) {
  const rule = useTabRule(tab);
  const show = position === "top" ? rule.top : rule.bottom;
  const showSponsor = position === "top" && rule.sponsor;
  const showNative = rule.native && position === (rule.top ? "bottom" : "top");

  if (!rule.active) return null;
  if (!show && !showSponsor && !showNative) return null;

  return (
    <div className={className}>
      {showSponsor && (
        <SponsorSlot
          inventory={sponsorInventoryFor(tab)}
          tournamentId={tournamentId}
          title={title}
          className="mb-4"
        />
      )}
      {show && rule.max > 0 && (
        <SmartAdSlot
          placement={position === "top" ? "tournament-header" : "footer-banner"}
          tournamentId={tournamentId}
          className="w-full"
        />
      )}
      {showNative && rule.max > 1 && (
        <NativeAdSlot tournamentId={tournamentId} className="mt-4" />
      )}
    </div>
  );
}

/**
 * Wraps a list and injects inline units at the configured interval,
 * capped by the tab's max (top/bottom units already consume budget).
 */
export function useInlineAdSlots(tab: PublicTabKey, itemCount: number) {
  const rule = useTabRule(tab);
  const reserved = (rule.top ? 1 : 0) + (rule.bottom ? 1 : 0) + (rule.native ? 1 : 0);
  const budget = Math.max(0, rule.max - reserved);
  const indexes = useMemo(
    () => new Set(inlineSlotIndexes(rule, itemCount, rule.active ? budget : 0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rule.active, rule.inline, rule.interval, rule.max, itemCount, budget],
  );
  return indexes;
}

export function InlineAd({
  tournamentId,
  className,
}: {
  tournamentId?: string | undefined;
  className?: string | undefined;
}) {
  return (
    <SmartAdSlot placement="tournament-content" tournamentId={tournamentId} className={className} />
  );
}

export { useBudget };
