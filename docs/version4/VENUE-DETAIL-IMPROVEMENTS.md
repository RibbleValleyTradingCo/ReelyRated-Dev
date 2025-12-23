# Venue Detail Improvements (v4)

Owner: ReelyRated
Page: `/venues/:slug` (`src/pages/VenueDetail.tsx`)
Status: Draft
Last updated: 2025-12-19

## Goal

Make the Venue Detail page feel _professional, modern, and consistent_ with the v4 UI foundations and homepage styling.

This doc is our checklist + spec for improvements (UX, layout, component polish), with clear acceptance criteria so we can iterate safely.

---

## Constraints

- Codex writes all code changes.
- We should avoid breaking existing data flows.
- If a change requires backend work (DB/storage/RLS/RPC), it must be called out explicitly as a separate step.

---

## Hero Image Requirement (High Priority)

### Summary

Venue owners should be able to upload a **Venue Hero Image**.
If no hero image is uploaded, the page must use a **solid colour fallback** (not a broken image, not an empty gap).

### Display Rules (source priority)

1. **Venue Hero Image** (owner-uploaded)
2. If none: **fallback solid colour** (derived consistently from venue id/slug so it feels “intentional”)

> Note: We’re intentionally _not_ falling back to community catch photos for the hero. Hero should feel “official / venue-managed”.

### Solid Colour Fallback Spec

- Use a single solid colour block (optionally with a subtle gradient overlay for depth).
- Colour should be deterministic:
  - e.g. hash(venue.id or slug) → pick from a small curated palette.
- Should still support legibility:
  - add a dark overlay behind text (or a bottom fade) so white text always passes contrast.

### Hero Layout Spec

- Height:
  - Mobile: ~220–260px
  - Desktop: ~280–360px
- Content overlay (top-left):
  - Venue name (primary)
  - Location (secondary)
  - Tagline (optional)
- Primary CTA area (beneath hero or overlaid depending on layout):
  - “Log a catch here”
  - “View on maps”
- Optional: rating summary row near title (if already available)

### Loading / Empty / Error states

- Loading: show a hero skeleton (same height) to prevent layout shift.
- Image error: treat as “no hero image” and show solid fallback.
- No tagline: don’t show placeholder text; simply omit the line.

### Acceptance Criteria

- [ ] If hero image exists, it renders correctly on all breakpoints.
- [ ] If hero image is missing, the fallback colour renders (no blank space).
- [ ] No layout shift during load (skeleton matches final height).
- [ ] Text is readable over both image and fallback.
- [ ] Lighthouse / basic performance doesn’t regress (hero image should be appropriately sized + lazy where appropriate).

---

## Upload Flow (Owner / Admin)

### Where the upload lives

- Venue owner editing UI (likely `src/pages/MyVenueEdit.tsx`)
- Admin edit UI (likely `src/pages/AdminVenueEdit.tsx`)

### UX Spec

- Upload control: “Venue hero image”
- Supports:
  - JPG/PNG/WebP
  - Max size (e.g. 5MB)
  - Recommended aspect ratio guidance (e.g. 16:9)
- Buttons:
  - Upload / Replace
  - Remove (reverts to fallback colour)
- Show a preview immediately after selecting.

### Backend / Storage Notes (if needed)

If we don’t already have a place to store a hero image:

- Storage bucket: `venue-hero` (or similar)
- Store URL/path on venue row (e.g. `venues.hero_image_url` or `venues.hero_image_path`)
- RLS / storage policies:
  - Owners/admins can upload/replace for their venue.
  - Everyone can read.
- Consider basic moderation/abuse controls later (rate limits, content reporting).

### Acceptance Criteria

- [ ] Owners can upload/replace/remove hero image.
- [ ] Admins can upload/replace/remove hero image.
- [ ] Non-owners cannot modify the hero.
- [ ] Public users can view hero image (or fallback).

---

## Page Structure Improvements (Layout)

### Proposed section order (mobile-first)

1. Hero (identity + CTAs)
2. Venue Summary (short description + key stats)
3. Visiting Us (location, hours, amenities)
4. Venue Record (if exists) / empty state CTA
5. Community Catches
   - Recent catches grid
   - Top catches ranked list + species filter
6. Footer / related venues (optional)

### Desktop layout suggestion

- 2-column:
  - Left: main content (summary, catches)
  - Right: utility cards (visiting us, stats, record)

### Acceptance Criteria

- [ ] Clear visual hierarchy (hero → summary → utility → community content).
- [ ] Consistent spacing (use v4 spacing tokens/utility classes).
- [ ] Sections feel modular (cards), not one long wall of text.

---

## Component-Level Enhancements

### Venue Summary Card

- [ ] Tight copy layout (avoid dense paragraphs)
- [ ] Include 2–4 key stats (catches, last 30 days, top species, rating count)
- [ ] Optional mini visual (chips or compact rows)

### Visiting Us Card

- [ ] Location (tap opens maps)
- [ ] Hours (if present)
- [ ] Amenities (as chips)
- [ ] Contact (if present)
- [ ] Avoid clutter: collapse less-important fields behind “Show more” if needed

### Venue Record Card

- [ ] If record exists: show thumbnail + weight/species + “View catch”
- [ ] If none: “No venue record yet” + CTA “Be the first to set it”

### Community Catches

- [ ] Recent grid: consistent card heights, clean gutters
- [ ] Top catches list: ranked rows, clear “View catch”
- [ ] Species filter: compact select; don’t push layout around when opened
- [ ] Empty states:
  - No catches: “No catches logged here yet” + “Log a catch here”
  - No top catches (after filter): “No catches for this species yet”

---

## Visual Polish Checklist

- [ ] Consistent typography scale (title/subtitle/body)
- [ ] Consistent radii + shadows (v4 foundations)
- [ ] Buttons: clear primary vs secondary
- [ ] Icons used sparingly + consistently
- [ ] Reduce “visual noise” (no heavy borders everywhere)

---

## QA / Test Plan (Manual)

### Hero

- [ ] Venue with hero image
- [ ] Venue without hero image (fallback colour)
- [ ] Broken image URL → fallback colour
- [ ] Slow network → skeleton shows, no jump

### Owner upload

- [ ] Upload new hero image
- [ ] Replace hero image
- [ ] Remove hero image (fallback appears)
- [ ] Permissions: non-owner cannot upload/replace/remove

### Content sections

- [ ] Venue with lots of catches
- [ ] Venue with zero catches
- [ ] Venue with no record
- [ ] Species filter works + doesn’t shift page under navbar

---

## Codex Prompts (to run in order)

1. Implement hero display + fallback colour (frontend only)
2. Add owner/admin upload controls (UI + storage integration)
3. Apply layout + component improvements (structure, spacing, cards)
4. Final polish + empty states + QA pass
