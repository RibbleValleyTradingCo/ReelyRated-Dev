# RPC Dependency Map (v6)

## Purpose
- Capture **direct dependencies** (catalog-level) and **heuristic dependencies** (policy/view/trigger references) for client-callable RPCs.
- Provide a confidence signal for dependency completeness (HIGH/MED/LOW).

PostgREST RPC exposes functions; stored procedures are not supported.

## Evidence used (2026-01-16)
- `docs/version6/hardening/_global/evidence/2026-01-16/42_RPC_CALLABILITY.csv`
- `docs/version6/hardening/_global/evidence/2026-01-16/43_RPC_DYNAMIC_SQL_FLAGS.csv`
- `docs/version6/hardening/_global/evidence/2026-01-16/44_RPC_CATALOG_DEPENDENCIES.csv`
- `docs/version6/hardening/_global/evidence/2026-01-16/45_RPC_DEPENDENCIES.csv`

## Counts summary (2026-01-16)
- total_functions: 98
- callable_by_anon: 13
- callable_by_authenticated: 97
- security_definer: 81
- unpinned_definer: 0
- overload_ambiguous: 4

## Evidence inputs (Tier A)
- Direct catalog deps: `docs/version6/hardening/_global/sql/44_RPC_CATALOG_DEPENDENCIES.sql`
- Policy/view/trigger refs (heuristic): `docs/version6/hardening/_global/sql/45_RPC_DEPENDENCIES.sql`
- Dynamic SQL flags: `docs/version6/hardening/_global/sql/43_RPC_DYNAMIC_SQL_FLAGS.sql`
- RPC registry & callability: `docs/version6/hardening/_global/sql/42_RPC_CALLABILITY.sql`

## Dependency map (Tier A)
Populate from `44_RPC_CATALOG_DEPENDENCIES.csv` and `45_RPC_DEPENDENCIES.csv`.

