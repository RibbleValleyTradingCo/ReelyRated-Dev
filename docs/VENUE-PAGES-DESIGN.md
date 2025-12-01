# Venue Pages & Leaderboards – Design (Phase 1: Read-only)

This document outlines the design for venue pages and venue leaderboards. Phase 1 (read-only listing/detail + leaderboards) is implemented with schema, RPCs, nav, and pages. Editing venues, events, and block/mute are future work.

---

## 1. Data Model
Status: Schema groundwork implemented (venues table, catches.venue_id, indexes). No venue data backfill yet; existing catches may have `venue_id` = NULL.
Seed data: Venues seeded from Add Catch options via 2058_seed_venues_from_add_catch.sql (slugs + names). `venue_id` remains optional and not yet backfilled on existing catches.

### 1.1 venues table
- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `slug text UNIQUE NOT NULL` (used for `/venues/:slug`)
- `name text NOT NULL`
- `location text` (free text; e.g., “Wyreside Lakes, Lancashire, UK”)
- `description text` (optional)
- `is_published boolean NOT NULL DEFAULT TRUE`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

### 1.2 catches → venues
- Add `venue_id uuid NULL REFERENCES public.venues (id)` to `public.catches` (nullable initially).
- Keep existing free-text location fields as fallback for legacy data.
- Indexes to plan:
  - `CREATE INDEX ON public.catches (venue_id, created_at);` (recent lists)
  - `CREATE INDEX ON public.catches (venue_id, weight);` (top catches)
- Future: crosswalk/backfill from existing `location` to structured venues (out of scope here).

---

## 2. Pages & UX

### 2.1 /venues (index)
- List venues with:
  - `name`
  - `location`
  - Optional stats (v1 optional): `total_catches_at_venue`
- Each item links to `/venues/:slug`.

### 2.2 /venues/:slug (venue detail)
- Hero: venue name, location, optional description, light metric chips (e.g., total catches, number of anglers).
- Top catches at this venue:
  - Leaderboard of best catches (by weight or existing catch score).
  - Reuse existing catch card and feed grid styling.
- Top anglers at this venue:
  - Implemented: strip of anglers with avatar, username, catch_count, PB weight (visible catches only).
- Recent catches at this venue:
  - Reverse-chronological list/grid, reusing existing catch cards/grid layout.

---

## 3. API / RPC Layer (design only)

Planned RPCs/views (no SQL yet):

- `get_venues(p_search text, p_limit int, p_offset int)`
  - Returns list of venues (id, slug, name, location, optional counts).
  - Respects `is_published`.

- `get_venue_by_slug(p_slug text)`
  - Returns single venue metadata (id, slug, name, location, description, is_published).

- `get_venue_recent_catches(p_venue_id uuid, p_limit int, p_viewer_id uuid)`
  - Returns recent catches for the venue with joined profile basics.
  - Must respect: catch visibility, `profiles.is_private`, `deleted_at`, moderation/admin override.
  - Prefer SECURITY INVOKER to rely on RLS; if SECURITY DEFINER, bake in the same predicates as feed/search.

- `get_venue_top_catches(p_venue_id uuid, p_limit int, p_viewer_id uuid)`
  - Returns top catches (by weight/score) with profile basics.
  - Same privacy/moderation requirements as above.

- `get_venue_top_anglers(p_venue_id uuid, p_limit int, p_viewer_id uuid)`
  - Implemented as SECURITY INVOKER; aggregates per-angler stats (catch_count, best_weight + unit, last_catch_at) for visible catches at the venue.
  - Returns profile basics (username, avatar_path, avatar_url).
  - Must follow the same visibility/privacy rules via existing RLS.

All RPCs must honor:
- Catch `visibility`
- `profiles.is_private` (owner, follower, admin rules)
- `deleted_at` soft-deletes
- Admin override / moderation status as in feed/search/comment RLS

---

## 4. Privacy, Moderation, and RLS Alignment
- Venue pages are discovery surfaces; they must not leak:
  - Catches from private profiles to non-followers.
  - Catches/comments from deleted accounts.
  - Soft-deleted or moderated content already hidden elsewhere.
- Venue RPCs must reuse/mirror the visibility rules used by feed, search, and comments:
  - Non-followers: no private-profile catches.
  - Followers: private-profile catches allowed (subject to per-catch visibility).
  - Admins: full visibility.
