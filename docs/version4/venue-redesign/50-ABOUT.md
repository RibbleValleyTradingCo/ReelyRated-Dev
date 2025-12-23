# 50 About Section

## Goal

Make the **About** section clean, scannable, and consistent with the new venue page design system.

- Mobile-first: readable summary with an optional expand/collapse.
- Desktop: show full content by default.
- Avoid the “stacked boxes” look: **no card container** around the About body.

## Scope

**UI-only.**

✅ Allowed:

- Layout, typography, spacing, and component structure.
- Collapsible behaviour (client-side state only).
- 2–3 “Key Fact” chips maximum.

❌ Not allowed:

- Any changes to Supabase queries/RPCs.
- Any schema/migration changes.
- Any new backend-derived fields (use what is already available).

## Placement in Page Order

Per the master plan:

**Hero → Record → Stats → About → Plan Your Visit → Map → Community → Events**

## Content Rules

### What the About section should contain

- Primary description text (venue description / bio).
- Optional secondary paragraphs (rules, atmosphere, water features, access notes).

### What the About section must _not_ become

- A dumping ground for facilities/pricing/contact.
- A pill-wall.

Those belong in **Plan Your Visit**.

## Visual + Typography Specification

### Section header

Use the shared `SectionHeader` component.

- Title: `About this venue`
- Optional subtitle (if useful): short context line (e.g. “What to expect when you fish here”).

### Body text

- Use standard body typography (design system):
  - `text-base` / `leading-relaxed`
  - `text-gray-700`
- Paragraph spacing:
  - Each paragraph separated by `mb-4` (or equivalent).

### Key fact chips (max 2–3)

- Only include if you already have meaningful values.
- Examples:
  - “4 lakes”
  - “All levels welcome”
  - “Day tickets” (only if true and already present)

**Hard limit:** 3 chips. If you have more, they move into Plan Your Visit rows.

Chip styling:

- Light, non-dominant: `bg-blue-50 text-blue-700 rounded-full text-sm font-medium`
- Optional icon + label.

## Behaviour

### Collapsible on mobile

- Default collapsed on mobile.
- Collapsed state should show **~4 lines** (use `line-clamp-4` if available).
- Provide a toggle button:
  - Collapsed label: `Read more`
  - Expanded label: `Show less`

### Desktop behaviour

- Default expanded.
- Hide the “Read more / Show less” toggle on desktop.

### Interaction design

- Button style: simple text button, consistent with the design system.
- Ensure the toggle does **not** cause layout jumpiness beyond expected content expansion.

## Empty / Loading / Error States

Do not show “boxy” placeholders; keep layout stable.

### Loading

- If About text is part of the page data already, no special loader needed.
- If About text loads asynchronously today, show:
  - A short skeleton block (2–3 lines) with stable spacing.

### Empty

If there is no about text:

- Show a calm empty state (no card):
  - Title remains.
  - Body: `No description has been added for this venue yet.`
- Optional CTA (only if it already exists elsewhere):
  - `Suggest an edit` / `Add venue details` (UI-only; do not introduce new backend flows here).

### Error

If the page fails to load About text:

- Show: `We couldn’t load the venue description.`
- Provide a retry only if a retry mechanism already exists.

## Accessibility

- Toggle must be a `<button>` with clear label text.
- Ensure keyboard focus styles are visible.
- If using line-clamp, ensure screen readers still access the full content when expanded.
- Semantic structure: H2 for section header, paragraphs for body.

## Acceptance Criteria

- About section uses `SectionHeader` (no bespoke header styling).
- No card/box wrapper around About content.
- Mobile: collapsed by default with `Read more` toggle; expands/collapses reliably.
- Desktop: expanded by default; toggle hidden.
- Key facts: maximum 3 chips; no pill sprawl.
- Empty state is calm, on-brand, and not a “noisy” warning.

## Manual Test Checklist

- Mobile:
  - About shows 4-ish lines and a `Read more` button.
  - Expanding reveals full text; collapsing returns to 4-ish lines.
  - Toggle is reachable and usable via keyboard.
- Desktop:
  - About is fully visible without interaction.
  - No toggle shown.
- Content:
  - Paragraph spacing looks consistent.
  - Key fact chips never exceed 3.
- Edge cases:
  - Empty about text renders the empty state message.
  - Very long about text remains readable and doesn’t overflow.

## Notes / Follow-ups

- If we don’t currently have consistent paragraph formatting (e.g. newline handling), handle it UI-side without changing data sources.
- If `line-clamp` isn’t in the Tailwind config, implement a safe alternative (e.g. max-height + fade) **but keep the same UX**.
