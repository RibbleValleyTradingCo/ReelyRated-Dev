


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


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






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


CREATE TYPE "public"."venue_pricing_audience" AS ENUM (
    'adult',
    'junior',
    'oap',
    'disabled'
);


ALTER TYPE "public"."venue_pricing_audience" OWNER TO "postgres";


CREATE TYPE "public"."venue_stock_density" AS ENUM (
    'low',
    'medium',
    'high'
);


ALTER TYPE "public"."venue_stock_density" OWNER TO "postgres";


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

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."venue_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "image_path" "text" NOT NULL,
    "caption" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "is_primary" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."venue_photos" OWNER TO "postgres";


COMMENT ON TABLE "public"."venue_photos" IS 'Photos uploaded by venue owners/admins for venue pages.';



CREATE OR REPLACE FUNCTION "public"."admin_add_venue_photo"("p_venue_id" "uuid", "p_image_path" "text", "p_caption" "text" DEFAULT NULL::"text") RETURNS "public"."venue_photos"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_is_admin boolean;
  v_row public.venue_photos;
  v_image_path text;
  v_expected_prefix text;
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_image_path := ltrim(trim(coalesce(p_image_path, '')), '/');
  IF v_image_path = '' THEN
    RAISE EXCEPTION 'Invalid image path';
  END IF;
  IF position('..' in v_image_path) > 0 THEN
    RAISE EXCEPTION 'Invalid image path';
  END IF;
  v_expected_prefix := 'venue-photos/' || p_venue_id::text || '/';
  IF v_image_path NOT LIKE v_expected_prefix || '%' THEN
    RAISE EXCEPTION 'Invalid image path';
  END IF;

  SELECT public.is_admin(v_admin) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  INSERT INTO public.venue_photos (venue_id, image_path, caption, created_by)
  VALUES (p_venue_id, v_image_path, p_caption, v_admin)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;


ALTER FUNCTION "public"."admin_add_venue_photo"("p_venue_id" "uuid", "p_image_path" "text", "p_caption" "text") OWNER TO "postgres";


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



CREATE TABLE IF NOT EXISTS "public"."venue_opening_hours" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "label" "text",
    "day_of_week" smallint NOT NULL,
    "opens_at" time without time zone,
    "closes_at" time without time zone,
    "is_closed" boolean DEFAULT false NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "venue_opening_hours_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6))),
    CONSTRAINT "venue_opening_hours_order_index_check" CHECK (("order_index" >= 0))
);


