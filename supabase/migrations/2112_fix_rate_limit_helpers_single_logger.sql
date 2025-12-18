-- 2112: make check_rate_limit pure (no logging) and ensure each action logs once via its trigger.
-- Targets: catches (10/h), comments (20/h), reports (5/h).

SET search_path = public, extensions;

-- A) Make check_rate_limit check-only (no insert side effects)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_action text,
  p_max_attempts integer,
  p_window_minutes integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  cutoff timestamptz := now() - make_interval(mins => p_window_minutes);
  attempts integer;
BEGIN
  SELECT count(*) INTO attempts
  FROM public.rate_limits
  WHERE user_id = p_user_id
    AND action = p_action
    AND created_at >= cutoff;

  RETURN attempts < p_max_attempts;
END;
$$;

-- B) Enforce functions: check, then log exactly once
CREATE OR REPLACE FUNCTION public.enforce_catch_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT check_rate_limit(auth.uid(), 'catches', 10, 60) THEN
    RAISE EXCEPTION 'RATE_LIMITED: catches – max 10 per hour';
  END IF;
  INSERT INTO public.rate_limits (user_id, action, created_at)
  VALUES (auth.uid(), 'catches', now());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_comment_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT check_rate_limit(auth.uid(), 'comments', 20, 60) THEN
    RAISE EXCEPTION 'RATE_LIMITED: comments – max 20 per hour';
  END IF;
  INSERT INTO public.rate_limits (user_id, action, created_at)
  VALUES (auth.uid(), 'comments', now());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_report_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT check_rate_limit(auth.uid(), 'reports', 5, 60) THEN
    RAISE EXCEPTION 'RATE_LIMITED: reports – max 5 per hour';
  END IF;
  INSERT INTO public.rate_limits (user_id, action, created_at)
  VALUES (auth.uid(), 'reports', now());
  RETURN NEW;
END;
$$;

