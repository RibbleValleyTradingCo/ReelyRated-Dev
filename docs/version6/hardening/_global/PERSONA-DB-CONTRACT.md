# Persona DB Contract (v6)

## Purpose
- Define persona access expectations for RPCs based on **explicit EXECUTE grants** and **schema exposure**.
- Keep this matrix as the authoritative reference for RPC allowlists (PUBLIC/anon/authenticated/service_role).

PostgREST RPC exposes functions; stored procedures are not supported.

## Personas
- **PUBLIC**: implicit grant group (all roles). Avoid EXECUTE unless explicitly required.
- **anon**: unauthenticated user role.
- **authenticated**: logged-in user role.
- **service_role**: server-side/admin automation only.

## Evidence used (2026-01-16)
- `docs/version6/hardening/_global/evidence/2026-01-16/41_EXPOSED_SCHEMAS.csv`
- `docs/version6/hardening/_global/evidence/2026-01-16/42_RPC_CALLABILITY.csv`
- `docs/version6/hardening/_global/evidence/2026-01-16/2026-01-16_rpc_usage_map.csv`

## Counts summary (2026-01-16)
- total_functions: 98
- callable_by_anon: 13
- callable_by_authenticated: 97
- security_definer: 81
- unpinned_definer: 0
- overload_ambiguous: 4

## Evidence inputs (Tier A)
- Callability + grants: `docs/version6/hardening/_global/sql/42_RPC_CALLABILITY.sql`
- Callsite usage: `docs/version6/hardening/_global/RPC-USAGE-MAP.md`
- Exposed schemas + schema USAGE: `docs/version6/hardening/_global/sql/41_EXPOSED_SCHEMAS.sql`

