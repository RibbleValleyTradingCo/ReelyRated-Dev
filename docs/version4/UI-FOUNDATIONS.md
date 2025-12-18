**UI Foundations (v4)**  
Updated: 2025-12-17

## Primitives (proposed)
- Layout: `PageContainer` (max-w + padding), `Section` (stacked spacing), `SectionHeader` (eyebrow/title/actions).
- Typography: `Heading` (h1–h4), `Text` (body/muted), `Eyebrow` (caps).
- Buttons: Variants for primary/ocean, secondary/outline, ghost/link; 44px touch targets.
- Chips/Pills: species/privacy/venue/weight tags (info/success/warning/neutral).
- Cards: `CardBase` + specialized shells (FeatureCard, FeedCard, VenueCard, AdminListCard).
- Empty State: icon slot + title + guidance + optional CTA.
- Skeletons: `SkeletonBlock` shimmer + patterns (FeedCardSkeleton, CatchDetailSkeleton, VenueCardSkeleton, ProfileHeaderSkeleton, AdminListSkeleton). Content-only; never full-screen overlay.

## Usage
- Use `PageContainer` + `Section` on every page for consistent spacing.
- Prefer typography primitives over ad-hoc text classes.
- Chips for small metadata; keep contrast for outdoor/mobile use.
- Skeletons should mirror final layout (cards, sidebars) and sit inside content area (Navbar always visible).

## Do / Don’t
- Do: Mobile-first, consistent spacing/typography, reuse button/card/chip primitives.
- Do: Keep layout shell stable; skeletons in content only.
- Don’t: Introduce full-screen spinners; don’t remount the shell; avoid one-off Tailwind “soup” when a primitive exists.
