> ⚠️ LEGACY (archived 2026-01-13)
> This file is the v1 global hardening attempt preserved for audit/history.
> Current work lives in: docs/version5/hardening/_global/v2/ (see _global/README.md).
> Do not update posture here unless you are explicitly updating legacy history notes.

# RPC Registry

## Purpose
Callable functions are an API surface. EXECUTE grants define exposure; SECURITY DEFINER vs INVOKER and search_path pinning define risk posture. Guidance: pin search_path (often to "") and use SECURITY DEFINER only when required; verify live posture before relying on this.

## Scope (schemas + roles)
- Roles in scope: `anon`, `authenticated`, `PUBLIC` (include `service_role` in live output if the role exists).
- Schemas with CREATE FUNCTION statements in migrations: `public`.

## Repo intent (from migrations)
Notes: This table reflects CREATE FUNCTION statements found in migrations (excluding the drift snapshot). It does not assert live exposure; use the SQL probes for live truth.

| Schema | Function | Signature | Definer/Invoker (if stated) | search_path setting (if stated) | Migration files |
| --- | --- | --- | --- | --- | --- |
| public | admin_add_venue_owner | admin_add_venue_owner(p_venue_id uuid, p_user_id uuid, p_role text default 'owner') | SECURITY DEFINER | public, extensions | 2073_venue_owners_and_owner_rpcs.sql |
| public | admin_add_venue_photo | admin_add_venue_photo(p_venue_id uuid, p_image_path text, p_caption text DEFAULT NULL) | SECURITY DEFINER | public, extensions | 2129_admin_venue_photo_rpcs.sql, 2130_harden_venue_photo_path_validation.sql |
| public | admin_clear_moderation_status | admin_clear_moderation_status(p_user_id uuid, p_reason text) | SECURITY DEFINER | public, extensions | 2047_admin_clear_moderation_status.sql, 2048_moderation_notification_copy.sql |
| public | admin_create_venue_event | admin_create_venue_event(p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamptz, p_ends_at timestamptz, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_is_published boolean) | SECURITY DEFINER | public, extensions | 2090_venue_events_rpcs.sql |
| public | admin_create_venue_opening_hour | admin_create_venue_opening_hour(p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time, p_closes_at time, p_is_closed boolean DEFAULT false, p_order_index int DEFAULT 0) | SECURITY DEFINER | public, extensions | 2118_venue_owner_phase1_mvp.sql |
| public | admin_create_venue_pricing_tier | admin_create_venue_pricing_tier(p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience public.venue_pricing_audience, p_order_index int DEFAULT 0) | SECURITY DEFINER | public, extensions | 2122_add_payment_fields_and_pricing_audience.sql |
| public | admin_create_venue_pricing_tier | admin_create_venue_pricing_tier(p_venue_id uuid, p_label text, p_price text, p_unit text, p_order_index int DEFAULT 0) | SECURITY DEFINER | public, extensions | 2118_venue_owner_phase1_mvp.sql |
| public | admin_create_venue_species_stock | admin_create_venue_species_stock(p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density public.venue_stock_density, p_stock_notes text) | SECURITY DEFINER | public, extensions | 2123_create_venue_species_stock.sql |
| public | admin_delete_account | admin_delete_account(p_target uuid, p_reason text DEFAULT NULL) | SECURITY DEFINER | public, extensions | 2051_request_account_deletion.sql |
| public | admin_delete_catch | admin_delete_catch(p_catch_id uuid, p_reason text) | SECURITY DEFINER | public, extensions | 1006_auth_and_rpc_helpers.sql |
| public | admin_delete_comment | admin_delete_comment(p_comment_id uuid, p_reason text) | SECURITY DEFINER | public, extensions | 1006_auth_and_rpc_helpers.sql |
| public | admin_delete_venue_event | admin_delete_venue_event(p_event_id uuid) | SECURITY DEFINER | public, extensions | 2090_venue_events_rpcs.sql |
| public | admin_delete_venue_opening_hour | admin_delete_venue_opening_hour(p_id uuid) | SECURITY DEFINER | public, extensions | 2118_venue_owner_phase1_mvp.sql |
| public | admin_delete_venue_photo | admin_delete_venue_photo(p_id uuid) | SECURITY DEFINER | public, extensions | 2129_admin_venue_photo_rpcs.sql |
| public | admin_delete_venue_pricing_tier | admin_delete_venue_pricing_tier(p_id uuid) | SECURITY DEFINER | public, extensions | 2118_venue_owner_phase1_mvp.sql |
| public | admin_delete_venue_species_stock | admin_delete_venue_species_stock(p_id uuid) | SECURITY DEFINER | public, extensions | 2123_create_venue_species_stock.sql |
| public | admin_get_venue_by_slug | admin_get_venue_by_slug(p_slug text) | SECURITY DEFINER | public, extensions | 2132_split_get_venue_by_slug_public_admin.sql |
| public | admin_get_venue_events | admin_get_venue_events(p_venue_id uuid) | SECURITY DEFINER | public, extensions | 2071_admin_get_venue_events.sql, 2090_venue_events_rpcs.sql |
| public | admin_get_venues | admin_get_venues(p_search text DEFAULT NULL, p_limit int DEFAULT 20, p_offset int DEFAULT 0) | SECURITY INVOKER | public, extensions | 2153_admin_venues_hardening.sql |
| public | admin_list_moderation_log | admin_list_moderation_log(p_user_id uuid DEFAULT NULL, p_action text DEFAULT NULL, p_search text DEFAULT NULL, p_from timestamptz DEFAULT NULL, p_to timestamptz DEFAULT NULL, p_sort_direction text DEFAULT 'desc', p_limit int DEFAULT 100, p_offset int DEFAULT 0) | SECURITY DEFINER | public, extensions | 2072_admin_report_rpcs.sql |
| public | admin_list_reports | admin_list_reports(p_status text DEFAULT NULL, p_type text DEFAULT NULL, p_reported_user_id uuid DEFAULT NULL, p_from timestamptz DEFAULT NULL, p_to timestamptz DEFAULT NULL, p_sort_direction text DEFAULT 'desc', p_limit int DEFAULT 50, p_offset int DEFAULT 0) | SECURITY DEFINER | public, extensions | 2072_admin_report_rpcs.sql |
| public | admin_remove_venue_owner | admin_remove_venue_owner(p_venue_id uuid, p_user_id uuid) | SECURITY DEFINER | public, extensions | 2073_venue_owners_and_owner_rpcs.sql |
| public | admin_restore_catch | admin_restore_catch(p_catch_id uuid, p_reason text) | SECURITY DEFINER | public, extensions | 1006_auth_and_rpc_helpers.sql |
| public | admin_restore_comment | admin_restore_comment(p_comment_id uuid, p_reason text) | SECURITY DEFINER | public, extensions | 1006_auth_and_rpc_helpers.sql |
| public | admin_set_venue_photo_primary | admin_set_venue_photo_primary(p_photo_id uuid) | SECURITY DEFINER | public, extensions | 2125_venue_photos_primary.sql |
| public | admin_update_report_status | admin_update_report_status(p_report_id uuid, p_status text, p_resolution_notes text DEFAULT NULL) | SECURITY DEFINER | public, extensions | 2072_admin_report_rpcs.sql |
| public | admin_update_venue_booking | admin_update_venue_booking(p_venue_id uuid, p_booking_enabled boolean) | SECURITY DEFINER | public, extensions | 2118_venue_owner_phase1_mvp.sql |
| public | admin_update_venue_event | admin_update_venue_event(p_event_id uuid, p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamptz, p_ends_at timestamptz, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_is_published boolean) | SECURITY DEFINER | public, extensions | 2090_venue_events_rpcs.sql |
| public | admin_update_venue_metadata | admin_update_venue_metadata(p_venue_id uuid, p_short_tagline text, p_description text, p_ticket_type text, p_price_from text, p_best_for_tags text[], p_facilities text[], p_website_url text, p_booking_url text, p_contact_phone text, p_notes_for_rr_team text) | SECURITY DEFINER | public, extensions | 2075_admin_update_venue_metadata_description.sql |
| public | admin_update_venue_metadata | admin_update_venue_metadata(p_venue_id uuid, p_short_tagline text, p_description text, p_ticket_type text, p_price_from text, p_best_for_tags text[], p_facilities text[], p_website_url text, p_booking_url text, p_contact_phone text, p_notes_for_rr_team text, p_payment_methods text[], p_payment_notes text) | SECURITY DEFINER | public, extensions | 2122_add_payment_fields_and_pricing_audience.sql |
| public | admin_update_venue_metadata | admin_update_venue_metadata(p_venue_id uuid, p_short_tagline text, p_ticket_type text, p_price_from text, p_best_for_tags text[], p_facilities text[], p_website_url text, p_booking_url text, p_contact_phone text, p_notes_for_rr_team text) | SECURITY DEFINER | public, extensions | 2068_admin_update_venue_metadata.sql |
| public | admin_update_venue_opening_hour | admin_update_venue_opening_hour(p_id uuid, p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time, p_closes_at time, p_is_closed boolean, p_order_index int) | SECURITY DEFINER | public, extensions | 2118_venue_owner_phase1_mvp.sql |
| public | admin_update_venue_pricing_tier | admin_update_venue_pricing_tier(p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience public.venue_pricing_audience, p_order_index int) | SECURITY DEFINER | public, extensions | 2122_add_payment_fields_and_pricing_audience.sql |
| public | admin_update_venue_pricing_tier | admin_update_venue_pricing_tier(p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_order_index int) | SECURITY DEFINER | public, extensions | 2118_venue_owner_phase1_mvp.sql |
| public | admin_update_venue_rules | admin_update_venue_rules(p_venue_id uuid, p_rules_text text) | SECURITY DEFINER | public, extensions | 2118_venue_owner_phase1_mvp.sql |
| public | admin_update_venue_species_stock | admin_update_venue_species_stock(p_id uuid, p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density public.venue_stock_density, p_stock_notes text) | SECURITY DEFINER | public, extensions | 2123_create_venue_species_stock.sql |
| public | admin_warn_user | admin_warn_user(p_user_id uuid, p_reason text, p_severity public.warning_severity DEFAULT 'warning', p_duration_hours integer DEFAULT NULL) | SECURITY DEFINER | public, extensions | 1006_auth_and_rpc_helpers.sql, 2048_moderation_notification_copy.sql |
| public | assert_moderation_allowed | assert_moderation_allowed(p_user_id uuid) | SECURITY DEFINER | public, extensions | 2045_moderation_enforcement.sql |
| public | block_profile | block_profile(p_blocked_id uuid, p_reason text DEFAULT NULL) | SECURITY DEFINER | public, extensions | 2062_profile_blocks_rpcs.sql |
| public | check_email_exists | check_email_exists(email_to_check text) | SECURITY DEFINER | public, extensions | 1006_auth_and_rpc_helpers.sql |
| public | check_rate_limit | check_rate_limit(p_user_id UUID, p_action TEXT, p_max_attempts INTEGER, p_window_minutes INTEGER) | SECURITY DEFINER | public, extensions | 1003_rate_limits_and_helpers.sql, 2092_rate_limit_functions_fix.sql, 2094_rate_limit_functions_align_with_tests.sql, 2095_rate_limit_functions_alignment_final.sql |
| public | check_rate_limit | check_rate_limit(p_user_id uuid, p_action text, p_max_attempts integer, p_window_minutes integer) | SECURITY DEFINER | public, extensions | 2112_fix_rate_limit_helpers_single_logger.sql, 2116_fix_reports_rate_limit_single_logger.sql |
| public | cleanup_rate_limits | cleanup_rate_limits() | SECURITY DEFINER | public, extensions | 1003_rate_limits_and_helpers.sql, 2092_rate_limit_functions_fix.sql, 2093_rate_limit_functions_fix_v2.sql, 2094_rate_limit_functions_align_with_tests.sql, 2095_rate_limit_functions_alignment_final.sql |
| public | community_stats_handle_catches_change | community_stats_handle_catches_change() | SECURITY DEFINER | public, extensions | 2137_community_stats_live.sql |
| public | create_catch_comment_with_rate_limit | create_catch_comment_with_rate_limit(p_catch_id uuid, p_body text, p_parent_comment_id uuid DEFAULT NULL) | SECURITY DEFINER | public, extensions | 2064_comment_block_enforcement.sql |
| public | create_comment_with_rate_limit | create_comment_with_rate_limit(p_catch_id uuid, p_body text) | SECURITY DEFINER | public, extensions | 1006_auth_and_rpc_helpers.sql |
| public | create_comment_with_rate_limit | create_comment_with_rate_limit(p_catch_id uuid, p_body text, p_parent_comment_id uuid DEFAULT NULL) | SECURITY DEFINER | public, extensions | 2024_phase2_comments_threading_enhancements.sql, 2027_fix_comment_notifications_rpc.sql, 2028_comment_notifications_enforce.sql, 2029_comment_notifications_robust.sql, 2032_admin_comment_rate_limit_bypass.sql, 2033_wire_comment_notifications_from_rpc.sql, 2037_mention_notifications.sql, 2039_enable_mention_notifications.sql, 2040_fix_mention_notifications.sql, 2042_comment_reply_notifications.sql, 2043_fix_comment_parent_record_usage.sql, 2045_moderation_enforcement.sql, 2046_fix_parent_record_and_keep_moderation_enforcement.sql, 2065_restore_comment_rpc_with_block_check.sql, 2098_mention_notifications_actor_username.sql, 2100_comment_notification_priority.sql, 2112_fix_rate_limit_helpers_single_logger.sql |
| public | create_notification | create_notification(p_user_id uuid, p_message text, p_type public.notification_type, p_actor_id uuid DEFAULT NULL, p_catch_id uuid DEFAULT NULL, p_comment_id uuid DEFAULT NULL, p_extra_data jsonb DEFAULT NULL) | SECURITY DEFINER | public, extensions | 1006_auth_and_rpc_helpers.sql, 2019_phase1c_notification_dedupe.sql, 2020_fix_notification_dedupe.sql, 2026_fix_comment_notifications_no_dedupe.sql, 2028_comment_notifications_enforce.sql, 2029_comment_notifications_robust.sql, 2044_allow_admin_report_notifications.sql |
| public | create_report_with_rate_limit | create_report_with_rate_limit(p_target_type public.report_target_type, p_target_id uuid, p_reason text, p_details text DEFAULT NULL) | SECURITY DEFINER | public, extensions | 1006_auth_and_rpc_helpers.sql, 2110_fix_report_rate_limit_double_logging.sql, 2111_fix_report_rate_limit_single_logger.sql, 2112_fix_rate_limit_helpers_single_logger.sql |
| public | enforce_catch_moderation | enforce_catch_moderation() | SECURITY DEFINER | public, extensions | 2045_moderation_enforcement.sql |
| public | enforce_catch_rate_limit | enforce_catch_rate_limit() | UNKNOWN (not stated) | public, extensions | 1003_rate_limits_and_helpers.sql, 2112_fix_rate_limit_helpers_single_logger.sql |
| public | enforce_comment_rate_limit | enforce_comment_rate_limit() | UNKNOWN (not stated) | public, extensions | 1003_rate_limits_and_helpers.sql, 2112_fix_rate_limit_helpers_single_logger.sql |
| public | enforce_report_rate_limit | enforce_report_rate_limit() | UNKNOWN (not stated) | public, extensions | 1003_rate_limits_and_helpers.sql, 2112_fix_rate_limit_helpers_single_logger.sql, 2116_fix_reports_rate_limit_single_logger.sql |
| public | follow_profile_with_rate_limit | follow_profile_with_rate_limit(p_following_id uuid) | SECURITY DEFINER | public, extensions | 1006_auth_and_rpc_helpers.sql, 2117_harden_profile_follows_rls.sql |
| public | get_catch_rating_summary | get_catch_rating_summary(p_catch_id uuid) | SECURITY DEFINER | public, extensions | 2106_catch_rating_summary.sql, 2107_catch_rating_summary_owner_zero_fix.sql, 2113_harden_get_catch_rating_summary.sql |
| public | get_community_stats | get_community_stats() | SECURITY DEFINER | public, extensions | 2136_community_stats_mv.sql, 2137_community_stats_live.sql |
| public | get_feed_catches | get_feed_catches(p_limit integer DEFAULT 18, p_offset integer DEFAULT 0, p_scope text DEFAULT 'all', p_sort text DEFAULT 'newest', p_species text DEFAULT 'all', p_custom_species text DEFAULT NULL, p_venue_id uuid DEFAULT NULL, p_session_id uuid DEFAULT NULL) | SECURITY INVOKER | public, extensions | 2121_add_feed_catches_rpc.sql, 2135_redact_feed_conditions_gps.sql |
| public | get_follower_count | get_follower_count(p_profile_id uuid) | SECURITY DEFINER | public, extensions | 2015_phase1_follow_visibility_and_counts.sql |
| public | get_insights_aggregates | get_insights_aggregates(p_date_preset text DEFAULT 'all', p_custom_start timestamptz DEFAULT NULL, p_custom_end timestamptz DEFAULT NULL, p_selected_session_id uuid DEFAULT NULL, p_selected_venue text DEFAULT NULL) | SECURITY DEFINER | public, extensions | 2141_insights_aggregates.sql, 2142_fix_insights_aggregates_weight_unit_cast.sql, 2143_fix_insights_aggregates_total_catches_all_ambiguous.sql, 2144_fix_insights_aggregates_pb_weight_unit_cast.sql |
| public | get_leaderboard_scores | get_leaderboard_scores(p_species_slug text DEFAULT NULL, p_limit int DEFAULT 100) | SECURITY DEFINER | MULTIPLE: ''; public, extensions | 2149_leaderboard_rpc_fast_path.sql, 2150_leaderboard_rpc_fast_path_sargable.sql, 2151_leaderboard_rpc_fast_path_ambiguity_fix.sql |
| public | get_my_venue_rating | get_my_venue_rating(p_venue_id uuid) | SECURITY INVOKER | public, extensions | 2079_create_venue_ratings.sql |
| public | get_rate_limit_status | get_rate_limit_status(p_user_id UUID, p_action TEXT, p_max_attempts INTEGER, p_window_minutes INTEGER) | SECURITY DEFINER | public, extensions | 1003_rate_limits_and_helpers.sql, 2092_rate_limit_functions_fix.sql, 2093_rate_limit_functions_fix_v2.sql, 2094_rate_limit_functions_align_with_tests.sql, 2095_rate_limit_functions_alignment_final.sql |
| public | get_species_options | get_species_options(p_only_active boolean DEFAULT true, p_only_with_catches boolean DEFAULT false) | SECURITY DEFINER | public, extensions | 2139_species_canonical.sql |
| public | get_venue_by_slug | get_venue_by_slug(p_slug text) | SECURITY INVOKER | public, extensions | 2057_venue_rpcs.sql, 2060_update_venue_rpcs_add_venues.sql, 2077_update_venue_rpcs_metadata.sql, 2081_update_venue_rpcs_for_ratings.sql, 2119_patch_get_venue_by_slug_booking_enabled.sql, 2122_add_payment_fields_and_pricing_audience.sql, 2126_extend_venue_stats_active_anglers.sql, 2132_split_get_venue_by_slug_public_admin.sql, 2153_admin_venues_hardening.sql |
| public | get_venue_past_events | get_venue_past_events(p_venue_id uuid, p_now timestamptz DEFAULT now(), p_limit int DEFAULT 10, p_offset int DEFAULT 0) | SECURITY INVOKER | public, extensions | 2090_venue_events_rpcs.sql |
| public | get_venue_photos | get_venue_photos(p_venue_id uuid, p_limit int DEFAULT 12, p_offset int DEFAULT 0) | SECURITY INVOKER | public, extensions | 2078_venue_photos_and_rpcs.sql, 2125_venue_photos_primary.sql |
| public | get_venue_recent_catches | get_venue_recent_catches(p_venue_id uuid, p_limit int DEFAULT 20, p_offset int DEFAULT 0) | SECURITY INVOKER | public, extensions | 2057_venue_rpcs.sql, 2060_update_venue_rpcs_add_venues.sql, 2070_fix_venue_recent_catches_enum.sql, 2101_normalize_weight_units_and_fix_venue_rpcs.sql, 2102_fix_weight_unit_case_in_venue_rpcs.sql, 2127_harden_venue_catch_rpcs_public_only.sql |
| public | get_venue_top_anglers | get_venue_top_anglers(p_venue_id uuid, p_limit int DEFAULT 10) | SECURITY INVOKER | public, extensions | 2061_venue_top_anglers_rpc.sql |
| public | get_venue_top_catches | get_venue_top_catches(p_venue_id uuid, p_limit int DEFAULT 10) | SECURITY INVOKER | public, extensions | 2057_venue_rpcs.sql, 2060_update_venue_rpcs_add_venues.sql |
| public | get_venue_top_catches | get_venue_top_catches(p_venue_id uuid, p_limit int DEFAULT 20) | SECURITY INVOKER | public, extensions | 2070_fix_venue_recent_catches_enum.sql, 2101_normalize_weight_units_and_fix_venue_rpcs.sql, 2102_fix_weight_unit_case_in_venue_rpcs.sql, 2127_harden_venue_catch_rpcs_public_only.sql |
| public | get_venue_upcoming_events | get_venue_upcoming_events(p_venue_id uuid, p_now timestamptz DEFAULT now(), p_limit int DEFAULT 10) | SECURITY INVOKER | public, extensions | 2090_venue_events_rpcs.sql |
| public | get_venues | get_venues(p_search text DEFAULT NULL, p_limit int DEFAULT 20, p_offset int DEFAULT 0) | SECURITY INVOKER | public, extensions | 2057_venue_rpcs.sql, 2060_update_venue_rpcs_add_venues.sql, 2077_update_venue_rpcs_metadata.sql, 2081_update_venue_rpcs_for_ratings.sql, 2153_admin_venues_hardening.sql |
| public | handle_catches_leaderboard_change | handle_catches_leaderboard_change() | SECURITY DEFINER | public, extensions | 2146_leaderboard_precompute.sql |
| public | handle_new_user | handle_new_user() | SECURITY DEFINER | public, extensions | 1001_core_schema.sql |
| public | handle_ratings_leaderboard_change | handle_ratings_leaderboard_change() | SECURITY DEFINER | public, extensions | 2146_leaderboard_precompute.sql |
| public | insights_format_label | insights_format_label(value text) | UNKNOWN (not stated) | UNKNOWN (not stated) | 2141_insights_aggregates.sql |
| public | is_admin | is_admin(p_user_id uuid) | SECURITY INVOKER | public, extensions | 2016_phase1_admin_visibility.sql |
| public | is_blocked_either_way | is_blocked_either_way(p_user_id uuid, p_other_id uuid) | UNKNOWN (not stated) | UNKNOWN (not stated) | 2062_profile_blocks_rpcs.sql |
| public | is_following | is_following(p_follower uuid, p_following uuid) | SECURITY INVOKER | public, extensions | 2015_phase1_follow_visibility_and_counts.sql |
| public | is_venue_admin_or_owner | is_venue_admin_or_owner(p_venue_id uuid) | SECURITY DEFINER | public, extensions | 2073_venue_owners_and_owner_rpcs.sql |
| public | notify_admins_for_report | notify_admins_for_report(p_report_id uuid, p_message text DEFAULT NULL, p_extra_data jsonb DEFAULT NULL) | SECURITY DEFINER | public, extensions | 2153_admin_venues_hardening.sql |
| public | owner_add_venue_photo | owner_add_venue_photo(p_venue_id uuid, p_image_path text, p_caption text DEFAULT NULL) | SECURITY DEFINER | public, extensions | 2078_venue_photos_and_rpcs.sql, 2130_harden_venue_photo_path_validation.sql |
| public | owner_create_venue_event | owner_create_venue_event(p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamptz, p_ends_at timestamptz, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_contact_phone text, p_is_published boolean DEFAULT false) | SECURITY DEFINER | public, extensions | 2133_fix_owner_event_contact_phone.sql |
| public | owner_create_venue_event | owner_create_venue_event(p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamptz, p_ends_at timestamptz, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_contact_phone text, p_is_published boolean default false) | SECURITY DEFINER | public, extensions | 2073_venue_owners_and_owner_rpcs.sql |
| public | owner_create_venue_opening_hour | owner_create_venue_opening_hour(p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time, p_closes_at time, p_is_closed boolean DEFAULT false, p_order_index int DEFAULT 0) | SECURITY DEFINER | public, extensions | 2118_venue_owner_phase1_mvp.sql |
| public | owner_create_venue_pricing_tier | owner_create_venue_pricing_tier(p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience public.venue_pricing_audience, p_order_index int DEFAULT 0) | SECURITY DEFINER | public, extensions | 2122_add_payment_fields_and_pricing_audience.sql |
| public | owner_create_venue_pricing_tier | owner_create_venue_pricing_tier(p_venue_id uuid, p_label text, p_price text, p_unit text, p_order_index int DEFAULT 0) | SECURITY DEFINER | public, extensions | 2118_venue_owner_phase1_mvp.sql |
| public | owner_create_venue_species_stock | owner_create_venue_species_stock(p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density public.venue_stock_density, p_stock_notes text) | SECURITY DEFINER | public, extensions | 2123_create_venue_species_stock.sql |
| public | owner_delete_venue_event | owner_delete_venue_event(p_event_id uuid) | SECURITY DEFINER | public, extensions | 2073_venue_owners_and_owner_rpcs.sql |
| public | owner_delete_venue_opening_hour | owner_delete_venue_opening_hour(p_id uuid) | SECURITY DEFINER | public, extensions | 2118_venue_owner_phase1_mvp.sql |
| public | owner_delete_venue_photo | owner_delete_venue_photo(p_id uuid) | SECURITY DEFINER | public, extensions | 2078_venue_photos_and_rpcs.sql |
| public | owner_delete_venue_pricing_tier | owner_delete_venue_pricing_tier(p_id uuid) | SECURITY DEFINER | public, extensions | 2118_venue_owner_phase1_mvp.sql |
| public | owner_delete_venue_species_stock | owner_delete_venue_species_stock(p_id uuid) | SECURITY DEFINER | public, extensions | 2123_create_venue_species_stock.sql |
| public | owner_get_venue_by_slug | owner_get_venue_by_slug(p_slug text) | SECURITY DEFINER | '' | 2152_owner_get_venue_by_slug.sql |
| public | owner_get_venue_events | owner_get_venue_events(p_venue_id uuid) | SECURITY DEFINER | public, extensions | 2073_venue_owners_and_owner_rpcs.sql |
| public | owner_set_venue_photo_primary | owner_set_venue_photo_primary(p_photo_id uuid) | SECURITY DEFINER | public, extensions | 2125_venue_photos_primary.sql |
| public | owner_update_venue_booking | owner_update_venue_booking(p_venue_id uuid, p_booking_enabled boolean) | SECURITY DEFINER | public, extensions | 2118_venue_owner_phase1_mvp.sql |
| public | owner_update_venue_event | owner_update_venue_event(p_event_id uuid, p_title text, p_event_type text, p_starts_at timestamptz, p_ends_at timestamptz, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_contact_phone text, p_is_published boolean DEFAULT false) | SECURITY DEFINER | public, extensions | 2133_fix_owner_event_contact_phone.sql |
| public | owner_update_venue_event | owner_update_venue_event(p_event_id uuid, p_title text, p_event_type text, p_starts_at timestamptz, p_ends_at timestamptz, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_contact_phone text, p_is_published boolean default false) | SECURITY DEFINER | public, extensions | 2073_venue_owners_and_owner_rpcs.sql |
| public | owner_update_venue_metadata | owner_update_venue_metadata(p_venue_id uuid, p_tagline text, p_description text, p_ticket_type text, p_best_for_tags text[], p_facilities text[], p_price_from text, p_website_url text, p_booking_url text, p_contact_phone text) | SECURITY DEFINER | public, extensions | 2073_venue_owners_and_owner_rpcs.sql, 2074_fix_owner_update_venue_metadata_ticket_type.sql |
| public | owner_update_venue_metadata | owner_update_venue_metadata(p_venue_id uuid, p_tagline text, p_description text, p_ticket_type text, p_best_for_tags text[], p_facilities text[], p_price_from text, p_website_url text, p_booking_url text, p_contact_phone text, p_payment_methods text[], p_payment_notes text) | SECURITY DEFINER | public, extensions | 2122_add_payment_fields_and_pricing_audience.sql |
| public | owner_update_venue_opening_hour | owner_update_venue_opening_hour(p_id uuid, p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time, p_closes_at time, p_is_closed boolean, p_order_index int) | SECURITY DEFINER | public, extensions | 2118_venue_owner_phase1_mvp.sql |
| public | owner_update_venue_pricing_tier | owner_update_venue_pricing_tier(p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience public.venue_pricing_audience, p_order_index int) | SECURITY DEFINER | public, extensions | 2122_add_payment_fields_and_pricing_audience.sql |
| public | owner_update_venue_pricing_tier | owner_update_venue_pricing_tier(p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_order_index int) | SECURITY DEFINER | public, extensions | 2118_venue_owner_phase1_mvp.sql |
| public | owner_update_venue_rules | owner_update_venue_rules(p_venue_id uuid, p_rules_text text) | SECURITY DEFINER | public, extensions | 2118_venue_owner_phase1_mvp.sql |
| public | owner_update_venue_species_stock | owner_update_venue_species_stock(p_id uuid, p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density public.venue_stock_density, p_stock_notes text) | SECURITY DEFINER | public, extensions | 2123_create_venue_species_stock.sql |
| public | rate_catch_with_rate_limit | rate_catch_with_rate_limit(p_catch_id uuid, p_rating int) | SECURITY DEFINER | public, extensions | 1006_auth_and_rpc_helpers.sql, 2018_phase1b_ratings.sql, 2104_rate_catch_notifications.sql |
| public | react_to_catch_with_rate_limit | react_to_catch_with_rate_limit(p_catch_id uuid, p_reaction text DEFAULT NULL) | SECURITY DEFINER | public, extensions | 1006_auth_and_rpc_helpers.sql, 2105_react_catch_visibility_fix.sql |
| public | refresh_leaderboard_precompute | refresh_leaderboard_precompute(p_catch_id uuid) | SECURITY DEFINER | public, extensions | 2146_leaderboard_precompute.sql, 2148_leaderboard_species_key_index_tuning.sql |
| public | request_account_deletion | request_account_deletion(p_reason text DEFAULT NULL) | SECURITY DEFINER | public, extensions | 2051_request_account_deletion.sql |
| public | request_account_export | request_account_export() | SECURITY DEFINER | public, extensions | 2050_request_account_export.sql |
| public | set_comment_admin_author | set_comment_admin_author() | SECURITY INVOKER | public, extensions | 2153_admin_venues_hardening.sql |
| public | set_updated_at | set_updated_at() | UNKNOWN (not stated) | UNKNOWN (not stated) | 1001_core_schema.sql |
| public | soft_delete_comment | soft_delete_comment(p_comment_id uuid) | SECURITY DEFINER | public, extensions | 2024_phase2_comments_threading_enhancements.sql |
| public | unblock_profile | unblock_profile(p_blocked_id uuid) | SECURITY DEFINER | public, extensions | 2062_profile_blocks_rpcs.sql |
| public | upsert_venue_rating | upsert_venue_rating(p_venue_id uuid, p_rating int) | SECURITY DEFINER | public, extensions | 2079_create_venue_ratings.sql, 2082_fix_upsert_venue_rating_ambiguity.sql, 2083_fix_upsert_venue_rating_ambiguity_v2.sql, 2084_fix_upsert_venue_rating_group_by.sql |
| public | user_rate_limits | user_rate_limits() | SECURITY DEFINER | public, extensions | 1003_rate_limits_and_helpers.sql, 2092_rate_limit_functions_fix.sql, 2093_rate_limit_functions_fix_v2.sql |
| public | user_rate_limits | user_rate_limits(p_user_id UUID) | SECURITY DEFINER | public, extensions | 2094_rate_limit_functions_align_with_tests.sql, 2095_rate_limit_functions_alignment_final.sql |

