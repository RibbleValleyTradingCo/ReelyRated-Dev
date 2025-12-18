# RLS Design (v3)

Supabase projects:
- Prod: ReelyRatedv3 (ref: jyuwmhplvzmkunpizorz)
- Dev:  ReelyRated-Dev (ref: xvqagwlgrntdwlhsrubx)

This document defines the intended **Row Level Security (RLS)** behaviour for key public tables and our approach to existing **SECURITY DEFINER** views.

Goals:

- Make sure **public data** is truly public only when intended.
- Restrict **sensitive/relationship tables** (blocks, ownership) to the right user.
- Limit the blast radius of **SECURITY DEFINER** to admin-only surfaces or remove it where unnecessary.
- Implement all changes via **new migrations only** (no editing historical migrations).

---

## 1. `public.profile_blocks`

### 1.1 Purpose

`profile_blocks` stores **user-to-user block relationships**:

- A **blocker** chooses to hide or mute a **blocked** profile.
- Used by the app to:
  - Hide content from blocked users.
  - Optionally reflect “you are blocked” logic.

### 1.2 Desired RLS Semantics

**Enable RLS** on `public.profile_blocks`.

#### 1.2.1 Normal users

- **SELECT**:
  - A user should see only rows where they are the **blocker** or the **blocked**:
    - `auth.uid() = blocker_id OR auth.uid() = blocked_id`
- **INSERT**:
  - A user may only create blocks where they are the **blocker**:
    - `auth.uid() = blocker_id`
- **DELETE**:
  - A user may only delete blocks they created:
    - `auth.uid() = blocker_id`

#### 1.2.2 Admins

- Admins (users present in `public.admin_users`) may:
  - **SELECT/INSERT/DELETE** any row in `profile_blocks` for moderation/support purposes.
- Implemented via an `admin_users`-based policy:
  - `EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())`

### 1.3 Implementation Notes

- Add **new migrations** to:
  - `ALTER TABLE public.profile_blocks ENABLE ROW LEVEL SECURITY;`
  - Add separate policies for:
    - `SELECT` self/other (`blocker_id` and `blocked_id`).
    - `INSERT` self as blocker.
    - `DELETE` self as blocker.
    - Optional admin-all policy.
- Frontend already uses `blocker_id = auth.uid()` when inserting; this should remain valid under RLS.

---

## 2. `public.venues`

### 2.1 Purpose

`venues` stores public-facing fishing venues in the UK:

- Rows represent lakes/fisheries.
- Used by:
  - `/venues` directory.
  - `/venues/:slug` detail.
  - `/my-venues` and admin tools.

### 2.2 Desired RLS Semantics

**Enable RLS** on `public.venues`.

We distinguish between:

- **Public read** of *published* venues.
- **Owner/admin read & write** for management.
- **Admin-only insertion** (v3 does not yet support public venue creation).

#### 2.2.1 Public users (anon / authenticated)

- **SELECT**:
  - Can read *only* venues where `is_published = true`.
  - This powers:
    - `/venues` directory.
    - `/venues/:slug` public detail.

#### 2.2.2 Venue owners

Ownership is defined by `public.venue_owners`:

- A user is an **owner** if there exists:
  - `venue_owners(venue_id = venues.id, user_id = auth.uid())`.

For owners:

- **SELECT**:
  - Can read:
    - All venues they own **(even if not published yet)**.
- **UPDATE**:
  - Can update venues they own.
  - Typical fields: description, facilities, best_for_tags, ticket_type, price_from, etc.
  - Can flip `is_published` if allowed by product rules (enforced in app/RPC layer if needed).

#### 2.2.3 Admins

Admins (present in `public.admin_users`) may:

- **SELECT** any venue (published or not).
- **UPDATE** any venue.
- **INSERT** new venues (if we allow direct insert vs RPC).

#### 2.2.4 Inserts

For v3:

- **INSERT** into `venues` is treated as **admin-only**:
  - Only users in `admin_users` may create new venues.
  - Future: if we add venue self-creation, we can relax this and automatically insert into `venue_owners` for the creator.

### 2.3 Implementation Notes

- Add **new migrations** to:
  - `ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;`
  - Policies:
    - `SELECT` published-only for everyone.
    - `SELECT` owner-or-admin for their venues.
    - `UPDATE` owner-or-admin for allowed fields.
    - `INSERT` admin-only.
