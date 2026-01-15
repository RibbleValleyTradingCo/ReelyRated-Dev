> ⚠️ LEGACY (archived 2026-01-13)
> This file is the v1 global hardening attempt preserved for audit/history.
> Current work lives in: docs/version5/hardening/_global/v2/ (see _global/README.md).
> Do not update posture here unless you are explicitly updating legacy history notes.

# RLS Coverage Ledger

## Why this ledger exists
Supabase exposes data APIs (PostgREST and RPC) to client roles such as anon/auth, so row level security (RLS) is the primary guardrail for exposed schemas. This ledger records what migrations intend and provides SQL probes to verify the live database state. Reference: https://supabase.com/docs/guides/auth/row-level-security

## What counts as exposure
Any table or view reachable from the client via PostgREST or RPC (including indirect access through SECURITY DEFINER functions) should be treated as exposed. Use surface PIPELINE docs to map client entrypoints to specific relations.

## Summary
- Inventory reflects migration intent only; live DB must be verified with the SQL probes.
- Live snapshot includes 48 relations (43 tables, 5 views, 0 mviews) in `public` and `storage`.
- Live snapshot shows RLS disabled on: `public.catch_leaderboard_scores`, `public.catch_rating_stats`.
- Live snapshot shows 13 tables with RLS enabled but 0 policies (includes `public.community_stats_*` and multiple `storage.*` tables).
- Live policy roles include `{public}` for many policies; verify that broad role scope is intentional for each write-capable policy.

## Live inventory (from snapshot)
Derived from the pasted `RLS-COVERAGE-LIVE.sql` output below. Only relations with relkind r/p/v/m are listed.

| Schema | Relation | Type | Repo RLS | Repo FORCE | Repo policy count | Live RLS | Live FORCE | Live policy count | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| public | admin_users | table | Y | UNKNOWN | 2 | true | false | 1 |  |
| public | baits | table | Y | UNKNOWN | 1 | true | false | 1 |  |
| public | catch_comments | table | Y | UNKNOWN | 7 | true | false | 6 |  |
| public | catch_comments_with_admin | view | N/A | N/A | N/A | false | false | 0 | View/mview (RLS N/A); verify view security posture + grants |
| public | catch_leaderboard_scores | table | UNKNOWN | UNKNOWN | 0/UNKNOWN | false | false | 0 | LIVE RLS disabled; Not found in migrations (verify intent) |
| public | catch_mention_candidates | view | N/A | N/A | N/A | false | false | 0 | View/mview (RLS N/A); verify view security posture + grants |
| public | catch_rating_stats | table | UNKNOWN | UNKNOWN | 0/UNKNOWN | false | false | 0 | LIVE RLS disabled; Not found in migrations (verify intent) |
| public | catch_reactions | table | Y | UNKNOWN | 4 | true | false | 4 |  |
| public | catches | table | Y | UNKNOWN | 7 | true | false | 5 |  |
| public | community_stats_live | table | Y | Y | 0/UNKNOWN | true | true | 0 | LIVE policy_count=0 |
| public | community_stats_users | table | Y | Y | 0/UNKNOWN | true | true | 0 | LIVE policy_count=0 |
| public | community_stats_waterways | table | Y | Y | 0/UNKNOWN | true | true | 0 | LIVE policy_count=0 |
| public | leaderboard_scores_detailed | view | N/A | N/A | N/A | false | false | 0 | View/mview (RLS N/A); verify view security posture + grants |
| public | moderation_log | table | Y | UNKNOWN | 1 | true | false | 1 |  |
| public | notifications | table | Y | UNKNOWN | 2 | true | false | 2 |  |
| public | profile_blocks | table | Y | Y | 6 | true | true | 6 |  |
| public | profile_follows | table | Y | UNKNOWN | 4 | true | false | 4 |  |
| public | profiles | table | Y | UNKNOWN | 2 | true | false | 2 |  |
| public | rate_limits | table | Y | UNKNOWN | 4 | true | false | 2 |  |
| public | ratings | table | Y | UNKNOWN | 5 | true | false | 4 |  |
| public | reports | table | Y | UNKNOWN | 2 | true | false | 2 |  |
| public | sessions | table | Y | UNKNOWN | 2 | true | false | 2 |  |
| public | species | table | Y | Y | 1 | true | true | 1 |  |
| public | tags | table | Y | UNKNOWN | 1 | true | false | 1 |  |
| public | user_warnings | table | Y | UNKNOWN | 1 | true | false | 1 |  |
| public | venue_events | table | Y | UNKNOWN | 1 | true | false | 1 |  |
| public | venue_opening_hours | table | Y | UNKNOWN | 4 | true | false | 4 |  |
| public | venue_owners | table | Y | UNKNOWN | 2 | true | false | 2 |  |
| public | venue_photos | table | Y | UNKNOWN | 4 | true | false | 4 |  |
| public | venue_pricing_tiers | table | Y | UNKNOWN | 4 | true | false | 4 |  |
| public | venue_ratings | table | Y | UNKNOWN | 5 | true | false | 5 |  |
| public | venue_rules | table | Y | UNKNOWN | 4 | true | false | 4 |  |
| public | venue_species_stock | table | Y | UNKNOWN | 4 | true | false | 4 |  |
| public | venue_stats | view | N/A | N/A | N/A | false | false | 0 | View/mview (RLS N/A); verify view security posture + grants |
| public | venue_stats_public | view | N/A | N/A | N/A | false | false | 0 | View/mview (RLS N/A); verify view security posture + grants |
| public | venues | table | Y | Y | 6 | true | true | 6 |  |
| public | water_types | table | Y | UNKNOWN | 1 | true | false | 1 |  |
| storage | buckets | table | UNKNOWN | UNKNOWN | 0/UNKNOWN | true | false | 0 | LIVE policy_count=0; Storage schema (platform-managed); Not found in migrations (verify intent) |
| storage | buckets_analytics | table | UNKNOWN | UNKNOWN | 0/UNKNOWN | true | false | 0 | LIVE policy_count=0; Storage schema (platform-managed); Not found in migrations (verify intent) |
| storage | buckets_vectors | table | UNKNOWN | UNKNOWN | 0/UNKNOWN | true | false | 0 | LIVE policy_count=0; Storage schema (platform-managed); Not found in migrations (verify intent) |
| storage | iceberg_namespaces | table | UNKNOWN | UNKNOWN | 0/UNKNOWN | true | false | 0 | LIVE policy_count=0; Storage schema (platform-managed); Not found in migrations (verify intent) |
| storage | iceberg_tables | table | UNKNOWN | UNKNOWN | 0/UNKNOWN | true | false | 0 | LIVE policy_count=0; Storage schema (platform-managed); Not found in migrations (verify intent) |
| storage | migrations | table | UNKNOWN | UNKNOWN | 0/UNKNOWN | true | false | 0 | LIVE policy_count=0; Storage schema (platform-managed); Not found in migrations (verify intent) |
| storage | objects | table | UNKNOWN | UNKNOWN | 8 | true | false | 6 | Storage schema (platform-managed); Not found in migrations (verify intent) |
| storage | prefixes | table | UNKNOWN | UNKNOWN | 0/UNKNOWN | true | false | 0 | LIVE policy_count=0; Storage schema (platform-managed); Not found in migrations (verify intent) |
| storage | s3_multipart_uploads | table | UNKNOWN | UNKNOWN | 0/UNKNOWN | true | false | 0 | LIVE policy_count=0; Storage schema (platform-managed); Not found in migrations (verify intent) |
| storage | s3_multipart_uploads_parts | table | UNKNOWN | UNKNOWN | 0/UNKNOWN | true | false | 0 | LIVE policy_count=0; Storage schema (platform-managed); Not found in migrations (verify intent) |
| storage | vector_indexes | table | UNKNOWN | UNKNOWN | 0/UNKNOWN | true | false | 0 | LIVE policy_count=0; Storage schema (platform-managed); Not found in migrations (verify intent) |

