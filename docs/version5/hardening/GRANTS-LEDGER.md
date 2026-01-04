# Grants Ledger

- Purpose

## LIVE DB verification (2026-01-03)

**Operator steps**

- Run the SQL blocks below in Supabase Studio -> SQL Editor.
- Paste the outputs under each block exactly (or paste summarized object lists if outputs are huge).
- Then update `docs/version5/hardening/PERSONA-STATE-AUDIT.md` LIVE VERIFIED stamp.

### LIVE: RLS flags for public tables/views

```sql
select n.nspname, c.relname, c.relkind, c.relrowsecurity, c.relforcerowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'v')
order by c.relkind, c.relname;
```

- Output (paste here): TODO

### LIVE: Policies for public schema

```sql
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

- Output (paste here): TODO

#### LIVE: admin_users (focused)

Output (pg_policies → admin_users):

```json
[
  {
    "schemaname": "public",
    "tablename": "admin_users",
    "policyname": "admin_users_self_select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(uid() = user_id)",
    "with_check": null
  }
]
```

admin_users_select_all (LIVE):

```
Success. No rows returned
```

Notes:

- This confirms only the self-select policy exists on `admin_users` in live DB.
- The former broad policy `admin_users_select_all` is not present.

### LIVE: Table/view grants for anon/authenticated

```sql
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;
```

- Output (paste here): TODO

### LIVE: Function EXECUTE grants for anon/authenticated

```sql
select grantee, routine_name, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and grantee in ('anon', 'authenticated')
order by routine_name, grantee;
```

- Output (paste here): TODO

### LIVE: Function ACL snapshot (definitive — detects PUBLIC/default EXECUTE)

- Observed output below is post-2156 and was captured before applying 2157.
- 2157 has now been applied (auth-only feed/profile reads + check_email_exists lockdown). See the focused post-2157 verification block below.
- Venue/leaderboard read RPCs are intentionally unchanged in 2157 (public routes remain public).

```sql
select
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as identity_args,
  p.prokind,
  p.prosecdef as is_security_definer,
  p.proacl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname, identity_args;
