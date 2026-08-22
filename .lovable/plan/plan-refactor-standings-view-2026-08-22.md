# Plan - Refactor Standings View

The user wants to refactor the standings view to avoid repeating the "Point Distribution" and "Legend" sections for every group in a "Group stage + knockout" tournament. It should be shown only once.

## Proposed Changes

### Standings Component

#### [src/components/tabs/standings-tab.tsx]
- Move the `PointDistribution`, `StandingsLegend`, and `TieBreakProcedures` components outside the group mapping loop.
- Refactor the `StandingsTab` component to render group tables sequentially, then render the shared info sections once at the bottom.
- Ensure the layout remains balanced (e.g., using a grid for Distribution and Legend).

### Landing Page

#### [src/routes/index.tsx]
- Apply the requested verbatim text change to the comment block at the top of the file as instructed.

## Verification Plan

### Manual Verification
1. Navigate to a tournament with multiple groups (Group stage + knockout).
2. Go to the "Standings" tab.
3. Verify that each group has its own table, but the Point Distribution and Legend appear only once at the bottom of the page.
4. Verify the landing page hero comment text.
