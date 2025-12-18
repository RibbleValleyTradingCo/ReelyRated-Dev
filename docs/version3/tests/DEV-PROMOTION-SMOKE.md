# DEV-PROMOTION-SMOKE – Manual Runbook

Purpose: fast browser + SQL smoke suite to verify recent hardening (access model, follow/block, reports, comments/ratings, admin warnings) before promoting Local Docker → Remote Dev.

## 1) When to run

- Before promoting local changes to Remote Dev.
- Repeat on Remote Dev after promotion using the same steps.

## 2) Actors (stable UUIDs)

- **A (owner)**: `aa35e9b8-9826-4e45-a5b0-cec5d3bd6f3a`
- **B (follower)**: `8fdb5a09-18b1-4f40-babe-a96959c3ee04`
- **C (stranger)**: `dc976a2a-03fe-465a-be06-0fa1038c95cf`
- **D (blocked)**: `8641225a-8917-435e-95f2-bb4356cd44d0`
- **Admin**: `d38c5e8d-7dc6-42f0-b541-906e793f2e20`

## 3) Prerequisites / required test data

- At least one **public catch** owned by A (or another known user) with a **known catch id**.
- At least one **comment** on that catch (for comment reporting).
- At least one **inaccessible catch** for a viewer (e.g., A’s private/followers-only catch when viewed by C/D).
- If IDs are unknown:
  - Sign in as **A**, create a public catch via `/add-catch`, copy the catch id from the URL.
  - Add a comment to that catch.
  - Create a private/followers-only catch for the “inaccessible” checks and copy that id.
- **Current test IDs (fill before running):**
  - Public catch id: `b1d226bc-5af6-4cba-83be-c7cdbe1c168f`
  - Comment id on public catch: `3689dea2-530f-4675-b2af-a93e7c4f30e2`
  - Inaccessible catch id (for C or D): `7b15cfda-f26a-4e5f-b4f3-72c95f1284ea`

## 4) Run order

1. Hybrid access model (UI)
2. Follow / Block (UI + SQL)
3. Reports (UI + SQL)
4. Comments + rating summary non-leak (UI + SQL)
5. Admin warning smoke (UI + SQL)

## 5) SQL helper blocks (Supabase SQL editor)

**Impersonation template (single transaction):**

```sql
BEGIN;
  SET LOCAL ROLE authenticated;
  SELECT set_config('request.jwt.claim.sub', '<VIEWER_UUID>', true);
  SELECT set_config('request.jwt.claim.role', 'authenticated', true);
  SELECT current_user, auth.uid();
  -- …tests…
ROLLBACK;
```

**Admin impersonation:** set role claim to `service_role` **or** ensure the UUID is in `public.admin_users`.

**Anon:** `SET LOCAL ROLE anon;` (skip the claim config).

**Local-only cleanup (reports / rate_limits / follows) – run as service role or with RLS disabled:**

```sql
-- Adjust ids if you used different actors
DELETE FROM public.reports
WHERE reporter_id IN ('8fdb5a09-18b1-4f40-babe-a96959c3ee04', 'dc976a2a-03fe-465a-be06-0fa1038c95cf');

DELETE FROM public.rate_limits
WHERE user_id IN ('8fdb5a09-18b1-4f40-babe-a96959c3ee04', 'dc976a2a-03fe-465a-be06-0fa1038c95cf')
  AND action = 'reports';

DELETE FROM public.profile_follows
WHERE follower_id IN ('8fdb5a09-18b1-4f40-babe-a96959c3ee04', '8641225a-8917-435e-95f2-bb4356cd44d0')
  AND following_id = 'aa35e9b8-9826-4e45-a5b0-cec5d3bd6f3a';
```

**Rate limit verification (reports):**

```sql
SELECT action, count(*) AS events_last_hour
FROM public.rate_limits
WHERE user_id = '8fdb5a09-18b1-4f40-babe-a96959c3ee04'
  AND action = 'reports'
  AND created_at >= now() - interval '60 minutes'
GROUP BY action;
```

