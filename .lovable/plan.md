# Smart Advertising System Implementation

Build a native Smart Advertising & Sponsorship System ("Ecluid Smart Ads") for the basketball tournament management app. This system will allow admins to manage commercial ads and sponsors while public pages automatically display the best-fit creative for available space.

## User Review Required

> [!IMPORTANT]
> The system requires new database tables and storage buckets for ad creatives. I will implement these using standard Supabase patterns with RLS protection.

## Proposed Changes

### Database Schema (Supabase)
- **Tables**:
    - `ad_campaigns`: Name, advertiser, status, priority, weight, targeting (JSONB), dates.
    - `ad_creatives`: Name, type (image/gif/html), media_url, destination_url, dimensions (width/height), campaign_id.
    - `ad_placements`: Key (e.g., `tournament-header`), label, enabled, allowed_sizes (JSONB).
    - `ad_analytics`: Impressions and clicks logs (campaign_id, creative_id, placement_id, tournament_id, timestamp).
- **Storage**: New bucket `ad-creatives` for media files.

### Admin Dashboard (Existing Dashboard Integration)
- **New Section**: "Advertising" in the main sidebar.
- **Pages**:
    - **Overview**: Dashboard with active campaigns, total impressions/clicks, and CTR.
    - **Campaigns**: CRUD for ad campaigns with multi-step setup.
    - **Creatives**: Media library for ad assets.
    - **Placements**: Management of where ads can appear.
- **Components**: Reusing existing card, table, and form systems.

### Public UI (Smart Ad Engine)
- **SmartAdSlot Component**:
    - Detects container size using `ResizeObserver`.
    - Fetches eligible creatives based on placement, tournament, and device.
    - Deterministic selection based on priority, weight, and best size fit.
    - Aspect-ratio reservation to prevent layout shifts.
    - Graceful collapse if no ad is available.
- **Placement Integration**:
    - Header/Footer of public tournament pages.
    - Between fixtures and standings sections.
    - Selective placement on the homepage.

### Security & Performance
- **Isolation**: HTML creatives rendered in sandboxed iframes.
- **Viewability**: Tracking impressions only when 50% visible for 1s.
- **Lazy Loading**: Ads below the fold load only when approaching the viewport.

## Technical Details
- **Tech Stack**: TanStack Router/Query, Supabase (RLS + Storage), Framer Motion (Transitions.dev system).
- **Hooks**: `useSmartAd(placementKey, tournamentId)` to handle data fetching and selection logic.
- **RLS**: Admins only for management; public read access for active campaign metadata.
