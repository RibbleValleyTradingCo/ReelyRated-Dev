-- 2173_public_stats_rls_policies.sql
-- Purpose: enable RLS where missing and add public-read SELECT policies (public schema only).
-- Non-goals: no grants changes; no DML policies; no non-public schemas.

BEGIN;

-- Enable RLS on previously exposed tables.
ALTER TABLE public.catch_leaderboard_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catch_rating_stats ENABLE ROW LEVEL SECURITY;

-- Ensure public-read SELECT policies exist for stats tables.
DO $$
DECLARE
  t text;
  policy_name text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'catch_leaderboard_scores',
    'catch_rating_stats',
    'community_stats_live',
    'community_stats_users',
    'community_stats_waterways'
  ]
  LOOP
    policy_name := t || '_select_public';
    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = t
        AND policyname = policy_name
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)',
        policy_name,
        t
      );
    END IF;
  END LOOP;
END;
$$;

COMMIT;
