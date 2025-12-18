# RLS-HARDEN-001 – Runbook (Local Docker)

Use this checklist to run the RLS deep-pass for catches, comments, reactions, and ratings. It mirrors the viewer matrix (Owner A, Follower B, Stranger C, Blocked D, Admin, Anon) and includes the SQL/RPC snippets to run in the Supabase SQL editor.

## Test actors & fixtures (set up once)

- Users:
  - **A** – catch owner
  - **B** – follower of A
  - **C** – stranger (not following A)
  - **D** – blocked by A (row in `profile_blocks` where blocker_id = A, blocked_id = D)
  - **Admin** – in `public.admin_users`
- Catches owned by A:
  - `catch_pub` – `visibility = 'public'`
  - `catch_fol` – `visibility = 'followers'`
  - `catch_pri` – `visibility = 'private'`
- Optional: one comment by A on each catch for read/write tests.
- Ratings/reactions: start empty so you can see new rows per scenario.

## Impersonation helper (SQL editor)

To simulate each viewer, run before each scenario:

```sql
-- Run as ONE script (same transaction) so the claim settings apply to reads/writes.
BEGIN;

  -- auth.uid() = <viewer uuid>
  SET LOCAL ROLE authenticated;
  SELECT set_config('request.jwt.claim.sub', '<viewer-uuid>', true);
  SELECT set_config('request.jwt.claim.role', 'authenticated', true);
  -- NOTE: Replace <viewer-uuid> with a real UUID. Leaving placeholders like <VIEWER_UUID> will error (22P02).

  -- Sanity: confirm auth.uid() is set for this transaction
  SELECT auth.uid() AS uid;

  -- ...run your read/write statements here...

ROLLBACK;
```

For **admin**, set role claim to `service_role` or add the user to `admin_users`.  
For **anon**, skip the config and use `SET LOCAL ROLE anon;`.

## Core queries/RPCs to use

- Read catch:
  ```sql
  SELECT id, user_id, visibility FROM public.catches WHERE id = '<catch_id>';
  ```
- Catch facts (visibility + allow_ratings)

  **Note:** If you run this as the _viewer_ and the catch is not visible under RLS, you will get **0 rows** (and any derived “facts” will appear as `NULL`). To inspect facts reliably, run as **Owner A** or **Admin**.

  ```sql
  SELECT id, visibility, allow_ratings
  FROM public.catches
  WHERE id = '<catch_id>';
  ```

- Read comments:
  ```sql
  SELECT id, catch_id, user_id, deleted_at FROM public.catch_comments WHERE catch_id = '<catch_id>';
  ```
- Read reactions:
  ```sql
  SELECT user_id, catch_id FROM public.catch_reactions WHERE catch_id = '<catch_id>';
  ```
- Read ratings:
  ```sql
  SELECT user_id, catch_id, rating FROM public.ratings WHERE catch_id = '<catch_id>';
  ```
- Rating summary RPC (bypasses row-level on ratings but enforces catch visibility):
  ```sql
  SELECT * FROM public.get_catch_rating_summary('<catch_id>');
  ```
- Write comment:
  ```sql
  INSERT INTO public.catch_comments (catch_id, user_id, body)
  VALUES ('<catch_id>', auth.uid(), 'rls-harden-001 test')
  RETURNING id;
  ```
  ```sql
  -- NOTE: Use column-list conflict targets (NOT `ON CONFLICT ON CONSTRAINT ...`) because
  -- your schema may enforce uniqueness via a unique index rather than a named constraint.
  INSERT INTO public.catch_reactions (catch_id, user_id, reaction)
  VALUES ('<catch_id>', auth.uid(), 'like')
  ON CONFLICT (user_id, catch_id) DO UPDATE
    SET reaction = EXCLUDED.reaction, created_at = now()
  RETURNING user_id, catch_id;
  ```
  ```sql
  -- NOTE: Use column-list conflict targets (NOT `ON CONFLICT ON CONSTRAINT ...`) because
  -- your schema may enforce uniqueness via a unique index rather than a named constraint.
  INSERT INTO public.ratings (catch_id, user_id, rating)
  VALUES ('<catch_id>', auth.uid(), 7)
  ON CONFLICT (catch_id, user_id) DO UPDATE
    SET rating = EXCLUDED.rating, created_at = now()
  RETURNING user_id, catch_id, rating;
  ```

Expect `permission denied` errors when RLS blocks access; do **not** bypass with service_role for the viewer scenarios.

