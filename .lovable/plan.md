# Plan - Remove Additional Details Section

The user wants to remove the "Additional Details" section (specifically the tournament description field) from the tournament creation wizard.

## User Review Required

> [!IMPORTANT]
> This will remove the "Description" field from the tournament creation form. Existing tournament descriptions in the database will remain, but users will no longer be able to edit them through this wizard.

## Proposed Changes

### Tournament Wizard

#### [src/components/tournament-form.tsx]
- Remove the "Additional Details" section from Step 1 of the tournament creation wizard (around line 1136-1146).
- The "Description" field will be removed from the UI.

### Landing Page

#### [src/routes/index.tsx]
- Apply the requested verbatim text change to the comment block at the top of the file as instructed.

## Verification Plan

### Automated Tests
- Run `lovable-exec test` to ensure no component regressions.

### Manual Verification
1. Open the "Create Tournament" wizard in the preview.
2. Verify that Step 1 (General Information) no longer contains the "Additional Details" or "Description" section.
3. Check the source code of `src/routes/index.tsx` to confirm the text replacement.
