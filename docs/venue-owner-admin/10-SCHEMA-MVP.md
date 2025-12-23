# Schema MVP (Local Snapshot)

Source of truth: supabase/_dump_schema.local.sql

## Phase 1 (Implemented locally)

### public.venues
Key columns used by Phase 1 UI
- booking_enabled boolean default true
- booking_url text
- ticket_type text
- price_from text
- website_url text
- contact_phone text
- best_for_tags text[]
- facilities text[]

Ownership/RLS (high level)
- RLS enabled on venues; owners and admins can read/update their venues, public can read published venues.

### public.venue_opening_hours
Columns
- id uuid (pk)
- venue_id uuid (fk -> venues.id)
- label text
- day_of_week smallint (0-6)
- opens_at time
- closes_at time
- is_closed boolean default false
- order_index int default 0
- created_at, updated_at

Constraints
- day_of_week must be 0-6
- order_index must be >= 0

Ownership/RLS (high level)
- Public can read only when the venue is published.
- Owners/admins can insert/update/delete for their venues.

### public.venue_pricing_tiers
Columns
- id uuid (pk)
- venue_id uuid (fk -> venues.id)
- label text
- price text
- unit text
- order_index int default 0
- created_at, updated_at

Constraints
- order_index must be >= 0

Ownership/RLS (high level)
- Public can read only when the venue is published.
- Owners/admins can insert/update/delete for their venues.

### public.venue_rules
Columns
- venue_id uuid (pk, fk -> venues.id)
- rules_text text
- created_at, updated_at

Ownership/RLS (high level)
- Public can read only when the venue is published.
- Owners/admins can insert/update/delete for their venues.

## Phase 1 RPCs (Implemented locally)
Booking
- owner_update_venue_booking
- admin_update_venue_booking

Opening hours
- owner_create_venue_opening_hour
- owner_update_venue_opening_hour
- owner_delete_venue_opening_hour
- admin_create_venue_opening_hour
- admin_update_venue_opening_hour
- admin_delete_venue_opening_hour

Pricing tiers
- owner_create_venue_pricing_tier
- owner_update_venue_pricing_tier
- owner_delete_venue_pricing_tier
- admin_create_venue_pricing_tier
- admin_update_venue_pricing_tier
- admin_delete_venue_pricing_tier

Rules
- owner_update_venue_rules
- admin_update_venue_rules

## Ownership model (local)
- public.venue_owners (venue_id, user_id, role, created_at)
- public.is_venue_admin_or_owner(venue_id) used by RLS and owner RPCs

## Phase 2 (Future)
- Spawning status
- Water conditions
- Stocking profile
- Record management controls
- Owner-managed venue photos UI (venue_photos table exists; UI deferred)
