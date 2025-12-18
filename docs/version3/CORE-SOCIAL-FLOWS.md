# Core Social Flows – Feed, Catches, Comments, Following

Environment:

- **Env:** Local Docker (Supabase + Vite dev)
- **Frontend:** http://localhost:8080
- **DB:** Fresh local DB, test users only

Test users (recommended)

- **User A** – main test account (you).
- **User B** – second normal user.
- **User C** – optional third user (for “stranger” RLS checks later).

Create these via `/auth` sign-up flows.

---

## 1. Feed

### 1.1 FEED-001 – Public feed loads

**Goal:** Ensure the main feed loads without errors and shows catches (or a sensible empty state).

**Steps**

1. Sign in as **User A**.
2. Navigate to `/` or `/feed`.
3. If DB is empty, create at least one catch (see CATCH-001) and refresh.

**Expected**

- Feed renders without React/Supabase errors.
- If there are catches:
  - List shows recent catches with expected fields (species, weight, photo, etc.).
- If no catches:
  - A clear empty-state message.

**Result log**

- **2025-12-05 – Local Docker – James – ✅ Pass**
  - **Issue:**
    - None observed.
  - **Notes:**
    - Feed renders without React/Supabase errors (checked devtools).
    - When catches exist, the list shows recent catches with species, weight, photo, etc.
    - When no catches exist, the empty-state message appears as expected.
  - **Bug(s):**
    - None.

---

### 1.2 FEED-002 – “People you follow” filter

**Goal:** Confirm that the “People you follow” feed only shows catches from followed users.

**Steps**

1. Sign in as **User B**.
   - Create at least one catch for B.
2. Sign in as **User A**.
   - Follow **User B** from their profile.
3. Go to the feed as A:
   - Switch between **“All catches”** and **“People you follow”**.
4. Optionally:
   - Unfollow B and refresh.

**Expected**

- **All catches**: shows all public catches (including B’s).
- **People you follow**:
  - Shows catches from B (and any other followed users).
  - After unfollowing B, B’s catches disappear from “People you follow”.
- No RLS or 4xx/5xx errors for the feed RPCs.

**Result log**

- **2025-12-06 – Local Docker – James – ✅ Pass**
  - **Issue:**
    - Previously, feed filters behaved correctly but admin accounts could still create catches via the normal add/log catch flows, which conflicted with our “admins are moderation-only” design.
  - **Notes:**
    - For normal users:
      - “All catches” shows all public catches, including followed users like User B.
      - “People you follow” shows only catches from followed users and correctly stops showing B’s catches after A unfollows B.
      - No 4xx/5xx or RLS errors are seen for the feed RPCs in devtools.
    - For admin users:
      - “Add catch” / “Log a catch” CTAs are hidden on the feed and in the mobile menu.
      - Visiting `/add-catch` shows a friendly message explaining that admin accounts cannot create catches.
    - DB/RLS:
      - Migration `2097_block_admin_catch_inserts.sql` replaces the old `catches_owner_all` FOR ALL policy with:
        - `catches_owner_all` (SELECT for owners),
        - `catches_owner_mutate` (INSERT only when `auth.uid() = user_id` and the caller is not an admin),
        - `catches_owner_update_delete` (UPDATE/DELETE only when `auth.uid() = user_id` and the caller is not an admin).
      - Admin users are blocked from inserting/updating/deleting catches via RLS, while non-admin insert behaviour remains unchanged.
  - **Bug(s):**
    - Historic bug fixed: admin accounts can no longer create catches; they are now moderation-only, and the feed follow filters behave correctly for normal users.

---

## 2. Catches – Create / Edit / Delete

### 2.1 CATCH-001 – Add catch (basic flow)

**Goal:** Verify that adding a catch works end-to-end and appears in feed + profile.

**Steps**

1. Sign in as **User A**.
2. Go to `/add-catch`.
3. Fill the required fields:
   - Species (or custom species).
   - Weight + unit.
   - Time of day.
   - Venue **or** free-text location.
