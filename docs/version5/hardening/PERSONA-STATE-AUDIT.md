# Persona State Audit (v5)

## Scope and evidence sources

- Scope: persona contract vs current app + data-layer posture (site-wide).
- Docs used: `docs/version5/hardening/PERSONA-CONTRACTS.md`, `docs/version5/hardening/SURFACE-INVENTORY.md`, `docs/version5/hardening/AUTHZ-TEST-PLAYBOOK.md`, `docs/version5/hardening/SQL-AUTHZ-CHECKS.md`, `docs/version5/hardening/VIEWS-EXPOSURE-RULES.md`, `docs/version5/hardening/RPC-REGISTRY.md`, `docs/version5/hardening/GRANTS-LEDGER.md`, `docs/version5/hardening/_templates/verification-log-template.md`, `docs/version5/hardening/DECISIONS-AND-EXCEPTIONS.md`, `docs/version5/hardening/ROLLBACK-RUNBOOK.md`.
- Data-layer snapshot used for evidence: `supabase/_dump_schema.local.sql` (may be behind latest migrations; must be verified against live DB).
- App-layer evidence: `src/App.tsx` route definitions and per-surface page/hook files noted below.

## LIVE VERIFIED

- Status: ✅ VERIFIED (2026-01-03; JO)
- Evidence: see `GRANTS-LEDGER.md` → LIVE DB verification → function ACL snapshot (post-2156) + 2157 verification block.

## Executive summary (top findings)

- Live update (2026-01-03):
  - 2156 applied: PUBLIC/anon EXECUTE revoked for admin*\*, owner*\*, mutation, and internal helper functions (with RLS-aware safeguards).
  - 2157 applied: auth-only feed/profile read RPCs locked down (authenticated only) and check_email_exists locked down (service_role only).
  - /auth no longer performs an email-existence pre-check; password reset uses /auth/v1/recover and the HAR shows no /rpc/check_email_exists calls.

## Top findings status (tracking)

| Finding                                                             | Severity | Source         | Live verified | Evidence link                                                                                                    | Next action                                                                                   |
| ------------------------------------------------------------------- | -------- | -------------- | ------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| PUBLIC/anon EXECUTE on admin/owner/mutation RPCs                    | P0       | Live-verified  | ✅            | `GRANTS-LEDGER.md` → LIVE DB verification → function ACL snapshot                                                | ✅ Applied 2156; confirm no regressions in future ACL snapshots.                              |
| PUBLIC/anon EXECUTE on auth-only feed/profile read RPCs             | P0       | Live-verified  | ✅            | `GRANTS-LEDGER.md` → LIVE DB verification → 2157 verification (focused ACL rows)                                 | ✅ Applied 2157; include in future ACL regression checks.                                     |
| Email existence pre-check / enumeration risk (`check_email_exists`) | P0       | Live-verified  | ✅            | `GRANTS-LEDGER.md` → LIVE DB verification → 2157 verification (focused ACL rows) + `check-email-exists-call.har` | ✅ Removed from /auth flows + locked down to service_role; ensure auth toasts remain generic. |
| admin_users_select_all policy present                               | P0       | Live-verified  | ✅            | `GRANTS-LEDGER.md` → LIVE DB verification → LIVE: Policies for public schema → admin_users (LIVE)                | ✅ Confirmed absent on live DB; keep an eye on future migrations/regressions.                 |
| Over-broad anon/auth table grants (GRANT ALL)                       | P1       | Snapshot       | ⏳            | `GRANTS-LEDGER.md` → LIVE DB verification → role_table_grants output                                             | Verify RLS/policies prevent writes/leaks                                                      |
| Profile reads moderation fields (forbidden)                         | P1       | Repo-confirmed | ✅            | `PERSONA-STATE-AUDIT.md` → B4                                                                                    | Fix code/data selects; verify via HAR                                                         |
| Public surfaces select('\*') field-minimization risk                | P1       | Repo-confirmed | ⏳            | `PERSONA-STATE-AUDIT.md` → B4                                                                                    | Trim selects or use safe views; verify via HAR                                                |

Notes:

- "Source" must be one of: Snapshot / Repo-confirmed / Live-verified.
- "Live verified" remains ⏳ until live outputs are pasted into GRANTS-LEDGER (and/or HAR evidence captured where applicable) and reviewed.

  - P0: Snapshot shows PUBLIC/anon EXECUTE on many admin/owner/mutation RPCs (see Data-layer findings). If present in live DB, this violates persona contract and must be revoked.
  - P0: Snapshot includes `admin_users_select_all` policy on `public.admin_users`, which combined with broad grants could expose the admin roster. Migration `supabase/migrations/2153_admin_venues_hardening.sql` drops this policy; live DB must be verified.
  - P1: Over-broad grants to anon/auth on many tables/views (GRANT ALL) mean RLS is the only protection; verify policies and view security_invoker for all exposed views.
  - P1: Profile page still reads moderation fields (`moderation_status`, `warn_count`, `suspension_until`) via `src/components/ProfileNotificationsSection.tsx`; contract now forbids these fields in profile payloads.
  - P1: Public Venue Detail uses `select("*")` on multiple venue tables; field-level leakage risk if owner-only/internal columns exist.

## Data-layer findings

### A1) Object inventory (public schema snapshot)

- Tables (25):
  `admin_users`, `baits`, `catch_comments`, `catch_reactions`, `catches`, `moderation_log`, `notifications`, `profile_blocks`, `profile_follows`, `profiles`, `rate_limits`, `ratings`, `reports`, `sessions`, `tags`, `user_warnings`, `venue_events`, `venue_opening_hours`, `venue_owners`, `venue_photos`, `venue_pricing_tiers`, `venue_ratings`, `venue_rules`, `venues`, `water_types`.
- Views (4):
  `catch_comments_with_admin`, `catch_mention_candidates`, `leaderboard_scores_detailed`, `venue_stats`.
- Functions (79):
  `admin_add_venue_owner`, `admin_clear_moderation_status`, `admin_create_venue_event`, `admin_create_venue_opening_hour`, `admin_create_venue_pricing_tier`, `admin_delete_account`, `admin_delete_catch`, `admin_delete_comment`, `admin_delete_venue_event`, `admin_delete_venue_opening_hour`, `admin_delete_venue_pricing_tier`, `admin_get_venue_events`, `admin_list_moderation_log`, `admin_list_reports`, `admin_remove_venue_owner`, `admin_restore_catch`, `admin_restore_comment`, `admin_update_report_status`, `admin_update_venue_booking`, `admin_update_venue_event`, `admin_update_venue_metadata`, `admin_update_venue_opening_hour`, `admin_update_venue_pricing_tier`, `admin_update_venue_rules`, `admin_warn_user`, `assert_moderation_allowed`, `block_profile`, `check_email_exists`, `check_rate_limit`, `cleanup_rate_limits`, `create_comment_with_rate_limit`, `create_notification`, `create_report_with_rate_limit`, `enforce_catch_moderation`, `enforce_catch_rate_limit`, `enforce_comment_rate_limit`, `enforce_report_rate_limit`, `follow_profile_with_rate_limit`, `get_catch_rating_summary`, `get_follower_count`, `get_my_venue_rating`, `get_rate_limit_status`, `get_venue_by_slug`, `get_venue_past_events`, `get_venue_photos`, `get_venue_recent_catches`, `get_venue_top_anglers`, `get_venue_top_catches`, `get_venue_upcoming_events`, `get_venues`, `handle_new_user`, `is_admin`, `is_blocked_either_way`, `is_following`, `is_venue_admin_or_owner`, `owner_add_venue_photo`, `owner_create_venue_event`, `owner_create_venue_opening_hour`, `owner_create_venue_pricing_tier`, `owner_delete_venue_event`, `owner_delete_venue_opening_hour`, `owner_delete_venue_photo`, `owner_delete_venue_pricing_tier`, `owner_get_venue_events`, `owner_update_venue_booking`, `owner_update_venue_event`, `owner_update_venue_metadata`, `owner_update_venue_opening_hour`, `owner_update_venue_pricing_tier`, `owner_update_venue_rules`, `rate_catch_with_rate_limit`, `react_to_catch_with_rate_limit`, `request_account_deletion`, `request_account_export`, `set_updated_at`, `soft_delete_comment`, `unblock_profile`, `upsert_venue_rating`, `user_rate_limits`.

### A2) RLS enabled + policies (snapshot)

