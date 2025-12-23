# 60 Plan Your Visit

## Purpose

Define the **Plan Your Visit** section (previously “Quick Facts”) for the venue page redesign.

This section should:

- Make practical info easy to scan (pricing, contact, facilities, best for).
- Avoid the “boxed in” feel (no heavy card wrappers).
- Replace most pills with **icon + text** rows.
- Stay **UI-only**: present existing data without changing Supabase RPCs, queries, or business logic.

---

## Scope and guardrails

### In scope

- Layout and styling for the Plan Your Visit section.
- Icon + text treatment for facilities (no facility pills).
- Simple conditional rendering for missing fields (hide row, show fallback copy).
- One consistent H2 header via `SectionHeader`.

### Out of scope

- No database changes, migrations, RLS, RPC changes.
- No changes to data-fetching hooks or how venue data is retrieved.
- No new external API calls.

---

## Placement in page flow

Target order (per master plan):

1. Hero (with ratings)
2. Record card
3. Stats row
4. About
5. **Plan Your Visit** (this doc)
6. Map (full-width)
7. Community (banded)
8. Events (banded)

---

## Visual design

### Header

Use the standard header pattern:

```tsx
<SectionHeader
  title="Plan Your Visit"
  subtitle="Tickets, contact and facilities — everything you need before you set off."
/>
```

No coloured header text. No header background boxes.

### Layout

- Container padding: `px-4 md:px-6`.
- Section spacing: `mt-12` from previous section, `mb-12` after.
- Content grid:
  - Mobile: single column.
  - Desktop (`md+`): two columns.

Recommended grid:

- `grid grid-cols-1 md:grid-cols-2 gap-6`

### Typography

- Labels: `text-sm font-medium text-gray-500`
- Primary values: `text-lg font-bold text-gray-900`
- Secondary/supporting lines: `text-sm text-gray-600`

### Pills discipline

- **Do not** use pills for pricing, facilities, contact, or general facts.
- The only acceptable “chip-like” elements in this section are **none by default**.
  - If you later add a “status” (e.g., Open now), that belongs in hero or a status area, not here.

---

## Content blocks

This section is composed of up to four blocks (render only when data exists):

### 1) Tickets & Pricing

**Goal:** Provide a clear, human-friendly price summary.

**Display rules:**

- If there is a “from price” (day ticket, session, etc.) show:
  - `Day ticket: From £X`
- If there are multiple types (day, night, weekend), show up to **two** lines and link to venue website for full pricing.
- If no pricing exists:
  - Show: `Pricing not listed — check the venue website or call ahead.`

### 2) Contact

**Goal:** Make it easy to call / click.

**Display rules:**

- If phone exists: render a `tel:` link (large, bold, blue).
- If opening hours exist: show a supporting line.
- If neither exists: show:
  - `Contact details not listed — try the venue website.`

### 3) Best For

**Goal:** Provide quick orientation.

**Display rules:**

- Use plain text with separators (e.g., `Carp · Match · Families`).
- If missing: omit the block.

### 4) Facilities

**Goal:** Replace facility pills with icon + label.

**Display rules:**

- Render as a wrapping row set:
  - `flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-700`
- Each facility item should be:
  - `flex items-center gap-1.5`
  - icon `w-4 h-4`
  - label text
- If facilities list is long, display **max 8** and add a final item: `+N more` (UI-only; no modal required in this phase).
- If none: show:
  - `Facilities not listed.`

**No pills** in facilities.

---

## Calls to action

At the bottom of the section:

- Primary: `Book Online` (button)
- Secondary: `Visit Website →` (link/button)

Rules:

- If website URL exists, show `Visit Website`.
- If booking URL exists (or website URL doubles as booking), enable `Book Online`.
- If neither exists, hide CTA row entirely.

Layout:

- Mobile: stacked buttons (`flex flex-col gap-3`).
- Desktop: row (`md:flex-row`).

Suggested classes:

- Secondary: `bg-gray-100 text-gray-900 hover:bg-gray-200`
- Primary: `bg-blue-600 text-white hover:bg-blue-700`

