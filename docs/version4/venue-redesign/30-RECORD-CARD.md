# 30 Record Card

## Purpose

Make the **Venue Record** feel like a flagship “achievement” element on the venue page.

- Visually prominent (gold/amber accent)
- Not boxy/heavy (clean, tasteful)
- Mobile-first layout with graceful fallback states

This doc defines the UI + behaviour for the Venue Record section.

---

## Scope

### In scope

- UI layout + styling for the Venue Record section
- Responsive behaviour (mobile/desktop)
- Display logic for:
  - Record exists
  - Record missing
  - Record loading
  - Record error

### Out of scope

- **No new DB schema, migrations, or RPC changes**
- No new ranking logic on the backend
- No new moderation flows

---

## Placement in page order

**Hero → Record → Stats → About → Plan Your Visit → Map → Community → Events**

The record card should appear immediately after the hero to set the tone (“this venue is special”).

---

## UX goals

- Communicates “the best fish landed here” in ~2 seconds.
- Encourages participation: “log a catch” if no record exists.
- Looks great even if the record has no image.

---

## Data expectations

We are **not changing data fetching** in this phase.

The UI should consume whatever the venue page already has available (or can already derive) for a “record catch”, typically:

- `weight_display` (e.g., `34lb 8oz`)
- `species_name`
- `catch_photo_url` (optional)
- `angler_display_name`
- `caught_at` / date
- `catch_id` (for linking)

If the current page already has a list of catches, the record can be the best catch in that dataset (as currently defined). If the current page already provides a “record catch” object, use it.

---

## Visual spec

### Card styling

- Subtle gradient background: `from-amber-50 to-orange-50`
- Border: `border-2 border-amber-400`
- Radius: `rounded-lg`
- Padding: `p-6` (mobile) / `md:p-6` (same is fine)

Avoid heavy shadows. A light border is enough.

### Header

- Trophy icon + “Venue Record” title
- Title uses **H3-like styling** (not a full section H2) because this sits inside its own section.

### Layout

**Mobile:** image stacks above text (or image left with fixed height if space permits)

**Desktop:** horizontal layout: image left, details right

### Image

- If available:
  - `object-cover`
  - Rounded corners `rounded-lg`
  - Suggested size: `w-full h-32` (mobile) and `md:w-32 md:h-32` (desktop)
- If missing:
  - show a placeholder block with a fish/trophy icon (no broken image)

---

## Content spec

### When record exists

Show:

- Primary: **weight** (largest text)
- Secondary: **species**
- Meta: “Caught by {angler} · {date}”

Optional:

- If we can link to the catch: a subtle “View catch →” link.

### When no record exists

Show friendly empty state:

- Title still: “Venue Record”
- Message: “No venue record yet — be the first!”
- CTA (if we already have an add-catch flow): “Log a catch”

If no CTA exists on this page, just show the message and keep it clean.

---

## Behaviour rules

- The record card should **never** shift the page layout unexpectedly during load.
- Prefer skeleton loading to avoid content jump.
- If a record loads late (after hero), fade in content instead of popping.

---

## States

### Loading

- Show a skeleton card with the same dimensions as the final card.
- Include a placeholder for:
  - image block
  - weight line
  - species line
  - meta line

### Empty

- Render the empty state card (not a blank section).

### Error

- Render a compact error state:
  - “Couldn’t load venue record”
  - Small “Retry” button **only if retry already exists in page patterns** (don’t introduce new infra).

---

## Implementation notes (UI-only)

- Prefer a dedicated component: `VenueRecordCard` (or similar)
- Keep it presentational:
  - Inputs are plain props
  - No new data fetching inside the component

Suggested props:

- `recordCatch: RecordCatch | null`
- `isLoading: boolean`
- `error: string | null`
- `onLogCatch?: () => void`
- `onViewCatch?: (catchId: string) => void`

Type example (adapt to your existing domain types):

```ts
type RecordCatch = {
  id: string;
  weightDisplay: string;
  speciesName: string;
  photoUrl?: string | null;
  anglerName: string;
  caughtAt: string; // ISO
};
```

---

## Acceptance criteria

- Record card is visible directly below the hero on mobile + desktop.
- Record card uses the gold/amber accent styling and does not feel “boxy”.
- Record-present state shows: weight, species, angler, date.
- Record-missing state shows: “No venue record yet — be the first!”
- Loading state uses a skeleton and prevents layout shift.
- Missing image never renders a broken `<img>`.

---

## Manual test checklist

- Mobile:
  - Card fits full width, no overflow.
  - Image stacks cleanly if needed.
- Desktop:
  - Horizontal layout, image left, content right.
- States:
  - Loading skeleton matches final dimensions.
  - Empty state is friendly and not cramped.
  - Error state readable and doesn’t break layout.
- Content:
  - Long species names don’t overflow.
  - Very large weight strings don’t wrap awkwardly.

---

## Open questions

- What is the current source of truth for “venue record”?
  - Existing record field/object?
  - Derived from catches already loaded?
- Should “View catch →” deep-link to the catch detail or open a modal?
- Do we want to highlight if the record is also a user’s PB (future enhancement)?