- RLS missing: none (all public tables show `ENABLE ROW LEVEL SECURITY` in snapshot).
- Policies per table (snapshot):
  - `admin_users`: `admin_users_select_all`, `admin_users_self_select`
  - `baits`: `baits_select_all`
  - `catch_comments`: `catch_comments_admin_read_all`, `catch_comments_admin_update`, `catch_comments_insert_viewable`, `catch_comments_public_read`, `catch_comments_select_viewable`, `catch_comments_update_owner`
  - `catch_reactions`: `catch_reactions_owner_all`, `catch_reactions_select_viewable`, `catch_reactions_write_visible_unblocked_ins`, `catch_reactions_write_visible_unblocked_upd`
  - `catches`: `catches_admin_read_all`, `catches_owner_all`, `catches_owner_mutate`, `catches_owner_update_delete`, `catches_public_read`
  - `moderation_log`: `moderation_log_admin_read`
  - `notifications`: `notifications_admin_read`, `notifications_recipient_only`
  - `profile_blocks`: `profile_blocks_delete_admin_all`, `profile_blocks_delete_self`, `profile_blocks_insert_admin_all`, `profile_blocks_insert_self`, `profile_blocks_select_admin_all`, `profile_blocks_select_self_or_blocked`
  - `profile_follows`: `profile_follows_admin_select_all`, `profile_follows_insert_not_blocked`, `profile_follows_owner_all`, `profile_follows_select_related`
  - `profiles`: `profiles_select_all`, `profiles_update_self`
  - `rate_limits`: `rate_limits_admin_select`, `rate_limits_self_insert`
  - `ratings`: `ratings_owner_mutate`, `ratings_read_visible_catches`, `ratings_write_visible_unblocked_ins`, `ratings_write_visible_unblocked_upd`
  - `reports`: `reports_admin_all`, `reports_owner_all`
  - `sessions`: `sessions_modify_own`, `sessions_select_own`
  - `tags`: `tags_select_all`
  - `user_warnings`: `user_warnings_admin_read`
  - `venue_events`: `venue_events_select_published`
  - `venue_opening_hours`: `venue_opening_hours_delete`, `venue_opening_hours_insert`, `venue_opening_hours_select`, `venue_opening_hours_update`
  - `venue_owners`: `venue_owners_admin_all`, `venue_owners_self_select`
  - `venue_photos`: `venue_photos_delete`, `venue_photos_insert`, `venue_photos_select`
  - `venue_pricing_tiers`: `venue_pricing_tiers_delete`, `venue_pricing_tiers_insert`, `venue_pricing_tiers_select`, `venue_pricing_tiers_update`
  - `venue_ratings`: `Admins can select all venue ratings`, `Allow users to delete own venue ratings`, `Allow users to insert own venue ratings`, `Allow users to select own venue ratings`, `Allow users to update own venue ratings`
  - `venue_rules`: `venue_rules_delete`, `venue_rules_insert`, `venue_rules_select`, `venue_rules_update`
  - `venues`: `venues_insert_admin_only`, `venues_select_admin_all`, `venues_select_owner`, `venues_select_published`, `venues_update_admin_all`, `venues_update_owner`
  - `water_types`: `water_types_select_all`

Notes:

- Snapshot includes `admin_users_select_all`, but live DB was verified on 2026-01-03: only `admin_users_self_select` exists and `admin_users_select_all` is absent (see GRANTS-LEDGER.md → LIVE DB verification → LIVE: Policies for public schema → admin_users (LIVE)).

### A3) SECURITY DEFINER + search_path pinning (snapshot)

- SECURITY DEFINER functions: 63 (all use `SET search_path` in snapshot; no missing search_path found).
- SECURITY DEFINER without pinned search_path: none found in snapshot.

### A4) Grants and EXECUTE posture (snapshot)

- Table/view grants to anon/auth (snapshot): 27 public objects grant anon; 29 grant authenticated. Many are `GRANT ALL`, which includes write privileges and relies entirely on RLS for enforcement.
- PUBLIC/anon EXECUTE on mutation/admin/owner functions (snapshot): detected on the following (partial list; see full list in queries output):
  - admin\_\* RPCs: `admin_list_reports`, `admin_update_report_status`, `admin_warn_user`, `admin_get_venue_events`, `admin_update_venue_metadata`, etc.
  - owner\_\* RPCs: `owner_get_venue_events`, `owner_update_venue_metadata`, `owner_create_venue_event`, etc.
  - user mutation RPCs: `create_comment_with_rate_limit`, `soft_delete_comment`, `follow_profile_with_rate_limit`, `block_profile`, `unblock_profile`, `create_report_with_rate_limit`, `create_notification`, `upsert_venue_rating`.
  - utility functions exposed: `set_updated_at`.

Impact:

- If present in live DB, PUBLIC/anon EXECUTE on mutation/admin/owner RPCs is a direct violation of persona contract (auth-only/admin-only operations) and must be revoked.

