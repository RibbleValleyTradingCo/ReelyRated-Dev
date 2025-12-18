# ReelyRated ERD (v3)

This document describes the main entities, relationships, and security rules for the ReelyRated database (Supabase + Postgres) **as used by the current v3 app**.

- **All schema and queries should stay in sync with this file.**
- If the actual database or frontend code ever disagrees with this ERD, one of them needs updating.
- When in doubt, **this ERD is the source of truth for how the app is supposed to work.**

---

## 0. Implementation Phases & Current Status

The schema was designed in phases to keep the build manageable. At this point, v3 implements most of Phase 1 and Phase 2, and large parts of Phase 3.

### Phase 1 – Core (initial foundations)

Tables:

- `profiles`
- `admin_users`
- `sessions`
- `catches`
- `baits`
- `tags`
- `water_types`

### Phase 2 – Social / Community

Tables:

- `profile_follows`
- `profile_blocks`
- `catch_comments`
- `catch_reactions`
- `ratings`
- `notifications`

### Phase 3+ – Moderation / Analytics / Domain

Tables / views:

- `venues`
- `venue_events`
- `venue_owners`
- `species`
- `reports`
- `user_warnings`
- `moderation_log`
- `rate_limits`
- Views:
  - `leaderboard_scores_detailed`
  - `user_insights_view` (planned / Phase 3+)

> **Note (v3):** New environments should be created by applying the full set of Supabase migrations from the repo (not by hand-applying only "Phase 1"). The phase breakdown is mainly conceptual now.

---

## 1. Global Conventions

### 1.1 IDs and keys

- All main entities use `id UUID` as the **primary key**.
- Foreign keys always reference the **primary key** of the parent table.
- Foreign key column names describe the relationship, for example:
  - `user_id`, `catch_id`, `session_id`, `venue_id`, `species_id`.
- Lookup tables may use:
  - `slug` / `code` as a primary key, **or**
  - `id` (UUID) plus a unique `slug` / `code`.

### 1.2 Timestamps

- Most tables include:
  - `created_at TIMESTAMPTZ` – when the row was created (default: `now()`).
  - `updated_at TIMESTAMPTZ` – when the row was last updated.
- Some tables also use:
  - `deleted_at TIMESTAMPTZ` – soft delete timestamp:
    - `NULL` = active.
    - non-null = soft-deleted (hidden from normal user views, but retained).

### 1.3 Auth & ownership

- Supabase manages `auth.users` (do **not** modify this schema directly).
- Application-level user data lives in `public.profiles`.
- `profiles.id` is the canonical user ID for all app data and **matches** `auth.users.id` (1:1 mapping).
- Ownership is modelled with `user_id` referencing `profiles.id`.

### 1.4 Visibility

- `catches.visibility` is a text/enum field with values:
  - `public`
  - `followers`
  - `private`
- Visibility affects:
  - Feed
  - Search
  - Venue detail pages
  - Insights
- Admins can see **everything** via admin-only RLS policies and RPCs, even when content is private or soft-deleted.

---

### 2.1 `profiles`
**Purpose**  
Represents an angler in the app, linked 1:1 with `auth.users`.

**Key fields (current schema)**

- `id UUID PK NOT NULL` – matches `auth.users.id`.
- `username TEXT UNIQUE NOT NULL` – URL-safe handle.
- `full_name TEXT` – display name.
- `bio TEXT` – profile bio.
- `avatar_path TEXT` – storage path (e.g. `avatars/<userId>/<file>`).
- `avatar_url TEXT` – public URL for avatar image.
- `location TEXT` – e.g. "Preston, UK".
- `website TEXT` – optional URL.
- `status TEXT` – short status string.
- `is_private BOOLEAN NOT NULL DEFAULT false` – whether profile is locked down.
- `is_deleted BOOLEAN NOT NULL DEFAULT false` – soft-delete flag for account removal flows.
- `deleted_at TIMESTAMPTZ` – timestamp when the profile was soft-deleted.
- `locked_for_deletion BOOLEAN NOT NULL DEFAULT false` – used by account deletion flows.
- `moderation_status TEXT NOT NULL` – current moderation state for the account.
- `warn_count INTEGER NOT NULL DEFAULT 0` – total warnings issued (denormalised counter).
- `suspension_until TIMESTAMPTZ` – optional suspension expiry.
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

**Moderation state**

- High-level moderation flags live on the profile (`moderation_status`, `warn_count`, `is_deleted`, `suspension_until`).
- Detailed reasoning/audit trails are kept in `user_warnings` and `moderation_log`.

**Relationships**

- 1 profile → many `sessions`, `catches`, `catch_comments`, `catch_reactions`, `ratings`, `notifications` (recipient), `reports` (as reporter), `user_warnings` (as warned user), `moderation_log` (as admin), `rate_limits` entries.
- 1 profile → many `profile_follows` rows (as follower and as following).
- 1 profile → many `profile_blocks` rows (as blocker and as blocked).
- 1 profile → 0 or 1 `admin_users` row.

**RLS intent**

- Any authenticated user can `SELECT` basic profile fields.
- A user can `UPDATE` only their own profile row.
- Admins have additional access via admin-only views/RPCs to support moderation, warnings, and account deletion flows.


### 2.2 `admin_users`

