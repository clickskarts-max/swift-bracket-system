# Homepage Refinement & Premium SaaS Redesign

This plan focuses on transforming the Ecluid Basketball homepage from a "premium editorial" (Aston-inspired) look into a "professionally designed SaaS product" look, following the new brand guidelines: agency-level visual discipline, refined typography scale, strict grid alignment, and absolutely no italics.

## User Review Required

> [!IMPORTANT]
> - The new font will be **Plus Jakarta Sans** (as requested in the "Inter, Geist, Manrope, Plus Jakarta Sans" list).
> - All italics will be removed.
> - Hero headline reduced to `56px` (down from `120px`).
> - Spacing will be tightened across the board (80-110px vertical padding).

## Proposed Changes

### 1. Typography & Global Styles (`src/styles.css`)
- Update `--font-display` and `--font-sans` to "Plus Jakarta Sans".
- Remove `italic` and `letter-spacing` rules that contribute to the "editorial" look.
- Add a refined typography scale utility system if needed, or simply adjust standard Tailwind classes.

### 2. Layout & Spacing
- Adjust section vertical padding from `py-32` (~128px) to a more compact `py-20` to `py-24` (~80-96px).
- Refine container max-widths and horizontal padding.

### 3. Hero Section (`src/components/landing/hero.tsx`)
- Reduce headline size from `text-[120px]` to `text-5xl md:text-6xl`.
- Update copy: "BASKETBALL COMPETITION MANAGEMENT" (eyebrow), "Run Every Competition From One Command Center" (headline), and new supporting copy.
- Remove italics.
- Refine the product UI visual from a placeholder to a more polished composition.

### 4. Navigation (`src/components/landing/navbar.tsx`)
- Reduce navbar height and simplify links.
- Update links: Platform, Formats, Pool Draw, Branding.
- Standardize buttons to `40-46px` height.

### 5. Content Sections (`src/components/landing/sections.tsx`, `src/components/landing/formats.tsx`)
- **Features**: Update to "One Platform. Every Stage of Competition." and add the 8 new feature cards with concise copy.
- **Formats**: Rename to "Built Around the Formats You Run" and focus on "League" and "Group Stage + Knockout".
- **Workflow**: Redesign as a sophisticated timeline (horizontal on desktop).
- **Pool Draw**: Enhance with the requested eyebrow, heading, and feature points.
- **Branding**: Update to "Your Competition. Your Identity."
- **Reliability**: Rename to "Built for Match Day" with 3 concise cards.

### 6. Assembly & Footer (`src/routes/index.tsx`)
- Update the final CTA: "Your Next Tournament Starts Here."
- Update footer layout and navigation groups as requested.
- Remove the marquee if it feels too "marketing" and not "SaaS" enough (or refine it).

## Technical Details
- Using Tailwind CSS v4.
- All icons from `lucide-react`.
- Motion using `framer-motion` (restrained usage).
- Font loading via `@import` in `src/routes/__root.tsx`.
