# Landing Page Redesign Plan

Redesign the public landing page with a modern, premium sports-tech aesthetic focusing on basketball tournament management features.

## Proposed Changes

### 1. New Navigation & Layout
- Implement a clean, sticky navbar with dynamic branding (from the white-label system) and smooth anchor scrolling.
- Add "Sign In" and "Get Started" CTAs (or "Dashboard" if authenticated).
- Implement a modern, responsive footer with organization branding.

### 2. High-Impact Hero Section
- Integrate the `DotField` animated background as a subtle decorative layer.
- Use a bold basketball-focused headline: "Run Basketball Tournaments Without the Chaos".
- Include a floating UI mockup showcase (standings, fixtures, brackets) to demonstrate the app's capability visually.
- Dual CTAs: "Create Tournament" and "Explore Features".

### 3. Feature Showcase (Bento Grid)
- Create a polished feature grid explaining core capabilities: Tournament Creation, Team Hub, Fixtures & Results, Automatic Standings, Group Management, and Knockout Brackets.
- Dedicated showcase for the unique "Spin-the-Wheel" Pool Draw feature.

### 4. Workflow & Formats
- "From Setup to Champion": A visual 8-step timeline showing the organizer's journey.
- "Built for the Formats You Actually Use": Highlighting League and League-cum-Knockout (Group + Playoff) support with UI previews.

### 5. Production Optimization
- Ensure responsiveness across all devices.
- Maintain existing white-label, auth, and dashboard navigation.
- Use primary brand colors dynamically from the database.

## Technical Details
- **Architecture**: Refactor `src/routes/index.tsx` completely.
- **Components**: Create specialized sub-components for the landing page (`Hero`, `Navbar`, `FeatureGrid`, `WorkflowStep`, `FormatCard`).
- **Styles**: Use Tailwind CSS for the premium sports vibe, incorporating the "Night Court" theme (orange accents on dark backgrounds).
- **Interactivity**: Use Framer Motion for subtle entry animations and hover effects.
- **Performance**: Optimize `DotField` settings for smooth rendering without blocking interactions.
