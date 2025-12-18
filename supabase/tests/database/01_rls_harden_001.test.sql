-- pgTAP tests for RLS-HARDEN-001 (catches/comments/reactions/ratings).
-- Run with: supabase test db supabase/tests/database/01_rls_harden_001.test.sql

SET search_path = public, extensions;

-- pgTAP tests should run inside an explicit transaction.
-- (Supabase docs/examples run: BEGIN; ... finish(); ROLLBACK;)
BEGIN;

SELECT plan(24);

-- IDs for reuse (fixed UUIDs so tests are deterministic)
CREATE TEMP TABLE ids (
  uid_a uuid,
  uid_b uuid,
  uid_c uuid,
  uid_d uuid,
  uid_admin uuid,
  catch_pub uuid,
  catch_fol uuid,
  catch_pri uuid
);

INSERT INTO ids (uid_a, uid_b, uid_c, uid_d, uid_admin, catch_pub, catch_fol, catch_pri)
VALUES (
  '00000000-0000-0000-0000-00000000000a'::uuid,
  '00000000-0000-0000-0000-00000000000b'::uuid,
  '00000000-0000-0000-0000-00000000000c'::uuid,
  '00000000-0000-0000-0000-00000000000d'::uuid,
  '00000000-0000-0000-0000-0000000000aa'::uuid,
  '00000000-0000-0000-0000-00000000010a'::uuid,
  '00000000-0000-0000-0000-00000000010b'::uuid,
  '00000000-0000-0000-0000-00000000010c'::uuid
);

-- Helpers to impersonate (pg_temp so nothing persists)
CREATE OR REPLACE FUNCTION pg_temp.set_viewer(p_id uuid, p_role text) RETURNS void AS $$
BEGIN
  IF p_role = 'anon' THEN
    PERFORM set_config('request.jwt.claim.sub', '', true);
    PERFORM set_config('request.jwt.claim.role', 'anon', true);
    EXECUTE 'SET LOCAL ROLE anon';
  ELSE
    PERFORM set_config('request.jwt.claim.sub', p_id::text, true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
    EXECUTE 'SET LOCAL ROLE authenticated';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Seed deterministic fixtures
INSERT INTO public.profiles (id, username) SELECT uid_a, 'userA' FROM ids ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, username) SELECT uid_b, 'userB' FROM ids ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, username) SELECT uid_c, 'userC' FROM ids ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, username) SELECT uid_d, 'userD' FROM ids ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, username) SELECT uid_admin, 'adminUser' FROM ids ON CONFLICT (id) DO NOTHING;

INSERT INTO public.admin_users (user_id) SELECT uid_admin FROM ids ON CONFLICT DO NOTHING;
INSERT INTO public.profile_follows (follower_id, following_id) SELECT uid_b, uid_a FROM ids ON CONFLICT DO NOTHING; -- B follows A
INSERT INTO public.profile_blocks  (blocker_id, blocked_id)   SELECT uid_a, uid_d FROM ids ON CONFLICT DO NOTHING; -- A blocks D

-- Catches owned by A
INSERT INTO public.catches (id, user_id, title, visibility, allow_ratings, created_at)
SELECT catch_pub, uid_a, 'Public catch', 'public', true, now() FROM ids
ON CONFLICT DO NOTHING;

INSERT INTO public.catches (id, user_id, title, visibility, allow_ratings, created_at)
SELECT catch_fol, uid_a, 'Followers catch', 'followers', true, now() FROM ids
ON CONFLICT DO NOTHING;

INSERT INTO public.catches (id, user_id, title, visibility, allow_ratings, created_at)
SELECT catch_pri, uid_a, 'Private catch', 'private', true, now() FROM ids
ON CONFLICT DO NOTHING;

-- 1) Catch read matrix
SELECT pg_temp.set_viewer(uid_b, 'auth') FROM ids;
SELECT is((SELECT count(*) FROM public.catches WHERE id = catch_pub), 1::bigint, 'B reads public catch') FROM ids;
SELECT is((SELECT count(*) FROM public.catches WHERE id = catch_fol), 1::bigint, 'B reads followers catch') FROM ids;
SELECT is((SELECT count(*) FROM public.catches WHERE id = catch_pri), 0::bigint, 'B cannot read private catch') FROM ids;

SELECT pg_temp.set_viewer(uid_c, 'auth') FROM ids;
SELECT is((SELECT count(*) FROM public.catches WHERE id = catch_pub), 1::bigint, 'C reads public catch') FROM ids;
SELECT is((SELECT count(*) FROM public.catches WHERE id = catch_fol), 0::bigint, 'C cannot read followers catch') FROM ids;

SELECT pg_temp.set_viewer(uid_d, 'auth') FROM ids;
SELECT is((SELECT count(*) FROM public.catches WHERE id = catch_pub), 0::bigint, 'D (blocked) cannot read public catch') FROM ids;

