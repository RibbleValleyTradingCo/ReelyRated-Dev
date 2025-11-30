-- 2066_update_comment_view_block_filter.sql
-- Recreate catch_comments_with_admin view to ensure blocked users' comments are excluded for non-admin viewers.
-- Admins still see all comments.
-- See docs/BLOCK-MUTE-DESIGN.md / BLOCK-MUTE-TESTS.md.

SET search_path = public, extensions;

CREATE OR REPLACE VIEW public.catch_comments_with_admin AS
SELECT
  cc.*,
  public.is_admin(cc.user_id) AS is_admin_author
FROM public.catch_comments cc
JOIN public.catches c ON c.id = cc.catch_id
WHERE
  -- Admins see everything
  public.is_admin(auth.uid())
  OR (
    -- Non-admins: hide comments when either party is blocked
    NOT public.is_blocked_either_way(auth.uid(), cc.user_id)
    AND NOT public.is_blocked_either_way(auth.uid(), c.user_id)
  );
