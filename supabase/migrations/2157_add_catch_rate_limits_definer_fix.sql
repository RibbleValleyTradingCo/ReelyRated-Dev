-- 2157_add_catch_rate_limits_definer_fix.sql
-- Purpose:
-- - Fix Add Catch rate-limit logging without granting client table privileges.
-- - Tighten storage.objects policies for the 'catches' bucket to owner-scoped writes.
-- Rationale:
-- - public.rate_limits is internal; do NOT grant INSERT to client roles.
-- - SECURITY DEFINER is required for trigger-side writes; pin search_path and schema-qualify.

-- -------------------------------------------------------------------
-- A) Rate-limit trigger boundary: make writer privileged + safe.
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_catch_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.check_rate_limit(auth.uid(), 'catches', 10, 60) THEN
    RAISE EXCEPTION 'RATE_LIMITED: catches – max 10 per hour';
  END IF;

  INSERT INTO public.rate_limits (user_id, action, created_at)
  VALUES (auth.uid(), 'catches', pg_catalog.now());

  RETURN NEW;
END;
$$;

-- EXECUTE privilege hardening (least-privilege for SECURITY DEFINER)
-- - SECURITY DEFINER functions should not be executable by PUBLIC/anon by default.
-- - Grant only what Add Catch requires (authenticated inserts on public.catches).
REVOKE EXECUTE ON FUNCTION public.enforce_catch_rate_limit() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_catch_rate_limit() FROM anon;
GRANT EXECUTE ON FUNCTION public.enforce_catch_rate_limit() TO authenticated;

-- Optional: restrict SECURITY DEFINER helper execution as well.
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) TO authenticated;

-- -------------------------------------------------------------------
-- B) Storage policies for 'catches' bucket: public read, owner-scoped writes.
-- -------------------------------------------------------------------
-- Notes:
-- - Supabase storage uses owner_id (text) going forward; owner (uuid) is deprecated.
--   We allow either column to match for transition safety.
-- - Avoid public SELECT on storage.objects to prevent metadata enumeration.
-- - Bucket public/private access model is separate from RLS; RLS still governs uploads/deletes.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'catches_public_read'
  ) THEN
    DROP POLICY "catches_public_read" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'catches_authenticated_manage'
  ) THEN
    DROP POLICY "catches_authenticated_manage" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'catches_authenticated_manage_own'
  ) THEN
    DROP POLICY "catches_authenticated_manage_own" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'catches_authenticated_select_own'
  ) THEN
    DROP POLICY "catches_authenticated_select_own" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'catches_authenticated_insert_own'
  ) THEN
    DROP POLICY "catches_authenticated_insert_own" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'catches_authenticated_update_own'
  ) THEN
    DROP POLICY "catches_authenticated_update_own" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'catches_authenticated_delete_own'
  ) THEN
    DROP POLICY "catches_authenticated_delete_own" ON storage.objects;
  END IF;
END;
$$;

-- Authenticated users can manage only their own objects in the catches bucket.
CREATE POLICY "catches_authenticated_select_own"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'catches'
    AND (owner_id = auth.uid()::text OR owner = auth.uid())
  );

CREATE POLICY "catches_authenticated_insert_own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'catches'
    AND (owner_id = auth.uid()::text OR owner = auth.uid())
  );

CREATE POLICY "catches_authenticated_update_own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'catches'
    AND (owner_id = auth.uid()::text OR owner = auth.uid())
  )
  WITH CHECK (
    bucket_id = 'catches'
    AND (owner_id = auth.uid()::text OR owner = auth.uid())
  );

CREATE POLICY "catches_authenticated_delete_own"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'catches'
    AND (owner_id = auth.uid()::text OR owner = auth.uid())
  );
