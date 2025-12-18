# ReelyRated – Version 3 Feature Inventory

Location: `docs/version3/FEATURE-INVENTORY.md`  
Related docs:

- `HARDENING-TEST-PLAN.md`
- `PAGE-RPC-MAP.md`
- `TEST-PLAN.md`

---

## 1. Purpose

This document lists all **product features** in ReelyRated from a **user-facing perspective**.

It is **not** code-level; it’s how a user or admin would describe what the app does.

For each feature, we capture:

- **Description**
- **User roles** (Anon / Logged-in / Venue owner / Admin)
- **Criticality**: `Critical | High | Medium | Low`
- **Pages / routes** where it appears
- **Backend dependencies** (RPCs / tables) – to be filled in and cross-checked against `PAGE-RPC-MAP.md`
- **Notes / edge cases**

This inventory will feed directly into `TEST-PLAN.md` (acceptance criteria + test cases).

---

## 2. Legend

**Roles:**

- `Anon` – not signed in
- `User` – normal signed-in user
- `Owner` – venue owner
- `Admin` – admin / moderator

**Criticality:**

- `Critical` – breakage here makes the app unusable or unsafe.
- `High` – important core value; breakage is serious but app still partly usable.
- `Medium` – valuable but non-core.
- `Low` – nice-to-have.

---

## 3. Auth & Accounts

### 3.1 Sign Up

- **Description:** New user creates an account (email + password, plus any required metadata such as username).
- **Roles:** Anon → User
- **Criticality:** Critical
- **Pages / Routes:**
  - `/auth` (or equivalent auth page / modal)
- **Backend dependencies (to verify later):**
  - Supabase auth sign-up
  - Tables: `profiles`
  - RPCs: _(TBD – e.g. profile bootstrap, if any)_
- **Notes / Edge cases:**
  - Duplicate email
  - Duplicate username
  - Email confirmation (if required)

---

### 3.2 Sign In / Sign Out

- **Description:** Existing user logs into the app and can log out.
- **Roles:** Anon ↔ User
- **Criticality:** Critical
- **Pages / Routes:**
  - `/auth`
  - Global header / navigation (sign out)
- **Backend dependencies:**
  - Supabase auth sign-in / sign-out
- **Notes / Edge cases:**
  - Invalid credentials
  - Locked / banned users (if enforced via RLS or custom logic)

---

### 3.3 Password Reset

- **Description:** User requests a password reset email and uses the link to set a new password.
- **Roles:** Anon / User
- **Criticality:** High
- **Pages / Routes:**
  - `Forgot password` view
  - `Reset password` view (deep link from email)
- **Backend dependencies:**
  - Supabase `resetPasswordForEmail`
  - Supabase `updateUser` for new password
- **Notes / Edge cases:**
  - Expired / already-used link
  - Invalid token
  - User feedback on success/failure

---

### 3.4 Profile View & Edit

- **Description:** User can view and edit their own profile (avatar, bio, name, location, website, etc.).
- **Roles:** User
- **Criticality:** High
- **Pages / Routes:**
  - `/profile/:username` (view)
  - `/settings/profile` (edit)
- **Backend dependencies:**
  - Tables: `profiles`
  - RPCs: _(TBD – e.g. profile update helpers)_
- **Notes / Edge cases:**
  - Validation of fields
  - Avatar upload / storage paths
  - Deleted / deactivated profiles

---

### 3.5 Privacy & Blocking

- **Description:** User can manage privacy (e.g. private profile / catches visibility) and block other users.
- **Roles:** User
- **Criticality:** High
- **Pages / Routes:**
  - `/settings/profile` (privacy controls in v3)
- **Backend dependencies:**
  - Tables: `profiles`, `profile_blocks`, relevant RLS policies
  - RPCs: _(TBD – e.g. `get_blocked_profiles`, block/unblock helpers)_
- **Notes / Edge cases:**
  - Blocked users’ content visibility in feeds
  - Mutual blocking behaviour
  - RLS must enforce blocking, not just UI

### 3.6 Account Deletion / Closure

- **Description:** User can permanently close their account. This performs a **soft delete/tombstone** of the profile and social content (catches, comments, reactions, ratings, follows, notifications), and prevents the email/account from being reused.
- **Roles:** User, Admin
- **Criticality:** High
- **Pages / Routes:**
  - `/settings/profile` ("Delete your account" / danger zone)
  - `/account-deleted` (public confirmation page)
- **Backend dependencies:**
  - Tables: `profiles`, `catches`, `catch_comments`, `catch_reactions`, `ratings`, `profile_follows`, `notifications`, `moderation_log`
  - RPCs: `request_account_deletion`, `admin_delete_account`
