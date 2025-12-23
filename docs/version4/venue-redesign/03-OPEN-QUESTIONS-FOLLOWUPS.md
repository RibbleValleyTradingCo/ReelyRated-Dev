# Open Questions and Follow-ups

This doc captures unresolved decisions, edge cases, and follow-up work for the **Venue Page Redesign (v4)**.

**Scope reminder:** UI-only changes in `src/**`. No Supabase migrations, RPC changes, schema changes, or data model changes.

---

## Decision Log Needed

Record answers inline here as they’re agreed:

- **Hero action bar:** keep as bottom-of-hero strip (non-sticky), or allow sticky on mobile?
- **Ratings editing:** do we allow _Change_ always, or only after a cooldown/confirmation?
- **Banded sections:** confirm the two banded sections are **Community (Recent Catches/Leaderboard)** + **Events**.
- **Map placement:** confirm order is **Plan Your Visit → Map → Community → Events**.

---

## Ratings and Reviews

### Open questions

- **Where does `userRating` come from today?**

  - Is there an existing hook or query that returns the current user’s venue rating?
  - If not, what existing data source do we use (without new RPCs)?

- **Average rating source of truth:**

  - Do we already load `{ averageRating, totalRatings }` for the venue?
  - If these values are computed client-side from a ratings list, can we avoid loading a full list (performance) and still support optimistic updates?

- **Optimistic update strategy (no “No ratings yet” flash):**

  - Confirm preferred pattern:
    - Update `userRating` immediately on submit
    - Optimistically update `averageRating` + `totalRatings`
    - Fire submit call
    - Re-fetch venue summary / ratings summary once submit succeeds (or after a short delay) to reconcile
  - Confirm how we revert on failure (toast + rollback state).

- **After submit, prevent “free updates”:**
  - UI requirement: once submitted, we should show **“You rated this X stars”**.
  - Do we still show **Change** (edit) or is editing disallowed? If disallowed, should we show text like “You’ve already rated this venue.”

### Follow-ups

- Add test cases to `hero-ratings.md` for:
  - first rating submission
  - existing rating display
  - submit failure + rollback
  - stale UI reconciliation without refresh
  - logged-out behaviour

---

## Section Headers and Visual Consistency

### Open questions

- Do we want a single `SectionHeader` component in `src/components/**`, or colocated with venue page components?
- Are there any exceptions where a section title must be visually different (e.g., banded section headers), or do we standardise everything?

### Follow-ups

- Audit any non-venue pages that reuse the same header styles (optional / nice-to-have).

---

## Pills, Badges, and “Boxy” Layout

### Open questions

- Confirm badge rules are strictly enforced:
  - Max 1 badge per event
  - Max 1 tag badge per catch
  - No facility/pricing badges
- Identify any legacy pills we must keep for functional reasons (filters, tabs, status).

### Follow-ups

- Add a quick “pills audit checklist” to `c-pill-cleanup.md` so we don’t miss edge components.

---

## Full-width Map

### Open questions

- Do we already have a map component or iframe embed on the venue page?
- Are we constrained by an existing max-width container (e.g., `container mx-auto`) that needs a deliberate “bleed to edge” pattern?
- If no coordinates/address exist, what do we display?
  - Minimal fallback: address text + “Open in Google Maps” link.

### Follow-ups

- Add a checklist in `d-map-full-width.md` for:
  - removing horizontal padding from map container only
  - ensuring map is `w-screen`/edge-to-edge while header stays padded
  - mobile height + desktop height

---

## Content Order and Components

### Open questions

- Confirm which blocks exist today and what is purely UI rearrangement:
  - Venue Record
  - Stats row
  - About
  - Plan Your Visit (Quick Facts)
  - Map
  - Community (Recent catches / leaderboard)
  - Events
- Are any of these blocks missing in the current code (requiring new components), or are we just restyling/reordering?

### Follow-ups

- Update `tracker.md` with a “page order confirmed” checkbox once agreed.

---

## Accessibility and UX

### Open questions

- Star rating interaction:
  - Keyboard support requirement (arrow keys / tab / enter)?
  - Do we need a screen-reader friendly label like “Rate 4 out of 5”?
- Modal behaviour:
  - Should the rating picker trap focus?
  - Escape key closes?

### Follow-ups

- Add a small a11y checklist to `hero-ratings.md`.

---

## Performance and Loading States

### Open questions

- Do we show skeleton loaders for:
  - hero rating summary
  - record catch
  - community catches
  - events
- Are there any known “layout shift” issues today when sections load?

### Follow-ups

- Define minimal loading states (non-boxy) so the page doesn’t jump.

---

## File References

- `01-TRACKER.md`
- `02-SCOPE-GUARDRAILS.md`
- `04-SECTION-HEADERS.md`
- `05-HERO-RATINGS.md`
- `06-C-PILL-CLEANUP.md`
- `07-D-MAP-FULL-WIDTH.md`
