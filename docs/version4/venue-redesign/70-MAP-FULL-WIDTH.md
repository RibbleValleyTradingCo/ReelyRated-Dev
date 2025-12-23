# D — Full-Width Map

## Goal

Make the **Location / Map** section feel like a deliberate visual break (less “boxed-in”), by rendering the map **full-bleed (edge-to-edge)** while keeping the **section header and supporting text aligned to the normal page gutters**.

This phase should be **UI-only** and must **not** change Supabase RPCs, queries, or data shapes.

---

## Scope

### In scope

- Map container becomes **full width** (no horizontal padding, no max-width constraint)
- Header/content above the map remains **guttered** (same padding as other sections)
- Add/retain an **“Open in Google Maps”** CTA overlay (bottom-right)
- Ensure map is responsive (mobile + desktop) and keyboard accessible
- Graceful fallback if map URL/embed cannot render

### Out of scope

- Changing where map data comes from (no new RPCs / no schema changes)
- Rewriting geocoding/address logic
- Introducing a Google Maps API key dependency (default to iframe embed)

---

## Design Rules

- **No boxed card** around the map.
- The map itself is the visual element: **full-bleed**, no rounded corners.
- Maximum 2 banded sections rule remains unchanged (this map section is **not** a banded background; it’s a full-width element).

---

## Target Layout

Order on the page (as per master plan):

1. **Header block** (guttered)
2. **Map iframe** (full-bleed)
3. Optional **address details / helper copy** (guttered)

### Header block (guttered)

Use standard H2 pattern (SectionHeader component).

**Example structure:**

- `Location` (H2)
- Optional subtitle: “Find us and plan your journey”

### Map (full-bleed)

- Height:
  - Mobile: `h-[300px]`
  - Desktop: `md:h-[400px]`
- Width: `w-full`
- No horizontal padding on the map wrapper
- No `max-w-*` on the map wrapper

### Overlay CTA

- Bottom-right overlay button:
  - Visible on all sizes
  - Strong contrast (white background, shadow)
  - Links out with `target="_blank"` + `rel="noopener noreferrer"`

---

## Implementation Notes (Tailwind patterns)

### The critical “full-bleed” trick

Most pages are inside something like:

- `max-w-6xl mx-auto px-4 md:px-6`

To make the map full width **without breaking the rest of the page**, render the map outside the constrained container.

**Pattern A (recommended): split header and map wrapper**

- Keep the header inside the normal page container.
- Render the map wrapper as a sibling that is `w-full`.

Pseudo-layout:

- `SectionHeader` inside container
- Map wrapper outside container

**Pattern B (if you must keep it inside a constrained parent): negative margins**
If the layout forces the map to live inside a padded container, use:

- `-mx-4 md:-mx-6` on the map wrapper

This cancels out container padding and makes the map touch screen edges.

---

## Component Guidance

### Suggested component: `VenueMapSection`

Keep it small and predictable:

Props:

- `title?: string` (default “Location”)
- `subtitle?: string`
- `embedUrl: string | null`
- `googleMapsUrl: string | null`
- `addressLine?: string` (optional)

Behavior:

- If `embedUrl` exists: show iframe
- Else: show fallback (address + Open in Google Maps link)

### Accessibility requirements

- Iframe has a `title` (e.g., `title="Venue location map"`)
- Overlay CTA is keyboard focusable
- Provide visible focus ring (inherit site defaults)

---

## Empty / Error States

### No map available

Show:

- Header (Location)
- Address line (if present)
- Primary link: “Open in Google Maps”
- Secondary helper: “Map unavailable” (subtle)

### Embed fails to load

We can’t reliably detect iframe load failures without extra wiring; treat as:

- Always render iframe if `embedUrl` is present
- Always provide the external maps link (so users have a backup)

---

## Acceptance Criteria

### Visual

- Map touches **left and right edges** of the viewport on mobile and desktop
- Header aligns with other section headers (normal gutters)
- No card/border box around the map
- Overlay CTA is readable on top of map content

### Responsive

- Height is 300px on mobile, 400px on desktop
- No horizontal scrolling is introduced by the full-bleed wrapper

### UX

- “Open in Google Maps” works and is always available
- Page feels less stacked/boxy due to the full-width break

---

## Manual Test Checklist

### Mobile

- [ ] Map is edge-to-edge (no visible side padding)
- [ ] No sideways scrolling
- [ ] Overlay CTA does not cover critical UI (reasonable placement)
- [ ] Tap overlay CTA opens Google Maps in a new tab

### Desktop

- [ ] Map is edge-to-edge even on large screens
- [ ] Header remains aligned to content gutters
- [ ] Overlay CTA remains bottom-right and readable

### Accessibility

- [ ] Keyboard can tab to overlay CTA
- [ ] Focus state visible
- [ ] Iframe has a non-empty `title`

---

## Codex Implementation Prompt

Use this when you’re ready:

> Implement Phase D (Full-Width Map) for the venue detail page.
> Constraints:
>
> - UI-only: do not change any Supabase queries/RPCs/data logic.
> - Map header stays in the standard page container; map iframe must be full-bleed (edge-to-edge).
> - Keep or add an “Open in Google Maps” overlay button (bottom-right) with proper rel/target.
> - Ensure no horizontal scrolling is introduced.
>   Deliver:
> - Update the venue page layout to split the header (guttered) and map (full-bleed) OR use negative margins safely.
> - Add a simple fallback if embed URL missing (show link + address if available).
> - Provide a short summary of files changed and screenshots guidance.