- Existing RPCs and pages (`/venues`, `/venues/:slug`, `/my-venues`, admin venue tools) should be re-tested under RLS to confirm they behave as expected.

---

## 3. SECURITY DEFINER Views

Supabase linter currently flags the following **SECURITY DEFINER** views:

- `public.catch_mention_candidates`
- `public.catch_comments_with_admin`
- `public.leaderboard_scores_detailed`
- `public.venue_stats`

We split them into:

- **Group A: Admin/moderation views** – need elevated behaviour, but must be locked down.
- **Group B: Public stats views** – should not require elevated privileges; normal RLS is enough.

### 3.1 Group A – Admin/Moderation Views

- `public.catch_mention_candidates`
- `public.catch_comments_with_admin`

#### Intent

These views can expose:

- Deleted/hidden comments.
- Extra moderation metadata.
- Wider candidate sets than a normal user should see.

#### Decision

- **Keep elevated behaviour**, but:
  - **Revoke direct `SELECT`** from `anon` and `authenticated`.
  - Expose them **only via admin-only RPCs** (e.g. `admin_get_catch_comments_with_admin`, `admin_get_catch_mention_candidates`).
  - Each RPC:
    - Is `SECURITY DEFINER`.
    - Includes an explicit `is_admin(auth.uid())`-style check using `public.admin_users`.

**Implementation notes:**

- New migration to:
  - `REVOKE ALL ON public.catch_comments_with_admin FROM anon, authenticated;`
  - `REVOKE ALL ON public.catch_mention_candidates FROM anon, authenticated;`
  - Ensure frontend only calls the **RPCs**, not the views directly.
- PAGE-RPC-MAP should record:
  - Admin pages → admin RPC(s) → underlying views.

### 3.2 Group B – Public Stats Views

- `public.leaderboard_scores_detailed`
- `public.venue_stats`

#### Intent

These are **read-only, aggregated views** used on:

- Leaderboards / rankings.
- Venue cards, stats, and summaries.

They only need to surface:

- **Public catches** (e.g. `visibility = 'public'` and not soft-deleted).
- **Published venues** (`is_published = true`).

#### Decision

- **Remove SECURITY DEFINER behaviour** from these views.
- Ensure the view definitions **respect RLS and visibility flags**, e.g.:

  - For `leaderboard_scores_detailed`:
    - Only aggregate catches where `deleted_at IS NULL` and `visibility = 'public'`.
  - For `venue_stats`:
    - Only aggregate stats over venues where `is_published = true` and catches that are public.

**Implementation notes:**

- New migration to recreate these views **without** SECURITY DEFINER semantics (standard Postgres views).
- Optionally:
  - Restrict direct access by revoking from `anon` and granting to `authenticated` only.
  - Or wrap them in simple RPCs like `get_leaderboard_scores`, if we want a consistent RPC layer.
- Verify that:
  - Normal users see only public, published data.
  - Admins can still see everything they need via underlying tables/RPCs.

---

## 4. Core Social Tables: Catches, Comments, Reactions

These tables underpin the feed and catch detail pages. They carry sensitive content and must enforce visibility, ownership, and blocking rules.

### 4.1 `public.catches`

#### Purpose

Stores individual catches (fish caught by users), including species, media, location, visibility, and metadata. Used by:

- Feed (`/`, `/feed`, `/community`)
- Catch detail pages
- Leaderboard/stat views
- Venue stats (via venue_id links and views)

#### Desired RLS Semantics

**RLS must remain enabled** on `public.catches`.

We distinguish:

- **Owner** – the user who created the catch (`user_id = auth.uid()`).
- **Followers** – users who follow the owner (via `profile_follows`).
- **Blocked** – users either blocked by, or blocking, the owner (`profile_blocks`).
- **Admins** – users in `public.admin_users`.

##### 4.1.1 Normal users (non-admin)

- **SELECT**:
  - A user may see a catch if **all** of the following hold:
    - Catch is not soft-deleted: `deleted_at IS NULL`.
    - The catch is **visible to them** based on `visibility` enum:
      - `visibility = 'public'`: everyone can see (subject to block rules).
      - `visibility = 'followers'`: only followers of the owner may see.
      - `visibility = 'private'`: only the owner (and admins) may see.
    - There is **no block relationship** between viewer and owner:
      - No row in `profile_blocks` where `(blocker_id = viewer AND blocked_id = owner)` or vice versa.
  - The owner can always see their own catches (regardless of visibility), as long as not hard-deleted.

