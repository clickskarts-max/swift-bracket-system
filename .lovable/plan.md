# Combined Team Entry and Group Assignment Wizard

Redesign the "Group stage + knockout" tournament creation wizard to merge Team Details and Group Assignment into a single, efficient step with a interactive Pool Draw feature.

## User Review Required

> [!IMPORTANT]
> This change only affects the **Group stage + knockout** format. The **League** format flow remains unchanged.

- **Combined Step 2**: Does a two-column layout (Teams on left, Groups on right) for "Teams & Group Draw" meet your expectations for desktop?
- **Pool Draw**: The interactive spin-the-wheel will open in a modal overlay. Is this preferred over a full-page transition?
- **Manual Locking**: Should teams manually assigned to a group be *automatically* locked from the Shuffle/Pool Draw, or would you like an explicit lock toggle? (Plan defaults to auto-locking manually assigned teams).

## Proposed Changes

### Tournament Wizard (`src/components/tournament-form.tsx`)

#### Structural Updates
- Reduce total steps from 5 to 4 for "Group stage + knockout".
- Rename Step 2 to **Teams & Group Draw**.
- Remove the old separate Group Assignment step.

#### Step 2: Teams & Group Draw
- **Two-column Layout**: 
    - **Left**: Team list in compact rows (# | Logo | Name | Group Selector).
    - **Right**: Group cards showing capacity (e.g., "3 / 4 teams") and a list of assigned team names.
- **Team Entry**: Compact rows instead of cards.
- **Group Selector**: A dropdown in each team row to manually assign a team to a group (A, B, C, etc., based on Step 1 config).
- **Action Bar**: Buttons for **Shuffle**, **Pool Draw**, and **Clear Groups**.

#### Logic & Interactions
- **Shuffle**: Evenly distributes all unassigned/unlocked teams across groups.
- **Clear Groups**: Resets all assignments to "No group" with confirmation.
- **Pool Draw (Modal)**: 
    - A spin-the-wheel animation to assign remaining teams.
    - Rotating assignment (Team 1 -> Group A, Team 2 -> Group B...).
    - "Apply Draw" button to sync results back to the main form.
- **Capacity Enforcement**: Prevent assigning more teams than the "Teams per Group" limit set in Step 1.

### UI Components
- **Compact Team Row**: New sub-component for the team list.
- **Group Summary Card**: Displays which teams are in which group at a glance.
- **SpinWheel**: A canvas or CSS-based animation for the Pool Draw.

## Technical Details

- **State Management**: Use `values.teams` (array of `{ name, logo_url, group_label }`) as the source of truth.
- **Validation**: Ensure all teams have a `group_label` before allowing progression to Step 3.
- **Animations**: Use Framer Motion for the list transitions and wheel spin.
- **Logo Integration**: Reuse existing `ImageUpload` but in a scaled-down, row-friendly format.
