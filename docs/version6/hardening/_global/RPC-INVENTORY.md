# RPC Inventory (v6)

## Purpose
- Single source of truth for client-callable RPCs, with clear separation between **hard facts** (SQL + repo scan) and **needs-review** fields.
- Callsite data is derived from `docs/version6/hardening/_global/RPC-USAGE-MAP.md` (static repo scan).

## Evidence used (2026-01-16)
- `docs/version6/hardening/_global/evidence/2026-01-16/41_EXPOSED_SCHEMAS.csv`
- `docs/version6/hardening/_global/evidence/2026-01-16/42_RPC_CALLABILITY.csv`
- `docs/version6/hardening/_global/evidence/2026-01-16/43_RPC_DYNAMIC_SQL_FLAGS.csv`
- `docs/version6/hardening/_global/evidence/2026-01-16/44_RPC_CATALOG_DEPENDENCIES.csv`
- `docs/version6/hardening/_global/evidence/2026-01-16/45_RPC_DEPENDENCIES.csv`
- `docs/version6/hardening/_global/evidence/2026-01-16/2026-01-16_rpc_usage_map.csv`

## Counts summary (2026-01-16)
- total_functions: 98
- callable_by_anon: 13
- callable_by_authenticated: 97
- security_definer: 81
- unpinned_definer: 0
- overload_ambiguous: 4

## Client-callable definition (v0)
A function/procedure is **client-callable for role R** when all are true:
1) Schema is in PostgREST exposed schema set (`pgrst.db_schemas`).
2) Role R has USAGE on the schema (`has_schema_privilege`).
3) Role R has EXECUTE on the function (explicitly, or via PUBLIC).

PostgREST RPC exposes functions; stored procedures are not supported.

> Exposed schema set + schema USAGE evidence: `docs/version6/hardening/_global/sql/41_EXPOSED_SCHEMAS.sql`.

## Evidence inputs (Tier A)
- Exposed schemas + schema USAGE: `docs/version6/hardening/_global/sql/41_EXPOSED_SCHEMAS.sql`
- RPC callability + posture: `docs/version6/hardening/_global/sql/42_RPC_CALLABILITY.sql`
- Dynamic SQL flags (confidence): `docs/version6/hardening/_global/sql/43_RPC_DYNAMIC_SQL_FLAGS.sql`
- Direct catalog dependencies: `docs/version6/hardening/_global/sql/44_RPC_CATALOG_DEPENDENCIES.sql`
- Heuristic dependencies (policies/views/triggers): `docs/version6/hardening/_global/sql/45_RPC_DEPENDENCIES.sql`
- Repo callsites: `docs/version6/hardening/_global/RPC-USAGE-MAP.md`

## Exposed schema set (v0)
Populate from `41_EXPOSED_SCHEMAS.csv`.

| schema_name | exposed_schema | in_db_extra_search_path | anon_schema_usage | authenticated_schema_usage |
| --- | --- | --- | --- | --- |
| graphql_public | t | f | t | t |
| public | t | f | t | t |