- **INSERT**:
  - A user can insert catches only for themselves:
    - `user_id = auth.uid()`.

- **UPDATE**:
  - A user can update only catches they own:
    - `user_id = auth.uid()`.
  - RLS does not restrict what columns they can change; the app/UI should decide allowed edits (title, visibility, etc.).

- **DELETE**:
  - A user can soft-delete only their own catches:
    - `user_id = auth.uid()`.

##### 4.1.2 Admins

- Admins may **SELECT/UPDATE/DELETE** any catch (even private, deleted, or belonging to blocked users), via:
  - An `admin_users`-based policy that grants broad access when:
    - `EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())`.

Moderation actions should still flow through admin RPCs (e.g. `admin_delete_catch`, `admin_restore_catch`) to keep an audit trail in `moderation_log`.

#### Implementation notes

- Catch visibility logic should be kept in **RLS**, not just in views:
  - This ensures any direct `.from('catches')` query respects privacy.
- Leaderboard / venue stats views must filter to `deleted_at IS NULL` and `visibility = 'public'` for non-admins.
- Any new RPC that returns catches must either:
  - Reuse the normal RLS (simple `select`), or
  - Enforce equivalent checks in SQL if using `SECURITY DEFINER`.

---

### 4.2 `public.catch_comments`

#### Purpose

Stores threaded comments on catches.

#### Desired RLS Semantics

**RLS enabled** on `public.catch_comments`.

##### Normal users

- **SELECT**:
  - Can read comments on catches they are allowed to see (per catch RLS), subject to:
    - `deleted_at IS NULL` for normal users.
  - The comment author can see their own comments even if later soft-deleted, if desired (this is a product choice; default assumption is deleted comments are hidden from everyone except admins).

- **INSERT**:
  - User may insert comments only as themselves:
    - `user_id = auth.uid()`.

- **UPDATE**:
  - User may update their own comments:
    - `user_id = auth.uid()`.

- **DELETE**:
  - User may soft-delete their own comments:
    - `user_id = auth.uid()`.

##### Admins

- Admins may **SELECT/UPDATE/DELETE** any comment (including deleted ones) via:
  - `admin_users`-based policy.
- Admin-only tooling (e.g. AdminUserModeration) should generally use:
  - `catch_comments_with_admin` view via admin RPCs, not direct table queries.

#### Implementation notes

- RLS should ensure comments are never exposed if the underlying catch is not visible to the viewer.
- Any `SECURITY DEFINER` functions that work with comments must still check admin status explicitly.

---

### 4.3 `public.catch_reactions`

#### Purpose

Stores per-user reactions/likes on catches.

#### Desired RLS Semantics

**RLS enabled** on `public.catch_reactions`.

##### Normal users

- **SELECT**:
  - May read reactions for catches they can see (matching catch RLS).
  - Typically used for showing reaction counts/current user’s reaction.

- **INSERT**:
  - May insert/update reactions only with `user_id = auth.uid()`.

- **UPDATE / DELETE**:
  - May change or remove only their own reactions:
    - `user_id = auth.uid()`.

##### Admins

- Admins can read all reactions for moderation/analytics.
- Mutations by admins should be rare and generally via dedicated RPCs if needed.

#### Implementation notes

- RLS can allow aggregated counts (e.g. via views) while still enforcing row-level ownership for raw rows.
- All client-side reaction helpers should rely on `.from('catch_reactions')` calls that respect these policies.

---

## 5. Profiles, Follows & Blocks

### 5.1 `public.profiles`

#### Purpose

Stores public user profile data and moderation state (soft delete, warnings, suspension).

#### Desired RLS Semantics

**RLS enabled** on `public.profiles`.

##### Normal users

- **SELECT**:
  - May see basic profile fields for other users, except when:
    - The profile is soft-deleted (`is_deleted = true`) and the viewer is not an admin.
    - There is a mutual block condition that should hide profiles (product choice: can be strict or relaxed).

- **INSERT**:
  - Typically managed by backend/Supabase auth; no direct inserts from client.

- **UPDATE**:
  - User may update their own profile:
    - `id = auth.uid()`.
  - Moderation fields (`warn_count`, `moderation_status`, `suspension_until`) remain admin-only (see below).