## 6) Smoke suite sections

### 6.1 Hybrid access model (UI)

- **Preconditions:** Logged out.
- **Steps:**
  1. Visit `/` then `/venues` and `/venues/<slug>` as anon.
  2. Visit `/feed`, `/catch/<CATCH_ID_PUBLIC>`, `/profile/<username>`, `/add-catch`, `/settings/profile`, `/notifications`, `/admin/reports` as anon.
- **Expect:**
  - `/venues` and `/venues/<slug>` render.
  - All protected routes redirect to `/auth` (no content flash).
  - No console errors.
- **DB / SQL checks:** None.
- **Notes:** Protected routes are wrapped by `RequireAuth`.

### 6.2 Follow / Block (UI + SQL)

- **Preconditions:** A exists; B follows A initially (optional).
- **Steps (UI):**
  1. Sign in as **B**, open `/profile/<A-username>`, click Follow then Unfollow, confirm button state changes.
  2. Sign in as **D**, open `/profile/<A-username>`, attempt Follow (should fail/toast, no edge).
- **Expect (UI):**
  - B’s follow/unfollow works; follower count updates.
  - D’s follow attempt fails cleanly (no edge created).
- **DB / SQL (admin-only follower visibility):**
  ```sql
  BEGIN;
    SET LOCAL ROLE authenticated;
    SELECT set_config('request.jwt.claim.sub','d38c5e8d-7dc6-42f0-b541-906e793f2e20', true);
    SELECT set_config('request.jwt.claim.role','authenticated', true); -- admin user
    SELECT follower_id, following_id
    FROM public.profile_follows
    WHERE following_id = 'aa35e9b8-9826-4e45-a5b0-cec5d3bd6f3a';
  ROLLBACK;
  ```
- **Notes:** No UI surface for follower lists; use SQL for admin visibility check.

### 6.3 Reports (UI + SQL)

- **Preconditions:** Known public catch id `<CATCH_ID_PUBLIC>` and a comment id `<COMMENT_ID_PUBLIC>` on that catch.
- **Steps (UI):**
  1. Sign in as **B** (or C), open `/catch/<CATCH_ID_PUBLIC>`, click “Report catch”, submit reason, expect success toast.
  2. In the comments list, click “Report” on `<COMMENT_ID_PUBLIC>`, submit, expect success text.
  3. Rate limit: submit 5 reports (same catch/comment is fine), 6th should show rate-limit toast.
- **Expect (UI):** Reports succeed with toast; 6th shows friendly rate-limit message; no crashes.
- **SQL (inaccessible target + logging):**
  ```sql
  BEGIN;
    SET LOCAL ROLE authenticated;
    SELECT set_config('request.jwt.claim.sub','8fdb5a09-18b1-4f40-babe-a96959c3ee04', true);
    SELECT set_config('request.jwt.claim.role','authenticated', true);
    -- Inaccessible target
    SELECT public.create_report_with_rate_limit('catch','<CATCH_ID_INACCESSIBLE>'::uuid,'should fail',NULL);
  ROLLBACK;
  ```
  Expect: `Target not accessible`.
  ```sql
  -- One rate_limits row per successful report
  SELECT action, count(*) AS events_last_hour
  FROM public.rate_limits
  WHERE user_id = '8fdb5a09-18b1-4f40-babe-a96959c3ee04'
    AND action = 'reports'
    AND created_at >= now() - interval '60 minutes'
  GROUP BY action;
  ```
- **Notes:** Inaccessible targets can’t be reached via UI; verify via SQL.

### 6.4 Comments + rating summary non-leak (UI + SQL)

- **Preconditions:** Public catch `<CATCH_ID_PUBLIC>`; inaccessible catch `<CATCH_ID_INACCESSIBLE>` for C or D.
- **Steps (UI):**
  1. As **B**, open public catch detail: comment works; rating summary visible.
  2. As **C** or **D**, attempt to open `<CATCH_ID_INACCESSIBLE>`: page should show denied/hidden; rating summary widget shows “You can’t view ratings for this catch” (no data).
