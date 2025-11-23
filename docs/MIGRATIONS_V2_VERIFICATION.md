# Migrations V2 Verification

## How to run v2 migrations on a local/test DB (not main!)

1. Point Supabase CLI at the v2 folder:  
   `supabase db reset --migrations-dir supabase/migrations_v2`  
   (Run this only on a local test project/branch.)

2. Sanity checks with psql/SQL editor:  
   - `\dt public.*` should show profiles, admin_users, sessions, catches, catch_comments, catch_reactions, ratings, profile_follows, notifications, reports, user_warnings, moderation_log, rate_limits, baits, tags, water_types.  
   - `\df+ public.*` should include handle_new_user, updated_at helpers, set_normalized_location, refresh_leaderboard, and rate-limit helpers (check security definer and search_path).  
   - Triggers: on_auth_user_created (auth.users), enforce_* rate-limit triggers, normalized_location, updated_at triggers on profiles/sessions/catches.

3. Diff against main:  
   Link to a test project or use a local Postgres, then run:  
   `supabase db diff --linked` (or compare against full-main-dump.sql) to confirm no remaining drift.

## App-level checklist (using a DB created from migrations_v2)

- Email sign-up creates auth user + profile (handle_new_user grant works).  
- Google OAuth sign-in works (if testable locally; otherwise verify no errors in logs).  
- Creating a catch succeeds and appears in feed and leaderboard view.  
- Comments, reactions, ratings work and are rate-limited (exceed limits -> error).  
- Reports can be filed and read by the reporter; moderation log persists actions.  
- Notifications flow (new follower/comment/reaction) behaves as on MAIN.  
- Admin warnings/moderation actions still succeed (RPCs/functions available).  
- Leaderboard view returns only public, non-deleted catches.

## Safety notes

- Do **not** run `supabase db reset` against MAIN.  
- v2 migrations are additive and idempotent but should be proven on a new branch first.  
- Enable “Use Git migrations” when creating a Supabase branch; after creation run  
  `supabase migration list --migrations-dir supabase/migrations_v2` to confirm 1001+ applied.
