# Plan - FIBA Points and Standings UI Update

The user wants to update the standings section to clearly show how points are distributed, following the previously implemented FIBA point system (Win=2, Loss=1, Forfeit=0 for League).

## Proposed Changes

### Standings UI
- Update `StandingsLegend` in `src/components/tabs/standings-tab.tsx` to explicitly state the point distribution rules (Win: 2, Loss: 1, Forfeit: 0).
- Update `TieBreakProcedures` in `src/components/tabs/standings-tab.tsx` to include a section about point distribution.
- Ensure the public standings page also reflects these legend updates.

### Code Refinement
- Add a explicit check for `m.status === 'forfeit'` in the standings calculation to ensure the 0-point rule is applied correctly (already partially implemented but will verify).

## Technical Details
- Modify `src/components/tabs/standings-tab.tsx` to update the legend and tie-break display.
- Ensure the `tournament.format` is correctly used to toggle between FIBA points (League) and standard points (Knockout/Group).
