# Homepage Redesign Plan

Redesign the Ecluid Basketball homepage to a premium, professional SaaS standard while preserving all existing functionality and branding context.

## 1. Typography & Global Styles
- Refine typography tokens in `src/styles.css` using a consistent type scale.
- Use `Space Grotesk` (Display) and `DM Sans` (Sans) with precise weight management.
- Standardize spacing and radius tokens to ensure a cohesive "premium" feel.

## 2. Navigation Component (`src/components/landing/navbar.tsx`)
- Implement a more sophisticated sticky header with background blurring.
- Refine hover states for navigation links using purposeful motion.
- Polish the mobile navigation menu with coordinated transitions.

## 3. Hero Section (`src/components/landing/hero.tsx`)
- Enhance the `LandingHero` with a stronger visual hierarchy.
- Optimize the `DotField` background for better contrast and depth.
- Redesign the mock UI previews to look like a high-fidelity production app.
- Improve typography leading and tracking for the main headline.

## 4. Feature & Section Components (`src/components/landing/features.tsx`, `sections.tsx`)
- Refactor feature cards to use subtle borders, refined shadows, and improved spacing.
- Enhance the "How It Works" workflow visual with better connectivity and icons.
- Polish the "Pool Draw" and "White Label" sections with high-contrast visuals and smooth animations.

## 5. Layout & Assembly (`src/routes/index.tsx`)
- Introduce a "Capability Strip" refinement (optimized logo/feature carousel).
- Add consistent vertical spacing between major sections.
- Refine the final Call-to-Action (CTA) with a more impactful gradient and layout.

## 6. Motion System Integration
- Apply consistent Transitions.dev tokens for all entrance and interaction animations.
- Ensure strict `prefers-reduced-motion` compliance.

## Technical Details
- **Styling:** Tailwind CSS v4 using semantic OKLCH tokens.
- **Animation:** Framer Motion for complex transitions, CSS transitions for simple interactions.
- **Assets:** Reuse existing branding hooks and organization data to maintain white-label support.
