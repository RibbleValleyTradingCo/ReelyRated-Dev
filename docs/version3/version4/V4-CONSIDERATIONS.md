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

## Services for Venue Owners (Paid, mobile-first admin)

| Service | Description | Why It Converts | Mobile-first | Desktop Enhancement |
| --- | --- | --- | --- | --- |
| Event Posting | Create/promote events with RSVPs/notifications | Drives visits/revenue | Quick form + photo upload | Bulk edit, richer schedule |
| Promotions/Offers | Deals with targeted notifications | Fills slow periods; track redemptions | Quick-post interface | Analytics dashboard |
| Analytics Dashboard | Visitors/peaks/sentiment insights | Optimizes ops | Scrollable chart summaries | Interactive graphs/tooltips |
| Booking Integration | Reservations + payments | Streamlines revenue | One-tap booking | Calendar views |
| Page Customization | Media/branding uploads | Professional presence | Touch drag/drop | Precise editors |
| Priority Visibility/SEO | Higher ranking, verified badge | Increases exposure | Boosts visible in search | Algorithmic boosts |
| Moderation/Response | Reply to reviews, flag issues | Protects reputation | Mobile notifications/replies | Threading tools |
| Fish Stocking/Updates | Real-time conditions | Builds loyalty | Simple quick posts | Scheduled updates |
| Partnership Perks | Forecasts/cross-promos | Adds niche value | Mobile alerts | API integrations |
| Performance Reports | Monthly metrics/benchmarks | Aids marketing | Mobile summaries | Downloadable charts |

**Tiered model:** Basic (free community data) vs Premium (paid services). Launch with 3–5 core services; validate with venue-owner feedback, especially on mobile usability.
