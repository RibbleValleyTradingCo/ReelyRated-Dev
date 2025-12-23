# Venue Owner Admin MVP Spec

## Purpose
Build a venue-owner admin panel so verified venue owners can keep their venue page accurate, compliant, and compelling (operational info, welfare info, facilities/rules, and marketing content).

This spec is the canonical MVP for the venue-owner admin work in v4.

## Non-negotiables
- DB-backed: anything shown on the public venue page must come from the database.
- Security-first: all write paths require RLS and ownership checks.
- Incremental delivery: ship in small slices, keeping existing venue detail functionality intact.

## Source of truth (local snapshot)
- supabase/_dump_schema.local.sql
- supabase/_dump_roles.local.sql

## Local schema facts (Phase 1)
Ownership and access
- Ownership: public.venue_owners (venue_id, user_id, role, created_at).
- Ownership check: public.is_venue_admin_or_owner(venue_id).

Phase 1 data objects (implemented locally)
- venues.booking_enabled (boolean, default true).
- venue_opening_hours (repeater).
- venue_pricing_tiers (repeater).
- venue_rules (single row per venue).

Phase 1 RPCs (implemented locally)
- Booking: owner_update_venue_booking, admin_update_venue_booking.
- Opening hours: owner_create_venue_opening_hour, owner_update_venue_opening_hour, owner_delete_venue_opening_hour; admin_create_venue_opening_hour, admin_update_venue_opening_hour, admin_delete_venue_opening_hour.
- Pricing tiers: owner_create_venue_pricing_tier, owner_update_venue_pricing_tier, owner_delete_venue_pricing_tier; admin_create_venue_pricing_tier, admin_update_venue_pricing_tier, admin_delete_venue_pricing_tier.
- Rules: owner_update_venue_rules, admin_update_venue_rules.

## Phase 1 vs Phase 2

Phase 1 (owner-facing UI scope, implemented locally)
- Booking toggle: venues.booking_enabled.
- Opening hours: venue_opening_hours.
- Pricing tiers: venue_pricing_tiers.
- Rules: venue_rules.
- Owner/admin RPCs listed above.

Phase 2 (future)
- Spawning status + banner copy.
- Water conditions (temperature, clarity, level).
- Stocking profile.
- Record management controls (if required).
- Owner-managed venue photos UI (venue_photos table already exists; UI deferred).

## Public rendering decisions
Public (anon/authenticated) venue page
- Read access for opening hours, pricing tiers, and rules is allowed only for published venues (enforced by RLS).
- Render sections only when data exists.
- booking_enabled controls whether booking CTAs appear; booking_url is still stored on venues.

Owner/admin views
- Owners/admins can read their venue rows even if unpublished.
- Admin-only fields (notes_for_rr_team) never render publicly.

## Definition of Done (Phase 1 UI)
Booking
- booking_enabled toggle updates venues.booking_enabled.
- booking_url remains editable and validated (HTTPS or blank).
- Toggle state is reflected in public CTA behavior.

Opening hours
- Repeater supports add/edit/delete rows.
- Validation: day_of_week required (0-6), time format valid; closed rows skip time validation.
- Empty state shown when no rows exist.
- Save and error states are visible and recoverable.

Pricing tiers
- Repeater supports add/edit/delete rows.
- Validation: label and price required; unit optional.
- Empty state shown when no rows exist.

Rules
- Single textarea (or rich text) bound to venue_rules.rules_text.
- Empty state copy when rules are missing.

Permissions + safety
- Non-owners cannot write (RLS enforced).
- Owners can only write to their venues.
- Admins can write to any venue via admin RPCs.

## Notes
- venue_photos table and owner/admin RPCs already exist locally; UI for photo management remains Phase 3.
- No schema or RLS changes are required for Phase 1 beyond what is already present in the local snapshot.
