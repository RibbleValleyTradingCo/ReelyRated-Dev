**Visual Baseline (v4)**  
Updated: 2025-12-17

## Standard viewports
- Mobile (primary): **390×844**
- Mobile (small): **375×667**
- Desktop (primary): **1440×900**

## What to capture
- For each key page: **top-of-page (above the fold)** and **one scroll down**.
- Capture **loaded state** (not just skeletons).
- Key pages: Landing (`/`), Venues index/detail (`/venues`, `/venues/:slug`), Feed, Catch detail, Profile, Admin pages.

## Filenames (deterministic)
- Format: `{routeKey}-{device}-{viewport}-{state}-{YYYY-MM-DD}.png`
- Examples:
  - `venues_index-mobile-390x844-loaded-2025-12-18.png`
  - `venue_detail-mobile-390x844-loaded-2025-12-18.png`
  - `feed-desktop-1440x900-loaded-2025-12-18.png`

## When to update baselines
- Only update when a PR changes **layout/spacing/typography/skeleton patterns** for that page.

## Pending captures (venue detail example)
- `venue_detail-mobile-390x844-loaded-2025-12-18.png`
- `venue_detail-mobile-375x667-loaded-2025-12-18.png`
- `venue_detail-desktop-1440x900-loaded-2025-12-18.png`
