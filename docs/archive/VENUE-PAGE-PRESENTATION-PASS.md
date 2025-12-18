# Venue Detail Page – Presentation Pass

This document describes a **presentation-only** refinement for the venue detail page.

Scope is limited to layout and styling for `src/pages/VenueDetail.tsx` (and, only if absolutely necessary, tiny shared presentation tweaks). **No changes to hooks, RPCs, data fetching, Supabase logic, or routing.**

The goal is to make the venue page feel cohesive with the Profile page and other core surfaces (Feed, Leaderboard), while keeping the existing behaviour exactly the same.

---

## 1. Hero – match the Profile hero

### Goals

- Make the venue hero feel like a “sister” to the Profile hero.
- Clear hierarchy: venue name → key stats → actions.
- Reduce the “washed out” look.

### Layout

- Use the same **dark gradient hero** treatment as the Profile page:

  - Reuse the outer container + background classes from the Profile hero (rounded, gradient, shadow).
  - Venue hero should span the main content width, just like the Profile hero.

- On **desktop**:

  - Two-column layout:

    - **Left column – Venue identity**

      - Breadcrumb row (small, muted):
        - `VENUES / Bewl Water, Kent`
        - Drop the standalone “VENUE” label; the breadcrumb is enough.
      - Venue name: large, bold, white – similar scale to profile name.
      - Meta row:
        - MapPin icon + `Kent, UK`.
        - A soft pill: `2 catches logged here` (dynamic count).
      - Description:
        - One or two short lines, softened copy, constrained max-width.
      - Actions row:
        - Two ghost/outline buttons grouped together at the bottom of the left column:
          - **View on maps** (primary ghost).
          - **Back to venues** (secondary ghost).
        - Buttons should visually match ghost/outline styles used on the Profile hero.

    - **Right column – Snapshot card**
      - A lighter navy, rounded card floating inside the hero (similar to stats cards on the Profile hero).
      - Title: `Snapshot`.
      - Rows:
        - `Best logged catch:` **12lb carp** (use existing `bestCatchLabel`).
        - `Most active angler:` avatar + username chip (clicks through to profile).
      - On small datasets where there’s no best catch or angler, show graceful placeholders (e.g. `—` or “No catches yet”).

- On **mobile**:
  - Stack hero content vertically:
    - Breadcrumb + venue name + meta.
    - Snapshot card full-width below the text.
    - Actions row below the snapshot.

---

## 2. Top anglers at this venue

### Goals

- Avoid a single card floating in the centre.
- Make the section read clearly as a “strip” of notable anglers.

### Layout & styling

- Section heading:

  - Title: `Top anglers at this venue`.
  - Subtitle: `Based on catches logged on ReelyRated.` (already exists; keep it).
  - Left-aligned, matching the heading pattern used on the Profile page (`Angler stats`, `Your catches`).

- Card layout:

  - **Desktop**:
    - Simple left-aligned grid (1–3 columns depending on viewport).
    - If there is only a single angler, their card sits on the left rather than centered.
  - **Mobile**:
    - Horizontal scroll row with `scroll-snap`, first card starting flush with the content edge.

- Card content:

  - Left side: Rank pill (`#1`, `#2`, `#3`) for all.
  - Middle: avatar + username, with:
    - `X catches logged` line.
    - `PB 12lb` line in smaller text.
  - Right side (desktop): small “View profile” link or chevron.
  - The top angler card (#1) gets a slightly stronger border or tinted background for emphasis; others stay plain white.

- Empty state:
  - If there are no top anglers, keep a simple, subtle empty-state message aligned with the section header (no giant empty card).

---

## 3. Top catches – align with the main Leaderboard

### Goals

- Make this section visually consistent with the main Leaderboard page.
- Emphasise rank and weight clearly.

### Layout & styling

- Section header:

  - Small eyebrow label `LEADERBOARDS`.
  - Title: `Top catches`.
  - Subtitle: `Heaviest catches logged at this venue.`

- Card container:

  - Single white card with rounded corners, soft border, and small shadow (like other dashboard cards).

- Each row:

  - **Left stack**:
    - Rank pill (`#1`, `#2`, …) matching the homepage leaderboard style.
    - Directly below the pill, bold **weight** (`12lb`).
    - Below weight, species in muted text (`carp`).
  - **Middle block**:
    - Avatar + username.
    - Below or beside:
      - Venue chip can be omitted or deemphasised (we’re already on a venue page; avoid redundancy).
      - Date shown as a smaller line (e.g. `25/11/2025`).
  - **Right block**:
    - `View catch` pill button, matching the existing leaderboard buttons.

- Styling details:

  - First row (#1) gets a subtle highlight:
    - Slightly tinted background or left-side accent bar.
  - Light dividers between rows, consistent with leaderboard.

- Empty state:
  - If there are no top catches, show a short message inside the card like:
    - “No catches logged at this venue yet. Be the first to add one.”

---

## 4. Section boundaries & background

### Goals

- Reduce the sense of “white fog”.
- Make it easy to scan the page.

### Structure

- Keep the overall page background as the existing pale grey.
- Wrap each major section in its own **white card**:
  - Section: `Top anglers at this venue`.
  - Section: `Top catches`.
  - Section: `Recent activity`.
- Each card should:
  - Use the same radius, border, and shadow style as Profile’s “Angler stats” and “Notifications” cards.
  - Use consistent top/bottom padding and spacing between heading, content, and controls.

---

## 5. Recent activity (recent catches)

### Goals

- Maintain consistency with other catch grids.
- Make the section framing clear.

### Layout

- Section header:

  - Eyebrow label: `RECENT ACTIVITY`.
  - Title: `Recent catches`.
  - Subtitle: `Latest logs from this venue.`

- Content:
  - Reuse existing catch cards and grid behaviour; no logic changes.
  - Consider a ghost link or button aligned with the header (for future use) like:
    - `View all catches from this venue` (even if it just anchors for now).

---

## 6. Constraints

- **Presentation only**:

  - Do not change:
    - Supabase RPC functions.
    - SQL/migrations.
    - Data fetching hooks.
    - Notification/moderation logic.
    - Route structure.
  - Do not add, remove, or reorder React hooks in `VenueDetail.tsx`.

- Changes are limited to:
  - JSX structure/layout inside `VenueDetail.tsx`.
  - Tailwind/CSS classes and minor text copy.
  - Very small presentational helper functions if needed (no side effects, no new Supabase calls).

Before committing, verify:

1. Venue detail page builds and loads without errors.
2. All data still appears as before (top anglers, top catches, recent catches).
3. Links still work:
   - Back to venues.
   - View catch.
   - Profile links.
   - View on maps.
