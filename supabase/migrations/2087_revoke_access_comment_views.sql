-- 2087_revoke_access_comment_views.sql
-- Revoke direct access to admin-only comment views (catch_comments_with_admin, catch_mention_candidates).

SET search_path = public, extensions;

REVOKE ALL ON public.catch_comments_with_admin FROM anon, authenticated;
REVOKE ALL ON public.catch_mention_candidates FROM anon, authenticated;