Additional repo notes:
- Explicit GRANT/REVOKE EXECUTE statements are present across many migrations (examples: `1004_policies_and_grants.sql`, `1006_auth_and_rpc_helpers.sql`, `2072_admin_report_rpcs.sql`, `2132_split_get_venue_by_slug_public_admin.sql`, `2149_leaderboard_rpc_fast_path.sql`, `2153_admin_venues_hardening.sql`).
- Drift snapshot: `20251217000304_supabase/migrations/_drift_remote_vs_migrations.sql.sql` includes grant/revoke statements but is a snapshot artifact, not migration intent; validate against live DB.

## Live DB snapshot (to be pasted)
### RPC-REGISTRY-LIVE.sql output

[
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_add_venue_owner",
    "specific_name": "admin_add_venue_owner_19215",
    "privilege_type": "EXECUTE",
    "oid": 19215,
    "identity_args": "p_venue_id uuid, p_user_id uuid, p_role text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_add_venue_owner",
    "specific_name": "admin_add_venue_owner_19215",
    "privilege_type": "EXECUTE",
    "oid": 19215,
    "identity_args": "p_venue_id uuid, p_user_id uuid, p_role text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_add_venue_owner",
    "specific_name": "admin_add_venue_owner_19215",
    "privilege_type": "EXECUTE",
    "oid": 19215,
    "identity_args": "p_venue_id uuid, p_user_id uuid, p_role text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_add_venue_owner",
    "specific_name": "admin_add_venue_owner_19215",
    "privilege_type": "EXECUTE",
    "oid": 19215,
    "identity_args": "p_venue_id uuid, p_user_id uuid, p_role text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_add_venue_photo",
    "specific_name": "admin_add_venue_photo_19505",
    "privilege_type": "EXECUTE",
    "oid": 19505,
    "identity_args": "p_venue_id uuid, p_image_path text, p_caption text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_add_venue_photo",
    "specific_name": "admin_add_venue_photo_19505",
    "privilege_type": "EXECUTE",
    "oid": 19505,
    "identity_args": "p_venue_id uuid, p_image_path text, p_caption text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_add_venue_photo",
    "specific_name": "admin_add_venue_photo_19505",
    "privilege_type": "EXECUTE",
    "oid": 19505,
    "identity_args": "p_venue_id uuid, p_image_path text, p_caption text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_add_venue_photo",
    "specific_name": "admin_add_venue_photo_19505",
    "privilege_type": "EXECUTE",
    "oid": 19505,
    "identity_args": "p_venue_id uuid, p_image_path text, p_caption text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_clear_moderation_status",
    "specific_name": "admin_clear_moderation_status_19076",
    "privilege_type": "EXECUTE",
    "oid": 19076,
    "identity_args": "p_user_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_clear_moderation_status",
    "specific_name": "admin_clear_moderation_status_19076",
    "privilege_type": "EXECUTE",
    "oid": 19076,
    "identity_args": "p_user_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_clear_moderation_status",
    "specific_name": "admin_clear_moderation_status_19076",
    "privilege_type": "EXECUTE",
    "oid": 19076,
    "identity_args": "p_user_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_clear_moderation_status",
    "specific_name": "admin_clear_moderation_status_19076",
    "privilege_type": "EXECUTE",
    "oid": 19076,
    "identity_args": "p_user_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_create_venue_event",
    "specific_name": "admin_create_venue_event_19311",
    "privilege_type": "EXECUTE",
    "oid": 19311,
    "identity_args": "p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_is_published boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_create_venue_event",
    "specific_name": "admin_create_venue_event_19311",
    "privilege_type": "EXECUTE",
    "oid": 19311,
    "identity_args": "p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_is_published boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_create_venue_event",
    "specific_name": "admin_create_venue_event_19311",
    "privilege_type": "EXECUTE",
    "oid": 19311,
    "identity_args": "p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_is_published boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_create_venue_event",
    "specific_name": "admin_create_venue_event_19311",
    "privilege_type": "EXECUTE",
    "oid": 19311,
    "identity_args": "p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_is_published boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_create_venue_opening_hour",
    "specific_name": "admin_create_venue_opening_hour_19417",
    "privilege_type": "EXECUTE",
    "oid": 19417,
    "identity_args": "p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_create_venue_opening_hour",
    "specific_name": "admin_create_venue_opening_hour_19417",
    "privilege_type": "EXECUTE",
    "oid": 19417,
    "identity_args": "p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_create_venue_opening_hour",
    "specific_name": "admin_create_venue_opening_hour_19417",
    "privilege_type": "EXECUTE",
    "oid": 19417,
    "identity_args": "p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_create_venue_opening_hour",
    "specific_name": "admin_create_venue_opening_hour_19417",
    "privilege_type": "EXECUTE",
    "oid": 19417,
    "identity_args": "p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_create_venue_pricing_tier",
    "specific_name": "admin_create_venue_pricing_tier_19449",
    "privilege_type": "EXECUTE",
    "oid": 19449,
    "identity_args": "p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_create_venue_pricing_tier",
    "specific_name": "admin_create_venue_pricing_tier_19449",
    "privilege_type": "EXECUTE",
    "oid": 19449,
    "identity_args": "p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_create_venue_pricing_tier",
    "specific_name": "admin_create_venue_pricing_tier_19449",
    "privilege_type": "EXECUTE",
    "oid": 19449,
    "identity_args": "p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_create_venue_pricing_tier",
    "specific_name": "admin_create_venue_pricing_tier_19449",
    "privilege_type": "EXECUTE",
    "oid": 19449,
    "identity_args": "p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_create_venue_species_stock",
    "specific_name": "admin_create_venue_species_stock_19485",
    "privilege_type": "EXECUTE",
    "oid": 19485,
    "identity_args": "p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_create_venue_species_stock",
    "specific_name": "admin_create_venue_species_stock_19485",
    "privilege_type": "EXECUTE",
    "oid": 19485,
    "identity_args": "p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_create_venue_species_stock",
    "specific_name": "admin_create_venue_species_stock_19485",
    "privilege_type": "EXECUTE",
    "oid": 19485,
    "identity_args": "p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_create_venue_species_stock",
    "specific_name": "admin_create_venue_species_stock_19485",
    "privilege_type": "EXECUTE",
    "oid": 19485,
    "identity_args": "p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_delete_account",
    "specific_name": "admin_delete_account_19084",
    "privilege_type": "EXECUTE",
    "oid": 19084,
    "identity_args": "p_target uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_delete_account",
    "specific_name": "admin_delete_account_19084",
    "privilege_type": "EXECUTE",
    "oid": 19084,
    "identity_args": "p_target uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_delete_account",
    "specific_name": "admin_delete_account_19084",
    "privilege_type": "EXECUTE",
    "oid": 19084,
    "identity_args": "p_target uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_delete_account",
    "specific_name": "admin_delete_account_19084",
    "privilege_type": "EXECUTE",
    "oid": 19084,
    "identity_args": "p_target uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_delete_catch",
    "specific_name": "admin_delete_catch_18978",
    "privilege_type": "EXECUTE",
    "oid": 18978,
    "identity_args": "p_catch_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_delete_catch",
    "specific_name": "admin_delete_catch_18978",
    "privilege_type": "EXECUTE",
    "oid": 18978,
    "identity_args": "p_catch_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_delete_catch",
    "specific_name": "admin_delete_catch_18978",
    "privilege_type": "EXECUTE",
    "oid": 18978,
    "identity_args": "p_catch_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_delete_catch",
    "specific_name": "admin_delete_catch_18978",
    "privilege_type": "EXECUTE",
    "oid": 18978,
    "identity_args": "p_catch_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_delete_comment",
    "specific_name": "admin_delete_comment_18980",
    "privilege_type": "EXECUTE",
    "oid": 18980,
    "identity_args": "p_comment_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_delete_comment",
    "specific_name": "admin_delete_comment_18980",
    "privilege_type": "EXECUTE",
    "oid": 18980,
    "identity_args": "p_comment_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_delete_comment",
    "specific_name": "admin_delete_comment_18980",
    "privilege_type": "EXECUTE",
    "oid": 18980,
    "identity_args": "p_comment_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_delete_comment",
    "specific_name": "admin_delete_comment_18980",
    "privilege_type": "EXECUTE",
    "oid": 18980,
    "identity_args": "p_comment_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_delete_venue_event",
    "specific_name": "admin_delete_venue_event_19313",
    "privilege_type": "EXECUTE",
    "oid": 19313,
    "identity_args": "p_event_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_delete_venue_event",
    "specific_name": "admin_delete_venue_event_19313",
    "privilege_type": "EXECUTE",
    "oid": 19313,
    "identity_args": "p_event_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_delete_venue_event",
    "specific_name": "admin_delete_venue_event_19313",
    "privilege_type": "EXECUTE",
    "oid": 19313,
    "identity_args": "p_event_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_delete_venue_event",
    "specific_name": "admin_delete_venue_event_19313",
    "privilege_type": "EXECUTE",
    "oid": 19313,
    "identity_args": "p_event_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_delete_venue_opening_hour",
    "specific_name": "admin_delete_venue_opening_hour_19419",
    "privilege_type": "EXECUTE",
    "oid": 19419,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_delete_venue_opening_hour",
    "specific_name": "admin_delete_venue_opening_hour_19419",
    "privilege_type": "EXECUTE",
    "oid": 19419,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_delete_venue_opening_hour",
    "specific_name": "admin_delete_venue_opening_hour_19419",
    "privilege_type": "EXECUTE",
    "oid": 19419,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_delete_venue_opening_hour",
    "specific_name": "admin_delete_venue_opening_hour_19419",
    "privilege_type": "EXECUTE",
    "oid": 19419,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_delete_venue_photo",
    "specific_name": "admin_delete_venue_photo_19506",
    "privilege_type": "EXECUTE",
    "oid": 19506,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_delete_venue_photo",
    "specific_name": "admin_delete_venue_photo_19506",
    "privilege_type": "EXECUTE",
    "oid": 19506,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_delete_venue_photo",
    "specific_name": "admin_delete_venue_photo_19506",
    "privilege_type": "EXECUTE",
    "oid": 19506,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_delete_venue_photo",
    "specific_name": "admin_delete_venue_photo_19506",
    "privilege_type": "EXECUTE",
    "oid": 19506,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_delete_venue_pricing_tier",
    "specific_name": "admin_delete_venue_pricing_tier_19425",
    "privilege_type": "EXECUTE",
    "oid": 19425,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_delete_venue_pricing_tier",
    "specific_name": "admin_delete_venue_pricing_tier_19425",
    "privilege_type": "EXECUTE",
    "oid": 19425,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_delete_venue_pricing_tier",
    "specific_name": "admin_delete_venue_pricing_tier_19425",
    "privilege_type": "EXECUTE",
    "oid": 19425,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_delete_venue_pricing_tier",
    "specific_name": "admin_delete_venue_pricing_tier_19425",
    "privilege_type": "EXECUTE",
    "oid": 19425,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_delete_venue_species_stock",
    "specific_name": "admin_delete_venue_species_stock_19487",
    "privilege_type": "EXECUTE",
    "oid": 19487,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_delete_venue_species_stock",
    "specific_name": "admin_delete_venue_species_stock_19487",
    "privilege_type": "EXECUTE",
    "oid": 19487,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_delete_venue_species_stock",
    "specific_name": "admin_delete_venue_species_stock_19487",
    "privilege_type": "EXECUTE",
    "oid": 19487,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_delete_venue_species_stock",
    "specific_name": "admin_delete_venue_species_stock_19487",
    "privilege_type": "EXECUTE",
    "oid": 19487,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_get_venue_by_slug",
    "specific_name": "admin_get_venue_by_slug_19508",
    "privilege_type": "EXECUTE",
    "oid": 19508,
    "identity_args": "p_slug text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_get_venue_by_slug",
    "specific_name": "admin_get_venue_by_slug_19508",
    "privilege_type": "EXECUTE",
    "oid": 19508,
    "identity_args": "p_slug text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_get_venue_events",
    "specific_name": "admin_get_venue_events_19314",
    "privilege_type": "EXECUTE",
    "oid": 19314,
    "identity_args": "p_venue_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_get_venue_events",
    "specific_name": "admin_get_venue_events_19314",
    "privilege_type": "EXECUTE",
    "oid": 19314,
    "identity_args": "p_venue_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_get_venue_events",
    "specific_name": "admin_get_venue_events_19314",
    "privilege_type": "EXECUTE",
    "oid": 19314,
    "identity_args": "p_venue_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_get_venue_events",
    "specific_name": "admin_get_venue_events_19314",
    "privilege_type": "EXECUTE",
    "oid": 19314,
    "identity_args": "p_venue_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_get_venues",
    "specific_name": "admin_get_venues_19636",
    "privilege_type": "EXECUTE",
    "oid": 19636,
    "identity_args": "p_search text, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_get_venues",
    "specific_name": "admin_get_venues_19636",
    "privilege_type": "EXECUTE",
    "oid": 19636,
    "identity_args": "p_search text, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_list_moderation_log",
    "specific_name": "admin_list_moderation_log_19190",
    "privilege_type": "EXECUTE",
    "oid": 19190,
    "identity_args": "p_user_id uuid, p_action text, p_search text, p_from timestamp with time zone, p_to timestamp with time zone, p_sort_direction text, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_list_moderation_log",
    "specific_name": "admin_list_moderation_log_19190",
    "privilege_type": "EXECUTE",
    "oid": 19190,
    "identity_args": "p_user_id uuid, p_action text, p_search text, p_from timestamp with time zone, p_to timestamp with time zone, p_sort_direction text, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_list_moderation_log",
    "specific_name": "admin_list_moderation_log_19190",
    "privilege_type": "EXECUTE",
    "oid": 19190,
    "identity_args": "p_user_id uuid, p_action text, p_search text, p_from timestamp with time zone, p_to timestamp with time zone, p_sort_direction text, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_list_moderation_log",
    "specific_name": "admin_list_moderation_log_19190",
    "privilege_type": "EXECUTE",
    "oid": 19190,
    "identity_args": "p_user_id uuid, p_action text, p_search text, p_from timestamp with time zone, p_to timestamp with time zone, p_sort_direction text, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_list_reports",
    "specific_name": "admin_list_reports_19188",
    "privilege_type": "EXECUTE",
    "oid": 19188,
    "identity_args": "p_status text, p_type text, p_reported_user_id uuid, p_from timestamp with time zone, p_to timestamp with time zone, p_sort_direction text, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_list_reports",
    "specific_name": "admin_list_reports_19188",
    "privilege_type": "EXECUTE",
    "oid": 19188,
    "identity_args": "p_status text, p_type text, p_reported_user_id uuid, p_from timestamp with time zone, p_to timestamp with time zone, p_sort_direction text, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_list_reports",
    "specific_name": "admin_list_reports_19188",
    "privilege_type": "EXECUTE",
    "oid": 19188,
    "identity_args": "p_status text, p_type text, p_reported_user_id uuid, p_from timestamp with time zone, p_to timestamp with time zone, p_sort_direction text, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_list_reports",
    "specific_name": "admin_list_reports_19188",
    "privilege_type": "EXECUTE",
    "oid": 19188,
    "identity_args": "p_status text, p_type text, p_reported_user_id uuid, p_from timestamp with time zone, p_to timestamp with time zone, p_sort_direction text, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_remove_venue_owner",
    "specific_name": "admin_remove_venue_owner_19216",
    "privilege_type": "EXECUTE",
    "oid": 19216,
    "identity_args": "p_venue_id uuid, p_user_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_remove_venue_owner",
    "specific_name": "admin_remove_venue_owner_19216",
    "privilege_type": "EXECUTE",
    "oid": 19216,
    "identity_args": "p_venue_id uuid, p_user_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_remove_venue_owner",
    "specific_name": "admin_remove_venue_owner_19216",
    "privilege_type": "EXECUTE",
    "oid": 19216,
    "identity_args": "p_venue_id uuid, p_user_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_remove_venue_owner",
    "specific_name": "admin_remove_venue_owner_19216",
    "privilege_type": "EXECUTE",
    "oid": 19216,
    "identity_args": "p_venue_id uuid, p_user_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_restore_catch",
    "specific_name": "admin_restore_catch_18979",
    "privilege_type": "EXECUTE",
    "oid": 18979,
    "identity_args": "p_catch_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_restore_catch",
    "specific_name": "admin_restore_catch_18979",
    "privilege_type": "EXECUTE",
    "oid": 18979,
    "identity_args": "p_catch_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_restore_catch",
    "specific_name": "admin_restore_catch_18979",
    "privilege_type": "EXECUTE",
    "oid": 18979,
    "identity_args": "p_catch_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_restore_catch",
    "specific_name": "admin_restore_catch_18979",
    "privilege_type": "EXECUTE",
    "oid": 18979,
    "identity_args": "p_catch_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_restore_comment",
    "specific_name": "admin_restore_comment_18981",
    "privilege_type": "EXECUTE",
    "oid": 18981,
    "identity_args": "p_comment_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_restore_comment",
    "specific_name": "admin_restore_comment_18981",
    "privilege_type": "EXECUTE",
    "oid": 18981,
    "identity_args": "p_comment_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_restore_comment",
    "specific_name": "admin_restore_comment_18981",
    "privilege_type": "EXECUTE",
    "oid": 18981,
    "identity_args": "p_comment_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_restore_comment",
    "specific_name": "admin_restore_comment_18981",
    "privilege_type": "EXECUTE",
    "oid": 18981,
    "identity_args": "p_comment_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_set_venue_photo_primary",
    "specific_name": "admin_set_venue_photo_primary_19493",
    "privilege_type": "EXECUTE",
    "oid": 19493,
    "identity_args": "p_photo_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_set_venue_photo_primary",
    "specific_name": "admin_set_venue_photo_primary_19493",
    "privilege_type": "EXECUTE",
    "oid": 19493,
    "identity_args": "p_photo_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_set_venue_photo_primary",
    "specific_name": "admin_set_venue_photo_primary_19493",
    "privilege_type": "EXECUTE",
    "oid": 19493,
    "identity_args": "p_photo_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_set_venue_photo_primary",
    "specific_name": "admin_set_venue_photo_primary_19493",
    "privilege_type": "EXECUTE",
    "oid": 19493,
    "identity_args": "p_photo_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_update_report_status",
    "specific_name": "admin_update_report_status_19189",
    "privilege_type": "EXECUTE",
    "oid": 19189,
    "identity_args": "p_report_id uuid, p_status text, p_resolution_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_update_report_status",
    "specific_name": "admin_update_report_status_19189",
    "privilege_type": "EXECUTE",
    "oid": 19189,
    "identity_args": "p_report_id uuid, p_status text, p_resolution_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_update_report_status",
    "specific_name": "admin_update_report_status_19189",
    "privilege_type": "EXECUTE",
    "oid": 19189,
    "identity_args": "p_report_id uuid, p_status text, p_resolution_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_update_report_status",
    "specific_name": "admin_update_report_status_19189",
    "privilege_type": "EXECUTE",
    "oid": 19189,
    "identity_args": "p_report_id uuid, p_status text, p_resolution_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_update_venue_booking",
    "specific_name": "admin_update_venue_booking_19413",
    "privilege_type": "EXECUTE",
    "oid": 19413,
    "identity_args": "p_venue_id uuid, p_booking_enabled boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_update_venue_booking",
    "specific_name": "admin_update_venue_booking_19413",
    "privilege_type": "EXECUTE",
    "oid": 19413,
    "identity_args": "p_venue_id uuid, p_booking_enabled boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_update_venue_booking",
    "specific_name": "admin_update_venue_booking_19413",
    "privilege_type": "EXECUTE",
    "oid": 19413,
    "identity_args": "p_venue_id uuid, p_booking_enabled boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_update_venue_booking",
    "specific_name": "admin_update_venue_booking_19413",
    "privilege_type": "EXECUTE",
    "oid": 19413,
    "identity_args": "p_venue_id uuid, p_booking_enabled boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_update_venue_event",
    "specific_name": "admin_update_venue_event_19312",
    "privilege_type": "EXECUTE",
    "oid": 19312,
    "identity_args": "p_event_id uuid, p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_is_published boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_update_venue_event",
    "specific_name": "admin_update_venue_event_19312",
    "privilege_type": "EXECUTE",
    "oid": 19312,
    "identity_args": "p_event_id uuid, p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_is_published boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_update_venue_event",
    "specific_name": "admin_update_venue_event_19312",
    "privilege_type": "EXECUTE",
    "oid": 19312,
    "identity_args": "p_event_id uuid, p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_is_published boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_update_venue_event",
    "specific_name": "admin_update_venue_event_19312",
    "privilege_type": "EXECUTE",
    "oid": 19312,
    "identity_args": "p_event_id uuid, p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_is_published boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_update_venue_metadata",
    "specific_name": "admin_update_venue_metadata_19167",
    "privilege_type": "EXECUTE",
    "oid": 19446,
    "identity_args": "p_venue_id uuid, p_short_tagline text, p_description text, p_ticket_type text, p_price_from text, p_best_for_tags text[], p_facilities text[], p_website_url text, p_booking_url text, p_contact_phone text, p_notes_for_rr_team text, p_payment_methods text[], p_payment_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_update_venue_metadata",
    "specific_name": "admin_update_venue_metadata_19167",
    "privilege_type": "EXECUTE",
    "oid": 19446,
    "identity_args": "p_venue_id uuid, p_short_tagline text, p_description text, p_ticket_type text, p_price_from text, p_best_for_tags text[], p_facilities text[], p_website_url text, p_booking_url text, p_contact_phone text, p_notes_for_rr_team text, p_payment_methods text[], p_payment_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_update_venue_metadata",
    "specific_name": "admin_update_venue_metadata_19446",
    "privilege_type": "EXECUTE",
    "oid": 19446,
    "identity_args": "p_venue_id uuid, p_short_tagline text, p_description text, p_ticket_type text, p_price_from text, p_best_for_tags text[], p_facilities text[], p_website_url text, p_booking_url text, p_contact_phone text, p_notes_for_rr_team text, p_payment_methods text[], p_payment_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_update_venue_metadata",
    "specific_name": "admin_update_venue_metadata_19167",
    "privilege_type": "EXECUTE",
    "oid": 19446,
    "identity_args": "p_venue_id uuid, p_short_tagline text, p_description text, p_ticket_type text, p_price_from text, p_best_for_tags text[], p_facilities text[], p_website_url text, p_booking_url text, p_contact_phone text, p_notes_for_rr_team text, p_payment_methods text[], p_payment_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_update_venue_metadata",
    "specific_name": "admin_update_venue_metadata_19446",
    "privilege_type": "EXECUTE",
    "oid": 19167,
    "identity_args": "p_venue_id uuid, p_short_tagline text, p_ticket_type text, p_price_from text, p_best_for_tags text[], p_facilities text[], p_website_url text, p_booking_url text, p_contact_phone text, p_notes_for_rr_team text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_update_venue_metadata",
    "specific_name": "admin_update_venue_metadata_19167",
    "privilege_type": "EXECUTE",
    "oid": 19167,
    "identity_args": "p_venue_id uuid, p_short_tagline text, p_ticket_type text, p_price_from text, p_best_for_tags text[], p_facilities text[], p_website_url text, p_booking_url text, p_contact_phone text, p_notes_for_rr_team text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_update_venue_metadata",
    "specific_name": "admin_update_venue_metadata_19446",
    "privilege_type": "EXECUTE",
    "oid": 19167,
    "identity_args": "p_venue_id uuid, p_short_tagline text, p_ticket_type text, p_price_from text, p_best_for_tags text[], p_facilities text[], p_website_url text, p_booking_url text, p_contact_phone text, p_notes_for_rr_team text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_update_venue_metadata",
    "specific_name": "admin_update_venue_metadata_19167",
    "privilege_type": "EXECUTE",
    "oid": 19167,
    "identity_args": "p_venue_id uuid, p_short_tagline text, p_ticket_type text, p_price_from text, p_best_for_tags text[], p_facilities text[], p_website_url text, p_booking_url text, p_contact_phone text, p_notes_for_rr_team text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_update_venue_opening_hour",
    "specific_name": "admin_update_venue_opening_hour_19418",
    "privilege_type": "EXECUTE",
    "oid": 19418,
    "identity_args": "p_id uuid, p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_update_venue_opening_hour",
    "specific_name": "admin_update_venue_opening_hour_19418",
    "privilege_type": "EXECUTE",
    "oid": 19418,
    "identity_args": "p_id uuid, p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_update_venue_opening_hour",
    "specific_name": "admin_update_venue_opening_hour_19418",
    "privilege_type": "EXECUTE",
    "oid": 19418,
    "identity_args": "p_id uuid, p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_update_venue_opening_hour",
    "specific_name": "admin_update_venue_opening_hour_19418",
    "privilege_type": "EXECUTE",
    "oid": 19418,
    "identity_args": "p_id uuid, p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_update_venue_pricing_tier",
    "specific_name": "admin_update_venue_pricing_tier_19450",
    "privilege_type": "EXECUTE",
    "oid": 19450,
    "identity_args": "p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_update_venue_pricing_tier",
    "specific_name": "admin_update_venue_pricing_tier_19450",
    "privilege_type": "EXECUTE",
    "oid": 19450,
    "identity_args": "p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_update_venue_pricing_tier",
    "specific_name": "admin_update_venue_pricing_tier_19450",
    "privilege_type": "EXECUTE",
    "oid": 19450,
    "identity_args": "p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_update_venue_pricing_tier",
    "specific_name": "admin_update_venue_pricing_tier_19450",
    "privilege_type": "EXECUTE",
    "oid": 19450,
    "identity_args": "p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_update_venue_rules",
    "specific_name": "admin_update_venue_rules_19427",
    "privilege_type": "EXECUTE",
    "oid": 19427,
    "identity_args": "p_venue_id uuid, p_rules_text text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_update_venue_rules",
    "specific_name": "admin_update_venue_rules_19427",
    "privilege_type": "EXECUTE",
    "oid": 19427,
    "identity_args": "p_venue_id uuid, p_rules_text text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_update_venue_rules",
    "specific_name": "admin_update_venue_rules_19427",
    "privilege_type": "EXECUTE",
    "oid": 19427,
    "identity_args": "p_venue_id uuid, p_rules_text text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_update_venue_rules",
    "specific_name": "admin_update_venue_rules_19427",
    "privilege_type": "EXECUTE",
    "oid": 19427,
    "identity_args": "p_venue_id uuid, p_rules_text text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_update_venue_species_stock",
    "specific_name": "admin_update_venue_species_stock_19486",
    "privilege_type": "EXECUTE",
    "oid": 19486,
    "identity_args": "p_id uuid, p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_update_venue_species_stock",
    "specific_name": "admin_update_venue_species_stock_19486",
    "privilege_type": "EXECUTE",
    "oid": 19486,
    "identity_args": "p_id uuid, p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_update_venue_species_stock",
    "specific_name": "admin_update_venue_species_stock_19486",
    "privilege_type": "EXECUTE",
    "oid": 19486,
    "identity_args": "p_id uuid, p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_update_venue_species_stock",
    "specific_name": "admin_update_venue_species_stock_19486",
    "privilege_type": "EXECUTE",
    "oid": 19486,
    "identity_args": "p_id uuid, p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "admin_warn_user",
    "specific_name": "admin_warn_user_19075",
    "privilege_type": "EXECUTE",
    "oid": 19075,
    "identity_args": "p_user_id uuid, p_reason text, p_severity warning_severity, p_duration_hours integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "admin_warn_user",
    "specific_name": "admin_warn_user_19075",
    "privilege_type": "EXECUTE",
    "oid": 19075,
    "identity_args": "p_user_id uuid, p_reason text, p_severity warning_severity, p_duration_hours integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "admin_warn_user",
    "specific_name": "admin_warn_user_19075",
    "privilege_type": "EXECUTE",
    "oid": 19075,
    "identity_args": "p_user_id uuid, p_reason text, p_severity warning_severity, p_duration_hours integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "admin_warn_user",
    "specific_name": "admin_warn_user_19075",
    "privilege_type": "EXECUTE",
    "oid": 19075,
    "identity_args": "p_user_id uuid, p_reason text, p_severity warning_severity, p_duration_hours integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "assert_moderation_allowed",
    "specific_name": "assert_moderation_allowed_19066",
    "privilege_type": "EXECUTE",
    "oid": 19066,
    "identity_args": "p_user_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "assert_moderation_allowed",
    "specific_name": "assert_moderation_allowed_19066",
    "privilege_type": "EXECUTE",
    "oid": 19066,
    "identity_args": "p_user_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "assert_moderation_allowed",
    "specific_name": "assert_moderation_allowed_19066",
    "privilege_type": "EXECUTE",
    "oid": 19066,
    "identity_args": "p_user_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "assert_moderation_allowed",
    "specific_name": "assert_moderation_allowed_19066",
    "privilege_type": "EXECUTE",
    "oid": 19066,
    "identity_args": "p_user_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "block_profile",
    "specific_name": "block_profile_19150",
    "privilege_type": "EXECUTE",
    "oid": 19150,
    "identity_args": "p_blocked_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "block_profile",
    "specific_name": "block_profile_19150",
    "privilege_type": "EXECUTE",
    "oid": 19150,
    "identity_args": "p_blocked_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "block_profile",
    "specific_name": "block_profile_19150",
    "privilege_type": "EXECUTE",
    "oid": 19150,
    "identity_args": "p_blocked_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "block_profile",
    "specific_name": "block_profile_19150",
    "privilege_type": "EXECUTE",
    "oid": 19150,
    "identity_args": "p_blocked_id uuid, p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "check_email_exists",
    "specific_name": "check_email_exists_18971",
    "privilege_type": "EXECUTE",
    "oid": 18971,
    "identity_args": "email_to_check text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "check_email_exists",
    "specific_name": "check_email_exists_18971",
    "privilege_type": "EXECUTE",
    "oid": 18971,
    "identity_args": "email_to_check text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "check_email_exists",
    "specific_name": "check_email_exists_18971",
    "privilege_type": "EXECUTE",
    "oid": 18971,
    "identity_args": "email_to_check text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "check_email_exists",
    "specific_name": "check_email_exists_18971",
    "privilege_type": "EXECUTE",
    "oid": 18971,
    "identity_args": "email_to_check text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "check_rate_limit",
    "specific_name": "check_rate_limit_18863",
    "privilege_type": "EXECUTE",
    "oid": 18863,
    "identity_args": "p_user_id uuid, p_action text, p_max_attempts integer, p_window_minutes integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "check_rate_limit",
    "specific_name": "check_rate_limit_18863",
    "privilege_type": "EXECUTE",
    "oid": 18863,
    "identity_args": "p_user_id uuid, p_action text, p_max_attempts integer, p_window_minutes integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "check_rate_limit",
    "specific_name": "check_rate_limit_18863",
    "privilege_type": "EXECUTE",
    "oid": 18863,
    "identity_args": "p_user_id uuid, p_action text, p_max_attempts integer, p_window_minutes integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "check_rate_limit",
    "specific_name": "check_rate_limit_18863",
    "privilege_type": "EXECUTE",
    "oid": 18863,
    "identity_args": "p_user_id uuid, p_action text, p_max_attempts integer, p_window_minutes integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "cleanup_rate_limits",
    "specific_name": "cleanup_rate_limits_18866",
    "privilege_type": "EXECUTE",
    "oid": 18866,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "cleanup_rate_limits",
    "specific_name": "cleanup_rate_limits_18866",
    "privilege_type": "EXECUTE",
    "oid": 18866,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "cleanup_rate_limits",
    "specific_name": "cleanup_rate_limits_18866",
    "privilege_type": "EXECUTE",
    "oid": 18866,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "cleanup_rate_limits",
    "specific_name": "cleanup_rate_limits_18866",
    "privilege_type": "EXECUTE",
    "oid": 18866,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "community_stats_handle_catches_change",
    "specific_name": "community_stats_handle_catches_change_19550",
    "privilege_type": "EXECUTE",
    "oid": 19550,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "community_stats_handle_catches_change",
    "specific_name": "community_stats_handle_catches_change_19550",
    "privilege_type": "EXECUTE",
    "oid": 19550,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "community_stats_handle_catches_change",
    "specific_name": "community_stats_handle_catches_change_19550",
    "privilege_type": "EXECUTE",
    "oid": 19550,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "community_stats_handle_catches_change",
    "specific_name": "community_stats_handle_catches_change_19550",
    "privilege_type": "EXECUTE",
    "oid": 19550,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "create_comment_with_rate_limit",
    "specific_name": "create_comment_with_rate_limit_19028",
    "privilege_type": "EXECUTE",
    "oid": 19028,
    "identity_args": "p_catch_id uuid, p_body text, p_parent_comment_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "create_comment_with_rate_limit",
    "specific_name": "create_comment_with_rate_limit_19028",
    "privilege_type": "EXECUTE",
    "oid": 19028,
    "identity_args": "p_catch_id uuid, p_body text, p_parent_comment_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "create_comment_with_rate_limit",
    "specific_name": "create_comment_with_rate_limit_19028",
    "privilege_type": "EXECUTE",
    "oid": 19028,
    "identity_args": "p_catch_id uuid, p_body text, p_parent_comment_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "create_comment_with_rate_limit",
    "specific_name": "create_comment_with_rate_limit_19028",
    "privilege_type": "EXECUTE",
    "oid": 19028,
    "identity_args": "p_catch_id uuid, p_body text, p_parent_comment_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "create_notification",
    "specific_name": "create_notification_19065",
    "privilege_type": "EXECUTE",
    "oid": 19065,
    "identity_args": "p_user_id uuid, p_message text, p_type notification_type, p_actor_id uuid, p_catch_id uuid, p_comment_id uuid, p_extra_data jsonb",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "create_notification",
    "specific_name": "create_notification_19065",
    "privilege_type": "EXECUTE",
    "oid": 19065,
    "identity_args": "p_user_id uuid, p_message text, p_type notification_type, p_actor_id uuid, p_catch_id uuid, p_comment_id uuid, p_extra_data jsonb",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "create_notification",
    "specific_name": "create_notification_19065",
    "privilege_type": "EXECUTE",
    "oid": 19065,
    "identity_args": "p_user_id uuid, p_message text, p_type notification_type, p_actor_id uuid, p_catch_id uuid, p_comment_id uuid, p_extra_data jsonb",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "create_notification",
    "specific_name": "create_notification_19065",
    "privilege_type": "EXECUTE",
    "oid": 19065,
    "identity_args": "p_user_id uuid, p_message text, p_type notification_type, p_actor_id uuid, p_catch_id uuid, p_comment_id uuid, p_extra_data jsonb",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "create_report_with_rate_limit",
    "specific_name": "create_report_with_rate_limit_18974",
    "privilege_type": "EXECUTE",
    "oid": 18974,
    "identity_args": "p_target_type report_target_type, p_target_id uuid, p_reason text, p_details text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "create_report_with_rate_limit",
    "specific_name": "create_report_with_rate_limit_18974",
    "privilege_type": "EXECUTE",
    "oid": 18974,
    "identity_args": "p_target_type report_target_type, p_target_id uuid, p_reason text, p_details text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "create_report_with_rate_limit",
    "specific_name": "create_report_with_rate_limit_18974",
    "privilege_type": "EXECUTE",
    "oid": 18974,
    "identity_args": "p_target_type report_target_type, p_target_id uuid, p_reason text, p_details text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "create_report_with_rate_limit",
    "specific_name": "create_report_with_rate_limit_18974",
    "privilege_type": "EXECUTE",
    "oid": 18974,
    "identity_args": "p_target_type report_target_type, p_target_id uuid, p_reason text, p_details text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "enforce_catch_moderation",
    "specific_name": "enforce_catch_moderation_19068",
    "privilege_type": "EXECUTE",
    "oid": 19068,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "enforce_catch_moderation",
    "specific_name": "enforce_catch_moderation_19068",
    "privilege_type": "EXECUTE",
    "oid": 19068,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "enforce_catch_moderation",
    "specific_name": "enforce_catch_moderation_19068",
    "privilege_type": "EXECUTE",
    "oid": 19068,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "enforce_catch_moderation",
    "specific_name": "enforce_catch_moderation_19068",
    "privilege_type": "EXECUTE",
    "oid": 19068,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "enforce_catch_rate_limit",
    "specific_name": "enforce_catch_rate_limit_18867",
    "privilege_type": "EXECUTE",
    "oid": 18867,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "enforce_catch_rate_limit",
    "specific_name": "enforce_catch_rate_limit_18867",
    "privilege_type": "EXECUTE",
    "oid": 18867,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "enforce_catch_rate_limit",
    "specific_name": "enforce_catch_rate_limit_18867",
    "privilege_type": "EXECUTE",
    "oid": 18867,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "enforce_catch_rate_limit",
    "specific_name": "enforce_catch_rate_limit_18867",
    "privilege_type": "EXECUTE",
    "oid": 18867,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "enforce_comment_rate_limit",
    "specific_name": "enforce_comment_rate_limit_18868",
    "privilege_type": "EXECUTE",
    "oid": 18868,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "enforce_comment_rate_limit",
    "specific_name": "enforce_comment_rate_limit_18868",
    "privilege_type": "EXECUTE",
    "oid": 18868,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "enforce_comment_rate_limit",
    "specific_name": "enforce_comment_rate_limit_18868",
    "privilege_type": "EXECUTE",
    "oid": 18868,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "enforce_comment_rate_limit",
    "specific_name": "enforce_comment_rate_limit_18868",
    "privilege_type": "EXECUTE",
    "oid": 18868,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "enforce_report_rate_limit",
    "specific_name": "enforce_report_rate_limit_18869",
    "privilege_type": "EXECUTE",
    "oid": 18869,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "enforce_report_rate_limit",
    "specific_name": "enforce_report_rate_limit_18869",
    "privilege_type": "EXECUTE",
    "oid": 18869,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "enforce_report_rate_limit",
    "specific_name": "enforce_report_rate_limit_18869",
    "privilege_type": "EXECUTE",
    "oid": 18869,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "enforce_report_rate_limit",
    "specific_name": "enforce_report_rate_limit_18869",
    "privilege_type": "EXECUTE",
    "oid": 18869,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "follow_profile_with_rate_limit",
    "specific_name": "follow_profile_with_rate_limit_18977",
    "privilege_type": "EXECUTE",
    "oid": 18977,
    "identity_args": "p_following_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "follow_profile_with_rate_limit",
    "specific_name": "follow_profile_with_rate_limit_18977",
    "privilege_type": "EXECUTE",
    "oid": 18977,
    "identity_args": "p_following_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "follow_profile_with_rate_limit",
    "specific_name": "follow_profile_with_rate_limit_18977",
    "privilege_type": "EXECUTE",
    "oid": 18977,
    "identity_args": "p_following_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "follow_profile_with_rate_limit",
    "specific_name": "follow_profile_with_rate_limit_18977",
    "privilege_type": "EXECUTE",
    "oid": 18977,
    "identity_args": "p_following_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "get_catch_rating_summary",
    "specific_name": "get_catch_rating_summary_19330",
    "privilege_type": "EXECUTE",
    "oid": 19330,
    "identity_args": "p_catch_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "get_catch_rating_summary",
    "specific_name": "get_catch_rating_summary_19330",
    "privilege_type": "EXECUTE",
    "oid": 19330,
    "identity_args": "p_catch_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "get_catch_rating_summary",
    "specific_name": "get_catch_rating_summary_19330",
    "privilege_type": "EXECUTE",
    "oid": 19330,
    "identity_args": "p_catch_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "get_catch_rating_summary",
    "specific_name": "get_catch_rating_summary_19330",
    "privilege_type": "EXECUTE",
    "oid": 19330,
    "identity_args": "p_catch_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "get_community_stats",
    "specific_name": "get_community_stats_19552",
    "privilege_type": "EXECUTE",
    "oid": 19552,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "get_community_stats",
    "specific_name": "get_community_stats_19552",
    "privilege_type": "EXECUTE",
    "oid": 19552,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "get_community_stats",
    "specific_name": "get_community_stats_19552",
    "privilege_type": "EXECUTE",
    "oid": 19552,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "get_feed_catches",
    "specific_name": "get_feed_catches_19432",
    "privilege_type": "EXECUTE",
    "oid": 19432,
    "identity_args": "p_limit integer, p_offset integer, p_scope text, p_sort text, p_species text, p_custom_species text, p_venue_id uuid, p_session_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "get_feed_catches",
    "specific_name": "get_feed_catches_19432",
    "privilege_type": "EXECUTE",
    "oid": 19432,
    "identity_args": "p_limit integer, p_offset integer, p_scope text, p_sort text, p_species text, p_custom_species text, p_venue_id uuid, p_session_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "get_feed_catches",
    "specific_name": "get_feed_catches_19432",
    "privilege_type": "EXECUTE",
    "oid": 19432,
    "identity_args": "p_limit integer, p_offset integer, p_scope text, p_sort text, p_species text, p_custom_species text, p_venue_id uuid, p_session_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "get_feed_catches",
    "specific_name": "get_feed_catches_19432",
    "privilege_type": "EXECUTE",
    "oid": 19432,
    "identity_args": "p_limit integer, p_offset integer, p_scope text, p_sort text, p_species text, p_custom_species text, p_venue_id uuid, p_session_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "get_follower_count",
    "specific_name": "get_follower_count_18999",
    "privilege_type": "EXECUTE",
    "oid": 18999,
    "identity_args": "p_profile_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "get_follower_count",
    "specific_name": "get_follower_count_18999",
    "privilege_type": "EXECUTE",
    "oid": 18999,
    "identity_args": "p_profile_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "get_follower_count",
    "specific_name": "get_follower_count_18999",
    "privilege_type": "EXECUTE",
    "oid": 18999,
    "identity_args": "p_profile_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "get_follower_count",
    "specific_name": "get_follower_count_18999",
    "privilege_type": "EXECUTE",
    "oid": 18999,
    "identity_args": "p_profile_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "get_insights_aggregates",
    "specific_name": "get_insights_aggregates_19566",
    "privilege_type": "EXECUTE",
    "oid": 19566,
    "identity_args": "p_date_preset text, p_custom_start timestamp with time zone, p_custom_end timestamp with time zone, p_selected_session_id uuid, p_selected_venue text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "get_insights_aggregates",
    "specific_name": "get_insights_aggregates_19566",
    "privilege_type": "EXECUTE",
    "oid": 19566,
    "identity_args": "p_date_preset text, p_custom_start timestamp with time zone, p_custom_end timestamp with time zone, p_selected_session_id uuid, p_selected_venue text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "get_insights_aggregates",
    "specific_name": "get_insights_aggregates_19566",
    "privilege_type": "EXECUTE",
    "oid": 19566,
    "identity_args": "p_date_preset text, p_custom_start timestamp with time zone, p_custom_end timestamp with time zone, p_selected_session_id uuid, p_selected_venue text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "get_leaderboard_scores",
    "specific_name": "get_leaderboard_scores_19628",
    "privilege_type": "EXECUTE",
    "oid": 19628,
    "identity_args": "p_species_slug text, p_limit integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "get_leaderboard_scores",
    "specific_name": "get_leaderboard_scores_19628",
    "privilege_type": "EXECUTE",
    "oid": 19628,
    "identity_args": "p_species_slug text, p_limit integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "get_leaderboard_scores",
    "specific_name": "get_leaderboard_scores_19628",
    "privilege_type": "EXECUTE",
    "oid": 19628,
    "identity_args": "p_species_slug text, p_limit integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "get_my_venue_rating",
    "specific_name": "get_my_venue_rating_19281",
    "privilege_type": "EXECUTE",
    "oid": 19281,
    "identity_args": "p_venue_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "get_my_venue_rating",
    "specific_name": "get_my_venue_rating_19281",
    "privilege_type": "EXECUTE",
    "oid": 19281,
    "identity_args": "p_venue_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "get_my_venue_rating",
    "specific_name": "get_my_venue_rating_19281",
    "privilege_type": "EXECUTE",
    "oid": 19281,
    "identity_args": "p_venue_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "get_my_venue_rating",
    "specific_name": "get_my_venue_rating_19281",
    "privilege_type": "EXECUTE",
    "oid": 19281,
    "identity_args": "p_venue_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "get_rate_limit_status",
    "specific_name": "get_rate_limit_status_19317",
    "privilege_type": "EXECUTE",
    "oid": 19317,
    "identity_args": "p_user_id uuid, p_action text, p_max_attempts integer, p_window_minutes integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "get_rate_limit_status",
    "specific_name": "get_rate_limit_status_19317",
    "privilege_type": "EXECUTE",
    "oid": 19317,
    "identity_args": "p_user_id uuid, p_action text, p_max_attempts integer, p_window_minutes integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "get_rate_limit_status",
    "specific_name": "get_rate_limit_status_19317",
    "privilege_type": "EXECUTE",
    "oid": 19317,
    "identity_args": "p_user_id uuid, p_action text, p_max_attempts integer, p_window_minutes integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "get_rate_limit_status",
    "specific_name": "get_rate_limit_status_19317",
    "privilege_type": "EXECUTE",
    "oid": 19317,
    "identity_args": "p_user_id uuid, p_action text, p_max_attempts integer, p_window_minutes integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "get_species_options",
    "specific_name": "get_species_options_19564",
    "privilege_type": "EXECUTE",
    "oid": 19564,
    "identity_args": "p_only_active boolean, p_only_with_catches boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "get_species_options",
    "specific_name": "get_species_options_19564",
    "privilege_type": "EXECUTE",
    "oid": 19564,
    "identity_args": "p_only_active boolean, p_only_with_catches boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "get_species_options",
    "specific_name": "get_species_options_19564",
    "privilege_type": "EXECUTE",
    "oid": 19564,
    "identity_args": "p_only_active boolean, p_only_with_catches boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "get_venue_by_slug",
    "specific_name": "get_venue_by_slug_19648",
    "privilege_type": "EXECUTE",
    "oid": 19648,
    "identity_args": "p_slug text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "get_venue_by_slug",
    "specific_name": "get_venue_by_slug_19648",
    "privilege_type": "EXECUTE",
    "oid": 19648,
    "identity_args": "p_slug text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "get_venue_by_slug",
    "specific_name": "get_venue_by_slug_19648",
    "privilege_type": "EXECUTE",
    "oid": 19648,
    "identity_args": "p_slug text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "get_venue_past_events",
    "specific_name": "get_venue_past_events_19310",
    "privilege_type": "EXECUTE",
    "oid": 19310,
    "identity_args": "p_venue_id uuid, p_now timestamp with time zone, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "get_venue_past_events",
    "specific_name": "get_venue_past_events_19310",
    "privilege_type": "EXECUTE",
    "oid": 19310,
    "identity_args": "p_venue_id uuid, p_now timestamp with time zone, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "get_venue_past_events",
    "specific_name": "get_venue_past_events_19310",
    "privilege_type": "EXECUTE",
    "oid": 19310,
    "identity_args": "p_venue_id uuid, p_now timestamp with time zone, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "get_venue_past_events",
    "specific_name": "get_venue_past_events_19310",
    "privilege_type": "EXECUTE",
    "oid": 19310,
    "identity_args": "p_venue_id uuid, p_now timestamp with time zone, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "get_venue_photos",
    "specific_name": "get_venue_photos_19251",
    "privilege_type": "EXECUTE",
    "oid": 19251,
    "identity_args": "p_venue_id uuid, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "get_venue_photos",
    "specific_name": "get_venue_photos_19251",
    "privilege_type": "EXECUTE",
    "oid": 19251,
    "identity_args": "p_venue_id uuid, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "get_venue_photos",
    "specific_name": "get_venue_photos_19251",
    "privilege_type": "EXECUTE",
    "oid": 19251,
    "identity_args": "p_venue_id uuid, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "get_venue_photos",
    "specific_name": "get_venue_photos_19251",
    "privilege_type": "EXECUTE",
    "oid": 19251,
    "identity_args": "p_venue_id uuid, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "get_venue_recent_catches",
    "specific_name": "get_venue_recent_catches_19144",
    "privilege_type": "EXECUTE",
    "oid": 19144,
    "identity_args": "p_venue_id uuid, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "get_venue_recent_catches",
    "specific_name": "get_venue_recent_catches_19144",
    "privilege_type": "EXECUTE",
    "oid": 19144,
    "identity_args": "p_venue_id uuid, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "get_venue_recent_catches",
    "specific_name": "get_venue_recent_catches_19144",
    "privilege_type": "EXECUTE",
    "oid": 19144,
    "identity_args": "p_venue_id uuid, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "get_venue_recent_catches",
    "specific_name": "get_venue_recent_catches_19144",
    "privilege_type": "EXECUTE",
    "oid": 19144,
    "identity_args": "p_venue_id uuid, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "get_venue_top_anglers",
    "specific_name": "get_venue_top_anglers_19149",
    "privilege_type": "EXECUTE",
    "oid": 19149,
    "identity_args": "p_venue_id uuid, p_limit integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "get_venue_top_anglers",
    "specific_name": "get_venue_top_anglers_19149",
    "privilege_type": "EXECUTE",
    "oid": 19149,
    "identity_args": "p_venue_id uuid, p_limit integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "get_venue_top_anglers",
    "specific_name": "get_venue_top_anglers_19149",
    "privilege_type": "EXECUTE",
    "oid": 19149,
    "identity_args": "p_venue_id uuid, p_limit integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "get_venue_top_anglers",
    "specific_name": "get_venue_top_anglers_19149",
    "privilege_type": "EXECUTE",
    "oid": 19149,
    "identity_args": "p_venue_id uuid, p_limit integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "get_venue_top_catches",
    "specific_name": "get_venue_top_catches_19145",
    "privilege_type": "EXECUTE",
    "oid": 19145,
    "identity_args": "p_venue_id uuid, p_limit integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "get_venue_top_catches",
    "specific_name": "get_venue_top_catches_19145",
    "privilege_type": "EXECUTE",
    "oid": 19145,
    "identity_args": "p_venue_id uuid, p_limit integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "get_venue_top_catches",
    "specific_name": "get_venue_top_catches_19145",
    "privilege_type": "EXECUTE",
    "oid": 19145,
    "identity_args": "p_venue_id uuid, p_limit integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "get_venue_top_catches",
    "specific_name": "get_venue_top_catches_19145",
    "privilege_type": "EXECUTE",
    "oid": 19145,
    "identity_args": "p_venue_id uuid, p_limit integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "get_venue_upcoming_events",
    "specific_name": "get_venue_upcoming_events_19309",
    "privilege_type": "EXECUTE",
    "oid": 19309,
    "identity_args": "p_venue_id uuid, p_now timestamp with time zone, p_limit integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "get_venue_upcoming_events",
    "specific_name": "get_venue_upcoming_events_19309",
    "privilege_type": "EXECUTE",
    "oid": 19309,
    "identity_args": "p_venue_id uuid, p_now timestamp with time zone, p_limit integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "get_venue_upcoming_events",
    "specific_name": "get_venue_upcoming_events_19309",
    "privilege_type": "EXECUTE",
    "oid": 19309,
    "identity_args": "p_venue_id uuid, p_now timestamp with time zone, p_limit integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "get_venue_upcoming_events",
    "specific_name": "get_venue_upcoming_events_19309",
    "privilege_type": "EXECUTE",
    "oid": 19309,
    "identity_args": "p_venue_id uuid, p_now timestamp with time zone, p_limit integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "get_venues",
    "specific_name": "get_venues_19647",
    "privilege_type": "EXECUTE",
    "oid": 19647,
    "identity_args": "p_search text, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "get_venues",
    "specific_name": "get_venues_19647",
    "privilege_type": "EXECUTE",
    "oid": 19647,
    "identity_args": "p_search text, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "get_venues",
    "specific_name": "get_venues_19647",
    "privilege_type": "EXECUTE",
    "oid": 19647,
    "identity_args": "p_search text, p_limit integer, p_offset integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "handle_catches_leaderboard_change",
    "specific_name": "handle_catches_leaderboard_change_19617",
    "privilege_type": "EXECUTE",
    "oid": 19617,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "handle_new_user",
    "specific_name": "handle_new_user_18669",
    "privilege_type": "EXECUTE",
    "oid": 18669,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "handle_new_user",
    "specific_name": "handle_new_user_18669",
    "privilege_type": "EXECUTE",
    "oid": 18669,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "handle_new_user",
    "specific_name": "handle_new_user_18669",
    "privilege_type": "EXECUTE",
    "oid": 18669,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "handle_new_user",
    "specific_name": "handle_new_user_18669",
    "privilege_type": "EXECUTE",
    "oid": 18669,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "handle_ratings_leaderboard_change",
    "specific_name": "handle_ratings_leaderboard_change_19616",
    "privilege_type": "EXECUTE",
    "oid": 19616,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "insights_format_label",
    "specific_name": "insights_format_label_19565",
    "privilege_type": "EXECUTE",
    "oid": 19565,
    "identity_args": "value text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "insights_format_label",
    "specific_name": "insights_format_label_19565",
    "privilege_type": "EXECUTE",
    "oid": 19565,
    "identity_args": "value text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "insights_format_label",
    "specific_name": "insights_format_label_19565",
    "privilege_type": "EXECUTE",
    "oid": 19565,
    "identity_args": "value text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "insights_format_label",
    "specific_name": "insights_format_label_19565",
    "privilege_type": "EXECUTE",
    "oid": 19565,
    "identity_args": "value text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "is_admin",
    "specific_name": "is_admin_19000",
    "privilege_type": "EXECUTE",
    "oid": 19000,
    "identity_args": "p_user_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "is_admin",
    "specific_name": "is_admin_19000",
    "privilege_type": "EXECUTE",
    "oid": 19000,
    "identity_args": "p_user_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "is_admin",
    "specific_name": "is_admin_19000",
    "privilege_type": "EXECUTE",
    "oid": 19000,
    "identity_args": "p_user_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "is_admin",
    "specific_name": "is_admin_19000",
    "privilege_type": "EXECUTE",
    "oid": 19000,
    "identity_args": "p_user_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "is_blocked_either_way",
    "specific_name": "is_blocked_either_way_19152",
    "privilege_type": "EXECUTE",
    "oid": 19152,
    "identity_args": "p_user_id uuid, p_other_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "is_blocked_either_way",
    "specific_name": "is_blocked_either_way_19152",
    "privilege_type": "EXECUTE",
    "oid": 19152,
    "identity_args": "p_user_id uuid, p_other_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "is_blocked_either_way",
    "specific_name": "is_blocked_either_way_19152",
    "privilege_type": "EXECUTE",
    "oid": 19152,
    "identity_args": "p_user_id uuid, p_other_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "is_blocked_either_way",
    "specific_name": "is_blocked_either_way_19152",
    "privilege_type": "EXECUTE",
    "oid": 19152,
    "identity_args": "p_user_id uuid, p_other_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "is_following",
    "specific_name": "is_following_18996",
    "privilege_type": "EXECUTE",
    "oid": 18996,
    "identity_args": "p_follower uuid, p_following uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "is_following",
    "specific_name": "is_following_18996",
    "privilege_type": "EXECUTE",
    "oid": 18996,
    "identity_args": "p_follower uuid, p_following uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "is_following",
    "specific_name": "is_following_18996",
    "privilege_type": "EXECUTE",
    "oid": 18996,
    "identity_args": "p_follower uuid, p_following uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "is_following",
    "specific_name": "is_following_18996",
    "privilege_type": "EXECUTE",
    "oid": 18996,
    "identity_args": "p_follower uuid, p_following uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "is_venue_admin_or_owner",
    "specific_name": "is_venue_admin_or_owner_19217",
    "privilege_type": "EXECUTE",
    "oid": 19217,
    "identity_args": "p_venue_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "is_venue_admin_or_owner",
    "specific_name": "is_venue_admin_or_owner_19217",
    "privilege_type": "EXECUTE",
    "oid": 19217,
    "identity_args": "p_venue_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "is_venue_admin_or_owner",
    "specific_name": "is_venue_admin_or_owner_19217",
    "privilege_type": "EXECUTE",
    "oid": 19217,
    "identity_args": "p_venue_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "is_venue_admin_or_owner",
    "specific_name": "is_venue_admin_or_owner_19217",
    "privilege_type": "EXECUTE",
    "oid": 19217,
    "identity_args": "p_venue_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "notify_admins_for_report",
    "specific_name": "notify_admins_for_report_19641",
    "privilege_type": "EXECUTE",
    "oid": 19641,
    "identity_args": "p_report_id uuid, p_message text, p_extra_data jsonb",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "notify_admins_for_report",
    "specific_name": "notify_admins_for_report_19641",
    "privilege_type": "EXECUTE",
    "oid": 19641,
    "identity_args": "p_report_id uuid, p_message text, p_extra_data jsonb",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "owner_add_venue_photo",
    "specific_name": "owner_add_venue_photo_19249",
    "privilege_type": "EXECUTE",
    "oid": 19249,
    "identity_args": "p_venue_id uuid, p_image_path text, p_caption text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "owner_add_venue_photo",
    "specific_name": "owner_add_venue_photo_19249",
    "privilege_type": "EXECUTE",
    "oid": 19249,
    "identity_args": "p_venue_id uuid, p_image_path text, p_caption text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "owner_add_venue_photo",
    "specific_name": "owner_add_venue_photo_19249",
    "privilege_type": "EXECUTE",
    "oid": 19249,
    "identity_args": "p_venue_id uuid, p_image_path text, p_caption text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "owner_add_venue_photo",
    "specific_name": "owner_add_venue_photo_19249",
    "privilege_type": "EXECUTE",
    "oid": 19249,
    "identity_args": "p_venue_id uuid, p_image_path text, p_caption text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "owner_create_venue_event",
    "specific_name": "owner_create_venue_event_19220",
    "privilege_type": "EXECUTE",
    "oid": 19220,
    "identity_args": "p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_contact_phone text, p_is_published boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "owner_create_venue_event",
    "specific_name": "owner_create_venue_event_19220",
    "privilege_type": "EXECUTE",
    "oid": 19220,
    "identity_args": "p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_contact_phone text, p_is_published boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "owner_create_venue_event",
    "specific_name": "owner_create_venue_event_19220",
    "privilege_type": "EXECUTE",
    "oid": 19220,
    "identity_args": "p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_contact_phone text, p_is_published boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "owner_create_venue_event",
    "specific_name": "owner_create_venue_event_19220",
    "privilege_type": "EXECUTE",
    "oid": 19220,
    "identity_args": "p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_contact_phone text, p_is_published boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "owner_create_venue_opening_hour",
    "specific_name": "owner_create_venue_opening_hour_19414",
    "privilege_type": "EXECUTE",
    "oid": 19414,
    "identity_args": "p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "owner_create_venue_opening_hour",
    "specific_name": "owner_create_venue_opening_hour_19414",
    "privilege_type": "EXECUTE",
    "oid": 19414,
    "identity_args": "p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "owner_create_venue_opening_hour",
    "specific_name": "owner_create_venue_opening_hour_19414",
    "privilege_type": "EXECUTE",
    "oid": 19414,
    "identity_args": "p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "owner_create_venue_opening_hour",
    "specific_name": "owner_create_venue_opening_hour_19414",
    "privilege_type": "EXECUTE",
    "oid": 19414,
    "identity_args": "p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "owner_create_venue_pricing_tier",
    "specific_name": "owner_create_venue_pricing_tier_19447",
    "privilege_type": "EXECUTE",
    "oid": 19447,
    "identity_args": "p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "owner_create_venue_pricing_tier",
    "specific_name": "owner_create_venue_pricing_tier_19447",
    "privilege_type": "EXECUTE",
    "oid": 19447,
    "identity_args": "p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "owner_create_venue_pricing_tier",
    "specific_name": "owner_create_venue_pricing_tier_19447",
    "privilege_type": "EXECUTE",
    "oid": 19447,
    "identity_args": "p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "owner_create_venue_pricing_tier",
    "specific_name": "owner_create_venue_pricing_tier_19447",
    "privilege_type": "EXECUTE",
    "oid": 19447,
    "identity_args": "p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "owner_create_venue_species_stock",
    "specific_name": "owner_create_venue_species_stock_19482",
    "privilege_type": "EXECUTE",
    "oid": 19482,
    "identity_args": "p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "owner_create_venue_species_stock",
    "specific_name": "owner_create_venue_species_stock_19482",
    "privilege_type": "EXECUTE",
    "oid": 19482,
    "identity_args": "p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "owner_create_venue_species_stock",
    "specific_name": "owner_create_venue_species_stock_19482",
    "privilege_type": "EXECUTE",
    "oid": 19482,
    "identity_args": "p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "owner_create_venue_species_stock",
    "specific_name": "owner_create_venue_species_stock_19482",
    "privilege_type": "EXECUTE",
    "oid": 19482,
    "identity_args": "p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "owner_delete_venue_event",
    "specific_name": "owner_delete_venue_event_19222",
    "privilege_type": "EXECUTE",
    "oid": 19222,
    "identity_args": "p_event_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "owner_delete_venue_event",
    "specific_name": "owner_delete_venue_event_19222",
    "privilege_type": "EXECUTE",
    "oid": 19222,
    "identity_args": "p_event_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "owner_delete_venue_event",
    "specific_name": "owner_delete_venue_event_19222",
    "privilege_type": "EXECUTE",
    "oid": 19222,
    "identity_args": "p_event_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "owner_delete_venue_event",
    "specific_name": "owner_delete_venue_event_19222",
    "privilege_type": "EXECUTE",
    "oid": 19222,
    "identity_args": "p_event_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "owner_delete_venue_opening_hour",
    "specific_name": "owner_delete_venue_opening_hour_19416",
    "privilege_type": "EXECUTE",
    "oid": 19416,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "owner_delete_venue_opening_hour",
    "specific_name": "owner_delete_venue_opening_hour_19416",
    "privilege_type": "EXECUTE",
    "oid": 19416,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "owner_delete_venue_opening_hour",
    "specific_name": "owner_delete_venue_opening_hour_19416",
    "privilege_type": "EXECUTE",
    "oid": 19416,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "owner_delete_venue_opening_hour",
    "specific_name": "owner_delete_venue_opening_hour_19416",
    "privilege_type": "EXECUTE",
    "oid": 19416,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "owner_delete_venue_photo",
    "specific_name": "owner_delete_venue_photo_19250",
    "privilege_type": "EXECUTE",
    "oid": 19250,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "owner_delete_venue_photo",
    "specific_name": "owner_delete_venue_photo_19250",
    "privilege_type": "EXECUTE",
    "oid": 19250,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "owner_delete_venue_photo",
    "specific_name": "owner_delete_venue_photo_19250",
    "privilege_type": "EXECUTE",
    "oid": 19250,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "owner_delete_venue_photo",
    "specific_name": "owner_delete_venue_photo_19250",
    "privilege_type": "EXECUTE",
    "oid": 19250,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "owner_delete_venue_pricing_tier",
    "specific_name": "owner_delete_venue_pricing_tier_19422",
    "privilege_type": "EXECUTE",
    "oid": 19422,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "owner_delete_venue_pricing_tier",
    "specific_name": "owner_delete_venue_pricing_tier_19422",
    "privilege_type": "EXECUTE",
    "oid": 19422,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "owner_delete_venue_pricing_tier",
    "specific_name": "owner_delete_venue_pricing_tier_19422",
    "privilege_type": "EXECUTE",
    "oid": 19422,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "owner_delete_venue_pricing_tier",
    "specific_name": "owner_delete_venue_pricing_tier_19422",
    "privilege_type": "EXECUTE",
    "oid": 19422,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "owner_delete_venue_species_stock",
    "specific_name": "owner_delete_venue_species_stock_19484",
    "privilege_type": "EXECUTE",
    "oid": 19484,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "owner_delete_venue_species_stock",
    "specific_name": "owner_delete_venue_species_stock_19484",
    "privilege_type": "EXECUTE",
    "oid": 19484,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "owner_delete_venue_species_stock",
    "specific_name": "owner_delete_venue_species_stock_19484",
    "privilege_type": "EXECUTE",
    "oid": 19484,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "owner_delete_venue_species_stock",
    "specific_name": "owner_delete_venue_species_stock_19484",
    "privilege_type": "EXECUTE",
    "oid": 19484,
    "identity_args": "p_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "owner_get_venue_by_slug",
    "specific_name": "owner_get_venue_by_slug_19635",
    "privilege_type": "EXECUTE",
    "oid": 19635,
    "identity_args": "p_slug text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "owner_get_venue_by_slug",
    "specific_name": "owner_get_venue_by_slug_19635",
    "privilege_type": "EXECUTE",
    "oid": 19635,
    "identity_args": "p_slug text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "owner_get_venue_events",
    "specific_name": "owner_get_venue_events_19219",
    "privilege_type": "EXECUTE",
    "oid": 19219,
    "identity_args": "p_venue_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "owner_get_venue_events",
    "specific_name": "owner_get_venue_events_19219",
    "privilege_type": "EXECUTE",
    "oid": 19219,
    "identity_args": "p_venue_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "owner_get_venue_events",
    "specific_name": "owner_get_venue_events_19219",
    "privilege_type": "EXECUTE",
    "oid": 19219,
    "identity_args": "p_venue_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "owner_get_venue_events",
    "specific_name": "owner_get_venue_events_19219",
    "privilege_type": "EXECUTE",
    "oid": 19219,
    "identity_args": "p_venue_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "owner_set_venue_photo_primary",
    "specific_name": "owner_set_venue_photo_primary_19492",
    "privilege_type": "EXECUTE",
    "oid": 19492,
    "identity_args": "p_photo_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "owner_set_venue_photo_primary",
    "specific_name": "owner_set_venue_photo_primary_19492",
    "privilege_type": "EXECUTE",
    "oid": 19492,
    "identity_args": "p_photo_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "owner_set_venue_photo_primary",
    "specific_name": "owner_set_venue_photo_primary_19492",
    "privilege_type": "EXECUTE",
    "oid": 19492,
    "identity_args": "p_photo_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "owner_set_venue_photo_primary",
    "specific_name": "owner_set_venue_photo_primary_19492",
    "privilege_type": "EXECUTE",
    "oid": 19492,
    "identity_args": "p_photo_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "owner_update_venue_booking",
    "specific_name": "owner_update_venue_booking_19412",
    "privilege_type": "EXECUTE",
    "oid": 19412,
    "identity_args": "p_venue_id uuid, p_booking_enabled boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "owner_update_venue_booking",
    "specific_name": "owner_update_venue_booking_19412",
    "privilege_type": "EXECUTE",
    "oid": 19412,
    "identity_args": "p_venue_id uuid, p_booking_enabled boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "owner_update_venue_booking",
    "specific_name": "owner_update_venue_booking_19412",
    "privilege_type": "EXECUTE",
    "oid": 19412,
    "identity_args": "p_venue_id uuid, p_booking_enabled boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "owner_update_venue_booking",
    "specific_name": "owner_update_venue_booking_19412",
    "privilege_type": "EXECUTE",
    "oid": 19412,
    "identity_args": "p_venue_id uuid, p_booking_enabled boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "owner_update_venue_event",
    "specific_name": "owner_update_venue_event_19221",
    "privilege_type": "EXECUTE",
    "oid": 19221,
    "identity_args": "p_event_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_contact_phone text, p_is_published boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "owner_update_venue_event",
    "specific_name": "owner_update_venue_event_19221",
    "privilege_type": "EXECUTE",
    "oid": 19221,
    "identity_args": "p_event_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_contact_phone text, p_is_published boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "owner_update_venue_event",
    "specific_name": "owner_update_venue_event_19221",
    "privilege_type": "EXECUTE",
    "oid": 19221,
    "identity_args": "p_event_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_contact_phone text, p_is_published boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "owner_update_venue_event",
    "specific_name": "owner_update_venue_event_19221",
    "privilege_type": "EXECUTE",
    "oid": 19221,
    "identity_args": "p_event_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_contact_phone text, p_is_published boolean",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "owner_update_venue_metadata",
    "specific_name": "owner_update_venue_metadata_19445",
    "privilege_type": "EXECUTE",
    "oid": 19445,
    "identity_args": "p_venue_id uuid, p_tagline text, p_description text, p_ticket_type text, p_best_for_tags text[], p_facilities text[], p_price_from text, p_website_url text, p_booking_url text, p_contact_phone text, p_payment_methods text[], p_payment_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "owner_update_venue_metadata",
    "specific_name": "owner_update_venue_metadata_19445",
    "privilege_type": "EXECUTE",
    "oid": 19445,
    "identity_args": "p_venue_id uuid, p_tagline text, p_description text, p_ticket_type text, p_best_for_tags text[], p_facilities text[], p_price_from text, p_website_url text, p_booking_url text, p_contact_phone text, p_payment_methods text[], p_payment_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "owner_update_venue_metadata",
    "specific_name": "owner_update_venue_metadata_19445",
    "privilege_type": "EXECUTE",
    "oid": 19445,
    "identity_args": "p_venue_id uuid, p_tagline text, p_description text, p_ticket_type text, p_best_for_tags text[], p_facilities text[], p_price_from text, p_website_url text, p_booking_url text, p_contact_phone text, p_payment_methods text[], p_payment_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "owner_update_venue_metadata",
    "specific_name": "owner_update_venue_metadata_19445",
    "privilege_type": "EXECUTE",
    "oid": 19445,
    "identity_args": "p_venue_id uuid, p_tagline text, p_description text, p_ticket_type text, p_best_for_tags text[], p_facilities text[], p_price_from text, p_website_url text, p_booking_url text, p_contact_phone text, p_payment_methods text[], p_payment_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "owner_update_venue_opening_hour",
    "specific_name": "owner_update_venue_opening_hour_19415",
    "privilege_type": "EXECUTE",
    "oid": 19415,
    "identity_args": "p_id uuid, p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "owner_update_venue_opening_hour",
    "specific_name": "owner_update_venue_opening_hour_19415",
    "privilege_type": "EXECUTE",
    "oid": 19415,
    "identity_args": "p_id uuid, p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "owner_update_venue_opening_hour",
    "specific_name": "owner_update_venue_opening_hour_19415",
    "privilege_type": "EXECUTE",
    "oid": 19415,
    "identity_args": "p_id uuid, p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "owner_update_venue_opening_hour",
    "specific_name": "owner_update_venue_opening_hour_19415",
    "privilege_type": "EXECUTE",
    "oid": 19415,
    "identity_args": "p_id uuid, p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "owner_update_venue_pricing_tier",
    "specific_name": "owner_update_venue_pricing_tier_19448",
    "privilege_type": "EXECUTE",
    "oid": 19448,
    "identity_args": "p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "owner_update_venue_pricing_tier",
    "specific_name": "owner_update_venue_pricing_tier_19448",
    "privilege_type": "EXECUTE",
    "oid": 19448,
    "identity_args": "p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "owner_update_venue_pricing_tier",
    "specific_name": "owner_update_venue_pricing_tier_19448",
    "privilege_type": "EXECUTE",
    "oid": 19448,
    "identity_args": "p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "owner_update_venue_pricing_tier",
    "specific_name": "owner_update_venue_pricing_tier_19448",
    "privilege_type": "EXECUTE",
    "oid": 19448,
    "identity_args": "p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "owner_update_venue_rules",
    "specific_name": "owner_update_venue_rules_19426",
    "privilege_type": "EXECUTE",
    "oid": 19426,
    "identity_args": "p_venue_id uuid, p_rules_text text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "owner_update_venue_rules",
    "specific_name": "owner_update_venue_rules_19426",
    "privilege_type": "EXECUTE",
    "oid": 19426,
    "identity_args": "p_venue_id uuid, p_rules_text text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "owner_update_venue_rules",
    "specific_name": "owner_update_venue_rules_19426",
    "privilege_type": "EXECUTE",
    "oid": 19426,
    "identity_args": "p_venue_id uuid, p_rules_text text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "owner_update_venue_rules",
    "specific_name": "owner_update_venue_rules_19426",
    "privilege_type": "EXECUTE",
    "oid": 19426,
    "identity_args": "p_venue_id uuid, p_rules_text text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "owner_update_venue_species_stock",
    "specific_name": "owner_update_venue_species_stock_19483",
    "privilege_type": "EXECUTE",
    "oid": 19483,
    "identity_args": "p_id uuid, p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "owner_update_venue_species_stock",
    "specific_name": "owner_update_venue_species_stock_19483",
    "privilege_type": "EXECUTE",
    "oid": 19483,
    "identity_args": "p_id uuid, p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "owner_update_venue_species_stock",
    "specific_name": "owner_update_venue_species_stock_19483",
    "privilege_type": "EXECUTE",
    "oid": 19483,
    "identity_args": "p_id uuid, p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "owner_update_venue_species_stock",
    "specific_name": "owner_update_venue_species_stock_19483",
    "privilege_type": "EXECUTE",
    "oid": 19483,
    "identity_args": "p_id uuid, p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "rate_catch_with_rate_limit",
    "specific_name": "rate_catch_with_rate_limit_18976",
    "privilege_type": "EXECUTE",
    "oid": 18976,
    "identity_args": "p_catch_id uuid, p_rating integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "rate_catch_with_rate_limit",
    "specific_name": "rate_catch_with_rate_limit_18976",
    "privilege_type": "EXECUTE",
    "oid": 18976,
    "identity_args": "p_catch_id uuid, p_rating integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "rate_catch_with_rate_limit",
    "specific_name": "rate_catch_with_rate_limit_18976",
    "privilege_type": "EXECUTE",
    "oid": 18976,
    "identity_args": "p_catch_id uuid, p_rating integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "rate_catch_with_rate_limit",
    "specific_name": "rate_catch_with_rate_limit_18976",
    "privilege_type": "EXECUTE",
    "oid": 18976,
    "identity_args": "p_catch_id uuid, p_rating integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "react_to_catch_with_rate_limit",
    "specific_name": "react_to_catch_with_rate_limit_18975",
    "privilege_type": "EXECUTE",
    "oid": 18975,
    "identity_args": "p_catch_id uuid, p_reaction text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "react_to_catch_with_rate_limit",
    "specific_name": "react_to_catch_with_rate_limit_18975",
    "privilege_type": "EXECUTE",
    "oid": 18975,
    "identity_args": "p_catch_id uuid, p_reaction text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "react_to_catch_with_rate_limit",
    "specific_name": "react_to_catch_with_rate_limit_18975",
    "privilege_type": "EXECUTE",
    "oid": 18975,
    "identity_args": "p_catch_id uuid, p_reaction text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "react_to_catch_with_rate_limit",
    "specific_name": "react_to_catch_with_rate_limit_18975",
    "privilege_type": "EXECUTE",
    "oid": 18975,
    "identity_args": "p_catch_id uuid, p_reaction text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "refresh_leaderboard_precompute",
    "specific_name": "refresh_leaderboard_precompute_19615",
    "privilege_type": "EXECUTE",
    "oid": 19615,
    "identity_args": "p_catch_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "request_account_deletion",
    "specific_name": "request_account_deletion_19083",
    "privilege_type": "EXECUTE",
    "oid": 19083,
    "identity_args": "p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "request_account_deletion",
    "specific_name": "request_account_deletion_19083",
    "privilege_type": "EXECUTE",
    "oid": 19083,
    "identity_args": "p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "request_account_deletion",
    "specific_name": "request_account_deletion_19083",
    "privilege_type": "EXECUTE",
    "oid": 19083,
    "identity_args": "p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "request_account_deletion",
    "specific_name": "request_account_deletion_19083",
    "privilege_type": "EXECUTE",
    "oid": 19083,
    "identity_args": "p_reason text",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "request_account_export",
    "specific_name": "request_account_export_19082",
    "privilege_type": "EXECUTE",
    "oid": 19082,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "request_account_export",
    "specific_name": "request_account_export_19082",
    "privilege_type": "EXECUTE",
    "oid": 19082,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "request_account_export",
    "specific_name": "request_account_export_19082",
    "privilege_type": "EXECUTE",
    "oid": 19082,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "request_account_export",
    "specific_name": "request_account_export_19082",
    "privilege_type": "EXECUTE",
    "oid": 19082,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "set_comment_admin_author",
    "specific_name": "set_comment_admin_author_19638",
    "privilege_type": "EXECUTE",
    "oid": 19638,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "set_comment_admin_author",
    "specific_name": "set_comment_admin_author_19638",
    "privilege_type": "EXECUTE",
    "oid": 19638,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "set_comment_admin_author",
    "specific_name": "set_comment_admin_author_19638",
    "privilege_type": "EXECUTE",
    "oid": 19638,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "set_comment_admin_author",
    "specific_name": "set_comment_admin_author_19638",
    "privilege_type": "EXECUTE",
    "oid": 19638,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "set_updated_at",
    "specific_name": "set_updated_at_18665",
    "privilege_type": "EXECUTE",
    "oid": 18665,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "set_updated_at",
    "specific_name": "set_updated_at_18665",
    "privilege_type": "EXECUTE",
    "oid": 18665,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "set_updated_at",
    "specific_name": "set_updated_at_18665",
    "privilege_type": "EXECUTE",
    "oid": 18665,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "set_updated_at",
    "specific_name": "set_updated_at_18665",
    "privilege_type": "EXECUTE",
    "oid": 18665,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "soft_delete_comment",
    "specific_name": "soft_delete_comment_19029",
    "privilege_type": "EXECUTE",
    "oid": 19029,
    "identity_args": "p_comment_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "soft_delete_comment",
    "specific_name": "soft_delete_comment_19029",
    "privilege_type": "EXECUTE",
    "oid": 19029,
    "identity_args": "p_comment_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "soft_delete_comment",
    "specific_name": "soft_delete_comment_19029",
    "privilege_type": "EXECUTE",
    "oid": 19029,
    "identity_args": "p_comment_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "soft_delete_comment",
    "specific_name": "soft_delete_comment_19029",
    "privilege_type": "EXECUTE",
    "oid": 19029,
    "identity_args": "p_comment_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "unblock_profile",
    "specific_name": "unblock_profile_19151",
    "privilege_type": "EXECUTE",
    "oid": 19151,
    "identity_args": "p_blocked_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "unblock_profile",
    "specific_name": "unblock_profile_19151",
    "privilege_type": "EXECUTE",
    "oid": 19151,
    "identity_args": "p_blocked_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "unblock_profile",
    "specific_name": "unblock_profile_19151",
    "privilege_type": "EXECUTE",
    "oid": 19151,
    "identity_args": "p_blocked_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "unblock_profile",
    "specific_name": "unblock_profile_19151",
    "privilege_type": "EXECUTE",
    "oid": 19151,
    "identity_args": "p_blocked_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "upsert_venue_rating",
    "specific_name": "upsert_venue_rating_19280",
    "privilege_type": "EXECUTE",
    "oid": 19280,
    "identity_args": "p_venue_id uuid, p_rating integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "upsert_venue_rating",
    "specific_name": "upsert_venue_rating_19280",
    "privilege_type": "EXECUTE",
    "oid": 19280,
    "identity_args": "p_venue_id uuid, p_rating integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "upsert_venue_rating",
    "specific_name": "upsert_venue_rating_19280",
    "privilege_type": "EXECUTE",
    "oid": 19280,
    "identity_args": "p_venue_id uuid, p_rating integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "upsert_venue_rating",
    "specific_name": "upsert_venue_rating_19280",
    "privilege_type": "EXECUTE",
    "oid": 19280,
    "identity_args": "p_venue_id uuid, p_rating integer",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "user_rate_limits",
    "specific_name": "user_rate_limits_19319",
    "privilege_type": "EXECUTE",
    "oid": 19318,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "user_rate_limits",
    "specific_name": "user_rate_limits_19319",
    "privilege_type": "EXECUTE",
    "oid": 19318,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "user_rate_limits",
    "specific_name": "user_rate_limits_19318",
    "privilege_type": "EXECUTE",
    "oid": 19318,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "user_rate_limits",
    "specific_name": "user_rate_limits_19318",
    "privilege_type": "EXECUTE",
    "oid": 19318,
    "identity_args": "",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "PUBLIC",
    "schema_name": "public",
    "routine_name": "user_rate_limits",
    "specific_name": "user_rate_limits_19319",
    "privilege_type": "EXECUTE",
    "oid": 19319,
    "identity_args": "p_user_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "anon",
    "schema_name": "public",
    "routine_name": "user_rate_limits",
    "specific_name": "user_rate_limits_19318",
    "privilege_type": "EXECUTE",
    "oid": 19319,
    "identity_args": "p_user_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "authenticated",
    "schema_name": "public",
    "routine_name": "user_rate_limits",
    "specific_name": "user_rate_limits_19319",
    "privilege_type": "EXECUTE",
    "oid": 19319,
    "identity_args": "p_user_id uuid",
    "prokind": "f"
  },
  {
    "grantor": "postgres",
    "grantee": "service_role",
    "schema_name": "public",
    "routine_name": "user_rate_limits",
    "specific_name": "user_rate_limits_19318",
    "privilege_type": "EXECUTE",
    "oid": 19319,
    "identity_args": "p_user_id uuid",
    "prokind": "f"
  }
]