```

- Output (paste here):

```json
[
  {
    "schema": "public",
    "function_name": "admin_add_venue_owner",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_add_venue_photo",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_clear_moderation_status",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_create_venue_event",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_create_venue_opening_hour",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_create_venue_pricing_tier",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_create_venue_species_stock",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_delete_account",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_delete_catch",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_delete_comment",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_delete_venue_event",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_delete_venue_opening_hour",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_delete_venue_photo",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_delete_venue_pricing_tier",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_delete_venue_species_stock",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_get_venue_by_slug",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_get_venue_events",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_get_venues",
    "prokind": "f",
    "is_security_definer": false,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_list_moderation_log",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_list_reports",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_remove_venue_owner",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_restore_catch",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_restore_comment",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_set_venue_photo_primary",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_update_report_status",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_update_venue_booking",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_update_venue_event",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_update_venue_metadata",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_update_venue_metadata",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_update_venue_opening_hour",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_update_venue_pricing_tier",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_update_venue_rules",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_update_venue_species_stock",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "admin_warn_user",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "assert_moderation_allowed",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "block_profile",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "check_email_exists",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "check_rate_limit",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "cleanup_rate_limits",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "community_stats_handle_catches_change",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "create_comment_with_rate_limit",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "create_notification",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "create_report_with_rate_limit",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "enforce_catch_moderation",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "enforce_catch_rate_limit",
    "prokind": "f",
    "is_security_definer": false,
    "proacl": "{postgres=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "enforce_comment_rate_limit",
    "prokind": "f",
    "is_security_definer": false,
    "proacl": "{postgres=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "enforce_report_rate_limit",
    "prokind": "f",
    "is_security_definer": false,
    "proacl": "{postgres=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "follow_profile_with_rate_limit",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "get_catch_rating_summary",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "get_community_stats",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "get_feed_catches",
    "prokind": "f",
    "is_security_definer": false,
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "get_follower_count",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "get_insights_aggregates",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "get_leaderboard_scores",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "get_my_venue_rating",
    "prokind": "f",
    "is_security_definer": false,
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "get_rate_limit_status",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "get_species_options",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "get_venue_by_slug",
    "prokind": "f",
    "is_security_definer": false,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,anon=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "get_venues",
    "prokind": "f",
    "is_security_definer": false,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,anon=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "handle_catches_leaderboard_change",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "handle_new_user",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "handle_ratings_leaderboard_change",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "insights_format_label",
    "prokind": "f",
    "is_security_definer": false,
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "is_admin",
    "prokind": "f",
    "is_security_definer": false,
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "is_blocked_either_way",
    "prokind": "f",
    "is_security_definer": false,
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "is_following",
    "prokind": "f",
    "is_security_definer": false,
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "is_venue_admin_or_owner",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "notify_admins_for_report",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "owner_add_venue_photo",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "owner_create_venue_event",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "owner_create_venue_opening_hour",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "owner_create_venue_pricing_tier",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "owner_create_venue_species_stock",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "owner_delete_venue_event",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "owner_delete_venue_opening_hour",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "owner_delete_venue_photo",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "owner_delete_venue_pricing_tier",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "owner_delete_venue_species_stock",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "owner_get_venue_by_slug",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "owner_get_venue_events",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "owner_set_venue_photo_primary",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "owner_update_venue_booking",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "owner_update_venue_event",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "owner_update_venue_metadata",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "owner_update_venue_opening_hour",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "owner_update_venue_pricing_tier",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "owner_update_venue_rules",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "owner_update_venue_species_stock",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "rate_catch_with_rate_limit",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "react_to_catch_with_rate_limit",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "refresh_leaderboard_precompute",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "request_account_deletion",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "request_account_export",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "set_comment_admin_author",
    "prokind": "f",
    "is_security_definer": false,
    "proacl": "{postgres=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "set_updated_at",
    "prokind": "f",
    "is_security_definer": false,
    "proacl": "{postgres=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "soft_delete_comment",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "unblock_profile",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "upsert_venue_rating",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "user_rate_limits",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "user_rate_limits",
    "prokind": "f",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres}"
  }
]
```

#### LIVE: 2157 verification (focused ACL rows)

This block confirms the intended post-2157 posture:

- `check_email_exists`: service_role only (no PUBLIC/anon/authenticated EXECUTE)
- `get_feed_catches`, `get_follower_count`: authenticated + service_role only (no PUBLIC/anon EXECUTE)

SQL:

```sql
select
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as identity_args,
  p.proacl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('check_email_exists', 'get_feed_catches', 'get_follower_count')
order by p.proname, identity_args;
```

Observed output (post-2157):

```json
[
  {
    "schema": "public",
    "function_name": "check_email_exists",
    "identity_args": "email_to_check text",
    "proacl": "{postgres=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "get_feed_catches",
    "identity_args": "p_limit integer, p_offset integer, p_scope text, p_sort text, p_species text, p_custom_species text, p_venue_id uuid, p_session_id uuid",
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "get_follower_count",
    "identity_args": "p_profile_id uuid",
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  }
]
```

HAR evidence note (UI-level):

- Password reset on `/auth` uses `POST /auth/v1/recover` and shows **no** `/rpc/check_email_exists` calls (see `check-email-exists-call.har`).

Interpretation notes:

- PUBLIC grants may appear with an empty grantee in ACL entries (e.g. `=X/...`), meaning anyone can EXECUTE.
- If `proacl` is NULL, default privileges may still apply; treat as suspicious and confirm default privilege posture.
- P0 gate: no PUBLIC/anon EXECUTE on admin*\*, owner*\*, or mutation RPCs unless explicitly intended.

#### Derived findings (post-2156 + post-2157; 2026-01-03)

- ✅ `admin_%` and `owner_%` functions in the 2156 scope no longer show PUBLIC (`=X/...`) or `anon=X/...` EXECUTE entries in `proacl`.
- ✅ 2157 applied: auth-only read RPCs and email-existence helper are now locked down:
  - `get_feed_catches`: authenticated + service_role only (no PUBLIC/anon)
  - `get_follower_count`: authenticated + service_role only (no PUBLIC/anon)
  - `check_email_exists`: service_role only (no PUBLIC/anon/authenticated)
- ⏳ Still shows PUBLIC/anon EXECUTE (follow-up classification depends on route intent + call sites):
  - `get_rate_limit_status`, `is_admin`, `is_following`, `is_blocked_either_way`, `get_my_venue_rating`, `insights_format_label`, `is_venue_admin_or_owner`
- ✅ Intentionally public reads (leave alone unless contracts change): `get_venues`, `get_venue_by_slug`, venue read helpers (`get_venue_*`), `get_leaderboard_scores`, `get_species_options`, `get_insights_aggregates`, `get_community_stats`.

> Next: run the focus query below to get signature-accurate rows (handles overloaded functions safely).

### LIVE: Functions with PUBLIC/anon EXECUTE (focus list)

```sql
-- Focus list: anything that still grants EXECUTE to PUBLIC or anon
select
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as identity_args,
  p.prosecdef as is_security_definer,
  p.proacl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and (
    coalesce(array_to_string(p.proacl, ','), '') like '%=X/%'
    or coalesce(array_to_string(p.proacl, ','), '') like '%anon=X/%'
  )
