# Group stage + knockout tournament flow improvements

Fix the tournament creation and display logic for "Group stage + knockout" tournaments to ensure groups are correctly assigned, persisted, and displayed as separate standings tables.

## User Review Required

> [!IMPORTANT]
> - Group assignments will now be mandatory before tournament creation in the "Group stage + knockout" format.
> - The standings will now be split by group instead of one global table for this format.

## Proposed Changes

### Tournament Creation flow
- **Step 2 (Team Details)**: 
    - Add a `group_label` selector for each team row.
    - Generate group options (Group A, B, etc.) dynamically based on the number of groups selected in Step 1.
- **Step 4 (Group Assignment)**:
    - Create a new final step for "Group stage + knockout" format.
    - Display teams grouped by their assigned `group_label`.
    - Implement "Pool Draw" (fill remaining spots randomly) and "Shuffle" (re-assign all non-manually-locked teams) functions.
    - Add validation to ensure every team has a group and no group exceeds the calculated capacity (`team_count / group_count`).

### Backend & Persistence
- Update the tournament creation logic in `src/routes/_authenticated/tournaments.new.tsx` to include `group_label` when inserting teams into the database.
- Ensure `src/components/tournament-form.tsx` correctly handles the `group_label` property in the `TeamValue` type.

### Standings UI
- **Standings Tab**:
    - Update `src/components/tabs/standings-tab.tsx` to explicitly filter and group teams by their `group_label` for "Group stage + knockout" tournaments.
    - Ensure separate tables are rendered for each group.
- **Public Page**:
    - Apply the same group-split logic to the public tournament view standings tab.

### Visual Edits
- Verbatim replacement of the hero text instruction in `src/routes/index.tsx`.

## Technical Details
- **Schema**: No schema changes needed as `group_label` already exists on `teams` and `matches` tables.
- **Logic**: Use `String.fromCharCode(65 + i)` for dynamic group labeling (A, B, C...).
- **Validation**: Enforce capacity limits during team selection and before submission.
