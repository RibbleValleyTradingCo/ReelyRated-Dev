> ⚠️ LEGACY (archived 2026-01-13)
> This file is the v1 global hardening attempt preserved for audit/history.
> Current work lives in: docs/version5/hardening/_global/v2/ (see _global/README.md).
> Do not update posture here unless you are explicitly updating legacy history notes.

# Global DB Lockdown Plan (Pre-Surface Hardening)

Status: DRAFT (truth-only; must be sanity-checked against repo + migrations before any DB changes)

## Purpose

Establish a secure, least-privilege global baseline for ReelyRatedv3 (Supabase/Postgres) *before* surface sweeps.
This plan prioritizes high-confidence, low-breakage remediations first, then iterates toward allowlisted access.

Supabase guidance: any tables accessible through the Data API must have RLS enabled, and security should be enforced by RLS + minimal privileges. (Reference: Supabase “Hardening the Data API”.)

## Runbook (local execution)

Local-first execution steps live in: `docs/version5/hardening/_global/legacy/GLOBAL-DB-LOCKDOWN-RUNBOOK-LOCAL.md`. Use it as the operational checklist for applying migrations, running probes, exporting CSVs, and updating evidence.

<!-- PERSONA-CONTRACT-LINK:START -->
## Persona Permission Contract

Source of truth for persona intent (anon/authenticated/owner/admin):
- `docs/version5/hardening/_global/legacy/PERSONA-PERMISSIONS.md`

All surface PIPELINE.md files must link to this contract.
<!-- PERSONA-CONTRACT-LINK:END -->

<!-- GLOBAL-PROBE-PACK:START -->
## Global Persona Probe Pack (minimal, repeatable)

Run these probes after any global DB migration that changes grants/RLS/RPC exposure.
Save outputs under: `docs/version5/hardening/_global/legacy/evidence/`

### Probes to run (SQL source → evidence output)
Grants / defaults
- `docs/version5/hardening/_global/legacy/sql/GRANTS-LIVE.sql` → `GRANTS-LIVE_YYYY-MM-DD.csv`
- `docs/version5/hardening/_global/legacy/sql/GRANTS-SUMMARY-LIVE.sql` → `GRANTS-SUMMARY-LIVE_YYYY-MM-DD.csv`
- `docs/version5/hardening/_global/legacy/sql/GRANTS-DEFAULT-PRIVS-LIVE.sql` → `GRANTS-DEFAULT-PRIVS-LIVE_YYYY-MM-DD.csv`

Redflags (metrics)
- `docs/version5/hardening/_global/legacy/sql/GRANTS-REDFLAGS-PUBLIC-ONLY.sql` →
  - `GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-TOTAL_YYYY-MM-DD.csv`
  - `GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-GROUPED_YYYY-MM-DD.csv`
  - `GRANTS-REDFLAGS-PUBLIC-ONLY_YYYY-MM-DD.csv`
- `docs/version5/hardening/_global/legacy/sql/GRANTS-REDFLAGS-PLATFORM-MANAGED.sql` →
  - `GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS-TOTAL_YYYY-MM-DD.csv`
  - `GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS-GROUPED_YYYY-MM-DD.csv`
  - `GRANTS-REDFLAGS-PLATFORM-MANAGED_YYYY-MM-DD.csv`
- `docs/version5/hardening/_global/legacy/sql/GRANTS-REDFLAGS-LIVE.sql` →
  - `GRANTS-REDFLAGS-LIVE_YYYY-MM-DD.csv` (tracking/noisy)

RLS posture
- `docs/version5/hardening/_global/legacy/sql/RLS-COVERAGE-LIVE.sql` → `RLS-COVERAGE-LIVE_YYYY-MM-DD.csv`
- `docs/version5/hardening/_global/legacy/sql/RLS-POLICIES-LIVE.sql` → `RLS-POLICIES-LIVE_YYYY-MM-DD.csv`

RPC posture
- `docs/version5/hardening/_global/legacy/sql/RPC-REGISTRY-LIVE.sql` → `RPC-REGISTRY-LIVE_YYYY-MM-DD.csv`
- `docs/version5/hardening/_global/legacy/sql/RPC-POSTURE-LIVE.sql` → `RPC-POSTURE-LIVE_YYYY-MM-DD.csv`

### Naming rules
- Use `YYYY-MM-DD` in filenames.
- If capturing "before/after" for a single day, suffix post-change files with `_P1` (or `_P2`) as already established.

### Minimal indexing
- Add new evidence filenames to: `docs/version5/hardening/_global/legacy/EVIDENCE-INDEX.md`
- Only capture what is necessary to prove posture (avoid redundant exports).
<!-- GLOBAL-PROBE-PACK:END -->

## Current status (as of 2026-01-12)

