# RPC Usage Map (static repo scan)

How to re-run:

```
bash docs/version6/hardening/_global/scripts/build_rpc_usage_map.sh
```

## Purpose
- Deterministic inventory of RPC callsites found in code (static scan only; no DB introspection).
- Used to reconcile DB exposure vs actual app usage.

## Generation notes
- Worksheet source: `docs/version6/hardening/_global/evidence/2026-01-14/55_RPC_SCOPING_WORKSHEET.md`
- Scanned roots: src, app, lib, utils
- Patterns: `supabase.rpc(...)`, `.rpc(...)`, `/rest/v1/rpc/<fn>`

## RPC callsites found in code

| function_name | call_count | callsites | patterns_matched | notes |
| --- | --- | --- | --- | --- |
| admin_add_venue_owner | 1 | src/pages/AdminVenueEdit.tsx:802 | supabase.rpc | |
| admin_create_venue_event | 1 | src/pages/AdminVenueEdit.tsx:905 | supabase.rpc | |
| admin_delete_catch | 1 | src/pages/AdminReports.tsx:610 | supabase.rpc | |
| admin_delete_comment | 1 | src/pages/AdminReports.tsx:616 | supabase.rpc | |
| admin_delete_venue_event | 1 | src/pages/AdminVenueEdit.tsx:952 | supabase.rpc | |
| admin_get_venue_by_slug | 2 | src/pages/AdminVenueEdit.tsx:463, src/pages/AdminVenueEdit.tsx:712 | supabase.rpc | |
| admin_get_venue_events | 3 | src/pages/AdminVenueEdit.tsx:545, src/pages/AdminVenueEdit.tsx:924, src/pages/AdminVenueEdit.tsx:961 | supabase.rpc | |
| admin_get_venues | 1 | src/pages/AdminVenuesList.tsx:80 | supabase.rpc | |
| admin_list_moderation_log | 1 | src/pages/AdminUserModeration.tsx:164 | supabase.rpc | |
| admin_remove_venue_owner | 1 | src/pages/AdminVenueEdit.tsx:837 | supabase.rpc | |
| admin_restore_catch | 1 | src/pages/AdminReports.tsx:650 | supabase.rpc | |
| admin_restore_comment | 1 | src/pages/AdminReports.tsx:660 | supabase.rpc | |
| admin_update_venue_event | 1 | src/pages/AdminVenueEdit.tsx:885 | supabase.rpc | |
| admin_update_venue_metadata | 1 | src/pages/AdminVenueEdit.tsx:699 | supabase.rpc | |
| admin_warn_user | 2 | src/pages/AdminReports.tsx:716, src/pages/AdminUserModeration.tsx:418 | supabase.rpc | |
| block_profile | 1 | src/pages/profile/hooks/useProfileData.ts:296 | supabase.rpc | |
| check_email_exists | 1 | src/pages/Auth.tsx:117 | supabase.rpc | |
| check_rate_limit | 18 | src/lib/__tests__/rate-limit-db.test.ts:110, src/lib/__tests__/rate-limit-db.test.ts:119, src/lib/__tests__/rate-limit-db.test.ts:142, src/lib/__tests__/rate-limit-db.test.ts:150, src/lib/__tests__/rate-limit-db.test.ts:177 (+13 more) | supabase.rpc | |
| cleanup_rate_limits | 2 | src/lib/__tests__/rate-limit-db.test.ts:391, src/lib/__tests__/rate-limit-db.test.ts:414 | supabase.rpc | |
| create_comment_with_rate_limit | 1 | src/components/CatchComments.tsx:397 | supabase.rpc | |
| create_notification | 2 | src/dev/notifications-debug.ts:17, src/lib/notifications.ts:40 | supabase.rpc | |
| create_report_with_rate_limit | 1 | src/components/ReportButton.tsx:51 | supabase.rpc | |
| follow_profile_with_rate_limit | 2 | src/hooks/useCatchInteractions.ts:84, src/pages/profile/hooks/useProfileData.ts:265 | supabase.rpc | |
| get_community_stats | 1 | src/pages/Index.tsx:499 | supabase.rpc | |
| get_feed_catches | 1 | src/pages/feed/useFeedData.ts:189 | supabase.rpc | |
| get_follower_count | 1 | src/pages/profile/hooks/useProfileData.ts:76 | supabase.rpc | |
| get_insights_aggregates | 1 | src/pages/Insights.tsx:203 | supabase.rpc | |
| get_leaderboard_scores | 1 | src/hooks/useLeaderboardRealtime.ts:73 | supabase.rpc | |
| get_my_venue_rating | 1 | src/pages/venue-detail/hooks/useVenueDetailData.ts:131 | supabase.rpc | |
| get_rate_limit_status | 3 | src/lib/__tests__/rate-limit-db.test.ts:208, src/lib/__tests__/rate-limit-db.test.ts:235, src/lib/__tests__/rate-limit-db.test.ts:263 | supabase.rpc | |
| get_species_options | 1 | src/hooks/useSpeciesOptions.ts:59 | supabase.rpc | |
| get_venue_by_slug | 1 | src/pages/venue-detail/hooks/useVenueDetailData.ts:93 | supabase.rpc | |
| get_venue_past_events | 1 | src/pages/venue-detail/hooks/useVenueDetailData.ts:389 | supabase.rpc | |
| get_venue_photos | 3 | src/pages/VenuesIndex.tsx:138, src/pages/venue-detail/hooks/useVenueDetailData.ts:269, src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:70 | supabase.rpc | |
| get_venue_recent_catches | 2 | src/pages/VenuesIndex.tsx:153, src/pages/venue-detail/hooks/useVenueDetailData.ts:353 | supabase.rpc | |
| get_venue_top_catches | 1 | src/pages/venue-detail/hooks/useVenueDetailData.ts:308 | supabase.rpc | |
| get_venue_upcoming_events | 1 | src/pages/venue-detail/hooks/useVenueDetailData.ts:250 | supabase.rpc | |
| get_venues | 1 | src/pages/VenuesIndex.tsx:90 | supabase.rpc | |
| notify_admins_for_report | 1 | src/lib/notifications.ts:126 | supabase.rpc | |
| owner_create_venue_event | 1 | src/pages/MyVenueEdit.tsx:758 | supabase.rpc | |
| owner_delete_venue_event | 1 | src/pages/MyVenueEdit.tsx:797 | supabase.rpc | |
| owner_get_venue_by_slug | 2 | src/pages/MyVenueEdit.tsx:400, src/pages/MyVenueEdit.tsx:643 | supabase.rpc | |
| owner_get_venue_events | 3 | src/pages/MyVenueEdit.tsx:495, src/pages/MyVenueEdit.tsx:777, src/pages/MyVenueEdit.tsx:804 | supabase.rpc | |
| owner_update_venue_event | 1 | src/pages/MyVenueEdit.tsx:739 | supabase.rpc | |
| owner_update_venue_metadata | 1 | src/pages/MyVenueEdit.tsx:631 | supabase.rpc | |
| rate_catch_with_rate_limit | 1 | src/hooks/useCatchInteractions.ts:130 | supabase.rpc | |
| react_to_catch_with_rate_limit | 1 | src/hooks/useCatchInteractions.ts:111 | supabase.rpc | |
| request_account_deletion | 1 | src/pages/ProfileSettings.tsx:346 | supabase.rpc | |
| request_account_export | 1 | src/pages/ProfileSettings.tsx:289 | supabase.rpc | |
| soft_delete_comment | 1 | src/components/CatchComments.tsx:414 | supabase.rpc | |
| unblock_profile | 2 | src/pages/ProfileSettings.tsx:374, src/pages/profile/hooks/useProfileData.ts:303 | supabase.rpc | |
| upsert_venue_rating | 1 | src/pages/venue-detail/hooks/useVenueDetailData.ts:522 | supabase.rpc | |
| user_rate_limits | 3 | src/lib/__tests__/rate-limit-db.test.ts:282, src/lib/__tests__/rate-limit-db.test.ts:314, src/lib/__tests__/rate-limit-db.test.ts:353 | supabase.rpc | |