order by p.proname, identity_args;
```

- Output (paste here): TODO

### LIVE: SECURITY DEFINER + search_path pinning

```sql
select
  n.nspname,
  p.proname,
  p.prosecdef as is_security_definer,
  p.proconfig
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;
```

- Output (paste here): TODO

### LIVE: View reloptions (security_invoker)

```sql
select c.relname, c.reloptions
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'v'
order by c.relname;
```

- Output (paste here): TODO

### Interpretation checklist (P0/P1)

- P0: Any anon/PUBLIC EXECUTE on auth-only/admin/owner mutation RPCs = FAIL (list offenders).
- P0: `admin_users_select_all` policy present = FAIL (admin roster exposure risk).
- P1: Any SECURITY DEFINER without pinned search_path in `proconfig` = FAIL.
- P1: Any view used by public/auth surfaces without `security_invoker=true` or restricted grants = FAIL.
- P1: Broad anon/auth write grants require RLS confirmation; flag any rows with INSERT/UPDATE/DELETE for anon/auth.

## CATCH_DETAIL grants snapshot (seed)

### Expected posture

- `anon` must NOT have EXECUTE on `create_comment_with_rate_limit` or `soft_delete_comment`.
- `anon` should not SELECT `catch_comments_with_admin`.
- `authenticated` should have only the minimum needed to read catches/comments they are allowed to under RLS.
- If any function is SECURITY DEFINER, it must gate explicitly on `auth.uid()` / role checks.

### Capture outputs here

**EXECUTE grants for CATCH_DETAIL RPCs**

```sql
select grantee, routine_name, privilege_type
from information_schema.routine_privileges
where routine_schema='public'
  and routine_name in ('get_catch_rating_summary','create_comment_with_rate_limit','soft_delete_comment')
order by routine_name, grantee;
```

- Observed output (pre-2154):

```json
[
  {
    "schema": "public",
    "function": "create_comment_with_rate_limit",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function": "get_catch_rating_summary",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function": "soft_delete_comment",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  }
]
```

- Observed output (post-2154): TODO (re-run after applying 2154_catch_detail_grants.sql)

**SELECT grants for view + tables**

```sql
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema='public'
  and table_name in ('catch_comments_with_admin','catches','catch_reactions','profile_follows','catch_comments')
order by table_name, grantee;
```

- Observed output (pre-2154):

```json
[
  {
    "schema": "public",
    "object": "catch_comments",
    "relkind": "r",
    "relacl": "{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}"
  },
  {
    "schema": "public",
    "object": "catch_comments_with_admin",
    "relkind": "v",
    "relacl": "{postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres,authenticated=r/postgres}"
  },
  {
    "schema": "public",
    "object": "catch_reactions",
    "relkind": "r",
    "relacl": "{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}"
  },
  {
    "schema": "public",
    "object": "catches",
    "relkind": "r",
    "relacl": "{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}"
  },
  {
    "schema": "public",
    "object": "profile_follows",
    "relkind": "r",
    "relacl": "{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}"
  }
]
```

- Observed output (post-2154): TODO (re-run after applying 2154_catch_detail_grants.sql)

**View definition + columns (field leakage review)**

```sql
select column_name, data_type
from information_schema.columns
where table_schema='public' and table_name='catch_comments_with_admin'
order by ordinal_position;

