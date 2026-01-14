> ⚠️ LEGACY (archived 2026-01-13)
> This file is the v1 global hardening attempt preserved for audit/history.
> Current work lives in: docs/version5/hardening/_global/v2/ (see _global/README.md).
> Do not update posture here unless you are explicitly updating legacy history notes.

# GRANTS Ledger

## Purpose

GRANTs define which roles can access objects; RLS policies define which rows are visible or writable. Both layers must be correct. This ledger records migration intent and provides SQL probes for live verification.

## Scope (roles + schemas)

- Roles in scope: `anon`, `authenticated`, `PUBLIC`.
- `service_role` appears only in the drift snapshot migration; include it in live probes if the role exists.
- No other custom roles were found in explicit GRANT/REVOKE statements in migrations; verify live output for additional roles.
- Schemas in scope: `public` (explicit in migrations). `storage` appears in migrations for policies but no GRANT/REVOKE statements were found; live probes cover all non-system schemas to surface any additional schemas.

## Repo intent (from migrations)

Notes: This reflects migration statements only. The live DB may differ; use the SQL probes below.

- Baseline grants: `supabase/migrations/1004_policies_and_grants.sql`
  - Sequence usage/select on all sequences in `public` for `anon`, `authenticated`.
  - `public.profiles`: SELECT for `anon`, `authenticated`; INSERT/UPDATE/DELETE for `authenticated`.
  - GRANT ALL on `public.sessions`, `public.catches`, `public.catch_comments`, `public.catch_reactions`, `public.ratings`, `public.profile_follows`, `public.notifications`, `public.reports`, `public.rate_limits` to `authenticated`.
  - SELECT on `public.baits`, `public.tags`, `public.water_types` to `anon`, `authenticated`.
  - EXECUTE on `public.handle_new_user()` to `anon`, `authenticated`.
- Auth/helper RPC grants: `supabase/migrations/1006_auth_and_rpc_helpers.sql`
  - EXECUTE on `public.check_email_exists(text)` to `anon`, `authenticated`.
  - EXECUTE on user-facing RPCs (create_comment_with_rate_limit, create_report_with_rate_limit, react_to_catch_with_rate_limit, rate_catch_with_rate_limit, follow_profile_with_rate_limit) to `authenticated`.
  - EXECUTE on admin/moderation RPCs (admin_delete_catch, admin_restore_catch, admin_delete_comment, admin_restore_comment, admin_warn_user) to `authenticated`.
- Venue/public data grants (examples; see files for details):
  - EXECUTE on `public.get_venues(...)` and `public.get_venue_by_slug(text)` to `anon`, `authenticated` across multiple migrations, with revokes and re-grants during hardening: `2057_venue_rpcs.sql`, `2060_update_venue_rpcs_add_venues.sql`, `2077_update_venue_rpcs_metadata.sql`, `2081_update_venue_rpcs_for_ratings.sql`, `2132_split_get_venue_by_slug_public_admin.sql`, `2153_admin_venues_hardening.sql`.
  - SELECT on `public.venue_stats` to `anon`, `authenticated` in `2067_add_venue_metadata_fields.sql`, `2080_extend_venue_stats_with_ratings.sql`, `2126_extend_venue_stats_active_anglers.sql`, then `REVOKE SELECT` from `anon` and `GRANT SELECT` to `authenticated` in `2153_admin_venues_hardening.sql`.
  - SELECT on `public.venue_stats_public` to `anon`, `authenticated` in `2153_admin_venues_hardening.sql`.
  - SELECT on `public.venue_events` to `anon`, `authenticated` in `2069_venue_events_schema.sql`.
- Venue owner tables DML (authenticated role):
  - `public.venue_opening_hours`, `public.venue_pricing_tiers`, `public.venue_rules`: SELECT to `anon`, `authenticated` and INSERT/UPDATE/DELETE to `authenticated` in `2118_venue_owner_phase1_mvp.sql`.
  - `public.venue_species_stock`: SELECT to `anon`, `authenticated` and INSERT/UPDATE/DELETE to `authenticated` in `2123_create_venue_species_stock.sql`.
  - `public.venue_photos`: SELECT to `anon`, `authenticated` and INSERT/DELETE to `authenticated` in `2078_venue_photos_and_rpcs.sql`; UPDATE to `authenticated` in `2125_venue_photos_primary.sql`.
  - `public.venue_ratings`: SELECT/INSERT/UPDATE/DELETE to `authenticated` in `2079_create_venue_ratings.sql`.
- Leaderboard/community/insights hardening patterns:
  - SELECT on `public.leaderboard_scores_detailed` to `anon`, `authenticated` in `1005_views_indexes_and_hardening.sql` and later tuning migrations (`2099`, `2146`, `2147`, `2148`).
  - EXECUTE on `public.get_leaderboard_scores(...)` is revoked from `PUBLIC` then granted to `anon`, `authenticated` in `2149`, `2150`, `2151`.
  - EXECUTE on `public.get_insights_aggregates(...)` is revoked from `PUBLIC` then granted to `authenticated` in `2141`, `2142`, `2143`, `2144`.
  - EXECUTE on `public.get_community_stats()` revoked from `PUBLIC` and granted to `anon`, `authenticated` in `2136`, `2137`.
  - `public.species` revoked and re-granted SELECT to `anon`, `authenticated` in `2140_lockdown_species_privileges.sql` and `2139_species_canonical.sql`.