| schema_name | function_name | identity_args | dependency_type | dependency_schema | dependency_name | dependency_relkind |
| --- | --- | --- | --- | --- | --- | --- |
| public | admin_add_venue_photo | p_venue_id uuid, p_image_path text, p_caption text | type | public | venue_photos |  |
| public | admin_create_venue_opening_hour | p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer | type | public | venue_opening_hours |  |
| public | admin_create_venue_pricing_tier | p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer | type | public | venue_pricing_audience |  |
| public | admin_create_venue_pricing_tier | p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer | type | public | venue_pricing_tiers |  |
| public | admin_create_venue_species_stock | p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text | type | public | venue_species_stock |  |
| public | admin_create_venue_species_stock | p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text | type | public | venue_stock_density |  |
| public | admin_get_venue_by_slug | p_slug text | type | public | weight_unit |  |
| public | admin_get_venues | p_search text, p_limit integer, p_offset integer | type | public | weight_unit |  |
| public | admin_update_venue_opening_hour | p_id uuid, p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer | type | public | venue_opening_hours |  |
| public | admin_update_venue_pricing_tier | p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer | type | public | venue_pricing_audience |  |
| public | admin_update_venue_pricing_tier | p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer | type | public | venue_pricing_tiers |  |
| public | admin_update_venue_rules | p_venue_id uuid, p_rules_text text | type | public | venue_rules |  |
| public | admin_update_venue_species_stock | p_id uuid, p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text | type | public | venue_species_stock |  |
| public | admin_update_venue_species_stock | p_id uuid, p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text | type | public | venue_stock_density |  |
| public | admin_warn_user | p_user_id uuid, p_reason text, p_severity warning_severity, p_duration_hours integer | type | public | warning_severity |  |
| public | admin_warn_user | p_user_id uuid, p_reason text, p_severity warning_severity, p_duration_hours integer | type | public | warning_severity |  |
| public | create_notification | p_user_id uuid, p_message text, p_type notification_type, p_actor_id uuid, p_catch_id uuid, p_comment_id uuid, p_extra_data jsonb | type | public | notification_type |  |
| public | create_report_with_rate_limit | p_target_type report_target_type, p_target_id uuid, p_reason text, p_details text | type | public | report_target_type |  |
| public | create_report_with_rate_limit | p_target_type report_target_type, p_target_id uuid, p_reason text, p_details text | type | public | reports |  |
| public | get_feed_catches | p_limit integer, p_offset integer, p_scope text, p_sort text, p_species text, p_custom_species text, p_venue_id uuid, p_session_id uuid | type | public | visibility_type |  |
| public | get_feed_catches | p_limit integer, p_offset integer, p_scope text, p_sort text, p_species text, p_custom_species text, p_venue_id uuid, p_session_id uuid | type | public | weight_unit |  |
| public | get_leaderboard_scores | p_species_slug text, p_limit integer | type | public | length_unit |  |
| public | get_leaderboard_scores | p_species_slug text, p_limit integer | type | public | weight_unit |  |
| public | get_venue_by_slug | p_slug text | type | public | weight_unit |  |
| public | get_venue_photos | p_venue_id uuid, p_limit integer, p_offset integer | type | public | venue_photos |  |
| public | get_venue_recent_catches | p_venue_id uuid, p_limit integer, p_offset integer | type | public | visibility_type |  |
| public | get_venue_recent_catches | p_venue_id uuid, p_limit integer, p_offset integer | type | public | weight_unit |  |
| public | get_venue_top_anglers | p_venue_id uuid, p_limit integer | type | public | weight_unit |  |
| public | get_venue_top_catches | p_venue_id uuid, p_limit integer | type | public | visibility_type |  |
| public | get_venue_top_catches | p_venue_id uuid, p_limit integer | type | public | weight_unit |  |
| public | get_venues | p_search text, p_limit integer, p_offset integer | type | public | weight_unit |  |
| public | owner_add_venue_photo | p_venue_id uuid, p_image_path text, p_caption text | type | public | venue_photos |  |
| public | owner_create_venue_event | p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_contact_phone text, p_is_published boolean | type | public | venue_events |  |
| public | owner_create_venue_opening_hour | p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer | type | public | venue_opening_hours |  |
| public | owner_create_venue_pricing_tier | p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer | type | public | venue_pricing_audience |  |
| public | owner_create_venue_pricing_tier | p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer | type | public | venue_pricing_tiers |  |
| public | owner_create_venue_species_stock | p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text | type | public | venue_species_stock |  |
| public | owner_create_venue_species_stock | p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text | type | public | venue_stock_density |  |
| public | owner_get_venue_by_slug | p_slug text | type | public | weight_unit |  |
| public | owner_get_venue_events | p_venue_id uuid | type | public | venue_events |  |
| public | owner_update_venue_booking | p_venue_id uuid, p_booking_enabled boolean | type | public | venues |  |
| public | owner_update_venue_event | p_event_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_contact_phone text, p_is_published boolean | type | public | venue_events |  |
| public | owner_update_venue_metadata | p_venue_id uuid, p_tagline text, p_description text, p_ticket_type text, p_best_for_tags text[], p_facilities text[], p_price_from text, p_website_url text, p_booking_url text, p_contact_phone text, p_payment_methods text[], p_payment_notes text | type | public | venues |  |
| public | owner_update_venue_opening_hour | p_id uuid, p_venue_id uuid, p_label text, p_day_of_week smallint, p_opens_at time without time zone, p_closes_at time without time zone, p_is_closed boolean, p_order_index integer | type | public | venue_opening_hours |  |
| public | owner_update_venue_pricing_tier | p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer | type | public | venue_pricing_audience |  |
| public | owner_update_venue_pricing_tier | p_id uuid, p_venue_id uuid, p_label text, p_price text, p_unit text, p_audience venue_pricing_audience, p_order_index integer | type | public | venue_pricing_tiers |  |
| public | owner_update_venue_rules | p_venue_id uuid, p_rules_text text | type | public | venue_rules |  |
| public | owner_update_venue_species_stock | p_id uuid, p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text | type | public | venue_species_stock |  |
| public | owner_update_venue_species_stock | p_id uuid, p_venue_id uuid, p_species_name text, p_record_weight numeric, p_record_unit text, p_avg_weight numeric, p_size_range_min numeric, p_size_range_max numeric, p_stock_density venue_stock_density, p_stock_notes text | type | public | venue_stock_density |  |

## Dependency confidence (Tier B)
Suggested heuristic (deterministic + explainable):
- **LOW**: dynamic_sql_flag = true (from `43_RPC_DYNAMIC_SQL_FLAGS.csv`), or dependencies are empty while function is callable.
- **HIGH**: dynamic_sql_flag = false and at least one direct catalog dependency exists.
- **MEDIUM**: otherwise.