- Phase: P0 executed locally (`2154_p0_global_grants_lockdown`, `2155_default_privileges_lockdown` applied); hosted/prod execution pending.
- Probes re-run after P0; outputs saved under `docs/version5/hardening/_global/legacy/evidence/` with 2026-01-12 filenames.
- Local execution method: `supabase db reset` applied through 2156 (P0 + P1).
- Evidence exists for both pre-P1 and post-P1 probes under `docs/version5/hardening/_global/legacy/evidence/`:
  - pre: `*_2026-01-12.csv`
  - post-P1: `*_2026-01-12_P1.csv`
- 2155 NOTICE nuance (expected): default-privs lockdown skipped `owner_role=supabase_admin` for `schema=public` because the runner is not a member of the defaclrole (ownership/membership constraint).
- Pre-P0 baseline (example: `GRANTS-REDFLAGS-LIVE_2026-01-11.json`) is not present in the repo.

## Execution log

| Date | Migration(s) | Expected probe deltas | Evidence | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| 2026-01-12 | 2154 + 2155 | Public-only redflags down; platform-managed steady; default ACLs tightened where membership allowed | `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-TOTAL_2026-01-12.csv`, `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-GROUPED_2026-01-12.csv`, `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS-TOTAL_2026-01-12.csv`, `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS-GROUPED_2026-01-12.csv`, `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PUBLIC-ONLY_2026-01-12.csv`, `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PLATFORM-MANAGED_2026-01-12.csv`, `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-LIVE_2026-01-12.csv`, `docs/version5/hardening/_global/legacy/evidence/GRANTS-LIVE_2026-01-12.csv`, `docs/version5/hardening/_global/legacy/evidence/GRANTS-SUMMARY-LIVE_2026-01-12.csv`, `docs/version5/hardening/_global/legacy/evidence/GRANTS-DEFAULT-PRIVS-LIVE_2026-01-12.csv`, `docs/version5/hardening/_global/legacy/evidence/RLS-COVERAGE-LIVE_2026-01-12.csv`, `docs/version5/hardening/_global/legacy/evidence/RLS-POLICIES-LIVE_2026-01-12.csv`, `docs/version5/hardening/_global/legacy/evidence/RPC-REGISTRY-LIVE_2026-01-12.csv`, `docs/version5/hardening/_global/legacy/evidence/RPC-POSTURE-LIVE_2026-01-12.csv` | LOCAL PASS (pending hosted) | 2155 NOTICE about skipped default ACLs (e.g., `supabase_admin`) expected when membership is missing; log not captured. |
| 2026-01-12 | 2156 | Public-only redflags down; platform-managed steady; grant counts reduced for anon/auth writes in `public` | `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-TOTAL_2026-01-12_P1.csv`, `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-GROUPED_2026-01-12_P1.csv`, `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PUBLIC-ONLY_2026-01-12_P1.csv`, `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS-TOTAL_2026-01-12_P1.csv`, `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS-GROUPED_2026-01-12_P1.csv`, `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-LIVE_2026-01-12_P1.csv`, `docs/version5/hardening/_global/legacy/evidence/GRANTS-LIVE_2026-01-12_P1.csv`, `docs/version5/hardening/_global/legacy/evidence/GRANTS-SUMMARY-LIVE_2026-01-12_P1.csv`, `docs/version5/hardening/_global/legacy/evidence/RLS-COVERAGE-LIVE_2026-01-12_P1.csv`, `docs/version5/hardening/_global/legacy/evidence/RLS-POLICIES-LIVE_2026-01-12_P1.csv`, `docs/version5/hardening/_global/legacy/evidence/RPC-REGISTRY-LIVE_2026-01-12_P1.csv`, `docs/version5/hardening/_global/legacy/evidence/RPC-POSTURE-LIVE_2026-01-12_P1.csv` | LOCAL PASS | OIDs/specific names differ in RPC CSVs due to db reset; normalized RPC posture is unchanged. Add Catch failed with `permission denied for table rate_limits` (42501); treat as surface-level fix, not global grant widening. |

## Probe interpretation / metrics

- Public-only redflags (P0 control metric): use `docs/version5/hardening/_global/legacy/sql/GRANTS-REDFLAGS-PUBLIC-ONLY.sql`.
  - This measures the `public` schema only (the scope of P0 lockdown work).
- Platform-managed redflags (tracking metric): use `docs/version5/hardening/_global/legacy/sql/GRANTS-REDFLAGS-PLATFORM-MANAGED.sql`.
  - This isolates Supabase/platform schemas (`auth`, `storage`, `realtime`, `net`, `graphql*`, `supabase_functions`, `vault`) to track separately.
