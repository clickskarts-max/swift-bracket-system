# Production Cleanup & Security Audit Plan

Safely optimize the Ecluid Basketball application by removing dead code, consolidating logic, and hardening security while strictly preserving all production data.

## Phase 1: Audit & Inventory
- [ ] Inventory all routes, components, hooks, and utilities.
- [ ] Map database schema, migrations, and RLS policies.
- [ ] Review environment variables and storage bucket configurations.
- [ ] Identify provably unused files (zero references).

## Phase 2: Security Hardening
- [ ] Audit all Supabase tables for RLS coverage.
- [ ] Verify ownership logic (`owner_id` usage) across private data.
- [ ] Secure Storage buckets (logos, uploads) against unauthorized access.
- [ ] Review auth flow (reset password, OAuth) and domain configurations.

## Phase 3: Dead Code & Asset Removal
- [ ] Remove provably unused React components and hooks.
- [ ] Delete zero-reference assets (images, SVGs).
- [ ] Clean up `package.json` by removing unused dependencies.

## Phase 4: Consolidation & Optimization
- [ ] Merge duplicate UI components (cards, tables, buttons).
- [ ] Consolidate business logic (standings, fixture generation) into shared utilities.
- [ ] Remove obsolete tournament format code (Single/Double elimination) while maintaining record compatibility.

## Phase 5: Validation
- [ ] Run `tsc` and production build.
- [ ] Verify core flows: Auth, League creation, Group+Knockout creation.
- [ ] Final security check (console errors, network requests).

## Technical Details
- **Tables involved**: `tournaments`, `teams`, `matches`, `venues`, `activation_keys`, `app_users`, `user_roles`.
- **Logic modules**: `src/lib/formats.ts`, `src/lib/standings.ts`, `src/lib/periods.ts`.
- **Constraint**: No data deletion, no destructive schema changes, no major framework upgrades.