- **Notes / Edge cases:**
  - Accounts are **soft-deleted**: profile is anonymised (username/avatar/bio), content is hidden/tombstoned, but rows remain for audit.
  - Deleted profiles are marked `is_deleted = true`, `locked_for_deletion = true`, and excluded from normal social surfaces.
  - Deleted users who attempt to sign in again are immediately signed out and redirected to `/account-deleted`, with clear messaging that the account/email cannot be reused.

---

## 4. Catches

### 4.1 Add Catch

- **Description:** User records a catch with species, weight, time/date, venue or manual location, media, and notes.
- **Roles:** User
- **Criticality:** Critical
- **Pages / Routes:**
  - `/add-catch`
- **Backend dependencies:**
  - Tables: `catches`, `venues`, `tags`, `baits`, `water_types`, `sessions`
  - RPCs: N/A (direct inserts via Supabase client)
- **Notes / Edge cases:**
  - Required fields (species, weight, date/time, etc.)
  - Weight units (`kg`, `lb_oz`)
  - Visibility (public/followers/private)
  - Venue-linked vs manual location

---

### 4.2 Edit / Delete Catch

- **Description:** Owner can update or delete an existing catch.
- **Roles:** User (owner), Admin (may have extra powers)
- **Criticality:** High
- **Pages / Routes:**
  - Catch detail page (e.g. `/catch/:id`)
  - Edit catch form
- **Backend dependencies:**
  - Tables: `catches`
  - RPCs: N/A (direct update/delete; soft-delete flags)
- **Notes / Edge cases:**
  - RLS: only owner or admin can modify/delete
  - Soft delete vs hard delete
  - Effects on feeds, stats, and venues

---

### 4.3 Catch Comments, Replies & Mentions

- **Description:** Users can comment on catches, reply in threads, and mention other users with `@username`.
- **Roles:** User
- **Criticality:** High
- **Pages / Routes:**
  - Catch detail
  - Feeds (embedded comment previews, if any)
- **Backend dependencies:**
  - Tables: `catch_comments`
  - Views/RPCs: `create_comment_with_rate_limit`, `catch_comments_with_admin` view select
  - Notifications: `create_notification`
- **Notes / Edge cases:**
  - Nested replies
  - Rate limiting and abuse prevention
  - Deleted comments visibility
  - Mention parsing / notifications

---

### 4.4 Catch Reactions (Like / Love / Fire)

- **Description:** Users can react to catches with predefined reaction types.
- **Roles:** User
- **Criticality:** Medium–High
- **Pages / Routes:**
  - Feed
  - Catch detail
  - Profile catches grid/list
- **Backend dependencies:**
  - Tables: `catch_reactions`
  - Enums: reaction_type (`like`, `love`, `fire`)
  - RPCs: `react_to_catch_with_rate_limit` (add), direct delete from `catch_reactions`
- **Notes / Edge cases:**
  - Toggling reactions
  - One reaction per user per catch vs multiple
  - Aggregated counts

---

### 4.5 Catch Ratings (If Enabled)

- **Description:** Users can rate catches (e.g. star rating or similar).
- **Roles:** User
- **Criticality:** Medium (depending on current usage)
- **Pages / Routes:**
  - Catch detail
  - Possibly venue/catch leaderboards
- **Backend dependencies:**
  - Tables: `ratings`
  - RPCs: `rate_catch_with_rate_limit`, `get_catch_rating_summary`
- **Notes / Edge cases:**
  - One rating per user per catch
  - Editing/deleting ratings
  - Effect on averages/leaderboards
  - Global averages/count are visible to any viewer who can see the catch (RLS-enforced).
  - When ratings are disabled for a catch, we still return a summary row (0 ratings, no average) so the UI has a consistent shape.

---

## 5. Venues

### 5.1 Venue Listing / Directory

- **Description:** Users can browse, search, and filter venues (e.g. by region, best-for tags, ticket type).
- **Roles:** Anon / User
- **Criticality:** High
- **Pages / Routes:**
  - `/venues`
- **Backend dependencies:**
  - Tables: `venues`, `venue_stats`
  - RPCs: `get_venues`, thumbnail helpers (`get_venue_photos`, `get_venue_recent_catches` for fallbacks)
- **Notes / Edge cases:**
  - Pagination / infinite scroll
  - Filters (location, best_for, facilities, ticket type)
  - Performance on larger datasets
  - v3 reality: free-text search matches venue name/location only; ticket type / tags are filter-only and not part of the search query.

---

### 5.2 Venue Detail

- **Description:** Detailed view of a venue including description, facilities, best-for tags, contact info, events, leaderboard, and recent catches.
- **Roles:** Anon / User / Owner / Admin
- **Criticality:** High
- **Pages / Routes:**
  - `/venues/:slug` (or similar)
