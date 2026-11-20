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
- Assign generated dates through the pure fixture-timing scheduler; enforce rest after game end and daily or fixed phase windows, reject deadline overflow before writes, and use distinct seed paths plus prerequisite games to protect unknown knockout participants without conflating mutually exclusive seeds.
- Persist fixture settings in tournament config separately from generating matches; merge existing config so applying a plan never replaces fixtures or unrelated tournament configuration.
- Fixed-day fixture previews and generation use the saved explicit daily limits, never calculated replacements, so user-selected capacity and phase deadlines are enforced together.
- Redate existing fixtures through a date-only planner and an atomic permission-checked database operation; never regenerate matchups or alter started, completed, forfeited, or cancelled records.
