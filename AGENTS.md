<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- Tournament champions are stored in `tournaments.config.champion_team_id`; cancelled conditional games remain historical records but are excluded from active schedule and bracket displays, preserving history without showing unnecessary fixtures.
- Serialize tournament form collections before database writes: store group capacities in existing config JSON, preserve other config keys, and exclude teams/venues from tournament columns to avoid schema-cache errors.
- Assign generated fixture dates through the pure fixture-timing scheduler; enforce daily phase limits and rest after game end, conservatively including every possible knockout participant before teams are known.