select pg_get_viewdef('public.catch_comments_with_admin'::regclass, true);
```

- Observed output (pre-2154): TODO (paste columns + pg_get_viewdef output)
- Observed output (post-2154): TODO (re-run after applying 2154_catch_detail_grants.sql)

**View owner + reloptions (security_invoker check)**

```sql
select
  c.relowner::regrole as viewowner,
  c.reloptions
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'catch_comments_with_admin';
```

- Observed output (post-2155): TODO (expect `security_invoker=true`)

**View dependency map (base objects referenced)**

```sql
select
  n.nspname as referenced_schema,
  c.relname as referenced_object,
  c.relkind as object_type
from pg_depend d
join pg_rewrite r on r.oid=d.objid
join pg_class v on v.oid=r.ev_class
join pg_class c on c.oid=d.refobjid
join pg_namespace n on n.oid=c.relnamespace
where v.relname='catch_comments_with_admin'
  and d.deptype='n'
order by referenced_schema, referenced_object;
```

- Observed output (pre-2154): TODO (paste dependency map output)
- Observed output (post-2154): TODO (re-run after applying 2154_catch_detail_grants.sql)

### Interpretation guidance

- Grants PASS: `anon` has no EXECUTE on comment mutations; no PUBLIC/anon EXECUTE on sensitive functions; only `authenticated` where required.
- View PASS: non-admin sees no privileged categories (internal notes, moderation state, report metadata, admin-only flags, emails, IP/device identifiers, admin roster linkage); see `docs/version5/hardening/catch-detail/catch-detail-verification-log.md`.

## PROFILE_DETAIL grants snapshot (seed)

### Expected posture

- `anon` must NOT have EXECUTE on `follow_profile_with_rate_limit`, `block_profile`, `unblock_profile`, or `create_notification`.
- `get_follower_count` EXECUTE may be allowed for `anon` only if public counts are intended; document the decision.
- `authenticated` should only read profile/catch/follow/block/notification rows allowed by RLS (private + blocked gating enforced).
- `admin_users` should not be readable by anon; admin checks must be RLS-protected.
- If any function is SECURITY DEFINER, it must gate explicitly on `auth.uid()` / role checks.

### Capture outputs here

**EXECUTE grants for PROFILE_DETAIL RPCs**

```sql
select grantee, routine_name, privilege_type
from information_schema.routine_privileges
where routine_schema='public'
  and routine_name in (
    'get_follower_count',
    'follow_profile_with_rate_limit',
    'block_profile',
    'unblock_profile',
    'create_notification'
  )
order by routine_name, grantee;
```

- Observed output: TODO (paste routine_privileges rows)

**Table/view grants for profile surfaces**

```sql
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema='public'
  and table_name in (
    'profiles',
    'catches',
    'ratings',
    'venues',
    'profile_follows',
    'profile_blocks',
    'notifications',
    'admin_users',
    'rate_limits'
  )
order by table_name, grantee;
```

- Observed output: TODO (paste role_table_grants rows)

**Views (if introduced for profile detail)**

```sql
select column_name, data_type
from information_schema.columns
where table_schema='public' and table_name = '<TODO_VIEW_NAME>'
order by ordinal_position;

select pg_get_viewdef(('public.' || '<TODO_VIEW_NAME>')::regclass, true);
```

```sql
select
  n.nspname as referenced_schema,
  c.relname as referenced_object,
  c.relkind as object_type
from pg_depend d
join pg_rewrite r on r.oid=d.objid
join pg_class v on v.oid=r.ev_class
join pg_class c on c.oid=d.refobjid
join pg_namespace n on n.oid=c.relnamespace
where v.relname = '<TODO_VIEW_NAME>'
  and d.deptype='n'
