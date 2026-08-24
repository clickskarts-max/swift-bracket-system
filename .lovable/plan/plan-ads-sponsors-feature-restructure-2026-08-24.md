# Plan: Ads & Sponsors Feature Restructure

This plan refactors the Advertising system to be campaign-centric, adds support for new creative types (HTML, AdSense), and improves the creative management UX with size detection and visual presets.

## Proposed Changes

### 1. Database & Types (`src/lib/ads.functions.ts`)
- Update `AdCreative` type to include:
    - `provider_type`: 'direct', 'adsense', 'custom_provider'
    - `provider_config`: JSON for AdSense IDs, etc.
    - `html_content`: Raw HTML/CSS
    - `is_responsive`: boolean
    - `size_preset`: e.g., '728x90', '300x250'
    - `aspect_ratio`, `min_width`, `max_width`
- Ensure all creatives are linked to a campaign.

### 2. UI Restructure (`src/routes/_authenticated/advertising.tsx`)
- **Main Dashboard**: 
    - Remove top-level "Add Creative" button.
    - Change "Creatives" tab to a global library view.
- **Campaign Detail**:
    - Implement a detailed view (Drawer or Dialog) for campaigns with tabs: Overview, Creatives, Placements, Performance, Settings.
    - Move "Add Creative" inside the Campaign context.

### 3. Advanced Creative Flow
- **Step 1: Source Selection**: Choose between Image Upload, HTML, or AdSense.
- **Step 2: Size Selection**: Visual preset picker (Leaderboard, Rectangle, Mobile) with a "Auto Detect" option.
- **Step 3: Asset/Config**: 
    - Upload with auto-dimension detection.
    - HTML editor for custom ads.
    - Structured fields for AdSense (Client ID, Slot ID).
- **Validation**: Check for size mismatches and missing formats (Smart Creative Coverage).

### 4. Ad Rendering Engine (`src/components/ads/smart-ad-slot.tsx`)
- Support rendering HTML ads in a sandboxed iframe.
- Support AdSense responsive units.
- Implement priority logic: Direct Campaign > AdSense Fallback.

## Technical Details
- **Migration**: Added columns to `ad_creatives` for provider data and size metadata.
- **Sandboxing**: HTML ads will use `iframe` with `sandbox` attribute to prevent script access to the main application.
- **Asset Detection**: Client-side image dimension detection during upload.

## Security
- Revoke direct script execution for HTML ads where possible, or use highly restrictive sandboxing.
- Prevent AdSense click interception to comply with provider policies.
