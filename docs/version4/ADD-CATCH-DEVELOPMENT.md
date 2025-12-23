# Add Catch UI Development Plan (v4)

> UI-only guide for refining the Add Catch form. Do not change data fetching, validation, submit payloads, or any Supabase/RPC logic.

## Scope

- Presentation only: layout, spacing, grouping (accordion/wizard), typography.
- Keep all existing fields, handlers, validation rules, spinners/disabled states, and copy (except necessary heading labels).
- No new state beyond accordion open/close; no schema/API changes.

## Goals

- Make a clear “quick entry” lane for essentials.
- Move deeper detail into optional, tidy accordion sections.
- Remove duplicate headings and keep helper text short.
- Avoid noisy “Optional” UI chrome (no pills/chips); optionality should be communicated once via a short muted hint, if at all.
- Stay responsive and avoid navbar overlap on refresh.

## Recommended Structure

- **Page shell:** `PageContainer` + `SectionHeader` (title/subtitle) with the form inside a Card.
- **Quick entry (always visible):**
  - One “Quick entry” heading + brief helper (single line). Do **not** add additional subgroup headings inside the bordered panels (avoid duplicated titles).
  - Subgroup A: Catch basics (photo, title, species, weight/length/unit) — photo uploader prominent.
    - Present as a bordered/rounded panel **without** an internal title header (the page-level structure already communicates the grouping).
  - Subgroup B: Location & session (venue/location, peg/swim/depth, date/time, session, water type, GPS actions).
    - Present as a bordered/rounded panel **without** an internal title header (avoid “Location & Session” repeating).
  - Responsive grids: stack on mobile, two columns where natural on desktop.
- **Accordion for optional detail (default collapsed):**
  - Tactics & notes — method, bait, equipment, notes.
  - Your story — description.
  - Conditions — weather/air temp/clarity/wind.
  - Media — gallery photos, video URL.
  - Tags & privacy — tags, visibility, hide exact spot, allow ratings.
  - Trigger content: **title + short muted hint only**. Do **not** add “Optional” pills/chips.
  - The trigger title should be the **only** section title. Inside the expanded panel, avoid repeating headers like “Your Story”, “Media”, etc. Use a clean padded wrapper around the existing fields instead.
- **Submit block:** helper is muted/small; button at the bottom.

## Copy & Typography

- One heading per block; eliminate nested/duplicate titles.
- Muted, concise helpers (`Text`) with tight leading.
- Title case for section labels.
- Avoid repeating “Optional” (no pills/chips; don’t repeat in panel content). If needed, communicate optionality once via the trigger hint in muted text.

## Spacing & Layout

- Consistent `space-y` rhythms; avoid double padding.
- Quick entry subgroups in bordered/rounded panels for clarity.
- Panels should not contain their own headings if that causes duplicate titles; prefer whitespace + grouping over nested headers.
- Even padding inside accordion content; triggers left-aligned with small gaps.
- Mobile stacking first; desktop can use 2-col grids where it reads well.

## Behavior Requirements

- All handlers, validation, navigation, toasts, and spinner/disabled behavior remain unchanged.
- Accordion open/close is presentation only.

## Common pitfalls (from iteration)

- Avoid duplicated headings caused by nested wrappers (e.g., a group label plus an inner component label). Prefer a single source of truth for section titles.
- Avoid “optional” visual noise (chips/pills). Keep hints short and muted.
- Accordion triggers are the navigation: the expanded content should start immediately with fields (padded wrapper), not another header.
- Keep all field components/handlers unchanged; only move/wrap existing JSX.

## Testing Checklist

- `/add-catch` loads without navbar overlap.
- Minimal submission works with quick entry fields (as today).
- Optional sections still load options/spinners and submit correctly.
- No console errors; validation/toasts unchanged.
- `npm run build` passes.
