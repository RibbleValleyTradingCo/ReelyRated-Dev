-- 2063_profile_blocks_enforcement.sql
-- Enforce profile blocks in catches and comments RLS.
-- See docs/BLOCK-MUTE-DESIGN.md.

SET search_path = public, extensions;

-- Update catches SELECT policy to exclude blocked relationships (except admin/owner).
DROP POLICY IF EXISTS catches_public_read ON public.catches;
CREATE POLICY catches_public_read ON public.catches
  FOR SELECT
  USING (
    deleted_at IS NULL AND (
      auth.uid() = user_id
      OR EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())
      OR (
        NOT public.is_blocked_either_way(auth.uid(), public.catches.user_id)
        AND (
          visibility = 'public' AND (
            NOT EXISTS (
              SELECT 1 FROM public.profiles p WHERE p.id = public.catches.user_id AND p.is_private = TRUE
            )
            OR (
              auth.uid() IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.profile_follows pf WHERE pf.follower_id = auth.uid() AND pf.following_id = public.catches.user_id
              )
            )
          )
          OR (
            visibility = 'followers'
            AND auth.uid() IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM public.profile_follows pf WHERE pf.follower_id = auth.uid() AND pf.following_id = public.catches.user_id
            )
          )
        )
      )
    )
  );

COMMENT ON POLICY catches_public_read ON public.catches IS 'Public/admin/owner read with profile privacy and block checks. See docs/BLOCK-MUTE-DESIGN.md.';

-- Update catch_comments SELECT policy to exclude blocked relationships (except admin/owner).
DROP POLICY IF EXISTS catch_comments_public_read ON public.catch_comments;
CREATE POLICY catch_comments_public_read ON public.catch_comments
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.catches c
      WHERE c.id = public.catch_comments.catch_id
        AND c.deleted_at IS NULL
        AND (
          auth.uid() = c.user_id
          OR EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())
          OR (
            NOT public.is_blocked_either_way(auth.uid(), c.user_id)
            AND NOT public.is_blocked_either_way(auth.uid(), public.catch_comments.user_id)
            AND (
              c.visibility = 'public' AND (
                NOT EXISTS (
                  SELECT 1 FROM public.profiles p WHERE p.id = c.user_id AND p.is_private = TRUE
                )
                OR (
                  auth.uid() IS NOT NULL AND EXISTS (
                    SELECT 1 FROM public.profile_follows pf WHERE pf.follower_id = auth.uid() AND pf.following_id = c.user_id
                  )
                )
              )
              OR (
                c.visibility = 'followers'
                AND auth.uid() IS NOT NULL
                AND EXISTS (
                  SELECT 1 FROM public.profile_follows pf WHERE pf.follower_id = auth.uid() AND pf.following_id = c.user_id
                )
              )
            )
          )
        )
    )
  );

COMMENT ON POLICY catch_comments_public_read ON public.catch_comments IS 'Public/admin/owner read with privacy and block checks. See docs/BLOCK-MUTE-DESIGN.md.';
