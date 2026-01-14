-- 2167_profile_detail_unblock_profile_search_path.sql
-- Purpose: pin search_path for unblock_profile (SECURITY DEFINER hygiene; no behavior change).

ALTER FUNCTION public.unblock_profile(uuid) SET search_path = public, extensions;
