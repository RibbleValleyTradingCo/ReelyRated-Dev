SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.get_insights_aggregates(
  p_date_preset text DEFAULT 'all',
  p_custom_start timestamptz DEFAULT NULL,
  p_custom_end timestamptz DEFAULT NULL,
  p_selected_session_id uuid DEFAULT NULL,
  p_selected_venue text DEFAULT NULL
)
RETURNS TABLE (
  total_catches integer,
  total_catches_all integer,
  pb_weight numeric,
  pb_weight_unit text,
  average_weight_kg numeric,
  weighted_catch_count integer,
  average_air_temp numeric,
  bait_counts jsonb,
  method_counts jsonb,
  time_of_day_counts jsonb,
  species_counts jsonb,
  venue_counts jsonb,
  weather_counts jsonb,
  clarity_counts jsonb,
  wind_counts jsonb,
  monthly_counts jsonb,
  session_counts jsonb,
  sessions_count integer,
  venue_options jsonb,
  latest_session_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  WITH
  all_catches AS (
    SELECT c.*
    FROM public.catches c
    WHERE c.user_id = v_user_id
  ),
  latest_session AS (
    SELECT c.session_id
    FROM all_catches c
    WHERE c.session_id IS NOT NULL
    ORDER BY COALESCE(c.caught_at, c.created_at) DESC NULLS LAST
    LIMIT 1
  ),
  filters AS (
    SELECT
      CASE
        WHEN p_selected_session_id IS NOT NULL THEN p_selected_session_id
        WHEN p_date_preset = 'last-session' THEN (SELECT session_id FROM latest_session)
        ELSE NULL
      END AS effective_session_id,
      CASE
        WHEN p_date_preset = 'last-30' THEN date_trunc('day', now()) - interval '29 days'
        WHEN p_date_preset = 'season' THEN date_trunc('year', now())
        WHEN p_date_preset = 'custom' AND p_custom_start IS NOT NULL THEN date_trunc('day', p_custom_start)
        ELSE NULL
      END AS start_ts,
      CASE
        WHEN p_date_preset = 'last-30' THEN date_trunc('day', now()) + interval '1 day'
        WHEN p_date_preset = 'season' THEN date_trunc('day', now()) + interval '1 day'
        WHEN p_date_preset = 'custom' AND p_custom_end IS NOT NULL THEN date_trunc('day', p_custom_end) + interval '1 day'
        WHEN p_date_preset = 'custom' AND p_custom_start IS NOT NULL THEN date_trunc('day', p_custom_start) + interval '1 day'
        ELSE NULL
      END AS end_ts_exclusive
  ),
  filtered AS (
    SELECT c.*
    FROM all_catches c
    CROSS JOIN filters f
    WHERE (f.effective_session_id IS NULL OR c.session_id = f.effective_session_id)
      AND (p_selected_venue IS NULL OR c.location = p_selected_venue)
      AND (f.start_ts IS NULL OR COALESCE(c.caught_at, c.created_at) >= f.start_ts)
      AND (f.end_ts_exclusive IS NULL OR COALESCE(c.caught_at, c.created_at) < f.end_ts_exclusive)
  ),
  derived AS (
    SELECT
      c.*,
      COALESCE(c.caught_at, c.created_at) AS catch_time,
      public.insights_format_label(c.bait_used) AS bait_label,
      CASE
        WHEN c.method IS NOT NULL AND c.method <> 'other' THEN public.insights_format_label(c.method)
        WHEN c.method = 'other' THEN COALESCE(public.insights_format_label((c.conditions -> 'customFields' ->> 'method')), 'Other method')
        ELSE public.insights_format_label((c.conditions -> 'customFields' ->> 'method'))
      END AS method_label,
      CASE
        WHEN c.species IS NOT NULL AND c.species <> 'other' THEN COALESCE((SELECT s.label FROM public.species s WHERE s.slug = c.species), public.insights_format_label(c.species))
        WHEN c.species = 'other' THEN COALESCE(public.insights_format_label((c.conditions -> 'customFields' ->> 'species')), 'Other species')
        ELSE public.insights_format_label((c.conditions -> 'customFields' ->> 'species'))
      END AS species_label,
      CASE
        WHEN c.time_of_day IS NOT NULL THEN public.insights_format_label(c.time_of_day)
        ELSE CASE
          WHEN EXTRACT(hour FROM COALESCE(c.caught_at, c.created_at)) BETWEEN 5 AND 11 THEN 'Morning'
          WHEN EXTRACT(hour FROM COALESCE(c.caught_at, c.created_at)) BETWEEN 12 AND 16 THEN 'Afternoon'
          WHEN EXTRACT(hour FROM COALESCE(c.caught_at, c.created_at)) BETWEEN 17 AND 20 THEN 'Evening'
          ELSE 'Night'
        END
      END AS time_of_day_label,
      public.insights_format_label(c.conditions ->> 'weather') AS weather_label,
      public.insights_format_label(c.conditions ->> 'waterClarity') AS clarity_label,
      CASE
        WHEN c.conditions ->> 'windDirection' IS NULL THEN NULL
        WHEN length(c.conditions ->> 'windDirection') <= 4 THEN upper(c.conditions ->> 'windDirection')
        ELSE public.insights_format_label(c.conditions ->> 'windDirection')
      END AS wind_label,
      CASE
        WHEN c.conditions ->> 'airTemp' ~ '^-?[0-9]+(\\.[0-9]+)?$'
          THEN (c.conditions ->> 'airTemp')::numeric
        ELSE NULL
      END AS air_temp,
      CASE
        WHEN c.weight IS NULL THEN NULL
        WHEN lower(COALESCE(c.weight_unit::text, 'kg')) IN ('kg') THEN c.weight
        WHEN lower(COALESCE(c.weight_unit::text, '')) IN ('lb', 'lbs', 'lb_oz') THEN c.weight * 0.453592
        ELSE c.weight
      END AS weight_kg
    FROM filtered c
  ),
  total_all AS (
    SELECT COUNT(*)::integer AS total_catches_all
    FROM all_catches
  ),
  aggregates AS (
    SELECT
      COUNT(*)::integer AS total_catches,
      (SELECT total_catches_all FROM total_all) AS total_catches_all,
      (SELECT d.weight FROM derived d WHERE d.weight_kg IS NOT NULL ORDER BY d.weight_kg DESC NULLS LAST LIMIT 1) AS pb_weight,
      (SELECT d.weight_unit FROM derived d WHERE d.weight_kg IS NOT NULL ORDER BY d.weight_kg DESC NULLS LAST LIMIT 1) AS pb_weight_unit,
      AVG(d.weight_kg) FILTER (WHERE d.weight_kg IS NOT NULL) AS average_weight_kg,
      COUNT(*) FILTER (WHERE d.weight_kg IS NOT NULL)::integer AS weighted_catch_count,
      AVG(d.air_temp) FILTER (WHERE d.air_temp IS NOT NULL) AS average_air_temp
    FROM derived d
  ),
  bait_counts AS (
    SELECT jsonb_agg(jsonb_build_object('name', bait_label, 'count', count) ORDER BY count DESC) AS value
    FROM (
      SELECT bait_label, COUNT(*)::integer AS count
      FROM derived
      WHERE bait_label IS NOT NULL
      GROUP BY bait_label
    ) s
  ),
  method_counts AS (
    SELECT jsonb_agg(jsonb_build_object('name', method_label, 'count', count) ORDER BY count DESC) AS value
    FROM (
      SELECT method_label, COUNT(*)::integer AS count
      FROM derived
      WHERE method_label IS NOT NULL AND method_label <> ''
      GROUP BY method_label
    ) s
  ),
  time_of_day_counts AS (
    SELECT jsonb_agg(jsonb_build_object('name', time_of_day_label, 'count', count) ORDER BY count DESC) AS value
    FROM (
      SELECT time_of_day_label, COUNT(*)::integer AS count
      FROM derived
      WHERE time_of_day_label IS NOT NULL
      GROUP BY time_of_day_label
    ) s
  ),
  species_counts AS (
    SELECT jsonb_agg(jsonb_build_object('name', species_label, 'count', count) ORDER BY count DESC) AS value
    FROM (
      SELECT species_label, COUNT(*)::integer AS count
      FROM derived
      WHERE species_label IS NOT NULL AND species_label <> ''
      GROUP BY species_label
    ) s
  ),
  venue_counts AS (
    SELECT jsonb_agg(jsonb_build_object('name', location, 'count', count) ORDER BY count DESC) AS value
    FROM (
      SELECT location, COUNT(*)::integer AS count
      FROM derived
      WHERE location IS NOT NULL AND location <> ''
      GROUP BY location
    ) s
  ),
  weather_counts AS (
    SELECT jsonb_agg(jsonb_build_object('name', weather_label, 'count', count) ORDER BY count DESC) AS value
    FROM (
      SELECT weather_label, COUNT(*)::integer AS count
      FROM derived
      WHERE weather_label IS NOT NULL AND weather_label <> ''
      GROUP BY weather_label
    ) s
  ),
  clarity_counts AS (
    SELECT jsonb_agg(jsonb_build_object('name', clarity_label, 'count', count) ORDER BY count DESC) AS value
    FROM (
      SELECT clarity_label, COUNT(*)::integer AS count
      FROM derived
      WHERE clarity_label IS NOT NULL AND clarity_label <> ''
      GROUP BY clarity_label
    ) s
  ),
  wind_counts AS (
    SELECT jsonb_agg(jsonb_build_object('name', wind_label, 'count', count) ORDER BY count DESC) AS value
    FROM (
      SELECT wind_label, COUNT(*)::integer AS count
      FROM derived
      WHERE wind_label IS NOT NULL AND wind_label <> ''
      GROUP BY wind_label
    ) s
  ),
  monthly_counts AS (
    SELECT jsonb_agg(jsonb_build_object('label', label, 'count', count) ORDER BY month) AS value
    FROM (
      SELECT month, to_char(month, 'Mon YYYY') AS label, count
      FROM (
        SELECT date_trunc('month', catch_time) AS month, COUNT(*)::integer AS count
        FROM derived
        GROUP BY date_trunc('month', catch_time)
        ORDER BY month DESC
        LIMIT 12
      ) s
      ORDER BY month
    ) t
  ),
  session_counts AS (
    SELECT jsonb_agg(jsonb_build_object('session_id', session_id, 'count', count) ORDER BY count DESC) AS value
    FROM (
      SELECT session_id, COUNT(*)::integer AS count
      FROM derived
      WHERE session_id IS NOT NULL
      GROUP BY session_id
    ) s
  ),
  sessions_count AS (
    SELECT COUNT(DISTINCT session_id)::integer AS value
    FROM derived
    WHERE session_id IS NOT NULL
  ),
  venue_options AS (
    SELECT jsonb_agg(location ORDER BY location) AS value
    FROM (
      SELECT DISTINCT location
      FROM all_catches
      WHERE location IS NOT NULL AND location <> ''
    ) s
  )
  SELECT
    aggregates.total_catches,
    aggregates.total_catches_all,
    aggregates.pb_weight,
    aggregates.pb_weight_unit,
    aggregates.average_weight_kg,
    aggregates.weighted_catch_count,
    aggregates.average_air_temp,
    COALESCE(bait_counts.value, '[]'::jsonb),
    COALESCE(method_counts.value, '[]'::jsonb),
    COALESCE(time_of_day_counts.value, '[]'::jsonb),
    COALESCE(species_counts.value, '[]'::jsonb),
    COALESCE(venue_counts.value, '[]'::jsonb),
    COALESCE(weather_counts.value, '[]'::jsonb),
    COALESCE(clarity_counts.value, '[]'::jsonb),
    COALESCE(wind_counts.value, '[]'::jsonb),
    COALESCE(monthly_counts.value, '[]'::jsonb),
    COALESCE(session_counts.value, '[]'::jsonb),
    COALESCE(sessions_count.value, 0),
    COALESCE(venue_options.value, '[]'::jsonb),
    (SELECT session_id FROM latest_session)
  FROM aggregates
  LEFT JOIN bait_counts ON true
  LEFT JOIN method_counts ON true
  LEFT JOIN time_of_day_counts ON true
  LEFT JOIN species_counts ON true
  LEFT JOIN venue_counts ON true
  LEFT JOIN weather_counts ON true
  LEFT JOIN clarity_counts ON true
  LEFT JOIN wind_counts ON true
  LEFT JOIN monthly_counts ON true
  LEFT JOIN session_counts ON true
  LEFT JOIN sessions_count ON true
  LEFT JOIN venue_options ON true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_insights_aggregates(text, timestamptz, timestamptz, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_insights_aggregates(text, timestamptz, timestamptz, uuid, text) TO authenticated;