SELECT pg_temp.set_viewer(NULL, 'anon');
SELECT is((SELECT count(*) FROM public.catches WHERE id = catch_pub), 1::bigint, 'Anon reads public catch') FROM ids;
SELECT is((SELECT count(*) FROM public.catches WHERE id = catch_fol), 0::bigint, 'Anon cannot read followers catch') FROM ids;

-- 2) Reaction/rating write: D blocked should fail on public catch
SELECT pg_temp.set_viewer(uid_d, 'auth') FROM ids;
SELECT throws_like(
  $$INSERT INTO public.catch_reactions (catch_id, user_id, reaction)
    VALUES ((SELECT catch_pub FROM ids), (SELECT uid_d FROM ids), 'like')$$,
  '%row-level security%',
  'D cannot react on public catch'
);

SELECT throws_like(
  $$INSERT INTO public.ratings (catch_id, user_id, rating)
    VALUES ((SELECT catch_pub FROM ids), (SELECT uid_d FROM ids), 7)$$,
  '%row-level security%',
  'D cannot rate public catch'
);

-- 3) Reaction/rating write: B follower allowed on public + followers, denied on private
SELECT pg_temp.set_viewer(uid_b, 'auth') FROM ids;

SELECT lives_ok(
  $$INSERT INTO public.catch_reactions (catch_id, user_id, reaction)
    VALUES ((SELECT catch_pub FROM ids), (SELECT uid_b FROM ids), 'like')$$,
  'B reacts on public catch'
);

SELECT lives_ok(
  $$INSERT INTO public.catch_reactions (catch_id, user_id, reaction)
    VALUES ((SELECT catch_fol FROM ids), (SELECT uid_b FROM ids), 'like')$$,
  'B reacts on followers catch'
);

SELECT throws_like(
  $$INSERT INTO public.catch_reactions (catch_id, user_id, reaction)
    VALUES ((SELECT catch_pri FROM ids), (SELECT uid_b FROM ids), 'like')$$,
  '%row-level security%',
  'B cannot react on private catch'
);

SELECT lives_ok(
  $$INSERT INTO public.ratings (catch_id, user_id, rating)
    VALUES ((SELECT catch_pub FROM ids), (SELECT uid_b FROM ids), 6)$$,
  'B rates public catch'
);

SELECT lives_ok(
  $$INSERT INTO public.ratings (catch_id, user_id, rating)
    VALUES ((SELECT catch_fol FROM ids), (SELECT uid_b FROM ids), 6)$$,
  'B rates followers catch'
);

SELECT throws_like(
  $$INSERT INTO public.ratings (catch_id, user_id, rating)
    VALUES ((SELECT catch_pri FROM ids), (SELECT uid_b FROM ids), 6)$$,
  '%row-level security%',
  'B cannot rate private catch'
);

-- 4) Rating summary RPC: denied viewers get 0 rows
SELECT pg_temp.set_viewer(uid_d, 'auth') FROM ids;
SELECT is((SELECT count(*) FROM public.get_catch_rating_summary((SELECT catch_pub FROM ids))), 0::bigint, 'D summary returns 0 rows');

SELECT pg_temp.set_viewer(uid_b, 'auth') FROM ids;
SELECT is((SELECT count(*) FROM public.get_catch_rating_summary((SELECT catch_fol FROM ids))), 1::bigint, 'B summary on followers returns 1 row');

SELECT pg_temp.set_viewer(uid_c, 'auth') FROM ids;
SELECT is((SELECT count(*) FROM public.get_catch_rating_summary((SELECT catch_fol FROM ids))), 0::bigint, 'C summary on followers returns 0 rows');

-- 5) Update path: D cannot modify B's rating; B can update own rating
SELECT pg_temp.set_viewer(uid_b, 'auth') FROM ids;
SELECT is((SELECT rating FROM public.ratings WHERE catch_id = catch_pub AND user_id = uid_b), 6, 'B baseline rating on public catch is 6') FROM ids;

SELECT pg_temp.set_viewer(uid_d, 'auth') FROM ids;
SELECT lives_ok(
  $$UPDATE public.ratings
      SET rating = 8
    WHERE catch_id = (SELECT catch_pub FROM ids)
      AND user_id  = (SELECT uid_b FROM ids)$$,
  'D UPDATE statement does not error (but should affect 0 rows)'
);

SELECT pg_temp.set_viewer(uid_b, 'auth') FROM ids;
SELECT is((SELECT rating FROM public.ratings WHERE catch_id = catch_pub AND user_id = uid_b), 6, 'D could not modify B rating (still 6)') FROM ids;

SELECT lives_ok(
  $$UPDATE public.ratings
      SET rating = 9
    WHERE catch_id = (SELECT catch_pub FROM ids)
      AND user_id  = (SELECT uid_b FROM ids)$$,
  'B can update rating on public catch'
);

SELECT is((SELECT rating FROM public.ratings WHERE catch_id = catch_pub AND user_id = uid_b), 9, 'B rating updated to 9') FROM ids;

SELECT * FROM finish();

ROLLBACK;
