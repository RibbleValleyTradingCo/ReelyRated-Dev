-- ⚠️ LEGACY (archived 2026-01-13)
-- Preserved v1 global probe/notes for audit/history.
-- Current work lives in: docs/version5/hardening/_global/v2/ (see _global/README.md).
-- Do not modify semantics here; only edit if fixing broken internal legacy links/comments.

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
