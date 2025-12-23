# Venue Owner Admin MVP — Implementation Plan

## Scope & principles

- DB-backed, Security-first (RLS), Incremental delivery, No regressions.
- Canonical spec lives in `docs/venue-owner-admin/00-ADMIN-MVP-SPEC.md`.
- Supporting references: `docs/venue-owner-admin/10-SCHEMA-MVP.md`, `docs/venue-owner-admin/20-ADMIN-UI-WIREFRAMES.md`, `docs/venue-owner-admin/30-PUBLIC-RENDERING.md`, `docs/venue-owner-admin/90-TEST-CHECKLIST.md`.

## Phase split (key output)

### Phase 1 — Operational + marketing

- Booking enabled toggle (add only if missing in schema).
- Opening hours repeater table (add only if missing in schema).
- Pricing tiers repeater table (add only if missing in schema).
- Rules text field (MVP single text blob).
- Admin UI sections wired into the confirmed owner-facing edit page.
- Public rendering updates in “Plan your visit / Quick facts”.
- Photos: keep photo management UI in Phase 3 (venue_photos already exists; defer UI to keep Phase 1 tight and reduce storage-policy risk).

### Phase 2 — Welfare status

- Spawning status + banner copy.
- Water conditions (temperature, clarity, level).
- Stocking profile.
- Public “status banner” rules.

### Phase 3 — Photos

- Owner UI for venue_photos (upload, reorder, delete).
- Public gallery uses venue photos first, catch fallbacks second.

## Owner-facing edit surface (current)