**Purpose**  
Defines which profiles are admins.

**Key fields**

- `user_id UUID PK NOT NULL` – FK → `profiles.id`.
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` – when admin status was granted.

**Relationships**

- 1 profile → 0 or 1 `admin_users` row.

**RLS intent**

- Only admins (or service-role) can `SELECT` or modify this table.
- Used to gate admin-only RPCs and admin UI.

---

### 2.3 `sessions`

**Purpose**  
Represents a single fishing trip. A session can contain multiple catches.

**Key fields**

- `id UUID PK NOT NULL`.
- `user_id UUID NOT NULL` – FK → `profiles.id`.
- `title TEXT NOT NULL` – short title, e.g. "Summer Carp Session".
- `date DATE NOT NULL` – date of the session.
- `venue TEXT` – free-text venue label, e.g. "Linear Fisheries".
- `venue_name_manual TEXT` – optional human-friendly venue label used by some UI components (can differ from the raw `venue` text).
- `notes TEXT` – session notes/summary.
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
- `deleted_at TIMESTAMPTZ` – soft delete flag (nullable).

**Future fields**

- `venue_id UUID` – FK → `venues.id` (Phase 3+), used when a session is explicitly tied to a normalised venue.

**Relationships**

- 1 profile → many `sessions`.
- 1 session → many `catches`.
- 1 venue → many `sessions` (once `venue_id` is wired up).

**Deletion behaviour**

- Catches **optionally** belong to a session (`session_id` can be NULL).
- In the current v3 app, deleting a session does **not** automatically soft-delete associated catches in the database.
- Any "delete session and its catches" behaviour is a **future enhancement** and should be implemented explicitly (e.g. via a dedicated RPC that soft-deletes both).

**RLS intent**

- Only the owner (`user_id = auth.uid()`) can `INSERT`, `SELECT`, `UPDATE` or soft-delete their sessions.
- No cross-user access except via admin tooling.

---

### 2.4 `catches`
**Purpose**  
Represents a single catch (fish) logged by a user. This is the core piece of content in the app.

#### Ownership & linking

- `id UUID PK NOT NULL`.
- `user_id UUID NOT NULL` – FK → `profiles.id` (who caught it).
- `session_id UUID` – FK → `sessions.id` (nullable).
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
- `deleted_at TIMESTAMPTZ` – soft delete flag (nullable).

#### Core descriptive fields (present in schema)

- **Basic info (actively used in v3 UI)**
  - `title TEXT NOT NULL` – catch title.
  - `description TEXT` – story / notes.
  - `image_url TEXT NOT NULL` – primary image.
  - `video_url TEXT` – optional video.
  - `allow_ratings BOOLEAN NOT NULL DEFAULT true`.
  - `visibility visibility_type NOT NULL` – enum values: `public | followers | private`.

- **Species**
  - `species TEXT` – free-text species label used in the UI/search.
  - `species_slug TEXT` – optional canonical species identifier (no enforced FK yet).
  - `custom_species TEXT` – free-text override.

- **Weight/size/time**
  - `weight NUMERIC` – optional.
  - `weight_unit weight_unit` – enum values: `kg | lb_oz`.
  - `length NUMERIC` – optional length.
  - `length_unit TEXT` – optional length unit.
  - `time_of_day time_of_day` – enum values: `morning | afternoon | evening | night`.
  - `caught_at DATE` – optional explicit catch date.

- **Location & water**
  - `location TEXT` – free-text venue/fishery name.
  - `location_label TEXT` – optional cleaned display label.
  - `water_type TEXT` – free-text water type label.
  - `water_type_code TEXT` – optional normalised code (intended FK to `water_types.code`).
  - `hide_exact_spot BOOLEAN NOT NULL DEFAULT false` – hide precise spot.

- **Tactics & metadata**
  - `bait_used TEXT` – typically maps to `baits.slug` in UI.
  - `method TEXT` – typically maps to `tags.slug` where `category = 'method'`.
  - `method_tag TEXT` – normalised method identifier.
  - `equipment_used TEXT` – free-text gear description.
  - `peg_or_swim TEXT` – peg number or swim name.
  - `conditions JSONB` – structured environmental data (weather, etc.).
  - `tags TEXT[]` – free-form tags.

- **Media gallery**
  - `gallery_photos TEXT[]` – optional additional photo URLs (nullable/legacy but present in schema).

- **Linking to other entities**
  - `venue_id UUID` – FK → `venues.id` (nullable; present in schema even if not always set in UI flows).

#### Backlog / future design notes

- Stricter species normalisation via a `species` table and enforced FK is **future/backlog** (today it is text + optional slug only).
- Any further normalised location fields beyond `location_label`/`water_type_code` remain backlog.

#### Relationships

- 1 profile → many `catches`.
- 1 session → many `catches`.
- Optional links to `venues` (when `venue_id` is set).
- 1 catch → many `catch_comments`, `catch_reactions`, `ratings`, `notifications`, `reports`.

#### RLS intent

- Owner (`user_id = auth.uid()`) can always see/manage their own catches (subject to soft delete).
- Other authenticated users can see only catches that are not soft-deleted and respect `visibility` (`public`, `followers`, `private`) plus block/follow rules.
- Admins can see private and soft-deleted catches via admin-only RLS/RPCs.

---

## 3. Social & Community (Phase 2)

### 3.1 `profile_follows`

**Purpose**  
Tracks follow relationships between users.

**Key fields**

- `id UUID PK NOT NULL` (generated).
- `follower_id UUID NOT NULL` – FK → `profiles.id` (who follows).
- `following_id UUID NOT NULL` – FK → `profiles.id` (who is followed).
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

**Constraints**

- Unique constraint on `(follower_id, following_id)`.
- Prevent self-follow (`CHECK (follower_id <> following_id)`).

**Relationships**

- Many-to-many between profiles.
- Used for:
  - “following” feed.
  - followers-only visibility checks.

**RLS intent**

- A user can create and delete follow relationships only where `follower_id = auth.uid()`.
- A user can `SELECT` relationships relevant to them (for feed/visibility logic).
- Admins can see all follow relationships.

---

### 3.2 `profile_blocks`
**Purpose**  
Implements the blocklist feature: hide another user’s content and prevent interactions.

**Key fields**

- `blocker_id UUID NOT NULL` – FK → `profiles.id` (who is blocking).
- `blocked_id UUID NOT NULL` – FK → `profiles.id` (who is being blocked).
- `reason TEXT` – optional context for the block.
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

**Constraints**

- Primary/unique constraint on `(blocker_id, blocked_id)` – no separate `id` column.
- Prevent self-block (`CHECK (blocker_id <> blocked_id)`) if implemented in SQL.

**Relationships**

- Many-to-many between profiles; used to hide content and disable interactions.

**RLS intent**

- A user can `INSERT`/`DELETE` rows only where `blocker_id = auth.uid()`.
- A user can `SELECT` only rows where they are the blocker.
- Admins can inspect all rows for abuse investigations.


### 3.3 `catch_comments`

**Purpose**  
Comments and threaded replies on catches.

**Key fields**

- `id UUID PK NOT NULL`.
- `catch_id UUID NOT NULL` – FK → `catches.id`.
- `user_id UUID NOT NULL` – FK → `profiles.id` (author).
- `parent_comment_id UUID` – FK → `catch_comments.id` (nullable, for replies).
  - Supports **multi-level threads** (a reply can itself have replies).
- `body TEXT NOT NULL` – comment text.
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
- `deleted_at TIMESTAMPTZ` – soft delete flag (nullable).

**Relationships**

- 1 catch → many `catch_comments`.
- 1 profile → many `catch_comments`.
- Optional thread structure via `parent_comment_id`.

**RLS intent**

- Authenticated users can `SELECT` comments on catches they’re allowed to view.
- A user can `INSERT` comments on catches they can view.
- A user can `UPDATE` / soft-delete only their own comments.
- Admins can view and moderate all comments (including soft-deleted).

---

### 3.4 `catch_reactions`
**Purpose**  
Emoji-style reactions on catches.

**Key fields**

- `id UUID PK NOT NULL`.
- `catch_id UUID NOT NULL` – FK → `catches.id`.
- `user_id UUID NOT NULL` – FK → `profiles.id`.
- `reaction reaction_type NOT NULL` – enum values: `like | love | fire`.
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

**Constraints / behaviour**

- Schema provides the `id` PK; the intended semantics are one reaction per user per catch (de-duplication happens in app/RPC logic even though only the PK is enforced at the table level).

**Relationships**

- 1 catch → many `catch_reactions`.
- 1 profile → many `catch_reactions`.

**RLS intent**

- Users can create/remove reactions where `user_id = auth.uid()` and only on catches they can view.
- Admins can see all reactions.


### 3.5 `ratings`

**Purpose**  
Numeric scores applied to catches.

**Key fields**

- `id UUID PK NOT NULL`.
- `catch_id UUID NOT NULL` – FK → `catches.id`.
- `user_id UUID NOT NULL` – FK → `profiles.id`.
- `rating NUMERIC NOT NULL` – **integer** scale `1–10` (no half steps).
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

**Constraints**

- Unique constraint on `(catch_id, user_id)`.
- `CHECK (rating BETWEEN 1 AND 10)`.

**Behaviour**

- The app already has a **leaderboard scoring formula** (mix of rating, weight, likes, etc.).
- The database’s job is to store the **raw rating**; the formula is implemented in:
  - App code, and
  - The `leaderboard_scores_detailed` view.
- That formula can evolve without changing this table’s schema.

**RLS / behaviour intent**

- A user can create/update/delete ratings where `user_id = auth.uid()`.
- Users **cannot rate their own catches** (enforced in `rate_catch_with_rate_limit` RPC + RLS).
- Ratings are only allowed on catches the user can view.
- Admins can see all ratings.

---

### 3.6 `notifications`

**Purpose**  
In-app notifications for follows, comments, reactions, ratings, mentions, and system events.

**Key fields**

- `id UUID PK NOT NULL`.
- `user_id UUID NOT NULL` – FK → `profiles.id` (recipient).
- `actor_id UUID` – FK → `profiles.id` (who triggered it; nullable for system).
- `type notification_type NOT NULL` – e.g. `new_follower`, `new_comment`, `comment_reply`, `new_rating`, `new_reaction`, `mention`, `admin_report`, `admin_warning`, `admin_moderation`.
- `message TEXT NOT NULL` – rendered text.
- `catch_id UUID` – FK → `catches.id` (nullable).
- `comment_id UUID` – FK → `catch_comments.id` (nullable).
- `extra_data JSONB` – payload for UI.
- `is_read BOOLEAN NOT NULL DEFAULT false`.
- `read_at TIMESTAMPTZ`.
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
- `deleted_at TIMESTAMPTZ`.

**Typical `extra_data` payloads**

- `admin_warning` –  
  `{ "severity": <string>, "duration_hours": <int|null>, "warning_id": <uuid> }`
- `admin_moderation` –  
  `{ "action": <string>, "catch_id"?: <uuid>, "comment_id"?: <uuid>, "reason": <string> }`
- Other types may include contextual IDs (e.g. `catch_id` / `comment_id` for comment/reaction notifications).

**Behaviour**

- Admin warning RPCs must always create an `admin_warning` notification for the user, including severity and any suspension duration in `extra_data`.
- Comment + mention flows use `create_comment_with_rate_limit` to emit `new_comment` and `mention` notifications.
- Reply flows use `comment_reply` to notify the parent comment author where appropriate.

**Relationships**

- 1 profile → many `notifications` (recipient).
- 1 profile → many `notifications` (actor).
- Optional links to `catches` and `catch_comments`.

**RLS intent**

- A user can `SELECT`, mark read, and delete only notifications where `user_id = auth.uid()`.
- Admins may be able to inspect for debugging.
- Realtime channels filter on `user_id`.

---

## 4. Moderation, Venues, Species, Rate Limiting (Phase 3+)

> **Note on enums (current schema)**  
> Enums in use: `length_unit`, `weight_unit`, `reaction_type`, `notification_type`, `visibility_type`, `time_of_day`, `report_status`, `report_target_type`, `warning_severity`, `mod_action`.

> **Moderation & reporting overview**  
> Moderation spans several tables: `profile_blocks` (blocklist), `reports` (user-submitted reports on catches/comments/profiles), `user_warnings` (warnings/suspensions), and `moderation_log` (admin audit trail). Admins are defined in `admin_users`; block/report/warning actions generate notifications and may drive `profiles.moderation_status`. Enums above back these flows.

### 4.1 `venues`
**Purpose**  
Normalised fishing venues used by sessions, catches, and dedicated venue pages.

**Key fields (current schema / v3)**

- `id UUID PK NOT NULL`.
- `slug TEXT UNIQUE NOT NULL` – URL slug for `/venues/:slug`.
- `name TEXT NOT NULL` – venue name.
- `short_tagline TEXT` – short marketing line.
- `location TEXT` – free-text region/location label.
- `description TEXT` – longer marketing/overview copy.
- `ticket_type TEXT` – e.g. `day_ticket`, `syndicate`, `club`, `holiday` (free-text/enum-ish).
- `price_from TEXT` – lowest price text; stored as TEXT in schema.
- `best_for_tags TEXT[]` – tags describing what the venue is best for.
- `facilities TEXT[]` – list of facilities.
- `website_url TEXT` – official venue website.
- `booking_url TEXT` – external booking link.
- `contact_phone TEXT` – phone number for bookings/enquiries.
- `notes_for_rr_team TEXT` – internal notes for ReelyRated staff.
- `is_published BOOLEAN NOT NULL DEFAULT false` – whether publicly visible.
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

**Planned / future fields (not in current schema)**

- `is_verified BOOLEAN` – verified badge.
- `created_by UUID` – profile that created the venue.
- Normalised location fields: `region`, `country`, `latitude`, `longitude`.
- Inline hero `image_url` (v3 uses `venue_photos` instead).

**Relationships**

- 1 venue → many `venue_events`, `venue_owners`, `venue_photos`, `venue_ratings`.
- 1 venue → 0 or 1 row in `venue_stats` (view) aggregating catches/ratings.
- Optional links from `sessions`/`catches` via `venue_id` when set.

**RLS intent**

- Public users can `SELECT` venues where `is_published = true`.
- Owners (via `venue_owners`) manage only their venues through RPCs.
- Admins can `SELECT`/manage any venue regardless of publish status.
- Mutations go through controlled RPCs (admin/owner flows), not arbitrary client updates.
- Unpublished venues are hidden from anon/non-owners by RLS; the UI shows an “Unpublished” badge only to owners/admins on venue detail.


#### 4.1.1 `venue_ratings`
**Purpose**  
Stores per-user ratings for venues (separate from catch ratings).

**Key fields (current schema)**

- `id UUID PK NOT NULL`.
- `venue_id UUID NOT NULL` – FK → `venues.id`.
- `user_id UUID NOT NULL` – FK → `profiles.id`.
- `rating NUMERIC NOT NULL` – rating value (RPC enforces `1–5`).
- `created_at TIMESTAMPTZ`.
- `updated_at TIMESTAMPTZ`.

**Constraints / behaviour**

- Unique constraint on `(venue_id, user_id)` – one rating per user per venue.
- `upsert_venue_rating` RPC enforces auth, scale (1–5), and performs upsert + aggregates.
- `get_my_venue_rating` returns the current user’s rating for a venue.

**RLS intent**

- A user can `INSERT`/`UPDATE`/`DELETE` rows where `user_id = auth.uid()`.
- Users rate only venues they can see (typically `is_published = true`).
- Admins can inspect/adjust ratings as needed.


#### 4.1.2 `venue_stats` (view)
**Purpose**  
Per-venue aggregates used on the venues index and detail pages.

**Exposed columns (current schema)**

- `venue_id UUID` – FK → `venues.id`.
- `avg_rating NUMERIC` – average venue rating.
- `rating_count BIGINT` – number of ratings.
- `total_catches BIGINT` – total catches linked to the venue.
- `recent_catches_30d BIGINT` – catches in the last 30 days.
- `headline_pb_species TEXT` – species for venue PB.
- `headline_pb_unit weight_unit` – unit for venue PB weight.
- `headline_pb_weight NUMERIC` – best recorded weight for the venue.
- `top_species TEXT[]` – list of top species at the venue.

**Sources & usage**

- Aggregates data from `catches`, `venue_ratings`, and `venues`.
- Read-only; refreshed via underlying tables (no direct writes).
- Inherits RLS from underlying tables (visibility + publish rules).


#### 4.1.3 `venue_photos`
**Purpose**  
Stores additional photos for each venue (galleries/hero selection handled in app logic).

**Key fields (current schema)**

- `id UUID PK NOT NULL`.
- `venue_id UUID NOT NULL` – FK → `venues.id`.
- `image_path TEXT NOT NULL` – storage path for the image.
- `caption TEXT` – optional caption.
- `created_by UUID` – FK → `profiles.id` (uploader), nullable.
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

**Behaviour / notes**

- There is no `is_primary`/`sort_order`/`public_url` column in the schema; hero/ordering logic is handled in app code or RPCs (e.g., first/most recent photo).
- `get_venue_photos` RPC/pages read from this table; uploads/deletes go through owner/admin flows.

**RLS intent**

- Public users can view photos for published venues.
- Owners (via `venue_owners`) and admins can manage photos.


### 4.2 `venue_owners`
**Purpose**  
Maps venues to user accounts that can manage them.

**Key fields (current schema)**

- `venue_id UUID NOT NULL` – FK → `venues.id`.
- `user_id UUID NOT NULL` – FK → `profiles.id`.
- `role TEXT NOT NULL DEFAULT 'owner'` – e.g. `owner`, `manager`.
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

**Constraints**

- Primary/unique on `(venue_id, user_id)`; no separate `id` column.

**Relationships & behaviour**

- Determines which profiles can edit venue details/events/photos via owner/admin RPCs (`admin_add_venue_owner`, `admin_remove_venue_owner`, etc.).

**RLS intent**

- Mutations are admin-gated; owners see/manage only venues where they appear.
- Admins can see and modify all rows.


### 4.3 `venue_events`
**Purpose**  
Stores events run at a venue (matches, socials, tuition days, etc.).

**Key fields (current schema)**

- `id UUID PK NOT NULL`.
- `venue_id UUID NOT NULL` – FK → `venues.id`.
- `title TEXT NOT NULL`.
- `description TEXT`.
- `event_type TEXT` – e.g. `match`, `open_day`, `tuition`.
- `starts_at TIMESTAMPTZ NOT NULL`.
- `ends_at TIMESTAMPTZ` – nullable end time.
- `ticket_info TEXT` – price/ticket summary.
- `booking_url TEXT` – event-specific booking link.
- `website_url TEXT` – event-specific info page.
- `is_published BOOLEAN NOT NULL DEFAULT false`.
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

**Behaviour / RPCs**

- Managed via admin/owner RPCs such as `admin_create_venue_event`, `admin_update_venue_event`, `admin_delete_venue_event`, and `admin_get_venue_events`.

**RLS intent**

- Owners (via `venue_owners`) and admins can create/update/delete events.
- Public users can only see `is_published = true` events.


### 4.4 `species`
**Purpose / status**  
Planned normalised list of fish species. **Not present in the current schema** (`src/lib/database.types.ts` has no `species` table).

**Current reality**

- Catches use `species TEXT` (free-text) and `species_slug TEXT` (optional canonical slug) with no enforced FK.
- Any future strict FK to a `species` table should be treated as backlog until a migration adds it.

**Future intent (backlog)**

- `slug TEXT PK`, `label`, `scientific_name`, `category`, `record_weight`, `created_at` — to be added when species normalisation is implemented.
- RLS likely public read, admin-only changes.


### 4.5 `reports`
**Purpose**  
User reports of problematic content (catches, comments, profiles).

**Key fields (current schema)**

- `id UUID PK NOT NULL`.
- `reporter_id UUID NOT NULL` – FK → `profiles.id`.
- `target_type report_target_type NOT NULL` – enum: `catch | comment | profile`.
- `target_id UUID NOT NULL` – target row id.
- `reason TEXT NOT NULL` – short category.
- `details TEXT` – optional detail.
- `status report_status NOT NULL` – enum: `open | resolved | dismissed`.
- `reviewed_by UUID` – FK → `profiles.id` (admin reviewer, nullable).
- `reviewed_at TIMESTAMPTZ`.
- `resolution_notes TEXT`.
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

**Relationships**

- 1 profile → many `reports` as reporter.
- 1 profile (admin) → many `reports` as reviewer.

**RLS intent**

- Any authenticated user can `INSERT` reports.
- Reporters may see their own reports (per policy).
- Admins can `SELECT` and update all reports; status values align with the enums above.


### 4.6 `user_warnings`
**Purpose**  
Persistent record of moderation warnings given to users.

**Key fields (current schema)**

- `id UUID PK NOT NULL`.
- `user_id UUID NOT NULL` – FK → `profiles.id` (warned user).
- `severity warning_severity NOT NULL` – enum: `warning | temporary_suspension | permanent_ban`.
- `reason TEXT NOT NULL`.
- `details TEXT` – optional extra context.
- `duration_hours INTEGER` – optional suspension length for temporary bans.
- `issued_by UUID` – FK → `profiles.id` (admin issuing the warning), nullable.
- `admin_id UUID` – FK → `profiles.id` (admin responsible/approver), nullable (kept for compatibility alongside `issued_by`).
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

**Relationships & semantics**

- 1 profile → many `user_warnings` as target (`user_id`).
- 1 profile → many `user_warnings` as issuer (`issued_by`/`admin_id`).
- `severity` + `duration_hours` drive suspensions; notifications include severity/duration in `extra_data`.

**RLS intent**

- Only admins can create warnings.
- Admins can `SELECT` all warnings.
- A user can `SELECT` their own warnings for display (per policy/RPCs).


### 4.7 `moderation_log`
**Purpose**  
Audit trail for moderation actions; feeds admin audit screens and realtime logs.

**Key fields (current schema)**

- `id UUID PK NOT NULL`.
- `admin_id UUID` – FK → `profiles.id` (nullable for system/legacy entries).
- `action mod_action NOT NULL` – enum: `delete_catch`, `delete_comment`, `restore_catch`, `restore_comment`, `warn_user`, `suspend_user`.
- `user_id UUID` – FK → `profiles.id` (target user, nullable).
- `catch_id UUID` – FK → `catches.id` (nullable).
- `comment_id UUID` – FK → `catch_comments.id` (nullable).
- `target_id UUID` – generic target id (nullable) for actions beyond catch/comment.
- `target_type TEXT` – generic target type label (nullable).
- `metadata JSONB` – structured context (reason, severity, etc.).
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

**Relationships**

- 1 profile → many `moderation_log` entries as admin.
- Optional links to affected users/catches/comments or other targets via `target_id`/`target_type`.

**RLS intent**

- Only admins can `SELECT` or write to this table (via admin RPCs).


### 4.8 `rate_limits`
**Purpose**  
Log of rate-limited actions per user and action key.

**Key fields (current schema)**

- `id BIGSERIAL PK`.
- `user_id UUID NOT NULL` – FK → `profiles.id`.
- `action TEXT NOT NULL` – e.g. `comments`, `reports`, `reactions`, `ratings`, `follows`, `catches`.
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

**Relationships**

- 1 profile → many `rate_limits` entries.

**Behaviour**

- Clients do **not** insert directly; server-side helpers/triggers enforce limits and write rows:
  - `check_rate_limit`, `get_rate_limit_status`, `user_rate_limits`, `cleanup_rate_limits`.
  - RPCs (e.g., `create_comment_with_rate_limit`, `rate_catch_with_rate_limit`) call these helpers and then insert a row.
- Current policy (enforced in RPC logic, not DB constraints):
  - comments: 20/hour
  - reports: 5/hour
  - reactions: 50/hour
  - ratings: 50/hour
  - follows: 30/hour
  - catches: 10/hour (per legacy trigger helpers)
- On limit breach, RPCs raise `RATE_LIMITED: <action> – max <N> per hour` for the frontend to handle.

**RLS intent**

- Inserts are allowed for authenticated users when `user_id = auth.uid()` (used by triggers/RPCs); no general SELECT/UPDATE/DELETE for normal users.
- Admins may `SELECT` for debugging; otherwise data is hidden from clients.


### 4.9 Views: Leaderboards & Insights

#### `leaderboard_scores_detailed` (view)
- Aggregates catches + ratings (and profiles) into leaderboard entries.
- Sources data from `public.catches`, `public.profiles`, and `public.ratings` (respecting visibility/soft-delete rules).
- Includes only catches where `deleted_at IS NULL` and `visibility = 'public'`.

> **Implementation note:** The exact columns come from the generated types in `src/lib/database.types.ts`; this section mirrors that shape.

**Exposed columns (current v3 schema)**

- Identity & ownership: `id`, `user_id`, `owner_username`.
- Catch description: `title`, `description`, `species`, `species_slug`, `caught_at`, `created_at`.
- Weight/size: `weight`, `weight_unit`, `length` (nullable), `length_unit` (nullable).
- Location & water: `location`, `location_label`, `water_type_code`.
- Methods & tags: `method`, `method_tag`, `tags`.
- Media: `image_url`, `gallery_photos` (nullable array), `video_url`.
- Conditions/metadata: `conditions` (JSONB).
- Scoring & ratings: `total_score`, `avg_rating`, `rating_count`.

**Notes on optional/legacy fields**

- `length`, `length_unit`, and `gallery_photos` exist in the view but may be null for most catches; UI must treat them as optional.

**Scoring**

- `total_score` combines weight, ratings, and engagement signals.
- `avg_rating` / `rating_count` are aggregates from `ratings`.


### 4.10 RPCs / helpers (current v3 surface)

- **Catch/social**
  - `rate_catch_with_rate_limit` – validates visibility/self-rating, enforces 1–10 bounds and rate limits, upserts rating, emits `new_rating`.
  - `react_to_catch_with_rate_limit` – validates visibility/self-reaction, enforces rate limits, upserts reaction.
  - `create_comment_with_rate_limit` – inserts comment with visibility/block checks, rate limits, and emits `new_comment`/`mention`.
  - `get_catch_rating_summary` – returns `catch_id, rating_count, average_rating, your_rating` for a catch (enforces catch visibility; owners/admins can see unpublished catches linked to a venue; allow_ratings respected).
- **Venues (public/read)**
  - `get_venues` – venue directory with metadata + stats, optional search on name/location, ordered by name.
  - `get_venue_by_slug` – single venue with metadata + stats for detail page.
  - `get_venue_recent_catches`, `get_venue_top_catches` – recent/top catches for a venue (enforces catch visibility, venue published via RLS).
  - `get_venue_top_anglers` – top anglers at a venue.
  - `get_venue_photos` – gallery photos for a venue.
  - `get_venue_upcoming_events`, `get_venue_past_events` – venue events split by time.
- **Venue owner/admin helpers**
  - `owner_add_venue_photo`, `owner_delete_venue_photo` – manage photos.
  - `owner_create_venue_event`, `owner_update_venue_event`, `owner_delete_venue_event` – manage events.
  - `admin_update_venue_metadata`, `admin_create_venue_event`, `admin_get_venue_events`, etc. – admin-side venue management.

> These RPCs must enforce the same visibility/publish rules described above; the app consumes them for directory cards, venue detail sections, and rating/reaction flows.


#### `catch_comments_with_admin` (view)
**Purpose**  
Augments `catch_comments` with an `is_admin_author` flag for UI badges.

**Columns**

- `id`, `catch_id`, `user_id`, `parent_comment_id`, `body`, `created_at`, `updated_at`, `deleted_at` (nullable mirrors of `catch_comments`).
- `is_admin_author BOOLEAN` – true when the author is in `admin_users`.

**Notes**

- Inherits RLS from `catch_comments`/`profiles`; used by comment feeds so the UI can badge admin authors without extra joins.

#### `catch_mention_candidates` (view)
**Purpose**  
Provides mention suggestions for a catch based on participants.

**Columns**

- `catch_id`, `user_id`, `username`, `avatar_path`, `avatar_url`, `last_interacted_at`.

**Notes**

- Combines the catch owner and prior commenters; inherits RLS from underlying tables so suggestions only include users the viewer can see/interact with.


#### `user_insights_view` (view)

Per-user aggregates used on the Insights page:

- Catches over time (per month / date range).
- Breakdown by venue.
- Breakdown by species.
- Time-of-day performance.

Planned for Phase 3+; implementation details should follow the same conventions as `catches` and `sessions`.

**RLS intent**

- Read-only from the client’s perspective.
- Must respect catch visibility rules and soft deletes in the underlying queries.

---

## 5. Lookup Tables

### 5.1 `baits`

**Purpose**  
Standard list of bait options for dropdowns.

**Key fields**

- `slug TEXT PK` – or unique key.
- `label TEXT NOT NULL` – display name.
- `category TEXT NOT NULL` – e.g. `natural`, `processed`, `lures`.
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

**RLS intent**

- Public read.
- Only admins edit.

---

### 5.2 `tags` (methods)

**Purpose**  
Standard set of methods, stored in a generic `tags` table.

**Key fields**

- `slug TEXT PK` – or unique key.
- `label TEXT NOT NULL` – display name.
- `category TEXT NOT NULL` – usually `method`.
- `method_group TEXT` – e.g. `float`, `bottom`, `lure`, `margin`, etc.
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

**RLS intent**

- Public read.
- Only admins edit.

---

### 5.3 `water_types`

**Purpose**  
Describes types of water bodies.

**Key fields**

- `code TEXT PK` – or unique key.
- `label TEXT NOT NULL` – display name, e.g. `Lake`, `River`.
- `group_name TEXT NOT NULL` – e.g. `stillwater`, `flowing`, `commercial`.
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

**RLS intent**

- Public read.
- Admin-only changes.

---

### 5.4 `rate_limits`

**Purpose**  
Per-user action log for rate limiting (comments, reports, reactions, ratings, follows, catches).

**Key fields**

- `id BIGSERIAL PK`.
- `user_id UUID NOT NULL` – FK → `profiles.id`.
- `action TEXT NOT NULL` – action key.
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

**RLS intent**

- Inserts typically via RPC/helpers; auth users insert where `user_id = auth.uid()`.
- Hidden from clients otherwise; admins may read for debugging.

---

## 6. Relationship Summary

High-level entity relationships:

- `auth.users` 1:1 `profiles`
- `profiles` 1:many `sessions`
- `profiles` 1:many `catches`
- `sessions` 1:many `catches`
- `profiles` many:many `profiles` via `profile_follows`
- `profiles` many:many `profiles` via `profile_blocks`
- `catches` 1:many `catch_comments`
- `catches` 1:many `catch_reactions`
- `catches` 1:many `ratings`
- `profiles` 1:many `notifications`
- `profiles` 1:many `reports` (as reporter)
- `profiles` 1:many `user_warnings` (as warned user)
- `profiles` 1:many `moderation_log` (as admin)
- `profiles` 1:many `rate_limits`
- `profiles` 0:1 `admin_users`
- `venues` 1:many `sessions` (future via `venue_id`)
- `venues` 1:many `catches` (future via `venue_id`)
- `venues` 1:many `venue_events`
- `venues` 1:many `venue_owners`
- `species` 1:many `catches` (via `species_slug` / future `species_id`)

---

## 7. RLS & Auth Overview (Summary)

Short summary of intent; actual SQL policies must match this:

- **profiles**

  - Public-ish `SELECT` for basic fields.
  - Owner-only `UPDATE` for profile details.
  - Admin-only access to account deletion flags on profiles and to moderation tables such as `user_warnings` and `moderation_log`.

- **sessions**

  - Owner-only CRUD.
  - No general public access.

- **catches**

  - `SELECT` obeys visibility + soft-delete rules.
  - Owner can delete/soft-delete.
  - Admins can see everything, including private and soft-deleted catches.

- **profile_follows**

  - Users manage their own follows.
  - Only relevant rows are visible to each user.

- **profile_blocks**

  - Users manage their own blocklist.
  - Block relationships are only visible to the blocker (plus admins).

- **catch_comments, catch_reactions, ratings**

  - Users manage their own rows.
  - Only allowed on catches they can view.
  - Users can’t rate their own catches.

- **notifications**

  - Only recipient can see/modify their notifications.

- **reports**

  - Any authenticated user can create reports.
  - Admins manage status and review.

- **admin_users, user_warnings, moderation_log, rate_limits**

  - Admin-only write.
  - Admin-only read, except users can see **their own** `user_warnings` and rate-limit rows.

- **venues, venue_owners, venue_events, species, baits, tags, water_types**

  - Public read for user-facing data (published venues/events, lookup tables).
  - Admin/owner-only changes.

---

## 8. Notifications, Comments & Mentions (Current Implementation)

### 8.1 Notifications

- Types in use: `new_comment`, `mention`, `new_reaction`, `new_rating`, `new_follower`, admin types (`admin_report`, `admin_warning`, `admin_moderation`).
- Dedupe: `new_reaction` and `new_follower` dedupe via unique constraints; `new_comment` and `mention` are per-event.
- Routing: comment-related types deep-link to `/catch/:catchId?commentId=:commentId` when `comment_id` is present; otherwise `/catch/:catchId`. Follow falls back to actor profile; admin types route per notifications-utils.
- Creation: `create_comment_with_rate_limit` emits `new_comment` to the catch owner (skip self/deleted catches) and `mention` to mentioned users.
- Non-blocking: notification failures must not block comment/mention insert.

### 8.2 Comments

- Threading: `parent_comment_id` supports replies; soft delete via `deleted_at`; admins can view deleted content.
- Admin badge: view `catch_comments_with_admin` exposes `is_admin_author` via `public.is_admin(user_id)`; badges are author-based and visible to all.
- Rate limits: non-admins limited (20/hour) via `check_rate_limit` + `rate_limits`; admins bypass.
- Visibility: RLS enforces catch visibility (public/followers/private) and owner/admin access; comments visible only when catch is visible to viewer.
- Notifications: owner receives `new_comment` (skip self); mentions trigger `mention`.

### 8.3 Mentions

- Parsing: regex `@([A-Za-z0-9_.]+)` on trimmed body in `create_comment_with_rate_limit`.
- Resolution: case-insensitive match to `profiles.username`; distinct usernames per comment.
- Skips: self and catch owner (owner notified via `new_comment` already).
- Visibility gates:
  - Public: allow all mentioned users.
  - Followers: allow owner, admins, or followers of catch owner.
  - Private: allow owner or admins only.
- Notifications: `mention` type with `catch_id`, `comment_id`, `mentioned_username` in `extra_data`; non-blocking.
- Mention candidates view: `catch_mention_candidates` includes catch owner + commenters with `last_interacted_at`; inherits catch/comment RLS.

---

## 9. Admin Visibility & Badges

- Source of truth: `admin_users` table and `public.is_admin()` helper.
- Exposure: views (e.g. `catch_comments_with_admin`) add `is_admin_author`; badges are based on author role, not viewer role.
- Behaviour: admins can see private/soft-deleted content where views/RPCs are designed for moderation; admin flags/badges are informational and do not bypass viewer routing on the frontend.

---

## 10. Rate Limits (Implementation Overview)
- Table: `rate_limits` (id, user_id, action, created_at).
- Helpers/RPCs: `check_rate_limit`, `user_rate_limits`, `get_rate_limit_status`, `cleanup_rate_limits`; application RPCs insert via these helpers (clients do not write directly).
- Current policy in RPCs (not DB constraints): comments 20/hour; reports 5/hour; reactions 50/hour; ratings 50/hour; follows 30/hour; catches 10/hour.
- Error format: `RATE_LIMITED: <action> – max <N> per hour` for client messaging.