## Live policies summary (from snapshot)
Derived from the pasted `RLS-POLICIES-LIVE.sql` output below.

| Schema | Table | Policy | Command | Roles |
| --- | --- | --- | --- | --- |
| public | admin_users | admin_users_self_select | SELECT | {public} |
| public | baits | baits_select_all | SELECT | {public} |
| public | catch_comments | catch_comments_admin_read_all | SELECT | {public} |
| public | catch_comments | catch_comments_admin_update | UPDATE | {public} |
| public | catch_comments | catch_comments_insert_viewable | INSERT | {public} |
| public | catch_comments | catch_comments_public_read | SELECT | {public} |
| public | catch_comments | catch_comments_select_viewable | SELECT | {public} |
| public | catch_comments | catch_comments_update_owner | UPDATE | {public} |
| public | catch_reactions | catch_reactions_owner_all | ALL | {public} |
| public | catch_reactions | catch_reactions_select_viewable | SELECT | {public} |
| public | catch_reactions | catch_reactions_write_visible_unblocked_ins | INSERT | {authenticated} |
| public | catch_reactions | catch_reactions_write_visible_unblocked_upd | UPDATE | {authenticated} |
| public | catches | catches_admin_read_all | SELECT | {public} |
| public | catches | catches_owner_all | SELECT | {public} |
| public | catches | catches_owner_mutate | INSERT | {public} |
| public | catches | catches_owner_update_delete | UPDATE | {public} |
| public | catches | catches_public_read | SELECT | {public} |
| public | moderation_log | moderation_log_admin_read | SELECT | {public} |
| public | notifications | notifications_admin_read | SELECT | {public} |
| public | notifications | notifications_recipient_only | ALL | {public} |
| public | profile_blocks | profile_blocks_delete_admin_all | DELETE | {public} |
| public | profile_blocks | profile_blocks_delete_self | DELETE | {public} |
| public | profile_blocks | profile_blocks_insert_admin_all | INSERT | {public} |
| public | profile_blocks | profile_blocks_insert_self | INSERT | {public} |
| public | profile_blocks | profile_blocks_select_admin_all | SELECT | {public} |
| public | profile_blocks | profile_blocks_select_self_or_blocked | SELECT | {public} |
| public | profile_follows | profile_follows_admin_select_all | SELECT | {public} |
| public | profile_follows | profile_follows_insert_not_blocked | INSERT | {authenticated} |
| public | profile_follows | profile_follows_owner_all | ALL | {public} |
| public | profile_follows | profile_follows_select_related | SELECT | {public} |
| public | profiles | profiles_select_all | SELECT | {public} |
| public | profiles | profiles_update_self | UPDATE | {public} |
| public | rate_limits | rate_limits_admin_select | SELECT | {public} |
| public | rate_limits | rate_limits_self_insert | INSERT | {authenticated} |
| public | ratings | ratings_owner_mutate | ALL | {public} |
| public | ratings | ratings_read_visible_catches | SELECT | {public} |
| public | ratings | ratings_write_visible_unblocked_ins | INSERT | {authenticated} |
| public | ratings | ratings_write_visible_unblocked_upd | UPDATE | {authenticated} |
| public | reports | reports_admin_all | ALL | {public} |
| public | reports | reports_owner_all | ALL | {public} |
| public | sessions | sessions_modify_own | ALL | {public} |
| public | sessions | sessions_select_own | SELECT | {public} |
| public | species | species_select_all | SELECT | {public} |
| public | tags | tags_select_all | SELECT | {public} |
| public | user_warnings | user_warnings_admin_read | SELECT | {public} |
| public | venue_events | venue_events_select_published | SELECT | {public} |
| public | venue_opening_hours | venue_opening_hours_delete | DELETE | {authenticated} |
| public | venue_opening_hours | venue_opening_hours_insert | INSERT | {authenticated} |
| public | venue_opening_hours | venue_opening_hours_select | SELECT | {public} |
| public | venue_opening_hours | venue_opening_hours_update | UPDATE | {authenticated} |
| public | venue_owners | venue_owners_admin_all | ALL | {public} |
| public | venue_owners | venue_owners_self_select | SELECT | {public} |
| public | venue_photos | venue_photos_delete | DELETE | {authenticated} |
| public | venue_photos | venue_photos_insert | INSERT | {authenticated} |
| public | venue_photos | venue_photos_select | SELECT | {public} |
| public | venue_photos | venue_photos_update | UPDATE | {authenticated} |
| public | venue_pricing_tiers | venue_pricing_tiers_delete | DELETE | {authenticated} |
| public | venue_pricing_tiers | venue_pricing_tiers_insert | INSERT | {authenticated} |
| public | venue_pricing_tiers | venue_pricing_tiers_select | SELECT | {public} |
| public | venue_pricing_tiers | venue_pricing_tiers_update | UPDATE | {authenticated} |
| public | venue_ratings | Admins can select all venue ratings | SELECT | {public} |
| public | venue_ratings | Allow users to delete own venue ratings | DELETE | {public} |
| public | venue_ratings | Allow users to insert own venue ratings | INSERT | {public} |
| public | venue_ratings | Allow users to select own venue ratings | SELECT | {public} |
| public | venue_ratings | Allow users to update own venue ratings | UPDATE | {public} |
| public | venue_rules | venue_rules_delete | DELETE | {authenticated} |
| public | venue_rules | venue_rules_insert | INSERT | {authenticated} |
| public | venue_rules | venue_rules_select | SELECT | {public} |
| public | venue_rules | venue_rules_update | UPDATE | {authenticated} |
| public | venue_species_stock | venue_species_stock_delete | DELETE | {authenticated} |
| public | venue_species_stock | venue_species_stock_insert | INSERT | {authenticated} |
| public | venue_species_stock | venue_species_stock_select | SELECT | {public} |
| public | venue_species_stock | venue_species_stock_update | UPDATE | {authenticated} |
| public | venues | venues_insert_admin_only | INSERT | {public} |
| public | venues | venues_select_admin_all | SELECT | {public} |
| public | venues | venues_select_owner | SELECT | {public} |
| public | venues | venues_select_published | SELECT | {public} |
| public | venues | venues_update_admin_all | UPDATE | {public} |
| public | venues | venues_update_owner | UPDATE | {public} |
| public | water_types | water_types_select_all | SELECT | {public} |
| storage | objects | avatars_authenticated_manage_own | ALL | {authenticated} |
| storage | objects | avatars_public_read | SELECT | {public} |
| storage | objects | catches_authenticated_manage | ALL | {authenticated} |
| storage | objects | catches_public_read | SELECT | {public} |
| storage | objects | venue_photos_authenticated_manage | ALL | {authenticated} |
| storage | objects | venue_photos_public_read | SELECT | {public} |

