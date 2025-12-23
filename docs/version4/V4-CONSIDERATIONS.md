**ReelyRated v4 – UI Updates & Venue Owner Services (Mobile-First)**

## Overview

- Community platform for UK anglers to log catches, rate, and compete.
- Venue pages surface community data (heaviest catches, ratings, etc.).
- Premium features target venue owners; core data remains free.
- **Mobile-first**: touch-friendly, fast-loading, vertical-first layouts; desktop enhanced with grids/hover and richer analytics.

## UI Update Guidance (mobile-first, progressive enhancement)

### Landing Page

- **Hero:** Responsive hero image/video (<100KB) with headline “Join the UK’s Freshwater Fishing Community – Log, Rate, and Compete!”; large, touch-friendly CTAs (“Sign Up Free”, “Download App”). Desktop: add app preview/animation.
- **Stats & Social Proof:** Stacked counters + testimonials carousel on mobile; desktop grid for quick scan.
- **Feature Grid:** 4–6 tappable cards (44px targets), swipeable on mobile; 2–3 column hover-reveal on desktop.
- **Footer:** Stacked links to stores/policies on mobile; multi-column footer on desktop.

### Account Page

- **Profile Header:** Centered avatar upload, single-line bio (mobile); multi-line + side-by-side stats (desktop).
- **Stats:** Vertical stacked progress/charts (mobile, pinch-to-zoom); dashboard grid with tooltips (desktop).
- **Notifications:** Vertical timeline with pull-to-refresh/swipe dismiss (mobile); filter sidebar (desktop).
- **Followers/Following:** Searchable vertical list with infinite scroll (mobile); grid + prominent search (desktop).
- **CTA:** Floating “Add Catch” FAB (mobile); header action (desktop).

### Leaderboard

- **Layout:** Card list with collapsible details + dropdown sorts (mobile); sortable table with header clicks/pagination (desktop).
- **Visuals:** Responsive thumbnails, big rank badges; hover previews on desktop.
- **Personalization:** User rank top card with “Climb Tips” accordion (mobile); sidebar tips (desktop).
- **Engagement:** “Challenge Friends” fixed bottom button (mobile); toolbar option (desktop).

### Community Catches

- **Grid:** Infinite scroll, lazy load, tap-to-expand (mobile); masonry grid (desktop).
- **Social:** Large like/comment inputs; swipe-to-share (mobile); hover previews (desktop).
- **Filters/Search:** Stacked dropdowns + autocomplete; map toggle button (mobile); top bar + embedded map (desktop).
- **Contribution:** Floating “Log a Catch” (mobile); sidebar uploader (desktop).

### General UI Practices

- **Color:** High-contrast blues/greens for outdoor visibility; WCAG compliant. Desktop: subtle gradients.
- **Type:** Base 16px+ on mobile; scalable hierarchy. Desktop: allow user scaling.
- **Responsiveness:** Vertical-first, collapse sidebars; test touch accuracy on real devices.
- **Performance:** Compress/lazy-load images; prefetch on desktop; graceful on poor connectivity.
- **Testing:** A/B on mobile variants first; cross-device via BrowserStack.

## V4 UI Foundations Implementation Standards (Source of Truth)

These standards reflect how we are executing the v4 UI pass in the codebase. They are **UI-only guardrails** intended to keep work incremental and prevent regressions.

### Scope and guardrails (UI-only)

- **UI/presentation changes only** (layout, spacing, typography, responsiveness, visual hierarchy).
- Do **not** change Supabase (migrations/RPCs/RLS), data fetching hooks, query parameters, redirects, auth/guards, or business logic unless explicitly approved.
- Keep route behavior identical; avoid introducing new features (e.g., bulk actions, infinite scroll, new filters).

### Foundations we are standardizing

- **Layout primitives** (direct imports):
  - `PageContainer` (`@/components/layout/PageContainer`)
  - `Section` (`@/components/layout/Section`)
  - `SectionHeader` (`@/components/layout/SectionHeader`)
- **Typography primitives** (direct imports):
  - `Heading`, `Text`, `Eyebrow` (`@/components/typography/*`)
  - `Eyebrow` must remain an inline element (`<span>`) to avoid invalid DOM nesting.

### Import rule (important)

- Use **direct file imports** for v4 primitives.
- Avoid any `@/components/layout` barrel import patterns that can clash with `@/components/Layout` on case-sensitive tooling.

### Loading patterns

- **Default**: use `PageSpinner` for page-level loading states (content-area only; never full-screen overlays).
- Use `InlineSpinner` for inline button/CTA loading states.
- `RouteSkeleton` must remain a simple `PageSpinner` fallback (route-level Suspense).
- No per-page skeleton grids (including `/feed`) unless explicitly approved later.