- **Expect (UI):** Allowed viewers see summary; denied viewers see denial copy, no data leak; attempting to open an inaccessible catch should show **one** “not available” toast and redirect to `/feed`.
- **SQL (summary 0 rows for denied):**
  ```sql
  BEGIN;
    SET LOCAL ROLE authenticated;
    SELECT set_config('request.jwt.claim.sub','dc976a2a-03fe-465a-be06-0fa1038c95cf', true); -- C
    SELECT set_config('request.jwt.claim.role','authenticated', true);
    SELECT * FROM public.get_catch_rating_summary('<CATCH_ID_INACCESSIBLE>'::uuid);
  ROLLBACK;
  ```
  Expect: 0 rows (not an exception).
- **Notes:** Hardened summary returns 0 rows when denied. In local dev, React StrictMode may still trigger duplicate network requests for the catch fetch, but the UX should be de-duped to **one** toast + **one** redirect per catch id.

### 6.5 Admin warning smoke (UI + SQL)

- **Preconditions:** Admin user exists; target B exists.
- **Steps (UI):**
  1. Sign in as **Admin**, open `/admin/users/8fdb5a09-18b1-4f40-babe-a96959c3ee04/moderation`, send a warning (severity “warning”, reason “dev-promo smoke”).
  2. Confirm warning appears in the admin warnings table/log on the same page.
  3. Sign in as **B**: check notifications list for an `admin_warning` notification.
- **SQL (verify inserts):**
  ```sql
  BEGIN;
    SET LOCAL ROLE authenticated;
    SELECT set_config('request.jwt.claim.sub','d38c5e8d-7dc6-42f0-b541-906e793f2e20', true);
    SELECT set_config('request.jwt.claim.role','authenticated', true); -- admin
    SELECT * FROM public.user_warnings WHERE user_id = '8fdb5a09-18b1-4f40-babe-a96959c3ee04' ORDER BY created_at DESC LIMIT 3;
    SELECT * FROM public.moderation_log WHERE user_id = '8fdb5a09-18b1-4f40-babe-a96959c3ee04' ORDER BY created_at DESC LIMIT 3;
    SELECT * FROM public.notifications WHERE user_id = '8fdb5a09-18b1-4f40-babe-a96959c3ee04' AND type = 'admin_warning' ORDER BY created_at DESC LIMIT 3;
  ROLLBACK;
  ```
- **Expect:** Warning row, moderation_log entry (`warn_user`), and notification for B present. Non-admin callers of admin RPCs should be denied (covered indirectly by UI).

## 7) Pass/Fail criteria

- Hybrid access redirects correct; public venues load anon; no console errors.
- Follow/unfollow works for B; blocked D cannot follow A; admin can list followers via SQL.
- Reports: catch and comment reporting succeed; 6th report rate-limited; inaccessible target returns `Target not accessible` via SQL; one rate_limits row per report.
- Rating summary: visible for allowed; denial copy and 0-row summary for denied viewers; inaccessible catch URL produces a single toast + redirect (even if dev makes duplicate requests).
- Admin warning: admin can issue; warning/log/notification created; B sees notification; non-admin access remains denied.

## 8) Local cleanup scripts (Local Docker only)

- Use the cleanup block above to remove test reports/rate_limits/follows.
- If you added test catches/comments, delete them in UI as the owner (A) or leave them if harmless.

## 9) Promotion notes (Local → Dev)

- Run the full suite locally, then deploy/migrate to Remote Dev.
- Re-run the same steps on Remote Dev with the same actor accounts. Update “Current test IDs” with Dev catch/comment ids if different.
- If any SQL impersonation fails due to `auth.uid()` being NULL, ensure you run as one batch with `SET LOCAL ROLE` + `set_config` claims.

## 10) Dev rerun notes

- Expect identical outcomes on Dev. Any deviation (e.g., admin can’t read followers via SQL, blocked follow succeeds, reports double-log) is a blocker; investigate migrations vs remote drift.
