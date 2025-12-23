# Venue Detail Technical Review (Public Route)

## Files audited
- src/pages/VenueDetail.tsx
- src/pages/venue-detail/components/AboutSection.tsx
- src/pages/venue-detail/components/EventsSection.tsx
- src/pages/venue-detail/components/HeroStatsStrip.tsx
- src/pages/venue-detail/components/LeaderboardSection.tsx
- src/pages/venue-detail/components/LocationMapSection.tsx
- src/pages/venue-detail/components/PlanYourVisitSection.tsx
- src/pages/venue-detail/components/RatingModal.tsx
- src/pages/venue-detail/components/RecentCatchesSection.tsx
- src/pages/venue-detail/components/VenueCarouselSection.tsx
- src/pages/venue-detail/components/VenueHero.tsx
- src/pages/venue-detail/components/VenueRecordCard.tsx
- src/pages/venue-detail/components/VenueRecordSection.tsx (unused)
- src/pages/venue-detail/viewModel.ts
- src/pages/venue-detail/utils.ts
- src/pages/venue-detail/types.ts
- src/components/layout/SectionHeader.tsx
- src/components/layout/Section.tsx
- src/components/layout/PageContainer.tsx
- src/components/typography/MarkdownContent.tsx
- src/components/typography/Heading.tsx
- src/components/typography/Text.tsx
- src/components/loading/PageSpinner.tsx
- src/components/RouteSkeleton.tsx
- src/components/AuthProvider.tsx
- src/components/DeletedAccountGate.tsx
- src/components/Layout.tsx
- src/components/ErrorBoundary.tsx
- src/lib/admin.ts
- src/lib/storage.ts
- src/integrations/supabase/client.ts
- src/index.css

---

## Executive summary (key points)
- VenueDetail uses a manual multi-effect fetch pipeline with no cancellation, which risks stale updates and duplicated pagination entries when navigating quickly or refetching.
- The tab-focus flicker/refetch is not React Query–driven; it’s caused by route remounts triggered by auth refresh/gate behavior, which re-runs the VenueDetail effects.
- Hero image reliability is improved (preload + JS Image), but it still depends on venue photos (separate RPC) and lacks a fallback to catch imagery for LCP when no photos exist.
- External URL normalization is only applied in PlanYourVisitSection; hero CTAs, booking banner, and events links can still break (e.g., /venues/www.example.com).
- Sticky CTA overlap mitigation is partial: bottom padding is applied only at the map section, not at the page root.
- Rating CTA flash has been addressed with an explicit “resolved” gate—keep this pattern for other user-dependent UI.
- There is unused state (`topAnglers`, `photosLoading`) and an unused component (`VenueRecordSection`) that should be removed to keep the module maintainable.
- Markdown rendering is safe by default (no raw HTML), but external link behavior in Markdown is not normalized or forced to open in a new tab.

---

## Findings by severity

### High

#### H1 — Pagination appends risk stale/duplicate state
- **What happens:** `loadRecentCatches` and `loadPastEvents` append to state using the captured array, not the latest state.
- **Where:** `src/pages/VenueDetail.tsx` (`loadRecentCatches`, `loadPastEvents`).
- **Why it’s a problem:** If multiple fetches resolve out of order, you can lose data or duplicate entries. This is a classic stale-closure bug for pagination.
- **Recommendation:** Use functional updates (`setRecentCatches(prev => [...prev, ...fetched])`, same for `pastEvents`) and add request guards (request IDs or abort flags).

#### H2 — External URL normalization inconsistent
- **What happens:** External URLs are normalized only in `PlanYourVisitSection`. Hero CTAs, booking banner, and events still use raw `booking_url` / `website_url`.
- **Where:**
  - `VenueHero.tsx` (Book/Website CTA)
  - `VenueDetail.tsx` (`BookingCtaBanner`)
  - `EventsSection.tsx` (booking_url / website_url)
- **Why it’s a problem:** Raw URLs without protocol can be interpreted as internal routes (`/venues/www.example.com`). It also creates inconsistency in external target handling.
- **Recommendation:** Introduce a shared helper (e.g., `normalizeExternalUrl`) in `src/lib/urls.ts` and apply it across all venue CTAs and event links.