---

## Example structure (reference)

```tsx
<section className="px-4 md:px-6 mt-12 mb-12">
  <SectionHeader
    title="Plan Your Visit"
    subtitle="Tickets, contact and facilities — everything you need before you set off."
  />

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Tickets & Pricing */}
    <div>
      <h3 className="text-sm font-medium text-gray-500 mb-2">
        Tickets & Pricing
      </h3>
      <p className="text-lg font-bold text-gray-900">Day ticket: From £40</p>
      <p className="text-sm text-gray-600 mt-1">Season passes available</p>
    </div>

    {/* Contact */}
    <div>
      <h3 className="text-sm font-medium text-gray-500 mb-2">Contact</h3>
      <a
        href="tel:01234123123"
        className="text-lg font-bold text-blue-600 hover:underline"
      >
        01234 123123
      </a>
      <p className="text-sm text-gray-600 mt-1">Daily 6am–10pm</p>
    </div>

    {/* Best For */}
    <div>
      <h3 className="text-sm font-medium text-gray-500 mb-2">Best For</h3>
      <p className="text-gray-700">Carp · Match · Families</p>
    </div>

    {/* Facilities */}
    <div>
      <h3 className="text-sm font-medium text-gray-500 mb-2">Facilities</h3>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-700">
        <span className="flex items-center gap-1.5">
          <ToiletIcon className="w-4 h-4" /> Toilets
        </span>
        <span className="flex items-center gap-1.5">
          <CoffeeIcon className="w-4 h-4" /> Cafe
        </span>
        <span className="flex items-center gap-1.5">
          <ShoppingBagIcon className="w-4 h-4" /> Bait shop
        </span>
        <span className="flex items-center gap-1.5">
          <ParkingIcon className="w-4 h-4" /> Free parking
        </span>
      </div>
    </div>
  </div>

  {/* CTAs */}
  <div className="flex flex-col md:flex-row gap-3 mt-6">
    <a
      href={websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1 md:flex-none bg-gray-100 text-gray-900 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 text-center"
    >
      Visit Website →
    </a>
    <a
      href={bookingUrl ?? websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 text-center"
    >
      Book Online
    </a>
  </div>
</section>
```

Note: This snippet is a visual/layout reference only. **Do not** introduce new data fetching.

---

## Data mapping guidelines (UI-only)

Because we are not changing queries, map from whatever venue fields already exist.

- Pricing: prefer a preformatted display string if your venue model has one.
- Contact: `phone`, `website`, `booking_url` (or whatever fields already exist).
- Facilities: use existing boolean flags / arrays; do not infer from free text.

If a field is unknown/missing in the current venue model, simply:

- Hide the specific sub-block, or
- Render the fallback copy listed above.

---

## UI states

### Loading

- If the venue page has skeletons, include a lightweight skeleton for 2-column rows.
- Avoid “jumping” layout: keep space reserved for the section header and grid.

### Empty / partial

- Partial is normal: render blocks independently.
- Don’t show an empty shell card.

### Error

- If venue fetch fails, the page-level error state should handle it.
- This section should not add extra error banners.

---

## Accessibility

- Phone number must be a real link (`<a href="tel:...">`).
- CTA links that open new tabs must include `rel="noopener noreferrer"`.
- Ensure focus states are visible on CTAs.
- Touch targets: aim for 44px height on buttons/CTAs.

---

## Manual test checklist

- [ ] Section header matches `SectionHeader` styling.
- [ ] Pricing renders cleanly; fallback copy shown when missing.
- [ ] Phone number is clickable and uses `tel:`.
- [ ] Facilities render as icon + text (no pills), wrap neatly on mobile.
- [ ] CTA row:
  - [ ] Hidden if no URLs.
  - [ ] `Visit Website` opens in new tab.
  - [ ] `Book Online` uses booking URL if present.
- [ ] Mobile layout is single-column; desktop is two-column.
- [ ] No extra “box” wrapper introduced around the whole section.
