-- 2041_mention_candidates_per_catch.sql
-- Purpose: expose mention candidates (owner + commenters) per catch.

SET search_path = public, extensions;

CREATE OR REPLACE VIEW public.catch_mention_candidates AS
WITH owner AS (
  SELECT
    c.id AS catch_id,
    p.id AS user_id,
    p.username,
    p.avatar_path,
    p.avatar_url,
    c.created_at AS last_interacted_at
  FROM public.catches c
  JOIN public.profiles p ON p.id = c.user_id
),
commenters AS (
  SELECT
    cc.catch_id,
    p.id AS user_id,
    p.username,
    p.avatar_path,
    p.avatar_url,
    cc.created_at AS last_interacted_at
  FROM public.catch_comments cc
  JOIN public.profiles p ON p.id = cc.user_id
)
SELECT
  catch_id,
  user_id,
  username,
  avatar_path,
  avatar_url,
  MAX(last_interacted_at) AS last_interacted_at
FROM (
  SELECT * FROM owner
  UNION ALL
  SELECT * FROM commenters
) combined
GROUP BY catch_id, user_id, username, avatar_path, avatar_url;