| Route                 | Component                       | Guard/auth wrapper              | Intended audience      | Notes                                                                                                                                                                          |
| --------------------- | ------------------------------- | ------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/my/venues`          | `src/pages/MyVenues.tsx`        | `<RequireAuth>` route wrapper   | Owner                  | Lists venues via `venue_owners` join.                                                                                                                                          |
| `/my/venues/:slug`    | `src/pages/MyVenueEdit.tsx`     | `<RequireAuth>` + owner check   | Owner (admins allowed) | Checks `venue_owners` and `admin_users` for current user. Uses owner RPCs (`owner_update_venue_metadata`, `owner_get_venue_events`, `owner_create/update/delete_venue_event`). |
| `/admin/venues`       | `src/pages/AdminVenuesList.tsx` | `<RequireAuth>` + `isAdminUser` | Internal admin         | Admin-only list.                                                                                                                                                               |
| `/admin/venues/:slug` | `src/pages/AdminVenueEdit.tsx`  | `<RequireAuth>` + `isAdminUser` | Internal admin         | Admin-only editor. Uses admin RPCs (`admin_update_venue_metadata`, `admin_get_venue_events`) and direct `venue_owners` queries.                                                |

## Venue photos storage + URL strategy (current)

- Frontend renders `venue_photos.image_path` via `getPublicAssetUrl` (public URL builder).
  - `src/lib/storage.ts`: builds `SUPABASE_URL/storage/v1/object/public/{image_path}`.
  - `src/pages/venue-detail/viewModel.ts` + `src/pages/VenuesIndex.tsx`: call `getPublicAssetUrl(image_path)`.
- No signed URL usage found for venue photos (no `createSignedUrl` for these paths).
- Bucket name is not referenced in code; the stored `image_path` must already include the bucket prefix (e.g., `bucket-name/path.jpg`).

**How to verify in Supabase (SQL editor)**

```
select * from storage.buckets;
select bucket_id, name, owner, created_at from storage.objects limit 20;
```

- Look for a bucket containing venue photo objects (path prefix that matches `venue_photos.image_path`).
- Confirm whether the bucket is public (matching the public URL strategy in `getPublicAssetUrl`).

## Phase 1 schema verification (from \_dump_schema.sql)

| Item                   | Exists? | Evidence (dump)                                                                                            |
| ---------------------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| booking_enabled toggle | No      | `public.venues` has `booking_url` but no `booking_enabled` column in the `CREATE TABLE public.venues` DDL. |
| opening hours          | No      | No table named `venue_opening_hours`, `opening_hours`, `opening_times`, or similar in `_dump_schema.sql`.  |
| pricing tiers          | No      | No table named `venue_pricing_tiers`, `pricing_tiers`, or similar in `_dump_schema.sql`.                   |
| rules text             | No      | No `rules`/`tackle_rules` column on `public.venues` and no `venue_rules` table in `_dump_schema.sql`.      |

## Recommended minimal schema (if missing)

- `public.venues`:
  - `booking_enabled boolean not null default true`
- `public.venue_opening_hours`:
  - `id uuid pk`, `venue_id uuid fk`, `label text` (e.g., Summer), `day_of_week smallint`,
    `opens_at time`, `closes_at time`, `is_closed boolean default false`, `order_index int`, `created_at`, `updated_at`
- `public.venue_pricing_tiers`:
  - `id uuid pk`, `venue_id uuid fk`, `label text`, `price text`, `unit text`, `order_index int`, `created_at`, `updated_at`
- `public.venue_rules`:
  - `venue_id uuid pk fk`, `rules_text text`, `updated_at`

## Required RPCs + RLS (pattern-match existing)

- RPCs (owner):
  - `owner_update_venue_booking(p_venue_id, p_booking_enabled)`
  - `owner_upsert_venue_opening_hours(...)` + `owner_delete_venue_opening_hours(p_id)`
  - `owner_upsert_venue_pricing_tier(...)` + `owner_delete_venue_pricing_tier(p_id)`
  - `owner_update_venue_rules(p_venue_id, p_rules_text)`
- RPCs (admin):
  - `admin_update_venue_booking(...)`, `admin_upsert_venue_opening_hours(...)`, `admin_upsert_venue_pricing_tier(...)`, `admin_update_venue_rules(...)`
- RLS policy shape (new tables):
  - `SELECT`: allow when venue is published OR `is_venue_admin_or_owner(venue_id)`.
  - `INSERT/UPDATE/DELETE`: allow only `is_venue_admin_or_owner(venue_id)`.
  - Prefer explicit per-command policies (SELECT/INSERT/UPDATE/DELETE) over broad permissive policies to keep audits and future hardening straightforward.

## Naming collisions / similar fields

- `public.venues.booking_url` already exists (outbound link); do not reuse for a boolean toggle.
- `public.venues.price_from` and `ticket_type` already exist; pricing tiers should complement, not replace.
- `public.venue_events.ticket_info` is event-specific and should not be conflated with venue pricing tiers.
- `public.venues.notes_for_rr_team` is admin-only notes (avoid using it for public rules).

## Data model checklist (verify in dump before migrating)

### Phase 1

- `public.venues`: confirm existing fields for `ticket_type`, `price_from`, `booking_url`, `website_url`, `contact_phone`, `short_tagline`, `description`.
- `public.venues`: confirm whether a booking-enabled toggle already exists (expected missing).
- Opening hours: confirm no existing table (expected missing).
- Pricing tiers: confirm no existing table (expected missing).
- Rules text: confirm no existing column/table (expected missing).

### Phase 2

- Welfare status: confirm no existing columns for spawning, water conditions, stocking profile (expected missing).

### Phase 3

- `public.venue_photos`: confirm columns `image_path`, `caption`, `created_by`, `created_at`.
- Confirm existing RPCs: `get_venue_photos`, `owner_add_venue_photo`, `owner_delete_venue_photo`.

## RLS + RPC checklist

### Phase 1

- RLS: new tables/columns must use `is_venue_admin_or_owner(venue_id)` as the base policy (read/write).
- RPCs: prefer owner/admin RPCs (pattern: `owner_update_*`, `admin_update_*`), avoid direct writes.

### Phase 2

- RLS: same owner/admin policy pattern; public read allowed for published venues where applicable.
- RPCs: add owner/admin RPCs for welfare status updates.

### Phase 3

- RLS: reuse existing `venue_photos_*` policies and `is_venue_admin_or_owner`.
- RPCs: reuse `owner_add_venue_photo` and `owner_delete_venue_photo`.

## Deliverables & Definition of Done

### Phase 1 deliverables

- Migrations for missing fields/tables (booking toggle, opening hours, pricing tiers, rules text).
- Admin UI updates to owner edit page (see `docs/venue-owner-admin/20-ADMIN-UI-WIREFRAMES.md`).
- Public rendering updates (see `docs/venue-owner-admin/30-PUBLIC-RENDERING.md`).
- DoD: tests in `docs/venue-owner-admin/90-TEST-CHECKLIST.md` pass.

### Phase 2 deliverables

- Migrations for welfare fields.
- Admin UI sections + public status banner.
- DoD: tests in `docs/venue-owner-admin/90-TEST-CHECKLIST.md` pass.

### Phase 3 deliverables

- Photo management UI + ordering strategy (if added).
- Public gallery wiring.
- DoD: tests in `docs/venue-owner-admin/90-TEST-CHECKLIST.md` pass.

## Open items / decisions

- Storage bucket mapping for `venue_photos.image_path`: confirm via `storage.buckets` / `storage.objects`; current UI assumes public URLs.
- Confirm booking-enabled toggle absence in `public.venues` before adding a new column.
- Confirm no existing opening-hours or pricing-tier tables.
- Confirm whether any welfare/status fields already exist.
- Event schema mismatch: owner RPCs accept `contact_phone` but `public.venue_events` has no `contact_phone` column (needs decision before edits).
- Location overrides: no lat/lng in `public.venues` (confirm if needed for admin MVP).