## Scenarios (run per actor)

For each viewer (A, B, C, D, Admin, Anon) and each catch visibility (public, followers, private), run the read/write queries above and note Allow/Deny:

1. **Catches: read access**

   - Public: A/B/C/Admin should read; D blocked; Anon allowed.
   - Followers: A/B/Admin should read; C/D/Anon denied.
   - Private: Only A/Admin should read; all others denied.

2. **Comments: read + write**

   - Read follows catch visibility (and block rules).
   - Write follows catch visibility and block rules; owners/admins allowed on their own; followers allowed on followers catch; strangers/blocked/anon denied.

3. **Reactions: write**

   - Same visibility rules as comments.

4. **Ratings: write + summary**

   - Write: same as comments, plus allow_ratings must be true.
   - Summary RPC: should return data only when viewer can see the catch; otherwise expect **0 rows** (post-2113 hardening). This is intentional (no exceptions/toasts for denied viewers).

5. **Blocked user (D)**

   - For any catch owned by A: all reads/writes denied (catches, comments, reactions, ratings, summary).

6. **Admin**

   - Should bypass visibility/blocks for reads.
   - Writes: allowed unless specifically restricted by policies.

7. **Anon**
   - Public catch: read allowed; writes denied.
   - Followers/private: read/write denied.

## Quick pass/fail log (fill in during run)

Use a simple grid (Allow/Deny) per combination; example:

| Viewer | catch_pub read | catch_fol read | catch_pri read | comment write (pub/fol/pri) | reaction write (pub/fol/pri) | rating write (pub/fol/pri) | rating summary (pub/fol/pri) |
| ------ | -------------- | -------------- | -------------- | --------------------------- | ---------------------------- | -------------------------- | ---------------------------- |
| A      | Allow          | Allow          | Allow          | Allow/Allow/Allow           | Allow/Allow/Allow            | Allow/Allow/Allow          | Allow/Allow/Allow            |
| B      | Allow          | Allow          | Deny           | Allow/Allow/Deny            | Allow/Allow/Deny             | Allow/Allow/Deny           | Allow/Allow/Deny             |
| C      | Allow          | Deny           | Deny           | Allow/Deny/Deny             | Allow/Deny/Deny              | Allow/Deny/Deny            | Allow/Deny/Deny              |
| D      | Deny           | Deny           | Deny           | Deny/Deny/Deny              | Deny/Deny/Deny               | Deny/Deny/Deny             | Deny/Deny/Deny               |
| Admin  | Allow          | Allow          | Allow          | Allow/Allow/Allow           | Allow/Allow/Allow            | Allow/Allow/Allow          | Allow/Allow/Allow            |
| Anon   | Allow          | Deny           | Deny           | Deny/Deny/Deny              | Deny/Deny/Deny               | Deny/Deny/Deny             | Allow/0 rows/0 rows          |

Record any deviations and raise new RLS bugs in `HARDENING-TEST-PLAN.md`.

## Interpreting results (0 rows vs errors)

- **0 rows on SELECT** usually means **RLS hid the row** for that viewer (expected for followers/private catches when the viewer isn’t allowed, and for blocked users).
- If a “facts” helper query returns `NULL`, it’s typically because the underlying `SELECT ... FROM public.catches ...` returned **0 rows** under RLS.
- Post-2113, `get_catch_rating_summary()` returns **0 rows** for denied viewers (blocked/unauthorized). Treat **0 rows** as **“not accessible”**, not “no ratings yet”.

## One-shot diagnostic script (optional)

Use this when you’re unsure _which_ statement is failing. It logs ALLOW/DENY outcomes without aborting on the first error.