- Superset/noisy metric: `docs/version5/hardening/_global/legacy/sql/GRANTS-REDFLAGS-LIVE.sql` remains a full-scope view and should not be used alone as a success metric.

### Redflags scorecard (latest)

- Public-only total_redflags (pre-P1 baseline): 1238 (from `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-TOTAL_2026-01-12.csv`).
- Public-only total_redflags (post-P1): 757 (from `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-TOTAL_2026-01-12_P1.csv`).
- Platform-managed total_redflags (pre-P1): 383 (from `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS-TOTAL_2026-01-12.csv`).
- Platform-managed total_redflags (post-P1): 383 (from `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS-TOTAL_2026-01-12_P1.csv`).
- Full-scope redflags row-level: 1621 → 1140 (`docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-LIVE_2026-01-12.csv` → `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-LIVE_2026-01-12_P1.csv`).
- GRANTS-LIVE full snapshot: 4680 → 4199 (`docs/version5/hardening/_global/legacy/evidence/GRANTS-LIVE_2026-01-12.csv` → `docs/version5/hardening/_global/legacy/evidence/GRANTS-LIVE_2026-01-12_P1.csv`).
- Expected deltas observed (directional; pre-P0 public-only baseline not captured):
  - Public-only redflags should drop vs pre-P0.
  - Platform-managed redflags should remain largely unchanged (tracking metric).

## Inputs / Evidence

- Live grant posture:
  - `docs/version5/hardening/_global/legacy/GRANTS-LEDGER.md` (live snapshot + red flags)
  - `docs/version5/hardening/_global/legacy/sql/GRANTS-REDFLAGS-LIVE.sql`
- RLS posture:
  - `docs/version5/hardening/_global/legacy/RLS-COVERAGE-LEDGER.md`
- RPC posture:
  - `docs/version5/hardening/_global/legacy/RPC-REGISTRY.md`
- Surface pipelines:
  - `docs/version5/hardening/surfaces/**/PIPELINE.md`

## Latest Live Findings (2026-01-12)

### What we changed (migrations executed locally)

- `2154_p0_global_grants_lockdown` (public schema):
  - Revokes dangerous privileges (TRIGGER/TRUNCATE/REFERENCES/MAINTAIN) from `PUBLIC`, `anon`, `authenticated` on **all public tables**.
  - Locks internal tables from `PUBLIC`/`anon` and removes all `authenticated` privileges on internal tables, then re-grants **only** `SELECT` to `authenticated` for:
    - `public.admin_users`
    - `public.moderation_log`
    - `public.user_warnings`
  - Removes `UPDATE` on **all public sequences** from `PUBLIC`, `anon`, `authenticated`.

- `2155_default_privileges_lockdown` (durability):
  - Attempts to revoke default ACL grants to `PUBLIC`/`anon`/`authenticated` across `public` + non-system schemas (excluding Supabase-managed schemas).
  - IMPORTANT: it can only change default ACLs for roles the migration runner is a *member of*; other owners may be skipped with `insufficient_privilege`.

### What the live probes show (key interpretation)

- `admin_users` / `moderation_log` / `user_warnings`:
  - No grants for `PUBLIC`/`anon` (✅ good).
  - `authenticated` still has `SELECT` on all three (✅ intentional *for current client admin gating / admin screens*, but should be revisited once gating is moved to an RPC or a narrower view).

- GRANTS summaries still show many `public` column/table privileges for `anon`/`authenticated`.
  - This is expected **until** we do Phase P1/P2 allowlisting: the current app still uses direct PostgREST reads/writes for core UX (catches/sessions/profiles/notifications/etc.).

- Default ACLs still exist for Supabase-managed owners/schemas (e.g. `supabase_admin` for `public`, `storage`, `supabase_functions`, `graphql*`).
  - These are *not* covered by our durability sweep by design (we excluded Supabase-managed schemas) and/or due to ownership/privilege constraints.

#### P0 validation (CSV evidence, 2026-01-12)