- **Backend dependencies:**
  - Tables: `venues`, `venue_stats`, `venue_events`, `venue_photos`
  - RPCs: `get_venue_by_slug`, `get_venue_recent_catches`, `get_venue_top_catches`, `get_venue_photos`, `get_venue_upcoming_events`, `get_venue_past_events`
- **Notes / Edge cases:**
  - Missing or unpublished venue
  - Handling of lat/long, region, country
  - Owner-specific UI (edit links, unpublished data)
  - Unpublished venues are only visible to owners/admins (via RLS) and show an "Unpublished – only visible to you and admins" badge on the detail page.

---

### 5.3 Venue Owner Tools / “My Venues” (v4+ – not implemented in v3)

- **Description:** Owner-facing tools to manage venues they control – edit details, manage events, see basic stats, and eventually claim venues. In v3 there is **no dedicated owner dashboard**; venues are created/seeded manually, and owners (if configured in `venue_owners`) only see per-venue controls.
- **Roles:** Owner, Admin
- **Criticality:** High (for venue-side value) – **future/v4+**
- **Pages / Routes:**
  - _Planned:_ `/my/venues`, `/my/venues/:slug` (owner dashboard + per-venue management)
  - _Current v3 reality:_ owners/admins may see “Manage venue” controls on `/venues/:slug` when `venue_owners` is configured; there is no standalone “My venues” index.
- **Backend dependencies:**
  - Tables: `venues`, `venue_events`, owner mapping (e.g. `venue_owners`)
  - RPCs (planned): owner/admin venue metadata updates (`owner_update_venue_metadata`, `admin_update_venue_metadata`), owner/admin event RPCs (`owner_get_venue_events`, `owner_create_venue_event`, `owner_update_venue_event`, `owner_delete_venue_event`, plus admin equivalents), owner listing via `venue_owners`
- **Notes / Edge cases:**
  - **v3:** No venue creation/claim UI; all venues are seeded/curated manually, and owner mapping is managed directly in the DB.
  - **v3:** RLS and RPCs already distinguish admin vs owner vs anon for venue reads/updates.
  - **v4+:** Full owner dashboard, claim flows, and subscription tooling are defined in `docs/version4/VENUES-OWNER-SPEC.md` and are out of scope for v3 hardening.

---

### 5.4 Venue Events

- **Description:** Owners create and manage venue events (matches, open days, etc.) with times, ticket info, and links.
- **Roles:** Owner, Admin (view: Anon/User)
- **Criticality:** Medium–High
- **Pages / Routes:**
  - Venue detail (events list)
  - My venue edit pages (events CRUD)
- **Backend dependencies:**
  - Tables: `venue_events`
  - RPCs: `get_venue_upcoming_events`, `get_venue_past_events` (public view); owner/admin event RPCs for create/update/delete (`owner_get_venue_events`, `owner_create_venue_event`, `owner_update_venue_event`, `owner_delete_venue_event`, admin equivalents)
- **Notes / Edge cases:**
  - Publish/unpublish events
  - Past vs future events
  - Optional fields (contact_phone, booking_url, website_url)

---

## 6. Social & Feed

### 6.1 Follow / Unfollow

- **Description:** Users can follow other users to see their catches in a “people you follow” feed.
- **Roles:** User
- **Criticality:** High
- **Pages / Routes:**
  - Profile pages
  - Feed filters
- **Backend dependencies:**
  - Tables: `profile_follows`
  - RPCs: follow/unfollow helper RPCs (or direct table access) for creating and removing rows in `profile_follows`
- **Notes / Edge cases:**
  - Cannot follow self
  - Behaviour when a user is deleted / blocked
  - RLS to prevent follow table abuse

---

### 6.2 Feed (All Catches vs People You Follow)

- **Description:** Main feed showing catches, with filters:
  - All catches
  - People you follow
- **Roles:** User
- **Criticality:** Critical
- **Pages / Routes:**
  - `/feed` (main social feed; redirected-to after auth)
- **Backend dependencies:**
  - Tables: `catches`, `profiles`, `follows`
  - RPCs: `get_feed` (or similar)
- **Notes / Edge cases:**
  - Filter behaviour (drop-down shifting bug already noted)
  - Infinite scroll / pagination
  - Visibility rules (public/followers/private)
  - Blocked users in feed

---

### 6.3 Notifications

- **Description:** In-app notifications for:
  - New comment
  - Comment reply
  - New reaction
  - New rating
  - New follower
  - Mentions
  - Admin warning / moderation / report updates
- **Roles:** User / Admin (for some types)
- **Criticality:** High
- **Pages / Routes:**
  - Notifications dropdown or page
- **Backend dependencies:**
  - Tables: `notifications`
  - Enum: `notification_type`
  - RPCs: notification creation helpers (`create_notification`, etc.), summary RPCs
