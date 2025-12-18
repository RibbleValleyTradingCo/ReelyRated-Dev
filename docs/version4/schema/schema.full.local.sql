


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "auth";


ALTER SCHEMA "auth" OWNER TO "supabase_admin";


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "storage";


ALTER SCHEMA "storage" OWNER TO "supabase_admin";


CREATE TYPE "auth"."aal_level" AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE "auth"."aal_level" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."code_challenge_method" AS ENUM (
    's256',
    'plain'
);


ALTER TYPE "auth"."code_challenge_method" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."factor_status" AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE "auth"."factor_status" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."factor_type" AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE "auth"."factor_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."oauth_authorization_status" AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE "auth"."oauth_authorization_status" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."oauth_client_type" AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE "auth"."oauth_client_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."oauth_registration_type" AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE "auth"."oauth_registration_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."oauth_response_type" AS ENUM (
    'code'
);


ALTER TYPE "auth"."oauth_response_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."one_time_token_type" AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE "auth"."one_time_token_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "public"."length_unit" AS ENUM (
    'cm',
    'in'
);


ALTER TYPE "public"."length_unit" OWNER TO "postgres";


CREATE TYPE "public"."mod_action" AS ENUM (
    'delete_catch',
    'delete_comment',
    'restore_catch',
    'restore_comment',
    'warn_user',
    'suspend_user'
);


ALTER TYPE "public"."mod_action" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'new_follower',
    'new_comment',
    'new_rating',
    'new_reaction',
    'mention',
    'admin_report',
    'admin_warning',
    'admin_moderation',
    'comment_reply'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."reaction_type" AS ENUM (
    'like',
    'love',
    'fire'
);


ALTER TYPE "public"."reaction_type" OWNER TO "postgres";


CREATE TYPE "public"."report_status" AS ENUM (
    'open',
    'resolved',
    'dismissed'
);


ALTER TYPE "public"."report_status" OWNER TO "postgres";


CREATE TYPE "public"."report_target_type" AS ENUM (
    'catch',
    'comment',
    'profile'
);


ALTER TYPE "public"."report_target_type" OWNER TO "postgres";


CREATE TYPE "public"."time_of_day" AS ENUM (
    'morning',
    'afternoon',
    'evening',
    'night'
);


ALTER TYPE "public"."time_of_day" OWNER TO "postgres";


CREATE TYPE "public"."visibility_type" AS ENUM (
    'public',
    'followers',
    'private'
);


ALTER TYPE "public"."visibility_type" OWNER TO "postgres";


CREATE TYPE "public"."warning_severity" AS ENUM (
    'warning',
    'temporary_suspension',
    'permanent_ban'
);


ALTER TYPE "public"."warning_severity" OWNER TO "postgres";


CREATE TYPE "public"."weight_unit" AS ENUM (
    'lb_oz',
    'kg',
    'g'
);


ALTER TYPE "public"."weight_unit" OWNER TO "postgres";


CREATE TYPE "storage"."buckettype" AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE "storage"."buckettype" OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "auth"."email"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION "auth"."email"() OWNER TO "supabase_auth_admin";


COMMENT ON FUNCTION "auth"."email"() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';



CREATE OR REPLACE FUNCTION "auth"."jwt"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION "auth"."jwt"() OWNER TO "supabase_auth_admin";


CREATE OR REPLACE FUNCTION "auth"."role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION "auth"."role"() OWNER TO "supabase_auth_admin";


COMMENT ON FUNCTION "auth"."role"() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';



CREATE OR REPLACE FUNCTION "auth"."uid"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION "auth"."uid"() OWNER TO "supabase_auth_admin";


COMMENT ON FUNCTION "auth"."uid"() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';



