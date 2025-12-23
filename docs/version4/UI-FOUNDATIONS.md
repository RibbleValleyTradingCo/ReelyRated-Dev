**UI Foundations (v4)**  
Updated: 2025-12-17

## Primitives (proposed)

- Layout: `PageContainer` (max-w + padding), `Section` (stacked spacing), `SectionHeader` (eyebrow/title/actions).
- Typography: `Heading` (h1–h4), `Text` (body/muted), `Eyebrow` (caps).
- Buttons: Variants for primary/ocean, secondary/outline, ghost/link; 44px touch targets.
- Chips/Pills: species/privacy/venue/weight tags (info/success/warning/neutral).
- Cards: `CardBase` + specialized shells (FeatureCard, FeedCard, VenueCard, AdminListCard).
- Empty State: icon slot + title + guidance + optional CTA.
- Loading: `PageSpinner` (content-area), `InlineSpinner` (button/row), `RouteSkeleton` (Suspense fallback = `PageSpinner`). No full-screen overlays.

## Usage

- Use `PageContainer` + `Section` on every page for consistent spacing.
- Prefer typography primitives over ad-hoc text classes.
- Chips for small metadata; keep contrast for outdoor/mobile use.
- Loading should be consistent site-wide: use `PageSpinner` for page/section loading and `InlineSpinner` for small actions (buttons, rows).
- The shell must remain stable: Navbar is rendered only by `Layout`; all loading UI is content-only (never covers the navbar).

## Layout and spacing rules

- Navbar height is controlled by `--nav-height` and the Layout reserves space with top padding so content never slides under the navbar.
- Use a single page wrapper per route (e.g. `.section-container` or `container mx-auto ...`) and keep it the same in loading and loaded states.
- Avoid page-level `<Navbar />` renders inside pages/components; Layout is the single source of truth.

## Do / Don’t

- Do: Mobile-first, consistent spacing/typography, reuse button/card/chip primitives.
- Do: Keep layout shell stable; skeletons in content only.
- Do: Use content-area spinners (`PageSpinner`) during loading; keep the navbar visible and stable.
- Don’t: Introduce full-screen loaders or overlays; don’t render Navbar outside Layout.
- Don’t: Avoid one-off Tailwind “soup” when a primitive (Section/Card/Typography/Loading) exists.