### RPC-POSTURE-LIVE.sql output

[
  {
    "schema_name": "public",
    "proname": "admin_add_venue_owner",
    "oid": 19215,
    "identity_args": "p_venue_id uuid, p_user_id uuid, p_role text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_add_venue_photo",
    "oid": 19505,
    "identity_args": "p_venue_id uuid, p_image_path text, p_caption text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_clear_moderation_status",
    "oid": 19076,
    "identity_args": "p_user_id uuid, p_reason text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_create_venue_event",
    "oid": 19311,
    "identity_args": "p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_is_published boolean",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_create_venue_opening_hour",
    "oid": 19417,
    "identity_args": "p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_create_venue_pricing_tier",
    "oid": 19449,
    "identity_args": "p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_create_venue_species_stock",
    "oid": 19485,
    "identity_args": "p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_delete_account",
    "oid": 19084,
    "identity_args": "p_target uuid, p_reason text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_delete_catch",
    "oid": 18978,
    "identity_args": "p_catch_id uuid, p_reason text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_delete_comment",
    "oid": 18980,
    "identity_args": "p_comment_id uuid, p_reason text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_delete_venue_event",
    "oid": 19313,
    "identity_args": "p_event_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_delete_venue_opening_hour",
    "oid": 19419,
    "identity_args": "p_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_delete_venue_photo",
    "oid": 19506,
    "identity_args": "p_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_delete_venue_pricing_tier",
    "oid": 19425,
    "identity_args": "p_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_delete_venue_species_stock",
    "oid": 19487,
    "identity_args": "p_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_get_venue_by_slug",
    "oid": 19508,
    "identity_args": "p_slug text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_get_venue_events",
    "oid": 19314,
    "identity_args": "p_venue_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_get_venues",
    "oid": 19636,
    "identity_args": "p_search text, p_limit integer, p_offset integer",
    "prokind": "f",
    "prosecdef": false,
    "owner": "postgres",
    "proacl": "{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_list_moderation_log",
    "oid": 19190,
    "identity_args": "p_user_id uuid, p_action text, p_search text, p_from timestamp with time zone, p_to timestamp with time zone, p_sort_direction text, p_limit integer, p_offset integer",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_list_reports",
    "oid": 19188,
    "identity_args": "p_status text, p_type text, p_reported_user_id uuid, p_from timestamp with time zone, p_to timestamp with time zone, p_sort_direction text, p_limit integer, p_offset integer",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_remove_venue_owner",
    "oid": 19216,
    "identity_args": "p_venue_id uuid, p_user_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_restore_catch",
    "oid": 18979,
    "identity_args": "p_catch_id uuid, p_reason text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_restore_comment",
    "oid": 18981,
    "identity_args": "p_comment_id uuid, p_reason text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_set_venue_photo_primary",
    "oid": 19493,
    "identity_args": "p_photo_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_update_report_status",
    "oid": 19189,
    "identity_args": "p_report_id uuid, p_status text, p_resolution_notes text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_update_venue_booking",
    "oid": 19413,
    "identity_args": "p_venue_id uuid, p_booking_enabled boolean",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_update_venue_event",
    "oid": 19312,
    "identity_args": "p_event_id uuid, p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_is_published boolean",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_update_venue_metadata",
    "oid": 19446,
    "identity_args": "p_venue_id uuid, p_short_tagline text, p_description text, p_ticket_type text, p_price_from text, p_best_for_tags text[], p_facilities text[], p_website_url text, p_booking_url text, p_contact_phone text, p_notes_for_rr_team text, p_payment_methods text[], p_payment_notes text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_update_venue_metadata",
    "oid": 19167,
    "identity_args": "p_venue_id uuid, p_short_tagline text, p_ticket_type text, p_price_from text, p_best_for_tags text[], p_facilities text[], p_website_url text, p_booking_url text, p_contact_phone text, p_notes_for_rr_team text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_update_venue_opening_hour",
    "oid": 19418,
    "identity_args": "p_id uuid, p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_update_venue_pricing_tier",
    "oid": 19450,
    "identity_args": "p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_update_venue_rules",
    "oid": 19427,
    "identity_args": "p_venue_id uuid, p_rules_text text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_update_venue_species_stock",
    "oid": 19486,
    "identity_args": "p_id uuid, p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "admin_warn_user",
    "oid": 19075,
    "identity_args": "p_user_id uuid, p_reason text, p_severity warning_severity, p_duration_hours integer",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "assert_moderation_allowed",
    "oid": 19066,
    "identity_args": "p_user_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "block_profile",
    "oid": 19150,
    "identity_args": "p_blocked_id uuid, p_reason text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "check_email_exists",
    "oid": 18971,
    "identity_args": "email_to_check text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "check_rate_limit",
    "oid": 18863,
    "identity_args": "p_user_id uuid, p_action text, p_max_attempts integer, p_window_minutes integer",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "cleanup_rate_limits",
    "oid": 18866,
    "identity_args": "",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "community_stats_handle_catches_change",
    "oid": 19550,
    "identity_args": "",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "create_comment_with_rate_limit",
    "oid": 19028,
    "identity_args": "p_catch_id uuid, p_body text, p_parent_comment_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "create_notification",
    "oid": 19065,
    "identity_args": "p_user_id uuid, p_message text, p_type notification_type, p_actor_id uuid, p_catch_id uuid, p_comment_id uuid, p_extra_data jsonb",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "create_report_with_rate_limit",
    "oid": 18974,
    "identity_args": "p_target_type report_target_type, p_target_id uuid, p_reason text, p_details text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "enforce_catch_moderation",
    "oid": 19068,
    "identity_args": "",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "enforce_catch_rate_limit",
    "oid": 18867,
    "identity_args": "",
    "prokind": "f",
    "prosecdef": false,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "enforce_comment_rate_limit",
    "oid": 18868,
    "identity_args": "",
    "prokind": "f",
    "prosecdef": false,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "enforce_report_rate_limit",
    "oid": 18869,
    "identity_args": "",
    "prokind": "f",
    "prosecdef": false,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "follow_profile_with_rate_limit",
    "oid": 18977,
    "identity_args": "p_following_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "get_catch_rating_summary",
    "oid": 19330,
    "identity_args": "p_catch_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "get_community_stats",
    "oid": 19552,
    "identity_args": "",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "get_feed_catches",
    "oid": 19432,
    "identity_args": "p_limit integer, p_offset integer, p_scope text, p_sort text, p_species text, p_custom_species text, p_venue_id uuid, p_session_id uuid",
    "prokind": "f",
    "prosecdef": false,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "get_follower_count",
    "oid": 18999,
    "identity_args": "p_profile_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "get_insights_aggregates",
    "oid": 19566,
    "identity_args": "p_date_preset text, p_custom_start timestamp with time zone, p_custom_end timestamp with time zone, p_selected_session_id uuid, p_selected_venue text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "get_leaderboard_scores",
    "oid": 19628,
    "identity_args": "p_species_slug text, p_limit integer",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=\"\""
    ],
    "search_path_pinned": true,
    "search_path_value": "\"\"",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "get_my_venue_rating",
    "oid": 19281,
    "identity_args": "p_venue_id uuid",
    "prokind": "f",
    "prosecdef": false,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "get_rate_limit_status",
    "oid": 19317,
    "identity_args": "p_user_id uuid, p_action text, p_max_attempts integer, p_window_minutes integer",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "get_species_options",
    "oid": 19564,
    "identity_args": "p_only_active boolean, p_only_with_catches boolean",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "get_venue_by_slug",
    "oid": 19648,
    "identity_args": "p_slug text",
    "prokind": "f",
    "prosecdef": false,
    "owner": "postgres",
    "proacl": "{postgres=X/postgres,service_role=X/postgres,anon=X/postgres,authenticated=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "get_venue_past_events",
    "oid": 19310,
    "identity_args": "p_venue_id uuid, p_now timestamp with time zone, p_limit integer, p_offset integer",
    "prokind": "f",
    "prosecdef": false,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "get_venue_photos",
    "oid": 19251,
    "identity_args": "p_venue_id uuid, p_limit integer, p_offset integer",
    "prokind": "f",
    "prosecdef": false,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "get_venue_recent_catches",
    "oid": 19144,
    "identity_args": "p_venue_id uuid, p_limit integer, p_offset integer",
    "prokind": "f",
    "prosecdef": false,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "get_venue_top_anglers",
    "oid": 19149,
    "identity_args": "p_venue_id uuid, p_limit integer",
    "prokind": "f",
    "prosecdef": false,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "get_venue_top_catches",
    "oid": 19145,
    "identity_args": "p_venue_id uuid, p_limit integer",
    "prokind": "f",
    "prosecdef": false,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "get_venue_upcoming_events",
    "oid": 19309,
    "identity_args": "p_venue_id uuid, p_now timestamp with time zone, p_limit integer",
    "prokind": "f",
    "prosecdef": false,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "get_venues",
    "oid": 19647,
    "identity_args": "p_search text, p_limit integer, p_offset integer",
    "prokind": "f",
    "prosecdef": false,
    "owner": "postgres",
    "proacl": "{postgres=X/postgres,service_role=X/postgres,anon=X/postgres,authenticated=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "handle_catches_leaderboard_change",
    "oid": 19617,
    "identity_args": "",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{postgres=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "handle_new_user",
    "oid": 18669,
    "identity_args": "",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "handle_ratings_leaderboard_change",
    "oid": 19616,
    "identity_args": "",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{postgres=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "insights_format_label",
    "oid": 19565,
    "identity_args": "value text",
    "prokind": "f",
    "prosecdef": false,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": null,
    "search_path_pinned": false,
    "search_path_value": null,
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "is_admin",
    "oid": 19000,
    "identity_args": "p_user_id uuid",
    "prokind": "f",
    "prosecdef": false,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "is_blocked_either_way",
    "oid": 19152,
    "identity_args": "p_user_id uuid, p_other_id uuid",
    "prokind": "f",
    "prosecdef": false,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": null,
    "search_path_pinned": false,
    "search_path_value": null,
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "is_following",
    "oid": 18996,
    "identity_args": "p_follower uuid, p_following uuid",
    "prokind": "f",
    "prosecdef": false,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "is_venue_admin_or_owner",
    "oid": 19217,
    "identity_args": "p_venue_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "notify_admins_for_report",
    "oid": 19641,
    "identity_args": "p_report_id uuid, p_message text, p_extra_data jsonb",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "owner_add_venue_photo",
    "oid": 19249,
    "identity_args": "p_venue_id uuid, p_image_path text, p_caption text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "owner_create_venue_event",
    "oid": 19220,
    "identity_args": "p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_contact_phone text, p_is_published boolean",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "owner_create_venue_opening_hour",
    "oid": 19414,
    "identity_args": "p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "owner_create_venue_pricing_tier",
    "oid": 19447,
    "identity_args": "p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "owner_create_venue_species_stock",
    "oid": 19482,
    "identity_args": "p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "owner_delete_venue_event",
    "oid": 19222,
    "identity_args": "p_event_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "owner_delete_venue_opening_hour",
    "oid": 19416,
    "identity_args": "p_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "owner_delete_venue_photo",
    "oid": 19250,
    "identity_args": "p_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "owner_delete_venue_pricing_tier",
    "oid": 19422,
    "identity_args": "p_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "owner_delete_venue_species_stock",
    "oid": 19484,
    "identity_args": "p_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "owner_get_venue_by_slug",
    "oid": 19635,
    "identity_args": "p_slug text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}",
    "proconfig": [
      "search_path=\"\""
    ],
    "search_path_pinned": true,
    "search_path_value": "\"\"",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "owner_get_venue_events",
    "oid": 19219,
    "identity_args": "p_venue_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "owner_set_venue_photo_primary",
    "oid": 19492,
    "identity_args": "p_photo_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "owner_update_venue_booking",
    "oid": 19412,
    "identity_args": "p_venue_id uuid, p_booking_enabled boolean",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "owner_update_venue_event",
    "oid": 19221,
    "identity_args": "p_event_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_contact_phone text, p_is_published boolean",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "owner_update_venue_metadata",
    "oid": 19445,
    "identity_args": "p_venue_id uuid, p_tagline text, p_description text, p_ticket_type text, p_best_for_tags text[], p_facilities text[], p_price_from text, p_website_url text, p_booking_url text, p_contact_phone text, p_payment_methods text[], p_payment_notes text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "owner_update_venue_opening_hour",
    "oid": 19415,
    "identity_args": "p_id uuid, p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "owner_update_venue_pricing_tier",
    "oid": 19448,
    "identity_args": "p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "owner_update_venue_rules",
    "oid": 19426,
    "identity_args": "p_venue_id uuid, p_rules_text text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "owner_update_venue_species_stock",
    "oid": 19483,
    "identity_args": "p_id uuid, p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "rate_catch_with_rate_limit",
    "oid": 18976,
    "identity_args": "p_catch_id uuid, p_rating integer",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "react_to_catch_with_rate_limit",
    "oid": 18975,
    "identity_args": "p_catch_id uuid, p_reaction text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "refresh_leaderboard_precompute",
    "oid": 19615,
    "identity_args": "p_catch_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{postgres=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "request_account_deletion",
    "oid": 19083,
    "identity_args": "p_reason text",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "request_account_export",
    "oid": 19082,
    "identity_args": "",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "set_comment_admin_author",
    "oid": 19638,
    "identity_args": "",
    "prokind": "f",
    "prosecdef": false,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "set_updated_at",
    "oid": 18665,
    "identity_args": "",
    "prokind": "f",
    "prosecdef": false,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": null,
    "search_path_pinned": false,
    "search_path_value": null,
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "soft_delete_comment",
    "oid": 19029,
    "identity_args": "p_comment_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "unblock_profile",
    "oid": 19151,
    "identity_args": "p_blocked_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "upsert_venue_rating",
    "oid": 19280,
    "identity_args": "p_venue_id uuid, p_rating integer",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "user_rate_limits",
    "oid": 19318,
    "identity_args": "",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  },
  {
    "schema_name": "public",
    "proname": "user_rate_limits",
    "oid": 19319,
    "identity_args": "p_user_id uuid",
    "prokind": "f",
    "prosecdef": true,
    "owner": "postgres",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}",
    "proconfig": [
      "search_path=public, extensions"
    ],
    "search_path_pinned": true,
    "search_path_value": "public, extensions",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "rolbypassrls": true
  }
]

