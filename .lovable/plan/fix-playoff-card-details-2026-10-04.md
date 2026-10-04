# Fix playoff card details

## Changes
- Show each playoff game's scheduled date and local time on every bracket card in both internal and public pages.
- Keep the live countdown for upcoming games, while completed games retain their date and time.
- Always show the individual game label for multi-game rounds.
- Render a separate, prominent “If necessary” tag when the stored game name marks a conditional game, accepting both “if needed” and “if necessary”.

## Verification
- Check the shared bracket component used by both tournament views.
- Run the TypeScript check and confirm the preview build succeeds.
