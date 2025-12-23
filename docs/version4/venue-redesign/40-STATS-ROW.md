# 40 — Stats Row

## Goal

Create a **Stats & Records** section that is **fast to scan**, **mobile-first**, and visually consistent with the venue redesign rules. This replaces any “boxy”/mixed styling stats widgets with a single, consistent grid.

This section should help an angler answer, at a glance:

- Is this venue active right now?
- What’s the headline activity and total engagement?
- What’s the top species being logged?

## Scope

### In scope (UI-only)

- Presentation/layout of the stats row/cards.
- Copy, labels, and formatting (numbers, pluralisation, fallback text).
- Responsive behaviour (2×2 on mobile, 4 across on desktop).
- Loading + empty + error UI states.

### Out of scope

- **No changes to data fetching, RPCs, or Supabase logic.**
- No changes to underlying “activity level” logic thresholds (unless already computed in the UI).
- No schema/migration work.

## Design requirements

### Layout

- Section uses standard header pattern:
  - H2: **Stats & Records**
  - Optional subtitle: “Recent activity and venue highlights” (only if needed for spacing/clarity)
- Cards:
  - **Mobile:** `grid grid-cols-2 gap-4` (2×2)
  - **Desktop:** `md:grid-cols-4`
  - All cards equal height.

### Card styling

- Use subtle neutral container styling (allowed):
  - Background: `bg-gray-50`
  - Border: `border border-gray-200` (optional but recommended if the page is very white)
  - Radius: `rounded-lg`
  - Padding: `p-4`
  - Centered text for quick scanning.

### Typography

- Value: large, bold
- Label: small, muted
- Avoid pills/badges inside these cards (unless the value itself is a “status”).

### Icons

- Consistent icon size: `w-5 h-5`
- Icons exist only to aid scanning, not decoration.

## Card definitions

We currently show four cards. Keep these four unless product decides otherwise.

### 1) Catches (30d)

- **Value:** integer
- **Label:** `Catches (30d)`
- **Fallback:** `—` if unknown

### 2) Top Species

- **Value:** species name (string)
- **Label:** `Top Species`
- **Fallback:** `—` (or `None yet` if we want friendlier copy)

### 3) Activity Level

- **Value:** `Quiet | Moderate | Busy`
- **Label:** `Activity Level`
- **Fallback:** `—`

**Important:** Activity thresholds should remain consistent with whatever the app currently uses. If the UI currently computes this from 30d count, use the existing thresholds:

- Quiet: 0–5 catches in 30 days
- Moderate: 6–15 catches
- Busy: 16+

### 4) Total Catches

- **Value:** integer
- **Label:** `Total Catches`
- **Fallback:** `—`

## Data wiring

- Do not introduce new queries.
- Consume whatever values already exist on the Venue page (or its hooks) and map them into these four display values.

### Formatting rules

- Numbers:
  - Use compact formatting for large totals if desired (e.g., `1,234`), but keep it simple and consistent.
- Pluralisation:
  - Optional: where copy appears outside cards, keep pluralisation correct (`1 catch` vs `2 catches`).

## UI states

### Loading

- Show a 2×2 skeleton grid on mobile (4 placeholders), 4 placeholders on desktop.
- Skeleton should match card shape (`rounded-lg`, `p-4`).

### Empty (no data)

Use this when values are genuinely unknown or missing (not just zero).

- Show cards with `—` values.
- Do not show error styling.

### Valid zero state

If the venue has **0 catches** in the relevant window:

- Show `0` for Catches (30d)
- Activity Level should read `Quiet`
- Top Species should be `—` / `None yet`
- Total Catches should be `0`

### Error

- Keep the layout stable.
- Show `—` and optionally a small, muted inline note below the grid:
  - “Stats unavailable right now.”

## Accessibility

- Cards should be readable at AA contrast.
- Icons are decorative; ensure they don’t become the only way to understand the card.
- Don’t put critical information solely in colour.

## Acceptance criteria

- Stats section uses the standard H2 header styling (no coloured headers, no header background boxes).
- Grid is **2×2 on mobile** and **4 across on desktop**.
- Cards look consistent and not “boxy”/inconsistent with the rest of the redesign.
- Loading/empty/error states do not shift layout dramatically.
- No pills introduced.
- UI-only: no changes to RPCs/data logic.

## Manual test checklist

1. **Mobile layout:** on narrow viewport, confirm 2×2 grid and equal-height cards.
2. **Desktop layout:** on `md+`, confirm 4 cards in one row.
3. **Loading:** confirm skeletons show and do not jump layout.
4. **Zero state:** venue with no catches shows `0` correctly and Activity Level = Quiet.
5. **Partial data:** missing Top Species does not break layout.
6. **Dark hero above:** ensure this section reads clearly after the hero and record card.

## Open questions / follow-ups

- Do we want `Top Species` to prefer last 30d, or all-time? (Use existing behaviour for now.)
- Should totals use compact formatting (e.g., 1.2k) or full formatting (1,234)?
- If we later add more stats (e.g., “PBs” / “Biggest fish”), do we keep 4 cards or allow a second row?
