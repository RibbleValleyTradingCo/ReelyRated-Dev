-- 2030_notifications_constraint_reset.sql
-- Purpose: ensure comment notifications are not deduped; constraint includes catch/comment IDs.

SET search_path = public, extensions;

-- Drop existing constraint/index safely.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_notifications_like_follow_once'
      AND conrelid = 'public.notifications'::regclass
  ) THEN
    ALTER TABLE public.notifications
      DROP CONSTRAINT uq_notifications_like_follow_once;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'uq_notifications_like_follow_once'
  ) THEN
    EXECUTE 'DROP INDEX public.uq_notifications_like_follow_once';
  END IF;
END;
$$;

-- Recreate unique constraint including catch_id/comment_id to avoid dedupe on comments.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_notifications_like_follow_once'
      AND conrelid = 'public.notifications'::regclass
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT uq_notifications_like_follow_once
      UNIQUE (user_id, actor_id, type, catch_id, comment_id);
  END IF;
END;
$$;
