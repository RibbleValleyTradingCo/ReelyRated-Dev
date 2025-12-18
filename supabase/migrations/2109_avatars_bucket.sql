-- 2109_avatars_bucket.sql
-- Ensure the avatars bucket exists and add RLS so users can manage their own avatars.

SET search_path = public, extensions;

-- Create the avatars bucket (public read) if it doesn't exist.
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing avatars policies if they exist to keep this idempotent.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'avatars_public_read'
  ) THEN
    DROP POLICY "avatars_public_read" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'avatars_authenticated_manage_own'
  ) THEN
    DROP POLICY "avatars_authenticated_manage_own" ON storage.objects;
  END IF;
END;
$$;

-- Allow public read of avatars.
CREATE POLICY "avatars_public_read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Allow authenticated users to manage only their own avatar objects under <user_id>/...
CREATE POLICY "avatars_authenticated_manage_own"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(name, '/', 1)
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(name, '/', 1)
  );
