-- 2086_venues_rls.sql
-- Enable RLS and add policies for venues per RLS-DESIGN (public read of published, owner/admin access, admin-only insert).

SET search_path = public, extensions;

-- Enable RLS on venues
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Public/anon/authenticated can select published venues
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'venues' AND policyname = 'venues_select_published'
  ) THEN
    DROP POLICY venues_select_published ON public.venues;
  END IF;
  CREATE POLICY venues_select_published ON public.venues
    FOR SELECT
    USING (is_published = true);

  -- Owners can select their venues
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'venues' AND policyname = 'venues_select_owner'
  ) THEN
    DROP POLICY venues_select_owner ON public.venues;
  END IF;
  CREATE POLICY venues_select_owner ON public.venues
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.venue_owners vo
        WHERE vo.venue_id = public.venues.id
          AND vo.user_id = auth.uid()
      )
    );

  -- Owners can update their venues
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'venues' AND policyname = 'venues_update_owner'
  ) THEN
    DROP POLICY venues_update_owner ON public.venues;
  END IF;
  CREATE POLICY venues_update_owner ON public.venues
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.venue_owners vo
        WHERE vo.venue_id = public.venues.id
          AND vo.user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.venue_owners vo
        WHERE vo.venue_id = public.venues.id
          AND vo.user_id = auth.uid()
      )
    );

  -- Admins can select all venues
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'venues' AND policyname = 'venues_select_admin_all'
  ) THEN
    DROP POLICY venues_select_admin_all ON public.venues;
  END IF;
  CREATE POLICY venues_select_admin_all ON public.venues
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()));

  -- Admins can update all venues
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'venues' AND policyname = 'venues_update_admin_all'
  ) THEN
    DROP POLICY venues_update_admin_all ON public.venues;
  END IF;
  CREATE POLICY venues_update_admin_all ON public.venues
    FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()));

  -- Admin-only inserts
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'venues' AND policyname = 'venues_insert_admin_only'
  ) THEN
    DROP POLICY venues_insert_admin_only ON public.venues;
  END IF;
  CREATE POLICY venues_insert_admin_only ON public.venues
    FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()));
END;
$$;
