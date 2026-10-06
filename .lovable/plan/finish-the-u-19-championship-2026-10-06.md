# Finish the U-19 championship

## Changes
- Preserve the unused third final as cancelled, but remove cancelled games from public and internal playoff/fixture displays.
- Mark U-19 Girls Basketball League 2083 as completed and record Kirtipur Crowns as champion after its 2–0 finals win.
- Add a championship summary to both public and internal tournament pages, showing the champion and that the tournament has ended.
- Verify the database state, bracket, public page, and app build.

## Technical details
- Keep match history intact instead of deleting Game 3.
- Store the champion in the tournament's existing configuration data and derive a safe fallback from completed final results.
- Reuse one championship summary component in both tournament views.
