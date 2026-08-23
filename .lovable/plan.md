# Plan — Homepage Interface Previews & Real Data Integration

Upgrade the homepage interface previews (League, Group Stage + Knockout, Pool Draw) with polished miniature UI representing the real application, powered by real data from a showcase tournament.

## 1. Showcase Data Layer

Define a deterministic "Showcase Tournament" and a sanitized data layer to safely provide public preview data without violating RLS.

- **Primary Source**: "U-19 Girls Basketball League 2083" (`b524ae7e-553a-4125-bf6e-c50c46b8c1ba`).
- **Sanitized Hook**: Add `useShowcaseTournament` to `src/lib/queries.ts` to fetch this tournament and its teams/matches using public columns.

## 2. Miniature UI Components

Create small-scale versions of real app components specifically for the homepage cards.

- **Mini Standings**: Compact version of `StandingsTable` for the League card.
  - Sidebar/Header/Table structure.
  - Columns: Pos, Team, P, W, L, Pts.
- **Mini Bracket/Groups**: Multi-tab miniature for the Group Stage + Knockout card.
  - Tab 1: Group list with real team assignments.
  - Tab 2: Compact knockout bracket using deterministic qualifiers.
- **Interactive Pool Draw**: Functional miniature wheel for the Pool Draw section.
  - Real circular SVG wheel with showcase team names.
  - Polished rotation animation (2.5–4s) with deceleration.
  - Local state for demo spins (never writes to DB).
  - Auto-spin on first visibility.

## 3. Implementation Steps

1. **Query Update**:
   - Update `src/lib/queries.ts` with `useShowcaseTournament`.
2. **Component Refactoring**:
   - Modify `src/components/landing/formats.tsx` to replace `STANDINGS UI` and `BRACKET UI` placeholders with real miniature components.
   - Modify `src/components/landing/sections.tsx` to replace `INTERACTIVE DRAW` illustration with a functional `LandingPoolDraw` wheel.
3. **Motion Integration**:
   - Apply `ease-transitions` and Transitions.dev timing to all homepage preview interactions.

## Technical Details

- **Showcase ID**: `b524ae7e-553a-4125-bf6e-c50c46b8c1ba`.
- **Component Paths**:
  - `src/components/landing/mini-standings.tsx` (New)
  - `src/components/landing/mini-bracket.tsx` (New)
  - `src/components/landing/mini-pool-draw.tsx` (New)
- **RLS Safety**: Previews will only use columns granted to the `anon` role (via `usePublicTeams`, etc.).
- **Wheel Animation**: CSS `transition` or Framer Motion for rotation with `cubic-bezier(0.12, 0, 0.39, 0)`.