## SQL probes (copy/paste)
```sql
-- RLS coverage snapshot across target schemas (public, storage).
-- relkind: r=table, p=partitioned table, v=view, m=materialized view, f=foreign table.
with rels as (
  select
    n.nspname as schemaname,
    c.relname,
    c.relkind,
    c.relowner::regrole as owner,
    c.relrowsecurity,
    c.relforcerowsecurity
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public', 'storage')
)
select
  rels.schemaname,
  rels.relname,
  rels.relkind,
  rels.owner,
  rels.relrowsecurity,
  rels.relforcerowsecurity,
  coalesce(p.policy_count, 0) as policy_count
from rels
left join (
  select schemaname, tablename, count(*) as policy_count
  from pg_policies
  where schemaname in ('public', 'storage')
  group by schemaname, tablename
) p
  on p.schemaname = rels.schemaname and p.tablename = rels.relname
order by rels.schemaname, rels.relname;
```

```sql
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;
```
## Repo-derived RLS inventory (migrations intent)
Statements scanned in `supabase/migrations`: `ALTER TABLE ... ENABLE/FORCE ROW LEVEL SECURITY` and `CREATE/ALTER/DROP POLICY`. Policy names listed here come from `CREATE POLICY` statements and may be altered or dropped later in migrations, so confirm the live state using the SQL probes.

