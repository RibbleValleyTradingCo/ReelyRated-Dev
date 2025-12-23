# Phase B — Hero & Ratings

## Goal

Move venue ratings **into the hero** (as part of the venue’s identity) and fix the current rating UX issues:

- After submitting a rating, the UI should immediately show **“You rated this X stars”** (optimistic UI).
- The venue’s **average + count** should update immediately (optimistic) and then reconcile with the server.
- Never show a confusing **“No ratings yet”** flash after submitting.

This phase is **high-impact** and can be shipped independently of the wider page redesign.

---

## Scope

### In scope

- Hero layout updates to include:
  - H1 venue name
  - Inline rating summary (average + count)
  - User rating state (rate / rated + change)
  - Rating picker (modal/overlay)
  - Action strip at bottom of hero (Book / Call / Directions)
- Frontend state management for:
  - `userRating`
  - `averageRating`
  - `totalRatings`
  - rating submit → optimistic update → background save → reconcile
- Loading/empty states for ratings (0 ratings, unknown rating, etc.)
- Accessibility: keyboard controls, focus handling, ARIA labels

### Out of scope

- **No Supabase migrations, RPC changes, or schema changes.**
- No changes to how ratings are stored server-side.
- No broader page section redesign (Stats/About/Map/etc.) unless required for hero composition.

---

## Non‑negotiables

- Ratings are **not a separate card/box** section.
- Hero ratings must **not** introduce a “stacked boxes” feel.
- After rating submit, do **not** show “No ratings yet” while data re-fetches.
- Do not allow “free editing” of a rating inline.
  - Default state after rating: **“You rated this X stars”**.
  - Provide a **Change** link/button to re-open the picker.

---

## UX requirements

### 1) Hero rating summary

Displayed inline inside hero (white text), near the venue identity.

**Show:**

- Stars reflecting the **rounded** average (for visuals)
- Text showing the precise average: `4.2 · 12 ratings`

**If there are 0 ratings:**

- Show `0.0 · 0 ratings`
- Show “Rate this venue” CTA
- Never show “No ratings yet” as a primary UI state

### 2) User rating state

- If the user has not rated:
  - CTA: **Rate this venue**
- If the user has rated:
  - Show: **You rated this** + star row
  - Provide **Change** action to open picker

### 3) Rating picker interaction

- Triggered from “Rate this venue” or “Change”.
- Uses a modal/overlay (recommended) so it feels intentional.
- Must be:
  - keyboard accessible
  - focus-trapped
  - dismissible via ESC and Cancel
  - closes on successful submit

### 4) Optimistic update policy

On submit:

1. Immediately update UI state:
   - `userRating = selectedStars`
   - `totalRatings` increments only if this is a **first rating** (not an edit)
   - `averageRating` updates optimistically
2. Fire the existing submit call.
3. On success:
   - Reconcile by refetching ratings summary + user rating (or invalidating query cache).
4. On failure:
   - Revert UI to previous values
   - Toast: “Failed to submit rating. Please try again.”

**Important:** Keep optimistic UI local to the venue page state to avoid flicker.

---

## Implementation plan

### Step 1 — Identify current rating sources

Document (in code comments) where these currently come from:

- Average rating + count
- User’s rating (if logged in)
- The submit function

**Constraint:** Do not change backend calls; only change frontend wiring and UI.

### Step 2 — Add local rating state (single source of truth)

On the venue detail page component (or a dedicated hook), hold:

- `averageRating: number`
- `totalRatings: number`
- `userRating: number | null`
- `ratingStatus: 'idle' | 'submitting' | 'error'`

Initialize from whatever existing data is already fetched.

### Step 3 — Build `RatingDisplay` component

Create a focused component that:

- Renders average + count
- Renders user rating state
- Opens the picker
- Calls `onRatingChange(stars)`

**Keep the API call outside the component** (page or hook owns the mutation).

### Step 4 — Wire optimistic mutation

Use whichever pattern the app already uses (React Query, SWR, custom hooks):

- Apply optimistic update
- Call submit
- Invalidate/refetch on success
- Revert on error

If you’re using React Query:

- Prefer `useMutation` with `onMutate / onError / onSettled`

### Step 5 — Place rating display in hero

Update hero markup:

- Venue name (H1)
- Location text line (plain text, not a pill)
- Inline ratings row (new)
- Action strip at bottom of hero

**Action strip rule:**

- Not sticky `top-0`.
- Positioned at bottom of hero (white/blur background is OK).

---

## Optimistic average calculation

We don’t want a complex client-side average reconstruction.
Use a simple pragmatic approach:

- If the user is rating for the first time:
  - `newAvg = (avg * count + stars) / (count + 1)`
  - `newCount = count + 1`
- If the user is changing an existing rating:
  - `newAvg = (avg * count - oldStars + stars) / count`
  - `newCount = count`

Always refetch afterward to reconcile with the server.

---

## Loading & empty states

### While ratings summary is loading

- Render stars in a neutral state + text placeholder
- Avoid “No ratings yet” unless the real count is 0

### While user rating is loading

- Render average summary
- Render “Rate this venue” disabled or skeleton until user rating is known

---

## Accessibility checklist

- Stars are buttons with:
  - `aria-label="Rate X stars"`
- Modal:
  - focus trap
  - ESC closes
  - initial focus on heading or first interactive element
  - returns focus to the trigger
- Visible focus rings for keyboard users
- Sufficient contrast for text over hero image (keep overlay)

---

## Manual test checklist

### Logged out

- See `0.0 · 0 ratings` (or correct summary)
- See “Rate this venue” → prompts auth flow if required (existing behaviour)

### Logged in — no existing rating

- Tap “Rate this venue” opens picker
- Select stars + submit
- Immediately shows “You rated this X stars”
- Average + count update immediately
- No “No ratings yet” flash
- Refresh page: rating persists

### Logged in — existing rating

- See “You rated this X stars”
- Click Change → opens picker
- Submit new rating
- UI updates immediately
- Count does not increase

### Failure / offline

- Simulate API failure
- UI reverts to previous values
- Error toast shows

### Keyboard

- Tab to Rate/Change
- Open picker
- Select rating
- Submit
- Focus returns to trigger

---

## Acceptance criteria

- Ratings are visually integrated into hero (no separate rating card).
- Post-submit UI immediately reflects the new rating without requiring refresh.
- No “No ratings yet” flash after submit.
- User cannot continuously edit inline; only via Change.
- No backend changes.

---

## Codex prompt template

Copy/paste this into Codex:

> You’re working in ReelyRatedv3.
>
> Task: Implement Phase B (Hero & Ratings) as described in `docs/version4/venue-redesign/B-HERO-RATINGS.md`.
>
> Constraints:
>
> - UI-only. Do not modify Supabase migrations/RPCs/schema.
> - Keep existing data sources; adjust only frontend state/invalidations to eliminate the “No ratings yet” flash and to show optimistic updates.
>
> Requirements:
>
> - Move ratings into the hero (no separate rating box).
> - After submit: immediately show “You rated this X stars” and update average/count optimistically.
> - Support changing an existing rating via a Change action.
> - Add a modal picker that is accessible (ESC, focus trap, ARIA).
>
> Deliverables:
>
> - Updated hero UI
> - New/updated `RatingDisplay` component (if needed)
> - Summary of changes + where to manually test
