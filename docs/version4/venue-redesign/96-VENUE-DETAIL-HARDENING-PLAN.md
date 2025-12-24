# Venue Detail Hardening Plan (Public Route)

## Files audited (this pass)
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
- src/pages/venue-detail/components/VenueRecordSection.tsx
- src/pages/venue-detail/viewModel.ts
- src/pages/venue-detail/utils.ts
- src/pages/venue-detail/types.ts
- src/components/layout/Section.tsx
- src/components/layout/SectionHeader.tsx
- src/components/layout/PageContainer.tsx
- src/components/typography/MarkdownContent.tsx
- src/components/typography/Heading.tsx
- src/components/typography/Text.tsx
- src/components/AuthProvider.tsx
- src/components/DeletedAccountGate.tsx
- src/components/Layout.tsx
- src/lib/storage.ts
- src/integrations/supabase/client.ts

---

## A) Findings validation vs 95-VENUE-DETAIL-TECH-REVIEW

### ✅ Completed (validated)
- **Pagination stale-closure appends**
  - Functional appends in recent/past pagination.
  - Evidence: `src/pages/VenueDetail.tsx:171-235`.
- **Venue-scoped request guards/cancellation**
  - Request-id guard added across venue-scoped fetches.
  - Evidence: `src/pages/VenueDetail.tsx:109-319` and `src/pages/VenueDetail.tsx:369-411`.
- **External URL normalization centralized**
  - `normalizeExternalUrl` in `src/lib/urls.ts`; applied to Hero/Plan/Events/Banner/Markdown.
  - Evidence: `src/lib/urls.ts`, `src/pages/venue-detail/components/VenueHero.tsx`, `src/pages/venue-detail/components/PlanYourVisitSection.tsx`, `src/pages/venue-detail/components/EventsSection.tsx`, `src/pages/VenueDetail.tsx`, `src/components/typography/MarkdownContent.tsx`.
- **Sticky CTA overlap mitigation**
  - Root padding reserve uses CSS var set via ResizeObserver; map section no longer offsets itself.
  - Evidence: `src/pages/VenueDetail.tsx:581-806`.
- **Deterministic hero fallback when no venue photos**
  - Hero images now fall back to recent/top catch images when venue photos are empty.
  - Evidence: `src/pages/venue-detail/viewModel.ts:131-160`.

### Already fixed (no action required)
- **Rating CTA flash**
  - `userRatingResolved` gates the logged-in CTA; no “Rate this venue” flash while loading.
  - Evidence: `src/pages/VenueDetail.tsx:357-382` and `src/pages/venue-detail/components/VenueHero.tsx:146-178`.
- **Hero preload prop casing warning**
  - `fetchpriority="high"` applied with a TS expect-error for compatibility.
  - Evidence: `src/pages/venue-detail/components/VenueHero.tsx:324-334`.

### Partially addressed (needs tightening)
- **Tab focus flicker/refetch**
  - DeletedAccountGate now throttles checks, but VenueDetail still refetches when the route remounts (focus-triggered auth refresh).
  - Evidence: `src/components/DeletedAccountGate.tsx:40-72` and `src/pages/VenueDetail.tsx:96-115`.

### Already completed (not part of this plan)
- **Opening hours “Duplicate row” action** (owner/admin edit)
- **Rich text editing toolbar** (Markdown stored in DB)

---

## B) Phase 1 (must-do) patch plan — concrete

> Phase 1 changes are UI-only safety/robustness hardening, using existing data and RPCs.

### 1) ✅ Fix stale-closure appends (pagination)
- **Files:** `src/pages/VenueDetail.tsx`
- **Pattern:** Use functional updates for append branches.
  - `setRecentCatches(prev => append ? [...prev, ...fetched] : fetched)`
  - `setPastEvents(prev => append ? [...prev, ...fetched] : fetched)`
- **Status:** ✅ Completed (see `src/pages/VenueDetail.tsx:171-235`).
- **Manual tests:**
  - Load recent catches → click load more → no duplicates.
  - Toggle past events → load more → order and pagination consistent.

### 2) ✅ Add request guards for venue-scoped fetches
- **Files:** `src/pages/VenueDetail.tsx`
- **Pattern:** Use a `useRef` request token or venueId guard per fetch.
  - Example pattern:
    - `const venueRequestId = useRef(0);`
    - On fetch start: `const requestId = ++venueRequestId.current;`
    - On response: `if (requestId !== venueRequestId.current) return;`
  - Apply to `loadVenue`, `loadPhotos`, `loadOperationalDetails`, `loadRecentCatches`, `loadPastEvents`, `loadTopCatches`, `loadUpcomingEvents`.
