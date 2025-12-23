-- 2120_create_venue_photos_bucket.sql
-- Ensure the venue-photos bucket exists and add RLS policies for public read + owner/admin manage.

SET search_path = public, extensions;

-- Create the venue-photos bucket (public read) if it doesn't exist.
INSERT INTO storage.buckets (id, name, public)
VALUES ('venue-photos', 'venue-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing venue-photos policies if they exist to keep this idempotent.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'venue_photos_public_read'
  ) THEN
    DROP POLICY "venue_photos_public_read" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'venue_photos_authenticated_manage'
  ) THEN
    DROP POLICY "venue_photos_authenticated_manage" ON storage.objects;
  END IF;
END;
$$;

-- Allow public read of venue photos.
CREATE POLICY "venue_photos_public_read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'venue-photos');

-- Allow authenticated venue owners/admins to manage objects under <venue_id>/...
CREATE POLICY "venue_photos_authenticated_manage"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'venue-photos'
    AND public.is_venue_admin_or_owner(
      CASE
        WHEN split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          THEN split_part(name, '/', 1)::uuid
        ELSE NULL
      END
    )
  )
  WITH CHECK (
    bucket_id = 'venue-photos'
    AND public.is_venue_admin_or_owner(
      CASE
        WHEN split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          THEN split_part(name, '/', 1)::uuid
        ELSE NULL
      END
    )
  );
