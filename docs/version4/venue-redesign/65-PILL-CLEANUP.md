# Phase C — Pill Cleanup

## Purpose

Reduce visual noise and remove duplicate / low-value pills across the venue page. Pills (badges/chips) should only be used for **dynamic, categorical, or status** information.

This phase is primarily **UI refactor / presentation** and should be safe to ship incrementally.

---

## Scope

**In scope**

- Audit **all pills/badges/chips** on the venue page.
- Remove pills used for basic metadata (e.g., location) and replace with cleaner patterns.
- Replace facility/pricing “pills everywhere” with **icon + text** rows.
- Enforce discipline: **max 2–3** “key fact” chips in the About section.

**Out of scope**

- Any changes to Supabase tables, RLS, RPCs, or data-fetch logic.
- Any re-ranking or new computations of stats.

**Non-negotiables**

- **UI only** (React/TS/Tailwind). No backend work.
- Must preserve existing data flows: do not modify RPC calls, hooks, query keys, etc.

---

## Pill Discipline Rules

### Allowed uses (✅)

Pills are only permitted for:

- **Event type** (Competition / Open Day, etc.) — _max 1 pill per event card_
- **Catch tag** (Venue Record / PB / Competition Winner) — _max 1 pill per catch card_
- **Dynamic status** (Open Now / Closed / Limited Spots) — _max 1 status pill_

### Not allowed (❌)

Do **not** use pills for:

- Location (e.g., “Devon, UK”) — this is metadata
- Facilities (Toilets / Café / Bait Shop)
- Pricing (From £40/day)
- Species names
- General “key facts” beyond **2–3 max**

---

## Key UI Decisions

### 1) Remove the location pill

**Why:** it duplicates hero/map metadata and reads like a category when it’s really just a descriptor.

**Replacement pattern:**

- Hero: show location as plain metadata line (icon + text)
- Map section: address/region lives near the map header (not as a pill)

**Acceptance check:** No location badge/pill appears anywhere on the venue page.

### 2) Facilities become icon + text

**Replacement pattern:**

- Use a compact wrap layout that reads like a “features list”, not tags.
- Example:

```tsx
<div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-700">
  <span className="flex items-center gap-1.5">
    <ToiletIcon className="w-4 h-4" /> Toilets
  </span>
  <span className="flex items-center gap-1.5">
    <CoffeeIcon className="w-4 h-4" /> Cafe
  </span>
  <span className="flex items-center gap-1.5">
    <ShoppingBagIcon className="w-4 h-4" /> Bait Shop
  </span>
</div>
```

### 3) Pricing becomes typography

**Replacement pattern:**

- Label (small/secondary) + value (strong). No badge.

```tsx
<h3 className="text-sm font-medium text-gray-500 mb-2">Tickets & Pricing</h3>
<p className="text-lg font-bold text-gray-900">From £40/day</p>
```

### 4) About section chips: maximum 2–3

**Rule:** If the About section currently has many chips, compress down to the most valuable 2–3.

**Good examples:**

- “4 Lakes”
- “All levels welcome”
- (Optional) “Day tickets” / “Coaching available”

---

## What to Audit

Search for these patterns on the venue page and its child components:

- `<Badge ...>` usage
- Any “pill” style spans/divs (e.g., `rounded-full`, `px-3 py-1`, `bg-*-100`, `text-*-800`)
- Any components named like `Badge`, `Chip`, `Tag`, `Pill`

Create a quick list of:

1. Where each pill appears
2. What data it represents
3. Whether it’s allowed (✅) or must be replaced (❌)

---

## Implementation Steps

### Step C1 — Inventory

- Identify every pill on the venue page.
- Categorize each as:
  - **Allowed** (event type / catch tag / status)
  - **Replace** (facility / pricing / location / general metadata)

### Step C2 — Replace pills with correct patterns

- Location → metadata line (icon + text)
- Facilities → icon + text list
- Pricing → label + value typography
- Species → plain text
- About chips → reduce to 2–3

### Step C3 — Re-check spacing and wrapping

- Ensure facilities wrap nicely on mobile (no overflow)
- Ensure long facility strings don’t break the layout
- Ensure text remains scannable (no “tag soup”)

### Step C4 — Enforce “max 1 pill per item”

- Catch cards: only one tag pill (Venue Record OR PB, etc.)
- Event cards: only one type pill
- Status: only one status pill

---

## Manual Test Checklist

### Visual regression

- No “pill wall” effect remains.
- Venue page feels lighter and more editorial.

### Mobile

- Facility list wraps without pushing content off-screen.
- Touch targets remain large enough (44px for interactive items).

### Desktop

- Typography hierarchy remains intact.
- Pills are only used where allowed.

### Accessibility

- Icons are decorative unless they convey unique meaning.
- Ensure sufficient contrast for any remaining badges.

---

## Acceptance Criteria

- ✅ **No location pill** anywhere (hero/location metadata handled as text).
- ✅ Facilities are **icon + text**, not badges.
- ✅ Pricing is **typography**, not badges.
- ✅ About section contains **max 2–3** chips.
- ✅ Remaining pills are only:
  - Event type (max 1 per event)
  - Catch tag (max 1 per catch)
  - Status (max 1)

---

## Notes / Edge Cases

- If there are **no facilities**: show “Facilities: Not listed” (plain text) rather than placeholder pills.
- If pricing is unknown: show “Pricing: Not listed” (plain text).
- If an event has multiple categories: choose the single best label (e.g., “Competition”).

---

## Codex Prompt Template

Copy/paste this into Codex:

> **Task:** Implement Phase C — Pill Cleanup for the venue page.
>
> **Constraints:** UI-only. Do not modify Supabase migrations/RPCs/data-fetch logic. Preserve existing hooks and queries.
>
> **Goal:** Reduce pill usage across the venue page. Pills are only allowed for event type, catch tag, and dynamic status (max 1 per item). Remove location pill, replace facilities with icon+text, replace pricing pills with typography, limit About chips to max 2–3.
>
> **Deliverables:**
>
> 1. Audit list: every pill location + decision (keep/replace)
> 2. Code changes implementing replacements
> 3. Before/after screenshots (or brief notes) for mobile + desktop
> 4. Summary of files changed