4. (Optional) Upload a photo.
5. Save the catch and wait for redirect.

**Expected**

- No validation or Supabase errors.
- New catch appears:
  - On A’s profile.
  - In the main feed.
- Units/time/species display correctly.

**Result log**

- **2025-12-05 – Local Docker – James – ✅ Pass**
  - **Issue:**
    - None observed.
  - **Notes:**
    - Added a catch as User A with required fields; no validation or Supabase errors.
    - The new catch appears on User A’s profile and in the main feed.
    - Units, time of day, and species display as expected.
  - **Bug(s):**
    - None.

---

### 2.2 CATCH-002 – Edit catch

**Goal:** Confirm you can edit your own catch and changes propagate.

**Steps**

1. As **User A**, open a catch you own.
2. Edit:
   - Description and/or tags (only non-leaderboard fields are editable).
3. Save and return to the catch detail view.

**Expected**

- Updated description and tags appear on:
  - Catch detail.
  - Feed tiles.
  - Profile list.
- Weight/length, species, and capture date/time remain unchanged (these are leaderboard-critical and not editable by anglers).
- No “permission denied” / RLS errors.

**Result log**

- **2025-12-05 – Local Docker – James – ❌ Fail (Not implemented)**

  - **Issue:**
    - There is currently no way to edit a catch in the UI (no edit button or route), so this flow cannot be executed.
  - **Notes:**
    - The “edit catch” feature has not been built yet and needs design + implementation.
  - **Bug(s):**
    - Feature gap: missing “edit catch” UI and backend flow.

- **2025-12-06 – Local Docker – James – ✅ Pass**

  - **Issue:**
    - None observed for the core edit flow.
  - **Notes:**
    - As User A (owner, non-admin), an **“Edit catch”** button now appears on the catch detail page in an info card when viewing a catch you own.
    - Clicking **“Edit catch”** opens an inline modal with a description textarea and a comma-separated tags input, both prefilled from the current catch data.
    - Saving calls the new `updateCatchFields` helper (owner-only via RLS), refetches the catch data via `useCatchData`/`fetchCatchData`, closes the modal, and shows any errors via the existing toast system.
    - Updated description/tags are visible on the catch detail page immediately and are reflected on feed/profile catch tiles on refresh.
    - Non-owners (e.g. User B) and admin users do not see the edit affordance; admins remain unable to mutate catches due to existing RLS.
  - **Bug(s):**
    - None currently known for this flow.

---

### 2.3 CATCH-003 – Delete (soft delete) catch

**Goal:** Ensure deleting a catch hides it from normal users, while retaining the row in DB.

**Steps**

1. As **User A**, pick one of your catches.
2. Use the UI to delete it.
3. Refresh:
   - A’s profile.
   - Main feed.
4. (Optional) Check DB row in Studio to confirm `deleted_at` is set.

**Expected**

- Catch no longer appears in feed or profile.
- Other users cannot see it.
- DB still has the row (soft delete), with `deleted_at` populated.

**Result log**

- **2025-12-05 – Local Docker – James – ✅ Pass**
  - **Issue:**
    - Previously, deleting a catch hard-deleted the row and the profile view still showed soft-deleted catches.
  - **Notes:**
    - User-facing delete now uses `deleteCatch`/`handleDeleteCatch` to set `deleted_at` (and `updated_at`) on the catch row instead of hard-deleting.
    - Profile catch fetch in `Profile.tsx` explicitly filters `deleted_at IS NULL`, so soft-deleted catches are hidden from the owner’s profile.
    - Feed, venue, and leaderboard queries already respected `deleted_at IS NULL` and continue to hide deleted catches from normal users.
    - In Supabase Studio, deleted catches still exist in `public.catches` with `deleted_at` populated, confirming the soft delete behaviour.
  - **Bug(s):**
    - Historic bug fixed: catch deletion is now implemented as a soft delete and all main user-facing surfaces honour `deleted_at`.

