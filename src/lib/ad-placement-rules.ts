/**
 * Per-tab public ad placement rules.
 *
 * Owners control, from the backend, exactly which public tournament tabs show
 * ads, where inside the tab they appear, how often inline units repeat and how
 * many units a tab may show in total.
 */

export type PublicTabKey = "overview" | "fixtures" | "results" | "standings" | "bracket" | "teams";

export interface TabPlacementRule {
  /** Master switch for the tab. */
  enabled: boolean;
  /** Banner above the tab content. */
  top: boolean;
  /** Banner below the tab content. */
  bottom: boolean;
  /** Repeating in-content units (list tabs only). */
  inline: boolean;
  /** Show an inline unit after every N items. */
  interval: number;
  /** Maximum ad units rendered on this tab (top + inline + bottom). */
  max: number;
  /** Native sponsored card. */
  native: boolean;
  /** Sponsor identity strip ("Presented by"). */
  sponsor: boolean;
}

export interface TabDef {
  key: PublicTabKey;
  label: string;
  /** Inline units only make sense on list-style tabs. */
  supportsInline: boolean;
  sponsorInventory: string;
}

export const PUBLIC_TABS: TabDef[] = [
  { key: "overview", label: "Overview / header", supportsInline: false, sponsorInventory: "title-sponsor" },
  { key: "fixtures", label: "Fixtures", supportsInline: true, sponsorInventory: "fixtures-sponsor" },
  { key: "results", label: "Results", supportsInline: true, sponsorInventory: "results-sponsor" },
  { key: "standings", label: "Standings", supportsInline: false, sponsorInventory: "standings-sponsor" },
  { key: "bracket", label: "Playoffs", supportsInline: false, sponsorInventory: "bracket-sponsor" },
  { key: "teams", label: "Teams", supportsInline: true, sponsorInventory: "official-partner" },
];

export const DEFAULT_TAB_RULE: TabPlacementRule = {
  enabled: true,
  top: true,
  bottom: false,
  inline: false,
  interval: 4,
  max: 2,
  native: false,
  sponsor: true,
};

const OVERRIDES: Partial<Record<PublicTabKey, Partial<TabPlacementRule>>> = {
  overview: { native: true, max: 2 },
  fixtures: { inline: true, interval: 4, max: 3 },
  results: { inline: true, interval: 5, max: 2 },
  teams: { inline: false, max: 1 },
};

export const defaultRuleFor = (key: PublicTabKey): TabPlacementRule => ({
  ...DEFAULT_TAB_RULE,
  ...(OVERRIDES[key] ?? {}),
});

export type SlotRules = Partial<Record<PublicTabKey, Partial<TabPlacementRule>>>;

/** Merge stored rules over defaults so partial/legacy config still works. */
export const resolveTabRule = (rules: SlotRules | null | undefined, key: PublicTabKey) => ({
  ...defaultRuleFor(key),
  ...((rules?.[key] ?? {}) as Partial<TabPlacementRule>),
});

export const resolveAllRules = (rules: SlotRules | null | undefined) =>
  Object.fromEntries(PUBLIC_TABS.map((t) => [t.key, resolveTabRule(rules, t.key)])) as Record<
    PublicTabKey,
    TabPlacementRule
  >;

/** Indices (0-based) in a list after which an inline ad should render. */
export const inlineSlotIndexes = (rule: TabPlacementRule, itemCount: number, budget: number) => {
  if (!rule.enabled || !rule.inline || budget <= 0) return [] as number[];
  const step = Math.max(1, Math.floor(rule.interval));
  const out: number[] = [];
  for (let i = step - 1; i < itemCount - 1 && out.length < budget; i += step) out.push(i);
  return out;
};