- Admin bypass should remain consistent with current feed/moderation behaviour.
- Future block/mute (`profile_blocks`) will need to be layered in later; not covered here.

---

## 5. Future Venue-Owner Features (later phases)
- Extended venue fields:
  - Business/contact details
  - Ticket/membership info
  - Website/social URLs
- `venue_admins` table linking `venue_id` to `user_id`
- `venue_events` table for upcoming events
- Venue editing, events, and admin tooling are **not** part of Phase 1 (read-only browse/leaderboards only).

---

## 6. Venue metadata & CTAs – v1

This pass focuses on surfacing “bookable” signals without turning venues into a booking engine. Split between auto-derived stats (no owner effort) and light owner/admin-authored metadata.

### A. Auto-derived fields (read-only, computed from existing data)
- `total_catches_at_venue` (lifetime) derived from catches with `venue_id`.
- `recent_catches_window` (e.g. last 7 or 30 days) using the same venue_id linkage.
- `headline_pb` for the venue:
  - Heaviest logged catch overall.
  - Future: species-specific PBs (e.g. “Best carp here: 32lb”).
- `top_species_at_venue`: top 1–3 species by count at this venue.
- `friends_activity` (future): “Fished by N anglers you follow.”
- Simple “trending” flag (recent activity vs baseline).

Notes:
- These do not require venue-owner input; they are read-only and driven by existing catches + venue_id and existing RPC patterns.
- They power live card/hero snippets such as “7 catches this month”, “Best carp: 24lb”, “Top species: Carp, Pike”.
- Implementation is new views/RPCs only; no new write paths.

### B. Owner / admin-authored fields (editable via venue settings)
Propose columns on `public.venues` (or a related table). Do not write SQL here.
- `short_tagline` (text, ~80–120 chars) — “Big carp day-ticket venue with 3 main lakes.”
- `ticket_type` (string/enum-ish) — e.g. “Day ticket”, “Syndicate”, “Club water”, “Coaching venue”.
- `price_from` (numeric + currency or simple text) — e.g. “from £10 / day”.
- `best_for_tags` (text[]) — e.g. ["Carp", "Match", "Families", "Predator"].
- `facilities` (text[] or JSONB) — e.g. ["Toilets", "Café", "Tackle shop", "Parking", "Accessible pegs"].
- `website_url`
- `booking_url` (can mirror website to start)
- `contact_phone` (optional)
- `notes_for_rr_team` (admin-only, not exposed to end users)

Notes:
- v1: admin-editable only via an internal/owner panel. Verified owner model is out of scope here.
- All fields are optional; UI must degrade gracefully when missing.

### C. Venue card (Venues index) content hierarchy
- Top: venue name + location (existing).
- Middle text line: prefer `short_tagline`; fallback “Community catches coming soon. Imported from Add Catch venue options.”
- Stats row:
  - Left: `total_catches_at_venue` or “No catches logged yet.”
  - Right: `recent_catches_window` (e.g. “3 this week”) or “Be the first to log a catch here.”
- Chip row: 1–2 pills from `best_for_tags` and/or key `facilities` (e.g. “Carp”, “Day ticket”, “Café”).
- CTA: Keep “View venue” primary button. Optionally show subtle “From £X/day” text near the button when `price_from` exists.

Degradation:
- Missing tagline → fallback copy.
- No catches → empty-state stats text.
- No tags/facilities → omit chips without adding empty placeholders.
- No price → omit “from £X/day”.

### D. Venue hero (Venue detail)
- Under venue name: location + “X catches logged here” + “Y in the last 30 days” (from auto-derived stats).
- Description line: use `short_tagline` when present; fallback to existing “Imported from Add Catch…” copy.
- Right side (or stacked on mobile):
  - “From £X/day” when `price_from` exists.
  - Row of `best_for_tags` chips (e.g. “Carp”, “Match”, “Families”).
- Below hero (later section): “Venue info” with `facilities`, `website_url`, `booking_url`.

### E. Permissions and safety
- All venue metadata is public read.
- Edit rights:
  - v1: admins only.
  - v2: optional `venue_managers` table mapping auth users to venues.