## Tier A — Repo callsite facts (deterministic)
| function_name | callsite_count | used_in_app | callsites |
| --- | --- | --- | --- |
| admin_add_venue_owner | 1 | yes | src/pages/AdminVenueEdit.tsx:802 |
| admin_add_venue_photo | 0 | no |  |
| admin_clear_moderation_status | 0 | no |  |
| admin_create_venue_event | 1 | yes | src/pages/AdminVenueEdit.tsx:905 |
| admin_create_venue_opening_hour | 0 | no |  |
| admin_create_venue_pricing_tier | 0 | no |  |
| admin_create_venue_species_stock | 0 | no |  |
| admin_delete_account | 0 | no |  |
| admin_delete_catch | 1 | yes | src/pages/AdminReports.tsx:610 |
| admin_delete_comment | 1 | yes | src/pages/AdminReports.tsx:616 |
| admin_delete_venue_event | 1 | yes | src/pages/AdminVenueEdit.tsx:952 |
| admin_delete_venue_opening_hour | 0 | no |  |
| admin_delete_venue_photo | 0 | no |  |
| admin_delete_venue_pricing_tier | 0 | no |  |
| admin_delete_venue_species_stock | 0 | no |  |
| admin_get_venue_by_slug | 2 | yes | src/pages/AdminVenueEdit.tsx:463, src/pages/AdminVenueEdit.tsx:712 |
| admin_get_venue_events | 3 | yes | src/pages/AdminVenueEdit.tsx:545, src/pages/AdminVenueEdit.tsx:924, src/pages/AdminVenueEdit.tsx:961 |
| admin_get_venues | 1 | yes | src/pages/AdminVenuesList.tsx:80 |
| admin_list_moderation_log | 1 | yes | src/pages/AdminUserModeration.tsx:164 |
| admin_list_reports | 0 | no |  |
| admin_remove_venue_owner | 1 | yes | src/pages/AdminVenueEdit.tsx:837 |
| admin_restore_catch | 1 | yes | src/pages/AdminReports.tsx:650 |
| admin_restore_comment | 1 | yes | src/pages/AdminReports.tsx:660 |
| admin_set_venue_photo_primary | 0 | no |  |
| admin_update_report_status | 0 | no |  |
| admin_update_venue_booking | 0 | no |  |
| admin_update_venue_event | 1 | yes | src/pages/AdminVenueEdit.tsx:885 |
| admin_update_venue_metadata | 1 | yes | src/pages/AdminVenueEdit.tsx:699 |
| admin_update_venue_opening_hour | 0 | no |  |
| admin_update_venue_pricing_tier | 0 | no |  |
| admin_update_venue_rules | 0 | no |  |
| admin_update_venue_species_stock | 0 | no |  |
| admin_warn_user | 2 | yes | src/pages/AdminReports.tsx:716, src/pages/AdminUserModeration.tsx:418 |
| assert_moderation_allowed | 0 | no |  |
| block_profile | 1 | yes | src/pages/profile/hooks/useProfileData.ts:296 |
| check_email_exists | 1 | yes | src/pages/Auth.tsx:117 |
| check_rate_limit | 18 | yes | src/lib/__tests__/rate-limit-db.test.ts:110, src/lib/__tests__/rate-limit-db.test.ts:119, src/lib/__tests__/rate-limit-db.test.ts:142, src/lib/__tests__/rate-limit-db.test.ts:150, src/lib/__tests__/rate-limit-db.test.ts:177 (+13 more) |
| cleanup_rate_limits | 2 | yes | src/lib/__tests__/rate-limit-db.test.ts:391, src/lib/__tests__/rate-limit-db.test.ts:414 |
| community_stats_handle_catches_change | 0 | no |  |
| create_comment_with_rate_limit | 1 | yes | src/components/CatchComments.tsx:397 |
| create_notification | 2 | yes | src/dev/notifications-debug.ts:17, src/lib/notifications.ts:40 |
| create_report_with_rate_limit | 1 | yes | src/components/ReportButton.tsx:51 |
| enforce_catch_moderation | 0 | no |  |
| enforce_catch_rate_limit | 0 | no |  |
| enforce_comment_rate_limit | 0 | no |  |
| enforce_report_rate_limit | 0 | no |  |
| follow_profile_with_rate_limit | 2 | yes | src/hooks/useCatchInteractions.ts:84, src/pages/profile/hooks/useProfileData.ts:265 |
| get_catch_rating_summary | 0 | no |  |
| get_community_stats | 1 | yes | src/pages/Index.tsx:499 |
| get_feed_catches | 1 | yes | src/pages/feed/useFeedData.ts:189 |
| get_follower_count | 1 | yes | src/pages/profile/hooks/useProfileData.ts:76 |
| get_insights_aggregates | 1 | yes | src/pages/Insights.tsx:203 |
| get_leaderboard_scores | 1 | yes | src/hooks/useLeaderboardRealtime.ts:73 |
| get_my_venue_rating | 1 | yes | src/pages/venue-detail/hooks/useVenueDetailData.ts:131 |
| get_profile_for_profile_page | 0 | no |  |
| get_rate_limit_status | 3 | yes | src/lib/__tests__/rate-limit-db.test.ts:208, src/lib/__tests__/rate-limit-db.test.ts:235, src/lib/__tests__/rate-limit-db.test.ts:263 |
| get_species_options | 1 | yes | src/hooks/useSpeciesOptions.ts:59 |
| get_venue_by_slug | 1 | yes | src/pages/venue-detail/hooks/useVenueDetailData.ts:93 |
| get_venue_past_events | 1 | yes | src/pages/venue-detail/hooks/useVenueDetailData.ts:389 |
| get_venue_photos | 3 | yes | src/pages/VenuesIndex.tsx:138, src/pages/venue-detail/hooks/useVenueDetailData.ts:269, src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:70 |
| get_venue_recent_catches | 2 | yes | src/pages/VenuesIndex.tsx:153, src/pages/venue-detail/hooks/useVenueDetailData.ts:353 |
| get_venue_top_anglers | 0 | no |  |
| get_venue_top_catches | 1 | yes | src/pages/venue-detail/hooks/useVenueDetailData.ts:308 |
| get_venue_upcoming_events | 1 | yes | src/pages/venue-detail/hooks/useVenueDetailData.ts:250 |
| get_venues | 1 | yes | src/pages/VenuesIndex.tsx:90 |
| handle_catches_leaderboard_change | 0 | no |  |
| handle_new_user | 0 | no |  |
| handle_ratings_leaderboard_change | 0 | no |  |
| insights_format_label | 0 | no |  |
| is_admin | 0 | no |  |
| is_blocked_either_way | 0 | no |  |
| is_following | 0 | no |  |
| is_venue_admin_or_owner | 0 | no |  |
| notify_admins_for_report | 1 | yes | src/lib/notifications.ts:126 |
| owner_add_venue_photo | 0 | no |  |
| owner_create_venue_event | 1 | yes | src/pages/MyVenueEdit.tsx:758 |
| owner_create_venue_opening_hour | 0 | no |  |
| owner_create_venue_pricing_tier | 0 | no |  |
| owner_create_venue_species_stock | 0 | no |  |
| owner_delete_venue_event | 1 | yes | src/pages/MyVenueEdit.tsx:797 |
| owner_delete_venue_opening_hour | 0 | no |  |
| owner_delete_venue_photo | 0 | no |  |
| owner_delete_venue_pricing_tier | 0 | no |  |
| owner_delete_venue_species_stock | 0 | no |  |
| owner_get_venue_by_slug | 2 | yes | src/pages/MyVenueEdit.tsx:400, src/pages/MyVenueEdit.tsx:643 |
| owner_get_venue_events | 3 | yes | src/pages/MyVenueEdit.tsx:495, src/pages/MyVenueEdit.tsx:777, src/pages/MyVenueEdit.tsx:804 |
| owner_set_venue_photo_primary | 0 | no |  |
| owner_update_venue_booking | 0 | no |  |
| owner_update_venue_event | 1 | yes | src/pages/MyVenueEdit.tsx:739 |
| owner_update_venue_metadata | 1 | yes | src/pages/MyVenueEdit.tsx:631 |
| owner_update_venue_opening_hour | 0 | no |  |
| owner_update_venue_pricing_tier | 0 | no |  |
| owner_update_venue_rules | 0 | no |  |
| owner_update_venue_species_stock | 0 | no |  |
| rate_catch_with_rate_limit | 1 | yes | src/hooks/useCatchInteractions.ts:130 |
| react_to_catch_with_rate_limit | 1 | yes | src/hooks/useCatchInteractions.ts:111 |
| refresh_leaderboard_precompute | 0 | no |  |
| request_account_deletion | 1 | yes | src/pages/ProfileSettings.tsx:346 |
| request_account_export | 1 | yes | src/pages/ProfileSettings.tsx:289 |
| set_comment_admin_author | 0 | no |  |
| set_updated_at | 0 | no |  |
| soft_delete_comment | 1 | yes | src/components/CatchComments.tsx:414 |
| unblock_profile | 2 | yes | src/pages/ProfileSettings.tsx:374, src/pages/profile/hooks/useProfileData.ts:303 |
| upsert_venue_rating | 1 | yes | src/pages/venue-detail/hooks/useVenueDetailData.ts:522 |
| user_rate_limits | 3 | yes | src/lib/__tests__/rate-limit-db.test.ts:282, src/lib/__tests__/rate-limit-db.test.ts:314, src/lib/__tests__/rate-limit-db.test.ts:353 |

