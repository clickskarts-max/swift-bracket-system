# Plan: Smart AI Ad Display / Auto Placement Engine

Extend the Smart Advertising system with a deterministic "AI" placement engine that automatically identifies safe regions for ads.

## User Review Required

> [!IMPORTANT]
> The auto-placement engine uses deterministic layout rules (space, context, density) to simulate "AI-smart" decisions without the latency or cost of an external LLM for every page load.

- **Manual Priority**: Manually placed slots in the code will always take precedence.
- **Privacy First**: Tracking continues to use `IntersectionObserver` (1s visibility rule).

## Proposed Changes

### Database & Types
#### [Supabase] New Migration
- Create `ad_settings` table to store global auto-placement toggles, intensity (Low/Balanced/High), and per-page overrides.
- Add `allow_auto_placement` boolean to `ad_campaigns` table.
- Seed default settings for the organization.

#### `src/lib/ads.functions.ts`
- Add `useAdSettings` and `useUpdateAdSettings` hooks.
- Update `AdCampaign` type and `useActiveAds` to filter by `allow_auto_placement`.

### Engine Logic
#### `src/lib/ads-engine.ts` (New)
- Implement `SmartPlacementEngine` class.
- Methods for:
  - `evaluateRegion(context, size, existingAds)`: Returns a safety score.
  - `getDensityLimit(intensity, pageHeight)`: Determines max auto-ads allowed.
  - `findCompatibleCreative(campaigns, containerSize)`: Logic moved from component for reuse.

#### `src/components/ads/auto-ad-region.tsx` (New)
- Reusable wrapper for "safe" areas in the DOM.
- Communicates with the engine to decide whether to render a `SmartAdSlot`.

### UI Components
#### `src/routes/_authenticated/advertising.tsx`
- Add a new "Settings" tab.
- Implement toggles for "Enable Smart Auto Placement" and "Auto Placement Intensity".
- Add per-page switches (Homepage, Fixtures, Standings, etc.).

#### `src/components/ads/smart-ad-slot.tsx`
- Refactor to support a `isAuto` flag.
- Add debugging overlay for administrators (visible only if `?ad_debug=true`).

### Implementation on Public Pages
- **Fixtures**: Wrap round groups in `AutoAdRegion`.
- **Standings**: Place `AutoAdRegion` after the table.
- **Knockout**: Ensure regions are strictly outside the bracket container.
- **Homepage**: Add regions between major sections (Workflow -> Formats, Pool Draw -> Features).

## Verification Plan

### Manual Verification
- Toggle "Smart Auto Placement" OFF in admin and verify all auto-ads disappear from public pages.
- Change intensity to "Low" and verify only 1 auto-ad appears on long fixture pages.
- Check "Manual Priority": Add a manual ad slot and verify the auto-engine skips that area.
- Verify "Protected Zones": Ensure no ads appear inside the interactive Pool Draw wheel or knockout bracket.

### Automated Tests
- Run `vitest` on `ads-engine.ts` logic to verify scoring math and density limits.
