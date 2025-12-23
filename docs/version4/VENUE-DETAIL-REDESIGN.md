# Venue Detail Redesign

Owner: James  
Area: `src/pages/VenueDetail.tsx`  
Goal: Refactor and redesign the venue page UI while preserving all data fetching, RPCs, state, and behaviour.

## Non-negotiable constraints

- **No changes to Supabase RPCs, queries, parameters, or result handling.**
- **No changes to existing hook/state/handler behaviour** (ratings, events tabs, pagination, ownership checks, etc.).
- No type/data shape changes.
- UI/layout/component refactor only.
- **Hero image rule:** hero uses **venue-managed photos only** (`get_venue_photos`).  
  If none → **deterministic solid colour fallback**.  
  Catch photos must **never** be used as hero fallback (catch photos are allowed only in the Photos section fallback grid).

## Current state

- Single hero rendered once at the top via `VenueHero`.
- Hero is `w-full` (no full-bleed hacks).
- Right-column standalone photo card removed; right column begins with record then stats.
- `heroImage` derives from venue photos only (`photos[0]`), else solid colour fallback.
- Photos section can fall back to recent catch images.
- Build passes.

## Target UX / layout (high level)

- Modular layout (not a linear stack): immersive hero + section navigation + dashboard cards + engagement hub.
- Section navigation: About / Stats / Catches / Leaderboard.
- Community Catches + Leaderboard placed together (tabbed hub).
- Improved scannability and professionalism: whitespace, icons, subtle animations, strong empty states.
- Accessibility: ARIA tabs, keyboard nav, alt text.

## Current focus: reduce the “stacked boxes” feel (desktop-first)

We’ve implemented the core modular layout (hero + tabs + grids). The next iteration is about **hierarchy and rhythm** so the page feels like a “mini website” rather than a vertical stack of cards.

### Goals for this update

- **Use desktop space properly**: introduce a desktop two-column layout after the hero/nav.
  - Left (main): About/Visiting, Events, Community Hub
  - Right rail: Venue Pulse (Stats + Record) and key “Plan your visit” quick facts
- **Add layout rhythm**: not every section should be a uniform card. Introduce subtle section bands/background treatments and varied container widths so the eye gets breaks.
- **CTA ergonomics**: ensure the primary action is always obvious.
  - Desktop: primary CTA prominence within hero/CTAs
  - Mobile: consider a sticky bottom action bar (Log Catch + Maps) using existing links only
- **No regressions**: preserve all existing RPC/state/behaviour.

### Non-goals (out of scope for this iteration)

These are desirable “mini website” upgrades but require backend work and will be tracked as future phases:

- Follow/Favourite venue
- Announcements feed / venue updates
- Reviews + owner replies
- Owner analytics dashboard
- Booking/calendar integrations beyond existing booking_url links
- Weather/nearby recommendations (external APIs)

---

## Phased execution plan

### Phase 0 — Tracking + baseline

- [ ] Add this doc to repo: `docs/VENUE-DETAIL-REDESIGN.md`
- [ ] Screenshot current VenueDetail (mobile + desktop) for baseline

### Phase 1 — Refactor only (NO visual change)

Goal: Extract presentational components; output should look identical.

Components to extract (suggested):

- [ ] `VenueHero` (already present)
- [ ] `VenueCTAStrip`
- [ ] `VenueAboutVisiting`
- [ ] `VenuePhotosGrid`
- [ ] `VenueRecordCard`
- [ ] `VenueStatsCard`
- [ ] `VenuePlanYourVisit`
- [ ] `VenueEvents`
- [ ] `VenueCommunityCatches`
- [ ] `VenueTopCatches`

Acceptance checklist:

- [ ] No RPC/query changes
- [ ] No behaviour changes
- [ ] Page looks the same as baseline
- [ ] `npm run build` passes

### Phase 2 — Redesign layout (UI only)

#### 2A Hero upgrade

- [ ] Hero supports carousel (UI-only) when multiple venue photos exist
- [ ] Hero overlay scrim readable
- [ ] Primary CTAs visible near hero (Log catch, View on maps)
- [ ] Section navigation below hero (tabs/jump links)

#### 2B About / Visiting

- [ ] Desktop 2-col grid; mobile stacked
- [ ] Icons for subsections using existing data only
- [ ] Map CTA tile uses existing maps URL (no new APIs)

#### 2C Stats + Record dashboard cards

- [ ] Glanceable cards with icons/micro-visuals
- [ ] Mobile horizontal scroll row; desktop grid
- [ ] No new filtering logic (visual affordance only)

#### 2D Engagement hub: Catches + Leaderboard

- [ ] Tabs: Recent / Leaderboard
- [ ] Recent preserves existing pagination/load more behaviour
- [ ] Leaderboard highlights top 3 (badges/medals)
- [ ] Accessible tabs (ARIA + keyboard)

Acceptance checklist:

- [ ] No RPC/query changes
- [ ] No behaviour changes
- [ ] No horizontal scroll
- [ ] `npm run build` passes

#### 2E Desktop layout & visual hierarchy (remove stacked-card vibe)

- [ ] Desktop two-column layout after hero/nav
  - [ ] Left main column: About/Visiting + Events + Community Hub
  - [ ] Right rail: Stats/Record + key “Plan your visit” quick facts
  - [ ] Mobile remains stacked
- [ ] Add layout rhythm (section bands / background variation)
  - [ ] Not every section is a uniform card
  - [ ] Use whitespace and varied container treatments to create hierarchy
- [ ] CTA ergonomics improvements
  - [ ] Primary CTA is clearly dominant
  - [ ] Optional: mobile sticky bottom action bar (Log Catch + Maps) using existing links only
- [ ] No global horizontal scroll introduced (desktop + mobile)

---

## QA notes (manual)

Test venues:

- [ ] Venue with venue photos (carousel appears if >1)
- [ ] Venue with no venue photos (solid colour fallback)
- [ ] Venue with no catches (empty states)
- [ ] Venue with catches + top catches present
- [ ] Logged out (no rating interaction, no “log catch” CTA if restricted)
- [ ] Logged in normal user (rate venue works, log catch CTA works)
- [ ] Admin/owner (admin/owner CTAs visible)

Devices:

- [ ] Mobile layout (<768px)
- [ ] Desktop layout
- [ ] No horizontal scrolling

Layout + nav:

- [ ] Desktop two-column layout looks intentional (no wasted whitespace)
- [ ] Right rail does not overlap content and behaves correctly with sticky elements (if used)
- [ ] Sticky section nav does not jitter or cover headings on scroll
- [ ] No nested scroll traps (carousel / tabs / horizontal card rows)

CTAs:

- [ ] Primary CTA remains obvious on desktop
- [ ] Mobile sticky CTA bar (if implemented) does not cover important content
