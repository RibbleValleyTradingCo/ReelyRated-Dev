# Venue Redesign Implementation Tracker

This tracker is the execution checklist for the venue redesign spec.

- **Master spec:** `00-MASTER-SPEC.md`
- **Rule:** **UI-only changes** (no DB/RPC/migration changes). If anything requires backend work, log it under **Open Questions / Follow-ups** and stop.

## Status legend

- ⬜ Not started
- 🟨 In progress
- ✅ Done
- ⛔ Blocked
- 🧪 Needs testing

## Implementation order

1. **Phase A — Visual consistency (headers + spacing + pill discipline baseline)**
2. **Phase B — Hero + Ratings (optimistic UX + no flashing)**
3. Phase C — Record card, Stats row, About, Plan Your Visit
4. Phase D — Map full-width, Community band, Events band

---

## Work items

|  ID | Area                                           | Spec doc                | Status | Owner | Notes / link to PR/commit |
| --: | ---------------------------------------------- | ----------------------- | :----: | :---: | ------------------------- |
|  10 | Section headers + typography tokens            | `10-SECTION-HEADERS.md` |   ⬜   | Codex |                           |
|  20 | Hero + Ratings (inline, optimistic, edit flow) | `20-HERO-RATINGS.md`    |   ⬜   | Codex |                           |
|  30 | Venue record card                              | `30-RECORD-CARD.md`     |   ⬜   | Codex |                           |
|  40 | Stats row (2×2 mobile, 4-col desktop)          | `40-STATS-ROW.md`       |   ⬜   | Codex |                           |
|  50 | About section (mobile clamp + read more)       | `50-ABOUT.md`           |   ⬜   | Codex |                           |
|  60 | Plan Your Visit (Quick Facts)                  | `60-PLAN-YOUR-VISIT.md` |   ⬜   | Codex |                           |
|  70 | Map full-width break                           | `70-MAP-FULL-WIDTH.md`  |   ⬜   | Codex |                           |
|  80 | Recent catches / community band                | `80-RECENT-CATCHES.md`  |   ⬜   | Codex |                           |
|  90 | Upcoming events band                           | `90-UPCOMING-EVENTS.md` |   ⬜   | Codex |                           |

---

## Acceptance criteria checklist (high-level)

### Visual consistency

- [ ] All H2 section headers use identical styling (via `SectionHeader` component)
- [ ] No coloured text on headers
- [ ] No background boxes on section titles
- [ ] Pills used only for event types, catch tags, and status (max 1 per item)
- [ ] Max **2** banded background sections

### Hero & ratings

- [ ] Ratings integrated into hero (not a separate card)
- [ ] After submit: immediately show **“You rated this X stars”** (optimistic)
- [ ] No “No ratings yet” flash while loading/submitting
- [ ] “Change” allows editing rating
- [ ] Action buttons at bottom of hero (not sticky top-0)

### Responsive

- [ ] Mobile: hero readable, stats 2×2, catches single-column, map edge-to-edge, about clamps
- [ ] Desktop: stats 4-col, catches 3-col, about expanded, map edge-to-edge

### Code quality

- [ ] SectionHeader used everywhere (no bespoke H2 styling)
- [ ] RatingDisplay contains rating UI behaviour
- [ ] No hardcoded section styles outside the design system rules
- [ ] TypeScript interfaces for components

### Accessibility

- [ ] Keyboard nav works for all interactives
- [ ] Visible focus states
- [ ] Alt text for images
- [ ] Semantic headings (H1 → H2 → H3)

---

## Manual test log

Record what you tested and what you observed. Keep this short and factual.

| Date | Area | Environment | Result | Notes |
| ---- | ---- | ----------- | ------ | ----- |
|      |      |             |        |       |

---

## Open questions / follow-ups (do not implement here)

Log anything that:

- requires backend/RPC/DB changes
- needs a product decision
- is blocked by missing data (photos, events feed, etc.)

- [ ]

---

## Changelog

Summarise changes as they land.

- YYYY-MM-DD:
