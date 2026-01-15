-- 20260114010744_global_revoke_public_anon_rpc_execute_followup.sql
-- Source: 55_RPC_SCOPING_WORKSHEET.md (2026-01-14) minus allowlisted public-read + SAFE_TO_REVOKE_PUBLIC set
-- Purpose: revoke PUBLIC/anon EXECUTE for remaining non-allowlisted functions

BEGIN;

REVOKE EXECUTE ON FUNCTION public.assert_moderation_allowed(p_user_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.assert_moderation_allowed(p_user_id uuid) FROM anon;

REVOKE EXECUTE ON FUNCTION public.check_email_exists(email_to_check text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_email_exists(email_to_check text) FROM anon;

REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM anon;

REVOKE EXECUTE ON FUNCTION public.create_report_with_rate_limit(p_target_type report_target_type, p_target_id uuid, p_reason text, p_details text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_report_with_rate_limit(p_target_type report_target_type, p_target_id uuid, p_reason text, p_details text) FROM anon;

REVOKE EXECUTE ON FUNCTION public.get_insights_aggregates(p_date_preset text, p_custom_start timestamp with time zone, p_custom_end timestamp with time zone, p_selected_session_id uuid, p_selected_venue text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_insights_aggregates(p_date_preset text, p_custom_start timestamp with time zone, p_custom_end timestamp with time zone, p_selected_session_id uuid, p_selected_venue text) FROM anon;

REVOKE EXECUTE ON FUNCTION public.get_my_venue_rating(p_venue_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_venue_rating(p_venue_id uuid) FROM anon;

REVOKE EXECUTE ON FUNCTION public.get_rate_limit_status(p_user_id uuid, p_action text, p_max_attempts integer, p_window_minutes integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_rate_limit_status(p_user_id uuid, p_action text, p_max_attempts integer, p_window_minutes integer) FROM anon;

REVOKE EXECUTE ON FUNCTION public.insights_format_label(value text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.insights_format_label(value text) FROM anon;

REVOKE EXECUTE ON FUNCTION public.upsert_venue_rating(p_venue_id uuid, p_rating integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.upsert_venue_rating(p_venue_id uuid, p_rating integer) FROM anon;

REVOKE EXECUTE ON FUNCTION public.user_rate_limits() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_rate_limits() FROM anon;

REVOKE EXECUTE ON FUNCTION public.user_rate_limits(p_user_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_rate_limits(p_user_id uuid) FROM anon;

COMMIT;