##### Admins

- **SELECT**:
  - May see all profiles, including soft-deleted ones.

- **UPDATE**:
  - May update moderation fields and perform administrative changes as needed.

#### Implementation notes

- Keep moderation-related writes flowing through SECURITY DEFINER RPCs where possible (e.g. warn/ban flows), even if RLS would technically allow direct admin writes.
- Ensure profile visibility is considered in any search or discovery RPCs.

---

### 5.2 `public.profile_follows` (or equivalent follows table)

#### Purpose

Represents follow relationships between profiles. Used to drive:

- Feed filters (“people you follow”).
- Visibility rules for `visibility = 'followers'`.

#### Desired RLS Semantics

**RLS enabled** on `public.profile_follows`.

##### Normal users

- **SELECT**:
  - May see follow rows where they are either `follower_id` or `followed_id`.

- **INSERT**:
  - May only create follow rows where they are the follower:
    - `follower_id = auth.uid()`.

- **DELETE**:
  - May only delete follow rows where they are the follower:
    - `follower_id = auth.uid()`.

##### Admins

- May see all follow relationships.
- Rarely need to mutate them directly; if so, use admin RPCs.

#### Implementation notes

- Feed and visibility logic should treat this table as the single source of truth for “followers”.

---

## 6. Moderation & Safety Tables

### 6.1 `public.notifications`

#### Purpose

Stores in-app notifications for users (new comment, mention, reaction, rating, admin warning, etc.).

#### Desired RLS Semantics

**RLS enabled** on `public.notifications`.

##### Normal users

- **SELECT**:
  - User may only see notifications where they are the recipient:
    - `user_id = auth.uid()`.

- **UPDATE**:
  - User may update only fields relevant to their own notifications (e.g. `read_at`), not structural fields:
    - `user_id = auth.uid()`.

- **INSERT / DELETE**:
  - Normal users do **not** insert or delete notifications directly.
  - All creation should go through RPCs (e.g. `create_notification`, comment/mention/rating RPCs) that encapsulate logic and enforce rate limits.

##### Admins

- May read notifications for support/debugging via admin RPCs if needed.
- Should not arbitrarily delete notifications directly; use tooling if required.

#### Implementation notes

- Treat `notifications` as **write-only via server-side/RPC**; clients only mark as read.
- `extra_data` JSONB holds structured metadata; RLS should not try to interpret it, just scope on `user_id`.

---

### 6.2 `public.reports`

#### Purpose

Stores user reports for content (catches, comments, profiles) and their review status.

#### Desired RLS Semantics

**RLS enabled** on `public.reports`.

##### Normal users

- **INSERT**:
  - A user may create reports where `user_id = auth.uid()`.

- **SELECT**:
  - Option A (simple): Users do **not** see reports after submission (write-only).
  - Option B (more transparent): Users can see their own reports only (`user_id = auth.uid()`).
  - Default assumption: Option A (write-only) unless product requirements say otherwise.

- **UPDATE / DELETE**:
  - Normal users do not update or delete reports.

##### Admins

- May **SELECT/UPDATE** all reports.
- Change `status` (open/resolved/dismissed), add resolution notes, etc.

#### Implementation notes

- All review actions should go through admin RPCs to ensure consistent audit behaviour and potential future hooks.

---

### 6.3 `public.user_warnings`

#### Purpose

Stores warnings issued to users (warning/temporary suspension/permanent ban).

#### Desired RLS Semantics

**RLS enabled** on `public.user_warnings`.

##### Normal users

- **SELECT**:
  - A user may see warnings where they are the target:
    - `user_id = auth.uid()`.

- **INSERT/UPDATE/DELETE**:
  - Normal users may not directly write to this table.

##### Admins

- May **SELECT/INSERT** warnings for any user.
- Updates (e.g. correcting a warning) should be via admin-only RPCs.
- Deletion should be rare; consider soft-delete semantics if needed.

#### Implementation notes

- The `admin_warn_user` RPC should remain SECURITY DEFINER and enforce admin checks.
- Deactivation/clearing of moderation status should be handled via RPCs (e.g. `admin_clear_moderation_status`) that also update related profile state.

---

### 6.4 `public.moderation_log`

#### Purpose

Stores an immutable audit log of moderation actions (warnings, deletions, restores, etc.).