- **Notes / Edge cases:**
  - Read/unread status
  - Linking to the relevant catch/profile
  - RLS – users should only see their own notifications

---

## 7. Admin & Moderation

### 7.1 Admin User Moderation

- **Description:** Admins can view users, issue warnings, suspend, or ban them; view warnings and moderation log.
- **Roles:** Admin
- **Criticality:** Critical (for safety & policy)
- **Pages / Routes:**
  - `/admin/users`
  - Moderation detail views
- **Backend dependencies:**
  - Tables: `profiles`, `user_warnings`, `moderation_log`
  - Enums: `warning_severity`, `mod_action`, `moderation_status`
  - RPCs: `admin_list_users`, `admin_warn_user`, `admin_list_moderation_log`
- **Notes / Edge cases:**
  - RLS: non-admins must not be able to call these RPCs
  - Audit logging: all actions should be logged
  - Impact on login and visibility of moderated users
  - A dedicated "clear/restore moderation status" admin RPC is a future enhancement (not yet implemented in v3).

---

### 7.2 Reports (Content / Users / Venues)

- **Description:** Users can report content or users; admins can review and act on reports.
- **Roles:** User (create), Admin (review/act)
- **Criticality:** High
- **Pages / Routes:**
  - Report flows from catch/profile/venue
  - Admin reports dashboard
- **Backend dependencies:**
  - Tables: `reports`
  - Enums: `report_status`, `report_target_type`
  - RPCs: report creation, report listing, resolve/close report
- **Notes / Edge cases:**
  - Duplicate / spam reports
  - Email or in-app notifications to admins (if any)
  - Impact on target content (hide, delete, warn)

---

### 7.3 Admin Venue Tools

- **Description:** Admins manage venues (approve, curate, or correct venue data).
- **Roles:** Admin
- **Criticality:** Medium–High
- **Pages / Routes:**
  - `/admin/venues` (if present)
  - Admin controls on venue detail pages
- **Backend dependencies:**
  - Tables: `venues`
  - RPCs: admin-specific venue create/update/publish tools
- **Notes / Edge cases:**
  - Distinction between admin and owner capabilities
  - Bulk changes and their impact on front-end caches/feeds

---

## 8. Insights / Analytics

### 8.1 User Insights (If Present)

- **Description:** User-level insights (e.g. catches over time, best venues, best baits).
- **Roles:** User
- **Criticality:** Medium
- **Pages / Routes:**
  - `/insights` (or similar)
- **Backend dependencies:**
  - Aggregation RPCs powering charts
  - Tables: `catches`, `venues`, etc.
- **Notes / Edge cases:**
  - Empty-state messages (no data)
  - Performance of heavy queries
  - Accuracy of filters (date range, species, venue)

---

### 8.2 Admin Insights (If Present)

- **Description:** High-level stats for admins (user growth, content volume, etc.).
- **Roles:** Admin
- **Criticality:** Medium
- **Pages / Routes:**
  - Admin dashboards (if implemented)
- **Backend dependencies:**
  - Admin analytics RPCs
- **Notes / Edge cases:**
  - RLS/permissions (admin-only)
  - Data anonymisation / privacy

---

## 9. Cross-Cutting & Technical Features

### 9.1 File Uploads (Images / Media)

- **Description:** Users upload images for avatars, catches, and possibly venues/events.
- **Roles:** User / Owner / Admin
- **Criticality:** High
- **Pages / Routes:**
  - Profile edit
  - Add/edit catch
  - Venue/owner edit pages
- **Backend dependencies:**
  - Supabase Storage buckets
  - References in tables: `profiles`, `catches`, `venues`
- **Notes / Edge cases:**
  - Size/type limits
  - Failed uploads
  - Orphaned files after deletes

---

### 9.2 RLS & Privacy Enforcement

- **Description:** Row Level Security and visibility rules enforce what users can see and edit.
- **Roles:** All
- **Criticality:** Critical
- **Pages / Routes:**
  - All pages that read/write from Supabase
- **Backend dependencies:**
  - RLS policies on all tables
  - Helper RPCs that encapsulate access rules
- **Notes / Edge cases:**
  - Private/followers-only visibility
  - Blocked users
  - Admin overrides

---

## 10. Next Steps

1. **Fill in missing RPC and table names** for each feature using `PAGE-RPC-MAP.md` and Codex’s repo scan.
2. For each feature, create a matching section in `TEST-PLAN.md` with:
   - Acceptance criteria
   - Happy path tests
   - Edge/error cases
   - RLS/security checks (if relevant)
3. Use this inventory as a checklist: **no feature is “done” for v3 until it is tested and marked off here and in the test plan.**