---

## 3. Comments & Mentions

### 3.1 COMM-001 – Add comment

**Goal:** Verify basic commenting between two users.

**Steps**

1. As **User A**, ensure you have at least one catch.
2. Sign in as **User B**.
3. Open A’s catch and add a comment.

**Expected**

- Comment appears under the catch for both A and B.
- Comment count increments.
- No rate-limit or RLS error on first comment.

**Result log**

- **2025-12-05 – Local Docker – James – ✅ Pass**
  - **Issue:**
    - Previously, comments failed to load due to 403 errors on `catch_comments_with_admin` and `catch_mention_candidates`, but this has been resolved.
  - **Notes:**
    - As User A and User B, comments appear under the catch for both users.
    - Comment count increments correctly after posting.
    - No rate-limit or RLS errors occur on the first comment.
  - **Bug(s):**
    - Historic bug fixed: missing `SELECT` grants on `catch_comments_with_admin` and `catch_mention_candidates` were restored via migration `2096_restore_comment_view_access.sql` / GRANTs.

---

### 3.2 COMM-002 – Reply threading

**Status:** ✅ 2025-12-10 (Local Docker – James)

### Setup

- User A owns a **public** catch.
- User B is a normal user who can see A’s catch.
- There is at least one existing top-level comment from User B on A’s catch (e.g. `Nice catch!`).

### Step 1 – Post a reply

1. As **User B**, go to A’s catch detail page.
2. Under an existing top-level comment, click **Reply**.
3. Type a short reply (e.g. `test`) and post it.

**Expected (v3):**

- Reply is created with a non-null `parent_comment_id` that points at the parent comment.
- No error toasts from the UI; no RLS errors in devtools.

**DB check (run as owner/admin in SQL editor):**

```sql
SELECT
  id,
  catch_id,
  user_id,
  body,
  parent_comment_id,
  created_at,
  deleted_at
FROM public.catch_comments
WHERE catch_id = '<TEST_CATCH_ID>'
ORDER BY created_at;
```

**Result log**

- **2025-12-10 – Local Docker – James – ✅ Pass**
  - **Issue:**
    - None observed for basic reply threading.
  - **Notes:**
    - As User B, replies posted via the **Reply** action are stored with a non-null `parent_comment_id` referencing the parent comment.
    - On the catch detail page, replies render visually nested beneath the parent comment with sensible ordering (parent above reply).
    - Comment counts on the catch detail page and any tiles that show comment counts update correctly when replies are added.
    - When a parent comment is soft-deleted via the UI:
      - The parent is rendered in a “tombstone” / deleted state.
      - The child reply remains visible and readable, effectively becoming an “orphaned” reply under the deleted parent.
      - No UI glitches or RLS errors were observed in devtools during delete or refresh.
    - Out of scope for v3: we currently allow “orphaned” replies to remain visible under a tombstoned parent. Any future changes to auto-hide or auto-collapse these replies will be treated as a v4+ UX enhancement, not a v3 hardening fix.
  - **Bug(s):**
    - None currently known for this flow at v3; more advanced thread-cleanup rules (e.g. auto-hiding orphaned replies) are considered out of scope for this hardening pass.

---

### 3.3 COMM-003 – Mentions + notifications (happy path)

**Goal:** Ensure @mentions create notifications and deep-link correctly.

**Steps**

1. Sign in as **User A** and note your username.
2. Sign in as **User B**.
3. On a catch, B posts a comment containing `@<A’s username>`.
4. Sign back in as A and open the notifications UI.

**Expected**

- A sees a notification for the mention.
- Clicking the notification opens the relevant catch (ideally scrolled to the comment).
- Notification text is sensible (mentions who commented and where).

**Result log**