ALTER TABLE "public"."venue_opening_hours" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_create_venue_opening_hour"("p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean DEFAULT false, "p_order_index" integer DEFAULT 0) RETURNS "public"."venue_opening_hours"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
  v_row public.venue_opening_hours;
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.venue_opening_hours (
    venue_id,
    label,
    day_of_week,
    opens_at,
    closes_at,
    is_closed,
    order_index
  )
  VALUES (
    p_venue_id,
    p_label,
    p_day_of_week,
    p_opens_at,
    p_closes_at,
    COALESCE(p_is_closed, false),
    COALESCE(p_order_index, 0)
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;


ALTER FUNCTION "public"."admin_create_venue_opening_hour"("p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean, "p_order_index" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_create_venue_opening_hour"("p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean, "p_order_index" integer) IS 'Admin-only: create an opening-hours row for a venue.';



CREATE TABLE IF NOT EXISTS "public"."venue_pricing_tiers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "price" "text" NOT NULL,
    "unit" "text",
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "audience" "public"."venue_pricing_audience",
    CONSTRAINT "venue_pricing_tiers_order_index_check" CHECK (("order_index" >= 0))
);


ALTER TABLE "public"."venue_pricing_tiers" OWNER TO "postgres";


COMMENT ON COLUMN "public"."venue_pricing_tiers"."audience" IS 'Optional audience category for the pricing tier.';



CREATE OR REPLACE FUNCTION "public"."admin_create_venue_pricing_tier"("p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer DEFAULT 0) RETURNS "public"."venue_pricing_tiers"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
  v_row public.venue_pricing_tiers;
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.venue_pricing_tiers (
    venue_id,
    label,
    price,
    unit,
    audience,
    order_index
  )
  VALUES (
    p_venue_id,
    p_label,
    p_price,
    p_unit,
    p_audience,
    COALESCE(p_order_index, 0)
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;


ALTER FUNCTION "public"."admin_create_venue_pricing_tier"("p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_create_venue_pricing_tier"("p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer) IS 'Admin-only: create a pricing tier (audience optional).';



CREATE TABLE IF NOT EXISTS "public"."venue_species_stock" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "species_name" "text" NOT NULL,
    "record_weight" numeric NOT NULL,
    "record_unit" "text" NOT NULL,
    "avg_weight" numeric,
    "size_range_min" numeric,
    "size_range_max" numeric,
    "stock_density" "public"."venue_stock_density" NOT NULL,
    "stock_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."venue_species_stock" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_create_venue_species_stock"("p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") RETURNS "public"."venue_species_stock"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
  v_row public.venue_species_stock;
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.venue_species_stock (
    venue_id,
    species_name,
    record_weight,
    record_unit,
    avg_weight,
    size_range_min,
    size_range_max,
    stock_density,
    stock_notes
  )
  VALUES (
    p_venue_id,
    p_species_name,
    p_record_weight,
    p_record_unit,
    p_avg_weight,
    p_size_range_min,
    p_size_range_max,
    p_stock_density,
    p_stock_notes
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;


ALTER FUNCTION "public"."admin_create_venue_species_stock"("p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_create_venue_species_stock"("p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") IS 'Admin-only: create a species stock row for a venue.';



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



CREATE OR REPLACE FUNCTION "public"."admin_delete_venue_opening_hour"("p_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.venue_opening_hours WHERE id = p_id;
END;
$$;


ALTER FUNCTION "public"."admin_delete_venue_opening_hour"("p_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_delete_venue_opening_hour"("p_id" "uuid") IS 'Admin-only: delete an opening-hours row for a venue.';



CREATE OR REPLACE FUNCTION "public"."admin_delete_venue_photo"("p_id" "uuid") RETURNS "void"
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

  SELECT public.is_admin(v_admin) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  DELETE FROM public.venue_photos WHERE id = p_id;
END;
$$;


ALTER FUNCTION "public"."admin_delete_venue_photo"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_delete_venue_pricing_tier"("p_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.venue_pricing_tiers WHERE id = p_id;
END;
$$;


ALTER FUNCTION "public"."admin_delete_venue_pricing_tier"("p_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_delete_venue_pricing_tier"("p_id" "uuid") IS 'Admin-only: delete a pricing tier for a venue.';



CREATE OR REPLACE FUNCTION "public"."admin_delete_venue_species_stock"("p_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.venue_species_stock WHERE id = p_id;
END;
$$;


ALTER FUNCTION "public"."admin_delete_venue_species_stock"("p_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_delete_venue_species_stock"("p_id" "uuid") IS 'Admin-only: delete a species stock row for a venue.';



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


CREATE OR REPLACE FUNCTION "public"."admin_set_venue_photo_primary"("p_photo_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
  v_venue_id uuid;
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT venue_id INTO v_venue_id
  FROM public.venue_photos
  WHERE id = p_photo_id;

  IF v_venue_id IS NULL THEN
    RAISE EXCEPTION 'Photo not found';
  END IF;

  UPDATE public.venue_photos
  SET is_primary = false
  WHERE venue_id = v_venue_id;

  UPDATE public.venue_photos
  SET is_primary = true
  WHERE id = p_photo_id;
END;
$$;


ALTER FUNCTION "public"."admin_set_venue_photo_primary"("p_photo_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."admin_update_venue_booking"("p_venue_id" "uuid", "p_booking_enabled" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.venues
  SET
    booking_enabled = COALESCE(p_booking_enabled, booking_enabled),
    updated_at = now()
  WHERE id = p_venue_id;
END;
$$;


ALTER FUNCTION "public"."admin_update_venue_booking"("p_venue_id" "uuid", "p_booking_enabled" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_update_venue_booking"("p_venue_id" "uuid", "p_booking_enabled" boolean) IS 'Admin-only: update venue booking_enabled flag.';



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



CREATE OR REPLACE FUNCTION "public"."admin_update_venue_metadata"("p_venue_id" "uuid", "p_short_tagline" "text", "p_description" "text", "p_ticket_type" "text", "p_price_from" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_notes_for_rr_team" "text", "p_payment_methods" "text"[], "p_payment_notes" "text") RETURNS "void"
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
    payment_methods    = p_payment_methods,
    payment_notes      = p_payment_notes,
    updated_at         = now()
  WHERE id = p_venue_id;
END;
$$;


ALTER FUNCTION "public"."admin_update_venue_metadata"("p_venue_id" "uuid", "p_short_tagline" "text", "p_description" "text", "p_ticket_type" "text", "p_price_from" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_notes_for_rr_team" "text", "p_payment_methods" "text"[], "p_payment_notes" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_update_venue_metadata"("p_venue_id" "uuid", "p_short_tagline" "text", "p_description" "text", "p_ticket_type" "text", "p_price_from" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_notes_for_rr_team" "text", "p_payment_methods" "text"[], "p_payment_notes" "text") IS 'Admin-only RPC to update venue metadata fields (short_tagline, description, ticket_type, price, tags, facilities, URLs, contact, notes, payment info). Checks admin_users internally.';



CREATE OR REPLACE FUNCTION "public"."admin_update_venue_opening_hour"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean, "p_order_index" integer) RETURNS "public"."venue_opening_hours"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
  v_row public.venue_opening_hours;
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.venue_opening_hours
  SET
    label = p_label,
    day_of_week = p_day_of_week,
    opens_at = p_opens_at,
    closes_at = p_closes_at,
    is_closed = COALESCE(p_is_closed, false),
    order_index = COALESCE(p_order_index, 0),
    updated_at = now()
  WHERE id = p_id
    AND venue_id = p_venue_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;


ALTER FUNCTION "public"."admin_update_venue_opening_hour"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean, "p_order_index" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_update_venue_opening_hour"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean, "p_order_index" integer) IS 'Admin-only: update an opening-hours row for a venue.';



CREATE OR REPLACE FUNCTION "public"."admin_update_venue_pricing_tier"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer) RETURNS "public"."venue_pricing_tiers"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
  v_row public.venue_pricing_tiers;
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.venue_pricing_tiers
  SET
    label = p_label,
    price = p_price,
    unit = p_unit,
    audience = p_audience,
    order_index = COALESCE(p_order_index, 0),
    updated_at = now()
  WHERE id = p_id
    AND venue_id = p_venue_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;


ALTER FUNCTION "public"."admin_update_venue_pricing_tier"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_update_venue_pricing_tier"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer) IS 'Admin-only: update a pricing tier (audience optional).';



CREATE TABLE IF NOT EXISTS "public"."venue_rules" (
    "venue_id" "uuid" NOT NULL,
    "rules_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."venue_rules" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_venue_rules"("p_venue_id" "uuid", "p_rules_text" "text") RETURNS "public"."venue_rules"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
  v_row public.venue_rules;
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.venue_rules (venue_id, rules_text, created_at, updated_at)
  VALUES (p_venue_id, p_rules_text, now(), now())
  ON CONFLICT (venue_id)
  DO UPDATE SET
    rules_text = EXCLUDED.rules_text,
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;


ALTER FUNCTION "public"."admin_update_venue_rules"("p_venue_id" "uuid", "p_rules_text" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_update_venue_rules"("p_venue_id" "uuid", "p_rules_text" "text") IS 'Admin-only: upsert venue rules (single text blob).';



CREATE OR REPLACE FUNCTION "public"."admin_update_venue_species_stock"("p_id" "uuid", "p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") RETURNS "public"."venue_species_stock"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
  v_row public.venue_species_stock;
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.venue_species_stock
  SET
    species_name = p_species_name,
    record_weight = p_record_weight,
    record_unit = p_record_unit,
    avg_weight = p_avg_weight,
    size_range_min = p_size_range_min,
    size_range_max = p_size_range_max,
    stock_density = p_stock_density,
    stock_notes = p_stock_notes,
    updated_at = now()
  WHERE id = p_id
    AND venue_id = p_venue_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;


ALTER FUNCTION "public"."admin_update_venue_species_stock"("p_id" "uuid", "p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_update_venue_species_stock"("p_id" "uuid", "p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") IS 'Admin-only: update a species stock row for a venue.';



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


CREATE OR REPLACE FUNCTION "public"."get_feed_catches"("p_limit" integer DEFAULT 18, "p_offset" integer DEFAULT 0, "p_scope" "text" DEFAULT 'all'::"text", "p_sort" "text" DEFAULT 'newest'::"text", "p_species" "text" DEFAULT 'all'::"text", "p_custom_species" "text" DEFAULT NULL::"text", "p_venue_id" "uuid" DEFAULT NULL::"uuid", "p_session_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("id" "uuid", "title" "text", "image_url" "text", "user_id" "uuid", "location" "text", "species" "text", "weight" numeric, "weight_unit" "public"."weight_unit", "visibility" "public"."visibility_type", "hide_exact_spot" boolean, "conditions" "jsonb", "created_at" timestamp with time zone, "session_id" "uuid", "profiles" "jsonb", "ratings" "jsonb", "comments" "jsonb", "reactions" "jsonb", "venues" "jsonb", "avg_rating" numeric, "rating_count" integer)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_limit int := LEAST(COALESCE(p_limit, 18), 100);
  v_offset int := GREATEST(COALESCE(p_offset, 0), 0);
  v_scope text := COALESCE(NULLIF(p_scope, ''), 'all');
  v_sort text := COALESCE(NULLIF(p_sort, ''), 'newest');
  v_species text := COALESCE(NULLIF(p_species, ''), 'all');
  v_custom_species text := NULLIF(lower(trim(COALESCE(p_custom_species, ''))), '');
BEGIN
  IF p_session_id IS NOT NULL THEN
    RETURN QUERY
    WITH base AS (
      SELECT
        c.*,
        rating_summary.avg_rating,
        rating_summary.rating_count
      FROM public.catches c
      LEFT JOIN LATERAL (
        SELECT
          AVG(r.rating)::numeric AS avg_rating,
          COUNT(*)::int AS rating_count
        FROM public.ratings r
        WHERE r.catch_id = c.id
      ) AS rating_summary ON true
      WHERE c.deleted_at IS NULL
        AND c.session_id = p_session_id
        AND (p_venue_id IS NULL OR c.venue_id = p_venue_id)
        AND (
          v_species = 'all'
          OR (v_species = 'other'
              AND c.species = 'other'
              AND (v_custom_species IS NULL
                OR lower(c.conditions->'customFields'->>'species') LIKE v_custom_species || '%'))
          OR (v_species <> 'other' AND v_species <> 'all' AND c.species = v_species)
        )
        AND (
          v_scope <> 'following'
          OR (
            auth.uid() IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM public.profile_follows pf
              WHERE pf.follower_id = auth.uid()
                AND pf.following_id = c.user_id
            )
          )
        )
    )
    SELECT
      b.id,
      b.title,
      b.image_url,
      b.user_id,
      b.location,
      b.species,
      b.weight,
      b.weight_unit,
      b.visibility,
      b.hide_exact_spot,
      b.conditions,
      b.created_at,
      b.session_id,
      (
        SELECT to_jsonb(p_sub.*)
        FROM (
          SELECT p.username, p.avatar_path, p.avatar_url
          FROM public.profiles p
          WHERE p.id = b.user_id
        ) AS p_sub
      ) AS profiles,
      (
        SELECT coalesce(jsonb_agg(jsonb_build_object('rating', r.rating)), '[]'::jsonb)
        FROM public.ratings r
        WHERE r.catch_id = b.id
      ) AS ratings,
      (
        SELECT coalesce(jsonb_agg(jsonb_build_object('id', cc.id)), '[]'::jsonb)
        FROM public.catch_comments cc
        WHERE cc.catch_id = b.id AND cc.deleted_at IS NULL
      ) AS comments,
      (
        SELECT coalesce(jsonb_agg(jsonb_build_object('user_id', cr.user_id)), '[]'::jsonb)
        FROM public.catch_reactions cr
        WHERE cr.catch_id = b.id
      ) AS reactions,
      (
        SELECT to_jsonb(v_sub.*)
        FROM (
          SELECT v.id, v.slug, v.name
          FROM public.venues v
          WHERE v.id = b.venue_id
        ) AS v_sub
      ) AS venues,
      b.avg_rating,
      b.rating_count
    FROM base b
    ORDER BY
      CASE WHEN v_sort = 'highest_rated' THEN b.avg_rating END DESC NULLS LAST,
      CASE WHEN v_sort = 'highest_rated' THEN b.rating_count END DESC NULLS LAST,
      CASE WHEN v_sort = 'heaviest' THEN b.weight END DESC NULLS LAST,
      CASE WHEN v_sort = 'newest' THEN b.created_at END DESC,
      b.created_at DESC,
      b.id DESC;
  ELSE
    RETURN QUERY
    WITH base AS (
      SELECT
        c.*,
        rating_summary.avg_rating,
        rating_summary.rating_count
      FROM public.catches c
      LEFT JOIN LATERAL (
        SELECT
          AVG(r.rating)::numeric AS avg_rating,
          COUNT(*)::int AS rating_count
        FROM public.ratings r
        WHERE r.catch_id = c.id
      ) AS rating_summary ON true
      WHERE c.deleted_at IS NULL
        AND (p_venue_id IS NULL OR c.venue_id = p_venue_id)
        AND (p_session_id IS NULL OR c.session_id = p_session_id)
        AND (
          v_species = 'all'
          OR (v_species = 'other'
              AND c.species = 'other'
              AND (v_custom_species IS NULL
                OR lower(c.conditions->'customFields'->>'species') LIKE v_custom_species || '%'))
          OR (v_species <> 'other' AND v_species <> 'all' AND c.species = v_species)
        )
        AND (
          v_scope <> 'following'
          OR (
            auth.uid() IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM public.profile_follows pf
              WHERE pf.follower_id = auth.uid()
                AND pf.following_id = c.user_id
            )
          )
        )
    )
    SELECT
      b.id,
      b.title,
      b.image_url,
      b.user_id,
      b.location,
      b.species,
      b.weight,
      b.weight_unit,
      b.visibility,
      b.hide_exact_spot,
      b.conditions,
      b.created_at,
      b.session_id,
      (
        SELECT to_jsonb(p_sub.*)
        FROM (
          SELECT p.username, p.avatar_path, p.avatar_url
          FROM public.profiles p
          WHERE p.id = b.user_id
        ) AS p_sub
      ) AS profiles,
      (
        SELECT coalesce(jsonb_agg(jsonb_build_object('rating', r.rating)), '[]'::jsonb)
        FROM public.ratings r
        WHERE r.catch_id = b.id
      ) AS ratings,
      (
        SELECT coalesce(jsonb_agg(jsonb_build_object('id', cc.id)), '[]'::jsonb)
        FROM public.catch_comments cc
        WHERE cc.catch_id = b.id AND cc.deleted_at IS NULL
      ) AS comments,
      (
        SELECT coalesce(jsonb_agg(jsonb_build_object('user_id', cr.user_id)), '[]'::jsonb)
        FROM public.catch_reactions cr
        WHERE cr.catch_id = b.id
      ) AS reactions,
      (
        SELECT to_jsonb(v_sub.*)
        FROM (
          SELECT v.id, v.slug, v.name
          FROM public.venues v
          WHERE v.id = b.venue_id
        ) AS v_sub
      ) AS venues,
      b.avg_rating,
      b.rating_count
    FROM base b
    ORDER BY
      CASE WHEN v_sort = 'highest_rated' THEN b.avg_rating END DESC NULLS LAST,
      CASE WHEN v_sort = 'highest_rated' THEN b.rating_count END DESC NULLS LAST,
      CASE WHEN v_sort = 'heaviest' THEN b.weight END DESC NULLS LAST,
      CASE WHEN v_sort = 'newest' THEN b.created_at END DESC,
      b.created_at DESC,
      b.id DESC
    LIMIT v_limit
    OFFSET v_offset;
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_feed_catches"("p_limit" integer, "p_offset" integer, "p_scope" "text", "p_sort" "text", "p_species" "text", "p_custom_species" "text", "p_venue_id" "uuid", "p_session_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_feed_catches"("p_limit" integer, "p_offset" integer, "p_scope" "text", "p_sort" "text", "p_species" "text", "p_custom_species" "text", "p_venue_id" "uuid", "p_session_id" "uuid") IS 'Feed catches with server-side scope/species/sort. Privacy enforced by RLS.';



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


CREATE OR REPLACE FUNCTION "public"."get_venue_by_slug"("p_slug" "text") RETURNS TABLE("id" "uuid", "slug" "text", "name" "text", "location" "text", "description" "text", "is_published" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "short_tagline" "text", "ticket_type" "text", "price_from" "text", "best_for_tags" "text"[], "facilities" "text"[], "website_url" "text", "booking_url" "text", "booking_enabled" boolean, "contact_phone" "text", "payment_methods" "text"[], "payment_notes" "text", "notes_for_rr_team" "text", "total_catches" integer, "recent_catches_30d" integer, "active_anglers_all_time" integer, "active_anglers_30d" integer, "headline_pb_weight" numeric, "headline_pb_unit" "public"."weight_unit", "headline_pb_species" "text", "top_species" "text"[], "avg_rating" numeric, "rating_count" integer)
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
    v.booking_enabled,
    v.contact_phone,
    v.payment_methods,
    v.payment_notes,
    v.notes_for_rr_team,
    vs.total_catches,
    vs.recent_catches_30d,
    vs.active_anglers_all_time,
    vs.active_anglers_30d,
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



CREATE OR REPLACE FUNCTION "public"."get_venue_photos"("p_venue_id" "uuid", "p_limit" integer DEFAULT 12, "p_offset" integer DEFAULT 0) RETURNS SETOF "public"."venue_photos"
    LANGUAGE "sql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
  SELECT *
  FROM public.venue_photos
  WHERE venue_id = p_venue_id
  ORDER BY is_primary DESC, created_at DESC
  LIMIT LEAST(COALESCE(p_limit, 50), 100)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;


ALTER FUNCTION "public"."get_venue_photos"("p_venue_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_venue_photos"("p_venue_id" "uuid", "p_limit" integer, "p_offset" integer) IS 'Public: list venue photos for a given venue (primary first, then newest).';



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
    AND c.visibility = 'public'
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
    AND c.visibility = 'public'
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
  v_actor uuid := auth.uid();
  v_image_path text;
  v_expected_prefix text;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_image_path := ltrim(trim(coalesce(p_image_path, '')), '/');
  IF v_image_path = '' THEN
    RAISE EXCEPTION 'Invalid image path';
  END IF;
  IF position('..' in v_image_path) > 0 THEN
    RAISE EXCEPTION 'Invalid image path';
  END IF;
  v_expected_prefix := 'venue-photos/' || p_venue_id::text || '/';
  IF v_image_path NOT LIKE v_expected_prefix || '%' THEN
    RAISE EXCEPTION 'Invalid image path';
  END IF;

  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to add photos for this venue';
  END IF;

  INSERT INTO public.venue_photos (venue_id, image_path, caption, created_by)
  VALUES (p_venue_id, v_image_path, p_caption, v_actor)
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


CREATE OR REPLACE FUNCTION "public"."owner_create_venue_opening_hour"("p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean DEFAULT false, "p_order_index" integer DEFAULT 0) RETURNS "public"."venue_opening_hours"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_allowed boolean;
  v_row public.venue_opening_hours;
BEGIN
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to manage opening hours for this venue';
  END IF;

  INSERT INTO public.venue_opening_hours (
    venue_id,
    label,
    day_of_week,
    opens_at,
    closes_at,
    is_closed,
    order_index
  )
  VALUES (
    p_venue_id,
    p_label,
    p_day_of_week,
    p_opens_at,
    p_closes_at,
    COALESCE(p_is_closed, false),
    COALESCE(p_order_index, 0)
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;


ALTER FUNCTION "public"."owner_create_venue_opening_hour"("p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean, "p_order_index" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."owner_create_venue_opening_hour"("p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean, "p_order_index" integer) IS 'Owner/Admin: create an opening-hours row for a venue.';



CREATE OR REPLACE FUNCTION "public"."owner_create_venue_pricing_tier"("p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer DEFAULT 0) RETURNS "public"."venue_pricing_tiers"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_allowed boolean;
  v_row public.venue_pricing_tiers;
BEGIN
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to manage pricing tiers for this venue';
  END IF;

  INSERT INTO public.venue_pricing_tiers (
    venue_id,
    label,
    price,
    unit,
    audience,
    order_index
  )
  VALUES (
    p_venue_id,
    p_label,
    p_price,
    p_unit,
    p_audience,
    COALESCE(p_order_index, 0)
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;


ALTER FUNCTION "public"."owner_create_venue_pricing_tier"("p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."owner_create_venue_pricing_tier"("p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer) IS 'Owner/Admin: create a pricing tier (audience optional).';



CREATE OR REPLACE FUNCTION "public"."owner_create_venue_species_stock"("p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") RETURNS "public"."venue_species_stock"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_allowed boolean;
  v_row public.venue_species_stock;
BEGIN
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to manage species stock for this venue';
  END IF;

  INSERT INTO public.venue_species_stock (
    venue_id,
    species_name,
    record_weight,
    record_unit,
    avg_weight,
    size_range_min,
    size_range_max,
    stock_density,
    stock_notes
  )
  VALUES (
    p_venue_id,
    p_species_name,
    p_record_weight,
    p_record_unit,
    p_avg_weight,
    p_size_range_min,
    p_size_range_max,
    p_stock_density,
    p_stock_notes
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;


ALTER FUNCTION "public"."owner_create_venue_species_stock"("p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."owner_create_venue_species_stock"("p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") IS 'Owner/Admin: create a species stock row for a venue.';



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


CREATE OR REPLACE FUNCTION "public"."owner_delete_venue_opening_hour"("p_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_venue_id uuid;
BEGIN
  SELECT venue_id INTO v_venue_id FROM public.venue_opening_hours WHERE id = p_id;
  IF v_venue_id IS NULL THEN
    RAISE EXCEPTION 'Opening hour not found';
  END IF;

  IF NOT public.is_venue_admin_or_owner(v_venue_id) THEN
    RAISE EXCEPTION 'Not authorized to manage opening hours for this venue';
  END IF;

  DELETE FROM public.venue_opening_hours WHERE id = p_id;
END;
$$;


ALTER FUNCTION "public"."owner_delete_venue_opening_hour"("p_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."owner_delete_venue_opening_hour"("p_id" "uuid") IS 'Owner/Admin: delete an opening-hours row for a venue.';



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



CREATE OR REPLACE FUNCTION "public"."owner_delete_venue_pricing_tier"("p_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_venue_id uuid;
BEGIN
  SELECT venue_id INTO v_venue_id FROM public.venue_pricing_tiers WHERE id = p_id;
  IF v_venue_id IS NULL THEN
    RAISE EXCEPTION 'Pricing tier not found';
  END IF;

  IF NOT public.is_venue_admin_or_owner(v_venue_id) THEN
    RAISE EXCEPTION 'Not authorized to manage pricing tiers for this venue';
  END IF;

  DELETE FROM public.venue_pricing_tiers WHERE id = p_id;
END;
$$;


ALTER FUNCTION "public"."owner_delete_venue_pricing_tier"("p_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."owner_delete_venue_pricing_tier"("p_id" "uuid") IS 'Owner/Admin: delete a pricing tier for a venue.';



CREATE OR REPLACE FUNCTION "public"."owner_delete_venue_species_stock"("p_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_venue_id uuid;
BEGIN
  SELECT venue_id INTO v_venue_id FROM public.venue_species_stock WHERE id = p_id;
  IF v_venue_id IS NULL THEN
    RAISE EXCEPTION 'Species stock row not found';
  END IF;

  IF NOT public.is_venue_admin_or_owner(v_venue_id) THEN
    RAISE EXCEPTION 'Not authorized to manage species stock for this venue';
  END IF;

  DELETE FROM public.venue_species_stock WHERE id = p_id;
END;
$$;


ALTER FUNCTION "public"."owner_delete_venue_species_stock"("p_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."owner_delete_venue_species_stock"("p_id" "uuid") IS 'Owner/Admin: delete a species stock row for a venue.';



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


CREATE OR REPLACE FUNCTION "public"."owner_set_venue_photo_primary"("p_photo_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_venue_id uuid;
BEGIN
  SELECT venue_id INTO v_venue_id
  FROM public.venue_photos
  WHERE id = p_photo_id;

  IF v_venue_id IS NULL THEN
    RAISE EXCEPTION 'Photo not found';
  END IF;

  IF NOT public.is_venue_admin_or_owner(v_venue_id) THEN
    RAISE EXCEPTION 'Not authorized to update this venue photo';
  END IF;

  UPDATE public.venue_photos
  SET is_primary = false
  WHERE venue_id = v_venue_id;

  UPDATE public.venue_photos
  SET is_primary = true
  WHERE id = p_photo_id;
END;
$$;


ALTER FUNCTION "public"."owner_set_venue_photo_primary"("p_photo_id" "uuid") OWNER TO "postgres";


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
    "notes_for_rr_team" "text",
    "booking_enabled" boolean DEFAULT true NOT NULL,
    "payment_methods" "text"[],
    "payment_notes" "text"
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



COMMENT ON COLUMN "public"."venues"."booking_enabled" IS 'Owner-controlled booking toggle for public UI.';



COMMENT ON COLUMN "public"."venues"."payment_methods" IS 'Accepted payment methods for the venue (e.g., cash, card, bank_transfer).';



COMMENT ON COLUMN "public"."venues"."payment_notes" IS 'Free-form payment notes shown to users (e.g., cash only on bank).';



CREATE OR REPLACE FUNCTION "public"."owner_update_venue_booking"("p_venue_id" "uuid", "p_booking_enabled" boolean) RETURNS "public"."venues"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_allowed boolean;
  v_row public.venues;
BEGIN
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to update this venue';
  END IF;

  UPDATE public.venues
  SET
    booking_enabled = COALESCE(p_booking_enabled, booking_enabled),
    updated_at = now()
  WHERE id = p_venue_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;


ALTER FUNCTION "public"."owner_update_venue_booking"("p_venue_id" "uuid", "p_booking_enabled" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."owner_update_venue_booking"("p_venue_id" "uuid", "p_booking_enabled" boolean) IS 'Owner/Admin: update venue booking_enabled flag.';



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


CREATE OR REPLACE FUNCTION "public"."owner_update_venue_metadata"("p_venue_id" "uuid", "p_tagline" "text", "p_description" "text", "p_ticket_type" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_price_from" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_payment_methods" "text"[], "p_payment_notes" "text") RETURNS "public"."venues"
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
    payment_methods = p_payment_methods,
    payment_notes = p_payment_notes,
    updated_at = now()
  where id = p_venue_id
  returning * into v_row;

  return v_row;
end;
$$;


ALTER FUNCTION "public"."owner_update_venue_metadata"("p_venue_id" "uuid", "p_tagline" "text", "p_description" "text", "p_ticket_type" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_price_from" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_payment_methods" "text"[], "p_payment_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."owner_update_venue_opening_hour"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean, "p_order_index" integer) RETURNS "public"."venue_opening_hours"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_allowed boolean;
  v_row public.venue_opening_hours;
BEGIN
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to manage opening hours for this venue';
  END IF;

  UPDATE public.venue_opening_hours
  SET
    label = p_label,
    day_of_week = p_day_of_week,
    opens_at = p_opens_at,
    closes_at = p_closes_at,
    is_closed = COALESCE(p_is_closed, false),
    order_index = COALESCE(p_order_index, 0),
    updated_at = now()
  WHERE id = p_id
    AND venue_id = p_venue_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;


ALTER FUNCTION "public"."owner_update_venue_opening_hour"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean, "p_order_index" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."owner_update_venue_opening_hour"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean, "p_order_index" integer) IS 'Owner/Admin: update an opening-hours row for a venue.';



CREATE OR REPLACE FUNCTION "public"."owner_update_venue_pricing_tier"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer) RETURNS "public"."venue_pricing_tiers"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_allowed boolean;
  v_row public.venue_pricing_tiers;
BEGIN
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to manage pricing tiers for this venue';
  END IF;

  UPDATE public.venue_pricing_tiers
  SET
    label = p_label,
    price = p_price,
    unit = p_unit,
    audience = p_audience,
    order_index = COALESCE(p_order_index, 0),
    updated_at = now()
  WHERE id = p_id
    AND venue_id = p_venue_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;


ALTER FUNCTION "public"."owner_update_venue_pricing_tier"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."owner_update_venue_pricing_tier"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer) IS 'Owner/Admin: update a pricing tier (audience optional).';



CREATE OR REPLACE FUNCTION "public"."owner_update_venue_rules"("p_venue_id" "uuid", "p_rules_text" "text") RETURNS "public"."venue_rules"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_allowed boolean;
  v_row public.venue_rules;
BEGIN
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to update rules for this venue';
  END IF;

  INSERT INTO public.venue_rules (venue_id, rules_text, created_at, updated_at)
  VALUES (p_venue_id, p_rules_text, now(), now())
  ON CONFLICT (venue_id)
  DO UPDATE SET
    rules_text = EXCLUDED.rules_text,
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;


ALTER FUNCTION "public"."owner_update_venue_rules"("p_venue_id" "uuid", "p_rules_text" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."owner_update_venue_rules"("p_venue_id" "uuid", "p_rules_text" "text") IS 'Owner/Admin: upsert venue rules (single text blob).';



CREATE OR REPLACE FUNCTION "public"."owner_update_venue_species_stock"("p_id" "uuid", "p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") RETURNS "public"."venue_species_stock"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_allowed boolean;
  v_row public.venue_species_stock;
BEGIN
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to manage species stock for this venue';
  END IF;

  UPDATE public.venue_species_stock
  SET
    species_name = p_species_name,
    record_weight = p_record_weight,
    record_unit = p_record_unit,
    avg_weight = p_avg_weight,
    size_range_min = p_size_range_min,
    size_range_max = p_size_range_max,
    stock_density = p_stock_density,
    stock_notes = p_stock_notes,
    updated_at = now()
  WHERE id = p_id
    AND venue_id = p_venue_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;


ALTER FUNCTION "public"."owner_update_venue_species_stock"("p_id" "uuid", "p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."owner_update_venue_species_stock"("p_id" "uuid", "p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") IS 'Owner/Admin: update a species stock row for a venue.';



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
            ("count"(DISTINCT "c"."user_id") FILTER (WHERE ("c"."user_id" IS NOT NULL)))::integer AS "active_anglers_all_time",
            ("count"(DISTINCT "c"."user_id") FILTER (WHERE (("c"."user_id" IS NOT NULL) AND ("c"."created_at" >= ("now"() - '30 days'::interval)))))::integer AS "active_anglers_30d",
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
    "b"."active_anglers_all_time",
    "b"."active_anglers_30d",
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


COMMENT ON VIEW "public"."venue_stats" IS 'Aggregated venue metrics for cards/heroes (counts, recent activity, PB, top species, ratings, active anglers). Aggregates visible catches with venue_id; per-catch privacy is not exposed here.';



CREATE TABLE IF NOT EXISTS "public"."water_types" (
    "code" "text" NOT NULL,
    "label" "text" NOT NULL,
    "group_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."water_types" OWNER TO "postgres";


ALTER TABLE ONLY "public"."rate_limits" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."rate_limits_id_seq"'::"regclass");



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



ALTER TABLE ONLY "public"."venue_opening_hours"
    ADD CONSTRAINT "venue_opening_hours_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venue_owners"
    ADD CONSTRAINT "venue_owners_pkey" PRIMARY KEY ("venue_id", "user_id");



ALTER TABLE ONLY "public"."venue_photos"
    ADD CONSTRAINT "venue_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venue_pricing_tiers"
    ADD CONSTRAINT "venue_pricing_tiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venue_ratings"
    ADD CONSTRAINT "venue_ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venue_ratings"
    ADD CONSTRAINT "venue_ratings_venue_id_user_id_key" UNIQUE ("venue_id", "user_id");



ALTER TABLE ONLY "public"."venue_rules"
    ADD CONSTRAINT "venue_rules_pkey" PRIMARY KEY ("venue_id");



ALTER TABLE ONLY "public"."venue_species_stock"
    ADD CONSTRAINT "venue_species_stock_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."water_types"
    ADD CONSTRAINT "water_types_pkey" PRIMARY KEY ("code");



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



CREATE INDEX "idx_venue_opening_hours_venue_id" ON "public"."venue_opening_hours" USING "btree" ("venue_id");



CREATE INDEX "idx_venue_opening_hours_venue_order" ON "public"."venue_opening_hours" USING "btree" ("venue_id", "order_index");



CREATE INDEX "idx_venue_owners_user_id" ON "public"."venue_owners" USING "btree" ("user_id");



CREATE INDEX "idx_venue_owners_venue_id" ON "public"."venue_owners" USING "btree" ("venue_id");



CREATE INDEX "idx_venue_photos_venue_primary_created" ON "public"."venue_photos" USING "btree" ("venue_id", "is_primary" DESC, "created_at" DESC);



CREATE INDEX "idx_venue_pricing_tiers_venue_id" ON "public"."venue_pricing_tiers" USING "btree" ("venue_id");



CREATE INDEX "idx_venue_pricing_tiers_venue_order" ON "public"."venue_pricing_tiers" USING "btree" ("venue_id", "order_index");



CREATE INDEX "idx_venue_species_stock_venue_created" ON "public"."venue_species_stock" USING "btree" ("venue_id", "created_at");



CREATE INDEX "idx_venue_species_stock_venue_id" ON "public"."venue_species_stock" USING "btree" ("venue_id");



CREATE INDEX "idx_venues_is_published" ON "public"."venues" USING "btree" ("is_published");



CREATE INDEX "idx_venues_name" ON "public"."venues" USING "btree" ("name");



CREATE INDEX "idx_venues_slug" ON "public"."venues" USING "btree" ("slug");



CREATE UNIQUE INDEX "uq_catch_reactions_user_catch" ON "public"."catch_reactions" USING "btree" ("user_id", "catch_id");



CREATE UNIQUE INDEX "uq_profile_follows_pair" ON "public"."profile_follows" USING "btree" ("follower_id", "following_id");



CREATE UNIQUE INDEX "uq_ratings_user_catch" ON "public"."ratings" USING "btree" ("user_id", "catch_id");



CREATE UNIQUE INDEX "venue_photos_primary_unique" ON "public"."venue_photos" USING "btree" ("venue_id") WHERE "is_primary";



CREATE INDEX "venue_ratings_user_venue_idx" ON "public"."venue_ratings" USING "btree" ("user_id", "venue_id");



CREATE INDEX "venue_ratings_venue_id_idx" ON "public"."venue_ratings" USING "btree" ("venue_id");



CREATE OR REPLACE TRIGGER "enforce_catch_rate_limit_trigger" BEFORE INSERT ON "public"."catches" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_catch_rate_limit"();



CREATE OR REPLACE TRIGGER "enforce_comment_rate_limit_trigger" BEFORE INSERT ON "public"."catch_comments" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_comment_rate_limit"();



CREATE OR REPLACE TRIGGER "enforce_report_rate_limit_trigger" BEFORE INSERT ON "public"."reports" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_report_rate_limit"();



CREATE OR REPLACE TRIGGER "trg_catch_comments_set_updated_at" BEFORE UPDATE ON "public"."catch_comments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_catches_set_updated_at" BEFORE UPDATE ON "public"."catches" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_enforce_catch_moderation" BEFORE INSERT ON "public"."catches" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_catch_moderation"();



CREATE OR REPLACE TRIGGER "trg_profiles_set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_sessions_set_updated_at" BEFORE UPDATE ON "public"."sessions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_venue_opening_hours_set_updated_at" BEFORE UPDATE ON "public"."venue_opening_hours" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_venue_pricing_tiers_set_updated_at" BEFORE UPDATE ON "public"."venue_pricing_tiers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_venue_rules_set_updated_at" BEFORE UPDATE ON "public"."venue_rules" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_venue_species_stock_set_updated_at" BEFORE UPDATE ON "public"."venue_species_stock" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



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



ALTER TABLE ONLY "public"."venue_opening_hours"
    ADD CONSTRAINT "venue_opening_hours_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_owners"
    ADD CONSTRAINT "venue_owners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_owners"
    ADD CONSTRAINT "venue_owners_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_photos"
    ADD CONSTRAINT "venue_photos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."venue_photos"
    ADD CONSTRAINT "venue_photos_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_pricing_tiers"
    ADD CONSTRAINT "venue_pricing_tiers_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_ratings"
    ADD CONSTRAINT "venue_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."venue_ratings"
    ADD CONSTRAINT "venue_ratings_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id");



ALTER TABLE ONLY "public"."venue_rules"
    ADD CONSTRAINT "venue_rules_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_species_stock"
    ADD CONSTRAINT "venue_species_stock_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



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



ALTER TABLE "public"."venue_opening_hours" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "venue_opening_hours_delete" ON "public"."venue_opening_hours" FOR DELETE TO "authenticated" USING ("public"."is_venue_admin_or_owner"("venue_id"));



CREATE POLICY "venue_opening_hours_insert" ON "public"."venue_opening_hours" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_venue_admin_or_owner"("venue_id"));



CREATE POLICY "venue_opening_hours_select" ON "public"."venue_opening_hours" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."venues" "v"
  WHERE (("v"."id" = "venue_opening_hours"."venue_id") AND ("v"."is_published" OR "public"."is_venue_admin_or_owner"("v"."id"))))));



CREATE POLICY "venue_opening_hours_update" ON "public"."venue_opening_hours" FOR UPDATE TO "authenticated" USING ("public"."is_venue_admin_or_owner"("venue_id")) WITH CHECK ("public"."is_venue_admin_or_owner"("venue_id"));



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



CREATE POLICY "venue_photos_update" ON "public"."venue_photos" FOR UPDATE TO "authenticated" USING ("public"."is_venue_admin_or_owner"("venue_id")) WITH CHECK ("public"."is_venue_admin_or_owner"("venue_id"));



ALTER TABLE "public"."venue_pricing_tiers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "venue_pricing_tiers_delete" ON "public"."venue_pricing_tiers" FOR DELETE TO "authenticated" USING ("public"."is_venue_admin_or_owner"("venue_id"));



CREATE POLICY "venue_pricing_tiers_insert" ON "public"."venue_pricing_tiers" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_venue_admin_or_owner"("venue_id"));



CREATE POLICY "venue_pricing_tiers_select" ON "public"."venue_pricing_tiers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."venues" "v"
  WHERE (("v"."id" = "venue_pricing_tiers"."venue_id") AND ("v"."is_published" OR "public"."is_venue_admin_or_owner"("v"."id"))))));



CREATE POLICY "venue_pricing_tiers_update" ON "public"."venue_pricing_tiers" FOR UPDATE TO "authenticated" USING ("public"."is_venue_admin_or_owner"("venue_id")) WITH CHECK ("public"."is_venue_admin_or_owner"("venue_id"));



ALTER TABLE "public"."venue_ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."venue_rules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "venue_rules_delete" ON "public"."venue_rules" FOR DELETE TO "authenticated" USING ("public"."is_venue_admin_or_owner"("venue_id"));



CREATE POLICY "venue_rules_insert" ON "public"."venue_rules" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_venue_admin_or_owner"("venue_id"));



CREATE POLICY "venue_rules_select" ON "public"."venue_rules" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."venues" "v"
  WHERE (("v"."id" = "venue_rules"."venue_id") AND ("v"."is_published" OR "public"."is_venue_admin_or_owner"("v"."id"))))));



CREATE POLICY "venue_rules_update" ON "public"."venue_rules" FOR UPDATE TO "authenticated" USING ("public"."is_venue_admin_or_owner"("venue_id")) WITH CHECK ("public"."is_venue_admin_or_owner"("venue_id"));



ALTER TABLE "public"."venue_species_stock" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "venue_species_stock_delete" ON "public"."venue_species_stock" FOR DELETE TO "authenticated" USING ("public"."is_venue_admin_or_owner"("venue_id"));



CREATE POLICY "venue_species_stock_insert" ON "public"."venue_species_stock" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_venue_admin_or_owner"("venue_id"));



CREATE POLICY "venue_species_stock_select" ON "public"."venue_species_stock" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."venues" "v"
  WHERE (("v"."id" = "venue_species_stock"."venue_id") AND ("v"."is_published" OR "public"."is_venue_admin_or_owner"("v"."id"))))));



CREATE POLICY "venue_species_stock_update" ON "public"."venue_species_stock" FOR UPDATE TO "authenticated" USING ("public"."is_venue_admin_or_owner"("venue_id")) WITH CHECK ("public"."is_venue_admin_or_owner"("venue_id"));



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





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






































































































































































































































































































GRANT ALL ON FUNCTION "public"."admin_add_venue_owner"("p_venue_id" "uuid", "p_user_id" "uuid", "p_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_add_venue_owner"("p_venue_id" "uuid", "p_user_id" "uuid", "p_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_add_venue_owner"("p_venue_id" "uuid", "p_user_id" "uuid", "p_role" "text") TO "service_role";



GRANT ALL ON TABLE "public"."venue_photos" TO "anon";
GRANT ALL ON TABLE "public"."venue_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_photos" TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_add_venue_photo"("p_venue_id" "uuid", "p_image_path" "text", "p_caption" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_add_venue_photo"("p_venue_id" "uuid", "p_image_path" "text", "p_caption" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_add_venue_photo"("p_venue_id" "uuid", "p_image_path" "text", "p_caption" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_clear_moderation_status"("p_user_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_clear_moderation_status"("p_user_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_clear_moderation_status"("p_user_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_create_venue_event"("p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_is_published" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_create_venue_event"("p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_is_published" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_create_venue_event"("p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_is_published" boolean) TO "service_role";



GRANT ALL ON TABLE "public"."venue_opening_hours" TO "anon";
GRANT ALL ON TABLE "public"."venue_opening_hours" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_opening_hours" TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_create_venue_opening_hour"("p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean, "p_order_index" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_create_venue_opening_hour"("p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean, "p_order_index" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_create_venue_opening_hour"("p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean, "p_order_index" integer) TO "service_role";



GRANT ALL ON TABLE "public"."venue_pricing_tiers" TO "anon";
GRANT ALL ON TABLE "public"."venue_pricing_tiers" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_pricing_tiers" TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_create_venue_pricing_tier"("p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_create_venue_pricing_tier"("p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_create_venue_pricing_tier"("p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer) TO "service_role";



GRANT ALL ON TABLE "public"."venue_species_stock" TO "anon";
GRANT ALL ON TABLE "public"."venue_species_stock" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_species_stock" TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_create_venue_species_stock"("p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_create_venue_species_stock"("p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_create_venue_species_stock"("p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") TO "service_role";



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



GRANT ALL ON FUNCTION "public"."admin_delete_venue_opening_hour"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_delete_venue_opening_hour"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_delete_venue_opening_hour"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_delete_venue_photo"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_delete_venue_photo"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_delete_venue_photo"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_delete_venue_pricing_tier"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_delete_venue_pricing_tier"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_delete_venue_pricing_tier"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_delete_venue_species_stock"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_delete_venue_species_stock"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_delete_venue_species_stock"("p_id" "uuid") TO "service_role";



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



GRANT ALL ON FUNCTION "public"."admin_set_venue_photo_primary"("p_photo_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_set_venue_photo_primary"("p_photo_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_set_venue_photo_primary"("p_photo_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_report_status"("p_report_id" "uuid", "p_status" "text", "p_resolution_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_report_status"("p_report_id" "uuid", "p_status" "text", "p_resolution_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_report_status"("p_report_id" "uuid", "p_status" "text", "p_resolution_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_venue_booking"("p_venue_id" "uuid", "p_booking_enabled" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_venue_booking"("p_venue_id" "uuid", "p_booking_enabled" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_venue_booking"("p_venue_id" "uuid", "p_booking_enabled" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_venue_event"("p_event_id" "uuid", "p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_is_published" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_venue_event"("p_event_id" "uuid", "p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_is_published" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_venue_event"("p_event_id" "uuid", "p_venue_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_is_published" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_venue_metadata"("p_venue_id" "uuid", "p_short_tagline" "text", "p_ticket_type" "text", "p_price_from" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_notes_for_rr_team" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_venue_metadata"("p_venue_id" "uuid", "p_short_tagline" "text", "p_ticket_type" "text", "p_price_from" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_notes_for_rr_team" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_venue_metadata"("p_venue_id" "uuid", "p_short_tagline" "text", "p_ticket_type" "text", "p_price_from" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_notes_for_rr_team" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_venue_metadata"("p_venue_id" "uuid", "p_short_tagline" "text", "p_description" "text", "p_ticket_type" "text", "p_price_from" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_notes_for_rr_team" "text", "p_payment_methods" "text"[], "p_payment_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_venue_metadata"("p_venue_id" "uuid", "p_short_tagline" "text", "p_description" "text", "p_ticket_type" "text", "p_price_from" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_notes_for_rr_team" "text", "p_payment_methods" "text"[], "p_payment_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_venue_metadata"("p_venue_id" "uuid", "p_short_tagline" "text", "p_description" "text", "p_ticket_type" "text", "p_price_from" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_notes_for_rr_team" "text", "p_payment_methods" "text"[], "p_payment_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_venue_opening_hour"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean, "p_order_index" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_venue_opening_hour"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean, "p_order_index" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_venue_opening_hour"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean, "p_order_index" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_venue_pricing_tier"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_venue_pricing_tier"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_venue_pricing_tier"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer) TO "service_role";



GRANT ALL ON TABLE "public"."venue_rules" TO "anon";
GRANT ALL ON TABLE "public"."venue_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_rules" TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_venue_rules"("p_venue_id" "uuid", "p_rules_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_venue_rules"("p_venue_id" "uuid", "p_rules_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_venue_rules"("p_venue_id" "uuid", "p_rules_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_venue_species_stock"("p_id" "uuid", "p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_venue_species_stock"("p_id" "uuid", "p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_venue_species_stock"("p_id" "uuid", "p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") TO "service_role";



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



GRANT ALL ON FUNCTION "public"."get_feed_catches"("p_limit" integer, "p_offset" integer, "p_scope" "text", "p_sort" "text", "p_species" "text", "p_custom_species" "text", "p_venue_id" "uuid", "p_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_feed_catches"("p_limit" integer, "p_offset" integer, "p_scope" "text", "p_sort" "text", "p_species" "text", "p_custom_species" "text", "p_venue_id" "uuid", "p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_feed_catches"("p_limit" integer, "p_offset" integer, "p_scope" "text", "p_sort" "text", "p_species" "text", "p_custom_species" "text", "p_venue_id" "uuid", "p_session_id" "uuid") TO "service_role";



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



GRANT ALL ON FUNCTION "public"."owner_create_venue_opening_hour"("p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean, "p_order_index" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."owner_create_venue_opening_hour"("p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean, "p_order_index" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_create_venue_opening_hour"("p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean, "p_order_index" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_create_venue_pricing_tier"("p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."owner_create_venue_pricing_tier"("p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_create_venue_pricing_tier"("p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_create_venue_species_stock"("p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."owner_create_venue_species_stock"("p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_create_venue_species_stock"("p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_delete_venue_event"("p_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."owner_delete_venue_event"("p_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_delete_venue_event"("p_event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_delete_venue_opening_hour"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."owner_delete_venue_opening_hour"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_delete_venue_opening_hour"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_delete_venue_photo"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."owner_delete_venue_photo"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_delete_venue_photo"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_delete_venue_pricing_tier"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."owner_delete_venue_pricing_tier"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_delete_venue_pricing_tier"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_delete_venue_species_stock"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."owner_delete_venue_species_stock"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_delete_venue_species_stock"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_get_venue_events"("p_venue_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."owner_get_venue_events"("p_venue_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_get_venue_events"("p_venue_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_set_venue_photo_primary"("p_photo_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."owner_set_venue_photo_primary"("p_photo_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_set_venue_photo_primary"("p_photo_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."venues" TO "anon";
GRANT ALL ON TABLE "public"."venues" TO "authenticated";
GRANT ALL ON TABLE "public"."venues" TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_update_venue_booking"("p_venue_id" "uuid", "p_booking_enabled" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."owner_update_venue_booking"("p_venue_id" "uuid", "p_booking_enabled" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_update_venue_booking"("p_venue_id" "uuid", "p_booking_enabled" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_update_venue_event"("p_event_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_is_published" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."owner_update_venue_event"("p_event_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_is_published" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_update_venue_event"("p_event_id" "uuid", "p_title" "text", "p_event_type" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_description" "text", "p_ticket_info" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_is_published" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_update_venue_metadata"("p_venue_id" "uuid", "p_tagline" "text", "p_description" "text", "p_ticket_type" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_price_from" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_payment_methods" "text"[], "p_payment_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."owner_update_venue_metadata"("p_venue_id" "uuid", "p_tagline" "text", "p_description" "text", "p_ticket_type" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_price_from" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_payment_methods" "text"[], "p_payment_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_update_venue_metadata"("p_venue_id" "uuid", "p_tagline" "text", "p_description" "text", "p_ticket_type" "text", "p_best_for_tags" "text"[], "p_facilities" "text"[], "p_price_from" "text", "p_website_url" "text", "p_booking_url" "text", "p_contact_phone" "text", "p_payment_methods" "text"[], "p_payment_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_update_venue_opening_hour"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean, "p_order_index" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."owner_update_venue_opening_hour"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean, "p_order_index" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_update_venue_opening_hour"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_day_of_week" smallint, "p_opens_at" time without time zone, "p_closes_at" time without time zone, "p_is_closed" boolean, "p_order_index" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_update_venue_pricing_tier"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."owner_update_venue_pricing_tier"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_update_venue_pricing_tier"("p_id" "uuid", "p_venue_id" "uuid", "p_label" "text", "p_price" "text", "p_unit" "text", "p_audience" "public"."venue_pricing_audience", "p_order_index" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_update_venue_rules"("p_venue_id" "uuid", "p_rules_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."owner_update_venue_rules"("p_venue_id" "uuid", "p_rules_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_update_venue_rules"("p_venue_id" "uuid", "p_rules_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."owner_update_venue_species_stock"("p_id" "uuid", "p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."owner_update_venue_species_stock"("p_id" "uuid", "p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owner_update_venue_species_stock"("p_id" "uuid", "p_venue_id" "uuid", "p_species_name" "text", "p_record_weight" numeric, "p_record_unit" "text", "p_avg_weight" numeric, "p_size_range_min" numeric, "p_size_range_max" numeric, "p_stock_density" "public"."venue_stock_density", "p_stock_notes" "text") TO "service_role";



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































