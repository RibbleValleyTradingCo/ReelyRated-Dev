# 80 Recent Catches

## Purpose

Design + implement the **Recent Catches / Leaderboard preview** section on the venue detail page so it:

- feels consistent with the homepage “leaderboard/community” styling
- avoids a stacked-box/card-heavy feel (use whitespace + one banded section)
- keeps **all existing data flows** and Supabase RPC usage unchanged
- presents clear UI states (loading/empty/error)

This doc is part of **version4/venue-redesign** and should be executed **UI-only**.

---

## Scope

### In scope

- Create a single banded section (recommended: `bg-gray-50`) for community content.
- Add optional tabs for switching the preview mode:
  - **Recent** (default)
  - **Top 10**
  - **This Month**
- Render catch preview cards in a responsive grid.
- Add a bottom CTA: **View Full Leaderboard →** (or existing destination).
- Apply **pill discipline**:
  - Allow max **one** badge per catch card (e.g., `Venue Record` or `PB`).
  - No facility/pricing/species pills.

### Out of scope (guardrails)

- Do not create/modify Supabase migrations, RPCs, or database logic.
- Do not change how catches are fetched/filtered server-side.
- Do not change table schema, RLS, or any rate-limit logic.
- If “Top 10 / This Month” are not supported by existing queries, implement as **UI-only** switching against already-fetched data OR hide those tabs.

---

## Target placement and page flow

Recommended order (from the master spec):

1. Hero (with ratings)
2. Record card
3. Stats row
4. About
5. Plan your visit
6. Full-width map
7. **Recent Catches (this section)**
8. Events

This section should feel like the “community area” and can be one of the **maximum 2** banded sections.

---

## Layout and visual rules

### Section wrapper

- Use a full-width band:
  - `section.bg-gray-50.py-12`
  - Inner content uses standard page padding: `px-4 md:px-6`
- No header boxes. Use the standard H2 styling.

### Header block

- H2: `Recent Catches`
- Optional subtitle: “See what anglers are logging at this venue”

### Tabs (optional)

- Tabs are text-first, minimal, consistent with homepage.
- Pattern:
  - Row with bottom border.
  - Active tab has `border-b-2` + primary text.
  - Inactive tabs are gray, hover dark.

### Grid

- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns
- Spacing: consistent `gap-4`

### Card style

- Keep cards simple:
  - `bg-white`
  - `border border-gray-200`
  - small shadow on hover only (avoid permanent heavy shadows)
- Image: fixed height (`h-48`), cover, with meaningful `alt`.

### Badge / pill discipline

- Only allow badge for:
  - `Venue Record`
  - `PB`
- Max 1 badge per card.
- Do NOT add species/location as pills.

---

## Content model (what a card shows)

A catch preview card should show, in this order:

1. Photo (if available) OR photo placeholder
2. **Weight** (primary, bold)
3. Species (secondary)
4. Metadata row: angler name + date (and optionally “peg” if already present)
5. Optional single badge (Venue Record / PB)

### Text rules

- Weight should be the most prominent text within the card.
- Species should be plain text, not a pill.
- Date should be formatted consistently with the rest of the app.

---

## Behaviour

### Default

- Show **Recent** tab selected.
- Render a preview list (target: 6–9 items depending on current UX; follow existing behaviour if already defined).

### Tabs (if supported without new fetches)

- If the app already has all data necessary client-side, the tab switch should:
  - not trigger new RPCs
  - not change server-side filters
  - simply change the sort/filter applied in the UI

If tab behaviour requires server-side support that does not exist today, choose one:

- Hide unsupported tabs.
- Leave tabs visible but disabled with tooltip: “Coming soon”.

### CTA

- The CTA button at the bottom should:
  - be full width on mobile
  - navigate to the venue’s full catches/leaderboard view (existing route)
  - keep copy: **View Full Leaderboard →**

---

## UI states

This section must behave well for:

### Loading

- Use skeleton cards (preferred) OR a simple loading indicator.
- Skeleton should mimic:
  - image block
  - two text lines
  - metadata line

### Empty

If there are **no catches** for this venue:

- Show friendly empty state:
  - Title: “No catches logged yet”
  - Body: “Be the first to log a catch at this venue.”
  - CTA: “Log a catch” (only if existing flow exists)

### Error

- Display a compact error message with a retry action if retry is possible in UI.
- Don’t crash the page.

---

## Accessibility

- Tab buttons are keyboard navigable and have clear focus states.
- Ensure adequate contrast for tab active state.
- Images have alt text:
  - If photo exists: `alt="{species} caught at {venueName}"` (or closest available)
  - If no photo: `alt="No catch photo"`
- Ensure hit targets meet minimum tap size (~44px).

---

## Implementation notes (Codex)

### Likely files

(Exact filenames may differ—Codex should confirm.)

- Venue detail page component (e.g., `src/pages/VenueDetail.tsx`)
- Any existing leaderboard/catch grid components
- Shared UI components:
  - SectionHeader (if already created in this phase)
  - Badge (existing)

### Constraints reminder

- UI-only changes.
- Reuse existing hooks/data sources.
- If any new component is created, keep it colocated with venue components (consistent with repo conventions).

---

## Manual test checklist

- [ ] Section renders with `bg-gray-50` band and correct padding.
- [ ] H2 matches standard styling (no coloured header backgrounds).
- [ ] Cards render in 1/2/3 column layout at mobile/tablet/desktop.
- [ ] Card content order correct: image → weight → species → metadata → optional badge.
- [ ] Badge appears only when appropriate and max 1 per card.
- [ ] Loading skeleton shows (no layout jump when content arrives).
- [ ] Empty state appears with correct copy and optional CTA.
- [ ] Error state does not break the page.
- [ ] Tabs (if enabled) switch view without triggering new RPCs.
- [ ] CTA navigates to existing leaderboard/full catches view.
- [ ] Keyboard navigation works for tabs and CTA; focus visible.

---

## Open questions

- Do we already have a dedicated “full leaderboard” route for venues, or should CTA link to the venue catches list?
- Are “Top 10” and “This Month” currently available via existing data/hook output?
- What is the canonical date formatting in the app (relative vs absolute) for catch cards?
- Should we display “peg” metadata if present, or keep it out of the preview?
