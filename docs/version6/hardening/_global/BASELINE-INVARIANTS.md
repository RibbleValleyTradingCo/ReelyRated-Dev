# Baseline Invariants (v2)

Purpose: define global, DB-wide security invariants for least privilege and deny-by-default posture. Each invariant includes why it matters and how it is measured.

## Principle
- Deny by default.
- Least privilege.
- No data leakage beyond intended personas.

## Schemas & ownership
1) Public/exposed schemas must not grant CREATE to `PUBLIC`, `anon`, or `authenticated`.
- Why it matters: schema CREATE enables object injection.
- How we measure it: `sql/10_GRANTS_SNAPSHOT.sql` (object_type = schema, privilege_type = CREATE) and `sql/90_GATES_SUMMARY.sql` gate G1.

2) Only app-owned schemas should be in scope for global gates (public + app schemas); platform schemas are tracked separately.
- Why it matters: platform schemas often have intentional grants outside app control.
- How we measure it: `sql/10_GRANTS_SNAPSHOT.sql` and `sql/70_STORAGE_POSTURE.sql` (informational).

## Grants invariants (tables/views/sequences)
3) `PUBLIC` and `anon` must not have DML (INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER) on app tables unless explicitly justified.
- Why it matters: prevents broken access control and bulk abuse.
- How we measure it: `sql/10_GRANTS_SNAPSHOT.sql` + `sql/90_GATES_SUMMARY.sql` gate G2.

4) Sequence UPDATE should not be granted to `PUBLIC` or `anon` in app schemas.
- Why it matters: can permit identity manipulation.
- How we measure it: `sql/10_GRANTS_SNAPSHOT.sql` (object_type = sequence, privilege_type = UPDATE).

## RLS invariants
5) All exposed tables in app schemas must have RLS enabled.
- Why it matters: Supabase Data API assumes RLS for access control.
- How we measure it: `sql/20_RLS_COVERAGE.sql` (gate rows where relrowsecurity = false and grants to anon/auth exist).

6) RLS-enabled tables must have at least one policy.
- Why it matters: RLS enabled with 0 policies typically denies all or indicates a drifted policy setup.
- How we measure it: `sql/20_RLS_COVERAGE.sql` (gate rows where relrowsecurity = true and policy_count = 0).

## RPC invariants
7) EXECUTE is allowlist-only; `PUBLIC` and `anon` must be explicitly revoked unless intentionally public.
- Why it matters: functions are callable by PUBLIC by default.
- How we measure it: `sql/50_RPC_POSTURE_GATES.sql` and `sql/90_GATES_SUMMARY.sql` gate G3/G4.

8) SECURITY DEFINER functions must pin search_path and schema-qualify references.
- Why it matters: search_path injection risk in definer functions.
- How we measure it: `sql/40_RPC_REGISTRY.sql` and `sql/50_RPC_POSTURE_GATES.sql` (missing search_path in proconfig).

## View invariants
9) Public views must be security_invoker=true or have a documented exception.
- Why it matters: invoker context enforces caller privileges + RLS on base relations (PG15+).
- How we measure it: `sql/60_VIEW_SECURITY_POSTURE.sql` and `sql/90_GATES_SUMMARY.sql` gate G5.

## Storage invariants
10) storage.objects policies must be bucket-scoped and owner-scoped for writes.
- Why it matters: prevents cross-user object writes/overwrites.
- How we measure it: `sql/70_STORAGE_POSTURE.sql` (best-effort) + manual review of policy expressions.

## Realtime invariants
11) Realtime publications should not include tables with RLS disabled or overly broad grants.
- Why it matters: realtime can leak changes bypassing expected UI flows.
- How we measure it: `sql/80_REALTIME_POSTURE.sql` (best-effort) + `sql/20_RLS_COVERAGE.sql`.

## Notes
- Exceptions must be documented in surface pipelines and referenced back here.
- Global gates are additive: a surface exception should not turn a global gate into a permanent FAIL; instead document the exception and adjust allowlists explicitly.