- Comment/admin view access hardening:
  - REVOKE ALL on `public.catch_comments_with_admin` and `public.catch_mention_candidates` from `anon`, `authenticated` in `2087_revoke_access_comment_views.sql`; later re-grants for `authenticated` in `2096_restore_comment_view_access.sql`.
- Admin RPC grants to `authenticated` (examples; rely on server-side checks):
  - `admin_get_venues`, `admin_get_venue_by_slug`, `admin_list_reports`, `admin_update_report_status`, `admin_list_moderation_log`, `admin_create/update/delete_venue_event`, `admin_add/delete_venue_photo`, `admin_create/update/delete_venue_species_stock`, `admin_clear_moderation_status`, `admin_delete_account`, `admin_update_venue_metadata`.
  - References: `2071_admin_get_venue_events.sql`, `2072_admin_report_rpcs.sql`, `2129_admin_venue_photo_rpcs.sql`, `2123_create_venue_species_stock.sql`, `2047_admin_clear_moderation_status.sql`, `2051_request_account_deletion.sql`, `2068_admin_update_venue_metadata.sql`, `2075_admin_update_venue_metadata_description.sql`, `2153_admin_venues_hardening.sql`.
- Drift snapshot note:
  - `supabase/migrations/20251217000304_supabase/migrations/_drift_remote_vs_migrations.sql.sql` contains extensive REVOKE statements (including `service_role`). Treat this file as a drift artifact, not an authoritative intent; verify live state with SQL probes.
- No `ALTER DEFAULT PRIVILEGES` statements were found in migrations; default privileges are UNKNOWN until verified live.

## Planned P0 change (pending execution)

This matches the P0 migration `supabase/migrations/2154_p0_global_grants_lockdown.sql` and is expected to reduce risk without breaking core UX.

Note on PUBLIC: `PUBLIC` is a pseudo-role that applies to *all* roles. Any grant to PUBLIC effectively widens access beyond `anon`/`authenticated` and must be treated as broad exposure.

Expected redflag deltas after execution (verify with live probes):
- `anon` should lose TRIGGER/TRUNCATE/REFERENCES/MAINTAIN across public relations (these will no longer appear in `GRANTS-REDFLAGS-LIVE.sql` rows for `anon`/`authenticated`).
- `PUBLIC` should have **no** table privileges on: `public.admin_users`, `public.moderation_log`, `public.user_warnings`, `public.rate_limits`.
- `anon` should have **no** table privileges on: `public.admin_users`, `public.moderation_log`, `public.user_warnings`, `public.rate_limits`.
- `authenticated` should retain **SELECT only** on: `public.admin_users`, `public.moderation_log`, `public.user_warnings` (no INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER/MAINTAIN).
- `public.rate_limits` should have **no** `anon`/`authenticated` table privileges.
- Sequence UPDATE on public sequences should be removed for `PUBLIC`/`anon`/`authenticated`.

Expected deltas after `supabase/migrations/2155_default_privileges_lockdown.sql`:
- Default privileges for new tables/sequences/functions should no longer grant access to `PUBLIC`, `anon`, or `authenticated` (verify via `pg_default_acl` probe).

## Live summary (from snapshot)
Derived from the previously pasted `GRANTS-LIVE.sql` output; re-run live probes to refresh.
- Schemas present in live output: `auth`, `extensions`, `graphql`, `graphql_public`, `net`, `public`, `realtime`, `storage`, `supabase_functions`, `vault`.
- Schema CREATE grants for anon/authenticated/PUBLIC: 0.
- Tables with anon/PUBLIC write privileges (INSERT/UPDATE/DELETE/TRUNCATE): 40.
- Sequences with UPDATE for anon/PUBLIC: 4.

### Grant counts by object type + grantee
| Object type | Grantee | Count |
| --- | --- | --- |
| column | PUBLIC | 107 |
| column | anon | 1424 |
| column | authenticated | 1450 |
| column | service_role | 1671 |
| schema | PUBLIC | 2 |
| schema | anon | 9 |
| schema | authenticated | 9 |
| schema | service_role | 10 |
| sequence | PUBLIC | 3 |
| sequence | anon | 10 |
| sequence | authenticated | 10 |
| sequence | service_role | 10 |
| table | PUBLIC | 16 |
| table | anon | 270 |
| table | authenticated | 273 |
| table | service_role | 340 |

### Red flags from live snapshot
- Pre-P0 JSON baseline (2026-01-11) was not committed to the repo; no file available.
#### Table write grants to anon/PUBLIC
| Schema | Table | Grants |
| --- | --- | --- |
| net | _http_response | PUBLIC:DELETE, PUBLIC:INSERT, PUBLIC:TRUNCATE, PUBLIC:UPDATE |
| net | http_request_queue | PUBLIC:DELETE, PUBLIC:INSERT, PUBLIC:TRUNCATE, PUBLIC:UPDATE |
| public | admin_users | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | baits | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | catch_comments | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | catch_leaderboard_scores | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | catch_rating_stats | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | catch_reactions | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | catches | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | leaderboard_scores_detailed | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | moderation_log | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | notifications | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | profile_blocks | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | profile_follows | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | profiles | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | rate_limits | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | ratings | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | reports | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | sessions | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | tags | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | user_warnings | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | venue_events | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | venue_opening_hours | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | venue_owners | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | venue_photos | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | venue_pricing_tiers | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | venue_ratings | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | venue_rules | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | venue_species_stock | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | venue_stats | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | venue_stats_public | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | venues | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| public | water_types | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| realtime | messages | anon:INSERT, anon:UPDATE |
| storage | buckets | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| storage | buckets_analytics | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| storage | objects | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| storage | prefixes | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| supabase_functions | hooks | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |
| supabase_functions | migrations | anon:DELETE, anon:INSERT, anon:TRUNCATE, anon:UPDATE |

