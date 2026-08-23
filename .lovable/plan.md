# Plan: Transitions.dev Motion & Animation System

Implement a purposeful, polished UI motion system across the application following Transitions.dev principles. This involves creating a reusable motion token system in CSS and updating key UI components (Modals, Tabs, Toasts, etc.) to use these patterns.

## User Review Required

> [!IMPORTANT]
> This plan will modify core UI components and global styles to implement the Transitions.dev motion system.

- **Framer Motion Integration:** I will use `framer-motion` for complex transitions (Tabs, sliding indicators, number pops) as it provides the most "Transitions.dev" feel with less boilerplate than pure CSS for certain patterns.
- **Verification:** I will verify the changes by inspecting the preview for smooth transitions and checking `prefers-reduced-motion` compliance.

## Proposed Changes

### Motion Tokens & Global Styles
- **`src/styles.css`**:
    - Define core motion tokens in `@theme`:
        - Durations: `--duration-fast` (150ms), `--duration-normal` (250ms), `--duration-slow` (350ms).
        - Easings: Transitions.dev custom cubic-beziers.
        - Distance/Scale/Blur tokens for consistency.
    - Add utility classes for common Transitions.dev transitions.
    - Add `prefers-reduced-motion` media queries to reset large transforms.

### Component Refinements
- **`src/components/ui/dialog.tsx` (Modals)**:
    - Update entrance/exit animations to use a subtle scale (e.g., 0.95 -> 1.0) + opacity.
    - Ensure the overlay fades in/out smoothly.
- **`src/components/ui/tabs.tsx`**:
    - Implement a sliding active indicator using Framer Motion or CSS `anchor-name` (if supported, otherwise Framer Motion for cross-browser polish).
- **`src/components/ui/sonner.tsx` (Toasts)**:
    - Refine toast animations: rise + fade + subtle scale.
- **`src/components/ui/accordion.tsx`** (if exists):
    - Ensure smooth height expansion and chevron rotation.
- **`src/components/ui/button.tsx`**:
    - Add restrained hover lift/scale effects.

### Interaction Feedback
- **Number Pops**: Add a utility or hook for "number changes" to pop/flip when scores update.
- **Success/Error States**: Implement the checkmark reveal and shake animations.

## Technical Details
- **Dependencies**: Add `framer-motion` for advanced transitions.
- **Tokens**:
  ```css
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-transitions: cubic-bezier(0.22, 1, 0.36, 1); /* Transitions.dev signature */
  ```
- **Reduced Motion**:
  ```css
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```

## Verification Plan
- **Manual Preview**: Test Modals, Tabs, and Buttons for smoothness.
- **Lighthouse/Performance**: Ensure animations don't tank frame rates.
- **Accessibility**: Verify reduced motion toggle in dev tools removes large transforms.
