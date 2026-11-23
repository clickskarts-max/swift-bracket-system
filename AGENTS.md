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
- Individual fixture order changes swap scheduled timestamps atomically with stale-date checks; day shifts keep the selected game's local time, and the movement planner rejects rest and prerequisite conflicts.
- The compact fixture sheet reuses ScheduleTab mutations and its match dialog; alternate views must not introduce separate score or movement write paths.
- Display fixture numbers through a shared chronological map over all active games; preserve stored match numbers so knockout prerequisites and historical references remain intact.
- Derive organizer multi-game-day notices from existing fixture data using the same local calendar as the schedule; count completed games toward days with games still due, exclude non-played results and unresolved participants, and never alter fixtures.
- Balance fixed-window league dates with bounded backtracking and per-team daily appearance tracking; reject infeasible plans rather than repeating a team's double-game day or spilling into knockout days.
- Validate group setup with shared pure helpers and clear cached capacities when team/group totals change, so roster limits agree with the current structure.
- Generate fixture PDFs on demand in the browser from loaded tournament data and shared display numbering; prepare a Blob before a separate download click so downloads keep user activation on mobile without extra data access or fixture writes.
- Keep PDF column selection and blank-value projection in a pure model; export parent tournament context and local-calendar day sections from loaded data so customization never alters fixtures.
- Generate editable Word fixture files with docx using the PDF's shared projection and blank-pool options; prepare files before download to preserve mobile user activation.
