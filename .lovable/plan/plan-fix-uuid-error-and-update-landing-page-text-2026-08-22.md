# Plan: Fix UUID Error and Update Landing Page Text

The application is encountering a database error because placeholder team IDs (e.g., `__winner_A__`) are being sent to a UUID-type column in Supabase. I will update the match generation logic to ensure only valid UUIDs are stored in the database ID columns, while using placeholder columns for non-determined teams.

## Technical Details

### 1. Fix UUID Validation in Match Generation
- Update `src/lib/formats.ts` to include a UUID validation helper.
- Modify the `mk` (match maker) function to verify if a team ID is a valid UUID before assigning it to `team_a_id` or `team_b_id`.
- If the ID is not a valid UUID (e.g., `__winner_A__`), it will be moved to the `placeholder_a` or `placeholder_b` column, and the ID column will be set to `null`.

### 2. Verification
- Verify that `groupKnockout` and `singleElimination` functions correctly handle these placeholders.
- The database should no longer throw "invalid input syntax for type uuid" when creating tournaments with knockout stages.

### 3. Visual Text Edit
- Ensure the hero comment in `src/routes/index.tsx` exactly matches the requested verbatim text.

---
**Note:** I will also perform a quick check of the landing page text to ensure it matches the user's latest request exactly.