| Schema | Table | RLS enabled in migrations? | FORCE RLS in migrations? | Policies defined in migrations? | Notes |
| --- | --- | --- | --- | --- | --- |
| public | admin_users | Y | N | 2: admin_users_select_all, admin_users_self_select | Enable: 1004_policies_and_grants.sql |
| public | baits | Y | N | 1: baits_select_all | Enable: 1004_policies_and_grants.sql |
| public | catch_comments | Y | N | 7: catch_comments_admin_read_all, catch_comments_admin_update, catch_comments_insert_viewable, catch_comments_owner_all, catch_comments_public_read, catch_comments_select_viewable, catch_comments_update_owner | Enable: 1004_policies_and_grants.sql |
| public | catch_reactions | Y | N | 4: catch_reactions_owner_all, catch_reactions_select_viewable, catch_reactions_write_visible_unblocked_ins, catch_reactions_write_visible_unblocked_upd | Enable: 1004_policies_and_grants.sql |
| public | catches | Y | N | 7: catches_admin_read_all, catches_followers_read, catches_owner_all, catches_owner_mutate, catches_owner_update_delete, catches_public_read, catches_select_viewable | Enable: 1004_policies_and_grants.sql |
| public | community_stats_live | Y | Y | 0 (none found) | Enable/Force: 2138_lockdown_community_stats_tables.sql |
| public | community_stats_users | Y | Y | 0 (none found) | Enable/Force: 2138_lockdown_community_stats_tables.sql |
| public | community_stats_waterways | Y | Y | 0 (none found) | Enable/Force: 2138_lockdown_community_stats_tables.sql |
| public | moderation_log | Y | N | 1: moderation_log_admin_read | Enable: 1004_policies_and_grants.sql |
| public | notifications | Y | N | 2: notifications_admin_read, notifications_recipient_only | Enable: 1004_policies_and_grants.sql |
| public | profile_blocks | Y | Y | 6: profile_blocks_delete_admin_all, profile_blocks_delete_self, profile_blocks_insert_admin_all, profile_blocks_insert_self, profile_blocks_select_admin_all, profile_blocks_select_self_or_blocked | Enable/Force: 2085_profile_blocks_rls.sql |
| public | profile_follows | Y | N | 4: profile_follows_admin_select_all, profile_follows_insert_not_blocked, profile_follows_owner_all, profile_follows_select_related | Enable: 1004_policies_and_grants.sql |
| public | profiles | Y | N | 2: profiles_select_all, profiles_update_self | Enable: 1004_policies_and_grants.sql |
| public | rate_limits | Y | N | 4: rate_limits_admin_select, rate_limits_owner_all, rate_limits_owner_insert, rate_limits_self_insert | Enable: 1004_policies_and_grants.sql; policy changes: 2091_rate_limits_insert_policy.sql, 2114_rate_limits_rls_insert_fix.sql |
| public | ratings | Y | N | 5: ratings_owner_all, ratings_owner_mutate, ratings_read_visible_catches, ratings_write_visible_unblocked_ins, ratings_write_visible_unblocked_upd | Enable: 1004_policies_and_grants.sql |
| public | reports | Y | N | 2: reports_admin_all, reports_owner_all | Enable: 1004_policies_and_grants.sql |
| public | sessions | Y | N | 2: sessions_modify_own, sessions_select_own | Enable: 1004_policies_and_grants.sql |
| public | species | Y | Y | 1: species_select_all | Enable: 2139_species_canonical.sql; Force: 2140_lockdown_species_privileges.sql |
| public | tags | Y | N | 1: tags_select_all | Enable: 1004_policies_and_grants.sql |
| public | user_warnings | Y | N | 1: user_warnings_admin_read | Enable: 1004_policies_and_grants.sql |
| public | venue_events | Y | N | 1: venue_events_select_published | Enable: 2069_venue_events_schema.sql |
| public | venue_opening_hours | Y | N | 4: venue_opening_hours_delete, venue_opening_hours_insert, venue_opening_hours_select, venue_opening_hours_update | Enable: 2118_venue_owner_phase1_mvp.sql |
| public | venue_owners | Y | N | 2: venue_owners_admin_all, venue_owners_self_select | Enable: 2073_venue_owners_and_owner_rpcs.sql |
| public | venue_photos | Y | N | 4: venue_photos_delete, venue_photos_insert, venue_photos_select, venue_photos_update | Enable: 2078_venue_photos_and_rpcs.sql |
| public | venue_pricing_tiers | Y | N | 4: venue_pricing_tiers_delete, venue_pricing_tiers_insert, venue_pricing_tiers_select, venue_pricing_tiers_update | Enable: 2118_venue_owner_phase1_mvp.sql |
| public | venue_ratings | Y | N | 5: Admins can select all venue ratings, Allow users to delete own venue ratings, Allow users to insert own venue ratings, Allow users to select own venue ratings, Allow users to update own venue ratings | Enable: 2079_create_venue_ratings.sql |
| public | venue_rules | Y | N | 4: venue_rules_delete, venue_rules_insert, venue_rules_select, venue_rules_update | Enable: 2118_venue_owner_phase1_mvp.sql |
| public | venue_species_stock | Y | N | 4: venue_species_stock_delete, venue_species_stock_insert, venue_species_stock_select, venue_species_stock_update | Enable: 2123_create_venue_species_stock.sql |
| public | venues | Y | Y | 6: venues_insert_admin_only, venues_select_admin_all, venues_select_owner, venues_select_published, venues_update_admin_all, venues_update_owner | Enable/Force: 2086_venues_rls.sql |
| public | water_types | Y | N | 1: water_types_select_all | Enable: 1004_policies_and_grants.sql |
| storage | objects | UNKNOWN | UNKNOWN | 8: Public read access to catches, Users can manage own catches, avatars_authenticated_manage_own, avatars_public_read, catches_authenticated_manage, catches_public_read, venue_photos_authenticated_manage, venue_photos_public_read | Storage schema managed outside migrations; verify RLS/force in live DB using `docs/version5/hardening/_global/legacy/sql/RLS-COVERAGE-LIVE.sql`. |

## Global risk flags (review checklist)
- [ ] Views/mviews with sensitive data should use security_invoker (where available) or tight grants
- [ ] Policies with roles `{public}` for write-capable commands (INSERT/UPDATE/DELETE/ALL) require explicit intent
- [ ] Tables in `public` with `relrowsecurity = false` (HIGH)
- [ ] Tables with RLS enabled but 0 policies (verify intended deny-by-default)
- [ ] Policies that include role `public` or `anon` (require explicit intent)
- [ ] Tables with FORCE RLS off where table owner privileges could matter (review)

## How to run live verification
1) Run `docs/version5/hardening/_global/legacy/sql/RLS-COVERAGE-LIVE.sql` in the Supabase SQL editor.
2) Run `docs/version5/hardening/_global/legacy/sql/RLS-POLICIES-LIVE.sql` in the Supabase SQL editor.
3) Paste the outputs below under "LIVE DB snapshot" for an audited record.