#### Sequence UPDATE grants to anon/PUBLIC
| Schema | Sequence | Grantee |
| --- | --- | --- |
| graphql | seq_schema_version | anon |
| net | http_request_queue_id_seq | PUBLIC |
| public | rate_limits_id_seq | anon |
| supabase_functions | hooks_id_seq | anon |

## Live DB snapshot (summary outputs)
### GRANTS-SUMMARY-LIVE.sql output

[
  {
    "object_type": "column",
    "schema_name": "extensions",
    "grantee": "PUBLIC",
    "privilege_type": "SELECT",
    "grant_count": 51,
    "object_count": 51
  },
  {
    "object_type": "column",
    "schema_name": "net",
    "grantee": "PUBLIC",
    "privilege_type": "INSERT",
    "grant_count": 14,
    "object_count": 14
  },
  {
    "object_type": "column",
    "schema_name": "net",
    "grantee": "PUBLIC",
    "privilege_type": "REFERENCES",
    "grant_count": 14,
    "object_count": 14
  },
  {
    "object_type": "column",
    "schema_name": "net",
    "grantee": "PUBLIC",
    "privilege_type": "SELECT",
    "grant_count": 14,
    "object_count": 14
  },
  {
    "object_type": "column",
    "schema_name": "net",
    "grantee": "PUBLIC",
    "privilege_type": "UPDATE",
    "grant_count": 14,
    "object_count": 14
  },
  {
    "object_type": "column",
    "schema_name": "public",
    "grantee": "anon",
    "privilege_type": "INSERT",
    "grant_count": 269,
    "object_count": 269
  },
  {
    "object_type": "column",
    "schema_name": "public",
    "grantee": "anon",
    "privilege_type": "SELECT",
    "grant_count": 262,
    "object_count": 262
  },
  {
    "object_type": "column",
    "schema_name": "public",
    "grantee": "anon",
    "privilege_type": "UPDATE",
    "grant_count": 269,
    "object_count": 269
  },
  {
    "object_type": "column",
    "schema_name": "public",
    "grantee": "authenticated",
    "privilege_type": "INSERT",
    "grant_count": 269,
    "object_count": 269
  },
  {
    "object_type": "column",
    "schema_name": "public",
    "grantee": "authenticated",
    "privilege_type": "SELECT",
    "grant_count": 309,
    "object_count": 309
  },
  {
    "object_type": "column",
    "schema_name": "public",
    "grantee": "authenticated",
    "privilege_type": "UPDATE",
    "grant_count": 269,
    "object_count": 269
  },
  {
    "object_type": "column",
    "schema_name": "public",
    "grantee": "service_role",
    "privilege_type": "INSERT",
    "grant_count": 322,
    "object_count": 322
  },
  {
    "object_type": "column",
    "schema_name": "public",
    "grantee": "service_role",
    "privilege_type": "REFERENCES",
    "grant_count": 322,
    "object_count": 322
  },
  {
    "object_type": "column",
    "schema_name": "public",
    "grantee": "service_role",
    "privilege_type": "SELECT",
    "grant_count": 322,
    "object_count": 322
  },
  {
    "object_type": "column",
    "schema_name": "public",
    "grantee": "service_role",
    "privilege_type": "UPDATE",
    "grant_count": 322,
    "object_count": 322
  },
  {
    "object_type": "column",
    "schema_name": "realtime",
    "grantee": "anon",
    "privilege_type": "INSERT",
    "grant_count": 8,
    "object_count": 8
  },
  {
    "object_type": "column",
    "schema_name": "realtime",
    "grantee": "anon",
    "privilege_type": "SELECT",
    "grant_count": 17,
    "object_count": 17
  },
  {
    "object_type": "column",
    "schema_name": "realtime",
    "grantee": "anon",
    "privilege_type": "UPDATE",
    "grant_count": 8,
    "object_count": 8
  },
  {
    "object_type": "column",
    "schema_name": "realtime",
    "grantee": "authenticated",
    "privilege_type": "INSERT",
    "grant_count": 8,
    "object_count": 8
  },
  {
    "object_type": "column",
    "schema_name": "realtime",
    "grantee": "authenticated",
    "privilege_type": "SELECT",
    "grant_count": 17,
    "object_count": 17
  },
  {
    "object_type": "column",
    "schema_name": "realtime",
    "grantee": "authenticated",
    "privilege_type": "UPDATE",
    "grant_count": 8,
    "object_count": 8
  },
  {
    "object_type": "column",
    "schema_name": "realtime",
    "grantee": "service_role",
    "privilege_type": "INSERT",
    "grant_count": 8,
    "object_count": 8
  },
  {
    "object_type": "column",
    "schema_name": "realtime",
    "grantee": "service_role",
    "privilege_type": "SELECT",
    "grant_count": 17,
    "object_count": 17
  },
  {
    "object_type": "column",
    "schema_name": "realtime",
    "grantee": "service_role",
    "privilege_type": "UPDATE",
    "grant_count": 8,
    "object_count": 8
  },
  {
    "object_type": "column",
    "schema_name": "storage",
    "grantee": "anon",
    "privilege_type": "INSERT",
    "grant_count": 36,
    "object_count": 36
  },
  {
    "object_type": "column",
    "schema_name": "storage",
    "grantee": "anon",
    "privilege_type": "REFERENCES",
    "grant_count": 36,
    "object_count": 36
  },
  {
    "object_type": "column",
    "schema_name": "storage",
    "grantee": "anon",
    "privilege_type": "SELECT",
    "grant_count": 86,
    "object_count": 86
  },
  {
    "object_type": "column",
    "schema_name": "storage",
    "grantee": "anon",
    "privilege_type": "UPDATE",
    "grant_count": 36,
    "object_count": 36
  },
  {
    "object_type": "column",
    "schema_name": "storage",
    "grantee": "authenticated",
    "privilege_type": "INSERT",
    "grant_count": 36,
    "object_count": 36
  },
  {
    "object_type": "column",
    "schema_name": "storage",
    "grantee": "authenticated",
    "privilege_type": "REFERENCES",
    "grant_count": 36,
    "object_count": 36
  },
  {
    "object_type": "column",
    "schema_name": "storage",
    "grantee": "authenticated",
    "privilege_type": "SELECT",
    "grant_count": 86,
    "object_count": 86
  },
  {
    "object_type": "column",
    "schema_name": "storage",
    "grantee": "authenticated",
    "privilege_type": "UPDATE",
    "grant_count": 36,
    "object_count": 36
  },
  {
    "object_type": "column",
    "schema_name": "storage",
    "grantee": "service_role",
    "privilege_type": "INSERT",
    "grant_count": 73,
    "object_count": 73
  },
  {
    "object_type": "column",
    "schema_name": "storage",
    "grantee": "service_role",
    "privilege_type": "REFERENCES",
    "grant_count": 73,
    "object_count": 73
  },
  {
    "object_type": "column",
    "schema_name": "storage",
    "grantee": "service_role",
    "privilege_type": "SELECT",
    "grant_count": 86,
    "object_count": 86
  },
  {
    "object_type": "column",
    "schema_name": "storage",
    "grantee": "service_role",
    "privilege_type": "UPDATE",
    "grant_count": 73,
    "object_count": 73
  },
  {
    "object_type": "column",
    "schema_name": "supabase_functions",
    "grantee": "anon",
    "privilege_type": "INSERT",
    "grant_count": 7,
    "object_count": 7
  },
  {
    "object_type": "column",
    "schema_name": "supabase_functions",
    "grantee": "anon",
    "privilege_type": "REFERENCES",
    "grant_count": 7,
    "object_count": 7
  },
  {
    "object_type": "column",
    "schema_name": "supabase_functions",
    "grantee": "anon",
    "privilege_type": "SELECT",
    "grant_count": 7,
    "object_count": 7
  },
  {
    "object_type": "column",
    "schema_name": "supabase_functions",
    "grantee": "anon",
    "privilege_type": "UPDATE",
    "grant_count": 7,
    "object_count": 7
  },
  {
    "object_type": "column",
    "schema_name": "supabase_functions",
    "grantee": "authenticated",
    "privilege_type": "INSERT",
    "grant_count": 7,
    "object_count": 7
  },
  {
    "object_type": "column",
    "schema_name": "supabase_functions",
    "grantee": "authenticated",
    "privilege_type": "REFERENCES",
    "grant_count": 7,
    "object_count": 7
  },
  {
    "object_type": "column",
    "schema_name": "supabase_functions",
    "grantee": "authenticated",
    "privilege_type": "SELECT",
    "grant_count": 7,
    "object_count": 7
  },
  {
    "object_type": "column",
    "schema_name": "supabase_functions",
    "grantee": "authenticated",
    "privilege_type": "UPDATE",
    "grant_count": 7,
    "object_count": 7
  },
  {
    "object_type": "column",
    "schema_name": "supabase_functions",
    "grantee": "service_role",
    "privilege_type": "INSERT",
    "grant_count": 7,
    "object_count": 7
  },
  {
    "object_type": "column",
    "schema_name": "supabase_functions",
    "grantee": "service_role",
    "privilege_type": "REFERENCES",
    "grant_count": 7,
    "object_count": 7
  },
  {
    "object_type": "column",
    "schema_name": "supabase_functions",
    "grantee": "service_role",
    "privilege_type": "SELECT",
    "grant_count": 7,
    "object_count": 7
  },
  {
    "object_type": "column",
    "schema_name": "supabase_functions",
    "grantee": "service_role",
    "privilege_type": "UPDATE",
    "grant_count": 7,
    "object_count": 7
  },
  {
    "object_type": "column",
    "schema_name": "vault",
    "grantee": "service_role",
    "privilege_type": "SELECT",
    "grant_count": 17,
    "object_count": 17
  },
  {
    "object_type": "schema",
    "schema_name": "auth",
    "grantee": "anon",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "auth",
    "grantee": "authenticated",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "auth",
    "grantee": "service_role",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "extensions",
    "grantee": "anon",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "extensions",
    "grantee": "authenticated",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "extensions",
    "grantee": "service_role",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "graphql",
    "grantee": "anon",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "graphql",
    "grantee": "authenticated",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "graphql",
    "grantee": "service_role",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "graphql_public",
    "grantee": "anon",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "graphql_public",
    "grantee": "authenticated",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "graphql_public",
    "grantee": "service_role",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "net",
    "grantee": "PUBLIC",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "net",
    "grantee": "anon",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "net",
    "grantee": "authenticated",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "net",
    "grantee": "service_role",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "public",
    "grantee": "PUBLIC",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "public",
    "grantee": "anon",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "public",
    "grantee": "authenticated",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "public",
    "grantee": "service_role",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "realtime",
    "grantee": "anon",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "realtime",
    "grantee": "authenticated",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "realtime",
    "grantee": "service_role",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "storage",
    "grantee": "anon",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "storage",
    "grantee": "authenticated",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "storage",
    "grantee": "service_role",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "supabase_functions",
    "grantee": "anon",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "supabase_functions",
    "grantee": "authenticated",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "supabase_functions",
    "grantee": "service_role",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "schema",
    "schema_name": "vault",
    "grantee": "service_role",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 0
  },
  {
    "object_type": "sequence",
    "schema_name": "graphql",
    "grantee": "anon",
    "privilege_type": "SELECT",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "graphql",
    "grantee": "anon",
    "privilege_type": "UPDATE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "graphql",
    "grantee": "anon",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "graphql",
    "grantee": "authenticated",
    "privilege_type": "SELECT",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "graphql",
    "grantee": "authenticated",
    "privilege_type": "UPDATE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "graphql",
    "grantee": "authenticated",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "graphql",
    "grantee": "service_role",
    "privilege_type": "SELECT",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "graphql",
    "grantee": "service_role",
    "privilege_type": "UPDATE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "graphql",
    "grantee": "service_role",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "net",
    "grantee": "PUBLIC",
    "privilege_type": "SELECT",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "net",
    "grantee": "PUBLIC",
    "privilege_type": "UPDATE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "net",
    "grantee": "PUBLIC",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "public",
    "grantee": "anon",
    "privilege_type": "SELECT",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "public",
    "grantee": "anon",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "public",
    "grantee": "authenticated",
    "privilege_type": "SELECT",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "public",
    "grantee": "authenticated",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "public",
    "grantee": "service_role",
    "privilege_type": "SELECT",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "public",
    "grantee": "service_role",
    "privilege_type": "UPDATE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "public",
    "grantee": "service_role",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "realtime",
    "grantee": "anon",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "realtime",
    "grantee": "authenticated",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "realtime",
    "grantee": "service_role",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "supabase_functions",
    "grantee": "anon",
    "privilege_type": "SELECT",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "supabase_functions",
    "grantee": "anon",
    "privilege_type": "UPDATE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "supabase_functions",
    "grantee": "anon",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "supabase_functions",
    "grantee": "authenticated",
    "privilege_type": "SELECT",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "supabase_functions",
    "grantee": "authenticated",
    "privilege_type": "UPDATE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "supabase_functions",
    "grantee": "authenticated",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "supabase_functions",
    "grantee": "service_role",
    "privilege_type": "SELECT",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "supabase_functions",
    "grantee": "service_role",
    "privilege_type": "UPDATE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "sequence",
    "schema_name": "supabase_functions",
    "grantee": "service_role",
    "privilege_type": "USAGE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "table",
    "schema_name": "extensions",
    "grantee": "PUBLIC",
    "privilege_type": "SELECT",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "net",
    "grantee": "PUBLIC",
    "privilege_type": "DELETE",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "net",
    "grantee": "PUBLIC",
    "privilege_type": "INSERT",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "net",
    "grantee": "PUBLIC",
    "privilege_type": "REFERENCES",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "net",
    "grantee": "PUBLIC",
    "privilege_type": "SELECT",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "net",
    "grantee": "PUBLIC",
    "privilege_type": "TRIGGER",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "net",
    "grantee": "PUBLIC",
    "privilege_type": "TRUNCATE",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "net",
    "grantee": "PUBLIC",
    "privilege_type": "UPDATE",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "public",
    "grantee": "anon",
    "privilege_type": "DELETE",
    "grant_count": 27,
    "object_count": 27
  },
  {
    "object_type": "table",
    "schema_name": "public",
    "grantee": "anon",
    "privilege_type": "INSERT",
    "grant_count": 27,
    "object_count": 27
  },
  {
    "object_type": "table",
    "schema_name": "public",
    "grantee": "anon",
    "privilege_type": "SELECT",
    "grant_count": 27,
    "object_count": 27
  },
  {
    "object_type": "table",
    "schema_name": "public",
    "grantee": "anon",
    "privilege_type": "UPDATE",
    "grant_count": 27,
    "object_count": 27
  },
  {
    "object_type": "table",
    "schema_name": "public",
    "grantee": "authenticated",
    "privilege_type": "DELETE",
    "grant_count": 27,
    "object_count": 27
  },
  {
    "object_type": "table",
    "schema_name": "public",
    "grantee": "authenticated",
    "privilege_type": "INSERT",
    "grant_count": 27,
    "object_count": 27
  },
  {
    "object_type": "table",
    "schema_name": "public",
    "grantee": "authenticated",
    "privilege_type": "SELECT",
    "grant_count": 33,
    "object_count": 33
  },
  {
    "object_type": "table",
    "schema_name": "public",
    "grantee": "authenticated",
    "privilege_type": "UPDATE",
    "grant_count": 27,
    "object_count": 27
  },
  {
    "object_type": "table",
    "schema_name": "public",
    "grantee": "service_role",
    "privilege_type": "DELETE",
    "grant_count": 37,
    "object_count": 37
  },
  {
    "object_type": "table",
    "schema_name": "public",
    "grantee": "service_role",
    "privilege_type": "INSERT",
    "grant_count": 37,
    "object_count": 37
  },
  {
    "object_type": "table",
    "schema_name": "public",
    "grantee": "service_role",
    "privilege_type": "REFERENCES",
    "grant_count": 37,
    "object_count": 37
  },
  {
    "object_type": "table",
    "schema_name": "public",
    "grantee": "service_role",
    "privilege_type": "SELECT",
    "grant_count": 37,
    "object_count": 37
  },
  {
    "object_type": "table",
    "schema_name": "public",
    "grantee": "service_role",
    "privilege_type": "TRIGGER",
    "grant_count": 37,
    "object_count": 37
  },
  {
    "object_type": "table",
    "schema_name": "public",
    "grantee": "service_role",
    "privilege_type": "TRUNCATE",
    "grant_count": 37,
    "object_count": 37
  },
  {
    "object_type": "table",
    "schema_name": "public",
    "grantee": "service_role",
    "privilege_type": "UPDATE",
    "grant_count": 37,
    "object_count": 37
  },
  {
    "object_type": "table",
    "schema_name": "realtime",
    "grantee": "anon",
    "privilege_type": "INSERT",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "table",
    "schema_name": "realtime",
    "grantee": "anon",
    "privilege_type": "SELECT",
    "grant_count": 3,
    "object_count": 3
  },
  {
    "object_type": "table",
    "schema_name": "realtime",
    "grantee": "anon",
    "privilege_type": "UPDATE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "table",
    "schema_name": "realtime",
    "grantee": "authenticated",
    "privilege_type": "INSERT",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "table",
    "schema_name": "realtime",
    "grantee": "authenticated",
    "privilege_type": "SELECT",
    "grant_count": 3,
    "object_count": 3
  },
  {
    "object_type": "table",
    "schema_name": "realtime",
    "grantee": "authenticated",
    "privilege_type": "UPDATE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "table",
    "schema_name": "realtime",
    "grantee": "service_role",
    "privilege_type": "INSERT",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "table",
    "schema_name": "realtime",
    "grantee": "service_role",
    "privilege_type": "SELECT",
    "grant_count": 3,
    "object_count": 3
  },
  {
    "object_type": "table",
    "schema_name": "realtime",
    "grantee": "service_role",
    "privilege_type": "UPDATE",
    "grant_count": 1,
    "object_count": 1
  },
  {
    "object_type": "table",
    "schema_name": "storage",
    "grantee": "anon",
    "privilege_type": "DELETE",
    "grant_count": 4,
    "object_count": 4
  },
  {
    "object_type": "table",
    "schema_name": "storage",
    "grantee": "anon",
    "privilege_type": "INSERT",
    "grant_count": 4,
    "object_count": 4
  },
  {
    "object_type": "table",
    "schema_name": "storage",
    "grantee": "anon",
    "privilege_type": "REFERENCES",
    "grant_count": 4,
    "object_count": 4
  },
  {
    "object_type": "table",
    "schema_name": "storage",
    "grantee": "anon",
    "privilege_type": "SELECT",
    "grant_count": 10,
    "object_count": 10
  },
  {
    "object_type": "table",
    "schema_name": "storage",
    "grantee": "anon",
    "privilege_type": "TRIGGER",
    "grant_count": 4,
    "object_count": 4
  },
  {
    "object_type": "table",
    "schema_name": "storage",
    "grantee": "anon",
    "privilege_type": "TRUNCATE",
    "grant_count": 4,
    "object_count": 4
  },
  {
    "object_type": "table",
    "schema_name": "storage",
    "grantee": "anon",
    "privilege_type": "UPDATE",
    "grant_count": 4,
    "object_count": 4
  },
  {
    "object_type": "table",
    "schema_name": "storage",
    "grantee": "authenticated",
    "privilege_type": "DELETE",
    "grant_count": 4,
    "object_count": 4
  },
  {
    "object_type": "table",
    "schema_name": "storage",
    "grantee": "authenticated",
    "privilege_type": "INSERT",
    "grant_count": 4,
    "object_count": 4
  },
  {
    "object_type": "table",
    "schema_name": "storage",
    "grantee": "authenticated",
    "privilege_type": "REFERENCES",
    "grant_count": 4,
    "object_count": 4
  },
  {
    "object_type": "table",
    "schema_name": "storage",
    "grantee": "authenticated",
    "privilege_type": "SELECT",
    "grant_count": 10,
    "object_count": 10
  },
  {
    "object_type": "table",
    "schema_name": "storage",
    "grantee": "authenticated",
    "privilege_type": "TRIGGER",
    "grant_count": 4,
    "object_count": 4
  },
  {
    "object_type": "table",
    "schema_name": "storage",
    "grantee": "authenticated",
    "privilege_type": "TRUNCATE",
    "grant_count": 4,
    "object_count": 4
  },
  {
    "object_type": "table",
    "schema_name": "storage",
    "grantee": "authenticated",
    "privilege_type": "UPDATE",
    "grant_count": 4,
    "object_count": 4
  },
  {
    "object_type": "table",
    "schema_name": "storage",
    "grantee": "service_role",
    "privilege_type": "DELETE",
    "grant_count": 8,
    "object_count": 8
  },
  {
    "object_type": "table",
    "schema_name": "storage",
    "grantee": "service_role",
    "privilege_type": "INSERT",
    "grant_count": 8,
    "object_count": 8
  },
  {
    "object_type": "table",
    "schema_name": "storage",
    "grantee": "service_role",
    "privilege_type": "REFERENCES",
    "grant_count": 8,
    "object_count": 8
  },
  {
    "object_type": "table",
    "schema_name": "storage",
    "grantee": "service_role",
    "privilege_type": "SELECT",
    "grant_count": 10,
    "object_count": 10
  },
  {
    "object_type": "table",
    "schema_name": "storage",
    "grantee": "service_role",
    "privilege_type": "TRIGGER",
    "grant_count": 8,
    "object_count": 8
  },
  {
    "object_type": "table",
    "schema_name": "storage",
    "grantee": "service_role",
    "privilege_type": "TRUNCATE",
    "grant_count": 8,
    "object_count": 8
  },
  {
    "object_type": "table",
    "schema_name": "storage",
    "grantee": "service_role",
    "privilege_type": "UPDATE",
    "grant_count": 8,
    "object_count": 8
  },
  {
    "object_type": "table",
    "schema_name": "supabase_functions",
    "grantee": "anon",
    "privilege_type": "DELETE",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "supabase_functions",
    "grantee": "anon",
    "privilege_type": "INSERT",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "supabase_functions",
    "grantee": "anon",
    "privilege_type": "REFERENCES",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "supabase_functions",
    "grantee": "anon",
    "privilege_type": "SELECT",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "supabase_functions",
    "grantee": "anon",
    "privilege_type": "TRIGGER",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "supabase_functions",
    "grantee": "anon",
    "privilege_type": "TRUNCATE",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "supabase_functions",
    "grantee": "anon",
    "privilege_type": "UPDATE",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "supabase_functions",
    "grantee": "authenticated",
    "privilege_type": "DELETE",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "supabase_functions",
    "grantee": "authenticated",
    "privilege_type": "INSERT",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "supabase_functions",
    "grantee": "authenticated",
    "privilege_type": "REFERENCES",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "supabase_functions",
    "grantee": "authenticated",
    "privilege_type": "SELECT",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "supabase_functions",
    "grantee": "authenticated",
    "privilege_type": "TRIGGER",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "supabase_functions",
    "grantee": "authenticated",
    "privilege_type": "TRUNCATE",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "supabase_functions",
    "grantee": "authenticated",
    "privilege_type": "UPDATE",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "supabase_functions",
    "grantee": "service_role",
    "privilege_type": "DELETE",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "supabase_functions",
    "grantee": "service_role",
    "privilege_type": "INSERT",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "supabase_functions",
    "grantee": "service_role",
    "privilege_type": "REFERENCES",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "supabase_functions",
    "grantee": "service_role",
    "privilege_type": "SELECT",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "supabase_functions",
    "grantee": "service_role",
    "privilege_type": "TRIGGER",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "supabase_functions",
    "grantee": "service_role",
    "privilege_type": "TRUNCATE",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "supabase_functions",
    "grantee": "service_role",
    "privilege_type": "UPDATE",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "vault",
    "grantee": "service_role",
    "privilege_type": "DELETE",
    "grant_count": 2,
    "object_count": 2
  },
  {
    "object_type": "table",
    "schema_name": "vault",
    "grantee": "service_role",
    "privilege_type": "SELECT",
    "grant_count": 2,
    "object_count": 2
  }
]