CREATE OR REPLACE FUNCTION "public"."admin_add_venue_owner"("p_venue_id" "uuid", "p_user_id" "uuid", "p_role" "text" DEFAULT 'owner'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  v_admin uuid := auth.uid();
  v_is_admin boolean;
begin
  if v_admin is null then
    raise exception 'Not authenticated';
  end if;

  select exists (select 1 from public.admin_users au where au.user_id = v_admin) into v_is_admin;
  if not v_is_admin then
    raise exception 'Admin privileges required';
  end if;

  insert into public.venue_owners (venue_id, user_id, role)
  values (p_venue_id, p_user_id, coalesce(p_role, 'owner'))
  on conflict (venue_id, user_id) do nothing;
end;
$$;


ALTER FUNCTION "public"."admin_add_venue_owner"("p_venue_id" "uuid", "p_user_id" "uuid", "p_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_clear_moderation_status"("p_user_id" "uuid", "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_is_admin boolean;
  v_previous_status text;
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = v_admin) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  SELECT moderation_status INTO v_previous_status
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  UPDATE public.profiles
  SET moderation_status = 'active',
      suspension_until = NULL,
      updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO public.moderation_log (
    action,
    target_type,
    target_id,
    user_id,
    catch_id,
    comment_id,
    metadata,
    created_at,
    admin_id
  )
  VALUES (
    'clear_moderation',
    'profile',
    p_user_id,
    p_user_id,
    NULL,
    NULL,
    jsonb_build_object(
      'reason', coalesce(nullif(p_reason, ''), 'Cleared by admin'),
      'previous_status', v_previous_status
    ),
    now(),
    v_admin
  );

  PERFORM public.create_notification(
    p_user_id    => p_user_id,
    p_message    => 'Your account restrictions have been lifted',
    p_type       => 'admin_moderation',
    p_actor_id   => v_admin,
    p_catch_id   => NULL,
    p_comment_id => NULL,
    p_extra_data => jsonb_build_object(
      'action', 'clear_moderation',
      'reason', coalesce(nullif(p_reason, ''), 'Cleared by admin'),
      'previous_status', v_previous_status
    )
  );
END;
$$;


ALTER FUNCTION "public"."admin_clear_moderation_status"("p_user_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_create_venue_event"("p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_is_published" boolean) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
  v_new_id uuid;
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.venue_events (
    venue_id, title, event_type, starts_at, ends_at, description, ticket_info, website_url, booking_url, is_published
  )
  VALUES (
    p_venue_id, p_title, p_event_type, p_starts_at, p_ends_at, p_description, p_ticket_info, p_website_url, p_booking_url, COALESCE(p_is_published, false)
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;


ALTER FUNCTION "public"."admin_create_venue_event"("p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_is_published" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_create_venue_event"("p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_is_published" boolean) IS 'Admin-only create for venue events; checks admin_users internally.';



CREATE OR REPLACE FUNCTION "public"."admin_delete_account"("p_target" "uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_is_admin boolean;
  v_profile RECORD;
  v_now timestamptz := now();
  v_username text;
  v_profile_deleted boolean := false;
  v_catches_updated integer := 0;
  v_comments_tombstoned integer := 0;
  v_reactions_deleted integer := 0;
  v_ratings_deleted integer := 0;
  v_follows_deleted integer := 0;
  v_notifications_deleted integer := 0;
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = v_admin) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  SELECT *
  INTO v_profile
  FROM public.profiles
  WHERE id = p_target
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_target;
  END IF;

  IF v_profile.is_deleted THEN
    v_profile_deleted := true;
  ELSE
    v_username := 'deleted-user-' || substring(p_target::text, 1, 8);
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username AND id <> p_target) LOOP
      v_username := 'deleted-user-' || substring(gen_random_uuid()::text, 1, 8);
    END LOOP;

    UPDATE public.profiles
    SET is_deleted = TRUE,
        deleted_at = v_now,
        locked_for_deletion = TRUE,
        username = v_username,
        bio = NULL,
        avatar_path = NULL,
        avatar_url = NULL,
        updated_at = v_now
    WHERE id = p_target;

    v_profile_deleted := true;

    UPDATE public.catches
    SET visibility = 'private',
        deleted_at = COALESCE(deleted_at, v_now),
        updated_at = v_now
    WHERE user_id = p_target;
    GET DIAGNOSTICS v_catches_updated = ROW_COUNT;

    UPDATE public.catch_comments
    SET deleted_at = COALESCE(deleted_at, v_now),
        body = CASE WHEN deleted_at IS NULL THEN '[deleted]' ELSE body END
    WHERE user_id = p_target;
    GET DIAGNOSTICS v_comments_tombstoned = ROW_COUNT;

    DELETE FROM public.catch_reactions WHERE user_id = p_target;
    GET DIAGNOSTICS v_reactions_deleted = ROW_COUNT;

    DELETE FROM public.ratings WHERE user_id = p_target;
    GET DIAGNOSTICS v_ratings_deleted = ROW_COUNT;

    DELETE FROM public.profile_follows WHERE follower_id = p_target OR following_id = p_target;
    GET DIAGNOSTICS v_follows_deleted = ROW_COUNT;

    DELETE FROM public.notifications WHERE user_id = p_target;
    GET DIAGNOSTICS v_notifications_deleted = ROW_COUNT;
  END IF;

  INSERT INTO public.moderation_log (
    action,
    target_type,
    target_id,
    user_id,
    catch_id,
    comment_id,
    metadata,
    created_at,
    admin_id
  )
  VALUES (
    'admin_delete_account',
    'profile',
    p_target,
    p_target,
    NULL,
    NULL,
    jsonb_build_object(
      'reason', p_reason,
      'initiated_by', v_admin
    ),
    v_now,
    v_admin
  );

  RETURN jsonb_build_object(
    'profile_deleted', v_profile_deleted,
    'catches_updated', v_catches_updated,
    'comments_tombstoned', v_comments_tombstoned,
    'reactions_deleted', v_reactions_deleted,
    'ratings_deleted', v_ratings_deleted,
    'follows_deleted', v_follows_deleted,
    'notifications_deleted', v_notifications_deleted
  );
END;
$$;


ALTER FUNCTION "public"."admin_delete_account"("p_target" "uuid", "p_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_delete_account"("p_target" "uuid", "p_reason" "text") IS 'Admin-triggered soft-delete/anonymisation of an account; preserves audit tables (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';



CREATE OR REPLACE FUNCTION "public"."admin_delete_catch"("p_catch_id" "uuid", "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_is_admin boolean;
  v_catch RECORD;
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = v_admin) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  SELECT id, user_id
  INTO v_catch
  FROM public.catches
  WHERE id = p_catch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Catch % not found', p_catch_id;
  END IF;

  UPDATE public.catches
  SET deleted_at = now(),
      updated_at = now()
  WHERE id = v_catch.id
    AND deleted_at IS NULL;

  IF FOUND THEN
    INSERT INTO public.moderation_log (
      action,
      target_type,
      target_id,
      user_id,
      catch_id,
      comment_id,
      metadata,
      created_at,
      admin_id
    )
    VALUES (
      'delete_catch',
      'catch',
      v_catch.id,
      v_catch.user_id,
      v_catch.id,
      NULL,
      jsonb_build_object('reason', p_reason, 'source', 'admin_action'),
      now(),
      v_admin
    );

    PERFORM public.create_notification(
      p_user_id    => v_catch.user_id,
      p_message    => 'An admin has moderated your catch: ' || p_reason,
      p_type       => 'admin_moderation',
      p_actor_id   => v_admin,
      p_catch_id   => v_catch.id,
      p_comment_id => NULL,
      p_extra_data => jsonb_build_object(
        'action', 'delete_catch',
        'catch_id', v_catch.id,
        'reason', p_reason
      )
    );
  END IF;
END;
$$;


ALTER FUNCTION "public"."admin_delete_catch"("p_catch_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_delete_comment"("p_comment_id" "uuid", "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_is_admin boolean;
  v_comment RECORD;
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = v_admin) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  SELECT id, user_id, catch_id
  INTO v_comment
  FROM public.catch_comments
  WHERE id = p_comment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment % not found', p_comment_id;
  END IF;

  UPDATE public.catch_comments
  SET deleted_at = now()
  WHERE id = v_comment.id
    AND deleted_at IS NULL;

  IF FOUND THEN
    INSERT INTO public.moderation_log (
      action,
      target_type,
      target_id,
      user_id,
      catch_id,
      comment_id,
      metadata,
      created_at,
      admin_id
    )
    VALUES (
      'delete_comment',
      'comment',
      v_comment.id,
      v_comment.user_id,
      v_comment.catch_id,
      v_comment.id,
      jsonb_build_object('reason', p_reason, 'source', 'admin_action'),
      now(),
      v_admin
    );

    PERFORM public.create_notification(
      p_user_id    => v_comment.user_id,
      p_message    => 'An admin has moderated your comment: ' || p_reason,
      p_type       => 'admin_moderation',
      p_actor_id   => v_admin,
      p_catch_id   => v_comment.catch_id,
      p_comment_id => v_comment.id,
      p_extra_data => jsonb_build_object(
        'action', 'delete_comment',
        'comment_id', v_comment.id,
        'catch_id', v_comment.catch_id,
        'reason', p_reason
      )
    );
  END IF;
END;
$$;


ALTER FUNCTION "public"."admin_delete_comment"("p_comment_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_delete_venue_event"("p_event_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.venue_events WHERE id = p_event_id;
END;
$$;


ALTER FUNCTION "public"."admin_delete_venue_event"("p_event_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_delete_venue_event"("p_event_id" "uuid") IS 'Admin-only delete for venue events; checks admin_users internally.';



CREATE OR REPLACE FUNCTION "public"."admin_get_venue_events"("p_venue_id" "uuid") RETURNS TABLE("id" "uuid", "venue_id" "uuid", "title" "text", "event_type" "text", "starts_at" timestamp with time zone, "ends_at" timestamp with time zone, "description" "text", "ticket_info" "text", "website_url" "text", "booking_url" "text", "is_published" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
  SELECT
    e.id,
    e.venue_id,
    e.title,
    e.event_type,
    e.starts_at,
    e.ends_at,
    e.description,
    e.ticket_info,
    e.website_url,
    e.booking_url,
    e.is_published,
    e.created_at,
    e.updated_at
  FROM public.venue_events e
  WHERE e.venue_id = p_venue_id
    AND EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())
  ORDER BY e.starts_at DESC, e.created_at DESC;
$$;


ALTER FUNCTION "public"."admin_get_venue_events"("p_venue_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_get_venue_events"("p_venue_id" "uuid") IS 'Admin-only list of all events (draft/published, past/upcoming) for a venue; checks admin_users internally.';



CREATE OR REPLACE FUNCTION "public"."admin_list_moderation_log"("p_user_id" "uuid" DEFAULT NULL::"uuid", "p_action" "text" DEFAULT NULL::"text", "p_search" "text" DEFAULT NULL::"text", "p_from" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_to" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_sort_direction" "text" DEFAULT 'desc'::"text", "p_limit" integer DEFAULT 100, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "action" "text", "target_type" "text", "target_id" "uuid", "user_id" "uuid", "catch_id" "uuid", "comment_id" "uuid", "metadata" "jsonb", "created_at" timestamp with time zone, "admin_id" "uuid", "admin_username" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_is_admin boolean;
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = v_admin) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    ml.id,
    ml.action,
    ml.target_type,
    ml.target_id,
    ml.user_id,
    ml.catch_id,
    ml.comment_id,
    ml.metadata,
    ml.created_at,
    adm.id AS admin_id,
    adm.username AS admin_username
  FROM public.moderation_log ml
  LEFT JOIN public.profiles adm ON adm.id = ml.admin_id
  WHERE (p_user_id IS NULL OR ml.user_id = p_user_id OR ml.target_id = p_user_id)
    AND (p_action IS NULL OR ml.action = p_action)
    AND (p_from IS NULL OR ml.created_at >= p_from)
    AND (p_to IS NULL OR ml.created_at <= p_to)
    AND (p_search IS NULL OR ml.metadata::text ILIKE '%' || p_search || '%' OR adm.username ILIKE '%' || p_search || '%')
  ORDER BY
    CASE WHEN lower(p_sort_direction) = 'asc' THEN ml.created_at END ASC,
    CASE WHEN lower(p_sort_direction) <> 'asc' THEN ml.created_at END DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."admin_list_moderation_log"("p_user_id" "uuid", "p_action" "text", "p_search" "text", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_sort_direction" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_reports"("p_status" "text" DEFAULT NULL::"text", "p_type" "text" DEFAULT NULL::"text", "p_reported_user_id" "uuid" DEFAULT NULL::"uuid", "p_from" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_to" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_sort_direction" "text" DEFAULT 'desc'::"text", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "target_type" "text", "target_id" "uuid", "reason" "text", "status" "text", "created_at" timestamp with time zone, "details" "text", "reporter_id" "uuid", "reporter_username" "text", "reporter_avatar_path" "text", "reporter_avatar_url" "text", "reported_user_id" "uuid", "reported_username" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_is_admin boolean;
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = v_admin) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.target_type,
    r.target_id,
    r.reason,
    r.status,
    r.created_at,
    r.details,
    rep.id AS reporter_id,
    rep.username AS reporter_username,
    rep.avatar_path AS reporter_avatar_path,
    rep.avatar_url AS reporter_avatar_url,
    tgt.id AS reported_user_id,
    tgt.username AS reported_username
  FROM public.reports r
  LEFT JOIN public.profiles rep ON rep.id = r.reporter_id
  LEFT JOIN public.catches c ON r.target_type = 'catch' AND r.target_id = c.id
  LEFT JOIN public.catch_comments cc ON r.target_type = 'comment' AND r.target_id = cc.id
  LEFT JOIN public.profiles tgt ON
    (r.target_type = 'profile' AND r.target_id = tgt.id)
    OR (r.target_type = 'catch' AND c.user_id = tgt.id)
    OR (r.target_type = 'comment' AND cc.user_id = tgt.id)
  WHERE (p_status IS NULL OR r.status = p_status)
    AND (p_type IS NULL OR r.target_type = p_type)
    AND (p_reported_user_id IS NULL OR tgt.id = p_reported_user_id)
    AND (p_from IS NULL OR r.created_at >= p_from)
    AND (p_to IS NULL OR r.created_at <= p_to)
  ORDER BY
    CASE WHEN lower(p_sort_direction) = 'asc' THEN r.created_at END ASC,
    CASE WHEN lower(p_sort_direction) <> 'asc' THEN r.created_at END DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."admin_list_reports"("p_status" "text", "p_type" "text", "p_reported_user_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_sort_direction" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_remove_venue_owner"("p_venue_id" "uuid", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  v_admin uuid := auth.uid();
  v_is_admin boolean;
begin
  if v_admin is null then
    raise exception 'Not authenticated';
  end if;

  select exists (select 1 from public.admin_users au where au.user_id = v_admin) into v_is_admin;
  if not v_is_admin then
    raise exception 'Admin privileges required';
  end if;

  delete from public.venue_owners
  where venue_id = p_venue_id
    and user_id = p_user_id;
end;
$$;


ALTER FUNCTION "public"."admin_remove_venue_owner"("p_venue_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_restore_catch"("p_catch_id" "uuid", "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_is_admin boolean;
  v_catch RECORD;
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = v_admin) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  SELECT id, user_id
  INTO v_catch
  FROM public.catches
  WHERE id = p_catch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Catch % not found', p_catch_id;
  END IF;

  UPDATE public.catches
  SET deleted_at = NULL,
      updated_at = now()
  WHERE id = v_catch.id
    AND deleted_at IS NOT NULL;

  IF FOUND THEN
    INSERT INTO public.moderation_log (
      action,
      target_type,
      target_id,
      user_id,
      catch_id,
      comment_id,
      metadata,
      created_at,
      admin_id
    )
    VALUES (
      'restore_catch',
      'catch',
      v_catch.id,
      v_catch.user_id,
      v_catch.id,
      NULL,
      jsonb_build_object('reason', p_reason, 'source', 'admin_action'),
      now(),
      v_admin
    );

    PERFORM public.create_notification(
      p_user_id    => v_catch.user_id,
      p_message    => 'An admin has restored your catch: ' || p_reason,
      p_type       => 'admin_moderation',
      p_actor_id   => v_admin,
      p_catch_id   => v_catch.id,
      p_comment_id => NULL,
      p_extra_data => jsonb_build_object(
        'action', 'restore_catch',
        'catch_id', v_catch.id,
        'reason', p_reason
      )
    );
  END IF;
END;
$$;


ALTER FUNCTION "public"."admin_restore_catch"("p_catch_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_restore_comment"("p_comment_id" "uuid", "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_is_admin boolean;
  v_comment RECORD;
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = v_admin) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  SELECT id, user_id, catch_id
  INTO v_comment
  FROM public.catch_comments
  WHERE id = p_comment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment % not found', p_comment_id;
  END IF;

  UPDATE public.catch_comments
  SET deleted_at = NULL
  WHERE id = v_comment.id
    AND deleted_at IS NOT NULL;

  IF FOUND THEN
    INSERT INTO public.moderation_log (
      action,
      target_type,
      target_id,
      user_id,
      catch_id,
      comment_id,
      metadata,
      created_at,
      admin_id
    )
    VALUES (
      'restore_comment',
      'comment',
      v_comment.id,
      v_comment.user_id,
      v_comment.catch_id,
      v_comment.id,
      jsonb_build_object('reason', p_reason, 'source', 'admin_action'),
      now(),
      v_admin
    );

    PERFORM public.create_notification(
      p_user_id    => v_comment.user_id,
      p_message    => 'An admin has restored your comment: ' || p_reason,
      p_type       => 'admin_moderation',
      p_actor_id   => v_admin,
      p_catch_id   => v_comment.catch_id,
      p_comment_id => v_comment.id,
      p_extra_data => jsonb_build_object(
        'action', 'restore_comment',
        'comment_id', v_comment.id,
        'catch_id', v_comment.catch_id,
        'reason', p_reason
      )
    );
  END IF;
END;
$$;


ALTER FUNCTION "public"."admin_restore_comment"("p_comment_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_report_status"("p_report_id" "uuid", "p_status" "text", "p_resolution_notes" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_is_admin boolean;
  v_notes text := NULLIF(trim(both FROM p_resolution_notes), '');
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = v_admin) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  UPDATE public.reports
  SET status = p_status,
      reviewed_by = v_admin,
      reviewed_at = now(),
      resolution_notes = v_notes
  WHERE id = p_report_id;

  INSERT INTO public.moderation_log (
    action,
    target_type,
    target_id,
    metadata,
    created_at,
    admin_id
  )
  VALUES (
    'update_report_status',
    'report',
    p_report_id,
    jsonb_build_object(
      'new_status', p_status,
      'resolution_notes', v_notes
    ),
    now(),
    v_admin
  );
END;
$$;


ALTER FUNCTION "public"."admin_update_report_status"("p_report_id" "uuid", "p_status" "text", "p_resolution_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_venue_event"("p_event_id" "uuid", "p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_is_published" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.venue_events
  SET
    venue_id = p_venue_id,
    title = p_title,
    event_type = p_event_type,
    starts_at = p_starts_at,
    ends_at = p_ends_at,
    description = p_description,
    ticket_info = p_ticket_info,
    website_url = p_website_url,
    booking_url = p_booking_url,
    is_published = COALESCE(p_is_published, false),
    updated_at = now()
  WHERE id = p_event_id;
END;
$$;


ALTER FUNCTION "public"."admin_update_venue_event"("p_event_id" "uuid", "p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_is_published" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_update_venue_event"("p_event_id" "uuid", "p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_is_published" boolean) IS 'Admin-only update for venue events; checks admin_users internally.';



CREATE OR REPLACE FUNCTION "public"."admin_update_venue_metadata"("p_venue_id" "uuid", "p_short_tagline" "text", "p_ticket_type" "text", "p_price_from" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_notes_for_rr_team" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.venues
  SET
    short_tagline      = p_short_tagline,
    ticket_type        = p_ticket_type,
    price_from         = p_price_from,
    best_for_tags      = p_best_for_tags,
    facilities         = p_facilities,
    website_url        = p_website_url,
    booking_url        = p_booking_url,
    contact_phone      = p_contact_phone,
    notes_for_rr_team  = p_notes_for_rr_team,
    updated_at         = now()
  WHERE id = p_venue_id;
END;
$$;


ALTER FUNCTION "public"."admin_update_venue_metadata"("p_venue_id" "uuid", "p_short_tagline" "text", "p_ticket_type" "text", "p_price_from" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_notes_for_rr_team" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_update_venue_metadata"("p_venue_id" "uuid", "p_short_tagline" "text", "p_ticket_type" "text", "p_price_from" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_notes_for_rr_team" "text") IS 'Admin-only RPC to update venue metadata fields (Phase 3.2). Checks admin_users internally.';



CREATE OR REPLACE FUNCTION "public"."admin_update_venue_metadata"("p_venue_id" "uuid", "p_short_tagline" "text", "p_description" "text", "p_ticket_type" "text", "p_price_from" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_notes_for_rr_team" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.venues
  SET
    short_tagline      = p_short_tagline,
    description        = p_description,
    ticket_type        = p_ticket_type,
    price_from         = p_price_from,
    best_for_tags      = p_best_for_tags,
    facilities         = p_facilities,
    website_url        = p_website_url,
    booking_url        = p_booking_url,
    contact_phone      = p_contact_phone,
    notes_for_rr_team  = p_notes_for_rr_team,
    updated_at         = now()
  WHERE id = p_venue_id;
END;
$$;


ALTER FUNCTION "public"."admin_update_venue_metadata"("p_venue_id" "uuid", "p_short_tagline" "text", "p_description" "text", "p_ticket_type" "text", "p_price_from" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_notes_for_rr_team" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_update_venue_metadata"("p_venue_id" "uuid", "p_short_tagline" "text", "p_description" "text", "p_ticket_type" "text", "p_price_from" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_notes_for_rr_team" "text") IS 'Admin-only RPC to update venue metadata fields (short_tagline, description, ticket_type, price, tags, facilities, URLs, contact, notes). Checks admin_users internally.';



CREATE OR REPLACE FUNCTION "public"."admin_warn_user"("p_user_id" "uuid", "p_reason" "text", "p_severity" "public"."warning_severity" DEFAULT 'warning'::"public"."warning_severity", "p_duration_hours" integer DEFAULT NULL::integer) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_is_admin boolean;
  v_warning_id uuid;
  v_profile RECORD;
  v_new_status text := 'warned';
  v_new_suspension timestamptz;
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = v_admin) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  SELECT id, warn_count, moderation_status, suspension_until
  INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  INSERT INTO public.user_warnings (
    user_id,
    admin_id,
    reason,
    severity,
    duration_hours,
    created_at
  )
  VALUES (
    p_user_id,
    v_admin,
    p_reason,
    p_severity::text,
    p_duration_hours,
    now()
  )
  RETURNING id INTO v_warning_id;

  v_new_status := 'warned';
  v_new_suspension := NULL;

  IF p_severity = 'temporary_suspension' THEN
    v_new_status := 'suspended';
    IF p_duration_hours IS NOT NULL THEN
      v_new_suspension := now() + (p_duration_hours || ' hours')::interval;
    ELSE
      v_new_suspension := now() + interval '24 hours';
    END IF;
  ELSIF p_severity = 'permanent_ban' THEN
    v_new_status := 'banned';
    v_new_suspension := NULL;
  END IF;

  UPDATE public.profiles
  SET warn_count = COALESCE(warn_count, 0) + 1,
      moderation_status = v_new_status,
      suspension_until = v_new_suspension,
      updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO public.moderation_log (
    action,
    target_type,
    target_id,
    user_id,
    catch_id,
    comment_id,
    metadata,
    created_at,
    admin_id
  )
  VALUES (
    'warn_user',
    'profile',
    p_user_id,
    p_user_id,
    NULL,
    NULL,
    jsonb_build_object(
      'reason', p_reason,
      'severity', p_severity::text,
      'duration_hours', p_duration_hours,
      'source', 'admin_action'
    ),
    now(),
    v_admin
  );

  PERFORM public.create_notification(
    p_user_id    => p_user_id,
    p_message    => 'You have received an admin warning: ' || p_reason,
    p_type       => 'admin_warning',
    p_actor_id   => v_admin,
    p_catch_id   => NULL,
    p_comment_id => NULL,
    p_extra_data => jsonb_build_object(
      'severity', p_severity::text,
      'duration_hours', p_duration_hours,
      'warning_id', v_warning_id,
      'reason', p_reason,
      'suspension_until', v_new_suspension,
      'new_status', v_new_status
    )
  );

  RETURN v_warning_id;
END;
$$;


ALTER FUNCTION "public"."admin_warn_user"("p_user_id" "uuid", "p_reason" "text", "p_severity" "public"."warning_severity", "p_duration_hours" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assert_moderation_allowed"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
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


ALTER FUNCTION "public"."assert_moderation_allowed"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."block_profile"("p_blocked_id" "uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_blocker_id uuid := auth.uid();
BEGIN
  IF v_blocker_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_blocker_id = p_blocked_id THEN
    RAISE EXCEPTION 'Cannot block yourself';
  END IF;

  INSERT INTO public.profile_blocks (blocker_id, blocked_id, reason)
  VALUES (v_blocker_id, p_blocked_id, p_reason)
  ON CONFLICT (blocker_id, blocked_id) DO UPDATE
    SET reason = EXCLUDED.reason,
        created_at = now();

  -- Clean up follow relationships in either direction
  DELETE FROM public.profile_follows
  WHERE (follower_id = v_blocker_id AND following_id = p_blocked_id)
     OR (follower_id = p_blocked_id AND following_id = v_blocker_id);
END;
$$;


ALTER FUNCTION "public"."block_profile"("p_blocked_id" "uuid", "p_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."block_profile"("p_blocked_id" "uuid", "p_reason" "text") IS 'Blocks another profile (and cleans follow links). See docs/BLOCK-MUTE-DESIGN.md.';



CREATE OR REPLACE FUNCTION "public"."check_email_exists"("email_to_check" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(email) = lower(email_to_check)
  ) INTO v_exists;
  RETURN v_exists;
END;
$$;


ALTER FUNCTION "public"."check_email_exists"("email_to_check" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_rate_limit"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer, "p_window_minutes" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
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


ALTER FUNCTION "public"."check_rate_limit"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer, "p_window_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_rate_limits"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_deleted INTEGER := 0;
BEGIN
  DELETE FROM public.rate_limits rl
  WHERE rl.created_at < now() - interval '2 hours';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN COALESCE(v_deleted, 0);
END;
$$;


ALTER FUNCTION "public"."cleanup_rate_limits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_comment_with_rate_limit"("p_catch_id" "uuid", "p_body" "text", "p_parent_comment_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
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


ALTER FUNCTION "public"."create_comment_with_rate_limit"("p_catch_id" "uuid", "p_body" "text", "p_parent_comment_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_message" "text", "p_type" "public"."notification_type", "p_actor_id" "uuid" DEFAULT NULL::"uuid", "p_catch_id" "uuid" DEFAULT NULL::"uuid", "p_comment_id" "uuid" DEFAULT NULL::"uuid", "p_extra_data" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_id uuid;
  v_requester uuid := auth.uid();
  v_is_admin boolean;
  v_recipient_is_admin boolean;
BEGIN
  IF v_requester IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = v_requester
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    IF p_type = 'admin_report'::public.notification_type THEN
      SELECT EXISTS (
        SELECT 1 FROM public.admin_users au WHERE au.user_id = p_user_id
      ) INTO v_recipient_is_admin;

      IF NOT v_recipient_is_admin THEN
        RAISE EXCEPTION 'Not permitted to send this notification';
      END IF;
    ELSIF p_user_id = v_requester THEN
      NULL;
    ELSIF p_actor_id IS NOT NULL AND p_actor_id = v_requester THEN
      NULL;
    ELSE
      RAISE EXCEPTION 'Not permitted to send this notification';
    END IF;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    actor_id,
    type,
    message,
    catch_id,
    comment_id,
    extra_data,
    is_read,
    created_at
  )
  VALUES (
    p_user_id,
    p_actor_id,
    p_type::text,
    p_message,
    p_catch_id,
    p_comment_id,
    p_extra_data,
    false,
    now()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_message" "text", "p_type" "public"."notification_type", "p_actor_id" "uuid", "p_catch_id" "uuid", "p_comment_id" "uuid", "p_extra_data" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "target_type" "text" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "details" "text",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "resolution_notes" "text",
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


COMMENT ON TABLE "public"."reports" IS 'Preserve for audit even if reporter/target account is deleted (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';



CREATE OR REPLACE FUNCTION "public"."create_report_with_rate_limit"("p_target_type" "public"."report_target_type", "p_target_id" "uuid", "p_reason" "text", "p_details" "text" DEFAULT NULL::"text") RETURNS "public"."reports"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
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


ALTER FUNCTION "public"."create_report_with_rate_limit"("p_target_type" "public"."report_target_type", "p_target_id" "uuid", "p_reason" "text", "p_details" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_catch_moderation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_user_id uuid := coalesce(auth.uid(), NEW.user_id);
BEGIN
  PERFORM public.assert_moderation_allowed(v_user_id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_catch_moderation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_catch_rate_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
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


ALTER FUNCTION "public"."enforce_catch_rate_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_comment_rate_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
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


ALTER FUNCTION "public"."enforce_comment_rate_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_report_rate_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_uid uuid := COALESCE(NEW.reporter_id, auth.uid());
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT check_rate_limit(v_uid, 'reports', 5, 60) THEN
    RAISE EXCEPTION 'RATE_LIMITED: reports – max 5 per hour';
  END IF;

  INSERT INTO public.rate_limits (user_id, action, created_at)
  VALUES (v_uid, 'reports', now());

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_report_rate_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."follow_profile_with_rate_limit"("p_following_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_follow_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_user_id = p_following_id THEN
    RAISE EXCEPTION 'Cannot follow yourself';
  END IF;

  IF public.is_blocked_either_way(v_user_id, p_following_id) THEN
    RAISE EXCEPTION 'Target not accessible';
  END IF;

  IF NOT public.check_rate_limit(v_user_id, 'follows', 30, 60) THEN
    RAISE EXCEPTION 'RATE_LIMITED: follows – max 30 per hour';
  END IF;

  INSERT INTO public.profile_follows (follower_id, following_id, created_at)
  VALUES (v_user_id, p_following_id, now())
  ON CONFLICT (follower_id, following_id) DO NOTHING
  RETURNING id INTO v_follow_id;

  INSERT INTO public.rate_limits (user_id, action, created_at)
  VALUES (v_user_id, 'follows', now());

  RETURN COALESCE(
    v_follow_id,
    (SELECT id FROM public.profile_follows WHERE follower_id = v_user_id AND following_id = p_following_id)
  );
END;
$$;


ALTER FUNCTION "public"."follow_profile_with_rate_limit"("p_following_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_catch_rating_summary"("p_catch_id" "uuid") RETURNS TABLE("catch_id" "uuid", "rating_count" integer, "average_rating" numeric, "your_rating" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_viewer_id uuid := auth.uid();
  v_catch RECORD;
  v_is_admin boolean := COALESCE(public.is_admin(v_viewer_id), false);
  v_is_follower boolean := false;
BEGIN
  -- Load catch; require it to exist and not be soft-deleted.
  SELECT id, user_id, visibility, deleted_at, allow_ratings
  INTO v_catch
  FROM public.catches
  WHERE id = p_catch_id;

  IF NOT FOUND OR v_catch.deleted_at IS NOT NULL THEN
    RETURN;
  END IF;

  -- Block rules: if blocked either way, deny (admins bypass).
  IF NOT v_is_admin AND v_viewer_id IS NOT NULL THEN
    IF public.is_blocked_either_way(v_viewer_id, v_catch.user_id) THEN
      RETURN;
    END IF;
  END IF;

  -- Visibility rules:
  -- Admins and owners: allowed.
  IF v_is_admin OR (v_viewer_id IS NOT NULL AND v_viewer_id = v_catch.user_id) THEN
    NULL;
  ELSIF v_viewer_id IS NULL THEN
    -- Anonymous: only public
    IF v_catch.visibility <> 'public' THEN
      RETURN;
    END IF;
  ELSE
    -- Authenticated, non-admin, non-owner
    IF v_catch.visibility = 'public' THEN
      NULL;
    ELSIF v_catch.visibility = 'followers' THEN
      v_is_follower := COALESCE(public.is_following(v_viewer_id, v_catch.user_id), false);
      IF NOT v_is_follower THEN
        RETURN;
      END IF;
    ELSE
      -- private or unknown
      RETURN;
    END IF;
  END IF;

  -- Ratings disabled: still return one row with zero/nulls.
  IF v_catch.allow_ratings IS FALSE THEN
    RETURN QUERY
    SELECT v_catch.id, 0::int, NULL::numeric, NULL::int;
    RETURN;
  END IF;

  -- Return exactly one row with aggregates.
  RETURN QUERY
  SELECT
    v_catch.id AS catch_id,
    (
      SELECT count(*)::int
      FROM public.ratings r
      WHERE r.catch_id = v_catch.id
    ) AS rating_count,
    (
      SELECT CASE
               WHEN count(*) > 0 THEN avg(r.rating)::numeric
               ELSE NULL::numeric
             END
      FROM public.ratings r
      WHERE r.catch_id = v_catch.id
    ) AS average_rating,
    CASE
      WHEN v_viewer_id IS NULL THEN NULL::int
      ELSE (
        SELECT r2.rating
        FROM public.ratings r2
        WHERE r2.catch_id = v_catch.id
          AND r2.user_id = v_viewer_id
        LIMIT 1
      )
    END AS your_rating;
END;
$$;


ALTER FUNCTION "public"."get_catch_rating_summary"("p_catch_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_follower_count"("p_profile_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.profile_follows pf
  WHERE pf.following_id = p_profile_id;

  RETURN COALESCE(v_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_follower_count"("p_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_venue_rating"("p_venue_id" "uuid") RETURNS TABLE("venue_id" "uuid", "user_rating" integer)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
begin
  if auth.uid() is null then
    return;
  end if;

  return query
  select r.venue_id, r.rating::int as user_rating
  from public.venue_ratings r
  where r.venue_id = p_venue_id
    and r.user_id = auth.uid();
end;
$$;


ALTER FUNCTION "public"."get_my_venue_rating"("p_venue_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_rate_limit_status"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer, "p_window_minutes" integer) RETURNS TABLE("attempts_used" integer, "attempts_remaining" integer, "is_limited" boolean, "reset_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_cutoff TIMESTAMPTZ := now() - make_interval(mins => p_window_minutes);
BEGIN
  RETURN QUERY
  WITH attempts AS (
    SELECT COALESCE(count(*)::int, 0) AS attempts_used
    FROM public.rate_limits rl
    WHERE rl.user_id = p_user_id
      AND rl.action = p_action
      AND rl.created_at >= v_cutoff
  )
  SELECT
    attempts.attempts_used,
    GREATEST(p_max_attempts - attempts.attempts_used, 0)::int AS attempts_remaining,
    attempts.attempts_used >= p_max_attempts AS is_limited,
    v_cutoff + make_interval(mins => p_window_minutes) AS reset_at
  FROM attempts;
END;
$$;


ALTER FUNCTION "public"."get_rate_limit_status"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer, "p_window_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_venue_by_slug"("p_slug" "text") RETURNS TABLE("id" "uuid", "slug" "text", "name" "text", "location" "text", "description" "text", "is_published" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "short_tagline" "text", "ticket_type" "text", "price_from" "text", "best_for_tags" "text"[], "facilities" "text"[], "website_url" "text", "booking_url" "text", "contact_phone" "text", "notes_for_rr_team" "text", "total_catches" integer, "recent_catches_30d" integer, "headline_pb_weight" numeric, "headline_pb_unit" "public"."weight_unit", "headline_pb_species" "text", "top_species" "text"[], "avg_rating" numeric, "rating_count" integer)
    LANGUAGE "sql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
  SELECT
    v.id,
    v.slug,
    v.name,
    v.location,
    v.description,
    v.is_published,
    v.created_at,
    v.updated_at,
    v.short_tagline,
    v.ticket_type,
    v.price_from,
    v.best_for_tags,
    v.facilities,
    v.website_url,
    v.booking_url,
    v.contact_phone,
    v.notes_for_rr_team,
    vs.total_catches,
    vs.recent_catches_30d,
    vs.headline_pb_weight,
    vs.headline_pb_unit::public.weight_unit,
    vs.headline_pb_species,
    vs.top_species,
    vs.avg_rating,
    vs.rating_count
  FROM public.venues v
  LEFT JOIN public.venue_stats vs ON vs.venue_id = v.id
  WHERE v.slug = p_slug
  LIMIT 1;
$$;


ALTER FUNCTION "public"."get_venue_by_slug"("p_slug" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_venue_by_slug"("p_slug" "text") IS 'Get a single venue by slug with metadata and aggregate stats.';



CREATE OR REPLACE FUNCTION "public"."get_venue_past_events"("p_venue_id" "uuid", "p_now" timestamp with time zone DEFAULT "now"(), "p_limit" integer DEFAULT 10, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "venue_id" "uuid", "title" "text", "event_type" "text", "starts_at" timestamp with time zone, "ends_at" timestamp with time zone, "description" "text", "ticket_info" "text", "website_url" "text", "booking_url" "text", "is_published" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "sql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
  SELECT
    e.id,
    e.venue_id,
    e.title,
    e.event_type,
    e.starts_at,
    e.ends_at,
    e.description,
    e.ticket_info,
    e.website_url,
    e.booking_url,
    e.is_published,
    e.created_at,
    e.updated_at
  FROM public.venue_events e
  WHERE e.venue_id = p_venue_id
    AND e.is_published = true
    AND e.starts_at < p_now
  ORDER BY e.starts_at DESC
  LIMIT LEAST(COALESCE(p_limit, 10), 50)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;


ALTER FUNCTION "public"."get_venue_past_events"("p_venue_id" "uuid", "p_now" timestamp with time zone, "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_venue_past_events"("p_venue_id" "uuid", "p_now" timestamp with time zone, "p_limit" integer, "p_offset" integer) IS 'Published past events for a venue (Phase 3.3). Uses RLS to enforce published-only.';



CREATE TABLE IF NOT EXISTS "public"."venue_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "image_path" "text" NOT NULL,
    "caption" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."venue_photos" OWNER TO "postgres";


COMMENT ON TABLE "public"."venue_photos" IS 'Photos uploaded by venue owners/admins for venue pages.';



CREATE OR REPLACE FUNCTION "public"."get_venue_photos"("p_venue_id" "uuid", "p_limit" integer DEFAULT 12, "p_offset" integer DEFAULT 0) RETURNS SETOF "public"."venue_photos"
    LANGUAGE "sql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
  SELECT *
  FROM public.venue_photos
  WHERE venue_id = p_venue_id
  ORDER BY created_at DESC
  LIMIT LEAST(COALESCE(p_limit, 50), 100)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;


ALTER FUNCTION "public"."get_venue_photos"("p_venue_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_venue_photos"("p_venue_id" "uuid", "p_limit" integer, "p_offset" integer) IS 'Public: list venue photos for a given venue (ordered newest first).';



CREATE OR REPLACE FUNCTION "public"."get_venue_recent_catches"("p_venue_id" "uuid", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "title" "text", "image_url" "text", "user_id" "uuid", "location" "text", "species" "text", "weight" numeric, "weight_unit" "public"."weight_unit", "visibility" "public"."visibility_type", "hide_exact_spot" boolean, "conditions" "jsonb", "created_at" timestamp with time zone, "profiles" "jsonb", "ratings" "jsonb", "comments" "jsonb", "reactions" "jsonb", "venues" "jsonb")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_limit int := LEAST(COALESCE(p_limit, 20), 100);
  v_offset int := GREATEST(COALESCE(p_offset, 0), 0);
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.image_url,
    c.user_id,
    c.location,
    c.species,
    c.weight,
    CASE
      WHEN c.weight_unit::text = 'kg' THEN 'kg'::public.weight_unit
      WHEN c.weight_unit::text IN ('lb', 'lb_oz') THEN 'lb_oz'::public.weight_unit
      ELSE 'kg'::public.weight_unit
    END AS weight_unit,
    c.visibility,
    c.hide_exact_spot,
    c.conditions,
    c.created_at,
    (
      SELECT to_jsonb(p_sub.*)
      FROM (
        SELECT p.username, p.avatar_path, p.avatar_url
        FROM public.profiles p
        WHERE p.id = c.user_id
      ) AS p_sub
    ) AS profiles,
    (
      SELECT coalesce(jsonb_agg(jsonb_build_object('rating', r.rating)), '[]'::jsonb)
      FROM public.ratings r
      WHERE r.catch_id = c.id
    ) AS ratings,
    (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', cc.id)), '[]'::jsonb)
      FROM public.catch_comments cc
      WHERE cc.catch_id = c.id AND cc.deleted_at IS NULL
    ) AS comments,
    (
      SELECT coalesce(jsonb_agg(jsonb_build_object('user_id', cr.user_id)), '[]'::jsonb)
      FROM public.catch_reactions cr
      WHERE cr.catch_id = c.id
    ) AS reactions,
    (
      SELECT to_jsonb(v_sub.*)
      FROM (
        SELECT v.id, v.slug, v.name
        FROM public.venues v
        WHERE v.id = c.venue_id
      ) AS v_sub
    ) AS venues
  FROM public.catches c
  WHERE c.venue_id = p_venue_id
    AND c.deleted_at IS NULL
  ORDER BY c.created_at DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;


ALTER FUNCTION "public"."get_venue_recent_catches"("p_venue_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_venue_recent_catches"("p_venue_id" "uuid", "p_limit" integer, "p_offset" integer) IS 'Recent catches for a venue (privacy enforced by RLS). Includes venue metadata. See docs/VENUE-PAGES-DESIGN.md.';



CREATE OR REPLACE FUNCTION "public"."get_venue_top_anglers"("p_venue_id" "uuid", "p_limit" integer DEFAULT 10) RETURNS TABLE("user_id" "uuid", "username" "text", "avatar_path" "text", "avatar_url" "text", "catch_count" integer, "best_weight" numeric, "best_weight_unit" "public"."weight_unit", "last_catch_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_limit int := LEAST(COALESCE(p_limit, 10), 50);
BEGIN
  RETURN QUERY
  SELECT
    c.user_id,
    p.username,
    p.avatar_path,
    p.avatar_url,
    COUNT(*)::int AS catch_count,
    MAX(c.weight) FILTER (WHERE c.weight IS NOT NULL) AS best_weight,
    (
      SELECT c2.weight_unit
      FROM public.catches c2
      WHERE c2.venue_id = p_venue_id
        AND c2.user_id = c.user_id
        AND c2.deleted_at IS NULL
        AND c2.weight IS NOT NULL
      ORDER BY c2.weight DESC NULLS LAST, c2.created_at DESC
      LIMIT 1
    ) AS best_weight_unit,
    MAX(c.created_at) AS last_catch_at
  FROM public.catches c
  JOIN public.profiles p ON p.id = c.user_id
  WHERE c.venue_id = p_venue_id
    AND c.deleted_at IS NULL
  GROUP BY c.user_id, p.username, p.avatar_path, p.avatar_url
  ORDER BY catch_count DESC, best_weight DESC NULLS LAST, last_catch_at DESC
  LIMIT v_limit;
END;
$$;


ALTER FUNCTION "public"."get_venue_top_anglers"("p_venue_id" "uuid", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_venue_top_anglers"("p_venue_id" "uuid", "p_limit" integer) IS 'Top anglers for a venue (count, PB weight) relying on existing RLS/privacy. See docs/VENUE-PAGES-DESIGN.md.';



CREATE OR REPLACE FUNCTION "public"."get_venue_top_catches"("p_venue_id" "uuid", "p_limit" integer DEFAULT 20) RETURNS TABLE("id" "uuid", "title" "text", "image_url" "text", "user_id" "uuid", "location" "text", "species" "text", "weight" numeric, "weight_unit" "public"."weight_unit", "visibility" "public"."visibility_type", "hide_exact_spot" boolean, "conditions" "jsonb", "created_at" timestamp with time zone, "profiles" "jsonb", "ratings" "jsonb", "comments" "jsonb", "reactions" "jsonb", "venues" "jsonb")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.image_url,
    c.user_id,
    c.location,
    c.species,
    c.weight,
    CASE
      WHEN c.weight_unit::text = 'kg' THEN 'kg'::public.weight_unit
      WHEN c.weight_unit::text IN ('lb', 'lb_oz') THEN 'lb_oz'::public.weight_unit
      ELSE 'kg'::public.weight_unit
    END AS weight_unit,
    c.visibility,
    c.hide_exact_spot,
    c.conditions,
    c.created_at,
    (
      SELECT to_jsonb(p_sub.*)
      FROM (
        SELECT p.username, p.avatar_path, p.avatar_url
        FROM public.profiles p
        WHERE p.id = c.user_id
      ) AS p_sub
    ) AS profiles,
    (
      SELECT coalesce(jsonb_agg(jsonb_build_object('rating', r.rating)), '[]'::jsonb)
      FROM public.ratings r
      WHERE r.catch_id = c.id
    ) AS ratings,
    (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', cc.id)), '[]'::jsonb)
      FROM public.catch_comments cc
      WHERE cc.catch_id = c.id AND cc.deleted_at IS NULL
    ) AS comments,
    (
      SELECT coalesce(jsonb_agg(jsonb_build_object('user_id', cr.user_id)), '[]'::jsonb)
      FROM public.catch_reactions cr
      WHERE cr.catch_id = c.id
    ) AS reactions,
    (
      SELECT to_jsonb(v_sub.*)
      FROM (
        SELECT v.id, v.slug, v.name
        FROM public.venues v
        WHERE v.id = c.venue_id
      ) AS v_sub
    ) AS venues
  FROM public.catches c
  WHERE c.venue_id = p_venue_id
    AND c.deleted_at IS NULL
  ORDER BY c.weight DESC NULLS LAST
  LIMIT LEAST(COALESCE(p_limit, 20), 100);
END;
$$;


ALTER FUNCTION "public"."get_venue_top_catches"("p_venue_id" "uuid", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_venue_top_catches"("p_venue_id" "uuid", "p_limit" integer) IS 'Top catches for a venue (weight-first), privacy via RLS. Includes venue metadata. See docs/VENUE-PAGES-DESIGN.md.';



CREATE OR REPLACE FUNCTION "public"."get_venue_upcoming_events"("p_venue_id" "uuid", "p_now" timestamp with time zone DEFAULT "now"(), "p_limit" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "venue_id" "uuid", "title" "text", "event_type" "text", "starts_at" timestamp with time zone, "ends_at" timestamp with time zone, "description" "text", "ticket_info" "text", "website_url" "text", "booking_url" "text", "is_published" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "sql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
  SELECT
    e.id,
    e.venue_id,
    e.title,
    e.event_type,
    e.starts_at,
    e.ends_at,
    e.description,
    e.ticket_info,
    e.website_url,
    e.booking_url,
    e.is_published,
    e.created_at,
    e.updated_at
  FROM public.venue_events e
  WHERE e.venue_id = p_venue_id
    AND e.is_published = true
    AND e.starts_at >= p_now
  ORDER BY e.starts_at ASC
  LIMIT LEAST(COALESCE(p_limit, 10), 50);
$$;


ALTER FUNCTION "public"."get_venue_upcoming_events"("p_venue_id" "uuid", "p_now" timestamp with time zone, "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_venue_upcoming_events"("p_venue_id" "uuid", "p_now" timestamp with time zone, "p_limit" integer) IS 'Published upcoming events for a venue (Phase 3.3). Uses RLS to enforce published-only.';



CREATE OR REPLACE FUNCTION "public"."get_venues"("p_search" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "slug" "text", "name" "text", "location" "text", "description" "text", "is_published" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "short_tagline" "text", "ticket_type" "text", "price_from" "text", "best_for_tags" "text"[], "facilities" "text"[], "total_catches" integer, "recent_catches_30d" integer, "headline_pb_weight" numeric, "headline_pb_unit" "public"."weight_unit", "headline_pb_species" "text", "top_species" "text"[], "avg_rating" numeric, "rating_count" integer)
    LANGUAGE "sql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
  SELECT
    v.id,
    v.slug,
    v.name,
    v.location,
    v.description,
    v.is_published,
    v.created_at,
    v.updated_at,
    v.short_tagline,
    v.ticket_type,
    v.price_from,
    v.best_for_tags,
    v.facilities,
    vs.total_catches,
    vs.recent_catches_30d,
    vs.headline_pb_weight,
    vs.headline_pb_unit::public.weight_unit,
    vs.headline_pb_species,
    vs.top_species,
    vs.avg_rating,
    vs.rating_count
  FROM public.venues v
  LEFT JOIN public.venue_stats vs ON vs.venue_id = v.id
  WHERE (p_search IS NULL OR v.name ILIKE '%' || p_search || '%' OR v.location ILIKE '%' || p_search || '%')
  ORDER BY v.name ASC
  LIMIT LEAST(COALESCE(p_limit, 20), 100)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;


ALTER FUNCTION "public"."get_venues"("p_search" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_venues"("p_search" "text", "p_limit" integer, "p_offset" integer) IS 'List venues with metadata and aggregate stats for cards.';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  base_username TEXT;
  cleaned_username TEXT;
  final_username TEXT;
  suffix_counter INTEGER := 0;
  max_length CONSTANT INTEGER := 30;
  min_length CONSTANT INTEGER := 3;
BEGIN
  IF NEW.email IS NOT NULL THEN
    base_username := split_part(lower(NEW.email), '@', 1);
  END IF;
  IF base_username IS NULL OR length(base_username) < min_length THEN
    base_username := 'angler';
  END IF;
  cleaned_username := regexp_replace(base_username, '[^a-z0-9_]', '', 'g');
  IF length(cleaned_username) < min_length THEN
    cleaned_username := cleaned_username || substring(NEW.id::text, 1, min_length - length(cleaned_username));
  END IF;
  cleaned_username := left(cleaned_username, max_length);
  final_username := cleaned_username;

  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix_counter := suffix_counter + 1;
    final_username :=
      left(cleaned_username, max_length - 5) || '_' ||
      substring(md5(NEW.id::text || suffix_counter::text), 1, 4);
  END LOOP;

  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, final_username)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = p_user_id
  );
$$;


ALTER FUNCTION "public"."is_admin"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_blocked_either_way"("p_user_id" "uuid", "p_other_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile_blocks pb
    WHERE (pb.blocker_id = p_user_id AND pb.blocked_id = p_other_id)
       OR (pb.blocker_id = p_other_id AND pb.blocked_id = p_user_id)
  );
$$;


ALTER FUNCTION "public"."is_blocked_either_way"("p_user_id" "uuid", "p_other_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_blocked_either_way"("p_user_id" "uuid", "p_other_id" "uuid") IS 'Returns true if either user has blocked the other (see docs/BLOCK-MUTE-DESIGN.md).';



CREATE OR REPLACE FUNCTION "public"."is_following"("p_follower" "uuid", "p_following" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile_follows pf
    WHERE pf.follower_id = p_follower
      AND pf.following_id = p_following
  );
$$;


ALTER FUNCTION "public"."is_following"("p_follower" "uuid", "p_following" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_venue_admin_or_owner"("p_venue_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    return false;
  end if;

  if exists (select 1 from public.admin_users au where au.user_id = v_actor) then
    return true;
  end if;

  return exists (
    select 1 from public.venue_owners vo
    where vo.venue_id = p_venue_id
      and vo.user_id = v_actor
  );
end;
$$;


ALTER FUNCTION "public"."is_venue_admin_or_owner"("p_venue_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."owner_add_venue_photo"("p_venue_id" "uuid", "p_image_path" "text", "p_caption" "text" DEFAULT NULL::"text") RETURNS "public"."venue_photos"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_allowed boolean;
  v_row public.venue_photos;
BEGIN
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to add photos for this venue';
  END IF;

  INSERT INTO public.venue_photos (venue_id, image_path, caption, created_by)
  VALUES (p_venue_id, p_image_path, p_caption, auth.uid())
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;


ALTER FUNCTION "public"."owner_add_venue_photo"("p_venue_id" "uuid", "p_image_path" "text", "p_caption" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."owner_add_venue_photo"("p_venue_id" "uuid", "p_image_path" "text", "p_caption" "text") IS 'Owner/Admin: add a venue photo (stores storage path + optional caption).';



CREATE TABLE IF NOT EXISTS "public"."venue_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "event_type" "text",
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone,
    "description" "text",
    "ticket_info" "text",
    "website_url" "text",
    "booking_url" "text",
    "is_published" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."venue_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."venue_events" IS 'Venue events/matches/announcements (admin-authored v1). See docs/VENUE-PAGES-DESIGN.md §7.';



COMMENT ON COLUMN "public"."venue_events"."event_type" IS 'Free-form type: match, open_day, maintenance, announcement, other (text for now).';



COMMENT ON COLUMN "public"."venue_events"."ticket_info" IS 'Free text for entry fee / pegs / payouts.';



COMMENT ON COLUMN "public"."venue_events"."website_url" IS 'Optional event-specific website link (HTTPS preferred).';



COMMENT ON COLUMN "public"."venue_events"."booking_url" IS 'Optional event-specific booking link (HTTPS preferred).';



COMMENT ON COLUMN "public"."venue_events"."is_published" IS 'Published flag. RLS allows public read of published rows; writes are admin RPC only in this phase.';



CREATE OR REPLACE FUNCTION "public"."owner_create_venue_event"("p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_is_published" boolean DEFAULT false) RETURNS "public"."venue_events"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  v_allowed boolean;
  v_row public.venue_events;
begin
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  if not v_allowed then
    raise exception 'Not authorized to manage events for this venue';
  end if;

  insert into public.venue_events (
    venue_id,
    title,
    event_type,
    starts_at,
    ends_at,
    description,
    ticket_info,
    website_url,
    booking_url,
    contact_phone,
    is_published,
    created_at,
    updated_at
  )
  values (
    p_venue_id,
    p_title,
    p_event_type,
    p_starts_at,
    p_ends_at,
    p_description,
    p_ticket_info,
    p_website_url,
    p_booking_url,
    p_contact_phone,
    coalesce(p_is_published, false),
    now(),
    now()
  )
  returning * into v_row;

  return v_row;
end;
$$;


ALTER FUNCTION "public"."owner_create_venue_event"("p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_is_published" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."owner_delete_venue_event"("p_event_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  v_allowed boolean;
  v_venue_id uuid;
begin
  select venue_id into v_venue_id from public.venue_events where id = p_event_id;
  if v_venue_id is null then
    raise exception 'Event not found';
  end if;

  v_allowed := public.is_venue_admin_or_owner(v_venue_id);
  if not v_allowed then
    raise exception 'Not authorized to manage events for this venue';
  end if;

  delete from public.venue_events where id = p_event_id;
end;
$$;


ALTER FUNCTION "public"."owner_delete_venue_event"("p_event_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."owner_delete_venue_photo"("p_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_venue_id uuid;
BEGIN
  SELECT venue_id INTO v_venue_id FROM public.venue_photos WHERE id = p_id;
  IF v_venue_id IS NULL THEN
    RAISE EXCEPTION 'Photo not found';
  END IF;

  IF NOT public.is_venue_admin_or_owner(v_venue_id) THEN
    RAISE EXCEPTION 'Not authorized to delete this photo';
  END IF;

  DELETE FROM public.venue_photos WHERE id = p_id;
END;
$$;


ALTER FUNCTION "public"."owner_delete_venue_photo"("p_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."owner_delete_venue_photo"("p_id" "uuid") IS 'Owner/Admin: delete a venue photo if you manage the venue.';



CREATE OR REPLACE FUNCTION "public"."owner_get_venue_events"("p_venue_id" "uuid") RETURNS SETOF "public"."venue_events"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  v_allowed boolean;
begin
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  if not v_allowed then
    raise exception 'Not authorized to manage events for this venue';
  end if;

  return query
  select ve.*
  from public.venue_events ve
  where ve.venue_id = p_venue_id;
end;
$$;


ALTER FUNCTION "public"."owner_get_venue_events"("p_venue_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."owner_update_venue_event"("p_event_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_is_published" boolean DEFAULT false) RETURNS "public"."venue_events"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  v_allowed boolean;
  v_row public.venue_events;
  v_venue_id uuid;
begin
  select venue_id into v_venue_id from public.venue_events where id = p_event_id;
  if v_venue_id is null then
    raise exception 'Event not found';
  end if;

  v_allowed := public.is_venue_admin_or_owner(v_venue_id);
  if not v_allowed then
    raise exception 'Not authorized to manage events for this venue';
  end if;

  update public.venue_events
  set
    title = p_title,
    event_type = p_event_type,
    starts_at = p_starts_at,
    ends_at = p_ends_at,
    description = p_description,
    ticket_info = p_ticket_info,
    website_url = p_website_url,
    booking_url = p_booking_url,
    contact_phone = p_contact_phone,
    is_published = coalesce(p_is_published, false),
    updated_at = now()
  where id = p_event_id
  returning * into v_row;

  return v_row;
end;
$$;


ALTER FUNCTION "public"."owner_update_venue_event"("p_event_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_is_published" boolean) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "location" "text",
    "description" "text",
    "is_published" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "short_tagline" "text",
    "ticket_type" "text",
    "price_from" "text",
    "best_for_tags" "text"[],
    "facilities" "text"[],
    "website_url" "text",
    "booking_url" "text",
    "contact_phone" "text",
    "notes_for_rr_team" "text"
);

ALTER TABLE ONLY "public"."venues" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."venues" OWNER TO "postgres";


COMMENT ON TABLE "public"."venues" IS 'Venue directory for catches (see docs/VENUE-PAGES-DESIGN.md and docs/VENUE-PAGES-ROADMAP.md).';



COMMENT ON COLUMN "public"."venues"."slug" IS 'Slug for /venues/:slug routes.';



COMMENT ON COLUMN "public"."venues"."location" IS 'Free-text location; structured fields may follow later.';



COMMENT ON COLUMN "public"."venues"."short_tagline" IS 'Short venue tagline for cards/heroes (e.g. “Big carp day-ticket venue with 3 main lakes”).';



COMMENT ON COLUMN "public"."venues"."ticket_type" IS 'Ticket/membership type label (e.g. Day ticket, Syndicate, Club water, Coaching venue).';



COMMENT ON COLUMN "public"."venues"."price_from" IS 'Starting price text, e.g. “from £10 / day”.';



COMMENT ON COLUMN "public"."venues"."best_for_tags" IS 'Array of tags describing who/what the venue is best for (e.g. Carp, Match, Families).';



COMMENT ON COLUMN "public"."venues"."facilities" IS 'Array of facilities available (e.g. Toilets, Café, Tackle shop, Parking, Accessible pegs).';



COMMENT ON COLUMN "public"."venues"."website_url" IS 'Venue website URL (HTTPS preferred).';



COMMENT ON COLUMN "public"."venues"."booking_url" IS 'Venue booking URL (outbound only, HTTPS required in app validation).';



COMMENT ON COLUMN "public"."venues"."contact_phone" IS 'Optional contact phone number for the venue.';



COMMENT ON COLUMN "public"."venues"."notes_for_rr_team" IS 'Admin-only notes for ReelyRated staff; not surfaced to end users.';



CREATE OR REPLACE FUNCTION "public"."owner_update_venue_metadata"("p_venue_id" "uuid", "p_tagline" "text", "p_description" "text", "p_ticket_type" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_price_from" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text") RETURNS "public"."venues"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  v_allowed boolean;
  v_row public.venues;
begin
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  if not v_allowed then
    raise exception 'Not authorized to update this venue';
  end if;

  update public.venues
  set
    short_tagline = p_tagline,
    description = p_description,
    ticket_type = p_ticket_type,
    best_for_tags = p_best_for_tags,
    facilities = p_facilities,
    price_from = p_price_from,
    website_url = p_website_url,
    booking_url = p_booking_url,
    contact_phone = p_contact_phone,
    updated_at = now()
  where id = p_venue_id
  returning * into v_row;

  return v_row;
end;
$$;


ALTER FUNCTION "public"."owner_update_venue_metadata"("p_venue_id" "uuid", "p_tagline" "text", "p_description" "text", "p_ticket_type" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_price_from" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rate_catch_with_rate_limit"("p_catch_id" "uuid", "p_rating" integer) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_id uuid;
  v_catch RECORD;
  v_is_admin boolean := public.is_admin(v_user_id);
  v_is_follower boolean := false;
  v_actor_username text;
  v_catch_title text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, user_id, visibility, deleted_at, allow_ratings, title
  INTO v_catch
  FROM public.catches
  WHERE id = p_catch_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Catch is not accessible';
  END IF;

  IF v_catch.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Catch is not accessible';
  END IF;

  IF v_catch.allow_ratings IS FALSE THEN
    RAISE EXCEPTION 'Ratings are disabled for this catch';
  END IF;

  IF v_catch.user_id = v_user_id THEN
    RAISE EXCEPTION 'You cannot rate your own catch';
  END IF;

  IF NOT v_is_admin THEN
    IF v_catch.visibility = 'public' THEN
      NULL;
    ELSIF v_catch.visibility = 'followers' THEN
      v_is_follower := public.is_following(v_user_id, v_catch.user_id);
      IF NOT v_is_follower THEN
        RAISE EXCEPTION 'Catch is not accessible';
      END IF;
    ELSIF v_catch.visibility = 'private' THEN
      -- Only owner or admin can view; owner already blocked above, so non-admin cannot rate private.
      RAISE EXCEPTION 'Catch is not accessible';
    ELSE
      RAISE EXCEPTION 'Catch is not accessible';
    END IF;
  END IF;

  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 10 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 10';
  END IF;

  IF NOT public.check_rate_limit(v_user_id, 'ratings', 50, 60) THEN
    RAISE EXCEPTION 'RATE_LIMITED: ratings – max 50 per hour';
  END IF;

  INSERT INTO public.ratings (catch_id, user_id, rating, created_at)
  VALUES (p_catch_id, v_user_id, p_rating, now())
  ON CONFLICT (user_id, catch_id) DO UPDATE
    SET rating = EXCLUDED.rating, created_at = now()
  RETURNING id INTO v_id;

  INSERT INTO public.rate_limits (user_id, action, created_at)
  VALUES (v_user_id, 'ratings', now());

  -- Note: Block relationships are not enforced here; access is currently governed by visibility/auth only.
  -- Tightening to consult is_blocked_either_way would be a deliberate behaviour change in a future pass.

  -- Look up the freshest actor username and emit the notification on the server.
  SELECT username
  INTO v_actor_username
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_actor_username IS NULL THEN
    v_actor_username := 'Someone';
  END IF;

  v_catch_title := coalesce(v_catch.title, 'your catch');

  PERFORM public.create_notification(
    p_user_id    := v_catch.user_id,
    p_message    := format('%s rated your catch "%s" %s/10.', v_actor_username, v_catch_title, p_rating),
    p_type       := 'new_rating',
    p_actor_id   := v_user_id,
    p_catch_id   := v_catch.id,
    p_comment_id := NULL,
    p_extra_data := jsonb_build_object(
      'rating', p_rating,
      'actor_username', v_actor_username,
      'catch_title', v_catch_title
    )
  );

  RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."rate_catch_with_rate_limit"("p_catch_id" "uuid", "p_rating" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."react_to_catch_with_rate_limit"("p_catch_id" "uuid", "p_reaction" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_reaction public.reaction_type := COALESCE(NULLIF(p_reaction, ''), 'like')::public.reaction_type;
  v_catch RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Visibility rules:
  -- - Owner cannot react to own catch.
  -- - Public: anyone can react.
  -- - Followers: only followers (public.is_following(viewer, owner)).
  -- - Private: no reactions from others.
  -- This is intentionally aligned with rate_catch_with_rate_limit visibility checks.
  SELECT id, user_id, visibility, deleted_at
  INTO v_catch
  FROM public.catches
  WHERE id = p_catch_id;

  IF NOT FOUND OR v_catch.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Catch is not accessible';
  END IF;

  IF v_catch.user_id = v_user_id THEN
    RAISE EXCEPTION 'You cannot react to your own catch';
  END IF;

  IF NOT public.is_admin(v_user_id) THEN
    IF v_catch.visibility = 'public' THEN
      NULL;
    ELSIF v_catch.visibility = 'followers' THEN
      IF NOT public.is_following(v_user_id, v_catch.user_id) THEN
        RAISE EXCEPTION 'Catch is not accessible';
      END IF;
    ELSIF v_catch.visibility = 'private' THEN
      RAISE EXCEPTION 'Catch is not accessible';
    ELSE
      RAISE EXCEPTION 'Catch is not accessible';
    END IF;
  END IF;

  IF NOT public.check_rate_limit(v_user_id, 'reactions', 50, 60) THEN
    RAISE EXCEPTION 'RATE_LIMITED: reactions – max 50 per hour';
  END IF;

  INSERT INTO public.catch_reactions (catch_id, user_id, reaction, created_at)
  VALUES (p_catch_id, v_user_id, v_reaction::text, now())
  ON CONFLICT (user_id, catch_id) DO UPDATE
    SET reaction = EXCLUDED.reaction, created_at = now();

  INSERT INTO public.rate_limits (user_id, action, created_at)
  VALUES (v_user_id, 'reactions', now());

  RETURN true;
END;
$$;


ALTER FUNCTION "public"."react_to_catch_with_rate_limit"("p_catch_id" "uuid", "p_reaction" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_account_deletion"("p_reason" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile RECORD;
  v_now timestamptz := now();
  v_username text;
  v_profile_deleted boolean := false;
  v_catches_updated integer := 0;
  v_comments_tombstoned integer := 0;
  v_reactions_deleted integer := 0;
  v_ratings_deleted integer := 0;
  v_follows_deleted integer := 0;
  v_notifications_deleted integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT *
  INTO v_profile
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', v_user_id;
  END IF;

  IF v_profile.is_deleted THEN
    v_profile_deleted := true;
    RETURN jsonb_build_object(
      'profile_deleted', v_profile_deleted,
      'catches_updated', v_catches_updated,
      'comments_tombstoned', v_comments_tombstoned,
      'reactions_deleted', v_reactions_deleted,
      'ratings_deleted', v_ratings_deleted,
      'follows_deleted', v_follows_deleted,
      'notifications_deleted', v_notifications_deleted
    );
  END IF;

  -- Generate a tombstone username, avoid collisions.
  v_username := 'deleted-user-' || substring(v_user_id::text, 1, 8);
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username AND id <> v_user_id) LOOP
    v_username := 'deleted-user-' || substring(gen_random_uuid()::text, 1, 8);
  END LOOP;

  UPDATE public.profiles
  SET is_deleted = TRUE,
      deleted_at = v_now,
      locked_for_deletion = TRUE,
      username = v_username,
      bio = NULL,
      avatar_path = NULL,
      avatar_url = NULL,
      -- moderation_status could be set to a terminal state if an enum supports it; keeping existing value for now.
      updated_at = v_now
  WHERE id = v_user_id;

  v_profile_deleted := true;

  UPDATE public.catches
  SET visibility = 'private',
      deleted_at = COALESCE(deleted_at, v_now),
      updated_at = v_now
  WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_catches_updated = ROW_COUNT;

  UPDATE public.catch_comments
  SET deleted_at = COALESCE(deleted_at, v_now),
      body = CASE WHEN deleted_at IS NULL THEN '[deleted]' ELSE body END
  WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_comments_tombstoned = ROW_COUNT;

  DELETE FROM public.catch_reactions WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_reactions_deleted = ROW_COUNT;

  DELETE FROM public.ratings WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_ratings_deleted = ROW_COUNT;

  DELETE FROM public.profile_follows WHERE follower_id = v_user_id OR following_id = v_user_id;
  GET DIAGNOSTICS v_follows_deleted = ROW_COUNT;

  DELETE FROM public.notifications WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_notifications_deleted = ROW_COUNT;

  -- Audit tables intentionally preserved: reports, user_warnings, moderation_log.

  RETURN jsonb_build_object(
    'profile_deleted', v_profile_deleted,
    'catches_updated', v_catches_updated,
    'comments_tombstoned', v_comments_tombstoned,
    'reactions_deleted', v_reactions_deleted,
    'ratings_deleted', v_ratings_deleted,
    'follows_deleted', v_follows_deleted,
    'notifications_deleted', v_notifications_deleted
  );
END;
$$;


ALTER FUNCTION "public"."request_account_deletion"("p_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."request_account_deletion"("p_reason" "text") IS 'Soft-delete/anonymise the authenticated account; preserves audit tables (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';



CREATE OR REPLACE FUNCTION "public"."request_account_export"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile jsonb;
  v_catches jsonb;
  v_comments jsonb;
  v_ratings jsonb;
  v_reactions jsonb;
  v_follows jsonb;
  v_notifications jsonb;
  v_reports jsonb;
  v_warnings jsonb;
  v_moderation_log jsonb;
  v_admin_membership jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Profile (single object)
  SELECT to_jsonb(p.*) INTO v_profile
  FROM public.profiles p
  WHERE p.id = v_user_id;

  -- Catches authored by user
  SELECT coalesce(jsonb_agg(c.*), '[]'::jsonb) INTO v_catches
  FROM public.catches c
  WHERE c.user_id = v_user_id;

  -- Comments authored by user
  SELECT coalesce(jsonb_agg(cc.*), '[]'::jsonb) INTO v_comments
  FROM public.catch_comments cc
  WHERE cc.user_id = v_user_id;

  -- Ratings authored by user
  SELECT coalesce(jsonb_agg(r.*), '[]'::jsonb) INTO v_ratings
  FROM public.ratings r
  WHERE r.user_id = v_user_id;

  -- Reactions authored by user
  SELECT coalesce(jsonb_agg(cr.*), '[]'::jsonb) INTO v_reactions
  FROM public.catch_reactions cr
  WHERE cr.user_id = v_user_id;

  -- Follows (both directions)
  SELECT coalesce(jsonb_agg(f.*), '[]'::jsonb) INTO v_follows
  FROM public.profile_follows f
  WHERE f.follower_id = v_user_id
     OR f.following_id = v_user_id;

  -- Notifications inbox
  SELECT coalesce(jsonb_agg(n.*), '[]'::jsonb) INTO v_notifications
  FROM public.notifications n
  WHERE n.user_id = v_user_id;

  -- Reports: reporter or target user
  SELECT coalesce(jsonb_agg(rep.*), '[]'::jsonb) INTO v_reports
  FROM public.reports rep
  WHERE rep.reporter_id = v_user_id
     OR rep.target_id = v_user_id;

  -- Warnings issued to user
  SELECT coalesce(jsonb_agg(w.*), '[]'::jsonb) INTO v_warnings
  FROM public.user_warnings w
  WHERE w.user_id = v_user_id;

  -- Moderation log rows involving user or their content
  SELECT coalesce(jsonb_agg(ml.*), '[]'::jsonb) INTO v_moderation_log
  FROM public.moderation_log ml
  WHERE ml.user_id = v_user_id
     OR (ml.target_type = 'user' AND ml.target_id = v_user_id)
     OR ml.catch_id IN (SELECT id FROM public.catches WHERE user_id = v_user_id)
     OR ml.comment_id IN (SELECT id FROM public.catch_comments WHERE user_id = v_user_id);

  -- Admin membership (if any)
  SELECT to_jsonb(a.*) INTO v_admin_membership
  FROM public.admin_users a
  WHERE a.user_id = v_user_id;

  RETURN jsonb_build_object(
    'profile', v_profile,
    'catches', v_catches,
    'comments', v_comments,
    'ratings', v_ratings,
    'reactions', v_reactions,
    'follows', v_follows,
    'notifications', v_notifications,
    'reports', v_reports,
    'warnings', v_warnings,
    'moderation_log', v_moderation_log,
    'admin_membership', v_admin_membership
  );
END;
$$;


ALTER FUNCTION "public"."request_account_export"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."request_account_export"() IS 'Returns a JSON export of the authenticated user''s data (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';



CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."soft_delete_comment"("p_comment_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_is_admin boolean := public.is_admin(v_user_id);
  v_comment RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, user_id, deleted_at
  INTO v_comment
  FROM public.catch_comments
  WHERE id = p_comment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment not found';
  END IF;

  IF v_comment.deleted_at IS NOT NULL THEN
    RETURN;
  END IF;

  IF NOT v_is_admin AND v_comment.user_id <> v_user_id THEN
    RAISE EXCEPTION 'Not permitted to delete this comment';
  END IF;

  UPDATE public.catch_comments
  SET deleted_at = now()
  WHERE id = v_comment.id;
END;
$$;


ALTER FUNCTION "public"."soft_delete_comment"("p_comment_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unblock_profile"("p_blocked_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_blocker_id uuid := auth.uid();
BEGIN
  IF v_blocker_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.profile_blocks
  WHERE blocker_id = v_blocker_id
    AND blocked_id = p_blocked_id;
END;
$$;


ALTER FUNCTION "public"."unblock_profile"("p_blocked_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."unblock_profile"("p_blocked_id" "uuid") IS 'Unblocks a previously blocked profile. See docs/BLOCK-MUTE-DESIGN.md.';



CREATE OR REPLACE FUNCTION "public"."upsert_venue_rating"("p_venue_id" "uuid", "p_rating" integer) RETURNS TABLE("venue_id" "uuid", "avg_rating" numeric, "rating_count" integer, "user_rating" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'INVALID_RATING: rating must be between 1 and 5';
  END IF;

  INSERT INTO public.venue_ratings AS vr (venue_id, user_id, rating)
  VALUES (p_venue_id, v_user_id, p_rating)
  ON CONFLICT ON CONSTRAINT venue_ratings_venue_id_user_id_key
  DO UPDATE SET rating = EXCLUDED.rating,
               updated_at = now();

  SELECT
    p_venue_id                                       AS venue_id,
    avg(vr.rating)::numeric(3,2)                     AS avg_rating,
    count(vr.*)::int                                 AS rating_count
  INTO
    upsert_venue_rating.venue_id,
    upsert_venue_rating.avg_rating,
    upsert_venue_rating.rating_count
  FROM public.venue_ratings vr
  WHERE vr.venue_id = p_venue_id;

  SELECT vr.rating::int
  INTO upsert_venue_rating.user_rating
  FROM public.venue_ratings vr
  WHERE vr.venue_id = p_venue_id
    AND vr.user_id = v_user_id
  LIMIT 1;

  RETURN;
END;
$$;


ALTER FUNCTION "public"."upsert_venue_rating"("p_venue_id" "uuid", "p_rating" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_rate_limits"() RETURNS TABLE("action" "text", "count" integer, "oldest_attempt" timestamp with time zone, "newest_attempt" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    rl.action,
    count(*)::int AS count,
    MIN(rl.created_at) AS oldest_attempt,
    MAX(rl.created_at) AS newest_attempt
  FROM public.rate_limits rl
  GROUP BY rl.action;
END;
$$;


ALTER FUNCTION "public"."user_rate_limits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_rate_limits"("p_user_id" "uuid") RETURNS TABLE("action" "text", "count" integer, "oldest_attempt" timestamp with time zone, "newest_attempt" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    rl.action,
    count(*)::int AS count,
    MIN(rl.created_at) AS oldest_attempt,
    MAX(rl.created_at) AS newest_attempt
  FROM public.rate_limits rl
  WHERE rl.user_id = p_user_id
  GROUP BY rl.action;
END;
$$;


ALTER FUNCTION "public"."user_rate_limits"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "storage"."add_prefixes"("_bucket_id" "text", "_name" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$$;


ALTER FUNCTION "storage"."add_prefixes"("_bucket_id" "text", "_name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."delete_leaf_prefixes"("bucket_ids" "text"[], "names" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


ALTER FUNCTION "storage"."delete_leaf_prefixes"("bucket_ids" "text"[], "names" "text"[]) OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."delete_prefix"("_bucket_id" "text", "_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$$;


ALTER FUNCTION "storage"."delete_prefix"("_bucket_id" "text", "_name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."delete_prefix_hierarchy_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$$;


ALTER FUNCTION "storage"."delete_prefix_hierarchy_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."enforce_bucket_name_length"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION "storage"."enforce_bucket_name_length"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."extension"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION "storage"."extension"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."filename"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION "storage"."filename"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."foldername"("name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION "storage"."foldername"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_level"("name" "text") RETURNS integer
    LANGUAGE "sql" IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


ALTER FUNCTION "storage"."get_level"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_prefix"("name" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


ALTER FUNCTION "storage"."get_prefix"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_prefixes"("name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql" IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


ALTER FUNCTION "storage"."get_prefixes"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_size_by_bucket"() RETURNS TABLE("size" bigint, "bucket_id" "text")
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION "storage"."get_size_by_bucket"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "next_key_token" "text" DEFAULT ''::"text", "next_upload_token" "text" DEFAULT ''::"text") RETURNS TABLE("key" "text", "id" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "next_key_token" "text", "next_upload_token" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."list_objects_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "start_after" "text" DEFAULT ''::"text", "next_token" "text" DEFAULT ''::"text") RETURNS TABLE("name" "text", "id" "uuid", "metadata" "jsonb", "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


ALTER FUNCTION "storage"."list_objects_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "start_after" "text", "next_token" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."lock_top_prefixes"("bucket_ids" "text"[], "names" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_bucket text;
    v_top text;
BEGIN
    FOR v_bucket, v_top IN
        SELECT DISTINCT t.bucket_id,
            split_part(t.name, '/', 1) AS top
        FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        WHERE t.name <> ''
        ORDER BY 1, 2
        LOOP
            PERFORM pg_advisory_xact_lock(hashtextextended(v_bucket || '/' || v_top, 0));
        END LOOP;
END;
$$;


ALTER FUNCTION "storage"."lock_top_prefixes"("bucket_ids" "text"[], "names" "text"[]) OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_delete_cleanup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION "storage"."objects_delete_cleanup"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_insert_prefix_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION "storage"."objects_insert_prefix_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_update_cleanup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    -- NEW - OLD (destinations to create prefixes for)
    v_add_bucket_ids text[];
    v_add_names      text[];

    -- OLD - NEW (sources to prune)
    v_src_bucket_ids text[];
    v_src_names      text[];
BEGIN
    IF TG_OP <> 'UPDATE' THEN
        RETURN NULL;
    END IF;

    -- 1) Compute NEW−OLD (added paths) and OLD−NEW (moved-away paths)
    WITH added AS (
        SELECT n.bucket_id, n.name
        FROM new_rows n
        WHERE n.name <> '' AND position('/' in n.name) > 0
        EXCEPT
        SELECT o.bucket_id, o.name FROM old_rows o WHERE o.name <> ''
    ),
    moved AS (
         SELECT o.bucket_id, o.name
         FROM old_rows o
         WHERE o.name <> ''
         EXCEPT
         SELECT n.bucket_id, n.name FROM new_rows n WHERE n.name <> ''
    )
    SELECT
        -- arrays for ADDED (dest) in stable order
        COALESCE( (SELECT array_agg(a.bucket_id ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        COALESCE( (SELECT array_agg(a.name      ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        -- arrays for MOVED (src) in stable order
        COALESCE( (SELECT array_agg(m.bucket_id ORDER BY m.bucket_id, m.name) FROM moved m), '{}' ),
        COALESCE( (SELECT array_agg(m.name      ORDER BY m.bucket_id, m.name) FROM moved m), '{}' )
    INTO v_add_bucket_ids, v_add_names, v_src_bucket_ids, v_src_names;

    -- Nothing to do?
    IF (array_length(v_add_bucket_ids, 1) IS NULL) AND (array_length(v_src_bucket_ids, 1) IS NULL) THEN
        RETURN NULL;
    END IF;

    -- 2) Take per-(bucket, top) locks: ALL prefixes in consistent global order to prevent deadlocks
    DECLARE
        v_all_bucket_ids text[];
        v_all_names text[];
    BEGIN
        -- Combine source and destination arrays for consistent lock ordering
        v_all_bucket_ids := COALESCE(v_src_bucket_ids, '{}') || COALESCE(v_add_bucket_ids, '{}');
        v_all_names := COALESCE(v_src_names, '{}') || COALESCE(v_add_names, '{}');

        -- Single lock call ensures consistent global ordering across all transactions
        IF array_length(v_all_bucket_ids, 1) IS NOT NULL THEN
            PERFORM storage.lock_top_prefixes(v_all_bucket_ids, v_all_names);
        END IF;
    END;

    -- 3) Create destination prefixes (NEW−OLD) BEFORE pruning sources
    IF array_length(v_add_bucket_ids, 1) IS NOT NULL THEN
        WITH candidates AS (
            SELECT DISTINCT t.bucket_id, unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(v_add_bucket_ids, v_add_names) AS t(bucket_id, name)
            WHERE name <> ''
        )
        INSERT INTO storage.prefixes (bucket_id, name)
        SELECT c.bucket_id, c.name
        FROM candidates c
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4) Prune source prefixes bottom-up for OLD−NEW
    IF array_length(v_src_bucket_ids, 1) IS NOT NULL THEN
        -- re-entrancy guard so DELETE on prefixes won't recurse
        IF current_setting('storage.gc.prefixes', true) <> '1' THEN
            PERFORM set_config('storage.gc.prefixes', '1', true);
        END IF;

        PERFORM storage.delete_leaf_prefixes(v_src_bucket_ids, v_src_names);
    END IF;

    RETURN NULL;
END;
$$;


ALTER FUNCTION "storage"."objects_update_cleanup"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_update_level_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Set the new level
        NEW."level" := "storage"."get_level"(NEW."name");
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "storage"."objects_update_level_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_update_prefix_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION "storage"."objects_update_prefix_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."operation"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION "storage"."operation"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."prefixes_delete_cleanup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION "storage"."prefixes_delete_cleanup"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."prefixes_insert_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;


ALTER FUNCTION "storage"."prefixes_insert_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$$;


ALTER FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_legacy_v1"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION "storage"."search_legacy_v1"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_v1_optimised"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION "storage"."search_v1_optimised"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_v2"("prefix" "text", "bucket_name" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "start_after" "text" DEFAULT ''::"text", "sort_order" "text" DEFAULT 'asc'::"text", "sort_column" "text" DEFAULT 'name'::"text", "sort_column_after" "text" DEFAULT ''::"text") RETURNS TABLE("key" "text", "name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
DECLARE
    sort_col text;
    sort_ord text;
    cursor_op text;
    cursor_expr text;
    sort_expr text;
BEGIN
    -- Validate sort_order
    sort_ord := lower(sort_order);
    IF sort_ord NOT IN ('asc', 'desc') THEN
        sort_ord := 'asc';
    END IF;

    -- Determine cursor comparison operator
    IF sort_ord = 'asc' THEN
        cursor_op := '>';
    ELSE
        cursor_op := '<';
    END IF;
    
    sort_col := lower(sort_column);
    -- Validate sort column  
    IF sort_col IN ('updated_at', 'created_at') THEN
        cursor_expr := format(
            '($5 = '''' OR ROW(date_trunc(''milliseconds'', %I), name COLLATE "C") %s ROW(COALESCE(NULLIF($6, '''')::timestamptz, ''epoch''::timestamptz), $5))',
            sort_col, cursor_op
        );
        sort_expr := format(
            'COALESCE(date_trunc(''milliseconds'', %I), ''epoch''::timestamptz) %s, name COLLATE "C" %s',
            sort_col, sort_ord, sort_ord
        );
    ELSE
        cursor_expr := format('($5 = '''' OR name COLLATE "C" %s $5)', cursor_op);
        sort_expr := format('name COLLATE "C" %s', sort_ord);
    END IF;

    RETURN QUERY EXECUTE format(
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    NULL::uuid AS id,
                    updated_at,
                    created_at,
                    NULL::timestamptz AS last_accessed_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
            UNION ALL
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    id,
                    updated_at,
                    created_at,
                    last_accessed_at,
                    metadata
                FROM storage.objects
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
        ) obj
        ORDER BY %s
        LIMIT $3
        $sql$,
        cursor_expr,    -- prefixes WHERE
        sort_expr,      -- prefixes ORDER BY
        cursor_expr,    -- objects WHERE
        sort_expr,      -- objects ORDER BY
        sort_expr       -- final ORDER BY
    )
    USING prefix, bucket_name, limits, levels, start_after, sort_column_after;
END;
$_$;


ALTER FUNCTION "storage"."search_v2"("prefix" "text", "bucket_name" "text", "limits" integer, "levels" integer, "start_after" "text", "sort_order" "text", "sort_column" "text", "sort_column_after" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION "storage"."update_updated_at_column"() OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "auth"."audit_log_entries" (
    "instance_id" "uuid",
    "id" "uuid" NOT NULL,
    "payload" json,
    "created_at" timestamp with time zone,
    "ip_address" character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE "auth"."audit_log_entries" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."audit_log_entries" IS 'Auth: Audit trail for user actions.';



CREATE TABLE IF NOT EXISTS "auth"."flow_state" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid",
    "auth_code" "text" NOT NULL,
    "code_challenge_method" "auth"."code_challenge_method" NOT NULL,
    "code_challenge" "text" NOT NULL,
    "provider_type" "text" NOT NULL,
    "provider_access_token" "text",
    "provider_refresh_token" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "authentication_method" "text" NOT NULL,
    "auth_code_issued_at" timestamp with time zone
);


ALTER TABLE "auth"."flow_state" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."flow_state" IS 'stores metadata for pkce logins';



CREATE TABLE IF NOT EXISTS "auth"."identities" (
    "provider_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "identity_data" "jsonb" NOT NULL,
    "provider" "text" NOT NULL,
    "last_sign_in_at" timestamp with time zone,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "email" "text" GENERATED ALWAYS AS ("lower"(("identity_data" ->> 'email'::"text"))) STORED,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "auth"."identities" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."identities" IS 'Auth: Stores identities associated to a user.';



COMMENT ON COLUMN "auth"."identities"."email" IS 'Auth: Email is a generated column that references the optional email property in the identity_data';



CREATE TABLE IF NOT EXISTS "auth"."instances" (
    "id" "uuid" NOT NULL,
    "uuid" "uuid",
    "raw_base_config" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "auth"."instances" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."instances" IS 'Auth: Manages users across multiple sites.';



CREATE TABLE IF NOT EXISTS "auth"."mfa_amr_claims" (
    "session_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "authentication_method" "text" NOT NULL,
    "id" "uuid" NOT NULL
);


ALTER TABLE "auth"."mfa_amr_claims" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."mfa_amr_claims" IS 'auth: stores authenticator method reference claims for multi factor authentication';



CREATE TABLE IF NOT EXISTS "auth"."mfa_challenges" (
    "id" "uuid" NOT NULL,
    "factor_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "verified_at" timestamp with time zone,
    "ip_address" "inet" NOT NULL,
    "otp_code" "text",
    "web_authn_session_data" "jsonb"
);


ALTER TABLE "auth"."mfa_challenges" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."mfa_challenges" IS 'auth: stores metadata about challenge requests made';



CREATE TABLE IF NOT EXISTS "auth"."mfa_factors" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friendly_name" "text",
    "factor_type" "auth"."factor_type" NOT NULL,
    "status" "auth"."factor_status" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "secret" "text",
    "phone" "text",
    "last_challenged_at" timestamp with time zone,
    "web_authn_credential" "jsonb",
    "web_authn_aaguid" "uuid",
    "last_webauthn_challenge_data" "jsonb"
);


ALTER TABLE "auth"."mfa_factors" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."mfa_factors" IS 'auth: stores metadata about factors';



COMMENT ON COLUMN "auth"."mfa_factors"."last_webauthn_challenge_data" IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';



CREATE TABLE IF NOT EXISTS "auth"."oauth_authorizations" (
    "id" "uuid" NOT NULL,
    "authorization_id" "text" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "redirect_uri" "text" NOT NULL,
    "scope" "text" NOT NULL,
    "state" "text",
    "resource" "text",
    "code_challenge" "text",
    "code_challenge_method" "auth"."code_challenge_method",
    "response_type" "auth"."oauth_response_type" DEFAULT 'code'::"auth"."oauth_response_type" NOT NULL,
    "status" "auth"."oauth_authorization_status" DEFAULT 'pending'::"auth"."oauth_authorization_status" NOT NULL,
    "authorization_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:03:00'::interval) NOT NULL,
    "approved_at" timestamp with time zone,
    CONSTRAINT "oauth_authorizations_authorization_code_length" CHECK (("char_length"("authorization_code") <= 255)),
    CONSTRAINT "oauth_authorizations_code_challenge_length" CHECK (("char_length"("code_challenge") <= 128)),
    CONSTRAINT "oauth_authorizations_expires_at_future" CHECK (("expires_at" > "created_at")),
    CONSTRAINT "oauth_authorizations_redirect_uri_length" CHECK (("char_length"("redirect_uri") <= 2048)),
    CONSTRAINT "oauth_authorizations_resource_length" CHECK (("char_length"("resource") <= 2048)),
    CONSTRAINT "oauth_authorizations_scope_length" CHECK (("char_length"("scope") <= 4096)),
    CONSTRAINT "oauth_authorizations_state_length" CHECK (("char_length"("state") <= 4096))
);


ALTER TABLE "auth"."oauth_authorizations" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."oauth_clients" (
    "id" "uuid" NOT NULL,
    "client_secret_hash" "text",
    "registration_type" "auth"."oauth_registration_type" NOT NULL,
    "redirect_uris" "text" NOT NULL,
    "grant_types" "text" NOT NULL,
    "client_name" "text",
    "client_uri" "text",
    "logo_uri" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "client_type" "auth"."oauth_client_type" DEFAULT 'confidential'::"auth"."oauth_client_type" NOT NULL,
    CONSTRAINT "oauth_clients_client_name_length" CHECK (("char_length"("client_name") <= 1024)),
    CONSTRAINT "oauth_clients_client_uri_length" CHECK (("char_length"("client_uri") <= 2048)),
    CONSTRAINT "oauth_clients_logo_uri_length" CHECK (("char_length"("logo_uri") <= 2048))
);


ALTER TABLE "auth"."oauth_clients" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."oauth_consents" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "scopes" "text" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone,
    CONSTRAINT "oauth_consents_revoked_after_granted" CHECK ((("revoked_at" IS NULL) OR ("revoked_at" >= "granted_at"))),
    CONSTRAINT "oauth_consents_scopes_length" CHECK (("char_length"("scopes") <= 2048)),
    CONSTRAINT "oauth_consents_scopes_not_empty" CHECK (("char_length"(TRIM(BOTH FROM "scopes")) > 0))
);


ALTER TABLE "auth"."oauth_consents" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."one_time_tokens" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token_type" "auth"."one_time_token_type" NOT NULL,
    "token_hash" "text" NOT NULL,
    "relates_to" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "one_time_tokens_token_hash_check" CHECK (("char_length"("token_hash") > 0))
);


ALTER TABLE "auth"."one_time_tokens" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."refresh_tokens" (
    "instance_id" "uuid",
    "id" bigint NOT NULL,
    "token" character varying(255),
    "user_id" character varying(255),
    "revoked" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "parent" character varying(255),
    "session_id" "uuid"
);


ALTER TABLE "auth"."refresh_tokens" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."refresh_tokens" IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';



CREATE SEQUENCE IF NOT EXISTS "auth"."refresh_tokens_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "auth"."refresh_tokens_id_seq" OWNER TO "supabase_auth_admin";


ALTER SEQUENCE "auth"."refresh_tokens_id_seq" OWNED BY "auth"."refresh_tokens"."id";



CREATE TABLE IF NOT EXISTS "auth"."saml_providers" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "entity_id" "text" NOT NULL,
    "metadata_xml" "text" NOT NULL,
    "metadata_url" "text",
    "attribute_mapping" "jsonb",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "name_id_format" "text",
    CONSTRAINT "entity_id not empty" CHECK (("char_length"("entity_id") > 0)),
    CONSTRAINT "metadata_url not empty" CHECK ((("metadata_url" = NULL::"text") OR ("char_length"("metadata_url") > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK (("char_length"("metadata_xml") > 0))
);


ALTER TABLE "auth"."saml_providers" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."saml_providers" IS 'Auth: Manages SAML Identity Provider connections.';



CREATE TABLE IF NOT EXISTS "auth"."saml_relay_states" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "request_id" "text" NOT NULL,
    "for_email" "text",
    "redirect_to" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "flow_state_id" "uuid",
    CONSTRAINT "request_id not empty" CHECK (("char_length"("request_id") > 0))
);


ALTER TABLE "auth"."saml_relay_states" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."saml_relay_states" IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';



CREATE TABLE IF NOT EXISTS "auth"."schema_migrations" (
    "version" character varying(255) NOT NULL
);


ALTER TABLE "auth"."schema_migrations" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."schema_migrations" IS 'Auth: Manages updates to the auth system.';



CREATE TABLE IF NOT EXISTS "auth"."sessions" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "factor_id" "uuid",
    "aal" "auth"."aal_level",
    "not_after" timestamp with time zone,
    "refreshed_at" timestamp without time zone,
    "user_agent" "text",
    "ip" "inet",
    "tag" "text",
    "oauth_client_id" "uuid",
    "refresh_token_hmac_key" "text",
    "refresh_token_counter" bigint
);


ALTER TABLE "auth"."sessions" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."sessions" IS 'Auth: Stores session data associated to a user.';



COMMENT ON COLUMN "auth"."sessions"."not_after" IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';



COMMENT ON COLUMN "auth"."sessions"."refresh_token_hmac_key" IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';



COMMENT ON COLUMN "auth"."sessions"."refresh_token_counter" IS 'Holds the ID (counter) of the last issued refresh token.';



CREATE TABLE IF NOT EXISTS "auth"."sso_domains" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "domain" "text" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK (("char_length"("domain") > 0))
);


ALTER TABLE "auth"."sso_domains" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."sso_domains" IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';



CREATE TABLE IF NOT EXISTS "auth"."sso_providers" (
    "id" "uuid" NOT NULL,
    "resource_id" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "disabled" boolean,
    CONSTRAINT "resource_id not empty" CHECK ((("resource_id" = NULL::"text") OR ("char_length"("resource_id") > 0)))
);


ALTER TABLE "auth"."sso_providers" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."sso_providers" IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';



COMMENT ON COLUMN "auth"."sso_providers"."resource_id" IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';



CREATE TABLE IF NOT EXISTS "auth"."users" (
    "instance_id" "uuid",
    "id" "uuid" NOT NULL,
    "aud" character varying(255),
    "role" character varying(255),
    "email" character varying(255),
    "encrypted_password" character varying(255),
    "email_confirmed_at" timestamp with time zone,
    "invited_at" timestamp with time zone,
    "confirmation_token" character varying(255),
    "confirmation_sent_at" timestamp with time zone,
    "recovery_token" character varying(255),
    "recovery_sent_at" timestamp with time zone,
    "email_change_token_new" character varying(255),
    "email_change" character varying(255),
    "email_change_sent_at" timestamp with time zone,
    "last_sign_in_at" timestamp with time zone,
    "raw_app_meta_data" "jsonb",
    "raw_user_meta_data" "jsonb",
    "is_super_admin" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "phone" "text" DEFAULT NULL::character varying,
    "phone_confirmed_at" timestamp with time zone,
    "phone_change" "text" DEFAULT ''::character varying,
    "phone_change_token" character varying(255) DEFAULT ''::character varying,
    "phone_change_sent_at" timestamp with time zone,
    "confirmed_at" timestamp with time zone GENERATED ALWAYS AS (LEAST("email_confirmed_at", "phone_confirmed_at")) STORED,
    "email_change_token_current" character varying(255) DEFAULT ''::character varying,
    "email_change_confirm_status" smallint DEFAULT 0,
    "banned_until" timestamp with time zone,
    "reauthentication_token" character varying(255) DEFAULT ''::character varying,
    "reauthentication_sent_at" timestamp with time zone,
    "is_sso_user" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    "is_anonymous" boolean DEFAULT false NOT NULL,
    CONSTRAINT "users_email_change_confirm_status_check" CHECK ((("email_change_confirm_status" >= 0) AND ("email_change_confirm_status" <= 2)))
);


ALTER TABLE "auth"."users" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."users" IS 'Auth: Stores user login data within a secure schema.';



COMMENT ON COLUMN "auth"."users"."is_sso_user" IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';



CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."baits" (
    "slug" "text" NOT NULL,
    "label" "text" NOT NULL,
    "category" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."baits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catch_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "catch_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "parent_comment_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."catch_comments" OWNER TO "postgres";


COMMENT ON COLUMN "public"."catch_comments"."deleted_at" IS 'Soft-delete for comments; will be tombstoned on account deletion (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';



CREATE TABLE IF NOT EXISTS "public"."catches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_id" "uuid",
    "location" "text",
    "location_label" "text",
    "title" "text" NOT NULL,
    "description" "text",
    "species" "text",
    "species_slug" "text",
    "weight" numeric,
    "weight_unit" "public"."weight_unit",
    "length" numeric,
    "length_unit" "public"."length_unit",
    "time_of_day" "text",
    "peg_or_swim" "text",
    "conditions" "jsonb",
    "water_type" "text",
    "water_type_code" "text",
    "hide_exact_spot" boolean DEFAULT false NOT NULL,
    "bait_used" "text",
    "method" "text",
    "method_tag" "text",
    "equipment_used" "text",
    "image_url" "text" NOT NULL,
    "gallery_photos" "text"[],
    "video_url" "text",
    "visibility" "public"."visibility_type" DEFAULT 'public'::"public"."visibility_type" NOT NULL,
    "allow_ratings" boolean DEFAULT true NOT NULL,
    "tags" "text"[],
    "caught_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "custom_species" "text",
    "venue_id" "uuid",
    CONSTRAINT "chk_catches_length_positive" CHECK ((("length" IS NULL) OR ("length" > (0)::numeric))),
    CONSTRAINT "chk_catches_weight_positive" CHECK ((("weight" IS NULL) OR ("weight" > (0)::numeric)))
);


ALTER TABLE "public"."catches" OWNER TO "postgres";


COMMENT ON COLUMN "public"."catches"."deleted_at" IS 'Soft-delete for catches; used when accounts are deleted (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';



COMMENT ON COLUMN "public"."catches"."venue_id" IS 'Structured venue link; free-text location remains as fallback (see docs/VENUE-PAGES-DESIGN.md).';



CREATE OR REPLACE VIEW "public"."catch_comments_with_admin" AS
 SELECT "cc"."id",
    "cc"."catch_id",
    "cc"."user_id",
    "cc"."body",
    "cc"."created_at",
    "cc"."deleted_at",
    "cc"."parent_comment_id",
    "cc"."updated_at",
    "public"."is_admin"("cc"."user_id") AS "is_admin_author"
   FROM ("public"."catch_comments" "cc"
     JOIN "public"."catches" "c" ON (("c"."id" = "cc"."catch_id")))
  WHERE ("public"."is_admin"("auth"."uid"()) OR ((NOT "public"."is_blocked_either_way"("auth"."uid"(), "cc"."user_id")) AND (NOT "public"."is_blocked_either_way"("auth"."uid"(), "c"."user_id"))));


ALTER VIEW "public"."catch_comments_with_admin" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text" NOT NULL,
    "full_name" "text",
    "bio" "text",
    "avatar_path" "text",
    "avatar_url" "text",
    "location" "text",
    "website" "text",
    "status" "text",
    "warn_count" integer DEFAULT 0 NOT NULL,
    "moderation_status" "text" DEFAULT 'normal'::"text" NOT NULL,
    "suspension_until" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "locked_for_deletion" boolean DEFAULT false NOT NULL,
    "is_private" boolean DEFAULT false NOT NULL,
    CONSTRAINT "chk_profiles_username_length" CHECK ((("char_length"("username") >= 3) AND ("char_length"("username") <= 30)))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."deleted_at" IS 'Account deletion prep: soft-delete timestamp (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';



COMMENT ON COLUMN "public"."profiles"."is_deleted" IS 'Account deletion prep flag to exclude deleted users (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';



COMMENT ON COLUMN "public"."profiles"."locked_for_deletion" IS 'Prevents new activity while deletion runs (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';



COMMENT ON COLUMN "public"."profiles"."is_private" IS 'Profile privacy flag (private vs public) — see docs/FEATURE-ROADMAP.md Phase 2.2.';



CREATE OR REPLACE VIEW "public"."catch_mention_candidates" AS
 WITH "owner" AS (
         SELECT "c"."id" AS "catch_id",
            "p"."id" AS "user_id",
            "p"."username",
            "p"."avatar_path",
            "p"."avatar_url",
            "c"."created_at" AS "last_interacted_at"
           FROM ("public"."catches" "c"
             JOIN "public"."profiles" "p" ON (("p"."id" = "c"."user_id")))
        ), "commenters" AS (
         SELECT "cc"."catch_id",
            "p"."id" AS "user_id",
            "p"."username",
            "p"."avatar_path",
            "p"."avatar_url",
            "cc"."created_at" AS "last_interacted_at"
           FROM ("public"."catch_comments" "cc"
             JOIN "public"."profiles" "p" ON (("p"."id" = "cc"."user_id")))
        )
 SELECT "catch_id",
    "user_id",
    "username",
    "avatar_path",
    "avatar_url",
    "max"("last_interacted_at") AS "last_interacted_at"
   FROM ( SELECT "owner"."catch_id",
            "owner"."user_id",
            "owner"."username",
            "owner"."avatar_path",
            "owner"."avatar_url",
            "owner"."last_interacted_at"
           FROM "owner"
        UNION ALL
         SELECT "commenters"."catch_id",
            "commenters"."user_id",
            "commenters"."username",
            "commenters"."avatar_path",
            "commenters"."avatar_url",
            "commenters"."last_interacted_at"
           FROM "commenters") "combined"
  GROUP BY "catch_id", "user_id", "username", "avatar_path", "avatar_url";


ALTER VIEW "public"."catch_mention_candidates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catch_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "catch_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reaction" "text" DEFAULT 'like'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."catch_reactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."catch_reactions" IS 'Account deletion may delete or anonymise user_id rows in a later migration (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';



CREATE TABLE IF NOT EXISTS "public"."ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "catch_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ratings_rating_between_1_10" CHECK ((("rating" >= 1) AND ("rating" <= 10)))
);


ALTER TABLE "public"."ratings" OWNER TO "postgres";


COMMENT ON TABLE "public"."ratings" IS 'Account deletion may delete or anonymise user_id rows in a later migration (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';



CREATE OR REPLACE VIEW "public"."leaderboard_scores_detailed" AS
 SELECT "c"."id",
    "c"."user_id",
    "p"."username" AS "owner_username",
    "c"."title",
    COALESCE("c"."species_slug", "c"."species") AS "species_slug",
    "c"."species",
    "c"."weight",
    "c"."weight_unit",
    "c"."length",
    "c"."length_unit",
    "c"."image_url",
    COALESCE("avg"("r"."rating"), (0)::numeric) AS "avg_rating",
    ("count"("r"."id"))::integer AS "rating_count",
    ((COALESCE("avg"("r"."rating"), (0)::numeric) * (10)::numeric) + COALESCE("c"."weight", (0)::numeric)) AS "total_score",
    "c"."created_at",
    COALESCE("c"."location_label", "c"."location") AS "location_label",
    "c"."location",
    COALESCE("c"."method_tag", "c"."method") AS "method_tag",
    "c"."method",
    "c"."water_type_code",
    "c"."description",
    "c"."gallery_photos",
    "c"."tags",
    "c"."video_url",
    "c"."conditions",
    "c"."caught_at",
        CASE
            WHEN "public"."is_admin"("auth"."uid"()) THEN false
            WHEN ("auth"."uid"() IS NULL) THEN false
            ELSE "public"."is_blocked_either_way"("c"."user_id", "auth"."uid"())
        END AS "is_blocked_from_viewer"
   FROM (("public"."catches" "c"
     LEFT JOIN "public"."profiles" "p" ON (("p"."id" = "c"."user_id")))
     LEFT JOIN "public"."ratings" "r" ON (("r"."catch_id" = "c"."id")))
  WHERE (("c"."deleted_at" IS NULL) AND ("c"."visibility" = 'public'::"public"."visibility_type"))
  GROUP BY "c"."id", "c"."user_id", "p"."username", "c"."title", "c"."species_slug", "c"."species", "c"."weight", "c"."weight_unit", "c"."length", "c"."length_unit", "c"."image_url", "c"."created_at", "c"."location_label", "c"."location", "c"."method_tag", "c"."method", "c"."water_type_code", "c"."description", "c"."gallery_photos", "c"."tags", "c"."video_url", "c"."conditions", "c"."caught_at";


ALTER VIEW "public"."leaderboard_scores_detailed" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moderation_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "action" "text" NOT NULL,
    "target_type" "text",
    "target_id" "uuid",
    "user_id" "uuid",
    "catch_id" "uuid",
    "comment_id" "uuid",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "admin_id" "uuid"
);


ALTER TABLE "public"."moderation_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."moderation_log" IS 'Preserve for audit even if account is deleted (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "actor_id" "uuid",
    "type" "text" NOT NULL,
    "message" "text" NOT NULL,
    "catch_id" "uuid",
    "comment_id" "uuid",
    "extra_data" "jsonb",
    "is_read" boolean DEFAULT false NOT NULL,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'Rows for deleted users may be cleared; other users’ rows remain (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';



CREATE TABLE IF NOT EXISTS "public"."profile_blocks" (
    "blocker_id" "uuid" NOT NULL,
    "blocked_id" "uuid" NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."profile_blocks" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_blocks" OWNER TO "postgres";


COMMENT ON TABLE "public"."profile_blocks" IS 'Hard block list between profiles (see docs/BLOCK-MUTE-DESIGN.md).';



COMMENT ON COLUMN "public"."profile_blocks"."blocker_id" IS 'Profile initiating the block (see docs/BLOCK-MUTE-DESIGN.md).';



COMMENT ON COLUMN "public"."profile_blocks"."blocked_id" IS 'Profile being blocked (see docs/BLOCK-MUTE-DESIGN.md).';



COMMENT ON COLUMN "public"."profile_blocks"."reason" IS 'Optional internal note for the block (see docs/BLOCK-MUTE-DESIGN.md).';



COMMENT ON COLUMN "public"."profile_blocks"."created_at" IS 'Timestamp when the block was created (see docs/BLOCK-MUTE-DESIGN.md).';



CREATE TABLE IF NOT EXISTS "public"."profile_follows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_no_self_follow" CHECK (("follower_id" <> "following_id"))
);


ALTER TABLE "public"."profile_follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rate_limits" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rate_limits" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."rate_limits_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."rate_limits_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."rate_limits_id_seq" OWNED BY "public"."rate_limits"."id";



CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "date" "date" NOT NULL,
    "venue" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "venue_name_manual" "text"
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "slug" "text" NOT NULL,
    "label" "text" NOT NULL,
    "category" "text" NOT NULL,
    "method_group" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_warnings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "admin_id" "uuid",
    "reason" "text" NOT NULL,
    "severity" "text" NOT NULL,
    "duration_hours" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "details" "text",
    "issued_by" "uuid"
);


ALTER TABLE "public"."user_warnings" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_warnings" IS 'Preserve for audit even if account is deleted (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';



CREATE TABLE IF NOT EXISTS "public"."venue_owners" (
    "venue_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'owner'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."venue_owners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venue_ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rating" smallint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "venue_ratings_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."venue_ratings" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."venue_stats" AS
 WITH "published_venues" AS (
         SELECT "venues"."id"
           FROM "public"."venues"
          WHERE ("venues"."is_published" = true)
        ), "base" AS (
         SELECT "c"."venue_id",
            ("count"(*))::integer AS "total_catches",
            ("count"(*) FILTER (WHERE ("c"."created_at" >= ("now"() - '30 days'::interval))))::integer AS "recent_catches_30d",
            "max"("c"."weight") FILTER (WHERE ("c"."weight" IS NOT NULL)) AS "headline_pb_weight",
            ( SELECT "c2"."weight_unit"
                   FROM "public"."catches" "c2"
                  WHERE (("c2"."venue_id" = "c"."venue_id") AND ("c2"."deleted_at" IS NULL) AND ("c2"."visibility" = 'public'::"public"."visibility_type") AND ("c2"."weight" IS NOT NULL))
                  ORDER BY "c2"."weight" DESC NULLS LAST, "c2"."created_at" DESC
                 LIMIT 1) AS "headline_pb_unit",
            ( SELECT "c3"."species"
                   FROM "public"."catches" "c3"
                  WHERE (("c3"."venue_id" = "c"."venue_id") AND ("c3"."deleted_at" IS NULL) AND ("c3"."visibility" = 'public'::"public"."visibility_type") AND ("c3"."weight" IS NOT NULL))
                  ORDER BY "c3"."weight" DESC NULLS LAST, "c3"."created_at" DESC
                 LIMIT 1) AS "headline_pb_species"
           FROM "public"."catches" "c"
          WHERE (("c"."venue_id" IS NOT NULL) AND ("c"."deleted_at" IS NULL) AND ("c"."visibility" = 'public'::"public"."visibility_type") AND (EXISTS ( SELECT 1
                   FROM "published_venues" "pv"
                  WHERE ("pv"."id" = "c"."venue_id"))))
          GROUP BY "c"."venue_id"
        ), "species" AS (
         SELECT "c"."venue_id",
            ARRAY( SELECT "s_1"."species"
                   FROM ( SELECT "c2"."species",
                            "count"(*) AS "species_count"
                           FROM "public"."catches" "c2"
                          WHERE (("c2"."venue_id" = "c"."venue_id") AND ("c2"."deleted_at" IS NULL) AND ("c2"."visibility" = 'public'::"public"."visibility_type") AND ("c2"."venue_id" IS NOT NULL) AND ("c2"."species" IS NOT NULL) AND (EXISTS ( SELECT 1
                                   FROM "published_venues" "pv"
                                  WHERE ("pv"."id" = "c2"."venue_id"))))
                          GROUP BY "c2"."species"
                          ORDER BY ("count"(*)) DESC, "c2"."species"
                         LIMIT 3) "s_1") AS "top_species"
           FROM "public"."catches" "c"
          WHERE (("c"."venue_id" IS NOT NULL) AND ("c"."deleted_at" IS NULL) AND ("c"."visibility" = 'public'::"public"."visibility_type") AND (EXISTS ( SELECT 1
                   FROM "published_venues" "pv"
                  WHERE ("pv"."id" = "c"."venue_id"))))
          GROUP BY "c"."venue_id"
        ), "ratings" AS (
         SELECT "vr"."venue_id",
            ("avg"("vr"."rating"))::numeric(3,2) AS "avg_rating",
            ("count"(*))::integer AS "rating_count"
           FROM "public"."venue_ratings" "vr"
          WHERE (EXISTS ( SELECT 1
                   FROM "published_venues" "pv"
                  WHERE ("pv"."id" = "vr"."venue_id")))
          GROUP BY "vr"."venue_id"
        )
 SELECT "b"."venue_id",
    "b"."total_catches",
    "b"."recent_catches_30d",
    "b"."headline_pb_weight",
    "b"."headline_pb_unit",
    "b"."headline_pb_species",
    COALESCE("s"."top_species", ARRAY[]::"text"[]) AS "top_species",
    "r"."avg_rating",
    "r"."rating_count"
   FROM (("base" "b"
     LEFT JOIN "species" "s" ON (("s"."venue_id" = "b"."venue_id")))
     LEFT JOIN "ratings" "r" ON (("r"."venue_id" = "b"."venue_id")));


ALTER VIEW "public"."venue_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."water_types" (
    "code" "text" NOT NULL,
    "label" "text" NOT NULL,
    "group_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."water_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "storage"."buckets" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "public" boolean DEFAULT false,
    "avif_autodetection" boolean DEFAULT false,
    "file_size_limit" bigint,
    "allowed_mime_types" "text"[],
    "owner_id" "text",
    "type" "storage"."buckettype" DEFAULT 'STANDARD'::"storage"."buckettype" NOT NULL
);


ALTER TABLE "storage"."buckets" OWNER TO "supabase_storage_admin";


COMMENT ON COLUMN "storage"."buckets"."owner" IS 'Field is deprecated, use owner_id instead';



CREATE TABLE IF NOT EXISTS "storage"."buckets_analytics" (
    "name" "text" NOT NULL,
    "type" "storage"."buckettype" DEFAULT 'ANALYTICS'::"storage"."buckettype" NOT NULL,
    "format" "text" DEFAULT 'ICEBERG'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "storage"."buckets_analytics" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."buckets_vectors" (
    "id" "text" NOT NULL,
    "type" "storage"."buckettype" DEFAULT 'VECTOR'::"storage"."buckettype" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."buckets_vectors" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."iceberg_namespaces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket_name" "text" NOT NULL,
    "name" "text" NOT NULL COLLATE "pg_catalog"."C",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "catalog_id" "uuid" NOT NULL
);


ALTER TABLE "storage"."iceberg_namespaces" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."iceberg_tables" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "namespace_id" "uuid" NOT NULL,
    "bucket_name" "text" NOT NULL,
    "name" "text" NOT NULL COLLATE "pg_catalog"."C",
    "location" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "remote_table_id" "text",
    "shard_key" "text",
    "shard_id" "text",
    "catalog_id" "uuid" NOT NULL
);


ALTER TABLE "storage"."iceberg_tables" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."migrations" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "hash" character varying(40) NOT NULL,
    "executed_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "storage"."migrations" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."objects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket_id" "text",
    "name" "text",
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_accessed_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb",
    "path_tokens" "text"[] GENERATED ALWAYS AS ("string_to_array"("name", '/'::"text")) STORED,
    "version" "text",
    "owner_id" "text",
    "user_metadata" "jsonb",
    "level" integer
);


ALTER TABLE "storage"."objects" OWNER TO "supabase_storage_admin";


COMMENT ON COLUMN "storage"."objects"."owner" IS 'Field is deprecated, use owner_id instead';



CREATE TABLE IF NOT EXISTS "storage"."prefixes" (
    "bucket_id" "text" NOT NULL,
    "name" "text" NOT NULL COLLATE "pg_catalog"."C",
    "level" integer GENERATED ALWAYS AS ("storage"."get_level"("name")) STORED NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "storage"."prefixes" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."s3_multipart_uploads" (
    "id" "text" NOT NULL,
    "in_progress_size" bigint DEFAULT 0 NOT NULL,
    "upload_signature" "text" NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "version" "text" NOT NULL,
    "owner_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_metadata" "jsonb"
);


ALTER TABLE "storage"."s3_multipart_uploads" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."s3_multipart_uploads_parts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "upload_id" "text" NOT NULL,
    "size" bigint DEFAULT 0 NOT NULL,
    "part_number" integer NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "etag" "text" NOT NULL,
    "owner_id" "text",
    "version" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."s3_multipart_uploads_parts" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."vector_indexes" (
    "id" "text" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL COLLATE "pg_catalog"."C",
    "bucket_id" "text" NOT NULL,
    "data_type" "text" NOT NULL,
    "dimension" integer NOT NULL,
    "distance_metric" "text" NOT NULL,
    "metadata_configuration" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."vector_indexes" OWNER TO "supabase_storage_admin";


ALTER TABLE ONLY "auth"."refresh_tokens" ALTER COLUMN "id" SET DEFAULT "nextval"('"auth"."refresh_tokens_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."rate_limits" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."rate_limits_id_seq"'::"regclass");



ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "amr_id_pk" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."audit_log_entries"
    ADD CONSTRAINT "audit_log_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."flow_state"
    ADD CONSTRAINT "flow_state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_provider_id_provider_unique" UNIQUE ("provider_id", "provider");



ALTER TABLE ONLY "auth"."instances"
    ADD CONSTRAINT "instances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "mfa_amr_claims_session_id_authentication_method_pkey" UNIQUE ("session_id", "authentication_method");



ALTER TABLE ONLY "auth"."mfa_challenges"
    ADD CONSTRAINT "mfa_challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_last_challenged_at_key" UNIQUE ("last_challenged_at");



ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_authorization_code_key" UNIQUE ("authorization_code");



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_authorization_id_key" UNIQUE ("authorization_id");



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_clients"
    ADD CONSTRAINT "oauth_clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_user_client_unique" UNIQUE ("user_id", "client_id");



ALTER TABLE ONLY "auth"."one_time_tokens"
    ADD CONSTRAINT "one_time_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_token_unique" UNIQUE ("token");



ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_entity_id_key" UNIQUE ("entity_id");



ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");



ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."sso_domains"
    ADD CONSTRAINT "sso_domains_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."sso_providers"
    ADD CONSTRAINT "sso_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."users"
    ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "auth"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."baits"
    ADD CONSTRAINT "baits_pkey" PRIMARY KEY ("slug");



ALTER TABLE ONLY "public"."catch_comments"
    ADD CONSTRAINT "catch_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catch_reactions"
    ADD CONSTRAINT "catch_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catches"
    ADD CONSTRAINT "catches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moderation_log"
    ADD CONSTRAINT "moderation_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile_blocks"
    ADD CONSTRAINT "profile_blocks_pkey" PRIMARY KEY ("blocker_id", "blocked_id");



ALTER TABLE ONLY "public"."profile_follows"
    ADD CONSTRAINT "profile_follows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."rate_limits"
    ADD CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("slug");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "uq_notifications_like_follow_once" UNIQUE ("user_id", "actor_id", "type", "catch_id", "comment_id");



ALTER TABLE ONLY "public"."user_warnings"
    ADD CONSTRAINT "user_warnings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venue_events"
    ADD CONSTRAINT "venue_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venue_owners"
    ADD CONSTRAINT "venue_owners_pkey" PRIMARY KEY ("venue_id", "user_id");



ALTER TABLE ONLY "public"."venue_photos"
    ADD CONSTRAINT "venue_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venue_ratings"
    ADD CONSTRAINT "venue_ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venue_ratings"
    ADD CONSTRAINT "venue_ratings_venue_id_user_id_key" UNIQUE ("venue_id", "user_id");



ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."water_types"
    ADD CONSTRAINT "water_types_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "storage"."buckets_analytics"
    ADD CONSTRAINT "buckets_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."buckets"
    ADD CONSTRAINT "buckets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."buckets_vectors"
    ADD CONSTRAINT "buckets_vectors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."iceberg_namespaces"
    ADD CONSTRAINT "iceberg_namespaces_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."iceberg_tables"
    ADD CONSTRAINT "iceberg_tables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_name_key" UNIQUE ("name");



ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."prefixes"
    ADD CONSTRAINT "prefixes_pkey" PRIMARY KEY ("bucket_id", "level", "name");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."vector_indexes"
    ADD CONSTRAINT "vector_indexes_pkey" PRIMARY KEY ("id");



CREATE INDEX "audit_logs_instance_id_idx" ON "auth"."audit_log_entries" USING "btree" ("instance_id");



CREATE UNIQUE INDEX "confirmation_token_idx" ON "auth"."users" USING "btree" ("confirmation_token") WHERE (("confirmation_token")::"text" !~ '^[0-9 ]*$'::"text");



CREATE UNIQUE INDEX "email_change_token_current_idx" ON "auth"."users" USING "btree" ("email_change_token_current") WHERE (("email_change_token_current")::"text" !~ '^[0-9 ]*$'::"text");



CREATE UNIQUE INDEX "email_change_token_new_idx" ON "auth"."users" USING "btree" ("email_change_token_new") WHERE (("email_change_token_new")::"text" !~ '^[0-9 ]*$'::"text");



CREATE INDEX "factor_id_created_at_idx" ON "auth"."mfa_factors" USING "btree" ("user_id", "created_at");



CREATE INDEX "flow_state_created_at_idx" ON "auth"."flow_state" USING "btree" ("created_at" DESC);



CREATE INDEX "identities_email_idx" ON "auth"."identities" USING "btree" ("email" "text_pattern_ops");



COMMENT ON INDEX "auth"."identities_email_idx" IS 'Auth: Ensures indexed queries on the email column';



CREATE INDEX "identities_user_id_idx" ON "auth"."identities" USING "btree" ("user_id");



CREATE INDEX "idx_auth_code" ON "auth"."flow_state" USING "btree" ("auth_code");



CREATE INDEX "idx_user_id_auth_method" ON "auth"."flow_state" USING "btree" ("user_id", "authentication_method");



CREATE INDEX "mfa_challenge_created_at_idx" ON "auth"."mfa_challenges" USING "btree" ("created_at" DESC);



CREATE UNIQUE INDEX "mfa_factors_user_friendly_name_unique" ON "auth"."mfa_factors" USING "btree" ("friendly_name", "user_id") WHERE (TRIM(BOTH FROM "friendly_name") <> ''::"text");



CREATE INDEX "mfa_factors_user_id_idx" ON "auth"."mfa_factors" USING "btree" ("user_id");



CREATE INDEX "oauth_auth_pending_exp_idx" ON "auth"."oauth_authorizations" USING "btree" ("expires_at") WHERE ("status" = 'pending'::"auth"."oauth_authorization_status");



CREATE INDEX "oauth_clients_deleted_at_idx" ON "auth"."oauth_clients" USING "btree" ("deleted_at");



CREATE INDEX "oauth_consents_active_client_idx" ON "auth"."oauth_consents" USING "btree" ("client_id") WHERE ("revoked_at" IS NULL);



CREATE INDEX "oauth_consents_active_user_client_idx" ON "auth"."oauth_consents" USING "btree" ("user_id", "client_id") WHERE ("revoked_at" IS NULL);



CREATE INDEX "oauth_consents_user_order_idx" ON "auth"."oauth_consents" USING "btree" ("user_id", "granted_at" DESC);



CREATE INDEX "one_time_tokens_relates_to_hash_idx" ON "auth"."one_time_tokens" USING "hash" ("relates_to");



CREATE INDEX "one_time_tokens_token_hash_hash_idx" ON "auth"."one_time_tokens" USING "hash" ("token_hash");



CREATE UNIQUE INDEX "one_time_tokens_user_id_token_type_key" ON "auth"."one_time_tokens" USING "btree" ("user_id", "token_type");



CREATE UNIQUE INDEX "reauthentication_token_idx" ON "auth"."users" USING "btree" ("reauthentication_token") WHERE (("reauthentication_token")::"text" !~ '^[0-9 ]*$'::"text");



CREATE UNIQUE INDEX "recovery_token_idx" ON "auth"."users" USING "btree" ("recovery_token") WHERE (("recovery_token")::"text" !~ '^[0-9 ]*$'::"text");



CREATE INDEX "refresh_tokens_instance_id_idx" ON "auth"."refresh_tokens" USING "btree" ("instance_id");



CREATE INDEX "refresh_tokens_instance_id_user_id_idx" ON "auth"."refresh_tokens" USING "btree" ("instance_id", "user_id");



CREATE INDEX "refresh_tokens_parent_idx" ON "auth"."refresh_tokens" USING "btree" ("parent");



CREATE INDEX "refresh_tokens_session_id_revoked_idx" ON "auth"."refresh_tokens" USING "btree" ("session_id", "revoked");



CREATE INDEX "refresh_tokens_updated_at_idx" ON "auth"."refresh_tokens" USING "btree" ("updated_at" DESC);



CREATE INDEX "saml_providers_sso_provider_id_idx" ON "auth"."saml_providers" USING "btree" ("sso_provider_id");



CREATE INDEX "saml_relay_states_created_at_idx" ON "auth"."saml_relay_states" USING "btree" ("created_at" DESC);



CREATE INDEX "saml_relay_states_for_email_idx" ON "auth"."saml_relay_states" USING "btree" ("for_email");



CREATE INDEX "saml_relay_states_sso_provider_id_idx" ON "auth"."saml_relay_states" USING "btree" ("sso_provider_id");



CREATE INDEX "sessions_not_after_idx" ON "auth"."sessions" USING "btree" ("not_after" DESC);



CREATE INDEX "sessions_oauth_client_id_idx" ON "auth"."sessions" USING "btree" ("oauth_client_id");



CREATE INDEX "sessions_user_id_idx" ON "auth"."sessions" USING "btree" ("user_id");



CREATE UNIQUE INDEX "sso_domains_domain_idx" ON "auth"."sso_domains" USING "btree" ("lower"("domain"));



CREATE INDEX "sso_domains_sso_provider_id_idx" ON "auth"."sso_domains" USING "btree" ("sso_provider_id");



CREATE UNIQUE INDEX "sso_providers_resource_id_idx" ON "auth"."sso_providers" USING "btree" ("lower"("resource_id"));



CREATE INDEX "sso_providers_resource_id_pattern_idx" ON "auth"."sso_providers" USING "btree" ("resource_id" "text_pattern_ops");



CREATE UNIQUE INDEX "unique_phone_factor_per_user" ON "auth"."mfa_factors" USING "btree" ("user_id", "phone");



CREATE INDEX "user_id_created_at_idx" ON "auth"."sessions" USING "btree" ("user_id", "created_at");



CREATE UNIQUE INDEX "users_email_partial_key" ON "auth"."users" USING "btree" ("email") WHERE ("is_sso_user" = false);



COMMENT ON INDEX "auth"."users_email_partial_key" IS 'Auth: A partial unique index that applies only when is_sso_user is false';



CREATE INDEX "users_instance_id_email_idx" ON "auth"."users" USING "btree" ("instance_id", "lower"(("email")::"text"));



CREATE INDEX "users_instance_id_idx" ON "auth"."users" USING "btree" ("instance_id");



CREATE INDEX "users_is_anonymous_idx" ON "auth"."users" USING "btree" ("is_anonymous");



CREATE INDEX "idx_catch_comments_catch_id" ON "public"."catch_comments" USING "btree" ("catch_id");



CREATE INDEX "idx_catch_comments_catch_parent_created" ON "public"."catch_comments" USING "btree" ("catch_id", "parent_comment_id", "created_at");



CREATE INDEX "idx_catch_comments_user_id" ON "public"."catch_comments" USING "btree" ("user_id");



CREATE INDEX "idx_catches_created_deleted_visibility" ON "public"."catches" USING "btree" ("created_at", "deleted_at", "visibility");



CREATE INDEX "idx_catches_session_id" ON "public"."catches" USING "btree" ("session_id");



CREATE INDEX "idx_catches_user_id" ON "public"."catches" USING "btree" ("user_id");



CREATE INDEX "idx_catches_venue_created_at" ON "public"."catches" USING "btree" ("venue_id", "created_at");



CREATE INDEX "idx_catches_venue_weight" ON "public"."catches" USING "btree" ("venue_id", "weight");



CREATE INDEX "idx_moderation_log_action_created" ON "public"."moderation_log" USING "btree" ("action", "created_at" DESC);



CREATE INDEX "idx_notifications_user_created" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_profile_blocks_blocked_id" ON "public"."profile_blocks" USING "btree" ("blocked_id");



CREATE INDEX "idx_profile_blocks_blocker_id" ON "public"."profile_blocks" USING "btree" ("blocker_id");



CREATE INDEX "idx_profiles_deleted_at" ON "public"."profiles" USING "btree" ("deleted_at");



CREATE INDEX "idx_profiles_is_deleted" ON "public"."profiles" USING "btree" ("is_deleted");



CREATE INDEX "idx_profiles_is_private" ON "public"."profiles" USING "btree" ("is_private");



CREATE INDEX "idx_profiles_username" ON "public"."profiles" USING "btree" ("username");



CREATE INDEX "idx_rate_limits_user_action_created" ON "public"."rate_limits" USING "btree" ("user_id", "action", "created_at" DESC);



CREATE INDEX "idx_reports_status_created" ON "public"."reports" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_reports_target" ON "public"."reports" USING "btree" ("target_type", "target_id");



CREATE INDEX "idx_sessions_user_date" ON "public"."sessions" USING "btree" ("user_id", "date");



CREATE INDEX "idx_venue_events_starts_at" ON "public"."venue_events" USING "btree" ("starts_at");



CREATE INDEX "idx_venue_events_venue_starts_at" ON "public"."venue_events" USING "btree" ("venue_id", "starts_at");



CREATE INDEX "idx_venue_owners_user_id" ON "public"."venue_owners" USING "btree" ("user_id");



CREATE INDEX "idx_venue_owners_venue_id" ON "public"."venue_owners" USING "btree" ("venue_id");



CREATE INDEX "idx_venues_is_published" ON "public"."venues" USING "btree" ("is_published");



CREATE INDEX "idx_venues_name" ON "public"."venues" USING "btree" ("name");



CREATE INDEX "idx_venues_slug" ON "public"."venues" USING "btree" ("slug");



CREATE UNIQUE INDEX "uq_catch_reactions_user_catch" ON "public"."catch_reactions" USING "btree" ("user_id", "catch_id");



CREATE UNIQUE INDEX "uq_profile_follows_pair" ON "public"."profile_follows" USING "btree" ("follower_id", "following_id");



CREATE UNIQUE INDEX "uq_ratings_user_catch" ON "public"."ratings" USING "btree" ("user_id", "catch_id");



CREATE INDEX "venue_ratings_user_venue_idx" ON "public"."venue_ratings" USING "btree" ("user_id", "venue_id");



CREATE INDEX "venue_ratings_venue_id_idx" ON "public"."venue_ratings" USING "btree" ("venue_id");



CREATE UNIQUE INDEX "bname" ON "storage"."buckets" USING "btree" ("name");



CREATE UNIQUE INDEX "bucketid_objname" ON "storage"."objects" USING "btree" ("bucket_id", "name");



CREATE UNIQUE INDEX "buckets_analytics_unique_name_idx" ON "storage"."buckets_analytics" USING "btree" ("name") WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "idx_iceberg_namespaces_bucket_id" ON "storage"."iceberg_namespaces" USING "btree" ("catalog_id", "name");



CREATE UNIQUE INDEX "idx_iceberg_tables_location" ON "storage"."iceberg_tables" USING "btree" ("location");



CREATE UNIQUE INDEX "idx_iceberg_tables_namespace_id" ON "storage"."iceberg_tables" USING "btree" ("catalog_id", "namespace_id", "name");



CREATE INDEX "idx_multipart_uploads_list" ON "storage"."s3_multipart_uploads" USING "btree" ("bucket_id", "key", "created_at");



CREATE UNIQUE INDEX "idx_name_bucket_level_unique" ON "storage"."objects" USING "btree" ("name" COLLATE "C", "bucket_id", "level");



CREATE INDEX "idx_objects_bucket_id_name" ON "storage"."objects" USING "btree" ("bucket_id", "name" COLLATE "C");



CREATE INDEX "idx_objects_lower_name" ON "storage"."objects" USING "btree" (("path_tokens"["level"]), "lower"("name") "text_pattern_ops", "bucket_id", "level");



CREATE INDEX "idx_prefixes_lower_name" ON "storage"."prefixes" USING "btree" ("bucket_id", "level", (("string_to_array"("name", '/'::"text"))["level"]), "lower"("name") "text_pattern_ops");



CREATE INDEX "name_prefix_search" ON "storage"."objects" USING "btree" ("name" "text_pattern_ops");



CREATE UNIQUE INDEX "objects_bucket_id_level_idx" ON "storage"."objects" USING "btree" ("bucket_id", "level", "name" COLLATE "C");



CREATE UNIQUE INDEX "vector_indexes_name_bucket_id_idx" ON "storage"."vector_indexes" USING "btree" ("name", "bucket_id");



CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();



CREATE OR REPLACE TRIGGER "enforce_catch_rate_limit_trigger" BEFORE INSERT ON "public"."catches" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_catch_rate_limit"();



CREATE OR REPLACE TRIGGER "enforce_comment_rate_limit_trigger" BEFORE INSERT ON "public"."catch_comments" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_comment_rate_limit"();



CREATE OR REPLACE TRIGGER "enforce_report_rate_limit_trigger" BEFORE INSERT ON "public"."reports" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_report_rate_limit"();



CREATE OR REPLACE TRIGGER "trg_catch_comments_set_updated_at" BEFORE UPDATE ON "public"."catch_comments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_catches_set_updated_at" BEFORE UPDATE ON "public"."catches" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_enforce_catch_moderation" BEFORE INSERT ON "public"."catches" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_catch_moderation"();



CREATE OR REPLACE TRIGGER "trg_profiles_set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_sessions_set_updated_at" BEFORE UPDATE ON "public"."sessions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "enforce_bucket_name_length_trigger" BEFORE INSERT OR UPDATE OF "name" ON "storage"."buckets" FOR EACH ROW EXECUTE FUNCTION "storage"."enforce_bucket_name_length"();



CREATE OR REPLACE TRIGGER "objects_delete_delete_prefix" AFTER DELETE ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."delete_prefix_hierarchy_trigger"();



CREATE OR REPLACE TRIGGER "objects_insert_create_prefix" BEFORE INSERT ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."objects_insert_prefix_trigger"();



CREATE OR REPLACE TRIGGER "objects_update_create_prefix" BEFORE UPDATE ON "storage"."objects" FOR EACH ROW WHEN ((("new"."name" <> "old"."name") OR ("new"."bucket_id" <> "old"."bucket_id"))) EXECUTE FUNCTION "storage"."objects_update_prefix_trigger"();



CREATE OR REPLACE TRIGGER "prefixes_create_hierarchy" BEFORE INSERT ON "storage"."prefixes" FOR EACH ROW WHEN (("pg_trigger_depth"() < 1)) EXECUTE FUNCTION "storage"."prefixes_insert_trigger"();



CREATE OR REPLACE TRIGGER "prefixes_delete_hierarchy" AFTER DELETE ON "storage"."prefixes" FOR EACH ROW EXECUTE FUNCTION "storage"."delete_prefix_hierarchy_trigger"();



CREATE OR REPLACE TRIGGER "update_objects_updated_at" BEFORE UPDATE ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."update_updated_at_column"();



ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "mfa_amr_claims_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."mfa_challenges"
    ADD CONSTRAINT "mfa_challenges_auth_factor_id_fkey" FOREIGN KEY ("factor_id") REFERENCES "auth"."mfa_factors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "auth"."oauth_clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "auth"."oauth_clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."one_time_tokens"
    ADD CONSTRAINT "one_time_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_flow_state_id_fkey" FOREIGN KEY ("flow_state_id") REFERENCES "auth"."flow_state"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_oauth_client_id_fkey" FOREIGN KEY ("oauth_client_id") REFERENCES "auth"."oauth_clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."sso_domains"
    ADD CONSTRAINT "sso_domains_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."catch_comments"
    ADD CONSTRAINT "catch_comments_catch_id_fkey" FOREIGN KEY ("catch_id") REFERENCES "public"."catches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."catch_comments"
    ADD CONSTRAINT "catch_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."catch_comments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."catch_comments"
    ADD CONSTRAINT "catch_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."catch_reactions"
    ADD CONSTRAINT "catch_reactions_catch_id_fkey" FOREIGN KEY ("catch_id") REFERENCES "public"."catches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."catch_reactions"
    ADD CONSTRAINT "catch_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."catches"
    ADD CONSTRAINT "catches_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."catches"
    ADD CONSTRAINT "catches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."catches"
    ADD CONSTRAINT "catches_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id");



ALTER TABLE ONLY "public"."moderation_log"
    ADD CONSTRAINT "moderation_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_catch_id_fkey" FOREIGN KEY ("catch_id") REFERENCES "public"."catches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."catch_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_blocks"
    ADD CONSTRAINT "profile_blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_blocks"
    ADD CONSTRAINT "profile_blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_follows"
    ADD CONSTRAINT "profile_follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_follows"
    ADD CONSTRAINT "profile_follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_catch_id_fkey" FOREIGN KEY ("catch_id") REFERENCES "public"."catches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_warnings"
    ADD CONSTRAINT "user_warnings_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."user_warnings"
    ADD CONSTRAINT "user_warnings_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_warnings"
    ADD CONSTRAINT "user_warnings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_events"
    ADD CONSTRAINT "venue_events_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id");



ALTER TABLE ONLY "public"."venue_owners"
    ADD CONSTRAINT "venue_owners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_owners"
    ADD CONSTRAINT "venue_owners_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_photos"
    ADD CONSTRAINT "venue_photos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."venue_photos"
    ADD CONSTRAINT "venue_photos_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_ratings"
    ADD CONSTRAINT "venue_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."venue_ratings"
    ADD CONSTRAINT "venue_ratings_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id");



ALTER TABLE ONLY "storage"."iceberg_namespaces"
    ADD CONSTRAINT "iceberg_namespaces_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "storage"."buckets_analytics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "storage"."iceberg_tables"
    ADD CONSTRAINT "iceberg_tables_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "storage"."buckets_analytics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "storage"."iceberg_tables"
    ADD CONSTRAINT "iceberg_tables_namespace_id_fkey" FOREIGN KEY ("namespace_id") REFERENCES "storage"."iceberg_namespaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."prefixes"
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "storage"."s3_multipart_uploads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "storage"."vector_indexes"
    ADD CONSTRAINT "vector_indexes_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets_vectors"("id");



ALTER TABLE "auth"."audit_log_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."flow_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."identities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."instances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."mfa_amr_claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."mfa_challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."mfa_factors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."one_time_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."refresh_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."saml_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."saml_relay_states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."schema_migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."sso_domains" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."sso_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Admins can select all venue ratings" ON "public"."venue_ratings" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Allow users to delete own venue ratings" ON "public"."venue_ratings" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Allow users to insert own venue ratings" ON "public"."venue_ratings" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Allow users to select own venue ratings" ON "public"."venue_ratings" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Allow users to update own venue ratings" ON "public"."venue_ratings" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_users_select_all" ON "public"."admin_users" FOR SELECT USING (true);



CREATE POLICY "admin_users_self_select" ON "public"."admin_users" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."baits" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "baits_select_all" ON "public"."baits" FOR SELECT USING (true);



ALTER TABLE "public"."catch_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "catch_comments_admin_read_all" ON "public"."catch_comments" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "catch_comments_admin_update" ON "public"."catch_comments" FOR UPDATE USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "catch_comments_insert_viewable" ON "public"."catch_comments" FOR INSERT WITH CHECK (((("user_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"())) AND (EXISTS ( SELECT 1
   FROM "public"."catches" "c"
  WHERE (("c"."id" = "catch_comments"."catch_id") AND ("c"."deleted_at" IS NULL) AND (("c"."user_id" = "auth"."uid"()) OR ("c"."visibility" = 'public'::"public"."visibility_type") OR (("c"."visibility" = 'followers'::"public"."visibility_type") AND ("auth"."uid"() IS NOT NULL) AND "public"."is_following"("auth"."uid"(), "c"."user_id")) OR "public"."is_admin"("auth"."uid"())))))));



CREATE POLICY "catch_comments_public_read" ON "public"."catch_comments" FOR SELECT USING ((("deleted_at" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."catches" "c"
  WHERE (("c"."id" = "catch_comments"."catch_id") AND ("c"."deleted_at" IS NULL) AND (("auth"."uid"() = "c"."user_id") OR (EXISTS ( SELECT 1
           FROM "public"."admin_users" "au"
          WHERE ("au"."user_id" = "auth"."uid"()))) OR ((NOT "public"."is_blocked_either_way"("auth"."uid"(), "c"."user_id")) AND (NOT "public"."is_blocked_either_way"("auth"."uid"(), "catch_comments"."user_id")) AND ((("c"."visibility" = 'public'::"public"."visibility_type") AND ((NOT (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE (("p"."id" = "c"."user_id") AND ("p"."is_private" = true))))) OR (("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM "public"."profile_follows" "pf"
          WHERE (("pf"."follower_id" = "auth"."uid"()) AND ("pf"."following_id" = "c"."user_id"))))))) OR (("c"."visibility" = 'followers'::"public"."visibility_type") AND ("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM "public"."profile_follows" "pf"
          WHERE (("pf"."follower_id" = "auth"."uid"()) AND ("pf"."following_id" = "c"."user_id")))))))))))));



COMMENT ON POLICY "catch_comments_public_read" ON "public"."catch_comments" IS 'Read comments when not blocked (owner/admin bypass), respecting catch privacy. See docs/BLOCK-MUTE-DESIGN.md.';



CREATE POLICY "catch_comments_select_viewable" ON "public"."catch_comments" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."catches" "c"
  WHERE (("c"."id" = "catch_comments"."catch_id") AND ("c"."deleted_at" IS NULL) AND (("c"."user_id" = "auth"."uid"()) OR ("c"."visibility" = 'public'::"public"."visibility_type") OR (("c"."visibility" = 'followers'::"public"."visibility_type") AND ("auth"."uid"() IS NOT NULL) AND "public"."is_following"("auth"."uid"(), "c"."user_id")) OR "public"."is_admin"("auth"."uid"()))))) AND (("deleted_at" IS NULL) OR "public"."is_admin"("auth"."uid"()))));



CREATE POLICY "catch_comments_update_owner" ON "public"."catch_comments" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."catch_reactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "catch_reactions_owner_all" ON "public"."catch_reactions" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "catch_reactions_select_viewable" ON "public"."catch_reactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."catches" "c"
  WHERE (("c"."id" = "catch_reactions"."catch_id") AND ("c"."deleted_at" IS NULL) AND (("c"."user_id" = "auth"."uid"()) OR ("c"."visibility" = 'public'::"public"."visibility_type") OR (("c"."visibility" = 'followers'::"public"."visibility_type") AND ("auth"."uid"() IS NOT NULL) AND "public"."is_following"("auth"."uid"(), "c"."user_id")) OR "public"."is_admin"("auth"."uid"()))))));



CREATE POLICY "catch_reactions_write_visible_unblocked_ins" ON "public"."catch_reactions" AS RESTRICTIVE FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."catches" "c"
  WHERE (("c"."id" = "catch_reactions"."catch_id") AND ("c"."deleted_at" IS NULL) AND (NOT "public"."is_blocked_either_way"("auth"."uid"(), "c"."user_id")) AND ("c"."user_id" <> "auth"."uid"()) AND ("public"."is_admin"("auth"."uid"()) OR ("c"."visibility" = 'public'::"public"."visibility_type") OR (("c"."visibility" = 'followers'::"public"."visibility_type") AND "public"."is_following"("auth"."uid"(), "c"."user_id"))))))));



CREATE POLICY "catch_reactions_write_visible_unblocked_upd" ON "public"."catch_reactions" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."catches" "c"
  WHERE (("c"."id" = "catch_reactions"."catch_id") AND ("c"."deleted_at" IS NULL) AND (NOT "public"."is_blocked_either_way"("auth"."uid"(), "c"."user_id")) AND ("c"."user_id" <> "auth"."uid"()) AND ("public"."is_admin"("auth"."uid"()) OR ("c"."visibility" = 'public'::"public"."visibility_type") OR (("c"."visibility" = 'followers'::"public"."visibility_type") AND "public"."is_following"("auth"."uid"(), "c"."user_id"))))))));



ALTER TABLE "public"."catches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "catches_admin_read_all" ON "public"."catches" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "catches_owner_all" ON "public"."catches" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "catches_owner_mutate" ON "public"."catches" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND (NOT "public"."is_admin"("auth"."uid"()))));



CREATE POLICY "catches_owner_update_delete" ON "public"."catches" FOR UPDATE USING ((("auth"."uid"() = "user_id") AND (NOT "public"."is_admin"("auth"."uid"())))) WITH CHECK ((("auth"."uid"() = "user_id") AND (NOT "public"."is_admin"("auth"."uid"()))));



CREATE POLICY "catches_public_read" ON "public"."catches" FOR SELECT USING ((("deleted_at" IS NULL) AND (("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"()))) OR ((NOT "public"."is_blocked_either_way"("auth"."uid"(), "user_id")) AND ((("visibility" = 'public'::"public"."visibility_type") AND ((NOT (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "catches"."user_id") AND ("p"."is_private" = true))))) OR (("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."profile_follows" "pf"
  WHERE (("pf"."follower_id" = "auth"."uid"()) AND ("pf"."following_id" = "catches"."user_id"))))))) OR (("visibility" = 'followers'::"public"."visibility_type") AND ("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."profile_follows" "pf"
  WHERE (("pf"."follower_id" = "auth"."uid"()) AND ("pf"."following_id" = "catches"."user_id"))))))))));



COMMENT ON POLICY "catches_public_read" ON "public"."catches" IS 'Public/admin/owner read with profile privacy and block checks. See docs/BLOCK-MUTE-DESIGN.md.';



ALTER TABLE "public"."moderation_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "moderation_log_admin_read" ON "public"."moderation_log" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_admin_read" ON "public"."notifications" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "notifications_recipient_only" ON "public"."notifications" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."profile_blocks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profile_blocks_delete_admin_all" ON "public"."profile_blocks" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"()))));



CREATE POLICY "profile_blocks_delete_self" ON "public"."profile_blocks" FOR DELETE USING (("auth"."uid"() = "blocker_id"));



CREATE POLICY "profile_blocks_insert_admin_all" ON "public"."profile_blocks" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"()))));



CREATE POLICY "profile_blocks_insert_self" ON "public"."profile_blocks" FOR INSERT WITH CHECK (("auth"."uid"() = "blocker_id"));



CREATE POLICY "profile_blocks_select_admin_all" ON "public"."profile_blocks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"()))));



CREATE POLICY "profile_blocks_select_self_or_blocked" ON "public"."profile_blocks" FOR SELECT USING ((("auth"."uid"() = "blocker_id") OR ("auth"."uid"() = "blocked_id")));



ALTER TABLE "public"."profile_follows" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profile_follows_admin_select_all" ON "public"."profile_follows" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "profile_follows_insert_not_blocked" ON "public"."profile_follows" AS RESTRICTIVE FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "follower_id") AND ("following_id" <> "auth"."uid"()) AND (NOT "public"."is_blocked_either_way"("auth"."uid"(), "following_id"))));



CREATE POLICY "profile_follows_owner_all" ON "public"."profile_follows" USING (("auth"."uid"() = "follower_id")) WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "profile_follows_select_related" ON "public"."profile_follows" FOR SELECT USING ((("auth"."uid"() = "follower_id") OR ("auth"."uid"() = "following_id")));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select_all" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "profiles_update_self" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."rate_limits" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rate_limits_admin_select" ON "public"."rate_limits" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"()))));



CREATE POLICY "rate_limits_self_insert" ON "public"."rate_limits" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."ratings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ratings_owner_mutate" ON "public"."ratings" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "ratings_read_visible_catches" ON "public"."ratings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."catches" "c"
  WHERE (("c"."id" = "ratings"."catch_id") AND ("c"."deleted_at" IS NULL) AND ("public"."is_admin"("auth"."uid"()) OR ("c"."user_id" = "auth"."uid"()) OR (("auth"."uid"() IS NULL) AND ("c"."visibility" = 'public'::"public"."visibility_type")) OR (("auth"."uid"() IS NOT NULL) AND (NOT "public"."is_admin"("auth"."uid"())) AND (("c"."visibility" = 'public'::"public"."visibility_type") OR (("c"."visibility" = 'followers'::"public"."visibility_type") AND "public"."is_following"("auth"."uid"(), "c"."user_id")))))))));



CREATE POLICY "ratings_write_visible_unblocked_ins" ON "public"."ratings" AS RESTRICTIVE FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."catches" "c"
  WHERE (("c"."id" = "ratings"."catch_id") AND ("c"."deleted_at" IS NULL) AND ("c"."allow_ratings" IS TRUE) AND (NOT "public"."is_blocked_either_way"("auth"."uid"(), "c"."user_id")) AND ("c"."user_id" <> "auth"."uid"()) AND ("public"."is_admin"("auth"."uid"()) OR ("c"."visibility" = 'public'::"public"."visibility_type") OR (("c"."visibility" = 'followers'::"public"."visibility_type") AND "public"."is_following"("auth"."uid"(), "c"."user_id"))))))));



CREATE POLICY "ratings_write_visible_unblocked_upd" ON "public"."ratings" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."catches" "c"
  WHERE (("c"."id" = "ratings"."catch_id") AND ("c"."deleted_at" IS NULL) AND ("c"."allow_ratings" IS TRUE) AND (NOT "public"."is_blocked_either_way"("auth"."uid"(), "c"."user_id")) AND ("c"."user_id" <> "auth"."uid"()) AND ("public"."is_admin"("auth"."uid"()) OR ("c"."visibility" = 'public'::"public"."visibility_type") OR (("c"."visibility" = 'followers'::"public"."visibility_type") AND "public"."is_following"("auth"."uid"(), "c"."user_id"))))))));



ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reports_admin_all" ON "public"."reports" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "reports_owner_all" ON "public"."reports" USING (("auth"."uid"() = "reporter_id")) WITH CHECK (("auth"."uid"() = "reporter_id"));



ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sessions_modify_own" ON "public"."sessions" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "sessions_select_own" ON "public"."sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tags_select_all" ON "public"."tags" FOR SELECT USING (true);



ALTER TABLE "public"."user_warnings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_warnings_admin_read" ON "public"."user_warnings" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



ALTER TABLE "public"."venue_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "venue_events_select_published" ON "public"."venue_events" FOR SELECT USING (("is_published" = true));



ALTER TABLE "public"."venue_owners" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "venue_owners_admin_all" ON "public"."venue_owners" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"()))));



CREATE POLICY "venue_owners_self_select" ON "public"."venue_owners" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."venue_photos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "venue_photos_delete" ON "public"."venue_photos" FOR DELETE TO "authenticated" USING ("public"."is_venue_admin_or_owner"("venue_id"));



CREATE POLICY "venue_photos_insert" ON "public"."venue_photos" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_venue_admin_or_owner"("venue_id"));



CREATE POLICY "venue_photos_select" ON "public"."venue_photos" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."venues" "v"
  WHERE (("v"."id" = "venue_photos"."venue_id") AND ("v"."is_published" OR "public"."is_venue_admin_or_owner"("v"."id"))))));



ALTER TABLE "public"."venue_ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."venues" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "venues_insert_admin_only" ON "public"."venues" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"()))));



CREATE POLICY "venues_select_admin_all" ON "public"."venues" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"()))));



CREATE POLICY "venues_select_owner" ON "public"."venues" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."venue_owners" "vo"
  WHERE (("vo"."venue_id" = "venues"."id") AND ("vo"."user_id" = "auth"."uid"())))));



CREATE POLICY "venues_select_published" ON "public"."venues" FOR SELECT USING (("is_published" = true));



CREATE POLICY "venues_update_admin_all" ON "public"."venues" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"()))));



CREATE POLICY "venues_update_owner" ON "public"."venues" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."venue_owners" "vo"
  WHERE (("vo"."venue_id" = "venues"."id") AND ("vo"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."venue_owners" "vo"
  WHERE (("vo"."venue_id" = "venues"."id") AND ("vo"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."water_types" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "water_types_select_all" ON "public"."water_types" FOR SELECT USING (true);



CREATE POLICY "avatars_authenticated_manage_own" ON "storage"."objects" TO "authenticated" USING ((("bucket_id" = 'avatars'::"text") AND (("auth"."uid"())::"text" = "split_part"("name", '/'::"text", 1)))) WITH CHECK ((("bucket_id" = 'avatars'::"text") AND (("auth"."uid"())::"text" = "split_part"("name", '/'::"text", 1))));



CREATE POLICY "avatars_public_read" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'avatars'::"text"));



ALTER TABLE "storage"."buckets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."buckets_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."buckets_vectors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "catches_authenticated_manage" ON "storage"."objects" TO "authenticated" USING (("bucket_id" = 'catches'::"text")) WITH CHECK (("bucket_id" = 'catches'::"text"));



CREATE POLICY "catches_public_read" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'catches'::"text"));



ALTER TABLE "storage"."iceberg_namespaces" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."iceberg_tables" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."objects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."prefixes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."s3_multipart_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."s3_multipart_uploads_parts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."vector_indexes" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "auth" TO "anon";
GRANT USAGE ON SCHEMA "auth" TO "authenticated";
GRANT USAGE ON SCHEMA "auth" TO "service_role";
GRANT ALL ON SCHEMA "auth" TO "supabase_auth_admin";
GRANT ALL ON SCHEMA "auth" TO "dashboard_user";
GRANT USAGE ON SCHEMA "auth" TO "postgres";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT USAGE ON SCHEMA "storage" TO "postgres" WITH GRANT OPTION;
GRANT USAGE ON SCHEMA "storage" TO "anon";
GRANT USAGE ON SCHEMA "storage" TO "authenticated";
GRANT USAGE ON SCHEMA "storage" TO "service_role";
GRANT ALL ON SCHEMA "storage" TO "supabase_storage_admin";
GRANT ALL ON SCHEMA "storage" TO "dashboard_user";



GRANT ALL ON FUNCTION "auth"."email"() TO "dashboard_user";



GRANT ALL ON FUNCTION "auth"."jwt"() TO "postgres";
GRANT ALL ON FUNCTION "auth"."jwt"() TO "dashboard_user";



GRANT ALL ON FUNCTION "auth"."role"() TO "dashboard_user";



GRANT ALL ON FUNCTION "auth"."uid"() TO "dashboard_user";



GRANT ALL ON FUNCTION "public"."admin_add_venue_owner"("p_venue_id" "uuid", "p_user_id" "uuid", "p_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_add_venue_owner"("p_venue_id" "uuid", "p_user_id" "uuid", "p_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_add_venue_owner"("p_venue_id" "uuid", "p_user_id" "uuid", "p_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_clear_moderation_status"("p_user_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_clear_moderation_status"("p_user_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_clear_moderation_status"("p_user_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_create_venue_event"("p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_is_published" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_create_venue_event"("p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_is_published" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_create_venue_event"("p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_is_published" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_delete_account"("p_target" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_delete_account"("p_target" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_delete_account"("p_target" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_delete_catch"("p_catch_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_delete_catch"("p_catch_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_delete_catch"("p_catch_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_delete_comment"("p_comment_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_delete_comment"("p_comment_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_delete_comment"("p_comment_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_delete_venue_event"("p_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_delete_venue_event"("p_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_delete_venue_event"("p_event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_venue_events"("p_venue_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_venue_events"("p_venue_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_venue_events"("p_venue_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_list_moderation_log"("p_user_id" "uuid", "p_action" "text", "p_search" "text", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_sort_direction" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_list_moderation_log"("p_user_id" "uuid", "p_action" "text", "p_search" "text", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_sort_direction" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_list_moderation_log"("p_user_id" "uuid", "p_action" "text", "p_search" "text", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_sort_direction" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_list_reports"("p_status" "text", "p_type" "text", "p_reported_user_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_sort_direction" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_list_reports"("p_status" "text", "p_type" "text", "p_reported_user_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_sort_direction" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_list_reports"("p_status" "text", "p_type" "text", "p_reported_user_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_sort_direction" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_remove_venue_owner"("p_venue_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_remove_venue_owner"("p_venue_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_remove_venue_owner"("p_venue_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_restore_catch"("p_catch_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_restore_catch"("p_catch_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_restore_catch"("p_catch_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_restore_comment"("p_comment_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_restore_comment"("p_comment_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_restore_comment"("p_comment_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_report_status"("p_report_id" "uuid", "p_status" "text", "p_resolution_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_report_status"("p_report_id" "uuid", "p_status" "text", "p_resolution_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_report_status"("p_report_id" "uuid", "p_status" "text", "p_resolution_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_venue_event"("p_event_id" "uuid", "p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_is_published" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_venue_event"("p_event_id" "uuid", "p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_is_published" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_venue_event"("p_event_id" "uuid", "p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_is_published" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_venue_metadata"("p_venue_id" "uuid", "p_short_tagline" "text", "p_ticket_type" "text", "p_price_from" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_notes_for_rr_team" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_venue_metadata"("p_venue_id" "uuid", "p_short_tagline" "text", "p_ticket_type" "text", "p_price_from" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_notes_for_rr_team" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_venue_metadata"("p_venue_id" "uuid", "p_short_tagline" "text", "p_ticket_type" "text", "p_price_from" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_notes_for_rr_team" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_venue_metadata"("p_venue_id" "uuid", "p_short_tagline" "text", "p_description" "text", "p_ticket_type" "text", "p_price_from" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_notes_for_rr_team" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_venue_metadata"("p_venue_id" "uuid", "p_short_tagline" "text", "p_description" "text", "p_ticket_type" "text", "p_price_from" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_notes_for_rr_team" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_venue_metadata"("p_venue_id" "uuid", "p_short_tagline" "text", "p_description" "text", "p_ticket_type" "text", "p_price_from" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_notes_for_rr_team" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_warn_user"("p_user_id" "uuid", "p_reason" "text", "p_severity" "public"."warning_severity", "p_duration_hours" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_warn_user"("p_user_id" "uuid", "p_reason" "text", "p_severity" "public"."warning_severity", "p_duration_hours" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_warn_user"("p_user_id" "uuid", "p_reason" "text", "p_severity" "public"."warning_severity", "p_duration_hours" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."assert_moderation_allowed"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."assert_moderation_allowed"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assert_moderation_allowed"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."block_profile"("p_blocked_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."block_profile"("p_blocked_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."block_profile"("p_blocked_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_email_exists"("email_to_check" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_email_exists"("email_to_check" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_email_exists"("email_to_check" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer, "p_window_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer, "p_window_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer, "p_window_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_rate_limits"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_rate_limits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_rate_limits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_comment_with_rate_limit"("p_catch_id" "uuid", "p_body" "text", "p_parent_comment_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_comment_with_rate_limit"("p_catch_id" "uuid", "p_body" "text", "p_parent_comment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_comment_with_rate_limit"("p_catch_id" "uuid", "p_body" "text", "p_parent_comment_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_message" "text", "p_type" "public"."notification_type", "p_actor_id" "uuid", "p_catch_id" "uuid", "p_comment_id" "uuid", "p_extra_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_message" "text", "p_type" "public"."notification_type", "p_actor_id" "uuid", "p_catch_id" "uuid", "p_comment_id" "uuid", "p_extra_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_message" "text", "p_type" "public"."notification_type", "p_actor_id" "uuid", "p_catch_id" "uuid", "p_comment_id" "uuid", "p_extra_data" "jsonb") TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_report_with_rate_limit"("p_target_type" "public"."report_target_type", "p_target_id" "uuid", "p_reason" "text", "p_details" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_report_with_rate_limit"("p_target_type" "public"."report_target_type", "p_target_id" "uuid", "p_reason" "text", "p_details" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_report_with_rate_limit"("p_target_type" "public"."report_target_type", "p_target_id" "uuid", "p_reason" "text", "p_details" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_catch_moderation"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_catch_moderation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_catch_moderation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_catch_rate_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_catch_rate_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_catch_rate_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_comment_rate_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_comment_rate_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_comment_rate_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_report_rate_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_report_rate_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_report_rate_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."follow_profile_with_rate_limit"("p_following_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."follow_profile_with_rate_limit"("p_following_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."follow_profile_with_rate_limit"("p_following_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_catch_rating_summary"("p_catch_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_catch_rating_summary"("p_catch_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_catch_rating_summary"("p_catch_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_follower_count"("p_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_follower_count"("p_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_follower_count"("p_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_venue_rating"("p_venue_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_venue_rating"("p_venue_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_venue_rating"("p_venue_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_rate_limit_status"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer, "p_window_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_rate_limit_status"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer, "p_window_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_rate_limit_status"("p_user_id" "uuid", "p_action" "text", "p_max_attempts" integer, "p_window_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_venue_by_slug"("p_slug" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_venue_by_slug"("p_slug" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_venue_by_slug"("p_slug" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_venue_past_events"("p_venue_id" "uuid", "p_now" timestamp with time zone, "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_venue_past_events"("p_venue_id" "uuid", "p_now" timestamp with time zone, "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_venue_past_events"("p_venue_id" "uuid", "p_now" timestamp with time zone, "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON TABLE "public"."venue_photos" TO "anon";
GRANT ALL ON TABLE "public"."venue_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_photos" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_venue_photos"("p_venue_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_venue_photos"("p_venue_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_venue_photos"("p_venue_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_venue_recent_catches"("p_venue_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_venue_recent_catches"("p_venue_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_venue_recent_catches"("p_venue_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_venue_top_anglers"("p_venue_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_venue_top_anglers"("p_venue_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_venue_top_anglers"("p_venue_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_venue_top_catches"("p_venue_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_venue_top_catches"("p_venue_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_venue_top_catches"("p_venue_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_venue_upcoming_events"("p_venue_id" "uuid", "p_now" timestamp with time zone, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_venue_upcoming_events"("p_venue_id" "uuid", "p_now" timestamp with time zone, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_venue_upcoming_events"("p_venue_id" "uuid", "p_now" timestamp with time zone, "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_venues"("p_search" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_venues"("p_search" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_venues"("p_search" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_blocked_either_way"("p_user_id" "uuid", "p_other_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_blocked_either_way"("p_user_id" "uuid", "p_other_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_blocked_either_way"("p_user_id" "uuid", "p_other_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_following"("p_follower" "uuid", "p_following" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_following"("p_follower" "uuid", "p_following" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_following"("p_follower" "uuid", "p_following" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_venue_admin_or_owner"("p_venue_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_venue_admin_or_owner"("p_venue_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_venue_admin_or_owner"("p_venue_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_add_venue_photo"("p_venue_id" "uuid", "p_image_path" "text", "p_caption" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."owner_add_venue_photo"("p_venue_id" "uuid", "p_image_path" "text", "p_caption" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_add_venue_photo"("p_venue_id" "uuid", "p_image_path" "text", "p_caption" "text") TO "service_role";



GRANT ALL ON TABLE "public"."venue_events" TO "anon";
GRANT ALL ON TABLE "public"."venue_events" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_events" TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_create_venue_event"("p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_is_published" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."owner_create_venue_event"("p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_is_published" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_create_venue_event"("p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_is_published" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_delete_venue_event"("p_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."owner_delete_venue_event"("p_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_delete_venue_event"("p_event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_delete_venue_photo"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."owner_delete_venue_photo"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_delete_venue_photo"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_get_venue_events"("p_venue_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."owner_get_venue_events"("p_venue_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_get_venue_events"("p_venue_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_update_venue_event"("p_event_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_is_published" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."owner_update_venue_event"("p_event_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_is_published" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_update_venue_event"("p_event_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_is_published" boolean) TO "service_role";



GRANT ALL ON TABLE "public"."venues" TO "anon";
GRANT ALL ON TABLE "public"."venues" TO "authenticated";
GRANT ALL ON TABLE "public"."venues" TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_update_venue_metadata"("p_venue_id" "uuid", "p_tagline" "text", "p_description" "text", "p_ticket_type" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_price_from" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."owner_update_venue_metadata"("p_venue_id" "uuid", "p_tagline" "text", "p_description" "text", "p_ticket_type" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_price_from" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_update_venue_metadata"("p_venue_id" "uuid", "p_tagline" "text", "p_description" "text", "p_ticket_type" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_price_from" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rate_catch_with_rate_limit"("p_catch_id" "uuid", "p_rating" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."rate_catch_with_rate_limit"("p_catch_id" "uuid", "p_rating" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."rate_catch_with_rate_limit"("p_catch_id" "uuid", "p_rating" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."react_to_catch_with_rate_limit"("p_catch_id" "uuid", "p_reaction" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."react_to_catch_with_rate_limit"("p_catch_id" "uuid", "p_reaction" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."react_to_catch_with_rate_limit"("p_catch_id" "uuid", "p_reaction" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."request_account_deletion"("p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."request_account_deletion"("p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_account_deletion"("p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."request_account_export"() TO "anon";
GRANT ALL ON FUNCTION "public"."request_account_export"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_account_export"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."soft_delete_comment"("p_comment_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."soft_delete_comment"("p_comment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."soft_delete_comment"("p_comment_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."unblock_profile"("p_blocked_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."unblock_profile"("p_blocked_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unblock_profile"("p_blocked_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_venue_rating"("p_venue_id" "uuid", "p_rating" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_venue_rating"("p_venue_id" "uuid", "p_rating" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_venue_rating"("p_venue_id" "uuid", "p_rating" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."user_rate_limits"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_rate_limits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_rate_limits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_rate_limits"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_rate_limits"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_rate_limits"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "auth"."audit_log_entries" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."audit_log_entries" TO "postgres";
GRANT SELECT ON TABLE "auth"."audit_log_entries" TO "postgres" WITH GRANT OPTION;



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."flow_state" TO "postgres";
GRANT SELECT ON TABLE "auth"."flow_state" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."flow_state" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."identities" TO "postgres";
GRANT SELECT ON TABLE "auth"."identities" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."identities" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."instances" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."instances" TO "postgres";
GRANT SELECT ON TABLE "auth"."instances" TO "postgres" WITH GRANT OPTION;



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."mfa_amr_claims" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_amr_claims" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_amr_claims" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."mfa_challenges" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_challenges" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_challenges" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."mfa_factors" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_factors" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_factors" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."oauth_authorizations" TO "postgres";
GRANT ALL ON TABLE "auth"."oauth_authorizations" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."oauth_clients" TO "postgres";
GRANT ALL ON TABLE "auth"."oauth_clients" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."oauth_consents" TO "postgres";
GRANT ALL ON TABLE "auth"."oauth_consents" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."one_time_tokens" TO "postgres";
GRANT SELECT ON TABLE "auth"."one_time_tokens" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."one_time_tokens" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."refresh_tokens" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."refresh_tokens" TO "postgres";
GRANT SELECT ON TABLE "auth"."refresh_tokens" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON SEQUENCE "auth"."refresh_tokens_id_seq" TO "dashboard_user";
GRANT ALL ON SEQUENCE "auth"."refresh_tokens_id_seq" TO "postgres";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."saml_providers" TO "postgres";
GRANT SELECT ON TABLE "auth"."saml_providers" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."saml_providers" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."saml_relay_states" TO "postgres";
GRANT SELECT ON TABLE "auth"."saml_relay_states" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."saml_relay_states" TO "dashboard_user";



GRANT SELECT ON TABLE "auth"."schema_migrations" TO "postgres" WITH GRANT OPTION;



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."sessions" TO "postgres";
GRANT SELECT ON TABLE "auth"."sessions" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sessions" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."sso_domains" TO "postgres";
GRANT SELECT ON TABLE "auth"."sso_domains" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sso_domains" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."sso_providers" TO "postgres";
GRANT SELECT ON TABLE "auth"."sso_providers" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sso_providers" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."users" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."users" TO "postgres";
GRANT SELECT ON TABLE "auth"."users" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."baits" TO "anon";
GRANT ALL ON TABLE "public"."baits" TO "authenticated";
GRANT ALL ON TABLE "public"."baits" TO "service_role";



GRANT ALL ON TABLE "public"."catch_comments" TO "anon";
GRANT ALL ON TABLE "public"."catch_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."catch_comments" TO "service_role";



GRANT ALL ON TABLE "public"."catches" TO "anon";
GRANT ALL ON TABLE "public"."catches" TO "authenticated";
GRANT ALL ON TABLE "public"."catches" TO "service_role";



GRANT ALL ON TABLE "public"."catch_comments_with_admin" TO "service_role";
GRANT SELECT ON TABLE "public"."catch_comments_with_admin" TO "authenticated";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."catch_mention_candidates" TO "service_role";
GRANT SELECT ON TABLE "public"."catch_mention_candidates" TO "authenticated";



GRANT ALL ON TABLE "public"."catch_reactions" TO "anon";
GRANT ALL ON TABLE "public"."catch_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."catch_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."ratings" TO "anon";
GRANT ALL ON TABLE "public"."ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."ratings" TO "service_role";



GRANT ALL ON TABLE "public"."leaderboard_scores_detailed" TO "anon";
GRANT ALL ON TABLE "public"."leaderboard_scores_detailed" TO "authenticated";
GRANT ALL ON TABLE "public"."leaderboard_scores_detailed" TO "service_role";



GRANT ALL ON TABLE "public"."moderation_log" TO "anon";
GRANT ALL ON TABLE "public"."moderation_log" TO "authenticated";
GRANT ALL ON TABLE "public"."moderation_log" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."profile_blocks" TO "anon";
GRANT ALL ON TABLE "public"."profile_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_blocks" TO "service_role";



GRANT ALL ON TABLE "public"."profile_follows" TO "anon";
GRANT ALL ON TABLE "public"."profile_follows" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_follows" TO "service_role";



GRANT ALL ON TABLE "public"."rate_limits" TO "anon";
GRANT ALL ON TABLE "public"."rate_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limits" TO "service_role";



GRANT ALL ON SEQUENCE "public"."rate_limits_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rate_limits_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rate_limits_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."user_warnings" TO "anon";
GRANT ALL ON TABLE "public"."user_warnings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_warnings" TO "service_role";



GRANT ALL ON TABLE "public"."venue_owners" TO "anon";
GRANT ALL ON TABLE "public"."venue_owners" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_owners" TO "service_role";



GRANT ALL ON TABLE "public"."venue_ratings" TO "anon";
GRANT ALL ON TABLE "public"."venue_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_ratings" TO "service_role";



GRANT ALL ON TABLE "public"."venue_stats" TO "anon";
GRANT ALL ON TABLE "public"."venue_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_stats" TO "service_role";



GRANT ALL ON TABLE "public"."water_types" TO "anon";
GRANT ALL ON TABLE "public"."water_types" TO "authenticated";
GRANT ALL ON TABLE "public"."water_types" TO "service_role";



GRANT ALL ON TABLE "storage"."buckets" TO "anon";
GRANT ALL ON TABLE "storage"."buckets" TO "authenticated";
GRANT ALL ON TABLE "storage"."buckets" TO "service_role";
GRANT ALL ON TABLE "storage"."buckets" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "storage"."buckets_analytics" TO "service_role";
GRANT ALL ON TABLE "storage"."buckets_analytics" TO "authenticated";
GRANT ALL ON TABLE "storage"."buckets_analytics" TO "anon";



GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "service_role";
GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "authenticated";
GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "anon";



GRANT ALL ON TABLE "storage"."iceberg_namespaces" TO "service_role";
GRANT SELECT ON TABLE "storage"."iceberg_namespaces" TO "authenticated";
GRANT SELECT ON TABLE "storage"."iceberg_namespaces" TO "anon";



GRANT ALL ON TABLE "storage"."iceberg_tables" TO "service_role";
GRANT SELECT ON TABLE "storage"."iceberg_tables" TO "authenticated";
GRANT SELECT ON TABLE "storage"."iceberg_tables" TO "anon";



GRANT ALL ON TABLE "storage"."objects" TO "anon";
GRANT ALL ON TABLE "storage"."objects" TO "authenticated";
GRANT ALL ON TABLE "storage"."objects" TO "service_role";
GRANT ALL ON TABLE "storage"."objects" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "storage"."prefixes" TO "service_role";
GRANT ALL ON TABLE "storage"."prefixes" TO "authenticated";
GRANT ALL ON TABLE "storage"."prefixes" TO "anon";



GRANT ALL ON TABLE "storage"."s3_multipart_uploads" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "anon";



GRANT ALL ON TABLE "storage"."s3_multipart_uploads_parts" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "anon";



GRANT SELECT ON TABLE "storage"."vector_indexes" TO "service_role";
GRANT SELECT ON TABLE "storage"."vector_indexes" TO "authenticated";
GRANT SELECT ON TABLE "storage"."vector_indexes" TO "anon";



ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON SEQUENCES TO "dashboard_user";



ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON FUNCTIONS TO "dashboard_user";



ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON TABLES TO "dashboard_user";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "service_role";