## Contract matrix (populate from evidence)
| regprocedure | exec_public | exec_anon | exec_authenticated | exec_service_role | callable_by_anon | callable_by_authenticated | used_in_app | callsite_join_confidence | callsite_join_notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| graphql_public.graphql(text,text,jsonb,jsonb) | t | t | t | unknown | t | t | no | HIGH | GraphQL RPC gateway |
| admin_add_venue_owner(uuid,uuid,text) | f | f | t | unknown | f | t | yes | HIGH |  |
| admin_add_venue_photo(uuid,text,text) | f | f | t | unknown | f | t | no | HIGH |  |
| admin_clear_moderation_status(uuid,text) | f | f | t | unknown | f | t | no | HIGH |  |
| admin_create_venue_event(uuid,text,text,timestamp with time zone,timestamp with time zone,text,text,text,text,boolean) | f | f | t | unknown | f | t | yes | HIGH |  |
| admin_create_venue_opening_hour(uuid,text,smallint,time without time zone,time without time zone,boolean,integer) | f | f | t | unknown | f | t | no | HIGH |  |
| admin_create_venue_pricing_tier(uuid,text,text,text,venue_pricing_audience,integer) | f | f | t | unknown | f | t | no | HIGH |  |
| admin_create_venue_species_stock(uuid,text,numeric,text,numeric,numeric,numeric,venue_stock_density,text) | f | f | t | unknown | f | t | no | HIGH |  |
| admin_delete_account(uuid,text) | f | f | t | unknown | f | t | no | HIGH |  |
| admin_delete_catch(uuid,text) | f | f | t | unknown | f | t | yes | HIGH |  |
| admin_delete_comment(uuid,text) | f | f | t | unknown | f | t | yes | HIGH |  |
| admin_delete_venue_event(uuid) | f | f | t | unknown | f | t | yes | HIGH |  |
| admin_delete_venue_opening_hour(uuid) | f | f | t | unknown | f | t | no | HIGH |  |
| admin_delete_venue_photo(uuid) | f | f | t | unknown | f | t | no | HIGH |  |
| admin_delete_venue_pricing_tier(uuid) | f | f | t | unknown | f | t | no | HIGH |  |
| admin_delete_venue_species_stock(uuid) | f | f | t | unknown | f | t | no | HIGH |  |
| admin_get_venue_by_slug(text) | f | f | t | unknown | f | t | yes | HIGH |  |
| admin_get_venue_events(uuid) | f | f | t | unknown | f | t | yes | HIGH |  |
| admin_get_venues(text,integer,integer) | f | f | t | unknown | f | t | yes | HIGH |  |
| admin_list_moderation_log(uuid,text,text,timestamp with time zone,timestamp with time zone,text,integer,integer) | f | f | t | unknown | f | t | yes | HIGH |  |
| admin_list_reports(text,text,uuid,timestamp with time zone,timestamp with time zone,text,integer,integer) | f | f | t | unknown | f | t | no | HIGH |  |
| admin_remove_venue_owner(uuid,uuid) | f | f | t | unknown | f | t | yes | HIGH |  |
| admin_restore_catch(uuid,text) | f | f | t | unknown | f | t | yes | HIGH |  |
| admin_restore_comment(uuid,text) | f | f | t | unknown | f | t | yes | HIGH |  |
| admin_set_venue_photo_primary(uuid) | f | f | t | unknown | f | t | no | HIGH |  |
| admin_update_report_status(uuid,text,text) | f | f | t | unknown | f | t | no | HIGH |  |
| admin_update_venue_booking(uuid,boolean) | f | f | t | unknown | f | t | no | HIGH |  |
| admin_update_venue_event(uuid,uuid,text,text,timestamp with time zone,timestamp with time zone,text,text,text,text,boolean) | f | f | t | unknown | f | t | yes | HIGH |  |
| admin_update_venue_metadata(uuid,text,text,text,text,text[],text[],text,text,text,text,text[],text) | f | f | t | unknown | f | t | yes | LOW | overload_ambiguous |
| admin_update_venue_metadata(uuid,text,text,text,text[],text[],text,text,text,text) | f | f | t | unknown | f | t | yes | LOW | overload_ambiguous |
| admin_update_venue_opening_hour(uuid,uuid,text,smallint,time without time zone,time without time zone,boolean,integer) | f | f | t | unknown | f | t | no | HIGH |  |
| admin_update_venue_pricing_tier(uuid,uuid,text,text,text,venue_pricing_audience,integer) | f | f | t | unknown | f | t | no | HIGH |  |
| admin_update_venue_rules(uuid,text) | f | f | t | unknown | f | t | no | HIGH |  |
| admin_update_venue_species_stock(uuid,uuid,text,numeric,text,numeric,numeric,numeric,venue_stock_density,text) | f | f | t | unknown | f | t | no | HIGH |  |
| admin_warn_user(uuid,text,warning_severity,integer) | f | f | t | unknown | f | t | yes | HIGH |  |
| assert_moderation_allowed(uuid) | f | f | t | unknown | f | t | no | HIGH |  |
| block_profile(uuid,text) | f | f | t | unknown | f | t | yes | HIGH |  |
| check_email_exists(text) | f | f | t | unknown | f | t | yes | HIGH |  |
| check_rate_limit(uuid,text,integer,integer) | f | f | t | unknown | f | t | yes | HIGH |  |
| cleanup_rate_limits() | f | f | t | unknown | f | t | yes | HIGH |  |
| create_comment_with_rate_limit(uuid,text,uuid) | f | f | t | unknown | f | t | yes | HIGH |  |
| create_notification(uuid,text,notification_type,uuid,uuid,uuid,jsonb) | f | f | t | unknown | f | t | yes | HIGH |  |
| create_report_with_rate_limit(report_target_type,uuid,text,text) | f | f | t | unknown | f | t | yes | HIGH |  |
| follow_profile_with_rate_limit(uuid) | f | f | t | unknown | f | t | yes | HIGH |  |
| get_catch_rating_summary(uuid) | f | f | t | unknown | f | t | no | HIGH |  |
| get_community_stats() | f | t | t | unknown | t | t | yes | HIGH |  |
| get_feed_catches(integer,integer,text,text,text,text,uuid,uuid) | t | t | t | unknown | t | t | yes | HIGH |  |
| get_follower_count(uuid) | f | f | t | unknown | f | t | yes | HIGH |  |
| get_insights_aggregates(text,timestamp with time zone,timestamp with time zone,uuid,text) | f | f | t | unknown | f | t | yes | HIGH |  |
| get_leaderboard_scores(text,integer) | f | t | t | unknown | t | t | yes | HIGH |  |
| get_my_venue_rating(uuid) | f | f | t | unknown | f | t | yes | HIGH |  |
| get_profile_for_profile_page(text) | f | f | t | unknown | f | t | no | HIGH |  |
| get_rate_limit_status(uuid,text,integer,integer) | f | f | t | unknown | f | t | yes | HIGH |  |
| get_species_options(boolean,boolean) | f | t | t | unknown | t | t | yes | HIGH |  |
| get_venue_by_slug(text) | f | t | t | unknown | t | t | yes | HIGH |  |
| get_venue_past_events(uuid,timestamp with time zone,integer,integer) | t | t | t | unknown | t | t | yes | HIGH |  |
| get_venue_photos(uuid,integer,integer) | f | t | t | unknown | t | t | yes | HIGH |  |
| get_venue_recent_catches(uuid,integer,integer) | t | t | t | unknown | t | t | yes | HIGH |  |
| get_venue_top_anglers(uuid,integer) | t | t | t | unknown | t | t | no | HIGH |  |
| get_venue_top_catches(uuid,integer) | t | t | t | unknown | t | t | yes | HIGH |  |
| get_venue_upcoming_events(uuid,timestamp with time zone,integer) | t | t | t | unknown | t | t | yes | HIGH |  |
| get_venues(text,integer,integer) | f | t | t | unknown | t | t | yes | HIGH |  |
| insights_format_label(text) | f | f | t | unknown | f | t | no | HIGH |  |
| is_admin(uuid) | f | f | t | unknown | f | t | no | HIGH |  |
| is_blocked_either_way(uuid,uuid) | f | f | t | unknown | f | t | no | HIGH |  |
| is_following(uuid,uuid) | f | f | t | unknown | f | t | no | HIGH |  |
| is_venue_admin_or_owner(uuid) | f | f | t | unknown | f | t | no | HIGH |  |
| notify_admins_for_report(uuid,text,jsonb) | f | f | t | unknown | f | t | yes | HIGH |  |
| owner_add_venue_photo(uuid,text,text) | f | f | t | unknown | f | t | no | HIGH |  |
| owner_create_venue_event(uuid,text,text,timestamp with time zone,timestamp with time zone,text,text,text,text,text,boolean) | f | f | t | unknown | f | t | yes | HIGH |  |
| owner_create_venue_opening_hour(uuid,text,smallint,time without time zone,time without time zone,boolean,integer) | f | f | t | unknown | f | t | no | HIGH |  |
| owner_create_venue_pricing_tier(uuid,text,text,text,venue_pricing_audience,integer) | f | f | t | unknown | f | t | no | HIGH |  |
| owner_create_venue_species_stock(uuid,text,numeric,text,numeric,numeric,numeric,venue_stock_density,text) | f | f | t | unknown | f | t | no | HIGH |  |
| owner_delete_venue_event(uuid) | f | f | t | unknown | f | t | yes | HIGH |  |
| owner_delete_venue_opening_hour(uuid) | f | f | t | unknown | f | t | no | HIGH |  |
| owner_delete_venue_photo(uuid) | f | f | t | unknown | f | t | no | HIGH |  |
| owner_delete_venue_pricing_tier(uuid) | f | f | t | unknown | f | t | no | HIGH |  |
| owner_delete_venue_species_stock(uuid) | f | f | t | unknown | f | t | no | HIGH |  |
| owner_get_venue_by_slug(text) | f | f | t | unknown | f | t | yes | HIGH |  |
| owner_get_venue_events(uuid) | f | f | t | unknown | f | t | yes | HIGH |  |
| owner_set_venue_photo_primary(uuid) | f | f | t | unknown | f | t | no | HIGH |  |
| owner_update_venue_booking(uuid,boolean) | f | f | t | unknown | f | t | no | HIGH |  |
| owner_update_venue_event(uuid,text,text,timestamp with time zone,timestamp with time zone,text,text,text,text,text,boolean) | f | f | t | unknown | f | t | yes | HIGH |  |
| owner_update_venue_metadata(uuid,text,text,text,text[],text[],text,text,text,text,text[],text) | f | f | t | unknown | f | t | yes | HIGH |  |
| owner_update_venue_opening_hour(uuid,uuid,text,smallint,time without time zone,time without time zone,boolean,integer) | f | f | t | unknown | f | t | no | HIGH |  |
| owner_update_venue_pricing_tier(uuid,uuid,text,text,text,venue_pricing_audience,integer) | f | f | t | unknown | f | t | no | HIGH |  |
| owner_update_venue_rules(uuid,text) | f | f | t | unknown | f | t | no | HIGH |  |
| owner_update_venue_species_stock(uuid,uuid,text,numeric,text,numeric,numeric,numeric,venue_stock_density,text) | f | f | t | unknown | f | t | no | HIGH |  |
| rate_catch_with_rate_limit(uuid,integer) | f | f | t | unknown | f | t | yes | HIGH |  |
| react_to_catch_with_rate_limit(uuid,text) | f | f | t | unknown | f | t | yes | HIGH |  |
| refresh_leaderboard_precompute(uuid) | f | f | f | unknown | f | f | no | HIGH |  |
| request_account_deletion(text) | f | f | t | unknown | f | t | yes | HIGH |  |
| request_account_export() | f | f | t | unknown | f | t | yes | HIGH |  |
| soft_delete_comment(uuid) | f | f | t | unknown | f | t | yes | HIGH |  |
| unblock_profile(uuid) | f | f | t | unknown | f | t | yes | HIGH |  |
| upsert_venue_rating(uuid,integer) | f | f | t | unknown | f | t | yes | HIGH |  |
| user_rate_limits() | f | f | t | unknown | f | t | yes | LOW | overload_ambiguous |
| user_rate_limits(uuid) | f | f | t | unknown | f | t | yes | LOW | overload_ambiguous |

## Interpretation rules
- If `exec_public` is true, **any** role can EXECUTE (unless schema USAGE is missing).
- `callable_by_anon/authenticated` requires **schema exposure + USAGE + EXECUTE**.
- Service-role access is expected for admin automation; it must never be relied upon by client code.

## Needs-review flags (Tier B)
- SECURITY DEFINER + unpinned search_path = high risk.
- Definer functions touching RLS-protected tables = boundary; require justification.
- Callable but unused RPCs (callsite_count = 0) require explicit allowlist justification.
