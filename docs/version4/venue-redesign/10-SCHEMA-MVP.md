# Venue Owner Admin — Schema MVP (ERD Summary)

> Source of truth: `supabase/_dump_schema.sql` snapshot (remote). This doc is a _human_ summary of the current schema + the RPC/view surfaces that the Venue Owner Admin MVP will rely on.

## What this doc is for

- Quickly answer: “Where does this field live?” and “Which RPC/view exposes it?”
- Highlight **gaps** that require migrations later (ordering, primary photo, structured rules, etc.).

---

## Core tables (key columns)

### `public.venues`

- Identity
  - `id`, `slug`, `name`, `location`
- Content
  - `short_tagline`, `description`
- Commercial
  - `ticket_type`, `price_from`
  - `website_url`, `booking_url`, `contact_phone`
- Tags
  - `best_for_tags text[]`
  - `facilities text[]`
- Ops / internal
  - `notes_for_rr_team`
  - `is_published`
  - `created_at`, `updated_at`

### `public.venue_owners`

- Ownership / permissions
  - `venue_id`, `user_id`, `role`, `created_at`

### `public.venue_photos`

- Venue-managed photos
  - `id`, `venue_id`, `image_path`, `caption`
  - `created_at`, `created_by`

> **Important:** `image_path` is a storage path (not a full URL). The UI should continue using the existing conversion logic already used elsewhere in the app (e.g., `getPublicUrl` / signed URLs depending on your bucket rules). No schema-level bucket configuration exists in Postgres.

### `public.venue_events`

- Events (owner managed)
  - `id`, `venue_id`, `title`, `event_type`
  - `starts_at`, `ends_at`, `description`
  - `ticket_info`, `website_url`, `booking_url`
  - `is_published`, `created_at`, `updated_at`

### `public.venue_ratings`

- Ratings (user generated)
  - `id`, `venue_id`, `user_id`, `rating`
  - `created_at`, `updated_at`

### `public.catches`

- Community catches (inputs to stats / record)
  - `id`, `venue_id`
  - `weight`, `weight_unit`, `species`
  - `created_at`, `visibility`, `deleted_at`

### `public.profiles`

- Identity for attribution
  - `id`, `username`
  - `avatar_path`, `avatar_url`

### `public.admin_users`

- App admins
  - `user_id`

---

## Relationships (FKs)

- `venue_owners.venue_id` → `venues.id` (ON DELETE CASCADE)
- `venue_owners.user_id` → `profiles.id` (ON DELETE CASCADE)
- `venue_photos.venue_id` → `venues.id` (ON DELETE CASCADE)
- `venue_photos.created_by` → `profiles.id` (ON DELETE SET NULL)
- `venue_events.venue_id` → `venues.id`
- `venue_ratings.venue_id` → `venues.id`
- `venue_ratings.user_id` → `profiles.id`
- `catches.venue_id` → `venues.id`

---

## Ownership + authorization model

### Ownership source

- Venue ownership is defined by `public.venue_owners`.
- Admin access is defined by `public.admin_users`.

### Helper function

- Access checks are centralized via `is_venue_admin_or_owner(...)` (used by owner/admin RLS policies).

### High-level RLS/policies (admin-relevant)

- `venues_select_owner`, `venues_update_owner`, `venues_select_published`, `venues_update_admin_all`.
- `venue_owners_admin_all`, `venue_owners_self_select`.
- `venue_photos_select`, `venue_photos_insert`, `venue_photos_delete`.
- `venue_events_select_published` (public reads only published events).

---

## Derived data surfaces (views + RPCs)

### View: `public.venue_stats`

Computed values used on public venue pages:

- `total_catches`
- `recent_catches_30d` (30-day window only)
- `headline_pb_weight`, `headline_pb_unit`, `headline_pb_species`
- `top_species`
- `avg_rating`, `rating_count`

> Note: there is **no** 7-day/weekly aggregate in the current view.

### RPC: `public.get_venue_by_slug`

- Returns the venue row joined with `venue_stats`.
- This is the primary source for: `total_catches`, `recent_catches_30d`, headline PB fields, top species, ratings.

### RPC: `public.get_venue_top_catches`

- Returns top catches, ordered by weight (`ORDER BY c.weight DESC`).
- This is the primary UI source for “top catches shown” lists and leaderboard content.

### RPC: `public.get_venue_photos`

- Returns `venue_photos` ordered by `created_at DESC`.

---

## Owner/admin mutation RPCs (MVP-relevant)

These already exist and are the correct surfaces for an owner admin panel MVP:

### Venue metadata

- `owner_update_venue_metadata` (owners)
- `admin_update_venue_metadata` (admins)

### Photos

- `owner_add_venue_photo`
- `owner_delete_venue_photo`

> There is no explicit reorder/primary-photo concept in schema yet; today’s ordering is `created_at DESC`.

---

## Venue record attribution

- There is **no explicit** “record selector” column (e.g., `venue_record_catch_id`) and no `is_venue_record` flag.
- The “record” is derived:
  - From `venue_stats` (headline PB fields), and
  - From `get_venue_top_catches` by taking the top weighted catch.

---

## Gaps vs Admin MVP spec

### Photos

- No `display_order` column on `venue_photos` (cannot reorder explicitly).
- No `is_primary` concept (cannot designate a hero image explicitly).
- No visibility flag per photo; public access is controlled by `venue_photos_select` + overall venue publish status.

### Events

- Schema mismatch to verify in future migration work: owner RPCs appear to accept fields not present on `venue_events` (e.g., `contact_phone`).

### Record management

- No owner override for “venue record”. Any owner-managed record will require a migration (e.g., `venue_record_catch_id` or a dedicated `venue_records` table), or a clear product decision that the record is _always_ derived from community catches.

### Taxonomy / rules / ops fields

- `facilities` and `best_for_tags` are free-text arrays; no controlled taxonomy table.
- No structured model yet for:
  - opening hours / seasonal hours
  - spawning alerts / water conditions
  - tackle/bait rules
  - equipment rental

### Stats

- Only 30-day catch window exists (`recent_catches_30d`). Weekly stats require a view/RPC change.

---

## Notes for migration planning

If/when we expand the owner admin feature set, the most likely migrations are:

- `venue_photos`: add `display_order int`, `is_primary boolean`, maybe `is_published boolean`.
- Venue record override: add `venue_record_catch_id uuid` (FK to `catches`) **or** create `venue_records` table.
- Structured ops modules (opening hours, rules, water conditions) as separate tables keyed by `venue_id`.
