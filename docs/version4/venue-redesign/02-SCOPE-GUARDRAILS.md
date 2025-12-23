
# Scope & Guardrails

This document defines what **is** and **is not** allowed in the Venue Redesign work (v4), so we can iterate quickly without breaking data flows.

## Goal
Deliver a Venue page UI redesign that:
- Improves hierarchy, consistency, and mobile UX
- Reduces “boxy” layouts and unnecessary pills
- Moves **ratings/reviews UI into the hero** and fixes the **post-submit flash / stale state** via safe UI patterns
- Makes the **map full-width** (edge-to-edge) as a visual break

## Non‑negotiable constraints
### UI-only changes
- ✅ Allowed: React components, layout, styling (Tailwind), copy, spacing, responsive behavior, client-side state.
- ❌ Not allowed: any database work (migrations), RLS, RPC changes, new Postgres functions, schema changes.
- ❌ Not allowed: changing existing Supabase query logic, hooks, or data contracts unless explicitly approved in a separate plan.

### Data safety
- Do **not** change which RPCs/queries are called, their parameters, or their return shapes.
- Do **not** introduce new derived backend calculations.
- Any “new” values (e.g., optimistic rating counts) must be computed **client-side** and must gracefully reconcile when real data loads.

### Minimal surface area
- Prefer localized changes in `src/pages/VenueDetail.tsx` (or equivalent) and new small presentational components.
- Avoid wide refactors, file moves, or renames during this phase.
- No new global state solutions (Redux/Zustand/etc.). Use local state + existing patterns.

## In scope
### A. Section header standardisation
- Introduce/standardise a single `SectionHeader` pattern.
- Remove blue/grey header backgrounds and inconsistent typography.

### B. Hero + Ratings/Reviews
- Ratings are rendered **inline in the hero**, not a separate card.
- Implement a robust UX for:
  - Not-yet-rated users (“Rate this venue”)
  - Already-rated users (“You rated this X stars”)
  - Optional “Change” flow (opens picker)
- Fix the “No ratings yet until refresh” issue via:
  - Optimistic UI (local state) **or**
  - Immediate UI reconciliation after submit (re-fetch using existing hooks) **without** changing backend.

### C. Pill clean-up
- Keep pills only for categorical/dynamic labels (events type, catch tags, status).
- Replace facilities/pricing/meta pills with icon+text or plain text.

### D. Map full-width
- Map iframe/container bleeds to screen edges.
- Keep section header padded; only the map container goes full width.

### Light structural polish
- Spacing, section order, responsive grids, empty-state copy, skeletons.

## Out of scope
- Any backend/database changes (migrations/RPC/RLS/views).
- Rebuilding feed/leaderboard logic, pagination strategies, or comment threading.
- New moderation systems or image verification pipelines.
- New analytics/telemetry.
- Rewriting routing/auth or moving to a new app framework.

## Quality guardrails
### Accessibility
- Maintain semantic headings (H1 → H2 → H3).
- Preserve keyboard navigation and visible focus states.
- Ensure contrast is readable (especially hero overlay).

### Performance
- No large new dependencies.
- Avoid heavy re-renders in the hero and ratings picker.
- Keep images responsive and avoid layout shift.

### Visual discipline
- Max **2** banded/background sections on the page.
- Avoid nested “cards inside cards”.
- Use borders/shadows sparingly.

## How we will implement (rules of engagement)
1. **Codex writes all code**. GPT provides plans/prompts/reviews.
2. Each phase has its own doc (A/B/C/D). Work strictly in phase order unless a blocker requires a detour.
3. Every PR-sized change must:
   - List files changed
   - Note what is intentionally untouched
   - Include a quick manual test checklist

## Definition of done (for this phase)
- Venue page matches the v4 spec for:
  - Consistent section headers
  - Hero-integrated ratings with no stale “No ratings yet” flash
  - Reduced pills
  - Full-width map
- No backend changes.
- No regressions to existing venue page features (catches list, stats, actions, etc.).

## Risks & mitigations
- **Optimistic rating drift**: UI shows new average/count before server confirms.
  - Mitigation: keep optimistic UI minimal and reconcile on next successful fetch; on error revert and toast.
- **Hero overlay readability**: venue photos may reduce contrast.
  - Mitigation: enforce dark overlay + test across breakpoints.
- **Layout regressions**: removing boxes can break spacing.
  - Mitigation: use a consistent section spacing utility and test on mobile first.

## Open questions (track in `01-TRACKER.md`)
- Do we allow “Change rating” immediately, or lock edits after submit?
- Which sections are the two banded sections (Community + Events by default)?
- Do we hide Events entirely when empty, or show a minimal empty-state?