| Check | Status | Evidence | How we know |
| --- | --- | --- | --- |
| A) public schema: `PUBLIC` does NOT have CREATE | PASS | `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PUBLIC-ONLY_2026-01-12.csv` | 0 rows where object_type=`schema`, grantee=`PUBLIC`, privilege_type=`CREATE`. |
| B) public schema: `PUBLIC` does NOT have table write privileges (INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER) | PASS | `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PUBLIC-ONLY_2026-01-12.csv` | 0 rows where object_type=`table`, grantee=`PUBLIC`, privilege_type in write set. |
| C) public schema: `anon`/`authenticated` do NOT have TRUNCATE/TRIGGER/REFERENCES/MAINTAIN on public tables | PASS | `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PUBLIC-ONLY_2026-01-12.csv`, `docs/version5/hardening/_global/legacy/evidence/GRANTS-LIVE_2026-01-12.csv` | 0 rows for TRUNCATE/TRIGGER/REFERENCES (redflags); 0 rows for privilege_type=`MAINTAIN` in GRANTS-LIVE for `anon`/`authenticated` in `public`. |
| D) public schema: `anon`/`authenticated`/`PUBLIC` do NOT have sequence UPDATE | PASS | `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PUBLIC-ONLY_2026-01-12.csv` | 0 rows where object_type=`sequence` and privilege_type=`UPDATE` for these grantees. |
| E) internal tables (`admin_users`, `moderation_log`, `user_warnings`, `rate_limits` if present): no `PUBLIC`/`anon` privileges; `authenticated` matches plan exceptions | PASS | `docs/version5/hardening/_global/legacy/evidence/GRANTS-LIVE_2026-01-12.csv` | `admin_users`: 1 row (`authenticated` SELECT). `moderation_log`: 1 row (`authenticated` SELECT). `user_warnings`: 1 row (`authenticated` SELECT). `PUBLIC`/`anon`: 0 rows. `rate_limits`: 0 rows. |
| F1) default privileges (app-owned scope): no default grants to `PUBLIC`/`anon`/`authenticated` for app-owned schemas/owners | PASS | `docs/version5/hardening/_global/legacy/evidence/GRANTS-DEFAULT-PRIVS-LIVE_2026-01-12.csv` | `public` schema owner `postgres` defaults show no `PUBLIC`/`anon`/`authenticated` entries. |
| F2) default privileges (platform-managed scope): remaining default ACLs are tracked, not gating | TRACK | `docs/version5/hardening/_global/legacy/evidence/GRANTS-DEFAULT-PRIVS-LIVE_2026-01-12.csv` | `supabase_admin` defaults in `public`, `graphql`, `graphql_public`, `supabase_functions` and `postgres` defaults in `storage` include `anon`/`authenticated`; platform-owned defaults may be non-modifiable from the runner context. |

P0 conclusion (local): A–E PASS; F1 PASS (app-owned); F2 TRACK (platform-managed defaults).

#### P1 Step 1 results (2156, local)

- Intent checks:
  - Anon write grants removed for sessions/catches/profiles/notifications/profile_follows/catch_reactions (18 rows → 0 in `GRANTS-LIVE`).
  - Auth write grants removed for read-only/RPC-only tables (36 rows → 0 in `GRANTS-LIVE`).
  - Auth INSERT/UPDATE removed for profile_follows + catch_reactions; DELETE retained (6 rows → 2 rows in `GRANTS-LIVE`).
  - Auth INSERT removed for notifications; UPDATE/DELETE retained (3 rows → 2 rows in `GRANTS-LIVE`).
- Public-only total_redflags: 1238 → 757 (`GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-TOTAL`).
- Platform-managed total_redflags: 383 → 383 (`GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS-TOTAL`).
- GRANTS-LIVE row count: 4680 → 4199; GRANTS-REDFLAGS-LIVE row count: 1621 → 1140.
- GRANTS-SUMMARY-LIVE (public, write grants): anon INSERT/UPDATE/DELETE 27 → 21; authenticated DELETE 27 → 15, INSERT 27 → 12, UPDATE 27 → 13.
- RLS-COVERAGE / RLS-POLICIES: no row-level differences (153 / 86 unchanged).
- RPC-REGISTRY / RPC-POSTURE: normalized content unchanged; row diffs are OID/specific_name churn from reset.

### Immediate Next Actions

1) Normalize P0 success criteria: treat platform-managed default ACLs as TRACKING, not gating; focus P1 on public schema allowlisting.
2) Align GRANTS-REDFLAGS interpretation: separate **app-owned public schema** concerns from **Supabase-managed schemas** (net/graphql/storage/supabase_functions/etc.) so the signal isn’t drowned by expected platform grants.
3) Start Phase P1 “Client DB Access Map → Allowlist” using the surface pipelines + code search as the source of truth.
4) Only after P1: begin shrinking `anon/authenticated` table/column grants in `public` to the smallest set that preserves UX.

#### Local finding (post-2156): rate_limits permission error (resolved in 2157)

- What happened: new user signup after reset, Add Catch failed with 403 and error `permission denied for table rate_limits` (code 42501) on `POST /rest/v1/catches`.
- Resolution applied: `public.enforce_catch_rate_limit()` is now SECURITY DEFINER with pinned `search_path` and EXECUTE restricted to `authenticated`; no client grants added to `public.rate_limits`.
- Guardrail remains: do not broaden global grants to "make it pass."
- RESOLVED surface issue: `docs/version5/hardening/surfaces/add-catch/PIPELINE.md` (post-fix evidence + verification).

## Guardrails / Non-negotiables