#### H3 — Tab focus refetch & flicker persists via route remounts
- **What happens:** `get_venue_by_slug` re-runs on focus because the route can remount when auth refresh triggers a gate check and renders `RouteSkeleton`.
- **Where:** `VenueDetail.tsx` + `DeletedAccountGate.tsx` + `AuthProvider.tsx`.
- **Why it’s a problem:** Causes visible flicker, extra network calls, and hero reload.
- **Recommendation:** Avoid swapping to a skeleton on subsequent auth refreshes (post-first check). If possible, hold the route mounted and update auth state in place. Consider adding a local staleTime gate in `VenueDetail` to skip re-fetch when slug unchanged.

#### H4 — Hero image source depends only on venue photos
- **What happens:** `heroImages` are derived exclusively from `get_venue_photos`. If photos are absent or slow, the hero shows skeletons despite catch imagery being available.
- **Where:** `src/pages/venue-detail/viewModel.ts` (`heroImages`).
- **Why it’s a problem:** LCP and perceived performance are degraded; hero can feel broken when photos are empty.
- **Recommendation:** Add a fallback to recent/top catch images for hero if no venue photos are available (similar to the carousel fallback). This can be done in the view model without new data fetches.

#### H5 — Sticky CTA overlap mitigation is partial
- **What happens:** Bottom padding to account for the sticky CTA is only applied in `LocationMapSection`.
- **Where:** `LocationMapSection.tsx` uses `stickyCtaOffset` to pad bottom. The rest of the page is not padded.
- **Why it’s a problem:** Other sections (or the map buttons) can still be overlapped by the sticky CTA.
- **Recommendation:** Reserve bottom space at the page root based on sticky CTA height + safe area (via CSS var), not just at the map section.

---

### Medium

#### M1 — No cancellation/guarding for venue-scoped fetches
- **What happens:** Many effects in `VenueDetail.tsx` read `venue.id` and set state without abort handling or slug consistency checks.
- **Where:** `loadVenue`, `loadTopCatches`, `loadRecentCatches`, `loadPhotos`, `loadOperationalDetails`, etc.
- **Why it’s a problem:** Changing slug quickly can allow previous requests to write into the new venue’s state.
- **Recommendation:** Add request guards (capture `venue.id` / `slug` at call time and verify on response), or migrate to React Query with stable keys.

#### M2 — Operational data fetch clears state aggressively
- **What happens:** When loading opening hours/pricing/rules, state is immediately cleared before the new fetch resolves.
- **Where:** `loadOperationalDetails` in `VenueDetail.tsx`.
- **Why it’s a problem:** Causes flicker; old data disappears even when the new request might fail.
- **Recommendation:** Keep previous data and show a loading indicator instead of clearing arrays immediately.

#### M3 — Auth role checks cause “Manage vs Edit” inconsistencies
- **What happens:** CTA label depends on `isOwner` vs `isAdmin` computed via `venue_owners` and `admin_users`. Hosted vs local environments can yield different labels.
- **Where:** `VenueHero.tsx` and `VenueDetail.tsx` (role checks).
- **Why it’s a problem:** Inconsistent UX and confusing for users who are both owner and admin.
- **Recommendation:** Align UX rule to product intent (e.g., always show “Manage venue” for owners, even if admin). Consider a unified role banner for dual-role users.

#### M4 — Avatar path handling likely incomplete
- **What happens:** Some sections ignore `avatar_path` and only use `avatar_url`.
- **Where:** `RecentCatchesSection.tsx`, `VenueRecordSection.tsx`.
- **Why it’s a problem:** Avatars stored in Supabase storage via `avatar_path` won’t render.
- **Recommendation:** Use `getPublicAssetUrl` for `avatar_path` consistently across all catch/leaderboard cards.

