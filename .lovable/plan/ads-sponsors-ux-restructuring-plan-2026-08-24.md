# Ads & Sponsors UX Restructuring Plan

Restructure the Advertising module to follow a campaign-centric workspace model where all related management (creatives, placements, targeting, performance) lives inside a dedicated campaign page.

## Proposed Changes

### 1. Routing & Structure
- **New Workspace Route**: Create `src/routes/_authenticated/advertising.campaign.$id.tsx` to serve as the dedicated campaign management page.
- **Root Advertising Page**: Simplify `src/routes/_authenticated/advertising.tsx` to focus on high-level metrics and a campaigns table.
- **Navigation**: Remove global "Creatives" tab from the top-level view. Creatives will now be managed exclusively within their parent campaigns.

### 2. Campaign Workspace (`advertising.campaign.$id.tsx`)
- **Header**: High-visibility campaign name, advertiser, status, and quick actions (Activate/Pause, Edit).
- **Tabs**:
  - **Overview**: Stats summary + setup readiness checklist (Campaign Details, Creatives, Placements).
  - **Creatives**: Full management for image, HTML, and AdSense units.
  - **Placements**: Campaign-specific placement assignment with compatibility indicators.
  - **Targeting**: Device, Page, and Tournament targeting rules.
  - **Performance**: Deep-dive analytics for the specific campaign.
  - **Settings**: Campaign-level configuration (Priority, Weight, Schedule, Auto-placement).

### 3. User Experience Improvements
- **Auto-Navigate**: Automatically open the workspace immediately after a new campaign is created.
- **Creative Flow**:
  - Launch creative creation directly within the campaign (pre-binding the ID).
  - Multi-step wizard: Source Selection (Upload/HTML/AdSense) -> Size Selection -> Configuration -> Preview.
  - Automatic size detection for uploaded images with matched preset validation.
- **Global Settings**: Move platform-level toggles (e.g., Global Auto Placement) to a dedicated "Global Settings" tab on the main advertising page.

### 4. Technical Details & Safety
- **Data Preservation**: No schema changes or data deletions. Existing campaigns and analytics will persist and be mapped into the new UI.
- **Backward Compatibility**: Ensure `SmartAdSlot` and `SmartPlacementEngine` continue to serve ads correctly using the existing relationships.
- **Security**: Maintain strict `owner_id` RLS isolation for all ad entities.

## User Review Required
> [!IMPORTANT]
> - Should "Creatives" still be visible globally in a read-only "Creative Library" for reference, or completely hidden from the top level?
> - The plan moves "Auto Placement Intensity" to Global Settings as it affects the whole site's layout. Do you agree?
