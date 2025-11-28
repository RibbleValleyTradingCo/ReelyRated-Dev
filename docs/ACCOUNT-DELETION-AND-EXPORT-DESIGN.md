# Account Deletion & Data Export – Design (Not Yet Implemented)

This document describes the planned approach for user-controlled data export and account deletion in ReelyRated. It is a design baseline only and is **not implemented yet**. Goals: allow users to download their data, and request deletion that preserves referential integrity and moderation/audit history while anonymising user identity.

## 1. Overview
- **Data export:** User-owned/authored data (profile, catches, comments, reactions/ratings, follows, notifications, moderation records affecting them) packaged in a machine-readable bundle (JSON; optional zip later).
- **Account deletion:** Soft-delete + anonymise profile; hide/lock authored content from public surfaces while keeping moderation/audit trails intact. Avoid broken FKs and preserve historical integrity for other users.

## 2. Scope & Non-goals
- **In scope:** User data export (JSON bundle), soft-delete/anonymisation of account and authored content, preserving referential integrity, keeping moderation/audit data intact.
- **Out of scope (this phase):** Email/legal flows, background job infra for large exports, UI polish beyond a basic settings entry point, storage file lifecycle, and broader privacy features (block/mute, private profiles).

## 3. Data Export Design
- **Entities to export (owned/authored by user):**
  - `profiles` (core profile fields, moderation fields).
  - `catches` (user_id-owned rows, media metadata, visibility, timestamps, deleted flags).
  - `catch_comments` (authored by user; parent/child info, deleted flags).
  - `catch_ratings` / `catch_reactions` (authored by user).
  - `profile_follows` (rows where user is follower or following).
  - `notifications` (inbox for the user).
  - `reports` (where user is reporter or target).
  - `user_warnings` (issued to the user).
  - `moderation_log` (rows involving the user or their catches/comments).
  - `admin_users` membership flag (if applicable).
- **Association keys:** user_id on profiles/catches/comments/ratings/reactions/notifications/reports/user_warnings; follower_id/following_id on follows; moderation_log user_id/target_id (and catch_id/comment_id for owned content).
- **Columns (high level):** ids, foreign keys, user-facing fields (content, titles, visibility), timestamps, deleted flags, moderation fields; for media, include paths/URLs only (no binaries).
- **Format:** Single JSON object with top-level keys per entity; optional zip compression later. CSV is a future option.
- **Trigger:** Settings > Account → “Download my data”.
- **Proposed RPC:** `request_account_export(user_id)` (SECURITY DEFINER):
  - Validates caller = user_id or admin.
  - Collects entity sets and returns JSON; if large, writes to storage and returns a signed URL (background job pattern can follow in future).

## 4. Account Deletion Design (Soft-delete + Anonymise)
- **profiles:** Add `deleted_at`/`is_deleted`; anonymise username/display name; clear avatar/bio; keep moderation fields; optionally set moderation_status to a terminal value (e.g. `deleted`) or separate flag.
- **admin_users:** Disallow self-delete for admins or require admin-only deletion path/removal from admin role first.
- **catches:** Hide from feeds (set visibility private + deleted flag); keep rows for history/moderation; UI attribution becomes “Deleted user”.
- **catch_comments:** Tombstone content (e.g. “[deleted]”), keep thread structure, timestamps, and deleted flags.
- **catch_ratings / catch_reactions:** Prefer deletion of rows to reduce retained signals; if needed for integrity, drop/NULL user_id if schema allows.
- **profile_follows:** Delete rows where user is follower or following.
- **notifications:** Delete inbox for the deleted user; keep other users’ notifications intact (they reference their own user_id).
- **reports / user_warnings / moderation_log:** Keep for audit; if reporter is deleted user, null reporter_id if schema permits; keep target references intact to preserve history.
- **Storage assets:** Export paths/metadata; binary deletion/retention policy can be addressed later.

## 5. RPC / API Surface (Design Only)
- `request_account_export(user_id)`  
  - Caller: self or admin.  
  - Behaviour: validate caller; gather data; return JSON or signed URL if stored; SECURITY DEFINER with internal caller checks.
- `request_account_deletion(user_id, reason)`  
  - Caller: self or admin (admin override for admin users if allowed).  
  - Behaviour: validate; mark profile deleted/anonymised; hide catches; tombstone comments; delete follows and user notifications; delete or anonymise ratings/reactions; preserve audit tables; optionally revoke auth after DB cleanup; SECURITY DEFINER.
- `admin_delete_account(user_id, reason)` (optional wrapper)  
  - Admin-only path with same steps and explicit admin override semantics.
- **Long-running concerns:** For large exports, consider future background job or “pending export” pattern; current design assumes small-medium synchronous or storage-backed handoff.

## 6. RLS & Safety Considerations
- Only owner or admin may request export/deletion; enforced inside SECURITY DEFINER RPCs.
- Add `deleted_at`/`is_deleted` (and optional `locked_for_deletion`) checks to RLS to block new posts/comments/uploads once marked.
- Preserve audit: never delete `moderation_log`, `user_warnings`, core `reports`; adjust reporter_id only if necessary to avoid PII while keeping history.
- Consider a pre-deletion lock state to prevent new activity while cleanup runs.

## 7. Impact on Existing Features (States to Handle)
- Profile page: render “account deleted” stub; disable actions.
- Feed/leaderboard/catch detail: hide deleted user’s catches or show attribution as “Deleted user”.
- Comments: render tombstoned “[deleted]” content; keep threading.
- Notifications: handle references to deleted users/content gracefully; deleted user’s inbox emptied.
- Admin moderation pages: show deleted state but retain history.
- Search/browse: exclude deleted profiles/catches from results.

## 8. Recommended Implementation Steps
1) Schema prep: add `deleted_at`/`is_deleted` (and optional `locked_for_deletion`) on profiles; ensure deleted/visibility flags on catches/comments support hiding; index as needed; confirm FK/nullability for reactions/ratings if anonymising. (Started via migration 2049_account_deletion_schema_prep: adds profile flags/indexes, documents existing catch/comment soft-delete columns, and notes audit/RLS intent.)  
2) RLS review: update policies to exclude deleted/locked accounts from posting and to filter deleted content from feeds/search.  
3) Export RPC: add `request_account_export` (SECURITY DEFINER) returning JSON or signed URL; wire settings entry point. (Implemented as synchronous JSON export for current user with a “Download my data (JSON)” button in settings.)  
4) Deletion RPC: add `request_account_deletion` (SECURITY DEFINER) implementing anonymise + soft-delete + cleanup; enforce caller checks and admin edge cases.  
5) Auth revocation: plan Supabase auth admin delete or forced sign-out after DB cleanup.  
6) UI states: profile stub, feed/comment fallbacks, notification fallbacks for deleted references.  
7) Tests/QA: manual/automated checks for export correctness, deletion flow, RLS behaviours, admin override paths, and auth revocation.

## Operational note (current implementation)
The `request_account_export()` RPC is implemented and exposed via the “Download my data (JSON)” button in Settings → Your data & privacy. If a user emails asking for a copy of their data, we can either direct them to that button, or an admin can run the RPC and send the resulting JSON file manually. Account deletion remains design-only for now.