### Navbar and top spacing

- The Navbar is owned by the shared `Layout` shell.
- Pages should **not** render a `Navbar` directly (prevents duplicate navs and refresh-time crashes).
- The shell should reserve top space via the navbar height variable to prevent content sliding under the fixed header.
- If a page shows content under the navbar on hard refresh, fix the Layout spacing (not per-page padding hacks).

### Mobile-first overflow / truncation checklist

Use this checklist on every page (especially admin screens) to ensure **no horizontal scroll** at 320–390px widths:

- Add `min-w-0` to flex/grid children that contain long text.
- Apply `truncate` / `line-clamp-*` to long titles, slugs, IDs, emails, URLs.
- Use wrap-safe layouts for chips/actions:
  - Mobile: `grid grid-cols-2 gap-2` (or stack with `w-full`)
  - `sm+`: switch to `flex flex-wrap` as space allows
- Ensure touch targets: **min height ~44px** for buttons/select triggers.
- Tables must be **scoped** in an `overflow-x-auto` wrapper (avoid page-level horizontal scroll).

### Admin pages: accepted patterns

- Sticky filter/sort headers are OK **if** they do not overlap the navbar and include clear separation (divider) from the list.
- Prefer “full width on mobile, constrained on desktop” containers (e.g., responsive max-width + md:mx-auto) rather than permanently max-w-none.
- Action clusters must wrap/stack on mobile; avoid compressed multi-button rows.

### Verification steps (minimum)

- `npm run build` must pass.
- Device emulation checks: 320px, 360px, 375px, 390px, plus desktop 1440px.
- Confirm `document.documentElement.scrollWidth === document.documentElement.clientWidth` on mobile widths.

## Current v4 rollout status

Pages updated to v4 foundations (PageContainer/Section/SectionHeader + Heading/Text/Eyebrow) with direct imports:

- Public: `/` (Index), `/venues` (VenuesIndex), `/venues/:slug` (VenueDetail), `/leaderboard` (LeaderboardPage), `*` (NotFound)
- Core social: `/feed` (Feed), `/catch/:id` (CatchDetail), `/add-catch` (AddCatch), `/profile/:slug` (Profile), `/sessions` (Sessions), `/search` (Search), `/insights` (Insights), `/settings/profile` (ProfileSettings)
- Owner: `/my/venues` (MyVenues), `/my/venues/:slug` (MyVenueEdit)
- Admin: `/admin/reports` (AdminReports), `/admin/audit-log` (AdminAuditLog), `/admin/users/:userId/moderation` (AdminUserModeration), `/admin/venues` (AdminVenuesList), `/admin/venues/:slug` (AdminVenueEdit)
- Account: `/account-deleted` (AccountDeleted)

Notes:

- Admin pages require extra mobile-first overflow/truncation checks (chips, buttons, selects, tables) to avoid horizontal scroll.
- Some pages are intentionally **outside Layout** (no navbar): `/auth`, `/account-deleted`.

## Services for Venue Owners (Paid, mobile-first admin)

| Service                 | Description                                    | Why It Converts                       | Mobile-first                 | Desktop Enhancement         |
| ----------------------- | ---------------------------------------------- | ------------------------------------- | ---------------------------- | --------------------------- |
| Event Posting           | Create/promote events with RSVPs/notifications | Drives visits/revenue                 | Quick form + photo upload    | Bulk edit, richer schedule  |
| Promotions/Offers       | Deals with targeted notifications              | Fills slow periods; track redemptions | Quick-post interface         | Analytics dashboard         |
| Analytics Dashboard     | Visitors/peaks/sentiment insights              | Optimizes ops                         | Scrollable chart summaries   | Interactive graphs/tooltips |
| Booking Integration     | Reservations + payments                        | Streamlines revenue                   | One-tap booking              | Calendar views              |
| Page Customization      | Media/branding uploads                         | Professional presence                 | Touch drag/drop              | Precise editors             |
| Priority Visibility/SEO | Higher ranking, verified badge                 | Increases exposure                    | Boosts visible in search     | Algorithmic boosts          |
| Moderation/Response     | Reply to reviews, flag issues                  | Protects reputation                   | Mobile notifications/replies | Threading tools             |
| Fish Stocking/Updates   | Real-time conditions                           | Builds loyalty                        | Simple quick posts           | Scheduled updates           |
| Partnership Perks       | Forecasts/cross-promos                         | Adds niche value                      | Mobile alerts                | API integrations            |
| Performance Reports     | Monthly metrics/benchmarks                     | Aids marketing                        | Mobile summaries             | Downloadable charts         |

**Tiered model:** Basic (free community data) vs Premium (paid services). Launch with 3–5 core services; validate with venue-owner feedback, especially on mobile usability.