order by referenced_schema, referenced_object;
```

### Interpretation guidance

- Grants PASS: anon has no EXECUTE on mutations; PUBLIC/anon EXECUTE only where explicitly intended.
- Table/view PASS: RLS enforces private/blocked access; no non-admin leakage of privileged categories (see `docs/version5/hardening/profile-detail/profile-detail-verification-log.md`).

### LIVE: Profile + Feed (Option A) — 2026-01-04

Evidence: `docs/version5/hardening/PROFILE-REALITY-VS-CONTRACT.md` → E (live DB outputs).

**Functions (EXECUTE ACLs)**

| Function | Identity args | is_security_definer | proacl | Verdict | Notes |
| --- | --- | --- | --- | --- | --- |
| block_profile | p_blocked_id uuid, p_reason text | true | {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres} | PASS | authenticated-only EXECUTE |
| create_notification | p_user_id uuid, p_message text, p_type notification_type, p_actor_id uuid, p_catch_id uuid, p_comment_id uuid, p_extra_data jsonb | true | {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres} | PASS | authenticated-only EXECUTE |
| follow_profile_with_rate_limit | p_following_id uuid | true | {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres} | PASS | authenticated-only EXECUTE |
| get_feed_catches | p_limit integer, p_offset integer, p_scope text, p_sort text, p_species text, p_custom_species text, p_venue_id uuid, p_session_id uuid | false | {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres} | PASS | authenticated-only EXECUTE |
| get_follower_count | p_profile_id uuid | true | {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres} | PASS | authenticated-only EXECUTE |
| get_species_options | p_only_active boolean, p_only_with_catches boolean | true | {postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | WARN | anon EXECUTE present; expectation unclear for auth-only surface |
| is_blocked_either_way | p_user_id uuid, p_other_id uuid | false | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | WARN | PUBLIC/anon EXECUTE on relationship helper |
| is_following | p_follower uuid, p_following uuid | false | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | WARN | PUBLIC/anon EXECUTE on relationship helper |
| unblock_profile | p_blocked_id uuid | true | {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres} | PASS | authenticated-only EXECUTE |

**Table grants (grouped privileges)**

| Table | Grantee privileges | Verdict | Notes |
| --- | --- | --- | --- |
| admin_users | anon/authenticated/service_role = {DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE} | FAIL | anon has broad write grants |
| catches | anon/authenticated/service_role = {DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE} | FAIL | anon has broad write grants |
| notifications | anon/authenticated/service_role = {DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE} | FAIL | anon has broad write grants |
| profile_blocks | anon/authenticated/service_role = {DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE} | FAIL | anon has broad write grants |
| profile_follows | anon/authenticated/service_role = {DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE} | FAIL | anon has broad write grants |
| profiles | anon/authenticated/service_role = {DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE} | FAIL | anon has broad write grants |

**RLS policies (Profile + Feed tables)**

| Table | Policies (cmd/roles/qual summary) | Verdict | Notes |
| --- | --- | --- | --- |
| admin_users | admin_users_self_select (SELECT, roles {public}, qual uid() = user_id) | PASS | self-select only |
| catches | catches_admin_read_all (SELECT, roles {public}, qual is_admin(uid())); catches_owner_all (SELECT, roles {public}, qual uid() = user_id); catches_owner_mutate (INSERT, roles {public}, with_check uid() = user_id AND NOT is_admin(uid())); catches_owner_update_delete (UPDATE, roles {public}, qual/with_check uid() = user_id AND NOT is_admin(uid())); catches_public_read (SELECT, roles {public}, qual includes privacy/follow/block checks) | PASS | privacy checks present in qual |
| notifications | notifications_admin_read (SELECT, roles {public}, qual is_admin(uid())); notifications_recipient_only (ALL, roles {public}, qual uid() = user_id) | PASS | recipient/admin scoped |
| profile_blocks | profile_blocks_select_self_or_blocked (SELECT, roles {public}, qual uid() = blocker_id OR uid() = blocked_id) + admin select; insert/delete self/admin | PASS | self/admin scoped |
| profile_follows | profile_follows_select_related (SELECT, roles {public}, qual uid() = follower_id OR uid() = following_id); profile_follows_insert_not_blocked (INSERT, roles {authenticated}, with_check uid() = follower_id AND NOT is_blocked_either_way); profile_follows_owner_all (ALL, roles {public}, qual uid() = follower_id); admin select | PASS | self/admin scoped; insert restricted to authenticated |
| profiles | profiles_select_all (SELECT, roles {public}, qual true); profiles_update_self (UPDATE, roles {public}, qual uid() = id) | WARN | public select-all policy; verify Option A private invisibility |

## Function EXECUTE grants

- TODO: snapshot + notes

## Table/view SELECT grants

- TODO: snapshot + notes

## Default privilege posture

- TODO: decisions and rationale
