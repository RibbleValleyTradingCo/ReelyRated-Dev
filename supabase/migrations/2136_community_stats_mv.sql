SET search_path = public, extensions;

DROP FUNCTION IF EXISTS public.get_community_stats();

DROP MATERIALIZED VIEW IF EXISTS public.community_stats;

CREATE MATERIALIZED VIEW public.community_stats AS
SELECT
  count(*) FILTER (WHERE visibility = 'public' AND deleted_at IS NULL) AS total_catches,
  count(DISTINCT user_id) FILTER (WHERE visibility = 'public' AND deleted_at IS NULL) AS active_anglers,
  count(
    DISTINCT NULLIF(trim(COALESCE(location_label, location)), '')
  ) FILTER (WHERE visibility = 'public' AND deleted_at IS NULL) AS waterways,
  now() AS updated_at
FROM public.catches;

CREATE UNIQUE INDEX IF NOT EXISTS community_stats_one_row ON public.community_stats ((1));

CREATE OR REPLACE FUNCTION public.get_community_stats()
RETURNS TABLE (
  total_catches bigint,
  active_anglers bigint,
  waterways bigint,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT total_catches, active_anglers, waterways, updated_at
  FROM public.community_stats
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_community_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_community_stats() TO anon, authenticated;

-- Refresh strategy: if pg_cron is available, refresh every 10 minutes.
-- If pg_cron is unavailable, refresh manually with:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY public.community_stats;
DO $$
DECLARE
  job_exists boolean;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      EXECUTE 'SELECT EXISTS (SELECT 1 FROM cron.job WHERE jobname = ''refresh_community_stats'')'
        INTO job_exists;
      IF job_exists THEN
        EXECUTE 'SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = ''refresh_community_stats''';
      END IF;
      EXECUTE 'SELECT cron.schedule(''refresh_community_stats'', ''*/10 * * * *'', ''REFRESH MATERIALIZED VIEW CONCURRENTLY public.community_stats'')';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'pg_cron present but scheduling failed: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'pg_cron not available; refresh community_stats manually.';
  END IF;
END $$;
