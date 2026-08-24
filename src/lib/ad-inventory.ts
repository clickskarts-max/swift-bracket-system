/**
 * Ecluid Advertising & Sponsorship Inventory definitions.
 *
 * Single source of truth for every sellable unit: display placements,
 * native cards, tournament sponsorships and smart/fallback delivery.
 */

export type InventoryCategory = "display" | "native" | "sponsorship" | "smart";

/** Creative role required to serve a given inventory item. */
export type CreativeRole = "display" | "sponsor_identity" | "native";

export interface InventoryDef {
  key: string;
  label: string;
  category: InventoryCategory;
  /** Public label used when rendering (e.g. "Presented by"). */
  relationship?: string;
  description: string;
  /** Creative role this inventory serves with. */
  role: CreativeRole;
  /** Only one active campaign may hold this per tournament. */
  exclusive: boolean;
  /** Preferred display sizes (display inventory only). */
  sizes?: string[];
  /** True when the slot only exists inside a tournament context. */
  tournamentScoped: boolean;
  /** May be filled by AdSense / external network when unsold. */
  allowFallback?: boolean;
}

export const INVENTORY: InventoryDef[] = [
  // ---------- Display advertising ----------
  {
    key: "tournament-header",
    label: "Header Banner",
    category: "display",
    description: "Top-of-page banner on tournament and public pages.",
    role: "display",
    exclusive: false,
    sizes: ["970x90", "728x90", "320x100", "320x50"],
    tournamentScoped: false,
    allowFallback: true,
  },
  {
    key: "billboard",
    label: "Billboard",
    category: "display",
    description: "Large high-impact unit below the hero.",
    role: "display",
    exclusive: false,
    sizes: ["970x250"],
    tournamentScoped: false,
    allowFallback: true,
  },
  {
    key: "tournament-content",
    label: "Content Rectangle",
    category: "display",
    description: "In-content rectangle between major content blocks.",
    role: "display",
    exclusive: false,
    sizes: ["336x280", "300x250"],
    tournamentScoped: false,
    allowFallback: true,
  },
  {
    key: "sidebar",
    label: "Sidebar",
    category: "display",
    description: "Desktop sidebar unit — only renders with spare width.",
    role: "display",
    exclusive: false,
    sizes: ["300x600", "300x250", "160x600"],
    tournamentScoped: false,
    allowFallback: true,
  },
  {
    key: "footer-banner",
    label: "Footer Banner",
    category: "display",
    description: "Banner above the site footer.",
    role: "display",
    exclusive: false,
    sizes: ["970x90", "728x90", "320x100", "320x50"],
    tournamentScoped: false,
    allowFallback: true,
  },
  {
    key: "sticky-mobile",
    label: "Sticky Mobile Banner",
    category: "display",
    description: "Dismissible bottom banner, mobile only.",
    role: "display",
    exclusive: false,
    sizes: ["320x50", "320x100"],
    tournamentScoped: false,
    allowFallback: true,
  },

  // ---------- Native ----------
  {
    key: "native-card",
    label: "Native Sponsored Card",
    category: "native",
    relationship: "Sponsored",
    description: "Editorial-style card between major sections. Always labelled Sponsored.",
    role: "native",
    exclusive: false,
    tournamentScoped: false,
  },

  // ---------- Tournament sponsorship ----------
  {
    key: "title-sponsor",
    label: "Title Sponsor",
    category: "sponsorship",
    relationship: "Presented by",
    description: "Headline sponsor shown beside the tournament identity.",
    role: "sponsor_identity",
    exclusive: true,
    tournamentScoped: true,
  },
  {
    key: "presented-by",
    label: "Presented By",
    category: "sponsorship",
    relationship: "Presented by",
    description: "Compact sponsor lockup near the tournament header.",
    role: "sponsor_identity",
    exclusive: true,
    tournamentScoped: true,
  },
  {
    key: "official-partner",
    label: "Official Tournament Partner",
    category: "sponsorship",
    relationship: "Official Partner",
    description: "Appears in the Official Partners strip. Shared inventory.",
    role: "sponsor_identity",
    exclusive: false,
    tournamentScoped: true,
  },
  {
    key: "scoreboard-sponsor",
    label: "Scoreboard Sponsor",
    category: "sponsorship",
    relationship: "Presented by",
    description: "Below the scoreboard container — never over scores.",
    role: "sponsor_identity",
    exclusive: true,
    tournamentScoped: true,
  },
  {
    key: "fixtures-sponsor",
    label: "Fixtures Sponsor",
    category: "sponsorship",
    relationship: "Presented by",
    description: "One treatment above the whole fixtures section.",
    role: "sponsor_identity",
    exclusive: true,
    tournamentScoped: true,
  },
  {
    key: "standings-sponsor",
    label: "Standings Sponsor",
    category: "sponsorship",
    relationship: "Presented by",
    description: "Above the standings table — never inside rows.",
    role: "sponsor_identity",
    exclusive: true,
    tournamentScoped: true,
  },
  {
    key: "bracket-sponsor",
    label: "Championship Bracket Sponsor",
    category: "sponsorship",
    relationship: "Presented by",
    description: "Above the bracket, never between rounds.",
    role: "sponsor_identity",
    exclusive: true,
    tournamentScoped: true,
  },
  {
    key: "pool-draw-sponsor",
    label: "Official Draw Partner",
    category: "sponsorship",
    relationship: "Official Draw Partner",
    description: "Presentation partner for the interactive pool draw.",
    role: "sponsor_identity",
    exclusive: true,
    tournamentScoped: true,
  },
  {
    key: "match-sponsor",
    label: "Match Sponsor",
    category: "sponsorship",
    relationship: "Match presented by",
    description: "Sponsor treatment on match cards. Match-level targeting coming later.",
    role: "sponsor_identity",
    exclusive: false,
    tournamentScoped: true,
  },
  {
    key: "finals-sponsor",
    label: "Finals Sponsor",
    category: "sponsorship",
    relationship: "Presented by",
    description: "Only serves on the identified championship final match.",
    role: "sponsor_identity",
    exclusive: true,
    tournamentScoped: true,
  },
  {
    key: "venue-sponsor",
    label: "Official Venue Partner",
    category: "sponsorship",
    relationship: "Official Venue Partner",
    description: "Reserved for venue-level partnerships.",
    role: "sponsor_identity",
    exclusive: false,
    tournamentScoped: true,
  },
  {
    key: "team-sponsor",
    label: "Team Sponsor",
    category: "sponsorship",
    relationship: "Supported by",
    description: "Shown on public team cards. Team identity stays untouched.",
    role: "sponsor_identity",
    exclusive: false,
    tournamentScoped: true,
  },
  {
    key: "results-sponsor",
    label: "Results Sponsor",
    category: "sponsorship",
    relationship: "Presented by",
    description: "Above the latest results section.",
    role: "sponsor_identity",
    exclusive: true,
    tournamentScoped: true,
  },
  {
    key: "upcoming-sponsor",
    label: "Upcoming Games Sponsor",
    category: "sponsorship",
    relationship: "Presented by",
    description: "Above the upcoming games / fixtures overview.",
    role: "sponsor_identity",
    exclusive: true,
    tournamentScoped: true,
  },

  // ---------- Smart / fallback ----------
  {
    key: "smart-auto",
    label: "Allow Smart Auto Placement",
    category: "smart",
    description: "Let the placement engine serve this campaign in safe auto regions.",
    role: "display",
    exclusive: false,
    tournamentScoped: false,
    allowFallback: true,
  },
  {
    key: "house-ad",
    label: "House Ad (Ecluid)",
    category: "smart",
    description: "Fallback-only inventory used when nothing else is eligible.",
    role: "display",
    exclusive: false,
    tournamentScoped: false,
  },
];