- **2025-12-05 – Local Docker – James – ❌ Fail**
  - **Issue:**
    - The @mention flow does not produce the expected notification and deep-link behaviour.
  - **Notes:**
    - When User B posts a comment containing `@<A’s username>`, User A does not reliably receive a clear mention notification.
    - Clicking existing notifications does not consistently open the relevant catch scrolled to the mentioned comment.
    - Where notifications do appear, the text is technically correct but poorly structured/readable.
  - **Bug(s):**
    - Missing or incomplete mention notification flow (creation and deep-linking to the comment).
    - Notification copy/layout needs refinement to clearly indicate who mentioned whom and on which catch.
- **2025-12-06 – Local Docker – James – ✅ Pass**
  - **Issue:**
    - None observed for mention notifications.
  - **Notes:**
    - When User B posts a comment containing `@<A’s username>` on A’s catch, User A now reliably receives a clear **“Mention”** notification rather than a generic comment notification.
    - Mention notifications for non-owners continue to work as expected; each recipient gets at most one notification per comment, with `mention` taking precedence over `new_comment` when they are explicitly @mentioned.
    - Notification layout has been improved so that mention/comment/rating types are clearly distinguished with icons and copy, and clicking a mention notification opens the correct catch detail and scrolls to the related comment.
  - **Bug(s):**
    - None currently known for this flow.

---

## 4. Profiles, Following, Blocking

### 4.1 PROFILE-001 – View profile basics

**Goal:** Confirm profiles render correctly for self and others.

**Steps**

1. As **User A**, open your own profile `/profile/:username`.
2. As **User B**, open A’s profile.
3. Check:
   - Avatar, bio, location, website.
   - Catches list.
   - Followers / following counts (even if zero).

**Expected**

- Both self-view and other-view show consistent data.
- No private/internal fields leak.
- No crashes on profiles with zero catches.

**Result log**

- **2025-12-05 – Local Docker – James – ✅ Pass**
  - **Issue:**
    - None observed for basic profile rendering.
  - **Notes:**
    - Both self-view and other-view show consistent avatar, bio, location, website, and catches.
    - No private or internal fields are exposed in the profile UI.
    - Profiles with zero catches render without crashes.
  - **Bug(s):**
    - None. (Blocking/leaderboard behaviour is tracked under BLOCK-001.)

---

### 4.2 FOLLOW-001 – Follow / unfollow

**Goal:** Validate that follow/unfollow works and affects counts + feed.

**Steps**

1. As **User A**, open **User B**’s profile.
2. Click **Follow**.
3. Check:
   - A’s “following” count increments.
   - B’s “followers” count increments (if visible).
4. Optionally:
   - Check the feed “People you follow” again (B’s catches appear).
5. Click **Unfollow** and re-check counts + feed.

**Expected**

- Counts update correctly and quickly (or on refresh).
- Feed’s “people you follow” reflects the relationship.

**Result log**

- **2025-12-05 – Local Docker – James – ✅ Pass**
  - **Issue:**
    - None observed.
  - **Notes:**
    - Following User B increments User A’s “following” count and User B’s “followers” count appropriately.
    - The “People you follow” feed shows B’s catches when followed and removes them after unfollowing.
  - **Bug(s):**
    - None.

---

### 4.3 BLOCK-001 – Blocked user visibility

**Goal:** Check that blocking hides content as designed on interactive surfaces, while the leaderboard remains a global, truthful scoreboard.

**Steps**

1. As **User A**, block **User B** via the UI.
2. While signed in as A, check:
   - Feed.
   - A’s catch comment threads where B has commented.
   - Leaderboard rows for the current filters.
   - From the leaderboard, attempt to click through to B’s profile/catches from their row.
3. Optionally sign in as B and repeat the checks.
   - From the leaderboard, attempt to click through to A’s profile/catches from their row.

**Expected**

- Leaderboard is global: both A and B still see each other’s rows in their correct ranks; blocking does **not** remove or change leaderboard rows/scores.
- From the leaderboard, drill-down into a blocked user’s profile/catches is blocked/disabled with a clear message (e.g. “You can’t view this angler’s catches or profile because one of you has blocked the other.”).
- Interactive surfaces remain block-aware:
  - Feed/profile/catch detail/comments hide blocked users’ content as already documented.
  - Mentions from blocked users do not notify.

