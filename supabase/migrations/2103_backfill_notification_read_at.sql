-- 2103_backfill_notification_read_at.sql
-- Backfill read_at for notifications already marked as read.

SET search_path = public, extensions;

-- Set read_at for rows that are already marked read but have no timestamp.
-- Safe to run multiple times; subsequent runs will no-op.
UPDATE public.notifications
SET read_at = COALESCE(read_at, created_at)
WHERE is_read = TRUE
  AND read_at IS NULL;
