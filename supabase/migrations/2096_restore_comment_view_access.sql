-- 2096_restore_comment_view_access.sql
-- Restore authenticated read access to comment/mention views used by catch detail pages.

SET search_path = public, extensions;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND table_name = 'catch_comments_with_admin'
      AND grantee = 'authenticated'
      AND privilege_type = 'SELECT'
  ) THEN
    GRANT SELECT ON public.catch_comments_with_admin TO authenticated;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND table_name = 'catch_mention_candidates'
      AND grantee = 'authenticated'
      AND privilege_type = 'SELECT'
  ) THEN
    GRANT SELECT ON public.catch_mention_candidates TO authenticated;
  END IF;
END;
$$;
