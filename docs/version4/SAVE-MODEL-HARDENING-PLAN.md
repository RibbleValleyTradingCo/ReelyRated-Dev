# Save Model Hardening Plan

## Purpose

We are standardizing save behavior across AdminVenueEdit and MyVenueEdit to reduce missed saves, prevent lost input, and make outcomes consistent while preserving DB-first correctness and existing data shapes.

## Current State Snapshot (source: `docs/save-model-report.md`)

- Section save: Facilities / Pricing & Tickets / Contact & Handoff (shared metadata RPC)
- Row-save: Species, Pricing Tiers, Opening Hours
- Action-based: Photos upload/delete/primary, Booking toggle, Owners add/remove
- Explicit editor: Events, Rules

## Target Save Taxonomy (Option 2: Explicit section commits)

Categories:

- Section Commit (preferred)
- Action-based (immediate, intentional)
- Explicit editor (events/rules)

Section mapping:

- Section Commit: Facilities, Pricing & Tickets, Contact & Handoff, Species, Pricing Tiers, Opening Hours
- Action-based: Booking toggle, Photos (upload/delete/primary), Owners (admin-only add/remove)
- Explicit editor: Events, Rules

## Key decisions for Phase 1

### Row-save UX → Section Commit UX

Decision: **Replace row-level Save UX with a single section-level commit** for Species / Pricing Tiers / Opening Hours.

- UI: remove/avoid emphasis on per-row Save buttons; the section footer contains the primary **Save** action.
- Under the hood (Phase 1): the section Save orchestrates the existing per-row RPCs **sequentially**.
- Reality check: Phase 1 cannot be atomic. Partial commits are possible; we must surface which rows succeeded/failed and preserve input.

### Standard section status model

Every section should expose a consistent status surface:

- **Clean** (no changes)
- **Dirty** (unsaved changes)
- **Saving…**
- **Saved** (only after a successful save)
- **Error** (save failed; show a short message + keep input)

### Deterministic refresh model after save

After a successful save/commit:

- Re-read authoritative data for that section (via existing card reload functions and/or existing React Query invalidations).
- Update local UI state from the refreshed canonical rows.
- Keep admin reads admin-only (no public RPC refreshes in admin flows).

### Metadata coupling mitigation (important)

Today, a single metadata RPC writes fields spanning multiple visible sections.
Phase 1 must ensure that clicking **Save** in one metadata section does **not** accidentally persist stale values from other sections.

Rules:

- Treat Facilities / Pricing & Tickets / Contact & Handoff as one shared **Metadata group** for dirty tracking.
- If any field in the Metadata group is dirty, show the dirty indicator on all three sections.
- Any metadata Save commits the full, current Metadata group state (no hidden stale state).

## Phased Implementation Plan

### Phase 1 — UI-only hardening (no new RPCs)

Goals:

- Add section dirty tracking + “Unsaved changes” indicator.
- Shift row-save sections to a section-level Save UX (section Save orchestrates existing per-row RPCs sequentially; non-atomic in Phase 1).
- Add navigation/collapse guard for unsaved section changes.
- Standardize success refresh behavior (re-read authoritative data + existing invalidations).

Acceptance criteria:

- Dirty states are visible per section and cleared only on successful saves.
- Section Save triggers per-row RPCs in order and preserves user input on failures.
- If some row RPCs fail, the UI clearly reports which rows failed and which rows saved (partial commits possible in Phase 1).
- Navigation/collapse guard prevents losing unsaved changes without confirmation.
- Standardize success refresh behavior: re-read authoritative data for the section and sync local state from canonical rows + keep existing invalidations.
- Admin and Manage behavior matches.

QA checklist:

- Edit Species/Pricing Tiers/Opening Hours → see Unsaved indicator → Save commits; on error, input preserved.
- Section Save does not change RPC names or query keys.
- Navigation away or accordion collapse prompts when a section is dirty.
- Admin and Manage behavior matches.

