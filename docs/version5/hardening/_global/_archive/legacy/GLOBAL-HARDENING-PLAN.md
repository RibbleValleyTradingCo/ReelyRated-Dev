> ⚠️ LEGACY (archived 2026-01-13)
> This file is the v1 global hardening attempt preserved for audit/history.
> Current work lives in: docs/version5/hardening/_global/v2/ (see _global/README.md).
> Do not update posture here unless you are explicitly updating legacy history notes.

# Global Hardening Plan

Note: `docs/version5/hardening/_global/legacy/GLOBAL-DB-LOCKDOWN-PLAN.md` is the single source of truth for current status and execution logging; this file is the roadmap/pointer.

## Inputs reviewed
- `docs/version5/hardening/_global/legacy/RLS-COVERAGE-LEDGER.md`
- `docs/version5/hardening/_global/legacy/GRANTS-LEDGER.md`
- `docs/version5/hardening/_global/legacy/RPC-REGISTRY.md`
- `supabase/migrations/**` (excluding the drift snapshot unless noted)

## P0 — Stop-the-bleeding issues

### P0-1 — Admin RPCs callable by PUBLIC/anon/authenticated
- Evidence: `docs/version5/hardening/_global/legacy/RPC-REGISTRY.md` shows 33 `admin_*` functions with EXECUTE granted to `PUBLIC`, `anon`, and `authenticated` in the live snapshot (Interpretation table).
- Why it’s risky: Admin RPCs are a privileged API surface; broad EXECUTE grants expand the attack surface and rely entirely on server-side checks.
- Proposed fix approach (migration outline only):
  - `REVOKE EXECUTE ON FUNCTION public.admin_* FROM PUBLIC, anon;` (repeat per function).
  - If client-side admin UI must call them, `GRANT EXECUTE TO authenticated` and enforce admin checks inside each function.
  - If server-only, restrict EXECUTE to `service_role` or a dedicated admin role.
  - Audit default privileges so new functions are not granted to PUBLIC/anon by default.
- How we will verify:
  - `docs/version5/hardening/_global/legacy/sql/RPC-REGISTRY-LIVE.sql` should return no rows where `routine_name` starts with `admin_` and `grantee` is `PUBLIC` or `anon`.
  - `docs/version5/hardening/_global/legacy/sql/RPC-POSTURE-LIVE.sql` should show expected `proacl` and pinned `search_path` for admin functions.

### P0-2 — Public tables with RLS disabled + broad grants
- Evidence: `docs/version5/hardening/_global/legacy/RLS-COVERAGE-LEDGER.md` live inventory shows `public.catch_leaderboard_scores` and `public.catch_rating_stats` with `relrowsecurity = false`. `docs/version5/hardening/_global/legacy/GRANTS-LEDGER.md` red flags list shows anon write grants on both tables.
- Why it’s risky: RLS is disabled, yet anon/auth roles have broad table privileges, allowing read/write without row-level checks.
- Proposed fix approach (migration outline only):
  - Enable RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) and add explicit policies, or
  - Revoke anon/auth privileges and expose read-only access via a SECURITY INVOKER view with limited columns.
  - If these are internal precompute tables, restrict to `service_role` only.
- How we will verify:
  - `docs/version5/hardening/_global/legacy/sql/RLS-COVERAGE-LIVE.sql` shows `relrowsecurity = true` for both tables.
  - `docs/version5/hardening/_global/legacy/sql/GRANTS-REDFLAGS-LIVE.sql` shows no anon/PUBLIC write grants on those tables.

## P1 — High-priority hardening

### P1-1 — Anon write grants across many public tables (verify intent vs RLS)
- Evidence: `docs/version5/hardening/_global/legacy/GRANTS-LEDGER.md` red flags list shows anon write grants across many `public.*` tables (e.g., `admin_users`, `moderation_log`, `reports`, `user_warnings`).
- Why it’s risky: Even with RLS, broad write privileges increase blast radius if any policy is too permissive or missing.
- Proposed fix approach (migration outline only):
  - Confirm which tables should allow anon writes; for others, `REVOKE INSERT/UPDATE/DELETE/TRUNCATE` from anon.
  - Align RLS policies to intended roles (prefer authenticated for writes unless explicitly public).
- How we will verify:
  - `docs/version5/hardening/_global/legacy/sql/GRANTS-REDFLAGS-LIVE.sql` should show only explicitly intended anon write grants.
  - `docs/version5/hardening/_global/legacy/sql/RLS-POLICIES-LIVE.sql` should show write policies scoped to authenticated where intended.

### P1-2 — RLS enabled but 0 policies (deny-by-default vs intent)
- Evidence: `docs/version5/hardening/_global/legacy/RLS-COVERAGE-LEDGER.md` live inventory shows 13 tables with RLS enabled and `policy_count = 0`, including `public.community_stats_*` and multiple `storage.*` tables.
- Why it’s risky: Could be intentional deny-by-default, but must be explicit to avoid accidental exposure through grants or RPCs.
- Proposed fix approach (migration outline only):
  - For app-facing tables, add explicit SELECT policies or revoke grants.
  - For platform-managed `storage.*` tables, verify expected Supabase defaults and revoke direct grants if not needed.
- How we will verify:
  - `docs/version5/hardening/_global/legacy/sql/RLS-COVERAGE-LIVE.sql` and `docs/version5/hardening/_global/legacy/sql/RLS-POLICIES-LIVE.sql` confirm policy presence and scope.

