# Admin MVP Test Checklist

## Access control
- Owner can edit their venue (owner RPCs succeed).
- Owner cannot edit other venues (RPCs blocked).
- Admin can edit any venue (admin RPCs succeed).
- Non-authenticated user cannot write any admin data.

## Phase 1 modules

### Booking
- booking_enabled defaults to true on existing venues.
- Owner toggles booking_enabled off/on; value persists.
- booking_url validation (HTTPS or blank) blocks invalid input.
- Public CTA respects booking_enabled (hidden/disabled when false).

### Opening hours
- Add row (label + day + open/close) saves successfully.
- Edit row updates correctly.
- Delete row removes it.
- is_closed true disables time fields and saves.
- Validation: day_of_week required (0-6), invalid times show errors.
- Empty state renders when no rows exist.

### Pricing tiers
- Add row (label + price) saves successfully.
- Edit row updates correctly.
- Delete row removes it.
- Validation: label and price required.
- Empty state renders when no rows exist.

### Rules
- Save rules text creates/updates venue_rules row.
- Empty state placeholder when rules missing.
- Save error state displays with retry path.

## Public rendering
- Anon can read hours/pricing/rules only for published venues.
- Unpublished venues: anon cannot read hours/pricing/rules.
- Owners/admins can read hours/pricing/rules for their unpublished venues.
- Public venue page renders sections only when data exists.

## Regression checks
- Venue detail page still renders without Phase 1 data.
- Existing venue metadata (ticket_type, price_from, booking_url, website_url, contact_phone) unaffected.