1) Truth-only changes: if a privilege/path is not proven necessary by code or pipeline docs, it should not remain granted.
2) Avoid breaking Storage/auth flows:
   - Storage access must be validated against actual client usage and storage policies (storage.objects RLS).
3) SECURITY DEFINER hygiene:
   - Prefer SECURITY INVOKER by default.
   - If SECURITY DEFINER is required, pin `search_path` (ideally empty) and schema-qualify all object references.
   - Treat mutable search_path as a security lint finding.
4) Views posture:
   - Views can bypass RLS by default; for Postgres 15+ use `security_invoker=true` for views meant to obey underlying RLS.

## Current Risks Observed (from live red-flags)

Interpretation note:
- Our red-flags output contains a mix of:
  1) **App schema risk** (primarily `public`) where we control tables/RLS/RPCs and can tighten grants.
  2) **Platform/schema noise** (e.g. `storage`, `realtime`, `net`, `graphql*`, `supabase_functions`, `extensions`, `vault`) where grants may be expected/required by Supabase features.
- Therefore, any “P0 concerns” must be assessed *by schema + object owner* rather than by raw row count.

P0 concerns (public schema):
- Any `anon/authenticated` capability-increasing privileges (TRIGGER/TRUNCATE/REFERENCES/MAINTAIN) on `public` tables.
- Any `PUBLIC/anon` privileges on internal/admin tables (admin/moderation/warnings/rate-limits).
- Sequence `UPDATE` for client roles in `public`.

P0 concerns (platform schemas):
- Treat as “review, don’t panic”: validate against Supabase feature use (Storage, Realtime, GraphQL, net/http, functions).

NOTE: This plan must be reconciled with the repo to determine which surfaces still perform direct PostgREST writes vs RPC-only.

## Proposed Target Model

### Roles

- `anon`:
  - Read-only to explicitly public-safe data only.
  - No direct writes to application tables.
- `authenticated`:
  - Minimal direct writes required for app UX, gated by RLS.
  - Prefer RPCs for “sensitive” writes (rate-limits, moderation, admin actions, internal logs).
- `service_role`:
  - Server-only. Not used in client.
- `PUBLIC`:
  - Treat as “everyone” and avoid granting capability-increasing privileges to PUBLIC.

### Exposure strategy

- Prefer public-safe views or RPCs for read-only public surfaces.
- Keep base tables private whenever possible.

## Migration Strategy (Incremental)

### Phase P0: Low-breakage global reductions (safe wins)

P0-A (PLANNED / READY): Remove “danger privileges” from client roles across the `public` schema:
- Revoke from `PUBLIC`, `anon`, `authenticated`:
  - TRIGGER
  - TRUNCATE
  - REFERENCES
  - MAINTAIN
Reason: These privileges are not required for normal client operations and increase attack surface.

P0-B (PLANNED / READY): Lock down clearly internal tables (public schema):
- Target tables:
  - `admin_users`, `moderation_log`, `user_warnings`, `rate_limits`
Approach:
- REVOKE ALL from `PUBLIC` and `anon`.
- REVOKE ALL from `authenticated`.
- Re-GRANT **only what is proven required** by current client code (temporary exception: `authenticated SELECT` on `admin_users` / `moderation_log` / `user_warnings`).

P0-C (PLANNED / READY): Sequences (public schema)
- REVOKE `UPDATE` on all public sequences from `PUBLIC`, `anon`, `authenticated`.
- Keep only what is necessary (often `USAGE`/`SELECT`) based on actual insert patterns.

### Phase P0.5: Durability (Default Privileges)

Goal: prevent future migrations/objects from re-introducing broad grants.

- Revoke default privileges that grant to `PUBLIC`/`anon`/`authenticated` for:
  - TABLES
  - SEQUENCES
  - FUNCTIONS
- Scope: `public` + app-owned non-system schemas. Avoid (or explicitly review) Supabase-managed schemas.
- Constraint: can only alter default ACLs for owner roles the migration runner can act as (membership/ownership limitations apply).

Evidence target:
- `pg_default_acl` should not show default grants to `PUBLIC`/`anon`/`authenticated` for app-owned schemas/owners.

### Phase P1: Align privileges with real surface entrypoints

P1.0 Local allowlist step 1 (2156_p1_public_allowlist_step1)
- Scope: public schema grants only; remove anon writes on direct-write tables; remove authenticated writes on read-only/RPC-only tables; narrow authenticated writes to DELETE-only where the client only deletes.
- Rationale: Client DB Access Map (direct PostgREST usage) + post-P0 grants evidence.
- Expected probe deltas: fewer `anon`/`authenticated` write rows in `GRANTS-REDFLAGS-PUBLIC-ONLY` (row-level + counts), and reduced write privilege rows in `GRANTS-SUMMARY-LIVE` / `GRANTS-LIVE` for the targeted tables.
- P0 status remains: A–E PASS; F1 PASS; F2 TRACK (platform-managed defaults). Proceeding with P1 is within scope.