### Phase 2 — DB atomic commits (new migrations + bulk RPCs)

Goals:

- Add bulk upsert/replace RPCs for:
  - species stock
  - pricing tiers
  - opening hours (expanded rows payload)
- Implement Owner + Admin variants.
- Ensure transactional/atomic semantics.
- Return canonical rows for UI refresh.
- This is the phase where we guarantee **no partial commits** (transactional all-or-nothing writes).

Acceptance criteria:

- Single RPC per section commit; all-or-nothing writes.
- Canonical rows returned and used to refresh UI state.
- Admin/Owner parity verified for each new RPC.

QA checklist:

- Batch edits across multiple rows commit atomically (success or no change).
- Partial failure does not result in mixed writes.
- Returned rows match DB state and re-render without additional fetch.

### Phase 3 — Metadata coupling hardening (decision TBD)

Current risk: A single metadata RPC writes fields across multiple sections.

Options (document-only, TODO):

- Patch/partial update RPC (nullable fields treated as “no change”).
- Split RPCs by section (Facilities / Pricing / Contact).

Decision: TBD (do not assume implemented).

## Non-goals

- No changes to public `/venues/:slug` read model or React Query keys.
- No changes to existing data meaning/fields.
- No redesign of the venue detail page.

## Engineering Guardrails

- Maintain parity between `src/pages/AdminVenueEdit.tsx` and `src/pages/MyVenueEdit.tsx`.
- No new query keys unless absolutely required.
- Keep admin reads admin-only; do not refresh admin data using public RPCs.
- Preserve user input on failures.

## Task Tracker

### Phase 1 (UI-only)

- [ ] Implement standard section status model (Clean/Dirty/Saving/Saved/Error) in `src/pages/AdminVenueEdit.tsx`
- [ ] Implement standard section status model (Clean/Dirty/Saving/Saved/Error) in `src/pages/MyVenueEdit.tsx`
- [ ] Implement **Metadata group** dirty tracking (Facilities/Pricing/Contact linked) in `src/pages/AdminVenueEdit.tsx`
- [ ] Implement **Metadata group** dirty tracking (Facilities/Pricing/Contact linked) in `src/pages/MyVenueEdit.tsx`
- [ ] Wrap row-save cards with section-level Save orchestration in:
  - `src/pages/venue-owner-admin/components/SpeciesStockCard.tsx`
  - `src/pages/venue-owner-admin/components/PricingTiersCard.tsx`
  - `src/pages/venue-owner-admin/components/OpeningHoursCard.tsx`
- [ ] Add unsaved-change guard for accordion collapse/navigation in:
  - `src/pages/AdminVenueEdit.tsx`
  - `src/pages/MyVenueEdit.tsx`
- [ ] Standardize success refresh + invalidations in:
  - `src/pages/AdminVenueEdit.tsx`
  - `src/pages/MyVenueEdit.tsx`

### Phase 2 (DB atomic commits)

- [ ] Add bulk RPCs (owner/admin variants) in `supabase/migrations/*`:
  - species stock
  - pricing tiers
  - opening hours
- [ ] Update UI to call bulk RPCs in:
  - `src/pages/venue-owner-admin/components/SpeciesStockCard.tsx`
  - `src/pages/venue-owner-admin/components/PricingTiersCard.tsx`
  - `src/pages/venue-owner-admin/components/OpeningHoursCard.tsx`

### Phase 3 (metadata coupling)

- [ ] Decide between patch RPC vs split RPCs (documented only)
- [ ] If chosen, update RPCs in `supabase/migrations/*` and wire calls in:
  - `src/pages/AdminVenueEdit.tsx`
  - `src/pages/MyVenueEdit.tsx`

## Definition of Done

- Consistent UX across Admin + Manage.
- No lost input on failure.
- Clear save semantics per section.
- No partial commits once Phase 2 (atomic RPCs) is live.
- Public invalidations still work as-is.
