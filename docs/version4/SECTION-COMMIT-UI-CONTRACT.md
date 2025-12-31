# Section Commit UI Contract

This defines the shared UI contract for a “Section Commit” wrapper so **AdminVenueEdit** and **MyVenueEdit** implement identical save behavior and visuals across sections.

## Status

- Current implementation uses `renderSectionHeader` / `renderSectionFooter` in `src/pages/AdminVenueEdit.tsx` and `src/pages/MyVenueEdit.tsx`.
- This contract defines the Phase X target component + behavior.

## Open integration gaps

- Row‑save orchestration hooks (Species/Pricing tiers/Opening hours)
- Partial failure `statusMessage` semantics
- Discard/snapshot strategy
- Unsaved‑change navigation guard mechanism

## Goal

A Section Commit wrapper provides:

- Consistent **header + body + footer** layout
- A standard **status model** (Clean/Dirty/Saving/Saved/Error)
- Standard **events** for save, discard/reset, and unsaved-change guards
- Works with both:
  - **Section Commit** (single save for a whole section)
  - **Row-save orchestrated as section commit** (Phase 1: sequential per-row RPCs)

## Status model (source of truth)

`status` is always one of:

- `clean` — no unsaved changes
- `dirty` — unsaved changes exist
- `saving` — save in-flight
- `saved` — last save succeeded (optional auto-clear to `clean` allowed)
- `error` — last save failed (must preserve input)

### Display rules (must be consistent everywhere)

- If `status === "saving"`: disable Save/Discard controls, show spinner.
- If `status === "dirty"`: enable Save + show “Unsaved changes”.
- If `status === "error"`: show short error message + keep inputs unchanged.
- If `status === "clean"`: Save disabled (or hidden), no warning.

## Component contract

### Props

Required:

- `id: string`  
  Stable identifier for telemetry/debug and accordion guard (e.g. `"pricing_tiers"`).

- `title: string`
- `description?: string`  
  Optional helper copy under title.

- `status: "clean" | "dirty" | "saving" | "saved" | "error"`
- `statusMessage?: string`  
  Optional short message for `saved` or `error` (e.g. `"Saved"` / `"3 rows failed"`).

- `onSave: () => Promise<void>`
  Must throw or reject on failure so wrapper can move to `error`.
  Must not clear inputs on failure.

Optional:

- `saveLabel?: string` (default `"Save"`)
- `disableSaveWhenClean?: boolean` (default `true`)
- `hideSaveWhenClean?: boolean` (default `false`)

- `onDiscard?: () => void`
  Optional. If provided and section is `dirty`, show “Discard changes”.
  Discard should revert UI state to last canonical snapshot (or last loaded form state).

- `dirtyReason?: string`
  Optional short copy shown when dirty (e.g. `"Unsaved changes"`).

- `guidanceNote?: string`
  Optional note shown above footer actions (default copy allowed).

- `footerRightSlot?: ReactNode`
  Optional slot for extra controls (e.g. “Clear form” in Events) **but Save remains the primary CTA**.

- `canNavigateAway?: boolean`
  If `false` and `dirty`, wrapper should trigger a confirm flow in the page-level guard.

### Events / callbacks

The wrapper should raise (or allow the page to raise) these events:

- `onStatusChange?: (nextStatus) => void`
  If you centralize status in the parent, the wrapper can be stateless and just call this.

- `onDirtyChange?: (dirty: boolean) => void`
  Useful for accordion collapse guard + “global unsaved changes” banners.

- `onBeforeNavigate?: () => Promise<"allow" | "block">`
  Optional hook for route change / accordion collapse. If dirty, typically block unless user confirms.

## Visual structure (must be uniform)

Wrapper layout must be consistent across pages:

1. **Header**

- Title + description left
- Status chip right (Clean/Dirty/Saving/Error/Saved)  
  (Chip copy is owned by wrapper, not per-page ad hoc.)

2. **Body**

- Render children (the section’s existing form/cards)

3. **Footer**

- Guidance note (optional)
- Primary Save button on the right
- Optional Discard button on the left (only if `onDiscard` provided)
- Any extra actions in `footerRightSlot` (never above Save)

## Page-level integration rules (hard guardrails)

- Admin and Manage must use the same Section Commit component + same prop names.
- Save is only shown/enabled when it truly persists something:
  - Metadata sections: Save triggers existing metadata RPC
  - Phase 1 row-save orchestration: Save triggers sequential row RPCs
  - Action-based sections (Photos/Booking/Owners): no section Save (use status chip text only)
- Admin reads must be admin‑safe; if a public read is required later, add an admin‑safe read RPC.
- On save failure: preserve all user input and show error state.

## Minimal usage examples

### Section Commit (metadata)

- Parent owns form state for Facilities/Pricing/Contact.
- Parent sets `status = dirty` on any change in the Metadata group.
- `onSave` calls existing `admin_update_venue_metadata` / `owner_update_venue_metadata`.

### Section Commit (Phase 1 row orchestration)

- Wrapper surrounds existing row editor.
- Parent tracks “dirty” if any row is edited/added/deleted since last refresh.
- `onSave` loops through pending row ops sequentially (existing RPCs), reports partial failures in `statusMessage`.