Live note (2026-01-03): The live DB posture has been corrected via 2156 + 2157. See GRANTS-LEDGER.md → LIVE DB verification for the definitive pg_proc ACL snapshots (pre-2157 full snapshot + post-2157 focused verification rows). This section remains snapshot context only.

### A5) Data-layer SQL queries used for verification (run on live DB)

- Canonical live DB verification blocks and pasted outputs live in `GRANTS-LEDGER.md` → LIVE DB verification; this section summarizes and links to that evidence.

```sql
-- List tables/views and RLS
select n.nspname, c.relname, c.relkind, c.relrowsecurity, c.relforcerowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public')
  and c.relkind in ('r', 'v')
order by c.relkind, c.relname;

-- Policies
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- SECURITY DEFINER + search_path pinning
select
  n.nspname,
  p.proname,
  p.prosecdef as is_security_definer,
  p.proconfig as proconfig
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;

-- Table/view grants (anon/authenticated)
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- Function EXECUTE grants (anon/authenticated) [supplementary; visibility scoped to currently enabled roles]
select grantee, routine_name, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and grantee in ('anon', 'authenticated')
order by routine_name, grantee;

-- View reloptions (security_invoker)
select c.relname, c.reloptions
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'v'
order by c.relname;

-- Definitive: function ACL snapshot (detect PUBLIC/default EXECUTE reliably)
select
  n.nspname as schema,
  p.proname as function_name,
  p.prokind,
  p.prosecdef as is_security_definer,
  p.proacl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;
```

Interpretation notes:

- PUBLIC grants may appear with an empty grantee in ACL entries (e.g. `=X/...`).
- If `proacl` is NULL, the function may still have default privileges; treat as suspicious and confirm default privileges / ALTER DEFAULT PRIVILEGES posture.
- P0 gate: no PUBLIC/anon EXECUTE on admin*/owner*/mutation RPCs unless explicitly intended.

### A6) Data-layer outputs (snapshot summaries from `supabase/_dump_schema.local.sql`)

- RLS missing: none.
- SECURITY DEFINER without pinned search_path: none.
- Tables with anon grants (snapshot):
  `admin_users`, `baits`, `catch_comments`, `catch_reactions`, `catches`, `leaderboard_scores_detailed` (view), `moderation_log`, `notifications`, `profile_blocks`, `profile_follows`, `profiles`, `rate_limits`, `ratings`, `reports`, `sessions`, `tags`, `user_warnings`, `venue_events`, `venue_opening_hours`, `venue_owners`, `venue_photos`, `venue_pricing_tiers`, `venue_ratings`, `venue_rules`, `venue_stats` (view), `venues`, `water_types`.
- Mutation-like functions with anon EXECUTE (snapshot):
  `admin_add_venue_owner`, `admin_clear_moderation_status`, `admin_create_venue_event`, `admin_create_venue_opening_hour`, `admin_create_venue_pricing_tier`, `admin_delete_account`, `admin_delete_catch`, `admin_delete_comment`, `admin_delete_venue_event`, `admin_delete_venue_opening_hour`, `admin_delete_venue_pricing_tier`, `admin_get_venue_events`, `admin_list_moderation_log`, `admin_list_reports`, `admin_remove_venue_owner`, `admin_restore_catch`, `admin_restore_comment`, `admin_update_report_status`, `admin_update_venue_booking`, `admin_update_venue_event`, `admin_update_venue_metadata`, `admin_update_venue_opening_hour`, `admin_update_venue_pricing_tier`, `admin_update_venue_rules`, `admin_warn_user`, `block_profile`, `create_comment_with_rate_limit`, `create_notification`, `create_report_with_rate_limit`, `follow_profile_with_rate_limit`, `owner_add_venue_photo`, `owner_create_venue_event`, `owner_create_venue_opening_hour`, `owner_create_venue_pricing_tier`, `owner_delete_venue_event`, `owner_delete_venue_opening_hour`, `owner_delete_venue_photo`, `owner_delete_venue_pricing_tier`, `owner_get_venue_events`, `owner_update_venue_booking`, `owner_update_venue_event`, `owner_update_venue_metadata`, `owner_update_venue_opening_hour`, `owner_update_venue_pricing_tier`, `owner_update_venue_rules`, `set_updated_at`, `soft_delete_comment`, `unblock_profile`, `upsert_venue_rating`.

## App-layer findings

### B1) Inventory vs guard check (routes)

Route guards verified in `src/App.tsx`:

- RequireAuth applied to: `/feed`, `/add-catch`, `/catch/:id`, `/profile/:slug`, `/settings/profile`, `/sessions`, `/admin/reports`, `/admin/audit-log`, `/admin/users/:userId/moderation`, `/admin/venues`, `/admin/venues/:slug`, `/search`, `/insights`, `/my/venues`, `/my/venues/:slug`.
- Public (no guard): `/`, `/venues`, `/venues/:slug`, `/leaderboard`.

Surface vs reality table (inventory surfaces only):

| Surface               | Intended audience | Route guard present | Admin/owner gate    | Risk notes                                     | HAR verification focus            |
| --------------------- | ----------------- | ------------------- | ------------------- | ---------------------------------------------- | --------------------------------- |
| CATCH_DETAIL          | Auth              | Yes (RequireAuth)   | N/A                 | Auth-only OK; relies on RLS/visibility         | anon redirect + no Supabase calls |
| PROFILE_DETAIL        | Auth              | Yes (RequireAuth)   | N/A                 | Auth-only OK; UI privacy checks                | anon redirect + no Supabase calls |
| MY_VENUE_EDIT         | Owner             | Yes (RequireAuth)   | Owner via RPC/RLS   | Owner-only relies on RPC/RLS                   | IDOR on slug; owner RPC gates     |
| SEARCH                | Auth              | Yes (RequireAuth)   | N/A                 | Auth-only OK; field minimization               | anon redirect + no Supabase calls |
| ADMIN_VENUE_EDIT      | Admin             | Yes (RequireAuth)   | isAdminUser in page | Admin gate in-app (no route-level admin guard) | unauthorized admin RPC errors     |
| ADMIN_REPORTS         | Admin             | Yes (RequireAuth)   | useAdminAuth        | Admin gate in hook                             | unauthorized admin RPC errors     |
| ADMIN_USER_MODERATION | Admin             | Yes (RequireAuth)   | useAdminAuth        | Admin gate in hook                             | unauthorized admin RPC errors     |
| ADMIN_VENUES_LIST     | Admin             | Yes (RequireAuth)   | isAdminUser in page | Admin gate in-app                              | unauthorized admin RPC errors     |
| FEED                  | Auth              | Yes (RequireAuth)   | N/A                 | Auth-only OK                                   | anon redirect + no Supabase calls |
| VENUE_DETAIL          | Public            | No                  | N/A                 | Public data; ensure view safety                | public payload field audit        |
| MY_VENUES_LIST        | Owner             | Yes (RequireAuth)   | Owner via RLS       | Owner-only via RLS                             | IDOR on joins                     |
| ADMIN_AUDIT_LOG       | Admin             | Yes (RequireAuth)   | useAdminAuth        | Admin gate in hook                             | unauthorized admin RPC errors     |
| ADD_CATCH             | Auth              | Yes (RequireAuth)   | N/A                 | Auth-only OK                                   | storage + insert checks           |
| INSIGHTS              | Auth              | Yes (RequireAuth)   | N/A                 | Auth-only OK                                   | anon redirect + no Supabase calls |
| SESSIONS              | Auth              | Yes (RequireAuth)   | N/A                 | Auth-only OK                                   | anon redirect + no Supabase calls |
| VENUES_INDEX          | Public            | No                  | N/A                 | Public data only                               | public payload field audit        |
| LEADERBOARD           | Public            | No                  | N/A                 | Public data only                               | view exposure rules               |

### B2) Calls before auth resolved

- No confirmed pre-auth Supabase calls for Auth/Admin surfaces in routing because `RequireAuth` blocks rendering when `user` is null.
- Admin pages:
  - `src/pages/AdminReports.tsx`, `src/pages/AdminAuditLog.tsx`, `src/pages/AdminUserModeration.tsx` use `useAdminAuth` and check `isAdmin` before executing admin RPCs.
  - `src/pages/AdminVenuesList.tsx` and `src/pages/AdminVenueEdit.tsx` call `isAdminUser` and only fetch data when `adminStatus === "authorized"`.
- Verification still required: anon HAR for auth-only routes should show no Supabase calls (rest/v1, rpc, storage, realtime).

### B3) Persona-state consistency (admin_users)

- App check uses `src/lib/admin.ts`:
  ```ts
  supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  ```
- Live verified (2026-01-03): `admin_users_select_all` is not present on live DB. The only policy on `public.admin_users` is `admin_users_self_select` (`uid() = user_id`) and applies to `{public}` roles, meaning only a user can read their own admin row (anon sees 0 rows).
- Evidence: GRANTS-LEDGER.md → LIVE DB verification → LIVE: Policies for public schema → admin_users (LIVE).