## LIVE DB snapshot (paste outputs)
### RLS coverage output
[
  {
    "schemaname": "public",
    "relname": "admin_users",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 1
  },
  {
    "schemaname": "public",
    "relname": "admin_users_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "baits",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 1
  },
  {
    "schemaname": "public",
    "relname": "baits_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "catch_comments",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 6
  },
  {
    "schemaname": "public",
    "relname": "catch_comments_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "catch_comments_with_admin",
    "relkind": "v",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "catch_leaderboard_scores",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "catch_leaderboard_scores_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "catch_mention_candidates",
    "relkind": "v",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "catch_rating_stats",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "catch_rating_stats_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "catch_reactions",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 4
  },
  {
    "schemaname": "public",
    "relname": "catch_reactions_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "catches",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 5
  },
  {
    "schemaname": "public",
    "relname": "catches_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "community_stats_live",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": true,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "community_stats_live_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "community_stats_users",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": true,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "community_stats_users_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "community_stats_waterways",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": true,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "community_stats_waterways_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_catch_comments_catch_id",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_catch_comments_catch_parent_created",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_catch_comments_user_id",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_catch_leaderboard_scores_ordering",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_catch_leaderboard_scores_species_ordering",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_catches_created_deleted_visibility",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_catches_public_visible_created_id",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_catches_session_id",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_catches_species_coalesce",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_catches_user_id",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_catches_venue_created_at",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_catches_venue_weight",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_moderation_log_action_created",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_notifications_user_created",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_profile_blocks_blocked_id",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_profile_blocks_blocker_id",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_profiles_deleted_at",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_profiles_is_deleted",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_profiles_is_private",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_profiles_username",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_rate_limits_user_action_created",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_ratings_catch_id",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_reports_status_created",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_reports_target",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_sessions_user_date",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_venue_events_starts_at",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_venue_events_venue_starts_at",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_venue_opening_hours_venue_order",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_venue_owners_user_id",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_venue_owners_venue_id",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_venue_photos_venue_primary_created",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_venue_pricing_tiers_venue_order",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_venue_species_stock_venue_created",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_venues_is_published",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_venues_name",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "idx_venues_slug",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "leaderboard_scores_detailed",
    "relkind": "v",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "moderation_log",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 1
  },
  {
    "schemaname": "public",
    "relname": "moderation_log_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "notifications",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 2
  },
  {
    "schemaname": "public",
    "relname": "notifications_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "profile_blocks",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": true,
    "policy_count": 6
  },
  {
    "schemaname": "public",
    "relname": "profile_blocks_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "profile_follows",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 4
  },
  {
    "schemaname": "public",
    "relname": "profile_follows_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "profiles",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 2
  },
  {
    "schemaname": "public",
    "relname": "profiles_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "profiles_username_key",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "rate_limits",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 2
  },
  {
    "schemaname": "public",
    "relname": "rate_limits_id_seq",
    "relkind": "S",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "rate_limits_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "ratings",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 4
  },
  {
    "schemaname": "public",
    "relname": "ratings_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "reports",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 2
  },
  {
    "schemaname": "public",
    "relname": "reports_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "sessions",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 2
  },
  {
    "schemaname": "public",
    "relname": "sessions_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "species",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": true,
    "policy_count": 1
  },
  {
    "schemaname": "public",
    "relname": "species_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "tags",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 1
  },
  {
    "schemaname": "public",
    "relname": "tags_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "uq_catch_reactions_user_catch",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "uq_notifications_like_follow_once",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "uq_profile_follows_pair",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "uq_ratings_user_catch",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "user_warnings",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 1
  },
  {
    "schemaname": "public",
    "relname": "user_warnings_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "venue_events",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 1
  },
  {
    "schemaname": "public",
    "relname": "venue_events_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "venue_opening_hours",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 4
  },
  {
    "schemaname": "public",
    "relname": "venue_opening_hours_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "venue_owners",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 2
  },
  {
    "schemaname": "public",
    "relname": "venue_owners_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "venue_photos",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 4
  },
  {
    "schemaname": "public",
    "relname": "venue_photos_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "venue_photos_primary_unique",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "venue_pricing_tiers",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 4
  },
  {
    "schemaname": "public",
    "relname": "venue_pricing_tiers_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "venue_ratings",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 5
  },
  {
    "schemaname": "public",
    "relname": "venue_ratings_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "venue_ratings_user_venue_idx",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "venue_ratings_venue_id_idx",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "venue_ratings_venue_id_user_id_key",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "venue_rules",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 4
  },
  {
    "schemaname": "public",
    "relname": "venue_rules_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "venue_species_stock",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 4
  },
  {
    "schemaname": "public",
    "relname": "venue_species_stock_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "venue_stats",
    "relkind": "v",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "venue_stats_public",
    "relkind": "v",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "venues",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": true,
    "policy_count": 6
  },
  {
    "schemaname": "public",
    "relname": "venues_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "venues_slug_key",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "public",
    "relname": "water_types",
    "relkind": "r",
    "owner": "postgres",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 1
  },
  {
    "schemaname": "public",
    "relname": "water_types_pkey",
    "relkind": "i",
    "owner": "postgres",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "bname",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "bucketid_objname",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "buckets",
    "relkind": "r",
    "owner": "supabase_storage_admin",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "buckets_analytics",
    "relkind": "r",
    "owner": "supabase_storage_admin",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "buckets_analytics_pkey",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "buckets_analytics_unique_name_idx",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "buckets_pkey",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "buckets_vectors",
    "relkind": "r",
    "owner": "supabase_storage_admin",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "buckets_vectors_pkey",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "iceberg_namespaces",
    "relkind": "r",
    "owner": "supabase_storage_admin",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "iceberg_namespaces_pkey",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "iceberg_tables",
    "relkind": "r",
    "owner": "supabase_storage_admin",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "iceberg_tables_pkey",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "idx_iceberg_namespaces_bucket_id",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "idx_iceberg_tables_location",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "idx_iceberg_tables_namespace_id",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "idx_multipart_uploads_list",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "idx_name_bucket_level_unique",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "idx_objects_bucket_id_name",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "idx_objects_lower_name",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "idx_prefixes_lower_name",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "migrations",
    "relkind": "r",
    "owner": "supabase_storage_admin",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "migrations_name_key",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "migrations_pkey",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "name_prefix_search",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "objects",
    "relkind": "r",
    "owner": "supabase_storage_admin",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 6
  },
  {
    "schemaname": "storage",
    "relname": "objects_bucket_id_level_idx",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "objects_pkey",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "prefixes",
    "relkind": "r",
    "owner": "supabase_storage_admin",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "prefixes_pkey",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "s3_multipart_uploads",
    "relkind": "r",
    "owner": "supabase_storage_admin",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "s3_multipart_uploads_parts",
    "relkind": "r",
    "owner": "supabase_storage_admin",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "s3_multipart_uploads_parts_pkey",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "s3_multipart_uploads_pkey",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "vector_indexes",
    "relkind": "r",
    "owner": "supabase_storage_admin",
    "relrowsecurity": true,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "vector_indexes_name_bucket_id_idx",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  },
  {
    "schemaname": "storage",
    "relname": "vector_indexes_pkey",
    "relkind": "i",
    "owner": "supabase_storage_admin",
    "relrowsecurity": false,
    "relforcerowsecurity": false,
    "policy_count": 0
  }
]