### P1-3 — Views without explicit security posture
- Evidence: `docs/version5/hardening/_global/legacy/RLS-COVERAGE-LEDGER.md` shows views (`catch_comments_with_admin`, `catch_mention_candidates`, `leaderboard_scores_detailed`, `venue_stats`, `venue_stats_public`) with RLS not applicable; grants appear in `docs/version5/hardening/_global/legacy/GRANTS-LEDGER.md`.
- Why it’s risky: Views can bypass underlying RLS depending on ownership and `security_invoker` settings; grants can widen exposure.
- Proposed fix approach (migration outline only):
  - For sensitive views, set `security_invoker = true` (Postgres 15+) and ensure minimal grants.
  - Otherwise, restrict view owners and grants and avoid exposing admin-only views to broad roles.
- How we will verify:
  - Run a view posture query (see SQL probe pack) and confirm `security_invoker` or strict grants.

### P1-4 — SECURITY DEFINER search_path hygiene
- Evidence: `docs/version5/hardening/_global/legacy/RPC-REGISTRY.md` posture output shows many SECURITY DEFINER functions with `search_path = public, extensions` (pinned but broad).
- Why it’s risky: Broad search_path can allow unqualified name resolution to unexpected objects if `public` is writable.
- Proposed fix approach (migration outline only):
  - Pin search_path to `''` and schema-qualify all object references in SECURITY DEFINER functions.
  - Review ownership/role attributes for definer functions (especially `rolbypassrls`).
- How we will verify:
  - `docs/version5/hardening/_global/legacy/sql/RPC-POSTURE-LIVE.sql` shows `search_path_pinned = true` with restrictive values and no unqualified dependencies.

## P2 — Medium-priority cleanup

### P2-1 — Resolve repo intent vs live drift
- Evidence: Repo grants in `supabase/migrations/1004_policies_and_grants.sql` and `1006_auth_and_rpc_helpers.sql` show authenticated-only patterns, but live snapshots show broader grants and admin EXECUTE exposure.
- Why it’s risky: Drift makes audits unreliable and can reintroduce exposure.
- Proposed fix approach (migration outline only):
  - Reconcile grants/RPC exposure via explicit migrations and remove reliance on defaults.
  - Document intended grant matrix and update ledgers accordingly.
- How we will verify:
  - Re-run `GRANTS-SUMMARY-LIVE.sql` and `RPC-REGISTRY-LIVE.sql` and compare to migration intent.

### P2-2 — Default privilege audit
- Evidence: `docs/version5/hardening/_global/legacy/GRANTS-LEDGER.md` includes live default privileges for platform schemas (e.g., `graphql`).
- Why it’s risky: Default privileges can silently expand access for new objects.
- Proposed fix approach (migration outline only):
  - If defaults are too permissive for app-managed schemas, `ALTER DEFAULT PRIVILEGES` to tighten.
- How we will verify:
  - `docs/version5/hardening/_global/legacy/sql/GRANTS-DEFAULT-PRIVS-LIVE.sql` output reflects tightened defaults.

## SQL probe pack (do not run yet)
- RLS coverage: `docs/version5/hardening/_global/legacy/sql/RLS-COVERAGE-LIVE.sql`
- RLS policies: `docs/version5/hardening/_global/legacy/sql/RLS-POLICIES-LIVE.sql`
- Grants full snapshot: `docs/version5/hardening/_global/legacy/sql/GRANTS-LIVE.sql`
- Grants summary: `docs/version5/hardening/_global/legacy/sql/GRANTS-SUMMARY-LIVE.sql`
- Grants red flags: `docs/version5/hardening/_global/legacy/sql/GRANTS-REDFLAGS-LIVE.sql`
- Default privileges: `docs/version5/hardening/_global/legacy/sql/GRANTS-DEFAULT-PRIVS-LIVE.sql`
- RPC registry: `docs/version5/hardening/_global/legacy/sql/RPC-REGISTRY-LIVE.sql`
- RPC posture/hygiene: `docs/version5/hardening/_global/legacy/sql/RPC-POSTURE-LIVE.sql`
- View security posture (copy/paste):
  ```sql
  select
    n.nspname as schema_name,
    c.relname as view_name,
    c.relkind,
    c.relowner::regrole as owner,
    c.reloptions
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public')
    and c.relkind in ('v', 'm')
  order by n.nspname, c.relname;
  ```
- Trigger inventory (auth/users to profiles and other sensitive triggers):
  ```sql
  select event_object_schema, event_object_table, trigger_name, action_timing, event_manipulation
  from information_schema.triggers
  where event_object_schema in ('public', 'auth')
  order by event_object_schema, event_object_table, trigger_name;
  ```
- Storage policy inventory (bucket-specific):
  ```sql
  select
    pol.polname as policyname,
    pol.polcmd,
    pol.polroles::regrole[] as roles,
    pg_get_expr(pol.polqual, pol.polrelid) as qual,
    pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'storage'
    and c.relname = 'objects'
  order by pol.polname;
  ```
- Rate limit surface posture (tables + helper functions):
  ```sql
  select * from pg_policies where schemaname = 'public' and tablename = 'rate_limits';
  select proname, pg_get_functiondef(p.oid)
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and proname in ('check_rate_limit','get_rate_limit_status','user_rate_limits');
  ```

Prep-only. No sweeps run. Live verification pending.