#### M5 — Rating summary copy still uses “Ratings loading…”
- **What happens:** `ratingSummaryText` falls back to “Ratings loading…” in the view model.
- **Where:** `buildVenueDetailViewModel`.
- **Why it’s a problem:** Feels like a tech glitch rather than an empty state.
- **Recommendation:** Prefer “No reviews yet” when `ratingCount === 0` and `ratingLoading` is false.

---

### Low

#### L1 — Unused component and state
- **What happens:** `VenueRecordSection.tsx` is unused; `topAnglers` and `photosLoading` are unused state.
- **Where:** `VenueDetail.tsx`, `VenueRecordSection.tsx`.
- **Why it’s a problem:** Code drift and maintenance overhead.
- **Recommendation:** Remove unused state and delete unused components or document them as legacy.

#### L2 — Carousel label is static
- **What happens:** `carouselLabel` is always “Venue photo gallery” even when fallback catch images are used.
- **Where:** `buildVenueDetailViewModel`.
- **Why it’s a problem:** Slight copy mismatch when no venue photos exist.
- **Recommendation:** Use conditional label based on whether venue photos are present.

#### L3 — `mapsUrl` ignores location
- **What happens:** `mapsUrl` uses only venue name; location is only used for embed.
- **Where:** `buildVenueDetailViewModel`.
- **Why it’s a problem:** Ambiguous names can open the wrong venue.
- **Recommendation:** Include location in the Maps search query when available.

---

## Data flow appendix (requests and state)

### RPCs
- **get_venue_by_slug** → `venue`, `avgRating`, `ratingCount` (`VenueDetail.tsx`, effect on `slug`).
- **get_venue_top_catches** → `topCatches` (used for record, leaderboard, carousel fallback).
- **get_venue_recent_catches** → `recentCatches`, pagination state (`recentOffset`, `recentHasMore`).
- **get_venue_photos** → `photos` (hero + carousel).
- **get_venue_upcoming_events** → `upcomingEvents`.
- **get_venue_past_events** → `pastEvents`, pagination state.
- **get_venue_top_anglers** → `topAnglers` (currently unused).
- **get_my_venue_rating** → `userRating` and `userRatingResolved`.
- **upsert_venue_rating** → optimistic update of `avgRating`, `ratingCount`, `userRating`.

### Direct table reads
- **venue_opening_hours** → `openingHours`.
- **venue_pricing_tiers** → `pricingTiers`.
- **venue_rules** → `rulesText`.

### Potential duplication points
- Remount on auth refresh → reruns `get_venue_by_slug` and all dependent effects.
- Pagination functions append using captured state arrays (stale closures).

---

## Action plan (recommended next steps)

### UI-only
1. Normalize external URLs for hero CTAs, booking banner, and event links via a shared helper.
2. Apply functional setState for pagination appends and add request guards per fetch.
3. Provide hero image fallback to catch imagery when venue photos are empty.
4. Apply sticky CTA spacing at the page root using CSS var + ResizeObserver.
5. Replace “Ratings loading…” with a user-friendly empty state in `ratingSummaryText`.

### Backend/RPC optional (later)
6. Add a hero image or first venue photo to `get_venue_by_slug` to remove one extra RPC.
7. Consider a read-only RPC that returns venue + photos + top catches in one shaped payload.

### Perf/caching refactor (later)
8. Move venue data fetching to React Query with stable keys, `staleTime`, and `keepPreviousData`.
9. Memoize heavy derived values and split `VenueDetail` into smaller data hooks.
10. Add abort guards for slug change to prevent stale updates.

---

## Repro notes

### Flicker/refetch on focus
- Steps: open `/venues/:slug`, switch to another tab, then back.
- Observe: `get_venue_by_slug` repeated XHRs; hero may flicker.
- Network panel: filter `/rpc/get_venue_by_slug` to see multiple calls.

### Hero image “pulse until scroll”
- Steps: mobile viewport hard refresh, wait without scrolling.
- Observe: hero remains skeleton until an image request fires.
- Network panel: check if hero image request is issued on initial load.

---

## Verification commands (run)
- `npm run typecheck` → **passed**
- `npm run build` → **passed** (Vite warning: chunks > 500 kB after minification; consider code-splitting in future)
