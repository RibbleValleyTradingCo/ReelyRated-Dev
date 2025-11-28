-- 2045_moderation_enforcement.sql
-- Purpose: enforce moderation_status/suspension_until for comment and catch creation (admin bypass).

SET search_path = public, extensions;

-- Helper to raise moderation errors (admin bypass)
CREATE OR REPLACE FUNCTION public.assert_moderation_allowed(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_is_admin boolean;
  v_profile RECORD;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = p_user_id) INTO v_is_admin;
  IF v_is_admin THEN
    RETURN;
  END IF;

  SELECT moderation_status, suspension_until
  INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_profile.moderation_status = 'banned' THEN
    RAISE EXCEPTION 'MODERATION_BANNED';
  ELSIF v_profile.moderation_status = 'suspended' AND v_profile.suspension_until IS NOT NULL AND v_profile.suspension_until > now() THEN
    RAISE EXCEPTION 'MODERATION_SUSPENDED until %', v_profile.suspension_until;
  END IF;
END;
$$;

-- Update create_comment_with_rate_limit to call moderation check
DROP FUNCTION IF EXISTS public.create_comment_with_rate_limit(uuid, text);

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
  v_notify_owner boolean := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  PERFORM public.assert_moderation_allowed(v_user_id);

  SELECT id, user_id, visibility, deleted_at
  INTO v_catch
  FROM public.catches
  WHERE id = p_catch_id;

  IF NOT FOUND OR v_catch.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Catch is not accessible';
  END IF;

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
    SELECT id, catch_id, deleted_at, user_id
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

  IF NOT v_is_admin THEN
    IF NOT public.check_rate_limit(v_user_id, 'comments', 20, 60) THEN
      RAISE EXCEPTION 'RATE_LIMITED: comments – max 20 per hour';
    END IF;
  END IF;

  INSERT INTO public.catch_comments (catch_id, user_id, body, parent_comment_id, created_at)
  VALUES (p_catch_id, v_user_id, v_body, p_parent_comment_id, now())
  RETURNING id INTO v_id;

  IF NOT v_is_admin THEN
    INSERT INTO public.rate_limits (user_id, action, created_at)
    VALUES (v_user_id, 'comments', now());
  END IF;

  v_notify_owner := v_catch.user_id IS NOT NULL
    AND v_catch.user_id <> v_user_id
    AND (p_parent_comment_id IS NULL OR v_parent.user_id IS NULL OR v_parent.user_id <> v_catch.user_id)
    AND v_catch.deleted_at IS NULL;

  IF v_notify_owner THEN
    BEGIN
      PERFORM public.create_notification(
        p_user_id := v_catch.user_id,
        p_message := 'Someone commented on your catch',
        p_type := 'new_comment'::public.notification_type,
        p_actor_id := v_user_id,
        p_catch_id := p_catch_id,
        p_comment_id := v_id,
        p_extra_data := jsonb_build_object('catch_id', p_catch_id, 'comment_id', v_id)
      );
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
  END IF;

  -- Reply notifications to parent author (skip self-replies; send even if parent equals catch owner)
  IF p_parent_comment_id IS NOT NULL AND v_parent.user_id IS NOT NULL AND v_parent.user_id <> v_user_id THEN
    BEGIN
      PERFORM public.create_notification(
        p_user_id := v_parent.user_id,
        p_message := 'Someone replied to your comment',
        p_type := 'comment_reply'::public.notification_type,
        p_actor_id := v_user_id,
        p_catch_id := p_catch_id,
        p_comment_id := v_id,
        p_extra_data := jsonb_build_object(
          'catch_id', p_catch_id,
          'comment_id', v_id,
          'parent_comment_id', p_parent_comment_id
        )
      );
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
  END IF;

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
      -- Skip owner (already notified via new_comment)
      IF v_catch.user_id = v_mention.mentioned_id THEN
        CONTINUE;
      END IF;
      -- Skip parent author (already notified via comment_reply)
      IF p_parent_comment_id IS NOT NULL AND v_parent.user_id IS NOT NULL AND v_mention.mentioned_id = v_parent.user_id THEN
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
            'mentioned_username', v_mention.username
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

  RETURN v_id;
END;
$$;

-- Trigger to enforce moderation on catch inserts
CREATE OR REPLACE FUNCTION public.enforce_catch_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := coalesce(auth.uid(), NEW.user_id);
BEGIN
  PERFORM public.assert_moderation_allowed(v_user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_catch_moderation ON public.catches;
CREATE TRIGGER trg_enforce_catch_moderation
BEFORE INSERT ON public.catches
FOR EACH ROW
EXECUTE FUNCTION public.enforce_catch_moderation();