**Result log**

- **2025-12-06 – Local Docker – James – ✅ Pass**

  - **Issue:**
    - None observed for leaderboard/block behaviour.
  - **Notes:**
    - Leaderboard remains global; blocked users still appear in correct rank order for all viewers.
    - For signed-in non-admin users, drill-down from leaderboard rows into a blocked user’s profile/catches is prevented and shows a clear toast message: "You can’t view this angler’s catches or profile because one of you has blocked the other."
    - Feed/profile/catch detail/comments continue to hide blocked users as expected.
  - **Bug(s):**

    - Historic behaviour only; current implementation matches the intended design.

---

## 5. Reactions & Ratings

### 5.1 RATE-001 – Like / unlike catch

**Goal:** Confirm that users can like/unlike a catch and that reaction counts stay consistent across key surfaces.

**Steps**

1. As **User A**, ensure you have at least one public catch.
2. Sign in as **User B**.
3. From the **feed**, like one of A’s catches.
4. Navigate to:
   - The catch detail page.
   - A’s profile catch grid.
5. Unlike the catch from one of these views, then like it again from another (e.g. unlike on detail, like again on feed).

**Expected**

- When B likes the catch:
  - The like/reaction count increments on:
    - Feed tiles.
    - Catch detail.
    - A’s profile catch list.
- When B unlikes the catch:
  - The count decrements consistently on all surfaces.
- The owner (A) does **not** accidentally double-count their own likes if they react to their own catch (whatever the intended design is—confirm and note).
- No RLS or “permission denied” errors appear in the console.

**Result log**

- **2025-12-09 – Local Docker – James – ✅ Pass**
  - **Issue:**
    - None observed for the core like/unlike flow.
  - **Notes:**
    - As **User A** (catch owner), you receive a `new_reaction` notification (“liked your catch…”) which, when clicked, correctly navigates to the catch detail page.
    - When the reaction is removed (unlike), the like counter decrements back to 0 as expected.
    - The UI correctly prevents a user from liking their **own** catch; there is no self-like affordance on their own catches.
    - In the database, likes are stored as rows in `public.catch_reactions`. For a liked catch, a row exists for `(catch_id, user_id)`; when unliked, that row is removed (hard delete) and there is no `deleted_at` column on this table.
    - After migration `2105_react_catch_visibility_fix.sql`, reactions now respect catch visibility in the same way as ratings:
      - **Public** catches: non-owners can react.
      - **Followers-only** catches: followers can react; non-followers receive “Catch is not accessible”.
      - **Private** catches: non-owners cannot react.
      - Owners cannot react to their own catches (guarded in the RPC).
    - No RLS or “permission denied” errors were observed in the browser console during these actions once the migration was applied.
  - **Bug(s):**
    - None currently known for this flow.

---

### 5.2 RATE-002 – Add / update rating

**Goal:** Verify that users can rate another user’s catch, see their own rating, and that aggregates behave correctly.

**Steps**

1. As **User A**, create at least one catch with a clear title.
2. As **User B**, open A’s catch detail page.
3. Set a rating (e.g. 7/10) using the “Your rating” UI.
4. Refresh the page and confirm:
   - B’s “Your rating” is persisted.
   - The aggregate/average rating on the catch updates appropriately.
5. As **User C** (optional), rate the same catch with a different value.
6. As **User A**, view the catch detail page and confirm the aggregate reflects both B and C’s ratings.
7. Attempt to rate your **own** catch as A (if the UI allows it) and confirm the expected behaviour:
   - Either the UI prevents rating your own catch, or
   - The backend/RLS rejects it with a sensible error (and the UI handles this cleanly).

**Expected**

- Non-owners (B, C) can set and update their rating for a catch.
- “Your rating” shows the correct per-user rating after refresh.
- Aggregate rating is correctly computed from all raters and surfaces:
  - Catch detail.
  - Any rating summary in feed/venue/profile tiles.
