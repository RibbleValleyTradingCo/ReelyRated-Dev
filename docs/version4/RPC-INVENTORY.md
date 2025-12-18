**RPC Inventory (v4 UI reference)**  
Updated: 2025-12-17 (UI-only; do not edit RPCs)

## Call Sites (per RPC)

- `create_comment_with_rate_limit`  
  - Call sites: `src/components/CatchComments.tsx` (submit comment).  
  - Pages/routes: Catch detail `/catch/:id`.  
  - Purpose: insert comment with rate limit.  
  - Data shape: expects `p_catch_id`, `p_body`; returns new comment id.

- `soft_delete_comment`  
  - Call sites: `src/components/CatchComments.tsx` (delete comment).  
  - Pages: `/catch/:id`.  
  - Purpose: soft-delete comment.  
  - Data shape: needs comment id; no UI schema assumptions beyond success.

- `create_report_with_rate_limit`  
  - Call sites: `src/components/ReportButton.tsx` (catch/comment targets).  
  - Pages: Catch detail/comments.  
  - Purpose: create report; rate limited; trigger logs rate_limits.  
  - Data shape: returns report row (id), uses `p_target_type`, `p_target_id`, `p_reason`, `p_details`.

- `get_catch_rating_summary`  
  - Call sites: `src/hooks/useCatchData.ts`, `src/components/feed/CatchCard.tsx`.  
  - Pages: Catch detail `/catch/:id`, Feed cards.  
  - Purpose: summary (average, count, your_rating).  
  - Data shape: `catch_id`, `rating_count`, `average_rating`, `your_rating`; may return 0 rows if access denied.

- `rate_catch_with_rate_limit`  
  - Call sites: `src/hooks/useCatchInteractions.ts`.  
  - Pages: Catch detail.  
  - Purpose: rate catch (insert/update) with rate limit.  
  - Data shape: inputs `p_catch_id`, `p_rating`; no UI shape beyond success.

- `react_to_catch_with_rate_limit`  
  - Call sites: `src/hooks/useCatchInteractions.ts`.  
  - Pages: Catch detail.  
  - Purpose: react (like) with rate limit.  
  - Data shape: inputs `p_catch_id`, `p_reaction`.

- `follow_profile_with_rate_limit`  
  - Call sites: `src/hooks/useCatchInteractions.ts`, `src/pages/Profile.tsx`.  
  - Pages: Profile, Catch detail owner follow.  
  - Purpose: follow edge insert with rate limit.  
  - Data shape: `p_following_id`; no return shape assumed.

- `block_profile` / `unblock_profile`  
  - Call sites: `src/pages/Profile.tsx`, `src/pages/ProfileSettings.tsx` (unblock).  
  - Pages: Profile, Profile settings.  
  - Purpose: manage profile blocks.  
  - Data shape: `p_blocked_id`; no return shape assumed.

- `get_follower_count`  
  - Call sites: `src/pages/Profile.tsx`.  
  - Pages: Profile.  
  - Purpose: follower count.  
  - Data shape: returns integer count.

- `get_venues`  
  - Call sites: `src/pages/VenuesIndex.tsx`, `src/pages/AdminVenuesList.tsx`.  
  - Pages: Venues index, Admin venues list.  
  - Purpose: list venues with search/filters.  
  - Data shape: venue rows (id, slug, name, location, stats, thumbnails).

- `get_venue_by_slug`  
  - Call sites: `src/pages/VenueDetail.tsx`, `src/pages/AdminVenueEdit.tsx`, `src/pages/MyVenueEdit.tsx`.  
  - Pages: Venue detail, Admin venue edit, Owner edit.  
  - Purpose: fetch venue detail by slug.  
  - Data shape: venue fields incl. metadata, flags.

- `get_venue_photos`  
  - Call sites: `src/pages/VenuesIndex.tsx` (thumbnail lookup), `src/pages/VenueDetail.tsx`.  
  - Pages: Venues index/detail.  
  - Purpose: fetch venue photos.  
  - Data shape: image_path, caption.

- `get_venue_recent_catches`  
  - Call sites: `src/pages/VenuesIndex.tsx` (stats), `src/pages/VenueDetail.tsx`.  
  - Pages: Venues index/detail.  
  - Purpose: recent catches for venue.  
  - Data shape: catch fields (id, title, image_url, profiles.username, etc.) used in cards.

- `get_venue_top_catches`  
  - Call sites: `src/pages/VenueDetail.tsx`.  
  - Pages: Venue detail (top catches section).  
  - Purpose: heaviest catches.  
  - Data shape: weight, species, user/profile info, created_at.

- `get_venue_top_anglers`  
  - Call sites: `src/pages/VenueDetail.tsx`.  
  - Pages: Venue detail (top anglers list).  
  - Purpose: top anglers by stats.  
  - Data shape: user/profile fields, catch counts.

