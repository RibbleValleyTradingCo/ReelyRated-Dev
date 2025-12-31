SET search_path = public, extensions;

-- Retire the MV + cron refresh if they exist.
DROP FUNCTION IF EXISTS public.get_community_stats();
DROP MATERIALIZED VIEW IF EXISTS public.community_stats;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh_community_stats') THEN
        PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'refresh_community_stats';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'pg_cron present but unable to unschedule refresh_community_stats: %', SQLERRM;
    END;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.community_stats_live (
  id int PRIMARY KEY CHECK (id = 1),
  total_catches bigint NOT NULL DEFAULT 0,
  active_anglers bigint NOT NULL DEFAULT 0,
  waterways bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_stats_users (
  user_id uuid PRIMARY KEY,
  public_catch_count int NOT NULL DEFAULT 0 CHECK (public_catch_count >= 0)
);

CREATE TABLE IF NOT EXISTS public.community_stats_waterways (
  waterway_key text PRIMARY KEY,
  public_catch_count int NOT NULL DEFAULT 0 CHECK (public_catch_count >= 0)
);

REVOKE ALL ON TABLE public.community_stats_live FROM PUBLIC;
REVOKE ALL ON TABLE public.community_stats_users FROM PUBLIC;
REVOKE ALL ON TABLE public.community_stats_waterways FROM PUBLIC;

INSERT INTO public.community_stats_live (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

TRUNCATE public.community_stats_users;
TRUNCATE public.community_stats_waterways;

INSERT INTO public.community_stats_users (user_id, public_catch_count)
SELECT user_id, count(*)::int
FROM public.catches
WHERE deleted_at IS NULL AND visibility = 'public'
GROUP BY user_id;

INSERT INTO public.community_stats_waterways (waterway_key, public_catch_count)
SELECT waterway_key, count(*)::int
FROM (
  SELECT
    NULLIF(
      trim(COALESCE(location_label, CASE WHEN hide_exact_spot THEN NULL ELSE location END)),
      ''
    ) AS waterway_key
  FROM public.catches
  WHERE deleted_at IS NULL AND visibility = 'public'
) AS derived
WHERE waterway_key IS NOT NULL
GROUP BY waterway_key;

INSERT INTO public.community_stats_live (
  id,
  total_catches,
  active_anglers,
  waterways,
  updated_at
)
VALUES (
  1,
  (SELECT count(*) FROM public.catches WHERE deleted_at IS NULL AND visibility = 'public'),
  (SELECT count(*) FROM public.community_stats_users WHERE public_catch_count > 0),
  (SELECT count(*) FROM public.community_stats_waterways WHERE public_catch_count > 0),
  now()
)
ON CONFLICT (id) DO UPDATE
SET
  total_catches = EXCLUDED.total_catches,
  active_anglers = EXCLUDED.active_anglers,
  waterways = EXCLUDED.waterways,
  updated_at = EXCLUDED.updated_at;

CREATE OR REPLACE FUNCTION public.community_stats_handle_catches_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  old_counted boolean;
  new_counted boolean;
  old_user uuid;
  new_user uuid;
  old_waterway text;
  new_waterway text;
  user_count int;
  waterway_count int;
  total_delta int := 0;
  active_delta int := 0;
  waterway_delta int := 0;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.visibility IS NOT DISTINCT FROM NEW.visibility
      AND OLD.deleted_at IS NOT DISTINCT FROM NEW.deleted_at
      AND OLD.user_id IS NOT DISTINCT FROM NEW.user_id
      AND OLD.location_label IS NOT DISTINCT FROM NEW.location_label
      AND OLD.location IS NOT DISTINCT FROM NEW.location
      AND OLD.hide_exact_spot IS NOT DISTINCT FROM NEW.hide_exact_spot THEN
      RETURN NEW;
    END IF;
  END IF;

  old_counted := CASE
    WHEN TG_OP = 'INSERT' THEN false
    ELSE (OLD.deleted_at IS NULL AND OLD.visibility = 'public')
  END;
  new_counted := CASE
    WHEN TG_OP = 'DELETE' THEN false
    ELSE (NEW.deleted_at IS NULL AND NEW.visibility = 'public')
  END;

  old_user := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.user_id END;
  new_user := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW.user_id END;

  old_waterway := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE
    NULLIF(trim(COALESCE(OLD.location_label, CASE WHEN OLD.hide_exact_spot THEN NULL ELSE OLD.location END)), '')
  END;
  new_waterway := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE
    NULLIF(trim(COALESCE(NEW.location_label, CASE WHEN NEW.hide_exact_spot THEN NULL ELSE NEW.location END)), '')
  END;

  IF new_counted AND NOT old_counted THEN
    total_delta := total_delta + 1;

    IF new_user IS NOT NULL THEN
      INSERT INTO public.community_stats_users (user_id, public_catch_count)
      VALUES (new_user, 1)
      ON CONFLICT (user_id)
      DO UPDATE SET public_catch_count = public.community_stats_users.public_catch_count + 1
      RETURNING public_catch_count INTO user_count;
      IF user_count = 1 THEN
        active_delta := active_delta + 1;
      END IF;
    END IF;

    IF new_waterway IS NOT NULL THEN
      INSERT INTO public.community_stats_waterways (waterway_key, public_catch_count)
      VALUES (new_waterway, 1)
      ON CONFLICT (waterway_key)
      DO UPDATE SET public_catch_count = public.community_stats_waterways.public_catch_count + 1
      RETURNING public_catch_count INTO waterway_count;
      IF waterway_count = 1 THEN
        waterway_delta := waterway_delta + 1;
      END IF;
    END IF;
  ELSIF old_counted AND NOT new_counted THEN
    total_delta := total_delta - 1;

    IF old_user IS NOT NULL THEN
      UPDATE public.community_stats_users
      SET public_catch_count = public_catch_count - 1
      WHERE user_id = old_user
      RETURNING public_catch_count INTO user_count;
      IF FOUND AND user_count <= 0 THEN
        DELETE FROM public.community_stats_users WHERE user_id = old_user;
        active_delta := active_delta - 1;
      END IF;
    END IF;

    IF old_waterway IS NOT NULL THEN
      UPDATE public.community_stats_waterways
      SET public_catch_count = public_catch_count - 1
      WHERE waterway_key = old_waterway
      RETURNING public_catch_count INTO waterway_count;
      IF FOUND AND waterway_count <= 0 THEN
        DELETE FROM public.community_stats_waterways WHERE waterway_key = old_waterway;
        waterway_delta := waterway_delta - 1;
      END IF;
    END IF;
  ELSIF old_counted AND new_counted THEN
    IF old_user IS DISTINCT FROM new_user THEN
      IF old_user IS NOT NULL THEN
        UPDATE public.community_stats_users
        SET public_catch_count = public_catch_count - 1
        WHERE user_id = old_user
        RETURNING public_catch_count INTO user_count;
        IF FOUND AND user_count <= 0 THEN
          DELETE FROM public.community_stats_users WHERE user_id = old_user;
          active_delta := active_delta - 1;
        END IF;
      END IF;

      IF new_user IS NOT NULL THEN
        INSERT INTO public.community_stats_users (user_id, public_catch_count)
        VALUES (new_user, 1)
        ON CONFLICT (user_id)
        DO UPDATE SET public_catch_count = public.community_stats_users.public_catch_count + 1
        RETURNING public_catch_count INTO user_count;
        IF user_count = 1 THEN
          active_delta := active_delta + 1;
        END IF;
      END IF;
    END IF;

    IF old_waterway IS DISTINCT FROM new_waterway THEN
      IF old_waterway IS NOT NULL THEN
        UPDATE public.community_stats_waterways
        SET public_catch_count = public_catch_count - 1
        WHERE waterway_key = old_waterway
        RETURNING public_catch_count INTO waterway_count;
        IF FOUND AND waterway_count <= 0 THEN
          DELETE FROM public.community_stats_waterways WHERE waterway_key = old_waterway;
          waterway_delta := waterway_delta - 1;
        END IF;
      END IF;

      IF new_waterway IS NOT NULL THEN
        INSERT INTO public.community_stats_waterways (waterway_key, public_catch_count)
        VALUES (new_waterway, 1)
        ON CONFLICT (waterway_key)
        DO UPDATE SET public_catch_count = public.community_stats_waterways.public_catch_count + 1
        RETURNING public_catch_count INTO waterway_count;
        IF waterway_count = 1 THEN
          waterway_delta := waterway_delta + 1;
        END IF;
      END IF;
    END IF;
  END IF;

  IF total_delta <> 0 OR active_delta <> 0 OR waterway_delta <> 0 THEN
    UPDATE public.community_stats_live
    SET
      total_catches = GREATEST(total_catches + total_delta, 0),
      active_anglers = GREATEST(active_anglers + active_delta, 0),
      waterways = GREATEST(waterways + waterway_delta, 0),
      updated_at = now()
    WHERE id = 1;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_community_stats_catches ON public.catches;
CREATE TRIGGER trg_community_stats_catches
AFTER INSERT OR UPDATE OR DELETE ON public.catches
FOR EACH ROW
EXECUTE FUNCTION public.community_stats_handle_catches_change();

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
  FROM public.community_stats_live
  WHERE id = 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_community_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_community_stats() TO anon, authenticated;