- Owners either cannot rate their own catches (preferred) or are clearly prevented at the DB/RPC level.
- No RLS or unexpected errors.

**Result log**

- **2025-12-09 – Local Docker – James – ❌ Fail**

  - **Issue:**
    - Rating persistence and navigation work, but the `new_rating` notification message shows the wrong actor username.
  - **Notes:**
    - As **User A** (`test`, id `cc2e2d51-1287-4d74-b5f6-9cc3a3ef7dbb`), rating **User B**’s catch (`"Privacy test"`, id `72b4c291-c15c-4033-bec5-6197abf95aa5`) correctly:
      - Persists the rating after refresh.
      - Sends **User B** (`test2`) a `new_rating` notification that, when clicked, navigates to the catch detail page as expected.
    - In `public.notifications`, the row for this event is:
      - `user_id = 17f4160f-f4f3-4b47-bcec-9c84c4756c30` (test2),
      - `actor_id = cc2e2d51-1287-4d74-b5f6-9cc3a3ef7dbb` (test),
      - `type = 'new_rating'`,
      - `message = 'test5 rated your catch "Privacy test" 7/10.'`,
      - `extra_data = {'rating': 7}`.
    - In `public.profiles`, the same `actor_id` has `username = 'test'`, so the **actor_id is correct but the message string is stale/incorrect** (`test5` instead of `test`).
    - Codex analysis shows:
      - `new_rating` notifications were created **client-side** in `useCatchInteractions.ts` with a message built from a local `actorName` (`username ?? userEmail ?? "Someone"`).
      - `extra_data` for `new_rating` did **not** include `actor_username`.
  - **Bug(s):**
    - **Bug:** `new_rating` notification messages used a client-built `actorName` that could be stale/incorrect (e.g. `"test5"`), even though `actor_id` pointed to the correct profile (`username = 'test'`), and `extra_data` did not include `actor_username`.

- **2025-12-09 – Local Docker – James – ✅ Pass**

  - **Issue:**
    - Historic bug only; no issues observed after the server-side notification change.
  - **Notes:**
    - As **User A** (`test`, id `cc2e2d51-1287-4d74-b5f6-9cc3a3ef7dbb`), rating **User B**’s catch (`"RATE-002 Test Catch"`, id `bc93d45a-39a9-49bf-9809-fbeeaf4cbf8d`) with **8/10**:
      - Persists correctly in `public.ratings` and survives page refresh.
      - Sends **User B** (`test2`, id `17f4160f-f4f3-4b0f-b84e-533b49e5ad84`) a `new_rating` notification that, when clicked, navigates to the catch detail page.
    - In `public.notifications`, the corresponding `new_rating` row shows:
      - `user_id = 17f4160f-f4f3-4b0f-b84e-533b49e5ad84` (test2),
      - `actor_id = cc2e2d51-1287-4d74-b5f6-9cc3a3ef7dbb` (test),
      - `message = 'test rated your catch "RATE-002 Test Catch" 8/10.'`,
      - `extra_data = { "rating": 8, "catch_title": "RATE-002 Test Catch", "actor_username": "test" }`.
    - Migration `2104_rate_catch_notifications.sql` now ensures:
      - `rate_catch_with_rate_limit` looks up the latest actor username from `public.profiles`.
      - The server creates the `new_rating` notification via `public.create_notification`, with a canonical message and `extra_data.actor_username` and `extra_data.catch_title` populated on the backend.
    - The frontend no longer creates `new_rating` notifications client-side, avoiding stale usernames and duplicate notifications; it just calls the rating RPC and refreshes the catch data.
  - **Bug(s):**
    - Historic bug fixed: `new_rating` notifications previously embedded a stale client-side `actorName` (e.g. `"test5"`). Notifications are now generated server-side using the latest profile username and structured `extra_data`, so actor names stay consistent going forward.

