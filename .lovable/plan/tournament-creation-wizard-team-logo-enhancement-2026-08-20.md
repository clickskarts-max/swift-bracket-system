# Tournament Creation Wizard & Team Logo Enhancement

Implement a multi-step tournament creation wizard with detailed team management, including logo uploads and group assignments, while removing legacy XML import functionality.

## Proposed Changes

### 1. Tournament Creation Wizard (`src/components/tournament-form.tsx`)
- Refactor the flat form into a 4-step wizard:
  - **Step 1: Basics & Format** (Tournament name, format, team/group counts).
  - **Step 2: Team Details** (Logo upload, name, group assignment).
  - **Step 3: Schedule & Venue** (Dates, location).
  - **Step 4: Branding & Finishing** (Banner, description, public toggle).
- Add `step` state to manage the current view.
- Implement "Back" and "Next" navigation with step-specific validation.

### 2. Team Detail Entry (Step 2)
- Render a list of team rows based on `team_count`.
- Each row includes:
  - **Logo Upload**: Integrated `ImageUpload` for team logos.
  - **Team Name**: Editable text field (defaults to "Team N").
  - **Group Selection**: Dropdown constrained by the number of groups defined in Step 1.
- Implement Group Capacity Validation: Ensure manual assignments don't exceed `teams_per_group`.
- Team Name Validation: Ensure uniqueness and non-empty values.

### 3. Logo Upload Feature
- Support PNG, JPG, JPEG, and WebP (max 5MB).
- Use Supabase `media` storage bucket.
- Store logos under `tournament-team-logos/{uid}/{tournament_id}/{temp_team_id}/`.
- Ensure logos are displayed using `object-fit: contain` to preserve aspect ratio.

### 4. Cleanup
- Remove any reference to XML import functionality or helper text.
- Consolidate tournament formats to only "League" and "Group stage + knockout".

### 5. Backend Integration (`src/routes/_authenticated/tournaments.new.tsx`)
- Update the submission logic to handle both the tournament creation and the bulk insertion of teams with their uploaded logos and assigned groups in a single transaction or sequence.

## Technical Details
- **State Management**: Use `useState` in `TournamentForm` to track all 4 steps' data until final submission.
- **Validation**: Combine Zod validation with custom group capacity checks.
- **UI/UX**: Use a compact desktop layout (`Logo | Name | Group`) and a responsive mobile stack.
- **Async Handling**: Handle logo uploads as they occur, but only persist team associations upon final tournament save.