```sql
BEGIN;

  -- auth.uid() = <viewer uuid>
  SET LOCAL ROLE authenticated;
  SELECT set_config('request.jwt.claim.sub', '<viewer-uuid>', true);
  SELECT set_config('request.jwt.claim.role', 'authenticated', true);

  CREATE TEMP TABLE rls_results (test text, outcome text, detail text);
  INSERT INTO rls_results VALUES ('sanity', 'INFO', format('current_user=%s uid=%s', current_user, coalesce(auth.uid()::text,'NULL')));

  -- Summary row-counts (0 rows = denied)
  INSERT INTO rls_results
  SELECT 'summary_pub', 'INFO', format('rows=%s', (SELECT count(*) FROM public.get_catch_rating_summary('<catch_pub_id>')));

  INSERT INTO rls_results
  SELECT 'summary_fol', 'INFO', format('rows=%s', (SELECT count(*) FROM public.get_catch_rating_summary('<catch_fol_id>')));

  INSERT INTO rls_results
  SELECT 'summary_pri', 'INFO', format('rows=%s', (SELECT count(*) FROM public.get_catch_rating_summary('<catch_pri_id>')));

  -- Rating write (upsert)
  DO $$
  BEGIN
    INSERT INTO public.ratings (catch_id, user_id, rating)
    VALUES ('<catch_pub_id>', auth.uid(), 6)
    ON CONFLICT (catch_id, user_id) DO UPDATE
      SET rating = EXCLUDED.rating, created_at = now();
    INSERT INTO rls_results VALUES ('write rating_pub', 'ALLOW', 'ok');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO rls_results VALUES ('write rating_pub', 'DENY', SQLERRM);
  END $$;

  SELECT * FROM rls_results ORDER BY test;

ROLLBACK;
```

## Rate-limit prerequisite check

Because rate-limit triggers insert into `public.rate_limits`, ensure inserts are allowed for the current viewer before running the matrix:

```
-- Run as ONE script (same transaction) so the claim settings apply to the INSERT.
BEGIN;

  -- auth.uid() = <viewer uuid>
  SET LOCAL ROLE authenticated;
  SELECT set_config('request.jwt.claim.sub', '<viewer-uuid>', true);
  SELECT set_config('request.jwt.claim.role', 'authenticated', true);

  -- Sanity: confirm auth.uid() is set for this transaction
  SELECT auth.uid() AS uid;

  -- Should succeed. We rollback to avoid needing DELETE policies.
  INSERT INTO public.rate_limits (user_id, action)
  VALUES (auth.uid(), 'comments');

ROLLBACK;

-- Should fail (RLS) if you try to insert for another user:
-- (run in a separate BEGIN/ROLLBACK block as above)
-- INSERT INTO public.rate_limits (user_id, action) VALUES ('<other-uuid>', 'comments');
```

If you see a NOT NULL error for rate_limits.user_id (auth.uid() came back NULL), it means your impersonation claim didn’t apply to that statement. Re-run the scenario as a single multi-statement script inside BEGIN/ROLLBACK, and ensure you run the SET LOCAL + set_config lines immediately before the write.

## Update-path check (exercise UPDATE policies)

The main matrix checks will often hit the INSERT path. To confirm your RESTRICTIVE **UPDATE** policies are also enforced, run a “double upsert” in the same transaction to force a conflict/update.

```sql
-- Run as ONE script (same transaction).
BEGIN;

  -- auth.uid() = <viewer uuid>
  SET LOCAL ROLE authenticated;
  SELECT set_config('request.jwt.claim.sub', '<viewer-uuid>', true);
  SELECT set_config('request.jwt.claim.role', 'authenticated', true);

  -- Sanity
  SELECT auth.uid() AS uid;

  -- Reaction: 2x upsert forces UPDATE on second statement
  INSERT INTO public.catch_reactions (catch_id, user_id, reaction)
  VALUES ('<catch_pub_id>', auth.uid(), 'like')
  ON CONFLICT (user_id, catch_id) DO UPDATE
    SET reaction = EXCLUDED.reaction, created_at = now();

  INSERT INTO public.catch_reactions (catch_id, user_id, reaction)
  VALUES ('<catch_pub_id>', auth.uid(), 'love')
  ON CONFLICT (user_id, catch_id) DO UPDATE
    SET reaction = EXCLUDED.reaction, created_at = now();

  -- Rating: 2x upsert forces UPDATE on second statement
  INSERT INTO public.ratings (catch_id, user_id, rating)
  VALUES ('<catch_pub_id>', auth.uid(), 6)
  ON CONFLICT (catch_id, user_id) DO UPDATE
    SET rating = EXCLUDED.rating, created_at = now();

  INSERT INTO public.ratings (catch_id, user_id, rating)
  VALUES ('<catch_pub_id>', auth.uid(), 8)
  ON CONFLICT (catch_id, user_id) DO UPDATE
    SET rating = EXCLUDED.rating, created_at = now();

ROLLBACK;
```

Expected outcomes for public catches:

- **B (follower)**: ALLOW
- **C (stranger)**: ALLOW
- **D (blocked)**: DENY (RLS)

Use followers/private catch IDs to confirm the expected DENY cases.