-- C) Comment RPC: rely on trigger for logging (keep early check only)
CREATE OR REPLACE FUNCTION public.create_comment_with_rate_limit(
  p_catch_id uuid,
  p_body text,
  p_parent_comment_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_id uuid;
  v_body text := trim(both FROM coalesce(p_body, ''));
  v_catch RECORD;
  v_is_admin boolean := public.is_admin(v_user_id);
  v_is_follower boolean := false;
  v_parent RECORD;
  v_mention RECORD;
  v_actor_username text;
  v_mentioned_ids uuid[] := ARRAY[]::uuid[];
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, user_id, visibility, deleted_at, title
  INTO v_catch
  FROM public.catches
  WHERE id = p_catch_id;

  IF NOT FOUND OR v_catch.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Catch is not accessible';
  END IF;

  SELECT username INTO v_actor_username FROM public.profiles WHERE id = v_user_id;

  IF NOT v_is_admin THEN
    IF v_catch.user_id = v_user_id THEN
      NULL;
    ELSIF v_catch.visibility = 'public' THEN
      NULL;
    ELSIF v_catch.visibility = 'followers' THEN
      v_is_follower := public.is_following(v_user_id, v_catch.user_id);
      IF NOT v_is_follower THEN
        RAISE EXCEPTION 'Catch is not accessible';
      END IF;
    ELSE
      RAISE EXCEPTION 'Catch is not accessible';
    END IF;
  END IF;

  IF p_parent_comment_id IS NOT NULL THEN
    SELECT id, catch_id, deleted_at
    INTO v_parent
    FROM public.catch_comments
    WHERE id = p_parent_comment_id;

    IF NOT FOUND OR v_parent.deleted_at IS NOT NULL THEN
      RAISE EXCEPTION 'Parent comment not found';
    END IF;

    IF v_parent.catch_id <> p_catch_id THEN
      RAISE EXCEPTION 'Parent comment belongs to a different catch';
    END IF;
  END IF;

  IF v_body = '' THEN
    RAISE EXCEPTION 'Comment body is required';
  END IF;

  -- Block check (admins bypass)
  IF NOT v_is_admin THEN
    IF public.is_blocked_either_way(v_user_id, v_catch.user_id) THEN
      RAISE EXCEPTION 'You cannot comment on this angler right now.';
    END IF;
  END IF;

  IF NOT v_is_admin THEN
    IF NOT public.check_rate_limit(v_user_id, 'comments', 20, 60) THEN
      RAISE EXCEPTION 'RATE_LIMITED: comments – max 20 per hour';
    END IF;
  END IF;

  INSERT INTO public.catch_comments (catch_id, user_id, body, parent_comment_id, created_at)
  VALUES (p_catch_id, v_user_id, v_body, p_parent_comment_id, now())
  RETURNING id INTO v_id;

  -- Logging is handled by enforce_comment_rate_limit trigger on catch_comments

  -- Mention notifications (non-blocking)
  BEGIN
    FOR v_mention IN
      SELECT DISTINCT p.id AS mentioned_id, p.username
      FROM regexp_matches(v_body, '@([A-Za-z0-9_.]+)', 'g') m(match)
      JOIN public.profiles p ON lower(p.username) = lower(m.match[1])
    LOOP
      -- Skip self
      IF v_mention.mentioned_id = v_user_id THEN
        CONTINUE;
      END IF;
      -- Visibility checks for mentioned user
      IF v_catch.visibility = 'followers' THEN
        IF NOT (v_catch.user_id = v_mention.mentioned_id OR public.is_admin(v_mention.mentioned_id) OR public.is_following(v_mention.mentioned_id, v_catch.user_id)) THEN
          CONTINUE;
        END IF;
      ELSIF v_catch.visibility = 'private' THEN
        IF NOT (v_catch.user_id = v_mention.mentioned_id OR public.is_admin(v_mention.mentioned_id)) THEN
          CONTINUE;
        END IF;
      END IF;

      v_mentioned_ids := array_append(v_mentioned_ids, v_mention.mentioned_id);

      BEGIN
        PERFORM public.create_notification(
          p_user_id := v_mention.mentioned_id,
          p_message := 'Someone mentioned you in a comment',
          p_type := 'mention'::public.notification_type,
          p_actor_id := v_user_id,
          p_catch_id := p_catch_id,
          p_comment_id := v_id,
          p_extra_data := jsonb_build_object(
            'catch_id', p_catch_id,
            'comment_id', v_id,
            'mentioned_username', v_mention.username,
            'actor_username', v_actor_username,
            'catch_title', v_catch.title
          )
        );
      EXCEPTION
        WHEN OTHERS THEN
          NULL;
      END;
    END LOOP;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  -- Notify catch owner for new comments (skip self, skip soft-deleted catches)
  IF v_catch.user_id IS NOT NULL
     AND v_catch.user_id <> v_user_id
     AND v_catch.deleted_at IS NULL
     AND NOT (v_catch.user_id = ANY (v_mentioned_ids)) THEN
    BEGIN
      PERFORM public.create_notification(
        p_user_id := v_catch.user_id,
        p_message := 'Someone commented on your catch',
        p_type := 'new_comment'::public.notification_type,
        p_actor_id := v_user_id,
        p_catch_id := p_catch_id,
        p_comment_id := v_id,
        p_extra_data := jsonb_build_object('catch_id', p_catch_id, 'comment_id', v_id, 'actor_username', v_actor_username, 'catch_title', v_catch.title)
      );
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
  END IF;

  RETURN v_id;
END;
$$;

-- D) Reports RPC: keep guard, logging handled by trigger (ensure stays clean)
CREATE OR REPLACE FUNCTION public.create_report_with_rate_limit(
  p_target_type public.report_target_type,
  p_target_id uuid,
  p_reason text,
  p_details text DEFAULT NULL
)
RETURNS public.reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_report public.reports;
  v_reason text := trim(both FROM coalesce(p_reason, ''));
  v_details text := NULLIF(trim(both FROM p_details), '');
  v_can_view boolean := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Early rate-limit check (logging is handled by trigger/enforce_report_rate_limit)
  IF NOT public.check_rate_limit(v_user_id, 'reports', 5, 60) THEN
    RAISE EXCEPTION 'RATE_LIMITED: reports – max 5 per hour';
  END IF;

  IF v_reason = '' THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  -- Validate target exists and is viewable by reporter
  IF p_target_type = 'catch' THEN
    v_can_view := EXISTS (
      SELECT 1
      FROM public.catches c
      WHERE c.id = p_target_id
        AND c.deleted_at IS NULL
        AND (
          public.is_admin(v_user_id)
          OR c.user_id = v_user_id
          OR (
            c.visibility = 'public'
            AND NOT public.is_blocked_either_way(v_user_id, c.user_id)
          )
          OR (
            c.visibility = 'followers'
            AND public.is_following(v_user_id, c.user_id)
            AND NOT public.is_blocked_either_way(v_user_id, c.user_id)
          )
        )
    );
  ELSIF p_target_type = 'comment' THEN
    v_can_view := EXISTS (
      SELECT 1
      FROM public.catch_comments cc
      JOIN public.catches c ON c.id = cc.catch_id
      WHERE cc.id = p_target_id
        AND cc.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND (
          public.is_admin(v_user_id)
          OR c.user_id = v_user_id
          OR (
            c.visibility = 'public'
            AND NOT public.is_blocked_either_way(v_user_id, c.user_id)
            AND NOT public.is_blocked_either_way(v_user_id, cc.user_id)
          )
          OR (
            c.visibility = 'followers'
            AND public.is_following(v_user_id, c.user_id)
            AND NOT public.is_blocked_either_way(v_user_id, c.user_id)
            AND NOT public.is_blocked_either_way(v_user_id, cc.user_id)
          )
        )
    );
  ELSIF p_target_type = 'profile' THEN
    v_can_view := EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = p_target_id
        AND NOT public.is_blocked_either_way(v_user_id, p.id)
    );
  ELSE
    RAISE EXCEPTION 'Unsupported target type';
  END IF;

  IF NOT v_can_view THEN
    RAISE EXCEPTION 'Target not accessible';
  END IF;

  INSERT INTO public.reports (
    reporter_id,
    target_type,
    target_id,
    reason,
    details
  )
  VALUES (
    v_user_id,
    p_target_type::text,
    p_target_id,
    v_reason,
    v_details
  )
  RETURNING * INTO v_report;

  -- Logging is handled by enforce_report_rate_limit trigger on reports
  RETURN v_report;
END;
$$;

-- E) (Optional) note: catch RPCs do not insert into rate_limits in this schema;
-- logging for catches is via enforce_catch_rate_limit_trigger on public.catches.

-- Manual verification (run in SQL editor as a test user):
-- 1) Clear rate limits for a test user:
--    delete from public.rate_limits
--    where user_id = '<user_id>' and action in ('catches','comments','reports');
--
-- 2) Perform a single report via the app, then:
--    select user_id, action, count(*) as events
--    from public.rate_limits
--    where user_id = '<user_id>' and action = 'reports'
--      and created_at > now() - interval '1 hour'
--    group by user_id, action;
--    -- expect 1 row/event per successful report
--
-- 3) Repeat for comments/catches; each successful insert should add exactly one row
--    for the corresponding action, and the N+1 attempt beyond the limit should raise RATE_LIMITED.