P1.1 Build “Client DB Access Map”
- For each surface: list exact PostgREST tables + RPCs used (reads/writes), drawn from PIPELINE.md and verified by code search.
- Output a single allowlist of required privileges for:
  - anon
  - authenticated

P1.2 Convert sensitive writes to RPCs (where appropriate)
- Rate limits, moderation logs, admin actions should be RPC-only.
- Tighten EXECUTE grants to only intended roles.
- Ensure SECURITY DEFINER hygiene for any definer functions.

### Phase P2: Allowlist hardening

P2.1 Apply allowlist grants
- REVOKE broad privileges, then re-GRANT only:
  - public-safe reads for anon
  - minimal required writes for authenticated
  - explicit EXECUTE for RPCs used by the client

P2.2 Views posture hardening
- Ensure views used by anon/auth respect RLS (`security_invoker = true`) or are public-safe by design.

## Verification (Evidence-driven)

After each migration:
- Re-run:
  - GRANTS-REDFLAGS-LIVE.sql (should shrink)
  - GRANTS-SUMMARY-LIVE.sql
  - default ACL probe (pg_default_acl) — confirm durability for app-owned owners/schemas
  - RLS coverage probes
  - RPC registry probes (EXECUTE + SECURITY DEFINER posture)
- Confirm critical user flows still work:
  - sign-up/sign-in
  - create catch
  - upload images (storage)
  - leaderboards and public pages

## Rollback / Safety

- Migrations must be small and reversible.
- Each migration should include:
  - scope list (schemas/tables/functions affected)
  - expected changes in redflag outputs
  - rollback statements

## Open Questions / Requires Repo Validation

- Which surfaces still do direct table writes?
- Which public reads require anon SELECT on base tables vs views/RPCs?
- Storage operations: which exact tables/policies are required by current client flows?
- Which schemas are exposed in the project’s API settings (dashboard/config)?
- Which grants are “platform-required” vs “app-controlled” (tag by schema + object owner to keep red-flags actionable)?

## Sanity Check Findings (repo scan)

### BREAKAGE RISKS
- Add-catch uses direct PostgREST INSERTs into `sessions` and `catches`; revoking INSERT will break submit. Evidence: `src/pages/AddCatch.tsx`.
- Catch detail edits use direct PostgREST UPDATEs on `catches` (edit + soft delete) and DELETEs on `profile_follows`/`catch_reactions`; revoking these will break edit/unfollow/unreact. Evidence: `src/lib/supabase-queries.ts`, `src/hooks/useCatchInteractions.ts`.
- Profile and settings update `profiles` directly; revoking UPDATE breaks profile edits and privacy toggles. Evidence: `src/pages/profile/hooks/useProfileData.ts`, `src/pages/ProfileSettings.tsx`.
- Notifications UI uses direct SELECT/UPDATE/DELETE on `notifications` plus realtime; revoking will break the bell/section. Evidence: `src/lib/notifications.ts`, `src/hooks/useNotificationsData.ts`, `src/components/NotificationsBell.tsx`.
- Search and Insights rely on direct SELECTs from `profiles`/`catches` and `sessions`/`catches`; revoking SELECT will break those surfaces. Evidence: `src/lib/search.ts`, `src/pages/Insights.tsx`.
- Storage buckets used by client: `catches` (add-catch upload), `avatars` (profile photo), `venue-photos` (owner/admin photos). Policies must preserve these paths. Evidence: `src/pages/AddCatch.tsx`, `src/lib/storage.ts`, `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx`.
- Realtime subscriptions depend on `notifications`, `reports`, `moderation_log`, and `catches` being in publication + RLS-allowed. Evidence: `src/hooks/useNotificationsData.ts`, `src/pages/AdminReports.tsx`, `src/pages/AdminAuditLog.tsx`, `src/hooks/useLeaderboardRealtime.ts`.

