# 90 Upcoming Events

## Goal

Design and implement the **Upcoming Events** section on the venue detail page so it feels modern, scannable, and consistent with the venue redesign rules.

This section is one of the **maximum 2 banded sections** on the page and should provide a strong visual break while keeping a clean, non-boxy feel.

---

## Scope

### In scope

- UI-only redesign of the **Upcoming Events** area.
- Banded section styling (`bg-blue-50`) with consistent spacing.
- Event cards that are easy to scan on mobile and desktop.
- Show **up to 3 events** with an optional “View all events” affordance if more exist.
- Proper empty / loading / error states.

### Out of scope (guardrails)

- **No changes to Supabase** (no migrations, RPC changes, new tables).
- **No changes to event-fetching logic** beyond wiring existing data into the new UI.
- No complex animations, parallax, or heavy effects.

---

## Placement in page order

Target page flow:

1. Hero + ratings
2. Venue record
3. Stats row
4. About
5. Plan your visit
6. Full-width map
7. Recent catches (banded #1)
8. **Upcoming events (banded #2)**

---

## Visual rules

- This is **banded background #2**: use `bg-blue-50` for the section wrapper.
- The section header uses the standard H2 pattern (SectionHeader component).
- Event type is the **only pill/badge** allowed per event (max 1).
- Avoid additional nested “cards inside cards” feel:
  - Use a single clean card surface per event.
  - Keep borders subtle, avoid heavy drop shadows.

---

## Section layout

### Wrapper

- Full-width band with internal content aligned to page container.
- Recommended spacing:
  - `py-12` on the band
  - Inner container `px-4 md:px-6`

### Header

Use the standard header pattern:

- Title: `Upcoming Events`
- Subtitle: `Competitions, matches, and special sessions` (optional)

### Card list

- Vertical list (stacked) with spacing:
  - `space-y-4`
- Each event uses a white card:
  - `bg-white border border-blue-200 rounded-lg p-6`

### Card content

Each card should include:

1. Title (H3)
2. Date/time row with calendar icon
3. Type badge (right aligned)
4. Short description (2–4 lines, clamp on mobile if needed)
5. Actions:
   - Primary button: “Book event →” (if event has booking link / is bookable)
   - Secondary text action: “Learn more” (optional)

---

## Responsive behaviour

### Mobile

- Title and metadata stack naturally.
- Badge remains visible and does not squash text:
  - Badge should `shrink-0` and wrap layout if needed.
- Buttons should be thumb-friendly:
  - Minimum touch target ~44px height.
  - Prefer full-width primary button if space is tight.

### Desktop

- Same stacked list layout.
- Buttons can sit inline.

---

## Data expectations (UI wiring)

- Use existing event objects provided to the page.
- The UI should accept (at minimum):
  - `id`
  - `title`
  - `start_at` or equivalent date/time
  - `type` or `category` (string displayed in badge)
  - `description` (short)
  - optional links: `booking_url`, `details_url`

**Important:** If some fields don’t exist in the current data, do not invent them in the backend. The UI must degrade gracefully.

---

## Empty / loading / error states

### Loading

- Show a skeleton list of 2–3 placeholder cards inside the blue band.
- Avoid flashing “No events” while loading.

### Empty

Two acceptable behaviours:

1. **Hide the entire Events band** if there are no events.
2. Show a minimal empty state card:
   - “No upcoming events yet.”
   - Optional CTA: “Check back soon” (no new functionality required).

Choose whichever is more consistent with the rest of the page’s rhythm.

### Error

- Show a minimal inline message:
  - “Events couldn’t load right now.”
- Keep the band background (so layout doesn’t jump), but use a single simple card.

---

## Badge rules

- Exactly **one badge** per event:
  - Examples: `Competition`, `Open Day`, `Match`, `Workshop`.
- Badge styling:
  - `bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium`

No other pills on the card.

---

## Accessibility

- Ensure text contrast inside cards meets WCAG AA.
- Buttons/links must be keyboard focusable with visible focus states.
- If icons are decorative, mark them `aria-hidden`.
- Provide meaningful link text (avoid “Click here”).

---

## Implementation steps

1. Create/adjust a dedicated UI component for the events section (or keep inline if that’s the current pattern), but ensure it follows the shared design rules.
2. Wrap the section in `bg-blue-50 py-12` and align content to container.
3. Implement list rendering (cap at 3 events).
4. Add loading skeleton + empty + error states.
5. Ensure badge discipline and spacing consistency.
6. Manual test on mobile + desktop.

---

## Manual test checklist

- [ ] Section header matches all other H2 styling (SectionHeader).
- [ ] Background band is `bg-blue-50`, and this is the **second** (and last) banded section on the page.
- [ ] Each event renders as a single clean card (no nested boxy layers).
- [ ] Badge renders once per event and doesn’t cause layout overflow.
- [ ] Long titles and descriptions don’t break layout (wrap/clamp gracefully).
- [ ] Button targets are large enough on mobile.
- [ ] Loading state does not show “No upcoming events” while still fetching.
- [ ] Empty state is either hidden section or minimal “No upcoming events yet” card.
- [ ] Keyboard navigation works for all links and buttons.

---

## Open questions / follow-ups

- Do current event objects include a booking URL and/or details URL?
- Should we **hide the entire band** when empty, or keep a minimal empty state card for consistency?
- Should we show the date format as `SAT 27 DEC · 12:00–13:00` (design spec) or match your existing formatting utilities?
