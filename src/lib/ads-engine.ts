import { AdCampaign, AdCreative, AdSettings } from "./ads.functions";

export type AdPageContext =
  | "homepage"
  | "tournament_overview"
  | "fixtures"
  | "standings"
  | "teams"
  | "knockout"
  | "pool_draw";

export interface AdRegionScore {
  score: number;
  reasons: string[];
}

export class SmartPlacementEngine {
  /**
   * Evaluates a potential ad region and returns a suitability score.
   */
  static evaluateRegion(
    context: AdPageContext,
    containerWidth: number,
    settings: AdSettings,
    renderedAdsCount: number,
    pageHeight: number,
    isMobile: boolean,
  ): AdRegionScore {
    const reasons: string[] = [];
    let score = 50; // Base score

    // 1. Check global and page-specific toggles
    if (!settings.auto_placement_enabled)
      return { score: 0, reasons: ["Auto-placement globally disabled"] };
    if (!settings.page_rules[context])
      return { score: 0, reasons: [`Auto-placement disabled for ${context}`] };

    // 2. Density Check
    const maxAds = this.getDensityLimit(settings.auto_placement_intensity, pageHeight, isMobile);
    if (renderedAdsCount >= maxAds) {
      return { score: 0, reasons: [`Ad density limit reached (${maxAds})`] };
    }

    // 3. Page Context Scoring
    const contextScores: Record<AdPageContext, number> = {
      homepage: 40,
      tournament_overview: 60,
      fixtures: 80,
      standings: 50,
      teams: 40,
      knockout: 30,
      pool_draw: 10,
    };
    score += contextScores[context] || 0;
    reasons.push(`Context score for ${context}: ${contextScores[context]}`);

    // 4. Width Check
    if (containerWidth < 300) {
      score -= 50;
      reasons.push("Container too narrow");
    } else if (containerWidth >= 728) {
      score += 20;
      reasons.push("Leaderboard compatible width");
    }

    // 5. Mobile Penalty
    if (isMobile) {
      score -= 20;
      reasons.push("Mobile density reduction");
    }

    // 6. Proximity Penalty (simulated)
    if (renderedAdsCount > 0) {
      score -= renderedAdsCount * 15;
      reasons.push(`Proximity penalty for ${renderedAdsCount} existing ads`);
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  /**
   * Determines the maximum number of auto-ads allowed based on intensity.
   */
  static getDensityLimit(
    intensity: AdSettings["auto_placement_intensity"],
    pageHeight: number,
    isMobile: boolean,
  ): number {
    const baseLimit = intensity === "high" ? 4 : intensity === "low" ? 1 : 2;

    // Scale by page height (approximate)
    const heightFactor = Math.max(1, Math.floor(pageHeight / 1500));
    let limit = baseLimit * heightFactor;

    if (isMobile) {
      limit = Math.max(1, Math.floor(limit * 0.6));
    }

    return limit;
  }

  /**
   * Logic to find the best compatible creative from eligible campaigns.
   */
  static findCompatibleCreative(
    campaigns: (AdCampaign & { ad_creatives: AdCreative[] })[],
    containerWidth: number,
  ): AdCreative | null {
    if (!campaigns || campaigns.length === 0) return null;

    // 1. Get all creatives from eligible campaigns
    const allCreatives = campaigns.flatMap((c) =>
      (c.ad_creatives || []).map((creative) => ({
        ...creative,
        priority: c.priority,
        weight: c.weight,
      })),
    );

    // 2. Filter by width compatibility
    const compatible = allCreatives.filter((c) => {
      if (c.status && c.status !== "active") return false;
      if (c.is_responsive || c.size_preset === "responsive") return true;
      if (!c.width) return true; // Fallback for older data
      return c.width <= containerWidth;
    });

    // Never drop an ad just because the container is narrower than the creative:
    // images render with object-contain, so oversized creatives simply scale down.
    const pool =
      compatible.length > 0
        ? compatible
        : [...allCreatives].sort((a, b) => (a.width || 0) - (b.width || 0));

    if (pool.length === 0) return null;

    // 3. Rank by priority
    const priorityMap = { guaranteed: 4, high: 3, normal: 2, low: 1 };
    pool.sort((a, b) => {
      const pA = a.priority as keyof typeof priorityMap;
      const pB = b.priority as keyof typeof priorityMap;
      return (priorityMap[pB] || 0) - (priorityMap[pA] || 0);
    });

    const firstItem = pool[0];
    if (!firstItem) return null;

    const highestPriority = firstItem.priority;
    const topTier = pool.filter((c) => c.priority === highestPriority);

    // 4. Weighted selection within top tier
    const totalWeight = topTier.reduce((sum, c) => sum + (c.weight || 10), 0);
    let random = Math.random() * totalWeight;

    for (const creative of topTier) {
      random -= creative.weight || 10;
      if (random <= 0) return creative as unknown as AdCreative;
    }

    return topTier[0] as unknown as AdCreative;
  }
}