### REQUIRED EXCEPTIONS (client-visible access that must remain)
- Direct writes needed for core UX (authenticated): `catches` INSERT/UPDATE, `sessions` INSERT, `profiles` UPDATE, `profile_follows` DELETE, `catch_reactions` DELETE, `notifications` UPDATE/DELETE. Evidence: `src/pages/AddCatch.tsx`, `src/lib/supabase-queries.ts`, `src/pages/profile/hooks/useProfileData.ts`, `src/hooks/useCatchInteractions.ts`, `src/lib/notifications.ts`.
- Direct reads needed (PostgREST): `profiles` (auth, deleted gate, search, admin lookups), `admin_users` (admin gating), `venues`, `tags`, `baits`, `water_types`, `sessions`, `catches`, `profile_follows`, `profile_blocks`, `venue_rules`, `venue_opening_hours`, `venue_pricing_tiers`, `venue_species_stock`, `venue_owners`, `catch_reactions`, `leaderboard_scores_detailed` (view), `catch_comments_with_admin` (view), `catch_mention_candidates` (view), plus admin reads of `user_warnings`, `moderation_log`, `catch_comments`. Evidence: `src/pages/Auth.tsx`, `src/components/DeletedAccountGate.tsx`, `src/components/Navbar.tsx`, `src/lib/search.ts`, `src/pages/Insights.tsx`, `src/pages/venue-detail/hooks/useVenueDetailData.ts`, `src/hooks/useCatchComments.ts`, `src/pages/AdminReports.tsx`, `src/pages/AdminUserModeration.tsx`, `src/pages/AdminAuditLog.tsx`.
- RPC EXECUTE must remain for the functions actually called by the client (see access map below); tightening should be allowlist-by-role, not blanket. Evidence: `src/**` references to `supabase.rpc(...)`.
- NOTE: The “required exceptions” list is the primary input to Phase P1 allowlisting; once a surface is converted to RPC-only, we should immediately shrink direct table grants accordingly.

### SAFE P0 WINS (based on src usage only)
- No direct PostgREST writes found in client code for admin/moderation/rate-limit tables (`admin_users`, `reports`, `moderation_log`, `user_warnings`, `rate_limits`); any anon/auth INSERT/UPDATE/DELETE grants here look removable (admin actions are via RPCs). Evidence: `src/pages/AdminReports.tsx`, `src/pages/AdminUserModeration.tsx`, `src/pages/AdminAuditLog.tsx`.
- No direct PostgREST INSERTs found for `profile_follows` or `catch_reactions` (follow/react use RPCs); if granted, INSERT can be revoked while keeping DELETE. Evidence: `src/pages/profile/hooks/useProfileData.ts`, `src/hooks/useCatchInteractions.ts`.
- No direct PostgREST writes found for venue owner/admin tables (`venue_rules`, `venue_opening_hours`, `venue_pricing_tiers`, `venue_species_stock`, `venue_photos`); writes are via admin/owner RPCs. Evidence: `src/pages/venue-owner-admin/components/*`, `src/pages/my-venues/components/RulesCard.tsx`.
- No direct DELETE on `catches` or `sessions` in client code (soft delete uses UPDATE); DELETE grants can be revoked if present. Evidence: `src/lib/supabase-queries.ts`, `src/pages/AddCatch.tsx`.
- Internal tables should have *no* `PUBLIC/anon` grants. `authenticated` SELECT on `admin_users` is a temporary compromise for client-side admin gating; plan to replace with an RPC or a restricted view to remove direct table SELECT from non-admin users.

### TODO PROBES (before migrations)
- Run live grant/RLS probes: `docs/version5/hardening/_global/legacy/sql/GRANTS-REDFLAGS-LIVE.sql`, `docs/version5/hardening/_global/legacy/sql/GRANTS-SUMMARY-LIVE.sql`, `docs/version5/hardening/_global/legacy/sql/RLS-COVERAGE-LIVE.sql`, `docs/version5/hardening/_global/legacy/sql/RLS-POLICIES-LIVE.sql`.
- Run RPC probes: `docs/version5/hardening/_global/legacy/sql/RPC-REGISTRY-LIVE.sql`, `docs/version5/hardening/_global/legacy/sql/RPC-POSTURE-LIVE.sql`; compare to code usage and tighten EXECUTE (RPC-REGISTRY.md already shows admin_* EXECUTE to PUBLIC/anon/auth in the pasted live snapshot).
- Verify view security posture for `leaderboard_scores_detailed`, `catch_comments_with_admin`, `catch_mention_candidates` (security_invoker / owner / reloptions).
- Verify storage policies for buckets `avatars`, `catches`, `venue-photos` in `storage.objects`.
- Verify realtime publication membership + RLS for `notifications`, `reports`, `moderation_log`, `catches`.
- Verify `handle_new_user` trigger and search_path in live DB (`supabase/migrations/1001_core_schema.sql`) and confirm no client privilege dependencies.

## Client DB Access Map (from code search)

Notes:
- This is direct client usage from `src/**`; it does not include RPC-internal table access.
- Admin gating uses `admin_users` via `isAdminUser` in multiple surfaces (`src/lib/admin.ts`).

