-- 2054_profile_privacy_enforcement.sql
-- Enforce profile privacy (is_private) on catches and comments via RLS.
-- See docs/FEATURE-ROADMAP.md Phase 2.2 and docs/PROFILE-PRIVACY-DESIGN.md

SET search_path = public, extensions;

-- Catches: enforce profile privacy + visibility + follower/admin/owner access
DROP POLICY IF EXISTS catches_public_read ON public.catches;
CREATE POLICY catches_public_read ON public.catches
  FOR SELECT
  USING (
    deleted_at IS NULL AND (
      auth.uid() = user_id
      OR EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())
      OR (
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
      )
      OR (
        visibility = 'followers'
        AND auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.profile_follows pf WHERE pf.follower_id = auth.uid() AND pf.following_id = public.catches.user_id
        )
      )
    )
  );

-- Comments: visible only when underlying catch is visible under same privacy rules
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
  );

-- NOTE: profiles select policy remains unchanged to allow discoverability; privacy is enforced on catches/comments.
