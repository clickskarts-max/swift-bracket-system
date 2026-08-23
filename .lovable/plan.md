# Complete Homepage Redesign — Aston-Inspired Premium Design

Completely replace the existing homepage with a premium, editorial design inspired by the "Aston" template. The goal is to move away from generic SaaS layouts and create a visually distinctive, high-end sports technology brand presence.

## User Review Required

> [!IMPORTANT]
> This is a fundamental visual transformation. The current section structure, feature cards, and generic SaaS aesthetic will be completely removed and replaced with an art-directed editorial layout.

## Proposed Changes

### 1. Typography & Branding
- **Display Font:** Enlarge and refine `Space Grotesk` usage for dramatic, oversized editorial headlines.
- **Body Font:** Use `DM Sans` for sophisticated UI and descriptions with generous letter spacing.
- **Identity:** Reinforce "Ecluid Basketball" as a professional tournament standard with minimal brand marks.

### 2. Editorial Hero Section
- Replace the current hero with a large-scale typographic composition.
- **Headline:** "TOURNAMENTS, WITHOUT THE CHAOS." (dramatic, italic, uppercase).
- **CTA:** Single high-contrast primary button ("CREATE TOURNAMENT") and a subtle secondary link.
- **Visual:** A highly polished "product artwork" showing a sophisticated tournament interface (Standings, Brackets, Live Scores) instead of a generic mockup.

### 3. Layout Architecture
- **Remove:** All 3-column feature grids and repeated icon/heading/paragraph cards.
- **New Structure:**
    - **Capability Strip:** A minimal, high-contrast ticker of key capabilities.
    - **Editorial Features:** Large, full-width sections storytelling the product stages (01 BUILD, 02 RUN, 03 ADVANCE) with oversized imagery.
    - **Bracket Showcase:** A visually impressive championship bracket used as a defining design element.
    - **Live Moment:** A high-end representation of real-time match data.

### 4. Visual Language & Motion
- **Surfaces:** Use high-contrast editorial transitions (e.g., White -> Dark Court -> Light).
- **Spacing:** Implement "dramatic whitespace" to create a premium feel.
- **Motion:** Coordinate entrance animations using the Transitions.dev system (purposeful, subtle eases).

## Technical Details

- **Components:** Create new scoped components for the redesigned sections in `src/components/landing/`.
- **Styles:** Update `src/styles.css` with refined typographic scales and editorial layout utilities.
- **Multi-tenancy:** Ensure `useBranding` tokens (colors, logo) still inject correctly into the new design.
- **Performance:** Maintain low LCP by optimizing product visual compositions and using pure CSS/Framer Motion efficiently.
- **Accessibility:** Ensure `prefers-reduced-motion` resets all new large-scale transforms.