## Interpretation (live snapshot)
- Live RPC registry deduped by (schema, routine_name, identity_args, grantee, privilege_type).
- admin_* functions with EXECUTE granted to PUBLIC/anon/authenticated: 33.

| Function | Grantees (PUBLIC/anon/authenticated) |
| --- | --- |
| admin_add_venue_owner | PUBLIC, anon, authenticated |
| admin_add_venue_photo | PUBLIC, anon, authenticated |
| admin_clear_moderation_status | PUBLIC, anon, authenticated |
| admin_create_venue_event | PUBLIC, anon, authenticated |
| admin_create_venue_opening_hour | PUBLIC, anon, authenticated |
| admin_create_venue_pricing_tier | PUBLIC, anon, authenticated |
| admin_create_venue_species_stock | PUBLIC, anon, authenticated |
| admin_delete_account | PUBLIC, anon, authenticated |
| admin_delete_catch | PUBLIC, anon, authenticated |
| admin_delete_comment | PUBLIC, anon, authenticated |
| admin_delete_venue_event | PUBLIC, anon, authenticated |
| admin_delete_venue_opening_hour | PUBLIC, anon, authenticated |
| admin_delete_venue_photo | PUBLIC, anon, authenticated |
| admin_delete_venue_pricing_tier | PUBLIC, anon, authenticated |
| admin_delete_venue_species_stock | PUBLIC, anon, authenticated |
| admin_get_venue_by_slug | authenticated |
| admin_get_venue_events | PUBLIC, anon, authenticated |
| admin_get_venues | authenticated |
| admin_list_moderation_log | PUBLIC, anon, authenticated |
| admin_list_reports | PUBLIC, anon, authenticated |
| admin_remove_venue_owner | PUBLIC, anon, authenticated |
| admin_restore_catch | PUBLIC, anon, authenticated |
| admin_restore_comment | PUBLIC, anon, authenticated |
| admin_set_venue_photo_primary | PUBLIC, anon, authenticated |
| admin_update_report_status | PUBLIC, anon, authenticated |
| admin_update_venue_booking | PUBLIC, anon, authenticated |
| admin_update_venue_event | PUBLIC, anon, authenticated |
| admin_update_venue_metadata | PUBLIC, anon, authenticated |
| admin_update_venue_opening_hour | PUBLIC, anon, authenticated |
| admin_update_venue_pricing_tier | PUBLIC, anon, authenticated |
| admin_update_venue_rules | PUBLIC, anon, authenticated |
| admin_update_venue_species_stock | PUBLIC, anon, authenticated |
| admin_warn_user | PUBLIC, anon, authenticated |




