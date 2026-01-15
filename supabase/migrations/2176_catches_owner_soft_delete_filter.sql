-- 2176_catches_owner_soft_delete_filter.sql
-- Purpose: enforce soft-delete contract for owners on public.catches.
-- PERMISSIVE policies OR together, so the owner policy must include deleted_at IS NULL.

BEGIN;

ALTER POLICY "catches_owner_all" ON public.catches
  USING (((select auth.uid()) = user_id) AND (deleted_at IS NULL));

-- Verification (SQL-only):
-- 1) Re-run docs/version5/hardening/_global/sql/68_0006_SOFT_DELETE_VISIBILITY_CHECK.sql
--    Expect: catches_owner_all matches_deleted_filter=true and owner_can_see_deleted_risk=false.
-- 2) Optional: re-run docs/version5/hardening/_global/sql/67_MULTIPLE_PERMISSIVE_POLICIES_BREAKDOWN.sql.

COMMIT;