---

### 5.3 RATE-003 – Ratings/reactions on other surfaces

Implementation notes

- Ratings are still stored per-user in `public.ratings` (1–10, one row per user/catch), but v3 now exposes **aggregated** stats via a dedicated RPC instead of reading the table directly from the client.
- New RPC: `get_catch_rating_summary(p_catch_id uuid)` (migrations `2106` / `2107`):
  - Enforces catch visibility similar to rating rules:
    - Public: anyone who can see the catch (including anon) can see the rating summary.
    - Followers-only: only followers, the owner, and admins see the summary.
    - Private: only the owner and admins see the summary.
    - Soft-deleted catches are always blocked.
  - Respects `allow_ratings`:
    - If `allow_ratings = false`, the RPC returns a single row with `rating_count = 0`, `average_rating = null`, `your_rating = null`.
  - Always returns **one row** for an accessible catch:
    - `catch_id`
    - `rating_count` (total number of ratings across all users)
    - `average_rating` (numeric, or `null` if no ratings)
    - `your_rating` (current viewer’s rating, or `null` if none / anon).

Frontend usage

- **Catch detail page**
  - `useCatchData` calls `get_catch_rating_summary` instead of querying `public.ratings` directly.
  - The UI shows:
    - Global average (`average_rating`) and total count (`rating_count`).
    - “Your rating” derived from `your_rating` when the viewer is signed in and has rated.
  - If there are no ratings, the UI shows “No ratings yet” / `0 ratings`.
- **Feed cards**
  - `CatchCard` now calls `get_catch_rating_summary` per card (Phase 1):
    - Shows a small badge like: `⭐ {average_rating}/10 · {rating_count}`.
    - Falls back to a neutral state when the summary is still loading or there are no ratings.
  - This is an intentional **N+1** trade-off for v3. Future work: push aggregates into feed/profile/venue RPCs to avoid per-card RPC calls.

RLS / security

- `public.ratings` RLS has been split:
  - **Reads**: the `ratings_read_visible_catches` policy allows selecting ratings only when the viewer is allowed to see the underlying catch (public / followers / owner / admin; anon only for public).
  - **Owner writes**: the `ratings_owner_mutate` policy keeps INSERT/UPDATE/DELETE owner-only (the user can only insert/update/delete their own rating rows) and also allows owners to read their own rating rows.
- The summary RPC is `SECURITY DEFINER` but still respects the visibility rules above. It does **not** broaden access to private/followers-only data; it just provides an aggregated view for eligible viewers.

Notes / edge cases

- Owners and admins can always request the rating summary for their catches (as long as the catch is not soft-deleted).
- If a user is not allowed to see the catch (e.g. non-follower for a followers-only catch, or anonymous for a non-public catch), `get_catch_rating_summary` raises “Catch is not accessible”.
- The global averages shown on cards and detail pages are now **true global aggregates** for eligible viewers, not “your personal rating only”.

**Goal:** Ensure that ratings and reactions propagate correctly to all key discovery surfaces.

**Steps**

1. With ratings in place from **RATE-002**:
   - As **User B** and **User C**, rate A’s catch.
2. As **User A**, check:
   - Feed tile for the catch.
   - Profile catch grid.
   - Any venue page where this catch appears (e.g. “Top catches” at a venue).
3. Soft delete the catch as A (CATCH-003 flow).
4. Revisit:
   - Feed.
   - Profile.
   - Venue pages where the catch previously appeared.

**Expected**

- Before deletion:
  - Rating summaries and reaction counts on **feed** and **profile** tiles match the catch detail view.
  - Venue “recent/top catches” correctly include the catch where applicable (note: venue tiles do not yet display rating summaries; that is a future enhancement).
- After soft delete:
  - The catch disappears from:
    - Feed.
    - Profile catch list.
    - Venue “recent/top catches” and any venue stats that show this catch.
  - No broken tiles or errors appear where the catch used to be.