- Booking/safety:
  - Require HTTPS for `booking_url`; avoid shorteners where possible.
  - No in-app payments in this phase; links are outbound only.

---

## 7. Venue events / matches / announcements – v1 (design only)

Goal: add a simple, flexible events/matches/announcements model, admin-authored only in this phase.

### A. Data model (venue_events)
- Table: `public.venue_events`
- Columns (nullable where noted):
  - `id uuid primary key default gen_random_uuid()`
  - `venue_id uuid not null references public.venues(id)`
  - `title text not null`
  - `event_type text` (match | open_day | maintenance | announcement | other; text for now, enum later)
  - `starts_at timestamptz not null`
  - `ends_at timestamptz` (nullable for one-off announcements)
  - `description text`
  - `ticket_info text` (or `entry_fee text` free-form: “£25, 30 pegs, payout to top 3”)
  - `website_url text` (optional override)
  - `booking_url text` (optional override)
  - `is_published boolean not null default false`
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`
- Indexes:
  - `(venue_id, starts_at)` for upcoming queries.
  - `(starts_at)` optional for global lists later.
- RLS/ownership:
  - Reads: public can read published events; primary focus on upcoming.
  - Writes: admin-only via SECURITY DEFINER RPCs checking `admin_users`.
  - Future: venue-owner scoped writes (out of scope here).

### B. RPCs (design only)
- `get_venue_upcoming_events(p_venue_id uuid, p_now timestamptz default now(), p_limit int default 10)`
  - Returns published events for a venue where `starts_at >= p_now`, ordered by `starts_at ASC`, limit with sane cap.
  - Security: SECURITY INVOKER; relies on table RLS (published-only).
- `get_venue_past_events(p_venue_id uuid, p_now timestamptz default now(), p_limit int default 10, p_offset int default 0)`
  - Returns published past events for admin/manage views (or future public “past events”), ordered `starts_at DESC`.
- Admin CRUD (SECURITY DEFINER, admin_users check):
  - `admin_create_venue_event(...)` with the columns above (venue_id, title, event_type, starts_at, ends_at, description, ticket_info, website_url, booking_url, is_published).
  - `admin_update_venue_event(...)` same fields + event id.
  - `admin_delete_venue_event(p_event_id uuid)` or admin_unpublish.
  - All admin RPCs update `updated_at = now()`.

### C. Public venue page UX (/venues/:slug)
- Placement: “Upcoming events” section between hero and leaderboards (or similarly prominent).
- When events exist:
  - Small cards/rows showing title, date/time, short description snippet, optional “More details”/“Book now” link when `booking_url` present.
  - Order by soonest first.
- When none: light empty state (“No upcoming events — check back soon.”).
- Past events: optional later; can be a follow-on subsection/tab, not required in this first pass.
- Events are informational only; they do not affect catch privacy/RLS.

### D. Admin venue tools
- `/admin/venues/:slug`:
  - Add “Events” panel/tab listing upcoming + recent past events.
  - Actions: Create, Edit, Unpublish/Delete.
  - Form fields map 1:1 to `venue_events` columns; validation: title required, starts_at required, ends_at >= starts_at when present, is_published toggle.
- `/admin/venues` list:
  - Nice-to-have: show upcoming events count per venue (optional for a later pass).

### E. Safety / moderation notes
- Phase 3.2: admin-authored only → low abuse risk.
- Future venue-owner editing: consider moderation/approval, audit logging (moderation_log or dedicated audit), HTTPS enforcement on URLs, and unchanged catch/venue RLS.

---

## 8. Manual Test Checklist (design-level)
- Public vs private profiles at a venue:
  - Owner sees own catches.
  - Follower vs non-follower visibility matches feed/search rules.
  - Admin sees everything.
- Venue pages never show catches that feed/search would hide (privacy/moderation/soft-delete).
- Venue with no catches → clear empty state.
- Venue with only private-profile catches → non-followers see nothing; followers/admins see catches.
- Mixed public/private-profile catches → only permitted catches appear per viewer relationship.
- Phase 1 UI/RPC checks:
  - /venues lists venues; search filters by name/location.
  - /venues/:slug shows hero, top catches, and recent catches with load-more.
  - Private-profile catches do not appear for non-followers; followers/admins can see them.
  - No regressions on feed/search/profile/add-catch.