### GRANTS-DEFAULT-PRIVS-LIVE.sql output

[
  {
    "schema_name": "auth",
    "owner": "supabase_auth_admin",
    "object_type": "functions",
    "acl": "{postgres=X/supabase_auth_admin,dashboard_user=X/supabase_auth_admin}"
  },
  {
    "schema_name": "auth",
    "owner": "supabase_auth_admin",
    "object_type": "sequences",
    "acl": "{postgres=rwU/supabase_auth_admin,dashboard_user=rwU/supabase_auth_admin}"
  },
  {
    "schema_name": "auth",
    "owner": "supabase_auth_admin",
    "object_type": "tables",
    "acl": "{postgres=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}"
  },
  {
    "schema_name": "extensions",
    "owner": "supabase_admin",
    "object_type": "functions",
    "acl": "{postgres=X*/supabase_admin}"
  },
  {
    "schema_name": "extensions",
    "owner": "supabase_admin",
    "object_type": "sequences",
    "acl": "{postgres=r*w*U*/supabase_admin}"
  },
  {
    "schema_name": "extensions",
    "owner": "supabase_admin",
    "object_type": "tables",
    "acl": "{postgres=a*r*w*d*D*x*t*m*/supabase_admin}"
  },
  {
    "schema_name": "graphql",
    "owner": "supabase_admin",
    "object_type": "functions",
    "acl": "{postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin}"
  },
  {
    "schema_name": "graphql",
    "owner": "supabase_admin",
    "object_type": "sequences",
    "acl": "{postgres=rwU/supabase_admin,anon=rwU/supabase_admin,authenticated=rwU/supabase_admin,service_role=rwU/supabase_admin}"
  },
  {
    "schema_name": "graphql",
    "owner": "supabase_admin",
    "object_type": "tables",
    "acl": "{postgres=arwdDxtm/supabase_admin,anon=arwdDxtm/supabase_admin,authenticated=arwdDxtm/supabase_admin,service_role=arwdDxtm/supabase_admin}"
  },
  {
    "schema_name": "graphql_public",
    "owner": "supabase_admin",
    "object_type": "functions",
    "acl": "{postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin}"
  },
  {
    "schema_name": "graphql_public",
    "owner": "supabase_admin",
    "object_type": "sequences",
    "acl": "{postgres=rwU/supabase_admin,anon=rwU/supabase_admin,authenticated=rwU/supabase_admin,service_role=rwU/supabase_admin}"
  },
  {
    "schema_name": "graphql_public",
    "owner": "supabase_admin",
    "object_type": "tables",
    "acl": "{postgres=arwdDxtm/supabase_admin,anon=arwdDxtm/supabase_admin,authenticated=arwdDxtm/supabase_admin,service_role=arwdDxtm/supabase_admin}"
  },
  {
    "schema_name": "public",
    "owner": "postgres",
    "object_type": "functions",
    "acl": "{postgres=X/postgres,service_role=X/postgres}"
  },
  {
    "schema_name": "public",
    "owner": "postgres",
    "object_type": "sequences",
    "acl": "{postgres=rwU/postgres,service_role=rwU/postgres}"
  },
  {
    "schema_name": "public",
    "owner": "postgres",
    "object_type": "tables",
    "acl": "{postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres}"
  },
  {
    "schema_name": "public",
    "owner": "supabase_admin",
    "object_type": "functions",
    "acl": "{postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin}"
  },
  {
    "schema_name": "public",
    "owner": "supabase_admin",
    "object_type": "sequences",
    "acl": "{postgres=rwU/supabase_admin,anon=rwU/supabase_admin,authenticated=rwU/supabase_admin,service_role=rwU/supabase_admin}"
  },
  {
    "schema_name": "public",
    "owner": "supabase_admin",
    "object_type": "tables",
    "acl": "{postgres=arwdDxtm/supabase_admin,anon=arwdDxtm/supabase_admin,authenticated=arwdDxtm/supabase_admin,service_role=arwdDxtm/supabase_admin}"
  },
  {
    "schema_name": "realtime",
    "owner": "supabase_admin",
    "object_type": "functions",
    "acl": "{postgres=X/supabase_admin,dashboard_user=X/supabase_admin}"
  },
  {
    "schema_name": "realtime",
    "owner": "supabase_admin",
    "object_type": "sequences",
    "acl": "{postgres=rwU/supabase_admin,dashboard_user=rwU/supabase_admin}"
  },
  {
    "schema_name": "realtime",
    "owner": "supabase_admin",
    "object_type": "tables",
    "acl": "{postgres=arwdDxtm/supabase_admin,dashboard_user=arwdDxtm/supabase_admin}"
  },
  {
    "schema_name": "storage",
    "owner": "postgres",
    "object_type": "functions",
    "acl": "{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema_name": "storage",
    "owner": "postgres",
    "object_type": "sequences",
    "acl": "{postgres=rwU/postgres,anon=rwU/postgres,authenticated=rwU/postgres,service_role=rwU/postgres}"
  },
  {
    "schema_name": "storage",
    "owner": "postgres",
    "object_type": "tables",
    "acl": "{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}"
  },
  {
    "schema_name": "supabase_functions",
    "owner": "supabase_admin",
    "object_type": "functions",
    "acl": "{postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin}"
  },
  {
    "schema_name": "supabase_functions",
    "owner": "supabase_admin",
    "object_type": "sequences",
    "acl": "{postgres=rwU/supabase_admin,anon=rwU/supabase_admin,authenticated=rwU/supabase_admin,service_role=rwU/supabase_admin}"
  },
  {
    "schema_name": "supabase_functions",
    "owner": "supabase_admin",
    "object_type": "tables",
    "acl": "{postgres=arwdDxtm/supabase_admin,anon=arwdDxtm/supabase_admin,authenticated=arwdDxtm/supabase_admin,service_role=arwdDxtm/supabase_admin}"
  }
]

## Red Flags (review checklist)
- [ ] Any grant to `PUBLIC` on sensitive objects
- [ ] `anon` has write privileges beyond explicit intent
- [ ] Schema CREATE granted to `anon`/`authenticated`/`PUBLIC`
- [ ] Sequence UPDATE granted to `anon`/`PUBLIC`
- [ ] Default privileges grant access to `anon`/`authenticated`/`PUBLIC`

## Open questions / UNKNOWN items
- Live grants may have changed since the last snapshot; rerun `GRANTS-LIVE.sql` and the summary/red-flag probes.
- Any grants in platform-managed schemas (`auth`, `extensions`, `graphql`, `realtime`, `storage`, `vault`, `supabase_functions`, `net`) should be reviewed for expected Supabase defaults.

Prep-only. No sweeps run. Live verification pending.