## Not found in code (but present in DB worksheet)

- admin_add_venue_photo
- admin_clear_moderation_status
- admin_create_venue_opening_hour
- admin_create_venue_pricing_tier
- admin_create_venue_species_stock
- admin_delete_account
- admin_delete_venue_opening_hour
- admin_delete_venue_photo
- admin_delete_venue_pricing_tier
- admin_delete_venue_species_stock
- admin_list_reports
- admin_set_venue_photo_primary
- admin_update_report_status
- admin_update_venue_booking
- admin_update_venue_opening_hour
- admin_update_venue_pricing_tier
- admin_update_venue_rules
- admin_update_venue_species_stock
- assert_moderation_allowed
- community_stats_handle_catches_change
- enforce_catch_moderation
- enforce_catch_rate_limit
- enforce_comment_rate_limit
- enforce_report_rate_limit
- get_catch_rating_summary
- get_profile_for_profile_page
- get_venue_top_anglers
- handle_catches_leaderboard_change
- handle_new_user
- handle_ratings_leaderboard_change
- insights_format_label
- is_admin
- is_blocked_either_way
- is_following
- is_venue_admin_or_owner
- owner_add_venue_photo
- owner_create_venue_opening_hour
- owner_create_venue_pricing_tier
- owner_create_venue_species_stock
- owner_delete_venue_opening_hour
- owner_delete_venue_photo
- owner_delete_venue_pricing_tier
- owner_delete_venue_species_stock
- owner_set_venue_photo_primary
- owner_update_venue_booking
- owner_update_venue_opening_hour
- owner_update_venue_pricing_tier
- owner_update_venue_rules
- owner_update_venue_species_stock
- refresh_leaderboard_precompute
- set_comment_admin_author
- set_updated_at