## EXECUTE tightening strategy
- Public read-only RPCs (e.g., `get_*` used by public surfaces): allow EXECUTE to `anon`/`authenticated` only; keep SECURITY INVOKER and rely on RLS.
- Authenticated user-action RPCs (rate/comment/follow/report): EXECUTE only to `authenticated`.
- Admin/owner RPCs: prefer EXECUTE only to `authenticated` (or `service_role`) + enforce admin/owner checks inside the function; remove EXECUTE from `PUBLIC`/`anon`.
- Internal/trigger-only functions: REVOKE EXECUTE from `PUBLIC`/`anon`/`authenticated` and keep callable only by owner or `service_role` if needed.
- Definer hygiene checklist: pinned `search_path`, schema-qualified references, no dynamic SQL with untrusted inputs, and minimum grants on referenced tables.

## Risk flags (review checklist)
- [ ] EXECUTE granted to `PUBLIC` or `anon` on sensitive functions
- [ ] SECURITY DEFINER functions without pinned search_path
- [ ] SECURITY DEFINER functions owned by roles with `rolbypassrls` or `rolsuper` (review)

## Open questions / UNKNOWN items
- Live EXECUTE grants and posture are based on the last pasted snapshot; rerun SQL probes to confirm current state.
- Additional schemas or functions may exist outside migrations (extensions, manual changes); confirm with live probes.

Prep-only. No sweeps run. Live verification pending.