#### Desired RLS Semantics

**RLS enabled** on `public.moderation_log`.

##### Normal users

- **SELECT**:
  - Optionally, users may see entries targeting themselves only, but by default:
    - No direct access from normal users (log is internal).

- **INSERT/UPDATE/DELETE**:
  - No direct writes; only admin RPCs and backend logic should insert.

##### Admins

- May see the full moderation log.
- Must not update or delete records (append-only log).

#### Implementation notes

- Enforce append-only behaviour via RLS and constraints (e.g. no UPDATE/DELETE policies).
- All admin RPCs that perform moderation should insert a log entry.

---

### 6.5 `public.rate_limits`

#### Purpose

Stores per-user/action rate limit state.

#### Desired RLS Semantics

- **No direct client SELECT/UPDATE/DELETE**; reads are admin-only (ideally via restricted RPCs).
- **INSERT allowed when `user_id = auth.uid()`** so triggers/RPCs that run in the caller’s context can log attempts.

##### Normal users

- **SELECT/UPDATE/DELETE**:
  - Denied by RLS and/or by not exposing the table via PostgREST.
- **INSERT**:
  - Allowed only when `user_id = auth.uid()`; used by triggers/RPCs that log attempts (e.g., `enforce_catch_rate_limit`).

##### Admins

- May inspect rate limit rows via admin tooling if needed, ideally through restricted RPCs.

#### Implementation notes

- Confirm Supabase API configuration does not expose `rate_limits` directly.
- Keep `check_rate_limit` and related RPCs SECURITY DEFINER with explicit checks and comments.

---

## 7. Venue Ownership & Events

### 7.1 `public.venue_owners`

#### Purpose

Defines which users own/manage which venues.

#### Desired RLS Semantics

**RLS enabled** on `public.venue_owners`.

##### Normal users

- **SELECT**:
  - May see rows where `user_id = auth.uid()` (the venues they own).
  - Optionally, we may allow public read of ownership for transparency (not required in v3).

- **INSERT/DELETE**:
  - Normal users do **not** directly modify `venue_owners`.
  - Ownership changes happen via admin RPCs (e.g. `admin_add_venue_owner`, `admin_remove_venue_owner`).

##### Admins

- May see all ownership rows.
- May add/remove owners via dedicated SECURITY DEFINER RPCs.

#### Implementation notes

- `venue_owners` is used by `venues` RLS to determine which users can manage a venue.
- Keep ownership changes audited via `moderation_log` or a similar mechanism where appropriate.

---

### 7.2 `public.venue_events`

#### Purpose

Stores events linked to venues (matches, socials, special sessions).

#### Desired RLS Semantics

**RLS enabled** on `public.venue_events`.

##### Normal users

- **SELECT**:
  - May see events for **published** venues, or events explicitly marked as public.

- **INSERT/UPDATE/DELETE**:
  - Normal users do not create or edit events directly in v3.

##### Owners

- Users that own a venue (via `venue_owners`) may:
  - **SELECT** events for their venues (including drafts/unpublished).
  - **INSERT/UPDATE/DELETE** events for their venues via owner RPCs.

##### Admins

- May manage events for any venue via admin RPCs.

#### Implementation notes

- Prefer owner/admin RPCs (e.g. `owner_create_venue_event`, `admin_update_venue_event`) over direct table writes.
- RLS should ensure:
  - Only owners/admins can change events.
  - Public users see only public events associated with published venues.

---

## 8. Summary

- **`profile_blocks`**:
  - RLS enabled.
  - Users can see/manage only their own blocking relationships.
  - Admins can see/manage all.

- **`venues`**:
  - RLS enabled.
  - Everyone can read **published** venues.
  - Owners/admins can read and update their venues (including unpublished).
  - Inserts are **admin-only** in v3.

- **SECURITY DEFINER views**:
  - **Moderation views** (`catch_mention_candidates`, `catch_comments_with_admin`): kept SECURITY DEFINER but locked behind admin-only RPCs and not directly selectable by normal roles.
  - **Public stats views** (`leaderboard_scores_detailed`, `venue_stats`): recreated as normal views, relying on RLS on underlying tables, with no elevated privileges.

All of this must be implemented via **new migrations**, then verified via:

- Supabase lint (to clear current ERRORs).
- Manual testing of relevant pages (blocks, venues, admin tools, leaderboards).
