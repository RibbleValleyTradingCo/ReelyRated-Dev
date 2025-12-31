-- 2134_reinstate_catches_feed_visibility.sql
-- Reinstate block/privacy enforcement for feed visibility (catches SELECT policy).

SET search_path = public, extensions;

-- Remove permissive policies introduced by later migrations.
DROP POLICY IF EXISTS catches_select_viewable ON public.catches;
DROP POLICY IF EXISTS catches_public_read ON public.catches;

CREATE POLICY catches_public_read ON public.catches
  FOR SELECT
  USING (
    deleted_at IS NULL AND (
      auth.uid() = user_id
      OR EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())
      OR (
        -- RLS treats NULL as false; default to not blocked for anon.
        COALESCE(public.is_blocked_either_way(auth.uid(), public.catches.user_id), FALSE) = FALSE
        AND (
          visibility = 'public' AND (
            NOT EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.id = public.catches.user_id AND p.is_private = TRUE
            )
            OR (
              auth.uid() IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.profile_follows pf
                WHERE pf.follower_id = auth.uid() AND pf.following_id = public.catches.user_id
              )
            )
          )
          OR (
            visibility = 'followers'
            AND auth.uid() IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM public.profile_follows pf
              WHERE pf.follower_id = auth.uid() AND pf.following_id = public.catches.user_id
            )
          )
        )
      )
    )
  );

COMMENT ON POLICY catches_public_read ON public.catches IS 'Public/admin/owner read with profile privacy and block checks. See docs/BLOCK-MUTE-DESIGN.md.';

-- Rollback plan (manual):
-- 1) DROP POLICY catches_public_read ON public.catches;
-- 2) Recreate catches_select_viewable (2025_fix_catch_visibility.sql) if needed.
-- 3) Re-apply any legacy policy comments.
--
-- Verification SQL (post-migration):
-- -- Impersonate authenticated viewer A
-- SELECT set_config('request.jwt.claim.sub', '<viewer_uuid>', true);
-- SELECT set_config('request.jwt.claim.role', 'authenticated', true);
-- -- Blocked: viewer A blocked by user B
-- SELECT count(*) FROM public.catches
-- WHERE user_id = '<blocked_user_uuid>' AND deleted_at IS NULL; -- expect 0
-- -- Private profile: viewer A does not follow user C
-- SELECT count(*) FROM public.catches
-- WHERE user_id = '<private_user_uuid>' AND visibility = 'public'; -- expect 0 unless viewer follows
-- -- Owner view: viewer A owns their catches
-- SELECT count(*) FROM public.catches
-- WHERE user_id = '<viewer_uuid>' AND deleted_at IS NULL; -- expect >= 0
-- -- Admin view: viewer A is an admin user
-- SELECT count(*) FROM public.catches
-- WHERE user_id = '<any_user_uuid>' AND deleted_at IS NULL; -- expect rows if present
-- -- Anonymous: clear sub + set anon role
-- SELECT set_config('request.jwt.claim.sub', '', true);
-- SELECT set_config('request.jwt.claim.role', 'anon', true);
-- SELECT count(*) FROM public.catches
-- WHERE visibility = 'public' AND deleted_at IS NULL; -- expect public-only