- **Status:** ✅ Completed (see `src/pages/VenueDetail.tsx:109-319`).
- **Manual tests:**
  - Rapidly navigate between two venues → no stale data leaks.
  - Refresh while loading → no console errors, no partial data bleed.

### 3) ✅ Centralize external URL normalization + apply everywhere
- **Files:**
  - Add: `src/lib/urls.ts` (new helper)
  - Update: `VenueHero.tsx`, `VenueDetail.tsx` (BookingCtaBanner), `EventsSection.tsx`, `PlanYourVisitSection.tsx`, and optionally `MarkdownContent.tsx` link renderer.
- **Pattern:**
  - `normalizeExternalUrl(url)` with allowlist: `http`, `https`, `mailto`, `tel`.
  - Apply to all external links (booking/website/events).
  - In Markdown renderer, wrap `a` to enforce `target="_blank" rel="noreferrer"` and normalized href.
- **Status:** ✅ Completed (helper in `src/lib/urls.ts`; applied across Hero/Plan/Events/Banner/Markdown).
- **Manual tests:**
  - Enter a venue with `website_url` missing protocol → links open correctly.
  - Event booking URLs open external, not `/venues/…`.

### 4) ✅ Page-root sticky CTA safe-area reserve
- **Files:** `src/pages/VenueDetail.tsx`, possibly `src/components/layout/PageContainer.tsx`.
- **Pattern:**
  - Use ResizeObserver on sticky CTA bar to set CSS var, e.g. `--sticky-cta-h` on the root container.
  - Apply `padding-bottom: calc(var(--sticky-cta-h, 0px) + env(safe-area-inset-bottom) + 12px)` at the **page root**, not only the map section.
- **Status:** ✅ Completed (ResizeObserver + root CSS var in `src/pages/VenueDetail.tsx:581-806`).
- **Manual tests:**
  - Mobile: scroll to map → “Call venue” visible and not obscured.
  - Toggle sticky CTA visibility (logged in/out) → padding adjusts correctly.

### 5) ✅ Deterministic hero fallback when venue photos are empty
- **Files:** `src/pages/venue-detail/viewModel.ts`, `src/pages/venue-detail/components/VenueHero.tsx` (if needed).
- **Pattern:**
  - If `heroImages` empty, derive a fallback image from `recentCatches`/`topCatches` (already in memory; reuse `fallbackCatchItems` logic).
  - Example: `const heroImages = venuePhotos.length ? venuePhotos : fallbackCatchItems.slice(0,1).map(...)`.
- **Status:** ✅ Completed (see `src/pages/venue-detail/viewModel.ts:131-160`).
- **Manual tests:**
  - Venue with no photos but with recent catches → hero renders catch image immediately.
  - Venue with no photos and no catches → hero uses gradient background (no spinner loop).

---

## C) Phase 2 (optional)

✅ **Phase 2 complete (Steps 1–4)** — Venue detail data orchestration now lives in `src/pages/venue-detail/hooks/useVenueDetailData.ts` (React Query for venue + rating + operational reads, plus infinite queries for recent catches/past events).

### Option 1 — React Query migration
- **Approach:** Introduce a single `useVenueDetailQuery(slug)` with stable query key.
- **Config:** `staleTime: 60s+`, `keepPreviousData: true`, `refetchOnWindowFocus: false`.
- **Benefit:** Eliminates refetch flicker, dedupes requests, simplifies loading states.

### Option 2 — Custom hook with caching
- **Approach:** Create `useVenueDetailData(slug)` that handles fetch orchestration + caching in a module-level cache or context.
- **Benefit:** Minimal dependency change, reduces duplicate effects.

### Perf-focused improvements
- Preload first hero image via `get_venue_by_slug` payload or a single combined RPC.
- Memoize expensive derived values in `viewModel` (e.g., formatted tags) if re-render volume rises.

---

## Proposed commit sequence (3–6 shippable commits)
Status: ✅ Completed in current codebase (kept for historical reference).
1. **Pagination functional updates + request guards**
   - Implement functional `setState` for pagination + add request IDs.
2. **Centralized URL normalization**
   - Add `lib/urls.ts`, update all CTAs/links + Markdown renderer.
3. **Sticky CTA safe-area reserve**
   - Add CSS var padding at page root using ResizeObserver.
4. **Hero fallback when photos missing**
   - Update viewModel heroImages derivation.
5. **Optional polish / cleanup**
   - Remove unused state + unused `VenueRecordSection` component.

---

## Verification (required commands)
- `npm run typecheck` (✅ run)
- `npm run build` (✅ run; Vite chunk-size warning expected)

Notes:
- Vite chunk-size warnings are expected; not part of Phase 1 unless requested.
