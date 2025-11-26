-- 2035_catch_comments_with_admin_view.sql
-- Purpose: expose is_admin_author via a view to avoid PostgREST function projection errors.

SET search_path = public, extensions;

CREATE OR REPLACE VIEW public.catch_comments_with_admin AS
SELECT
  cc.*,
  public.is_admin(cc.user_id) AS is_admin_author
FROM public.catch_comments cc;
