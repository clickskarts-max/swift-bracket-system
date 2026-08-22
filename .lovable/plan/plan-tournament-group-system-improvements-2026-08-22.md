# Plan - Tournament Group System Improvements

Implement a more robust and fair group allocation system for "league-cum-knockout" tournaments, focusing on power-of-two group counts and randomized uneven team distribution as per `instrucoes-18.md`.

## User Review Required

> [!IMPORTANT]
> - Group counts will now be strictly limited to powers of two (2, 4, 8, 16...) for this format.
> - The "Pool Draw" will now have a short "Phase 1" to determine group capacities before drawing teams.

## Proposed Changes

### Logic & Core Functions
#### `src/lib/formats.ts`
- Add utility to calculate randomized capacity distribution.
- Ensure `generateSchedule` respects the persistent randomized capacities.
- Update `groupKnockout` to handle variable qualifiers if necessary (currently fixed at 2 for this project).

### Tournament Creation Wizard
#### `src/components/tournament-form.tsx`
- **Step 1:** Enforce power-of-two group counts for the "league-cum-knockout" format.
- **Step 1:** Update the "Group Distribution" preview to show counts (e.g., "6 groups of 4, 2 groups of 3") without implying alphabetical assignment.
- **Shuffle Logic:** Update to first randomize capacity allocation, then distribute teams, respecting locked assignments.

### Pool Draw Interactive UI
#### `src/components/pool-draw.tsx`
- **Phase 1:** Add a quick animation ("Determining group capacities...") that shuffles and assigns the required capacities to group labels (A, B, C...).
- **Phase 2:** Update the spin logic to draw teams into the randomized capacities, following the rotating order (A->B->C...) while skipping full groups.
- Ensure the UI clearly shows the capacity of each group (e.g., "Group A 0/4").

### Technical Details
- Use a `capacities` map in `TournamentValues` to persist the randomized allocation once determined.
- Implement unbiased shuffle for the capacity pool.
- Respect `is_locked` teams when calculating capacity constraints (e.g., a group with 4 locked teams cannot be assigned a capacity of 3).

## Visual Edits
- Update hero text in `src/routes/index.tsx` as requested.