Raw callsite evidence:
- `docs/version6/hardening/_global/evidence/2026-01-16/2026-01-16_rpc_usage_map.csv`
- `docs/version6/hardening/_global/evidence/2026-01-16/2026-01-16_rpc_usage_map.json`

## Tier A — DB posture facts (SQL-derived)
Populate from `42_RPC_CALLABILITY.csv` (join to callsite facts above by `function_name`).
If `overload_ambiguous = true`, treat the name-only join as **needs review** and use `regprocedure` for accuracy.

| schema_name | function_name | identity_args | regprocedure | return_type | prokind | is_security_definer | owner_role | search_path_pinned | search_path_value | schema_exposed | anon_schema_usage | authenticated_schema_usage | exec_public | exec_anon | exec_authenticated | callable_by_anon | callable_by_authenticated | overload_ambiguous | callsite_count | used_in_app | callsite_join_confidence | callsite_join_notes | callsites | exposure_notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| graphql_public | graphql | "operationName" text, query text, variables jsonb, extensions jsonb | graphql_public.graphql(text,text,jsonb,jsonb) | jsonb | f | f | supabase_admin | f |  | t | t | t | t | t | t | t | t | f | 0 | no | HIGH |  |  | GraphQL RPC gateway |
| public | admin_add_venue_owner | p_venue_id uuid, p_user_id uuid, p_role text | admin_add_venue_owner(uuid,uuid,text) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/AdminVenueEdit.tsx:802 |  |
| public | admin_add_venue_photo | p_venue_id uuid, p_image_path text, p_caption text | admin_add_venue_photo(uuid,text,text) | venue_photos | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | admin_clear_moderation_status | p_user_id uuid, p_reason text | admin_clear_moderation_status(uuid,text) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | admin_create_venue_event | p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_is_published boolean | admin_create_venue_event(uuid,text,text,timestamp with time zone,timestamp with time zone,text,text,text,text,boolean) | uuid | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/AdminVenueEdit.tsx:905 |  |
| public | admin_create_venue_opening_hour | p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer | admin_create_venue_opening_hour(uuid,text,smallint,time without time zone,time without time zone,boolean,integer) | venue_opening_hours | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | admin_create_venue_pricing_tier | p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer | admin_create_venue_pricing_tier(uuid,text,text,text,venue_pricing_audience,integer) | venue_pricing_tiers | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | admin_create_venue_species_stock | p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text | admin_create_venue_species_stock(uuid,text,numeric,text,numeric,numeric,numeric,venue_stock_density,text) | venue_species_stock | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | admin_delete_account | p_target uuid, p_reason text | admin_delete_account(uuid,text) | jsonb | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | admin_delete_catch | p_catch_id uuid, p_reason text | admin_delete_catch(uuid,text) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/AdminReports.tsx:610 |  |
| public | admin_delete_comment | p_comment_id uuid, p_reason text | admin_delete_comment(uuid,text) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/AdminReports.tsx:616 |  |
| public | admin_delete_venue_event | p_event_id uuid | admin_delete_venue_event(uuid) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/AdminVenueEdit.tsx:952 |  |
| public | admin_delete_venue_opening_hour | p_id uuid | admin_delete_venue_opening_hour(uuid) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | admin_delete_venue_photo | p_id uuid | admin_delete_venue_photo(uuid) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | admin_delete_venue_pricing_tier | p_id uuid | admin_delete_venue_pricing_tier(uuid) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | admin_delete_venue_species_stock | p_id uuid | admin_delete_venue_species_stock(uuid) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | admin_get_venue_by_slug | p_slug text | admin_get_venue_by_slug(text) | TABLE(id uuid, slug text, name text, location text, description text, is_published boolean, created_at timestamp with time zone, updated_at timestamp with time zone, short_tagline text, ticket_type text, price_from text, best_for_tags text[], facilities text[], website_url text, booking_url text, booking_enabled boolean, contact_phone text, payment_methods text[], payment_notes text, notes_for_rr_team text, total_catches integer, recent_catches_30d integer, active_anglers_all_time integer, active_anglers_30d integer, headline_pb_weight numeric, headline_pb_unit weight_unit, headline_pb_species text, top_species text[], avg_rating numeric, rating_count integer) | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 2 | yes | HIGH |  | src/pages/AdminVenueEdit.tsx:463, src/pages/AdminVenueEdit.tsx:712 |  |
| public | admin_get_venue_events | p_venue_id uuid | admin_get_venue_events(uuid) | TABLE(id uuid, venue_id uuid, title text, event_type text, starts_at timestamp with time zone, ends_at timestamp with time zone, description text, ticket_info text, website_url text, booking_url text, is_published boolean, created_at timestamp with time zone, updated_at timestamp with time zone) | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 3 | yes | HIGH |  | src/pages/AdminVenueEdit.tsx:545, src/pages/AdminVenueEdit.tsx:924, src/pages/AdminVenueEdit.tsx:961 |  |
| public | admin_get_venues | p_search text, p_limit integer, p_offset integer | admin_get_venues(text,integer,integer) | TABLE(id uuid, slug text, name text, location text, description text, is_published boolean, created_at timestamp with time zone, updated_at timestamp with time zone, short_tagline text, ticket_type text, price_from text, best_for_tags text[], facilities text[], total_catches integer, recent_catches_30d integer, headline_pb_weight numeric, headline_pb_unit weight_unit, headline_pb_species text, top_species text[], avg_rating numeric, rating_count integer) | f | f | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/AdminVenuesList.tsx:80 |  |
| public | admin_list_moderation_log | p_user_id uuid, p_action text, p_search text, p_from timestamp with time zone, p_to timestamp with time zone, p_sort_direction text, p_limit integer, p_offset integer | admin_list_moderation_log(uuid,text,text,timestamp with time zone,timestamp with time zone,text,integer,integer) | TABLE(id uuid, action text, target_type text, target_id uuid, user_id uuid, catch_id uuid, comment_id uuid, metadata jsonb, created_at timestamp with time zone, admin_id uuid, admin_username text) | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/AdminUserModeration.tsx:164 |  |
| public | admin_list_reports | p_status text, p_type text, p_reported_user_id uuid, p_from timestamp with time zone, p_to timestamp with time zone, p_sort_direction text, p_limit integer, p_offset integer | admin_list_reports(text,text,uuid,timestamp with time zone,timestamp with time zone,text,integer,integer) | TABLE(id uuid, target_type text, target_id uuid, reason text, status text, created_at timestamp with time zone, details text, reporter_id uuid, reporter_username text, reporter_avatar_path text, reporter_avatar_url text, reported_user_id uuid, reported_username text) | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | admin_remove_venue_owner | p_venue_id uuid, p_user_id uuid | admin_remove_venue_owner(uuid,uuid) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/AdminVenueEdit.tsx:837 |  |
| public | admin_restore_catch | p_catch_id uuid, p_reason text | admin_restore_catch(uuid,text) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/AdminReports.tsx:650 |  |
| public | admin_restore_comment | p_comment_id uuid, p_reason text | admin_restore_comment(uuid,text) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/AdminReports.tsx:660 |  |
| public | admin_set_venue_photo_primary | p_photo_id uuid | admin_set_venue_photo_primary(uuid) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | admin_update_report_status | p_report_id uuid, p_status text, p_resolution_notes text | admin_update_report_status(uuid,text,text) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | admin_update_venue_booking | p_venue_id uuid, p_booking_enabled boolean | admin_update_venue_booking(uuid,boolean) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | admin_update_venue_event | p_event_id uuid, p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_is_published boolean | admin_update_venue_event(uuid,uuid,text,text,timestamp with time zone,timestamp with time zone,text,text,text,text,boolean) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/AdminVenueEdit.tsx:885 |  |
| public | admin_update_venue_metadata | p_venue_id uuid, p_short_tagline text, p_description text, p_ticket_type text, p_price_from text, p_best_for_tags text[], p_facilities text[], p_website_url text, p_booking_url text, p_contact_phone text, p_notes_for_rr_team text, p_payment_methods text[], p_payment_notes text | admin_update_venue_metadata(uuid,text,text,text,text,text[],text[],text,text,text,text,text[],text) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | t | 1 | yes | LOW | overload_ambiguous | src/pages/AdminVenueEdit.tsx:699 |  |
| public | admin_update_venue_metadata | p_venue_id uuid, p_short_tagline text, p_ticket_type text, p_price_from text, p_best_for_tags text[], p_facilities text[], p_website_url text, p_booking_url text, p_contact_phone text, p_notes_for_rr_team text | admin_update_venue_metadata(uuid,text,text,text,text[],text[],text,text,text,text) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | t | 1 | yes | LOW | overload_ambiguous | src/pages/AdminVenueEdit.tsx:699 |  |
| public | admin_update_venue_opening_hour | p_id uuid, p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer | admin_update_venue_opening_hour(uuid,uuid,text,smallint,time without time zone,time without time zone,boolean,integer) | venue_opening_hours | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | admin_update_venue_pricing_tier | p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer | admin_update_venue_pricing_tier(uuid,uuid,text,text,text,venue_pricing_audience,integer) | venue_pricing_tiers | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | admin_update_venue_rules | p_venue_id uuid, p_rules_text text | admin_update_venue_rules(uuid,text) | venue_rules | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | admin_update_venue_species_stock | p_id uuid, p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text | admin_update_venue_species_stock(uuid,uuid,text,numeric,text,numeric,numeric,numeric,venue_stock_density,text) | venue_species_stock | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | admin_warn_user | p_user_id uuid, p_reason text, p_severity warning_severity, p_duration_hours integer | admin_warn_user(uuid,text,warning_severity,integer) | uuid | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 2 | yes | HIGH |  | src/pages/AdminReports.tsx:716, src/pages/AdminUserModeration.tsx:418 |  |
| public | assert_moderation_allowed | p_user_id uuid | assert_moderation_allowed(uuid) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | block_profile | p_blocked_id uuid, p_reason text | block_profile(uuid,text) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/profile/hooks/useProfileData.ts:296 |  |
| public | check_email_exists | email_to_check text | check_email_exists(text) | boolean | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/Auth.tsx:117 |  |
| public | check_rate_limit | p_user_id uuid, p_action text, p_max_attempts integer, p_window_minutes integer | check_rate_limit(uuid,text,integer,integer) | boolean | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 18 | yes | HIGH |  | src/lib/__tests__/rate-limit-db.test.ts:110, src/lib/__tests__/rate-limit-db.test.ts:119, src/lib/__tests__/rate-limit-db.test.ts:142, src/lib/__tests__/rate-limit-db.test.ts:150, src/lib/__tests__/rate-limit-db.test.ts:177 (+13 more) |  |
| public | cleanup_rate_limits |  | cleanup_rate_limits() | integer | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 2 | yes | HIGH |  | src/lib/__tests__/rate-limit-db.test.ts:391, src/lib/__tests__/rate-limit-db.test.ts:414 |  |
| public | create_comment_with_rate_limit | p_catch_id uuid, p_body text, p_parent_comment_id uuid | create_comment_with_rate_limit(uuid,text,uuid) | uuid | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/components/CatchComments.tsx:397 |  |
| public | create_notification | p_user_id uuid, p_message text, p_type notification_type, p_actor_id uuid, p_catch_id uuid, p_comment_id uuid, p_extra_data jsonb | create_notification(uuid,text,notification_type,uuid,uuid,uuid,jsonb) | uuid | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 2 | yes | HIGH |  | src/dev/notifications-debug.ts:17, src/lib/notifications.ts:40 |  |
| public | create_report_with_rate_limit | p_target_type report_target_type, p_target_id uuid, p_reason text, p_details text | create_report_with_rate_limit(report_target_type,uuid,text,text) | reports | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/components/ReportButton.tsx:51 |  |
| public | follow_profile_with_rate_limit | p_following_id uuid | follow_profile_with_rate_limit(uuid) | uuid | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 2 | yes | HIGH |  | src/hooks/useCatchInteractions.ts:84, src/pages/profile/hooks/useProfileData.ts:265 |  |
| public | get_catch_rating_summary | p_catch_id uuid | get_catch_rating_summary(uuid) | TABLE(catch_id uuid, rating_count integer, average_rating numeric, your_rating integer) | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | get_community_stats |  | get_community_stats() | TABLE(total_catches bigint, active_anglers bigint, waterways bigint, updated_at timestamp with time zone) | f | t | postgres | t | public, extensions | t | t | t | f | t | t | t | t | f | 1 | yes | HIGH |  | src/pages/Index.tsx:499 |  |
| public | get_feed_catches | p_limit integer, p_offset integer, p_scope text, p_sort text, p_species text, p_custom_species text, p_venue_id uuid, p_session_id uuid | get_feed_catches(integer,integer,text,text,text,text,uuid,uuid) | TABLE(id uuid, title text, image_url text, user_id uuid, location text, species text, weight numeric, weight_unit weight_unit, visibility visibility_type, hide_exact_spot boolean, conditions jsonb, created_at timestamp with time zone, session_id uuid, profiles jsonb, ratings jsonb, comments jsonb, reactions jsonb, venues jsonb, avg_rating numeric, rating_count integer) | f | f | postgres | t | public, extensions | t | t | t | t | t | t | t | t | f | 1 | yes | HIGH |  | src/pages/feed/useFeedData.ts:189 |  |
| public | get_follower_count | p_profile_id uuid | get_follower_count(uuid) | integer | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/profile/hooks/useProfileData.ts:76 |  |
| public | get_insights_aggregates | p_date_preset text, p_custom_start timestamp with time zone, p_custom_end timestamp with time zone, p_selected_session_id uuid, p_selected_venue text | get_insights_aggregates(text,timestamp with time zone,timestamp with time zone,uuid,text) | TABLE(total_catches integer, total_catches_all integer, pb_weight numeric, pb_weight_unit text, average_weight_kg numeric, weighted_catch_count integer, average_air_temp numeric, bait_counts jsonb, method_counts jsonb, time_of_day_counts jsonb, species_counts jsonb, venue_counts jsonb, weather_counts jsonb, clarity_counts jsonb, wind_counts jsonb, monthly_counts jsonb, session_counts jsonb, sessions_count integer, venue_options jsonb, latest_session_id uuid) | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/Insights.tsx:203 |  |
| public | get_leaderboard_scores | p_species_slug text, p_limit integer | get_leaderboard_scores(text,integer) | TABLE(id uuid, user_id uuid, owner_username text, title text, species_slug text, species text, weight numeric, weight_unit weight_unit, length numeric, length_unit length_unit, image_url text, avg_rating numeric, rating_count integer, total_score numeric, created_at timestamp with time zone, location_label text, location text, method_tag text, method text, water_type_code text, description text, gallery_photos text[], tags text[], video_url text, conditions jsonb, caught_at timestamp with time zone, is_blocked_from_viewer boolean) | f | t | postgres | t | "" | t | t | t | f | t | t | t | t | f | 1 | yes | HIGH |  | src/hooks/useLeaderboardRealtime.ts:73 |  |
| public | get_my_venue_rating | p_venue_id uuid | get_my_venue_rating(uuid) | TABLE(venue_id uuid, user_rating integer) | f | f | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/venue-detail/hooks/useVenueDetailData.ts:131 |  |
| public | get_profile_for_profile_page | p_username text | get_profile_for_profile_page(text) | TABLE(id uuid, username text, avatar_path text, avatar_url text, bio text, is_private boolean) | f | f | postgres | t | "" | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | get_rate_limit_status | p_user_id uuid, p_action text, p_max_attempts integer, p_window_minutes integer | get_rate_limit_status(uuid,text,integer,integer) | TABLE(attempts_used integer, attempts_remaining integer, is_limited boolean, reset_at timestamp with time zone) | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 3 | yes | HIGH |  | src/lib/__tests__/rate-limit-db.test.ts:208, src/lib/__tests__/rate-limit-db.test.ts:235, src/lib/__tests__/rate-limit-db.test.ts:263 |  |
| public | get_species_options | p_only_active boolean, p_only_with_catches boolean | get_species_options(boolean,boolean) | TABLE(slug text, label text) | f | t | postgres | t | public, extensions | t | t | t | f | t | t | t | t | f | 1 | yes | HIGH |  | src/hooks/useSpeciesOptions.ts:59 |  |
| public | get_venue_by_slug | p_slug text | get_venue_by_slug(text) | TABLE(id uuid, slug text, name text, location text, description text, is_published boolean, created_at timestamp with time zone, updated_at timestamp with time zone, short_tagline text, ticket_type text, price_from text, best_for_tags text[], facilities text[], website_url text, booking_url text, booking_enabled boolean, contact_phone text, payment_methods text[], payment_notes text, total_catches integer, recent_catches_30d integer, active_anglers_all_time integer, active_anglers_30d integer, headline_pb_weight numeric, headline_pb_unit weight_unit, headline_pb_species text, top_species text[], avg_rating numeric, rating_count integer) | f | f | postgres | t | public, extensions | t | t | t | f | t | t | t | t | f | 1 | yes | HIGH |  | src/pages/venue-detail/hooks/useVenueDetailData.ts:93 |  |
| public | get_venue_past_events | p_venue_id uuid, p_now timestamp with time zone, p_limit integer, p_offset integer | get_venue_past_events(uuid,timestamp with time zone,integer,integer) | TABLE(id uuid, venue_id uuid, title text, event_type text, starts_at timestamp with time zone, ends_at timestamp with time zone, description text, ticket_info text, website_url text, booking_url text, is_published boolean, created_at timestamp with time zone, updated_at timestamp with time zone) | f | f | postgres | t | public, extensions | t | t | t | t | t | t | t | t | f | 1 | yes | HIGH |  | src/pages/venue-detail/hooks/useVenueDetailData.ts:389 |  |
| public | get_venue_photos | p_venue_id uuid, p_limit integer, p_offset integer | get_venue_photos(uuid,integer,integer) | SETOF venue_photos | f | f | postgres | t | public, extensions | t | t | t | f | t | t | t | t | f | 3 | yes | HIGH |  | src/pages/VenuesIndex.tsx:138, src/pages/venue-detail/hooks/useVenueDetailData.ts:269, src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:70 |  |
| public | get_venue_recent_catches | p_venue_id uuid, p_limit integer, p_offset integer | get_venue_recent_catches(uuid,integer,integer) | TABLE(id uuid, title text, image_url text, user_id uuid, location text, species text, weight numeric, weight_unit weight_unit, visibility visibility_type, hide_exact_spot boolean, conditions jsonb, created_at timestamp with time zone, profiles jsonb, ratings jsonb, comments jsonb, reactions jsonb, venues jsonb) | f | f | postgres | t | public, extensions | t | t | t | t | t | t | t | t | f | 2 | yes | HIGH |  | src/pages/VenuesIndex.tsx:153, src/pages/venue-detail/hooks/useVenueDetailData.ts:353 |  |
| public | get_venue_top_anglers | p_venue_id uuid, p_limit integer | get_venue_top_anglers(uuid,integer) | TABLE(user_id uuid, username text, avatar_path text, avatar_url text, catch_count integer, best_weight numeric, best_weight_unit weight_unit, last_catch_at timestamp with time zone) | f | f | postgres | t | public, extensions | t | t | t | t | t | t | t | t | f | 0 | no | HIGH |  |  |  |
| public | get_venue_top_catches | p_venue_id uuid, p_limit integer | get_venue_top_catches(uuid,integer) | TABLE(id uuid, title text, image_url text, user_id uuid, location text, species text, weight numeric, weight_unit weight_unit, visibility visibility_type, hide_exact_spot boolean, conditions jsonb, created_at timestamp with time zone, profiles jsonb, ratings jsonb, comments jsonb, reactions jsonb, venues jsonb) | f | f | postgres | t | public, extensions | t | t | t | t | t | t | t | t | f | 1 | yes | HIGH |  | src/pages/venue-detail/hooks/useVenueDetailData.ts:308 |  |
| public | get_venue_upcoming_events | p_venue_id uuid, p_now timestamp with time zone, p_limit integer | get_venue_upcoming_events(uuid,timestamp with time zone,integer) | TABLE(id uuid, venue_id uuid, title text, event_type text, starts_at timestamp with time zone, ends_at timestamp with time zone, description text, ticket_info text, website_url text, booking_url text, is_published boolean, created_at timestamp with time zone, updated_at timestamp with time zone) | f | f | postgres | t | public, extensions | t | t | t | t | t | t | t | t | f | 1 | yes | HIGH |  | src/pages/venue-detail/hooks/useVenueDetailData.ts:250 |  |
| public | get_venues | p_search text, p_limit integer, p_offset integer | get_venues(text,integer,integer) | TABLE(id uuid, slug text, name text, location text, description text, is_published boolean, created_at timestamp with time zone, updated_at timestamp with time zone, short_tagline text, ticket_type text, price_from text, best_for_tags text[], facilities text[], total_catches integer, recent_catches_30d integer, headline_pb_weight numeric, headline_pb_unit weight_unit, headline_pb_species text, top_species text[], avg_rating numeric, rating_count integer) | f | f | postgres | t | public, extensions | t | t | t | f | t | t | t | t | f | 1 | yes | HIGH |  | src/pages/VenuesIndex.tsx:90 |  |
| public | insights_format_label | value text | insights_format_label(text) | text | f | f | postgres | t | "public, extensions" | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | is_admin | p_user_id uuid | is_admin(uuid) | boolean | f | f | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | is_blocked_either_way | p_user_id uuid, p_other_id uuid | is_blocked_either_way(uuid,uuid) | boolean | f | f | postgres | t | "public, extensions" | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | is_following | p_follower uuid, p_following uuid | is_following(uuid,uuid) | boolean | f | f | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | is_venue_admin_or_owner | p_venue_id uuid | is_venue_admin_or_owner(uuid) | boolean | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | notify_admins_for_report | p_report_id uuid, p_message text, p_extra_data jsonb | notify_admins_for_report(uuid,text,jsonb) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/lib/notifications.ts:126 |  |
| public | owner_add_venue_photo | p_venue_id uuid, p_image_path text, p_caption text | owner_add_venue_photo(uuid,text,text) | venue_photos | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | owner_create_venue_event | p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_contact_phone text, p_is_published boolean | owner_create_venue_event(uuid,text,text,timestamp with time zone,timestamp with time zone,text,text,text,text,text,boolean) | venue_events | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/MyVenueEdit.tsx:758 |  |
| public | owner_create_venue_opening_hour | p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer | owner_create_venue_opening_hour(uuid,text,smallint,time without time zone,time without time zone,boolean,integer) | venue_opening_hours | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | owner_create_venue_pricing_tier | p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer | owner_create_venue_pricing_tier(uuid,text,text,text,venue_pricing_audience,integer) | venue_pricing_tiers | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | owner_create_venue_species_stock | p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text | owner_create_venue_species_stock(uuid,text,numeric,text,numeric,numeric,numeric,venue_stock_density,text) | venue_species_stock | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | owner_delete_venue_event | p_event_id uuid | owner_delete_venue_event(uuid) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/MyVenueEdit.tsx:797 |  |
| public | owner_delete_venue_opening_hour | p_id uuid | owner_delete_venue_opening_hour(uuid) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | owner_delete_venue_photo | p_id uuid | owner_delete_venue_photo(uuid) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | owner_delete_venue_pricing_tier | p_id uuid | owner_delete_venue_pricing_tier(uuid) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | owner_delete_venue_species_stock | p_id uuid | owner_delete_venue_species_stock(uuid) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | owner_get_venue_by_slug | p_slug text | owner_get_venue_by_slug(text) | TABLE(id uuid, slug text, name text, location text, description text, is_published boolean, created_at timestamp with time zone, updated_at timestamp with time zone, short_tagline text, ticket_type text, price_from text, best_for_tags text[], facilities text[], website_url text, booking_url text, booking_enabled boolean, contact_phone text, payment_methods text[], payment_notes text, total_catches integer, recent_catches_30d integer, active_anglers_all_time integer, active_anglers_30d integer, headline_pb_weight numeric, headline_pb_unit weight_unit, headline_pb_species text, top_species text[], avg_rating numeric, rating_count integer) | f | t | postgres | t | "" | t | t | t | f | f | t | f | t | f | 2 | yes | HIGH |  | src/pages/MyVenueEdit.tsx:400, src/pages/MyVenueEdit.tsx:643 |  |
| public | owner_get_venue_events | p_venue_id uuid | owner_get_venue_events(uuid) | SETOF venue_events | f | t | postgres | t | "public, extensions" | t | t | t | f | f | t | f | t | f | 3 | yes | HIGH |  | src/pages/MyVenueEdit.tsx:495, src/pages/MyVenueEdit.tsx:777, src/pages/MyVenueEdit.tsx:804 |  |
| public | owner_set_venue_photo_primary | p_photo_id uuid | owner_set_venue_photo_primary(uuid) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | owner_update_venue_booking | p_venue_id uuid, p_booking_enabled boolean | owner_update_venue_booking(uuid,boolean) | venues | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | owner_update_venue_event | p_event_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_contact_phone text, p_is_published boolean | owner_update_venue_event(uuid,text,text,timestamp with time zone,timestamp with time zone,text,text,text,text,text,boolean) | venue_events | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/MyVenueEdit.tsx:739 |  |
| public | owner_update_venue_metadata | p_venue_id uuid, p_tagline text, p_description text, p_ticket_type text, p_best_for_tags text[], p_facilities text[], p_price_from text, p_website_url text, p_booking_url text, p_contact_phone text, p_payment_methods text[], p_payment_notes text | owner_update_venue_metadata(uuid,text,text,text,text[],text[],text,text,text,text,text[],text) | venues | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/MyVenueEdit.tsx:631 |  |
| public | owner_update_venue_opening_hour | p_id uuid, p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer | owner_update_venue_opening_hour(uuid,uuid,text,smallint,time without time zone,time without time zone,boolean,integer) | venue_opening_hours | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | owner_update_venue_pricing_tier | p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer | owner_update_venue_pricing_tier(uuid,uuid,text,text,text,venue_pricing_audience,integer) | venue_pricing_tiers | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | owner_update_venue_rules | p_venue_id uuid, p_rules_text text | owner_update_venue_rules(uuid,text) | venue_rules | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | owner_update_venue_species_stock | p_id uuid, p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text | owner_update_venue_species_stock(uuid,uuid,text,numeric,text,numeric,numeric,numeric,venue_stock_density,text) | venue_species_stock | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 0 | no | HIGH |  |  |  |
| public | rate_catch_with_rate_limit | p_catch_id uuid, p_rating integer | rate_catch_with_rate_limit(uuid,integer) | uuid | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/hooks/useCatchInteractions.ts:130 |  |
| public | react_to_catch_with_rate_limit | p_catch_id uuid, p_reaction text | react_to_catch_with_rate_limit(uuid,text) | boolean | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/hooks/useCatchInteractions.ts:111 |  |
| public | refresh_leaderboard_precompute | p_catch_id uuid | refresh_leaderboard_precompute(uuid) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | f | f | f | f | 0 | no | HIGH |  |  |  |
| public | request_account_deletion | p_reason text | request_account_deletion(text) | jsonb | f | t | postgres | t | "" | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/ProfileSettings.tsx:346 |  |
| public | request_account_export |  | request_account_export() | jsonb | f | t | postgres | t | "" | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/ProfileSettings.tsx:289 |  |
| public | soft_delete_comment | p_comment_id uuid | soft_delete_comment(uuid) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/components/CatchComments.tsx:414 |  |
| public | unblock_profile | p_blocked_id uuid | unblock_profile(uuid) | void | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 2 | yes | HIGH |  | src/pages/ProfileSettings.tsx:374, src/pages/profile/hooks/useProfileData.ts:303 |  |
| public | upsert_venue_rating | p_venue_id uuid, p_rating integer | upsert_venue_rating(uuid,integer) | TABLE(venue_id uuid, avg_rating numeric, rating_count integer, user_rating integer) | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | f | 1 | yes | HIGH |  | src/pages/venue-detail/hooks/useVenueDetailData.ts:522 |  |
| public | user_rate_limits |  | user_rate_limits() | TABLE(action text, count integer, oldest_attempt timestamp with time zone, newest_attempt timestamp with time zone) | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | t | 3 | yes | LOW | overload_ambiguous | src/lib/__tests__/rate-limit-db.test.ts:282, src/lib/__tests__/rate-limit-db.test.ts:314, src/lib/__tests__/rate-limit-db.test.ts:353 |  |
| public | user_rate_limits | p_user_id uuid | user_rate_limits(uuid) | TABLE(action text, count integer, oldest_attempt timestamp with time zone, newest_attempt timestamp with time zone) | f | t | postgres | t | public, extensions | t | t | t | f | f | t | f | t | t | 3 | yes | LOW | overload_ambiguous | src/lib/__tests__/rate-limit-db.test.ts:282, src/lib/__tests__/rate-limit-db.test.ts:314, src/lib/__tests__/rate-limit-db.test.ts:353 |  |

## Tier B — Needs-review flags (derived)
Populate by joining:
- `42_RPC_CALLABILITY.csv` (security_definer + search_path)
- `43_RPC_DYNAMIC_SQL_FLAGS.csv` (dynamic SQL)
- `44_RPC_CATALOG_DEPENDENCIES.csv` + `45_RPC_DEPENDENCIES.csv` (dependency confidence)

| regprocedure | definer_search_path_risk | rls_boundary_flag | dependency_confidence | dynamic_sql_flag | notes |
| --- | --- | --- | --- | --- | --- |
| <populate from evidence> | | | | | |

## Notes on definer boundary & search_path risk
- **definer_search_path_risk**: mark `true` when SECURITY DEFINER and search_path includes schemas writable by untrusted roles (or is unpinned). Conservative default = `true` if uncertain.
- **rls_boundary_flag**: mark `true` when SECURITY DEFINER function touches RLS-protected tables.