### B4) Field-level leakage risks (select \*)

Potential field exposure where `select("*")` is used:

- Public venue detail:
  - `src/pages/venue-detail/hooks/useVenueDetailData.ts`: `venue_opening_hours`, `venue_pricing_tiers`, `venue_species_stock` use `select("*")`.
- Owner/admin venue management components:
  - `src/pages/venue-owner-admin/components/PricingTiersCard.tsx`, `src/pages/venue-owner-admin/components/OpeningHoursCard.tsx`, `src/pages/venue-owner-admin/components/SpeciesStockCard.tsx` use `select("*")`.
- Notifications:
  - `src/lib/notifications.ts` uses `select("*")` on `notifications` (owner-only surface; still verify payload scope).
- Shared queries:
  - `src/lib/supabase-queries.ts` contains several `select('*')` helpers; verify usage on public surfaces.

Profile-specific mismatch:

- `src/components/ProfileNotificationsSection.tsx` reads `moderation_status`, `warn_count`, `suspension_until` for own profile; new contract forbids these fields in profile payloads for any persona.

## Recommended fix order (DB-first)

1. Confirm live EXECUTE grants for mutation/admin/owner RPCs; revoke PUBLIC/anon where not explicitly intended.
2. Confirm `admin_users_select_all` is removed in live DB; ensure only self-select (or admin-only) is allowed.
3. Audit views for `security_invoker` and restrict view SELECT grants to intended roles.
4. Reduce `select("*")` on public surfaces to explicit, public-safe column lists or wrapper views.
5. Remove/moderation field reads from profile surface (per contract) and verify payloads via HAR.

## Posture vs persona contract

- Matches (confirmed via repo): Auth-only routes are guarded by `RequireAuth` in `src/App.tsx` and admin surfaces have in-page admin checks.
- Mismatches (confirmed via repo): Profile surface currently reads moderation fields; contract forbids them.
- Requires verification (HAR/SQL): live DB EXECUTE grants, `admin_users` policies, view security_invoker, and public payload field exposure.

## LIVE DB persona evidence — Profile + Feed (2026-01-04)

- Evidence source: `docs/version5/hardening/PROFILE-REALITY-VS-CONTRACT.md` → E (live DB verification checklist).
- Function EXECUTE (pg_proc ACL):
  - Authenticated-only EXECUTE: `block_profile` (SECURITY DEFINER), `create_notification` (SECURITY DEFINER), `follow_profile_with_rate_limit` (SECURITY DEFINER), `get_feed_catches` (SECURITY INVOKER), `get_follower_count` (SECURITY DEFINER), `unblock_profile` (SECURITY DEFINER).
  - Anon/PUBLIC EXECUTE present: `get_species_options` (anon); `is_following` and `is_blocked_either_way` (PUBLIC `=X` + anon).
- Table grants (grouped privileges): `admin_users`, `catches`, `notifications`, `profile_blocks`, `profile_follows`, `profiles` grant anon/authenticated/service_role `{DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE}`.
- RLS policies (live, Profile + Feed tables):
  - `admin_users_self_select` (SELECT, roles {public}, qual uid() = user_id).
  - `profiles_select_all` (SELECT, roles {public}, qual true); `profiles_update_self` (UPDATE, roles {public}, qual uid() = id).
  - `profile_follows_*`: admin select all; select related (uid() = follower_id OR uid() = following_id); owner all (uid() = follower_id); insert_not_blocked (roles {authenticated}, with_check uid() = follower_id AND NOT is_blocked_either_way).
  - `profile_blocks_*`: select self/blocked; select admin all; insert self/admin; delete self/admin.
  - `catches_*`: admin read all; owner select; owner insert/update; public read with privacy/follow/block checks.
  - `notifications_*`: admin read; recipient-only for all operations (uid() = user_id).

## Next minimal verification steps

1. Continue pasting live DB outputs into GRANTS-LEDGER.md as they are gathered (admin_users pg_policies is now ✅ captured/linked).
2. Capture anon HAR for each auth-only surface to confirm zero Supabase calls (rest/v1, rpc, storage, realtime).
3. Verify profile payloads do not contain `moderation_status`, `warn_count`, `suspension_until` in any persona HAR.
4. Validate public surfaces using `select("*")` for field minimization (HAR + SQL view definition checks).