| Surface (route) | Tables read (direct PostgREST) | Tables written (direct PostgREST) | RPCs called | Storage ops |
| --- | --- | --- | --- | --- |
| Shared (Layout/Navbar/Notifications/DeletedAccountGate) | profiles, admin_users, notifications | notifications (update/delete) | Realtime: `notifications` channel | None |
| /auth | profiles | None | None | None |
| /account-deleted | None | None | None | None |
| / | leaderboard_scores_detailed (view), profiles | None | get_community_stats; get_leaderboard_scores; get_species_options | None |
| /venues | None (RPC-only) | None | get_venues; get_venue_photos; get_venue_recent_catches | None |
| /venues/:slug | venue_opening_hours; venue_pricing_tiers; venue_rules; venue_species_stock; venue_owners | None | get_venue_by_slug; get_my_venue_rating; get_venue_upcoming_events; get_venue_past_events; get_venue_photos; get_venue_top_catches; get_venue_recent_catches; upsert_venue_rating | None |
| /feed | venues; admin_users | None | get_feed_catches; get_species_options | None |
| /leaderboard | leaderboard_scores_detailed (view) | None | get_leaderboard_scores; get_species_options; Realtime: `catches` channel | None |
| /add-catch | venues; tags; baits; water_types; sessions; admin_users | sessions (insert); catches (insert) | None | uploads to `catches` bucket + public URLs |
| /catch/:id | catches; catch_reactions; profile_follows; catch_comments_with_admin (view); catch_mention_candidates (view); admin_users | catches (update); profile_follows (delete); catch_reactions (delete) | get_catch_rating_summary; create_comment_with_rate_limit; soft_delete_comment; follow_profile_with_rate_limit; react_to_catch_with_rate_limit; rate_catch_with_rate_limit; create_report_with_rate_limit; create_notification; notify_admins_for_report | None |
| /profile/:slug/* | profiles; profile_follows; profile_blocks; catches; admin_users | profiles (update); profile_follows (delete) | get_profile_for_profile_page; get_follower_count; follow_profile_with_rate_limit; block_profile; unblock_profile; create_notification | None |
| /settings/profile | profiles; profile_blocks; admin_users | profiles (update) | request_account_export; request_account_deletion; unblock_profile | uploads to `avatars` bucket |
| /sessions | sessions; admin_users | None | None | None |
| /admin/reports | profiles; catches; catch_comments; user_warnings; moderation_log | None | admin_list_reports; admin_update_report_status; admin_delete_catch; admin_delete_comment; admin_restore_catch; admin_restore_comment; admin_warn_user; Realtime: `reports` channel | None |
| /admin/audit-log | profiles; catch_comments | None | admin_list_moderation_log; Realtime: `moderation_log` channel | None |
| /admin/users/:userId/moderation | profiles; user_warnings | None | admin_list_moderation_log; admin_warn_user; admin_clear_moderation_status | None |
| /admin/venues | admin_users | None | admin_get_venues | None |
| /admin/venues/:slug | venue_owners; profiles; venue_rules; venue_opening_hours; venue_pricing_tiers; venue_species_stock | None | admin_get_venue_by_slug; admin_get_venue_events; admin_update_venue_metadata; admin_add_venue_owner; admin_remove_venue_owner; admin_update_venue_event; admin_create_venue_event; admin_delete_venue_event; admin_update_venue_booking; admin_update_venue_rules;<br>admin_create_venue_pricing_tier; admin_update_venue_pricing_tier; admin_delete_venue_pricing_tier;<br>admin_create_venue_opening_hour; admin_update_venue_opening_hour; admin_delete_venue_opening_hour;<br>admin_create_venue_species_stock; admin_update_venue_species_stock; admin_delete_venue_species_stock;<br>get_venue_photos; admin_add_venue_photo; admin_delete_venue_photo; admin_set_venue_photo_primary | uploads/removes in `venue-photos` bucket |
| /search | profile_follows; profiles; catches | None | None | None |
| /insights | sessions; catches | None | get_insights_aggregates | None |
| /my/venues | venue_owners | None | None | None |
| /my/venues/:slug | venue_rules; venue_opening_hours; venue_pricing_tiers; venue_species_stock | None | owner_get_venue_by_slug; owner_get_venue_events; owner_update_venue_metadata; owner_update_venue_event; owner_create_venue_event; owner_delete_venue_event; owner_update_venue_booking; owner_update_venue_rules;<br>owner_create_venue_pricing_tier; owner_update_venue_pricing_tier; owner_delete_venue_pricing_tier;<br>owner_create_venue_opening_hour; owner_update_venue_opening_hour; owner_delete_venue_opening_hour;<br>owner_create_venue_species_stock; owner_update_venue_species_stock; owner_delete_venue_species_stock;<br>get_venue_photos; owner_add_venue_photo; owner_delete_venue_photo; owner_set_venue_photo_primary | uploads/removes in `venue-photos` bucket |
| * (NotFound) | None | None | None | None |