| regprocedure | dynamic_sql_flag | direct_dependency_count | heuristic_dependency_flags | dependency_confidence | notes |
| --- | --- | --- | --- | --- | --- |
| graphql_public.graphql(text,text,jsonb,jsonb) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_add_venue_owner(uuid,uuid,text) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_add_venue_photo(uuid,text,text) | false | 1 | policies=false,views=false,triggers=false | HIGH |  |
| admin_clear_moderation_status(uuid,text) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_create_venue_event(uuid,text,text,timestamp with time zone,timestamp with time zone,text,text,text,text,boolean) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_create_venue_opening_hour(uuid,text,smallint,time without time zone,time without time zone,boolean,integer) | false | 1 | policies=false,views=false,triggers=false | HIGH |  |
| admin_create_venue_pricing_tier(uuid,text,text,text,venue_pricing_audience,integer) | false | 2 | policies=false,views=false,triggers=false | HIGH |  |
| admin_create_venue_species_stock(uuid,text,numeric,text,numeric,numeric,numeric,venue_stock_density,text) | false | 2 | policies=false,views=false,triggers=false | HIGH |  |
| admin_delete_account(uuid,text) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_delete_catch(uuid,text) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_delete_comment(uuid,text) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_delete_venue_event(uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_delete_venue_opening_hour(uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_delete_venue_photo(uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_delete_venue_pricing_tier(uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_delete_venue_species_stock(uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_get_venue_by_slug(text) | false | 1 | policies=false,views=false,triggers=false | HIGH |  |
| admin_get_venue_events(uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_get_venues(text,integer,integer) | false | 1 | policies=false,views=false,triggers=false | HIGH |  |
| admin_list_moderation_log(uuid,text,text,timestamp with time zone,timestamp with time zone,text,integer,integer) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_list_reports(text,text,uuid,timestamp with time zone,timestamp with time zone,text,integer,integer) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_remove_venue_owner(uuid,uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_restore_catch(uuid,text) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_restore_comment(uuid,text) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_set_venue_photo_primary(uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_update_report_status(uuid,text,text) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_update_venue_booking(uuid,boolean) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_update_venue_event(uuid,uuid,text,text,timestamp with time zone,timestamp with time zone,text,text,text,text,boolean) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_update_venue_metadata(uuid,text,text,text,text,text[],text[],text,text,text,text,text[],text) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_update_venue_metadata(uuid,text,text,text,text[],text[],text,text,text,text) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| admin_update_venue_opening_hour(uuid,uuid,text,smallint,time without time zone,time without time zone,boolean,integer) | false | 1 | policies=false,views=false,triggers=false | HIGH |  |
| admin_update_venue_pricing_tier(uuid,uuid,text,text,text,venue_pricing_audience,integer) | false | 2 | policies=false,views=false,triggers=false | HIGH |  |
| admin_update_venue_rules(uuid,text) | false | 1 | policies=false,views=false,triggers=false | HIGH |  |
| admin_update_venue_species_stock(uuid,uuid,text,numeric,text,numeric,numeric,numeric,venue_stock_density,text) | false | 2 | policies=false,views=false,triggers=false | HIGH |  |
| admin_warn_user(uuid,text,warning_severity,integer) | false | 1 | policies=false,views=false,triggers=false | HIGH |  |
| assert_moderation_allowed(uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| block_profile(uuid,text) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| check_email_exists(text) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| check_rate_limit(uuid,text,integer,integer) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| cleanup_rate_limits() | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| create_comment_with_rate_limit(uuid,text,uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| create_notification(uuid,text,notification_type,uuid,uuid,uuid,jsonb) | false | 1 | policies=false,views=false,triggers=false | HIGH |  |
| create_report_with_rate_limit(report_target_type,uuid,text,text) | false | 2 | policies=false,views=false,triggers=false | HIGH |  |
| follow_profile_with_rate_limit(uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| get_catch_rating_summary(uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| get_community_stats() | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| get_feed_catches(integer,integer,text,text,text,text,uuid,uuid) | false | 2 | policies=false,views=false,triggers=false | HIGH |  |
| get_follower_count(uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| get_insights_aggregates(text,timestamp with time zone,timestamp with time zone,uuid,text) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| get_leaderboard_scores(text,integer) | false | 2 | policies=false,views=false,triggers=false | HIGH |  |
| get_my_venue_rating(uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| get_profile_for_profile_page(text) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| get_rate_limit_status(uuid,text,integer,integer) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| get_species_options(boolean,boolean) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| get_venue_by_slug(text) | false | 1 | policies=false,views=false,triggers=false | HIGH |  |
| get_venue_past_events(uuid,timestamp with time zone,integer,integer) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| get_venue_photos(uuid,integer,integer) | false | 1 | policies=false,views=false,triggers=false | HIGH |  |
| get_venue_recent_catches(uuid,integer,integer) | false | 2 | policies=false,views=false,triggers=false | HIGH |  |
| get_venue_top_anglers(uuid,integer) | false | 1 | policies=false,views=false,triggers=false | HIGH |  |
| get_venue_top_catches(uuid,integer) | false | 2 | policies=false,views=false,triggers=false | HIGH |  |
| get_venue_upcoming_events(uuid,timestamp with time zone,integer) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| get_venues(text,integer,integer) | false | 1 | policies=false,views=false,triggers=false | HIGH |  |
| insights_format_label(text) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| is_admin(uuid) | false | 0 | policies=true,views=true,triggers=false | MEDIUM |  |
| is_blocked_either_way(uuid,uuid) | false | 0 | policies=true,views=true,triggers=false | MEDIUM |  |
| is_following(uuid,uuid) | false | 0 | policies=true,views=false,triggers=false | MEDIUM |  |
| is_venue_admin_or_owner(uuid) | false | 0 | policies=true,views=false,triggers=false | MEDIUM |  |
| notify_admins_for_report(uuid,text,jsonb) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| owner_add_venue_photo(uuid,text,text) | false | 1 | policies=false,views=false,triggers=false | HIGH |  |
| owner_create_venue_event(uuid,text,text,timestamp with time zone,timestamp with time zone,text,text,text,text,text,boolean) | false | 1 | policies=false,views=false,triggers=false | HIGH |  |
| owner_create_venue_opening_hour(uuid,text,smallint,time without time zone,time without time zone,boolean,integer) | false | 1 | policies=false,views=false,triggers=false | HIGH |  |
| owner_create_venue_pricing_tier(uuid,text,text,text,venue_pricing_audience,integer) | false | 2 | policies=false,views=false,triggers=false | HIGH |  |
| owner_create_venue_species_stock(uuid,text,numeric,text,numeric,numeric,numeric,venue_stock_density,text) | false | 2 | policies=false,views=false,triggers=false | HIGH |  |
| owner_delete_venue_event(uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| owner_delete_venue_opening_hour(uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| owner_delete_venue_photo(uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| owner_delete_venue_pricing_tier(uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| owner_delete_venue_species_stock(uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| owner_get_venue_by_slug(text) | false | 1 | policies=false,views=false,triggers=false | HIGH |  |
| owner_get_venue_events(uuid) | false | 1 | policies=false,views=false,triggers=false | HIGH |  |
| owner_set_venue_photo_primary(uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| owner_update_venue_booking(uuid,boolean) | false | 1 | policies=false,views=false,triggers=false | HIGH |  |
| owner_update_venue_event(uuid,text,text,timestamp with time zone,timestamp with time zone,text,text,text,text,text,boolean) | false | 1 | policies=false,views=false,triggers=false | HIGH |  |
| owner_update_venue_metadata(uuid,text,text,text,text[],text[],text,text,text,text,text[],text) | false | 1 | policies=false,views=false,triggers=false | HIGH |  |
| owner_update_venue_opening_hour(uuid,uuid,text,smallint,time without time zone,time without time zone,boolean,integer) | false | 1 | policies=false,views=false,triggers=false | HIGH |  |
| owner_update_venue_pricing_tier(uuid,uuid,text,text,text,venue_pricing_audience,integer) | false | 2 | policies=false,views=false,triggers=false | HIGH |  |
| owner_update_venue_rules(uuid,text) | false | 1 | policies=false,views=false,triggers=false | HIGH |  |
| owner_update_venue_species_stock(uuid,uuid,text,numeric,text,numeric,numeric,numeric,venue_stock_density,text) | false | 2 | policies=false,views=false,triggers=false | HIGH |  |
| rate_catch_with_rate_limit(uuid,integer) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| react_to_catch_with_rate_limit(uuid,text) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| refresh_leaderboard_precompute(uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| request_account_deletion(text) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| request_account_export() | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| soft_delete_comment(uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| unblock_profile(uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| upsert_venue_rating(uuid,integer) | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| user_rate_limits() | false | 0 | policies=false,views=false,triggers=false | LOW |  |
| user_rate_limits(uuid) | false | 0 | policies=false,views=false,triggers=false | LOW |  |

## Known limitations
- `pg_depend` does not capture objects accessed via dynamic SQL (EXECUTE/format).
- Heuristic policy/view/trigger references are substring-based and can produce false positives/negatives.
