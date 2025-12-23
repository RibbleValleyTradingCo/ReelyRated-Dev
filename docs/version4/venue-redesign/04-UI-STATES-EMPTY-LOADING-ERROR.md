# 04 — UI States: Empty, Loading, Error

This doc defines **consistent UI states** for the Venue Detail redesign.

**Goal:** No janky flashes (e.g. “No ratings yet” before data arrives), predictable placeholders, and clear recovery paths.

## Scope

Applies to the Venue Detail page sections:

- Hero (photo/title/location/actions)
- Ratings (average + user rating + picker)
- Venue Record
- Stats & Records
- About
- Plan Your Visit / Quick Facts
- Map (full-width)
- Community (Recent catches / Leaderboard)
- Events

## Global rules

### 1) Never show empty-state copy while data is still loading

- If a section is waiting for data, render a **skeleton** or **placeholder**.
- Only show empty-state copy once the query has resolved and confirmed **0 items**.

### 2) Use the same tone across the page

- Helpful, community-first, short.
- Avoid “technical” language.

### 3) Prefer optimistic UI for user actions

- On submit, update UI immediately.
- If the request fails, revert and show a toast.

### 4) Error states are recoverable

- Provide **Retry** where possible.
- When a section fails, don’t break the whole page.

### 5) Accessibility

- Skeletons should not trap focus.
- Buttons have visible focus states.
- Error messages are announced (aria-live) where appropriate.

---

## Hero

### Loading

- Show a hero skeleton:
  - Background: solid `bg-gray-800` (no image blur loading)
  - Title bar placeholder (2 lines)
  - Actions row placeholder

### Empty

- Hero never “empties” — it must always render:
  - If no hero photo: keep `bg-gray-800` fallback.
  - If title missing (should not happen): display `Unnamed venue`.

### Error

- If venue core fetch fails:
  - Render a page-level error panel:
    - Title: `We couldn’t load this venue`
    - Body: `Check your connection and try again.`
    - Buttons: `Retry` + `Back to venues`

---

## Ratings

### Data model expectations (UI-only)

We display:

- **Average rating** (0.0–5.0)
- **Total ratings** (0+)
- **User rating** (null or 1–5)

### Loading

- While ratings data is loading:
  - Show star row in a “muted” skeleton state (no numbers).
  - Show a subtle shimmer placeholder where the text would be.
  - Do **not** show `0 ratings` or `No ratings yet` during loading.

### Empty (resolved, totalRatings = 0)

- Display: `0.0 · 0 ratings`
- Show CTA: `Rate this venue`
- Optional helper (small): `Be the first to leave a rating.`

### Success states

#### A) User has not rated

- Show `Rate this venue` link/button.

#### B) User has rated

- Replace CTA with: `You rated this ★★★★☆` (stars filled to userRating)
- Show `Change` link.

### Submitting (optimistic)

On submit:

1. Immediately set `userRating = selectedStars`.
2. Update displayed average/total optimistically:
   - If first time rating: `totalRatings + 1`.
   - If updating an existing rating: `totalRatings` unchanged.
3. Close picker instantly.
4. Do **not** block UI on the request.

### Submit error

If submit fails:

- Revert:
  - `userRating` back to previous value
  - `averageRating/totalRatings` back to previous values
- Toast: `Couldn’t save your rating. Please try again.`
- Keep the user in the same scroll position.

### Edge cases

- If the user is signed out: clicking Rate shows auth prompt pattern (existing app behavior).
- If the average is not available but totalRatings > 0 (should not happen): display `—` for average and keep the count.

---

## Venue Record

### Loading

- Skeleton card with:
  - Trophy icon placeholder
  - Weight line placeholder
  - Species line placeholder
  - Image block placeholder

### Empty

- Copy:
  - Title stays: `Venue Record`
  - Body: `No venue record yet — be the first!`
  - CTA (if available in current UI): `Log a catch`

### Error

- Inline card:
  - `Venue record unavailable`
  - `Retry`

---

## Stats & Records

### Loading

- Render the stat grid with all tiles in skeleton state.

### Empty

- If stats depend on catches and there are none:
  - Show tiles with neutral values:
    - `0` catches
    - `—` top species
    - `Quiet` activity (or `—` if you want to avoid implying activity)
  - Small helper: `Stats will appear once catches are logged.`

### Error

- Inline section message:
  - `Stats unavailable`
  - `Retry`

---

## About

### Loading

- 3–4 lines of skeleton text.

### Empty

- Copy: `No description yet.`
- Optional (if owner/admin tools exist): `Add venue description` link (only if already supported).

### Error

- `About section unavailable` + `Retry`

---

## Plan Your Visit / Quick Facts

### Loading

- Render layout skeleton (headings + 2 columns on desktop, stacked on mobile).

### Empty

- If fields are absent, show only what exists.
- If nothing exists:
  - `Details coming soon.`

### Error

- `Visit details unavailable` + `Retry`

---

## Map (full-width)

### Loading

- Render a fixed-height block:
  - `h-[300px] md:h-[400px]`
  - Skeleton background (no iframe until ready).

### Empty

- If no lat/lng / address available:
  - Title stays: `Location`
  - Copy: `Location details coming soon.`
  - Hide the map container entirely.

### Error

- If iframe fails (or map blocked):
  - Show address (if available) and a button:
    - `Open in Google Maps`
  - Otherwise:
    - `Map unavailable`
    - `Try again` / `Open in Google Maps` (if link can be formed)

---

## Community (Recent catches / Leaderboard)

### Loading

- Skeleton grid of cards:
  - Mobile: 3 stacked cards
  - Desktop: 6 cards (2×3)

### Empty

- Copy:
  - Title: `Recent Catches`
  - Body: `No catches logged yet.`
  - CTA: `Log the first catch`

### Error

- `Couldn’t load catches` + `Retry`

### Pagination / tabs

- When switching tabs:
  - Keep tab header stable.
  - Show a lightweight inline spinner/skeleton for the grid.

---

## Events

### Loading

- Skeleton list of 2–3 event cards.

### Empty

Choose one of these behaviors (keep consistent across venues):

- **Option A (preferred):** Hide the entire Events section.
- **Option B:** Show minimal empty card:
  - `No upcoming events.`

### Error

- `Events unavailable` + `Retry`

---

## Toast + messaging copy

Use consistent short copy:

- Success (optional): `Saved.`
- Rating fail: `Couldn’t save your rating. Please try again.`
- Generic fail: `Something went wrong. Try again.`

---

## Acceptance criteria

- No section shows empty-state copy while still loading.
- Ratings never flash `No ratings yet` during load.
- After rating submit, hero immediately shows `You rated this X stars`.
- Errors are isolated to sections; the page remains usable.
- All Retry buttons work without forcing a full refresh.

---

## Manual test checklist

1. **Cold load (slow network):** no empty flashes; skeletons appear.
2. **0 ratings venue:** shows `0.0 · 0 ratings` + Rate CTA.
3. **Submit rating:** UI updates immediately; no refresh required.
4. **Submit rating failure:** UI reverts and toast appears.
5. **No record / no catches:** correct empty cards + CTAs.
6. **Map missing data:** no blank iframe; shows “coming soon”.
7. **Section fetch failure:** section shows inline error + Retry.