- Ratings/reactions attached to the deleted catch do not cause errors in any UI or RPCs.

**Result log**

- **2025-12-09 – Local Docker – James – ✅ Pass**
  - **Issue:**
    - None observed for the rating summary visibility/access flow.
  - **Notes:**
    - Public catch – logged in as another user:
      - The catch detail page and `/feed` card both show the correct global average rating and total rating count.
    - Public catch – Incognito / anonymous:
      - The same average + count are visible to anonymous viewers for public catches, with no misleading “You can’t view ratings” or “Ratings unavailable” states.
      - Only signed-in users can add or update ratings; anon can view but not rate.
    - Followers-only catch:
      - As a follower, the catch detail page and feed card show the correct global average and count.
      - As a non-follower, the viewer cannot access the catch or sees a clear **“You can’t view ratings for this catch”** message rather than a fake “No ratings yet” state.
    - Private catch:
      - The owner sees the rating summary as expected.
      - Non-owners cannot access the catch or its rating summary; no partial or leaked aggregates are shown.
    - In all cases, “Your rating” correctly reflects the current viewer’s rating (or `null` if they have not rated), and the global averages/counts now match the underlying data for all eligible viewers.
  - **Bug(s):**
    - None currently known for this flow.

---

### 5.4 RATE-004 – Reactions & ratings with blocking

**Goal:** Confirm that blocking interacts sensibly with reactions/ratings and does not undermine block expectations.

**Steps**

1. As **User A**, create a public catch.
2. As **User B**, like and rate A’s catch.
3. As **User A**, block **User B** via the profile UI.
4. While signed in as A, confirm:
   - B’s catches and comments are hidden on interactive surfaces (as per BLOCK-001).
   - A no longer sees new reactions/ratings from B (if the UI would otherwise show them).
5. As **User B**, attempt to:
   - Like/unlike A’s catch again.
   - Change the rating you previously set on A’s catch.
6. Optionally, as **User C**, confirm that a third-party user still sees A’s catch and can react/rate normally.

**Expected**

- Blocking does **not** let users “game” ratings or reactions in ways that undermine the block:
  - Ideally, once A blocks B, B cannot add new reactions/ratings to A’s catches (or such actions are ignored/blocked at RPC/RLS level).
- Any existing reactions/ratings from B on A’s catch either:
  - Remain in aggregates but are not surfaced in a way that breaks the block UX, or
  - Are filtered out for A, depending on your final design.
- Blocked relationships do **not** break the integrity of overall ratings on catches for other users (e.g. C still sees sensible ratings).
- No unexpected RLS or RPC errors.

**Result log**

- **2025-12-10 – Local Docker – James – ✅ Pass**
  - **Issue:**
    - None observed for reactions/ratings when blocking is involved at current v3 scope.
  - **Notes:**
    - Setup:
      - As **User A**, created a public catch.
      - As **User B**, liked A’s catch and rated it (e.g. 7/10).
    - Before blocking:
      - As **User A**, B’s like and rating are reflected correctly on:
        - The catch detail page.
        - The `/feed` card for that catch.
        - The rating summary (average + count), which looks correct.
    - After A blocks B:
      - As **User A**, feed/profile/comments continue to behave as per `BLOCK-001` (B’s content is hidden on interactive surfaces; nothing explicitly surfaces “B liked/rated this” in a way that breaks the block UX).
      - As **User B**, when returning to A’s catch:
        - B can still toggle the like/unlike state where the UI allows it, but this does not break the block expectations for A.
        - B is **not** able to change the rating previously set on A’s catch; the UI does not offer a way to update the rating post-block, which matches our current expectation.
        - No RPC/RLS errors or error toasts appear while attempting these actions.
      - From A’s perspective, the rating summary does **not** change as a result of B’s post-block attempts to interact.
  - **Bug(s):**
    - None currently known for this flow at v3; any deeper policy changes (e.g. automatically stripping or re-weighting blocked users’ ratings) are considered out of scope for this hardening pass.
