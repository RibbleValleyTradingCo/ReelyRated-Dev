> ⚠️ LEGACY (archived 2026-01-13)
> This file is the v1 global hardening attempt preserved for audit/history.
> Current work lives in: docs/version5/hardening/_global/v2/ (see _global/README.md).
> Do not update posture here unless you are explicitly updating legacy history notes.

# Global DB Lockdown Runbook (Local)

## Scope

This runbook is **local-only** and is executed before promoting any DB lockdown changes to hosted/dev. It is the operational checklist; the strategy/status lives in `docs/version5/hardening/_global/legacy/GLOBAL-DB-LOCKDOWN-PLAN.md`.

## Preconditions (local)

- [ ] Local Supabase stack is running.
- [ ] Correct git branch checked out.
- [ ] Working tree is clean (or all diffs are understood and recorded).
- [ ] P0 migrations exist locally:
  - `supabase/migrations/2154_p0_global_grants_lockdown.sql`
  - `supabase/migrations/2155_default_privileges_lockdown.sql`
- [ ] Evidence folder exists: `docs/version5/hardening/_global/legacy/evidence/`.

## Run order (local)

### 1) Apply P0 migrations (if not already applied)

Choose **one** of the following (local only):

- Full reset + apply all migrations:
  - `supabase db reset`
- Or apply only pending migrations:
  - `supabase migration up`

### 1b) Apply P1 migration (when scheduled)

- Apply the next P1 migration (local-only), e.g.:
  - `supabase migration up`
- Confirm `supabase/migrations/2156_p1_public_allowlist_step1.sql` is applied before running post-P1 probes.

### 2) Run all probes (consistent order)

Run each SQL file in `docs/version5/hardening/_global/legacy/sql/` and export results as CSV. Suggested order:

1) Grants posture
- `GRANTS-LIVE.sql`
- `GRANTS-SUMMARY-LIVE.sql`
- `GRANTS-DEFAULT-PRIVS-LIVE.sql`
- `GRANTS-REDFLAGS-PUBLIC-ONLY.sql`
- `GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-GROUPED.sql`
- `GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-TOTAL.sql`
- `GRANTS-REDFLAGS-PLATFORM-MANAGED.sql`
- `GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS-GROUPED.sql`
- `GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS-TOTAL.sql`
- `GRANTS-REDFLAGS-LIVE.sql`

2) RLS posture
- `RLS-COVERAGE-LIVE.sql`
- `RLS-POLICIES-LIVE.sql`

3) RPC posture
- `RPC-REGISTRY-LIVE.sql`
- `RPC-POSTURE-LIVE.sql`

### 2b) Post-2156 probe focus (P1)

After applying 2156, re-run the grants probes that should change and export with the current date:

- `GRANTS-LIVE.sql`
- `GRANTS-SUMMARY-LIVE.sql`
- `GRANTS-REDFLAGS-PUBLIC-ONLY.sql`
- `GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-GROUPED.sql`
- `GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-TOTAL.sql`

### 3) Export CSV evidence

Save each probe result under:

`docs/version5/hardening/_global/legacy/evidence/`

Naming convention:

`<PROBE_NAME>_<YYYY-MM-DD>.csv`

Examples:
- `GRANTS-LIVE_2026-01-12.csv`
- `GRANTS-REDFLAGS-PUBLIC-ONLY_2026-01-12.csv`
- `GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-GROUPED_2026-01-12.csv`
- `GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-TOTAL_2026-01-12.csv`
- `RLS-COVERAGE-LIVE_2026-01-12.csv`
- `RPC-POSTURE-LIVE_2026-01-12.csv`

### 4) Sanity checks (path/typo sweep)

Run these to catch stale paths and typos:

- `rg -n "\bRANTS-" docs/version5/hardening/_global || true`
- `rg -n "_global/legacy/evidence/sql" docs/version5/hardening/_global || true`

### 5) Update docs after capture

- Add/refresh evidence entries in:
  - `docs/version5/hardening/_global/legacy/EVIDENCE-INDEX.md`
  - Include row counts or totals from each CSV.
- Update the plan:
  - `docs/version5/hardening/_global/legacy/GLOBAL-DB-LOCKDOWN-PLAN.md`
  - Execution log (date, migrations, evidence links).
  - P0 validation table (PASS/FAIL + evidence paths).

## Definition of done (local)

P0 checks A–F are computed from CSV evidence and recorded in the plan:

- A) PUBLIC has **no** CREATE on `public` schema.
  - Evidence: `GRANTS-REDFLAGS-PUBLIC-ONLY_<DATE>.csv`
- B) PUBLIC has **no** table write privileges in `public`.
  - Evidence: `GRANTS-REDFLAGS-PUBLIC-ONLY_<DATE>.csv`
- C) anon/authenticated have **no** TRUNCATE/TRIGGER/REFERENCES/MAINTAIN on `public` tables.
  - Evidence: `GRANTS-REDFLAGS-PUBLIC-ONLY_<DATE>.csv`, `GRANTS-LIVE_<DATE>.csv`
- D) anon/authenticated/PUBLIC have **no** sequence UPDATE in `public`.
  - Evidence: `GRANTS-REDFLAGS-PUBLIC-ONLY_<DATE>.csv`
- E) Internal tables (`admin_users`, `moderation_log`, `user_warnings`, `rate_limits` if present):
  - No PUBLIC/anon privileges; authenticated exceptions match plan.
  - Evidence: `GRANTS-LIVE_<DATE>.csv`
- F) Default ACLs: app-owned owners/schemas do **not** grant to PUBLIC/anon/authenticated.
  - Evidence: `GRANTS-DEFAULT-PRIVS-LIVE_<DATE>.csv`

## Promotion gate (local → hosted/dev)

- P0 validation table is fully populated with PASS/FAIL + evidence links.
- Evidence CSVs are committed under `docs/version5/hardening/_global/legacy/evidence/`.
- EVIDENCE-INDEX.md is updated with row counts/totals for each evidence file.
- Any FAIL result has a documented remediation plan in the global plan.
- If a core flow fails due to permission errors (e.g., `rate_limits`), log it as a surface issue and fix via surface-specific migrations/RPC/policy—avoid widening global grants.
- No stale evidence paths (no `_global/legacy/evidence/sql` references; no `RANTS-` typos).
