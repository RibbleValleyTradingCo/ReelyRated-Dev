# Venue Ratings & Reviews Redesign

Owner: James  
Area: `src/pages/VenueDetail.tsx` (+ small presentational components under `src/components/venue/**` if needed)  
Goal: Fix ratings UX + redesign the ratings/review presentation so it’s **not boxed**, integrates with hero identity, and removes “no ratings yet” flashing.

## Non-negotiable constraints

- **UI only.**
- **No changes** to Supabase RPCs, queries, params, result handling, or any backend/migrations.
- Preserve existing behaviours everywhere else (tabs, pagination, ownership checks, etc.).
- Rating submission should keep the same underlying call(s); we’re only changing **how UI reflects state**.

## Current problems we must solve

1. **After submitting a rating, the UI still allows free editing** (stars remain interactive).  
   ✅ Desired: after submit, show **read-only**: “You rated this ★★★☆☆” with a **Change** action to intentionally re-open picker.

2. **After submitting, UI shows “No ratings yet” until refresh**.  
   ✅ Desired: **no flash**. After submit, hero should immediately show the user’s rating and a stable summary (`0.0 · 0 ratings` style if truly empty).

3. **Ratings / review section feels “boxed”** (card/box look).  
   ✅ Desired: ratings should read as part of hero identity + a clean section below (no card chrome).

## Target UX

### Hero (always visible)

- Venue name
- Location text (NOT a pill; location pill removal is out-of-scope here but hero text is fine)
- Ratings inline:
  - Average stars + numeric average (1dp) + count (e.g. `4.2 · 18 ratings`)
  - If user has rated:
    - “You rated this ★★★★☆” (read-only)
    - “Change” link opens picker
  - If user has not rated:
    - “Rate this venue” opens picker

### Rating picker (intentional interaction)

- Modal overlay (`fixed inset-0`, not clipped by hero)
- Pick stars, submit, cancel
- Submitting:
  - Optimistic UI immediately shows “You rated this …”
  - Never show “No ratings yet” while waiting
  - If API fails: revert + show toast/error (use existing patterns)

### Reviews section (no box)

- Section header: “Reviews”
- If you don’t have text reviews yet: show a calm empty state:
  - “No written reviews yet — ratings are available above.”
- If you do have review rows: render them as a simple list with dividers (no card container):
  - Avatar / name
  - Date
  - Stars
  - Body text
  - Light `border-b` separators

## Implementation plan (UI only)

### Phase 0 — Baseline & inventory

- [ ] Capture screenshots (mobile + desktop) of:
  - [ ] Venue with 0 ratings
  - [ ] Venue with ratings
  - [ ] Logged-in user who has rated
- [ ] Identify existing rating state sources in `VenueDetail.tsx`:
  - [ ] Where average + count comes from
  - [ ] Where user’s rating comes from
  - [ ] Submission call + loading/error states

**Deliverable:** Short notes in this doc under “Findings”.

### Phase 1 — Stabilise state (kill “No ratings yet” flash)

- [ ] Add a local UI “display model” so we never render the empty message during fetch/submit:
  - [ ] Gate “empty ratings” text behind a `loaded` flag
  - [ ] Maintain “last known” aggregates while submitting
  - [ ] Optional: show skeleton while loading (only initial load)

**Acceptance:**

- [ ] On first page load: no jarring “No ratings yet” flicker.
- [ ] On submit: the hero does not regress to empty state.

### Phase 2 — Hero integration (ratings are identity)

- [ ] Remove existing ratings “card/box” UI
- [ ] Render rating summary inline in hero
- [ ] Render user-rating state inline:
  - [ ] Not rated → “Rate this venue”
  - [ ] Rated → “You rated this …” + “Change”

**Acceptance:**

- [ ] No separate ratings card remains.
- [ ] Hero contains the full rating identity block.

### Phase 3 — Read-only after submit + intentional Change

- [ ] After submit succeeds (or optimistic submit begins):
  - [ ] stars in the hero become read-only
  - [ ] show “You rated this X stars”
  - [ ] “Change” opens picker

**Acceptance:**

- [ ] User cannot accidentally keep changing rating by clicking stars in hero.
- [ ] User can still update rating via “Change”.

### Phase 4 — Reviews section redesign (no box)

- [ ] Replace boxed container with a clean section:
  - [ ] Header + optional subtitle
  - [ ] Divider-based list (no card chrome)
  - [ ] Empty state is simple and calm

**Acceptance:**

- [ ] Reviews section is not in a card/box.
- [ ] Works for empty + populated states.

## QA checklist

### States

- [ ] Logged out:
  - [ ] Rating UI doesn’t offer a dead control (either hidden or routes to auth using existing behaviour)
- [ ] Logged in, not rated:
  - [ ] “Rate this venue” opens picker
- [ ] Logged in, already rated:
  - [ ] Shows “You rated this …” read-only
  - [ ] “Change” opens picker
- [ ] Submit rating:
  - [ ] Immediately updates UI (optimistic)
  - [ ] No “No ratings yet” flash
  - [ ] If submit fails: revert + show toast

### Layout

- [ ] Mobile: modal fits, buttons are tappable (44px targets)
- [ ] Desktop: hero rating block aligns cleanly and doesn’t wrap awkwardly
- [ ] No z-index conflicts with nav/sticky elements
- [ ] No horizontal scrolling introduced

## Findings (fill in during Phase 0)

- Average rating source:
- Rating count source:
- User rating source:
- Submit call:
- Existing loading flags:
- Existing error handling/toast pattern:

## Notes

- Prefer “server truth” for average/count; if we do any optimistic updates, we must refetch/restore from server afterwards (UI only; no backend changes).
- Keep star rendering consistent:
  - Numeric average: 1dp
  - Star fill rule: rounded average (for now) is fine, but be consistent across hero + picker.