### RLS policies output
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
  },
  {
    "schemaname": "public",
    "tablename": "baits",
    "policyname": "baits_select_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "catch_comments",
    "policyname": "catch_comments_admin_read_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "is_admin(uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "catch_comments",
    "policyname": "catch_comments_admin_update",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "is_admin(uid())",
    "with_check": "is_admin(uid())"
  },
  {
    "schemaname": "public",
    "tablename": "catch_comments",
    "policyname": "catch_comments_insert_viewable",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(((user_id = uid()) OR is_admin(uid())) AND (EXISTS ( SELECT 1\n   FROM catches c\n  WHERE ((c.id = catch_comments.catch_id) AND (c.deleted_at IS NULL) AND ((c.user_id = uid()) OR (c.visibility = 'public'::visibility_type) OR ((c.visibility = 'followers'::visibility_type) AND (uid() IS NOT NULL) AND is_following(uid(), c.user_id)) OR is_admin(uid()))))))"
  },
  {
    "schemaname": "public",
    "tablename": "catch_comments",
    "policyname": "catch_comments_public_read",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((deleted_at IS NULL) AND (EXISTS ( SELECT 1\n   FROM catches c\n  WHERE ((c.id = catch_comments.catch_id) AND (c.deleted_at IS NULL) AND ((uid() = c.user_id) OR (EXISTS ( SELECT 1\n           FROM admin_users au\n          WHERE (au.user_id = uid()))) OR ((NOT is_blocked_either_way(uid(), c.user_id)) AND (NOT is_blocked_either_way(uid(), catch_comments.user_id)) AND (((c.visibility = 'public'::visibility_type) AND ((NOT (EXISTS ( SELECT 1\n           FROM profiles p\n          WHERE ((p.id = c.user_id) AND (p.is_private = true))))) OR ((uid() IS NOT NULL) AND (EXISTS ( SELECT 1\n           FROM profile_follows pf\n          WHERE ((pf.follower_id = uid()) AND (pf.following_id = c.user_id))))))) OR ((c.visibility = 'followers'::visibility_type) AND (uid() IS NOT NULL) AND (EXISTS ( SELECT 1\n           FROM profile_follows pf\n          WHERE ((pf.follower_id = uid()) AND (pf.following_id = c.user_id))))))))))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "catch_comments",
    "policyname": "catch_comments_select_viewable",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((EXISTS ( SELECT 1\n   FROM catches c\n  WHERE ((c.id = catch_comments.catch_id) AND (c.deleted_at IS NULL) AND ((c.user_id = uid()) OR (c.visibility = 'public'::visibility_type) OR ((c.visibility = 'followers'::visibility_type) AND (uid() IS NOT NULL) AND is_following(uid(), c.user_id)) OR is_admin(uid()))))) AND ((deleted_at IS NULL) OR is_admin(uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "catch_comments",
    "policyname": "catch_comments_update_owner",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(uid() = user_id)",
    "with_check": "(uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "catch_reactions",
    "policyname": "catch_reactions_owner_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(uid() = user_id)",
    "with_check": "(uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "catch_reactions",
    "policyname": "catch_reactions_select_viewable",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM catches c\n  WHERE ((c.id = catch_reactions.catch_id) AND (c.deleted_at IS NULL) AND ((c.user_id = uid()) OR (c.visibility = 'public'::visibility_type) OR ((c.visibility = 'followers'::visibility_type) AND (uid() IS NOT NULL) AND is_following(uid(), c.user_id)) OR is_admin(uid())))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "catch_reactions",
    "policyname": "catch_reactions_write_visible_unblocked_ins",
    "permissive": "RESTRICTIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((uid() IS NOT NULL) AND (user_id = uid()) AND (EXISTS ( SELECT 1\n   FROM catches c\n  WHERE ((c.id = catch_reactions.catch_id) AND (c.deleted_at IS NULL) AND (NOT is_blocked_either_way(uid(), c.user_id)) AND (c.user_id <> uid()) AND (is_admin(uid()) OR (c.visibility = 'public'::visibility_type) OR ((c.visibility = 'followers'::visibility_type) AND is_following(uid(), c.user_id)))))))"
  },
  {
    "schemaname": "public",
    "tablename": "catch_reactions",
    "policyname": "catch_reactions_write_visible_unblocked_upd",
    "permissive": "RESTRICTIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "((uid() IS NOT NULL) AND (user_id = uid()) AND (EXISTS ( SELECT 1\n   FROM catches c\n  WHERE ((c.id = catch_reactions.catch_id) AND (c.deleted_at IS NULL) AND (NOT is_blocked_either_way(uid(), c.user_id)) AND (c.user_id <> uid()) AND (is_admin(uid()) OR (c.visibility = 'public'::visibility_type) OR ((c.visibility = 'followers'::visibility_type) AND is_following(uid(), c.user_id)))))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "catches",
    "policyname": "catches_admin_read_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "is_admin(uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "catches",
    "policyname": "catches_owner_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "catches",
    "policyname": "catches_owner_mutate",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((uid() = user_id) AND (NOT is_admin(uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "catches",
    "policyname": "catches_owner_update_delete",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "((uid() = user_id) AND (NOT is_admin(uid())))",
    "with_check": "((uid() = user_id) AND (NOT is_admin(uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "catches",
    "policyname": "catches_public_read",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((deleted_at IS NULL) AND ((uid() = user_id) OR (EXISTS ( SELECT 1\n   FROM admin_users au\n  WHERE (au.user_id = uid()))) OR ((COALESCE(is_blocked_either_way(uid(), user_id), false) = false) AND (((visibility = 'public'::visibility_type) AND ((NOT (EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = catches.user_id) AND (p.is_private = true))))) OR ((uid() IS NOT NULL) AND (EXISTS ( SELECT 1\n   FROM profile_follows pf\n  WHERE ((pf.follower_id = uid()) AND (pf.following_id = catches.user_id))))))) OR ((visibility = 'followers'::visibility_type) AND (uid() IS NOT NULL) AND (EXISTS ( SELECT 1\n   FROM profile_follows pf\n  WHERE ((pf.follower_id = uid()) AND (pf.following_id = catches.user_id)))))))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "moderation_log",
    "policyname": "moderation_log_admin_read",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "is_admin(uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "notifications",
    "policyname": "notifications_admin_read",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "is_admin(uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "notifications",
    "policyname": "notifications_recipient_only",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(uid() = user_id)",
    "with_check": "(uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "profile_blocks",
    "policyname": "profile_blocks_delete_admin_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(EXISTS ( SELECT 1\n   FROM admin_users au\n  WHERE (au.user_id = uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profile_blocks",
    "policyname": "profile_blocks_delete_self",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(uid() = blocker_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profile_blocks",
    "policyname": "profile_blocks_insert_admin_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(EXISTS ( SELECT 1\n   FROM admin_users au\n  WHERE (au.user_id = uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "profile_blocks",
    "policyname": "profile_blocks_insert_self",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(uid() = blocker_id)"
  },
  {
    "schemaname": "public",
    "tablename": "profile_blocks",
    "policyname": "profile_blocks_select_admin_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM admin_users au\n  WHERE (au.user_id = uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profile_blocks",
    "policyname": "profile_blocks_select_self_or_blocked",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((uid() = blocker_id) OR (uid() = blocked_id))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profile_follows",
    "policyname": "profile_follows_admin_select_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "is_admin(uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profile_follows",
    "policyname": "profile_follows_insert_not_blocked",
    "permissive": "RESTRICTIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((uid() = follower_id) AND (following_id <> uid()) AND (NOT is_blocked_either_way(uid(), following_id)))"
  },
  {
    "schemaname": "public",
    "tablename": "profile_follows",
    "policyname": "profile_follows_owner_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(uid() = follower_id)",
    "with_check": "(uid() = follower_id)"
  },
  {
    "schemaname": "public",
    "tablename": "profile_follows",
    "policyname": "profile_follows_select_related",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((uid() = follower_id) OR (uid() = following_id))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "profiles_select_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "profiles_update_self",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(uid() = id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "rate_limits",
    "policyname": "rate_limits_admin_select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM admin_users au\n  WHERE (au.user_id = uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "rate_limits",
    "policyname": "rate_limits_self_insert",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "ratings",
    "policyname": "ratings_owner_mutate",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(uid() = user_id)",
    "with_check": "(uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "ratings",
    "policyname": "ratings_read_visible_catches",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM catches c\n  WHERE ((c.id = ratings.catch_id) AND (c.deleted_at IS NULL) AND (is_admin(uid()) OR (c.user_id = uid()) OR ((uid() IS NULL) AND (c.visibility = 'public'::visibility_type)) OR ((uid() IS NOT NULL) AND (NOT is_admin(uid())) AND ((c.visibility = 'public'::visibility_type) OR ((c.visibility = 'followers'::visibility_type) AND is_following(uid(), c.user_id))))))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "ratings",
    "policyname": "ratings_write_visible_unblocked_ins",
    "permissive": "RESTRICTIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((uid() IS NOT NULL) AND (user_id = uid()) AND (EXISTS ( SELECT 1\n   FROM catches c\n  WHERE ((c.id = ratings.catch_id) AND (c.deleted_at IS NULL) AND (c.allow_ratings IS TRUE) AND (NOT is_blocked_either_way(uid(), c.user_id)) AND (c.user_id <> uid()) AND (is_admin(uid()) OR (c.visibility = 'public'::visibility_type) OR ((c.visibility = 'followers'::visibility_type) AND is_following(uid(), c.user_id)))))))"
  },
  {
    "schemaname": "public",
    "tablename": "ratings",
    "policyname": "ratings_write_visible_unblocked_upd",
    "permissive": "RESTRICTIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "((uid() IS NOT NULL) AND (user_id = uid()) AND (EXISTS ( SELECT 1\n   FROM catches c\n  WHERE ((c.id = ratings.catch_id) AND (c.deleted_at IS NULL) AND (c.allow_ratings IS TRUE) AND (NOT is_blocked_either_way(uid(), c.user_id)) AND (c.user_id <> uid()) AND (is_admin(uid()) OR (c.visibility = 'public'::visibility_type) OR ((c.visibility = 'followers'::visibility_type) AND is_following(uid(), c.user_id)))))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "reports",
    "policyname": "reports_admin_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "is_admin(uid())",
    "with_check": "is_admin(uid())"
  },
  {
    "schemaname": "public",
    "tablename": "reports",
    "policyname": "reports_owner_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(uid() = reporter_id)",
    "with_check": "(uid() = reporter_id)"
  },
  {
    "schemaname": "public",
    "tablename": "sessions",
    "policyname": "sessions_modify_own",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(uid() = user_id)",
    "with_check": "(uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "sessions",
    "policyname": "sessions_select_own",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "species",
    "policyname": "species_select_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "tags",
    "policyname": "tags_select_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "user_warnings",
    "policyname": "user_warnings_admin_read",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "is_admin(uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "venue_events",
    "policyname": "venue_events_select_published",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(is_published = true)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "venue_opening_hours",
    "policyname": "venue_opening_hours_delete",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "is_venue_admin_or_owner(venue_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "venue_opening_hours",
    "policyname": "venue_opening_hours_insert",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "is_venue_admin_or_owner(venue_id)"
  },
  {
    "schemaname": "public",
    "tablename": "venue_opening_hours",
    "policyname": "venue_opening_hours_select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM venues v\n  WHERE ((v.id = venue_opening_hours.venue_id) AND (v.is_published OR is_venue_admin_or_owner(v.id)))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "venue_opening_hours",
    "policyname": "venue_opening_hours_update",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "is_venue_admin_or_owner(venue_id)",
    "with_check": "is_venue_admin_or_owner(venue_id)"
  },
  {
    "schemaname": "public",
    "tablename": "venue_owners",
    "policyname": "venue_owners_admin_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM admin_users au\n  WHERE (au.user_id = uid())))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM admin_users au\n  WHERE (au.user_id = uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "venue_owners",
    "policyname": "venue_owners_self_select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "venue_photos",
    "policyname": "venue_photos_delete",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "is_venue_admin_or_owner(venue_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "venue_photos",
    "policyname": "venue_photos_insert",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "is_venue_admin_or_owner(venue_id)"
  },
  {
    "schemaname": "public",
    "tablename": "venue_photos",
    "policyname": "venue_photos_select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM venues v\n  WHERE ((v.id = venue_photos.venue_id) AND (v.is_published OR is_venue_admin_or_owner(v.id)))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "venue_photos",
    "policyname": "venue_photos_update",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "is_venue_admin_or_owner(venue_id)",
    "with_check": "is_venue_admin_or_owner(venue_id)"
  },
  {
    "schemaname": "public",
    "tablename": "venue_pricing_tiers",
    "policyname": "venue_pricing_tiers_delete",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "is_venue_admin_or_owner(venue_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "venue_pricing_tiers",
    "policyname": "venue_pricing_tiers_insert",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "is_venue_admin_or_owner(venue_id)"
  },
  {
    "schemaname": "public",
    "tablename": "venue_pricing_tiers",
    "policyname": "venue_pricing_tiers_select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM venues v\n  WHERE ((v.id = venue_pricing_tiers.venue_id) AND (v.is_published OR is_venue_admin_or_owner(v.id)))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "venue_pricing_tiers",
    "policyname": "venue_pricing_tiers_update",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "is_venue_admin_or_owner(venue_id)",
    "with_check": "is_venue_admin_or_owner(venue_id)"
  },
  {
    "schemaname": "public",
    "tablename": "venue_ratings",
    "policyname": "Admins can select all venue ratings",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "is_admin(uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "venue_ratings",
    "policyname": "Allow users to delete own venue ratings",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(user_id = uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "venue_ratings",
    "policyname": "Allow users to insert own venue ratings",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_id = uid())"
  },
  {
    "schemaname": "public",
    "tablename": "venue_ratings",
    "policyname": "Allow users to select own venue ratings",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_id = uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "venue_ratings",
    "policyname": "Allow users to update own venue ratings",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(user_id = uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "venue_rules",
    "policyname": "venue_rules_delete",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "is_venue_admin_or_owner(venue_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "venue_rules",
    "policyname": "venue_rules_insert",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "is_venue_admin_or_owner(venue_id)"
  },
  {
    "schemaname": "public",
    "tablename": "venue_rules",
    "policyname": "venue_rules_select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM venues v\n  WHERE ((v.id = venue_rules.venue_id) AND (v.is_published OR is_venue_admin_or_owner(v.id)))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "venue_rules",
    "policyname": "venue_rules_update",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "is_venue_admin_or_owner(venue_id)",
    "with_check": "is_venue_admin_or_owner(venue_id)"
  },
  {
    "schemaname": "public",
    "tablename": "venue_species_stock",
    "policyname": "venue_species_stock_delete",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "is_venue_admin_or_owner(venue_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "venue_species_stock",
    "policyname": "venue_species_stock_insert",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "is_venue_admin_or_owner(venue_id)"
  },
  {
    "schemaname": "public",
    "tablename": "venue_species_stock",
    "policyname": "venue_species_stock_select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM venues v\n  WHERE ((v.id = venue_species_stock.venue_id) AND (v.is_published OR is_venue_admin_or_owner(v.id)))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "venue_species_stock",
    "policyname": "venue_species_stock_update",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "is_venue_admin_or_owner(venue_id)",
    "with_check": "is_venue_admin_or_owner(venue_id)"
  },
  {
    "schemaname": "public",
    "tablename": "venues",
    "policyname": "venues_insert_admin_only",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(EXISTS ( SELECT 1\n   FROM admin_users au\n  WHERE (au.user_id = uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "venues",
    "policyname": "venues_select_admin_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM admin_users au\n  WHERE (au.user_id = uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "venues",
    "policyname": "venues_select_owner",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM venue_owners vo\n  WHERE ((vo.venue_id = venues.id) AND (vo.user_id = uid()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "venues",
    "policyname": "venues_select_published",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(is_published = true)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "venues",
    "policyname": "venues_update_admin_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(EXISTS ( SELECT 1\n   FROM admin_users au\n  WHERE (au.user_id = uid())))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM admin_users au\n  WHERE (au.user_id = uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "venues",
    "policyname": "venues_update_owner",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(EXISTS ( SELECT 1\n   FROM venue_owners vo\n  WHERE ((vo.venue_id = venues.id) AND (vo.user_id = uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM venue_owners vo\n  WHERE ((vo.venue_id = venues.id) AND (vo.user_id = uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "water_types",
    "policyname": "water_types_select_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "storage",
    "tablename": "objects",
    "policyname": "avatars_authenticated_manage_own",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "((bucket_id = 'avatars'::text) AND ((uid())::text = split_part(name, '/'::text, 1)))",
    "with_check": "((bucket_id = 'avatars'::text) AND ((uid())::text = split_part(name, '/'::text, 1)))"
  },
  {
    "schemaname": "storage",
    "tablename": "objects",
    "policyname": "avatars_public_read",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(bucket_id = 'avatars'::text)",
    "with_check": null
  },
  {
    "schemaname": "storage",
    "tablename": "objects",
    "policyname": "catches_authenticated_manage",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(bucket_id = 'catches'::text)",
    "with_check": "(bucket_id = 'catches'::text)"
  },
  {
    "schemaname": "storage",
    "tablename": "objects",
    "policyname": "catches_public_read",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(bucket_id = 'catches'::text)",
    "with_check": null
  },
  {
    "schemaname": "storage",
    "tablename": "objects",
    "policyname": "venue_photos_authenticated_manage",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "((bucket_id = 'venue-photos'::text) AND is_venue_admin_or_owner(\nCASE\n    WHEN (split_part(name, '/'::text, 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) THEN (split_part(name, '/'::text, 1))::uuid\n    ELSE NULL::uuid\nEND))",
    "with_check": "((bucket_id = 'venue-photos'::text) AND is_venue_admin_or_owner(\nCASE\n    WHEN (split_part(name, '/'::text, 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) THEN (split_part(name, '/'::text, 1))::uuid\n    ELSE NULL::uuid\nEND))"
  },
  {
    "schemaname": "storage",
    "tablename": "objects",
    "policyname": "venue_photos_public_read",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(bucket_id = 'venue-photos'::text)",
    "with_check": null
  }
]

## What changed
- Created initial global RLS coverage pack; no sweeps run.