export const INVENTORY_BY_KEY: Record<string, InventoryDef> = Object.fromEntries(
  INVENTORY.map((i) => [i.key, i]),
);

export const CATEGORY_META: Record<
  InventoryCategory,
  { label: string; description: string }
> = {
  display: {
    label: "Display Advertising",
    description: "Traditional banner inventory served through SmartAdSlot.",
  },
  native: {
    label: "Native Advertising",
    description: "Editorial-style sponsored cards, always disclosed.",
  },
  sponsorship: {
    label: "Tournament Sponsorship",
    description: "Premium relationship placements tied to a tournament.",
  },
  smart: {
    label: "Smart Delivery & Fallback",
    description: "Auto placement, fallback and house inventory.",
  },
};

export const inventoryByCategory = (category: InventoryCategory) =>
  INVENTORY.filter((i) => i.category === category);

export interface InventoryPackage {
  key: string;
  label: string;
  description: string;
  items: string[];
}

export const INVENTORY_PACKAGES: InventoryPackage[] = [
  {
    key: "tournament-partner",
    label: "Tournament Partner",
    description: "Presence across the whole tournament experience.",
    items: [
      "presented-by",
      "tournament-header",
      "standings-sponsor",
      "fixtures-sponsor",
      "sticky-mobile",
    ],
  },
  {
    key: "championship-partner",
    label: "Championship Partner",
    description: "Own the knockout and finals moments.",
    items: [
      "bracket-sponsor",
      "finals-sponsor",
      "results-sponsor",
      "tournament-header",
      "sticky-mobile",
    ],
  },
  {
    key: "digital-display",
    label: "Digital Display",
    description: "Pure banner reach with smart delivery.",
    items: ["tournament-header", "tournament-content", "sidebar", "footer-banner", "smart-auto"],
  },
  {
    key: "pool-draw-partner",
    label: "Pool Draw Partner",
    description: "Presenting partner of the interactive draw.",
    items: ["pool-draw-sponsor", "tournament-header", "sticky-mobile", "native-card"],
  },
];

/** Parse "728x90" into numbers. */
export const parseSize = (s: string) => {
  const [w, h] = s.split("x").map(Number);
  return { w: w ?? 0, h: h ?? 0 };
};
