-- 2169_global_revoke_public_anon_rpc_execute.sql
-- Source: docs/version5/hardening/_global/RPC-SAFE-REVOKE-SET.md (evidence 2026-01-14)
-- Purpose: revoke PUBLIC/anon EXECUTE for SAFE_TO_REVOKE_PUBLIC RPCs only.

BEGIN;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_add_venue_owner(p_venue_id uuid, p_user_id uuid, p_role text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_add_venue_owner(p_venue_id uuid, p_user_id uuid, p_role text) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_add_venue_photo(p_venue_id uuid, p_image_path text, p_caption text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_add_venue_photo(p_venue_id uuid, p_image_path text, p_caption text) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_clear_moderation_status(p_user_id uuid, p_reason text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_clear_moderation_status(p_user_id uuid, p_reason text) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_create_venue_event(p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_is_published boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_create_venue_event(p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_is_published boolean) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_create_venue_opening_hour(p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_create_venue_opening_hour(p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_create_venue_pricing_tier(p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_create_venue_pricing_tier(p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_create_venue_species_stock(p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_create_venue_species_stock(p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_delete_account(p_target uuid, p_reason text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_account(p_target uuid, p_reason text) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_delete_catch(p_catch_id uuid, p_reason text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_catch(p_catch_id uuid, p_reason text) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_delete_comment(p_comment_id uuid, p_reason text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_comment(p_comment_id uuid, p_reason text) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_delete_venue_event(p_event_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_venue_event(p_event_id uuid) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_delete_venue_opening_hour(p_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_venue_opening_hour(p_id uuid) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_delete_venue_photo(p_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_venue_photo(p_id uuid) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_delete_venue_pricing_tier(p_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_venue_pricing_tier(p_id uuid) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_delete_venue_species_stock(p_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_venue_species_stock(p_id uuid) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_get_venue_by_slug(p_slug text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_get_venue_by_slug(p_slug text) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_get_venue_events(p_venue_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_get_venue_events(p_venue_id uuid) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_get_venues(p_search text, p_limit integer, p_offset integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_get_venues(p_search text, p_limit integer, p_offset integer) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_list_moderation_log(p_user_id uuid, p_action text, p_search text, p_from timestamp with time zone, p_to timestamp with time zone, p_sort_direction text, p_limit integer, p_offset integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_list_moderation_log(p_user_id uuid, p_action text, p_search text, p_from timestamp with time zone, p_to timestamp with time zone, p_sort_direction text, p_limit integer, p_offset integer) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_list_reports(p_status text, p_type text, p_reported_user_id uuid, p_from timestamp with time zone, p_to timestamp with time zone, p_sort_direction text, p_limit integer, p_offset integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_list_reports(p_status text, p_type text, p_reported_user_id uuid, p_from timestamp with time zone, p_to timestamp with time zone, p_sort_direction text, p_limit integer, p_offset integer) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_remove_venue_owner(p_venue_id uuid, p_user_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_remove_venue_owner(p_venue_id uuid, p_user_id uuid) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_restore_catch(p_catch_id uuid, p_reason text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_restore_catch(p_catch_id uuid, p_reason text) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_restore_comment(p_comment_id uuid, p_reason text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_restore_comment(p_comment_id uuid, p_reason text) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_set_venue_photo_primary(p_photo_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_set_venue_photo_primary(p_photo_id uuid) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_update_report_status(p_report_id uuid, p_status text, p_resolution_notes text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_report_status(p_report_id uuid, p_status text, p_resolution_notes text) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_update_venue_booking(p_venue_id uuid, p_booking_enabled boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_venue_booking(p_venue_id uuid, p_booking_enabled boolean) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_update_venue_event(p_event_id uuid, p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_is_published boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_venue_event(p_event_id uuid, p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_is_published boolean) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_update_venue_metadata(p_venue_id uuid, p_short_tagline text, p_description text, p_ticket_type text, p_price_from text, p_best_for_tags text[], p_facilities text[], p_website_url text, p_booking_url text, p_contact_phone text, p_notes_for_rr_team text, p_payment_methods text[], p_payment_notes text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_venue_metadata(p_venue_id uuid, p_short_tagline text, p_description text, p_ticket_type text, p_price_from text, p_best_for_tags text[], p_facilities text[], p_website_url text, p_booking_url text, p_contact_phone text, p_notes_for_rr_team text, p_payment_methods text[], p_payment_notes text) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_update_venue_metadata(p_venue_id uuid, p_short_tagline text, p_ticket_type text, p_price_from text, p_best_for_tags text[], p_facilities text[], p_website_url text, p_booking_url text, p_contact_phone text, p_notes_for_rr_team text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_venue_metadata(p_venue_id uuid, p_short_tagline text, p_ticket_type text, p_price_from text, p_best_for_tags text[], p_facilities text[], p_website_url text, p_booking_url text, p_contact_phone text, p_notes_for_rr_team text) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_update_venue_opening_hour(p_id uuid, p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_venue_opening_hour(p_id uuid, p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_update_venue_pricing_tier(p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_venue_pricing_tier(p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_update_venue_rules(p_venue_id uuid, p_rules_text text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_venue_rules(p_venue_id uuid, p_rules_text text) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_update_venue_species_stock(p_id uuid, p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_venue_species_stock(p_id uuid, p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text) FROM anon;

-- admin_
REVOKE EXECUTE ON FUNCTION public.admin_warn_user(p_user_id uuid, p_reason text, p_severity warning_severity, p_duration_hours integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_warn_user(p_user_id uuid, p_reason text, p_severity warning_severity, p_duration_hours integer) FROM anon;

-- internal
REVOKE EXECUTE ON FUNCTION public.community_stats_handle_catches_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.community_stats_handle_catches_change() FROM anon;

-- internal
REVOKE EXECUTE ON FUNCTION public.enforce_catch_moderation() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_catch_moderation() FROM anon;

-- internal
REVOKE EXECUTE ON FUNCTION public.enforce_catch_rate_limit() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_catch_rate_limit() FROM anon;

-- internal
REVOKE EXECUTE ON FUNCTION public.enforce_comment_rate_limit() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_comment_rate_limit() FROM anon;

-- internal
REVOKE EXECUTE ON FUNCTION public.enforce_report_rate_limit() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_report_rate_limit() FROM anon;

-- internal
REVOKE EXECUTE ON FUNCTION public.handle_catches_leaderboard_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_catches_leaderboard_change() FROM anon;

-- internal
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;

-- internal
REVOKE EXECUTE ON FUNCTION public.handle_ratings_leaderboard_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_ratings_leaderboard_change() FROM anon;

-- internal
REVOKE EXECUTE ON FUNCTION public.is_admin(p_user_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin(p_user_id uuid) FROM anon;

-- internal
REVOKE EXECUTE ON FUNCTION public.is_blocked_either_way(p_user_id uuid, p_other_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_blocked_either_way(p_user_id uuid, p_other_id uuid) FROM anon;

-- internal
REVOKE EXECUTE ON FUNCTION public.is_following(p_follower uuid, p_following uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_following(p_follower uuid, p_following uuid) FROM anon;

-- internal
REVOKE EXECUTE ON FUNCTION public.is_venue_admin_or_owner(p_venue_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_venue_admin_or_owner(p_venue_id uuid) FROM anon;

-- internal
REVOKE EXECUTE ON FUNCTION public.set_comment_admin_author() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_comment_admin_author() FROM anon;

-- internal
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon;

-- owner_
REVOKE EXECUTE ON FUNCTION public.owner_add_venue_photo(p_venue_id uuid, p_image_path text, p_caption text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owner_add_venue_photo(p_venue_id uuid, p_image_path text, p_caption text) FROM anon;

-- owner_
REVOKE EXECUTE ON FUNCTION public.owner_create_venue_opening_hour(p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owner_create_venue_opening_hour(p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer) FROM anon;

-- owner_
REVOKE EXECUTE ON FUNCTION public.owner_create_venue_pricing_tier(p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owner_create_venue_pricing_tier(p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer) FROM anon;

-- owner_
REVOKE EXECUTE ON FUNCTION public.owner_create_venue_species_stock(p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owner_create_venue_species_stock(p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text) FROM anon;

-- owner_
REVOKE EXECUTE ON FUNCTION public.owner_delete_venue_opening_hour(p_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owner_delete_venue_opening_hour(p_id uuid) FROM anon;

-- owner_
REVOKE EXECUTE ON FUNCTION public.owner_delete_venue_photo(p_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owner_delete_venue_photo(p_id uuid) FROM anon;

-- owner_
REVOKE EXECUTE ON FUNCTION public.owner_delete_venue_pricing_tier(p_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owner_delete_venue_pricing_tier(p_id uuid) FROM anon;

-- owner_
REVOKE EXECUTE ON FUNCTION public.owner_delete_venue_species_stock(p_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owner_delete_venue_species_stock(p_id uuid) FROM anon;

-- owner_
REVOKE EXECUTE ON FUNCTION public.owner_set_venue_photo_primary(p_photo_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owner_set_venue_photo_primary(p_photo_id uuid) FROM anon;

-- owner_
REVOKE EXECUTE ON FUNCTION public.owner_update_venue_booking(p_venue_id uuid, p_booking_enabled boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owner_update_venue_booking(p_venue_id uuid, p_booking_enabled boolean) FROM anon;

-- owner_
REVOKE EXECUTE ON FUNCTION public.owner_update_venue_opening_hour(p_id uuid, p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owner_update_venue_opening_hour(p_id uuid, p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer) FROM anon;

-- owner_
REVOKE EXECUTE ON FUNCTION public.owner_update_venue_pricing_tier(p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owner_update_venue_pricing_tier(p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer) FROM anon;

-- owner_
REVOKE EXECUTE ON FUNCTION public.owner_update_venue_rules(p_venue_id uuid, p_rules_text text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owner_update_venue_rules(p_venue_id uuid, p_rules_text text) FROM anon;

-- owner_
REVOKE EXECUTE ON FUNCTION public.owner_update_venue_species_stock(p_id uuid, p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owner_update_venue_species_stock(p_id uuid, p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text) FROM anon;

COMMIT;