- `get_venue_upcoming_events` / `get_venue_past_events`  
  - Call sites: `src/pages/VenueDetail.tsx`.  
  - Pages: Venue detail (events section).  
  - Purpose: events by venue.  
  - Data shape: title, starts_at/ends_at, type, booking URLs.

- `get_my_venue_rating` / `upsert_venue_rating`  
  - Call sites: `src/pages/VenueDetail.tsx`.  
  - Pages: Venue detail (rating component).  
  - Purpose: fetch/update viewer’s rating of venue.  
  - Data shape: rating value; upsert expects `p_venue_id`, `p_rating`.

- `get_venue_past_events` (owner/admin) / `owner_get_venue_events` / `admin_get_venue_events`  
  - Call sites: `src/pages/MyVenueEdit.tsx`, `src/pages/AdminVenueEdit.tsx`.  
  - Pages: Owner/Admin venue edit.  
  - Purpose: list/manage events.  
  - Data shape: event rows for edit/delete/update flows.

- `owner_update_venue_metadata` / `admin_update_venue_metadata`  
  - Call sites: `src/pages/MyVenueEdit.tsx`, `src/pages/AdminVenueEdit.tsx`.  
  - Pages: Owner/Admin venue edit.  
  - Purpose: update venue metadata.  
  - Data shape: venue fields; UI assumes returns updated venue.

- `owner_update_venue_event` / `admin_update_venue_event` / `owner_create_venue_event` / `admin_create_venue_event` / `owner_delete_venue_event` / `admin_delete_venue_event`  
  - Call sites: Owner/Admin venue edit pages.  
  - Purpose: CRUD for events.  
  - Data shape: event fields; UI expects success/error only.

- `admin_add_venue_owner` / `admin_remove_venue_owner`  
  - Call sites: `src/pages/AdminVenueEdit.tsx`.  
  - Purpose: manage venue owners.  
  - Data shape: user/venue ids.

- `get_venue_top_anglers` (admin version) — same call as above (detail page).

- `get_venue_recent_catches` (admin/owner) — same as above.

- `admin_list_reports`  
  - Call sites: `src/pages/AdminReports.tsx`.  
  - Pages: Admin reports list.  
  - Purpose: list reports with filters.  
  - Data shape: report rows + reporter/target info.

- `admin_delete_catch` / `admin_delete_comment` / `admin_restore_catch` / `admin_restore_comment`  
  - Call sites: `src/pages/AdminReports.tsx`.  
  - Purpose: moderation actions on catches/comments.  
  - Data shape: expects ids; UI relies on success to refresh.

- `admin_warn_user`  
  - Call sites: `src/pages/AdminReports.tsx`, `src/pages/AdminUserModeration.tsx`.  
  - Purpose: issue warnings; also logs moderation.  
  - Data shape: `p_user_id`, `p_reason`, `p_severity`, `p_duration_hours`.

- `admin_list_moderation_log`  
  - Call sites: `src/pages/AdminUserModeration.tsx`.  
  - Purpose: list moderation log entries.  
  - Data shape: log rows with metadata.

- `admin_list_moderation_log` (audit)  
  - Call sites: `src/pages/AdminAuditLog.tsx` via RPC call.  
  - Purpose: audit log listing.  
  - Data shape: log rows (action, target, admin, metadata).

- `admin_update_venue_metadata` (duplicate of above) — see AdminVenueEdit.

- `request_account_export` / `request_account_deletion`  
  - Call sites: `src/pages/ProfileSettings.tsx`.  
  - Purpose: initiate account export/deletion flows.  
  - Data shape: no return fields relied on; toast success/fail.

- `unblock_profile`  
  - Call sites: `src/pages/ProfileSettings.tsx`.  
  - Purpose: remove block.  
  - Data shape: `p_blocked_id`.

- `create_notification`  
  - Call sites: `src/dev/notifications-debug.ts`, `src/lib/notifications.ts` (notifyAdmins).  
  - Purpose: create notification.  
  - Data shape: user_id, message, type, etc.

- `check_email_exists`  
  - Call sites: `src/pages/Auth.tsx`.  
  - Purpose: check for duplicate email.  
  - Data shape: returns boolean/exists flag.

- `rate_limit helpers` (tests only): `check_rate_limit`, `get_rate_limit_status`, `user_rate_limits`, `cleanup_rate_limits`  
  - Call sites: `src/lib/__tests__/rate-limit-db.test.ts` (local tests).  
  - Purpose: test rate-limit functions; not part of prod UI.

## Notes
- Many RPCs are SECURITY DEFINER per migrations; admin RPCs enforce admin via DB checks.
- UI-only changes must not alter RPC signatures or calls.

## TODO
- Confirm any additional venue/admin RPCs or storage helpers not referenced above.  
- Add data shape details for admin list/report outputs if needed for UI validation.
