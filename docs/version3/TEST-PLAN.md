# ReelyRated v3 – Manual Test Plan

This document is the **master test runbook** for ReelyRated v3.

- **FEATURE-INVENTORY.md** → what features exist and why.
- **PAGE-RPC-MAP.md** → which RPCs/tables each page uses.
- **ERD.md** → data model & relationships.
- **RLS-DESIGN.md** → how access control _should_ behave.
- **HARDENING-TEST-PLAN.md** → deeper security/RLS checks.

This file is for **manual testing**: which flows we test, how often, and what passed/failed.

## Legend: Test ID prefixes

- `AUTH-***` – Authentication & session flows (sign-up, sign-in, reset password, change email, abuse cases).
- `SHELL-***` – App shell, global navigation, and anon vs authenticated behaviour.
- `FEED-***` – Feed loading and filtering behaviour.
- `CATCH-***` – Create/edit/delete catch flows.
- `RATE-***` / `RATE-SUMMARY-***` / `RATE-LIMIT-***` – Reactions, ratings, aggregates, and rate-limiting.
- `COMM-***` – Comments, replies, and mentions.
- `PROFILE-***` / `FOLLOW-***` / `BLOCK-***` – Profiles, following, and blocking behaviour.
- `VENUES-***` / `VENUES-DETAIL-***` – Venue directory & venue detail pages.
- `VENUES-EVENTS-***` – Venue events (v4+ placeholders).
- `REPORTS-***` – User reports and admin review.
- `ADMIN-***` – Admin/moderation tools and dashboards.
- `RLS-HARDEN-***` – Deep RLS and access-control hardening passes.
- `JOURNEY-***` – End-to-end user journeys (e.g. new angler, returning angler).
- `INSIGHTS-***` – Insights/analytics surfaces.
- `LEADERBOARD-***` – Leaderboard and highlight surfaces.

### Conventions

- **Status values:** ☐ Not run · ✅ Pass · ❌ Fail
- Use the **same field order** for every test so we can scan quickly:
  1. **Status**
  2. **Last run** (YYYY-MM-DD · Local Docker | Dev | Prod · Runner)
  3. **Preconditions** (optional)
  4. **Steps**
  5. **Expect**
  6. **DB / SQL checks** (optional)
  7. **Notes**

#### Test case template

- [ ] **TEST-ID – Short name**
  - **Status:** ☐ Not run
  - **Last run:** YYYY-MM-DD · Local Docker · <name>
  - **Preconditions:**
    - (optional)
  - **Steps:**
    1. ...
  - **Expect:**
    - ...
  - **DB / SQL checks:**
    ```sql
    -- optional
    ```
  - **Notes:**
    - ...

---

## 0. Environments

- **Local dev (Docker Supabase)**
  - Supabase API: `http://127.0.0.1:54321`
  - DB: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
  - Frontend dev server: `http://localhost:8081` (current Vite dev URL)
- **Remote Dev (hosted Supabase)**
  - Project: `ReelyRated-Dev`
- **Production**
  - Project: `ReelyRatedv3` (ReelyRated-Prod)

## Hardening progress checklist (tests not yet run)

> Quick at-a-glance list of the main v3/v4 tests that are currently marked as “Not run” (`☐`) in the detailed sections below. Keep this list in sync when you add or complete tests.

| Test ID                 | Description                                      | Status |
| ----------------------- | ------------------------------------------------ | ------ |
| VENUES-002              | Filters / search                                 | ✅     |
| RLS-HARDEN-001          | Catches/comments/reactions/ratings RLS deep pass | ✅     |
| RLS-HARDEN-002          | Profiles/follows/blocks RLS deep pass            | ✅     |
| REPORTS-003             | RLS & abuse / rate-limit edge cases              | ✅     |
| DEV-PROMOTION-SMOKE-001 | Dev promotion browser smoke suite (UI + SQL)     | ☐      |
| ADMIN-003               | Clear moderation status surface (v4+)            | ☐      |
| VENUES-EVENTS-001       | Venue events (v4+)                               | ☐      |
| INSIGHTS-001            | Insights page (v4+)                              | ☐      |
| LEADERBOARD-001         | Leaderboard & highlights (v4+)                   | ☐      |

- [ ] **DEV-PROMOTION-SMOKE-001 – Dev promotion browser smoke suite**

  - **Status:** ☐ Not run
  - **Last run:** —
  - **Runbook:** `docs/version3/tests/DEV-PROMOTION-SMOKE.md` (to be created)

  - **Goal:**

    - A fast, repeatable browser smoke pass that validates recent hardening work end-to-end (UI → RPC → triggers → RLS) before promoting Local → Remote Dev.

  - **Scope (v3):**

    - **Hybrid public access model:** `/venues` + `/venues/:slug` public; protected routes redirect to `/auth`.
    - **Follow / block:** follow/unfollow works; blocked follow attempts fail cleanly (RLS-HARDEN-002).
    - **Reports:** happy path + rate limit UX (REPORTS-003).
    - **Comments + rating summary non-leak:** key “deny” cases behave cleanly (RLS-HARDEN-001).
    - **Admin warning:** admin can warn a user and the user sees the notification (ADMIN-002 smoke).

  - **Notes:**
    - Some validations are **SQL-only** today because the UI has no surface:
      - Admin listing of `profile_follows` edges.
      - Reporting an inaccessible target (you generally can’t open private/blocked catches/comments in UI).
    - Use the stable seeded actors:
      - A (owner): `aa35e9b8-9826-4e45-a5b0-cec5d3bd6f3a`
      - B (follower): `8fdb5a09-18b1-4f40-babe-a96959c3ee04`
      - C (stranger): `dc976a2a-03fe-465a-be06-0fa1038c95cf`
      - D (blocked): `8641225a-8917-435e-95f2-bb4356cd44d0`
      - Admin: `d38c5e8d-7dc6-42f0-b541-906e793f2e20`

---

## 1. Auth & App Shell

### Auth & Sessions

See `AUTH-FLOWS.md` for the detailed checklist and results.

> - Core email/password sign-up and sign-in ✅
> - Forgot-password + reset flow ✅ (fully verified end-to-end via Mailpit on Local Docker – see `AUTH-FLOWS.md`).
> - Change-email flows ✅ (fully verified end-to-end; see AUTH-004 and `AUTH-FLOWS.md`).
> - Logout, auth guards, and multi-tab/session behaviour ✅
> - Negative/abuse cases ✅ (basic coverage; no visible lockout/throttle UX yet — consider clearer offline/network error messaging as a v4+ polish item).

### 1.1 Core Auth Flows

- [x] **AUTH-001 – Email/password sign-up**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-04 (Local Docker – James)
  - **Steps:**
    - Open `/auth`.
    - Sign up with a new email + password.
    - Complete any required profile fields.
  - **Expect:**
    - User is created in Supabase Auth + `profiles`.
    - Redirect to the main app shell (feed/home).
    - No console errors.
  - **Notes:**
    - Core flow works. Verification email not observed yet (see `AUTH-FLOWS.md` for detail).

- [x] **AUTH-002 – Email/password sign-in**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-04 (Local Docker – James)
  - **Steps:**
    - Sign out if logged in.
    - From `/auth`, sign in with the account from AUTH-001.
  - **Expect:**
    - Successful login.
    - `AuthProvider` fetches current profile without errors.
    - Nav updates to “logged-in” state.
  - **Notes:**
    - Works as expected (see `AUTH-FLOWS.md`).

- [x] **AUTH-004 – Change email flow**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-12 (Local Docker – James)
  - **Steps:**
    - As a logged-in user, go to `/settings/profile` (or the relevant account/email settings surface).
    - Change your email address to a new, unused email (e.g. from `test8@test.com` → `test9@test.com`, then again to `test10@test.com`).
    - Complete any email confirmation step (follow the link from Mailpit/real email).
    - After confirmation, sign out and sign back in with the **new** email.
    - Attempt to sign in with the **old** email and confirm what happens.
  - **Expect:**
    - A pending email change is clearly communicated in the UI (e.g. “Check your inbox to confirm the new email address.”).
    - After confirming the email change, the **new** email works for sign-in and the **old** email no longer works.
    - Only a single `auth.users` row exists for the user’s id, with `email` updated to the latest address (e.g. `test10@test.com`).
    - The linked `public.profiles` row remains intact (same id/username, `is_deleted = false`).
    - No raw Supabase errors, 400s, or confusing toasts appear during the flow (including after the redirect from the change-email link).
  - **Notes:**
    - Verified via SQL that:
      - `auth.users.email` was updated to the new address (latest value: `test10@test.com`).
      - The profile row stayed stable (`is_deleted = false`, username unchanged).
    - `raw_user_meta_data.email` may continue to show an older email value after the change; for v3 we treat `auth.users.email` as the canonical source of truth, and the app reads the email from there rather than from metadata.
    - Using the same change-email link a second time drops the user on `/auth` without a dedicated “link expired/invalid” message. This is acceptable for v3, and we’ll revisit the UX for reused/expired tokens under **AUTH-005 – Forgot password: invalid/expired links** and future change-email hardening.

- [x] **AUTH-005 – Forgot password: invalid/expired links**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-12 (Local Docker – James)
  - **Steps:**
    - Trigger a normal password reset for a test user and capture the reset link from Mailpit.
    - In a fresh browser tab/window (logged out is fine), click the link once and complete a normal reset (happy path – this overlaps with AUTH-003).
    - After a successful reset, sign in with the new password to confirm it works.
    - Attempt to use the **same** reset link again.
    - Generate a new reset email, manually corrupt the token in the URL (e.g. change or append a character), and load that corrupted URL.
  - **Expect:**
    - First valid use of the link:
      - Routes through Supabase’s `/auth/v1/verify` and redirects to `/auth?reset_password=1`.
      - Shows the “Choose a new password” form.
      - On submit, shows a success toast (e.g. “Your password has been updated.”), signs the user in, and lands them on the main app shell (home/feed) without errors.
    - Subsequent / invalid / corrupted links:
      - Still render the “Choose a new password” page, but:
        - A clear inline message appears (e.g. “This link has expired or is invalid. Please request a new password reset email.”).
        - The “Update password” button is **disabled/inactive**, so no further attempt is made with an invalid token.
      - No 404 or blank screen is shown; the user is always given a clear way back to the normal reset flow.
      - No raw Supabase errors or stack traces are surfaced to the user; any underlying 4xx/5xx responses are mapped to the friendly banner message.
  - **Notes:**
    - Verified on 2025-12-12 that:
      - First use of the reset link successfully updated the password and signed the user in with the new credentials.
      - Re-using the same link showed the invalid/expired banner and disabled the submit button, matching the intended v3 UX.
    - Supabase’s built-in recovery token validation is handling the invalid/expired cases correctly; our UI now surfaces these states clearly and avoids any broken or half-functional reset form.
    - Further fine-tuning (e.g. adding a direct “Request a new reset email” button next to the banner) can be considered as a v4+ UX polish item but is not required for v3 hardening.

- [x] **AUTH-006 – Abuse / rate-limit behaviour (sign-in & reset)**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-12 (Local Docker – James)
  - **Steps:**
    - On `/auth`, repeatedly:
      - Attempt sign-in with a wrong password for a real account.
      - Attempt sign-in with completely unknown emails.
      - Hammer the “Forgot password” flow for the same email several times in a row (both a real email and an obviously fake one).
    - Watch the UI toasts/messages and browser console for errors.
  - **Expect:**
    - Error messages for invalid credentials are generic and do **not** leak whether an email exists in the system.
    - Repeated failed attempts (sign-in or reset) do not crash the app or produce raw Supabase error output; they remain user-friendly.
    - If any visible rate-limiting is implemented by Supabase (e.g. temporary lockouts), the UI surfaces a sensible message and does not get stuck in a broken state.
  - **Notes:**
    - Repeated wrong-password attempts produced multiple `400 Bad Request` responses on `auth/v1/token` in the network tab, but the UI stayed stable and continued to show a generic invalid-credentials message. No `429` responses or raw JSON error bodies were surfaced to the user.
    - Repeated “Forgot password” requests for both real and fake emails succeeded from the UI’s point of view: the toast was generic and identical for both (did not reveal whether the email exists), and the app did not crash or leak internal error messages. Multiple reset emails in Mailpit are acceptable for local dev.
    - There is currently no visible lockout or throttling UX in v3; that’s acceptable for now. If Supabase’s built-in limits change in future (e.g. start returning `429`), we may want to add a more explicit “Too many attempts, please try again later” message as a v4+ polish item.

### 1.2 App Shell & Navigation

See `SHELL-NAV-FLOWS.md` for detailed steps and results.

- [x] **SHELL-001 – App shell navigation (signed-in)**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-12 (Local Docker – James)
  - **Steps:**
    - While signed in as a normal user, use the main navigation to visit:
      - Home/logo link → feed/home.
      - `/feed` via the "Feed" nav item.
      - `/venues` via the "Venues" nav item.
      - Any insights/leaderboard route if present.
    - From the avatar/profile menu, visit:
      - Your own profile at `/profile/:username`.
      - `/settings/profile` (or equivalent profile settings route).
      - `/add-catch` via the "Log catch" / "Add catch" CTA.
      - Open the notifications bell/dropdown if present.
    - From `/feed`, click through to a catch detail (`/catch/:id`), then through to a venue detail (`/venues/:slug`) from that catch, and use the browser Back/Forward buttons to navigate between them.
  - **Expect:**
    - Each nav click updates the URL and mounts the correct page without 404s or white-screen errors.
    - The app shell (header/nav) remains stable across route changes; no unexpected unmounts or auth-guard loops.
    - Feed, venues index, venue detail, profile, settings, add-catch, and notifications surfaces all render without Supabase/network errors in the console.
    - Back/Forward navigation correctly restores the previous page state without breaking the auth guard or leaving the UI in a half-mounted state.
  - **Notes:**
    - Verified end-to-end on Local Docker as a normal user; all primary shell routes behaved as expected with no 404s, no infinite redirects, and no visible console errors.
    - Logged-out behaviour is covered in **SHELL-003 – Anon vs authenticated behaviour (hybrid model)** and remains consistent with this test: protected routes are still guarded by the central `RequireAuth` wrapper in `src/App.tsx`, while venue surfaces remain publicly readable.

- [x] **SHELL-002 – Auth guard redirects for deep links (signed out)**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-12 (Local Docker – James)
  - **Steps:**
    - While **signed out**, try to open several protected pages directly by URL, for example:
      - `/feed`
      - `/catch/:id` for a known public catch
      - `/profile/:username` for a known user
      - `/add-catch`
      - `/settings/profile`
      - `/notifications`
      - `/my/venues` and `/my/venues/:slug`
    - For each URL:
      - Paste it into the browser address bar in a logged-out tab.
      - Observe where you land and whether any part of the target page flashes before redirect.
    - From the `/auth` page, sign in with a normal user account and observe which page you land on after login.
  - **Expect:**
    - While signed out:
      - All **protected** routes (feed, catch detail, profile, add-catch, settings, notifications, owner venues, etc.) immediately redirect to `/auth`.
      - You do **not** see partial page content, error toasts, or Supabase 401s in the console before the redirect.
      - `/venues` and `/venues/:slug` remain accessible as read-only public pages.
    - After signing in from `/auth`:
      - You land on the default post-login page (currently the main feed/home), not the originally requested deep-link URL.
      - This is acceptable for v3; preserving and restoring the original deep-link target after login is a **v4+ enhancement**, not a current requirement.
  - **Notes:**
    - Verified that the central `RequireAuth` wrapper in `src/App.tsx` consistently guards all social/personal routes and prevents anonymous users from hitting them directly.
    - This test specifically checks the **redirect behaviour** for deep-linked URLs while logged out and documents the current post-login behaviour:
      - Redirect-to-`/auth` works as expected.
      - Post-login always lands on the default app page rather than the original deep link, which we have explicitly accepted for v3 and captured as a potential v4 improvement.

- [x] **SHELL-003 – Anon vs authenticated behaviour (hybrid model)**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-11 (Local Docker – James)
  - **Steps:**
    - While **signed out**, try to open:
      - `/` or `/feed`
      - `/catch/:id` for a public catch
      - `/venues` and a venue detail `/venues/:slug`
      - A public profile `/profile/:username`
      - A clearly private page: `/add-catch`, `/my-venues`, `/settings`, `/notifications`
    - Then repeat the same URLs while **signed in** as a normal user.
  - **Expect:**
    - Logged-out:
      - Can only access **read-only venue surfaces**:
        - `/venues`
        - `/venues/:slug`
        - (and, in future, a public `/leaderboard` page if/when implemented).
      - Visiting any other app route (e.g. `/feed`, `/catch/:id`, `/profile/:username`, `/add-catch`, `/settings`, `/settings/profile`, `/notifications`, `/my-venues`, etc.) results in a redirect to `/auth` with a clear sign-in / sign-up prompt.
    - Logged-in:
      - All of the above routes are reachable, subject to their own RLS and feature-specific tests.
      - `/venues` and `/venues/:slug` remain readable, but now also surface owner controls and social actions where appropriate (e.g. "Manage venue" for owners, navigation into catches and profiles, etc.).
  - **Notes:**
    - This test now encodes the **tightened v3 hybrid access model** and has been implemented via a central `RequireAuth` wrapper in `src/App.tsx` using the existing auth context.
    - As of 2025-12-11 (Local Docker – James):
      - Anonymous visitors can only access **read-only venue surfaces**:
        - `/venues`
        - `/venues/:slug`
        - (and, in future, a public `/leaderboard` page if/when implemented).
      - Visiting any other app route while logged out (e.g. `/feed`, `/catch/:id`, `/profile/:username`, `/add-catch`, `/settings`, `/settings/profile`, `/notifications`, `/my-venues`, `/my/venues/:slug`, etc.) results in a redirect to `/auth` instead of mounting the page and hitting 401s.
      - Logged-in users can reach all of the above routes, subject to their own RLS and feature-specific tests; `/venues` and `/venues/:slug` remain readable but also surface owner controls and social actions where appropriate (e.g. "Manage venue" for owners).
    - Re-run this test after any router/auth-guard changes to ensure logged-out users cannot deep-link into `/catch/:id`, `/profile/:username`, or other social pages without being prompted to sign in, and to confirm no unexpected 401 error toasts appear for anonymous visitors.

---

## 2. Core Social: Feed, Catches, Comments, Following

### 2.1 Feed

See `CORE-SOCIAL-FLOWS.md` for detailed steps and result logs.

- [x] **FEED-001 – Public feed loads**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-12 (Local Docker – James)
  - **Steps:**
    - Navigate to `/` or `/feed`.
  - **Expect:**
    - Catches list loads (or empty state if DB is empty).
    - No unhandled Supabase errors in console.
  - **Notes:**
    - Verified on Local Docker as a signed-in user: feed loads correctly, shows either seeded catches or a sensible empty state, and there are no unhandled Supabase/RLS errors in the browser console.

- [x] **FEED-002 – “People you follow” filter**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-06 (Local Docker – James)
  - **Steps:**
    - Create at least two users: A (you) and B.
    - From A, follow B; ensure B has at least one catch.
    - On the feed, switch between “All catches” and “People you follow”.
  - **Expect:**
    - “People you follow” shows B’s catches only (and other followed users).
    - Unfollow B → they disappear from the “people you follow” feed.
  - **Notes:**
    - “All catches” and “People you follow” behave as expected for normal users (B’s catches only show in the follow feed when A follows B).
    - Admin accounts no longer see “Add/Log catch” CTAs on feed or mobile nav and are blocked from /add-catch via a friendly message.
    - RLS migration 2097_block_admin_catch_inserts.sql prevents admin users from inserting/updating/deleting catches directly, while non-admin insert behaviour is unchanged.

### 2.2 Catches (Create / Edit / Delete)

- [x] **CATCH-001 – Add catch basic flow**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-11 (Local Docker – James)
  - **Steps:**
    - Go to `/add-catch`.
    - Fill mandatory fields (species, weight, time, venue or location).
    - Upload a photo if supported.
    - Save.
  - **Expect:**
    - Catch appears in your profile and feed.
    - Weight/units/time_of_day look correct.
    - No RLS errors in the network tab.
  - **Notes:**
    - Verified end-to-end with catch `ce475fac-0617-427d-87c4-9610f94add8f`:
      - `public.catches` row has `title = "Catch Test"`, `species = "carp"`, `weight = "1"`, `weight_unit = "lb_oz"`, `visibility = "public"`, and a recent `created_at` timestamp.
      - Catch appeared correctly on the profile and in the feed with no Supabase/network errors.

- [x] **CATCH-002 – Edit catch**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-11 (Local Docker – James)
  - **Steps:**
    - Open an existing catch you own.
    - Click the **"Edit catch"** action on the catch detail page.
    - Edit the **description** and/or **tags** (only non-leaderboard fields are editable).
    - Save and return to the catch detail view.
  - **Expect:**
    - Updated **description** and **tags** are persisted.
    - Catch detail shows the new description/tags.
    - Feed/profile views reflect the updated description/tags after refresh.
    - Weight/length, species, and capture date/time remain unchanged (leaderboard-critical fields are not editable by anglers).
  - **Notes:**
    - Verified using catch `be85007e-99c1-4f64-bdc1-a1a048bbe7e1` owned by the test user.
    - Editing non-leaderboard fields via the UI (e.g. description/tags where exposed) works as expected:
      - Catch detail shows the updated values after save and refresh.
      - The owner’s profile catch card also reflects the updated data after refresh.
    - The `/feed` catch card currently does not surface description/tags, so there is no visible change on that tile after editing. This is acceptable for v3 but can be revisited in a future pass if we want richer feed cards.
    - Only non-admin owners should see and use the edit affordance. Admin users remain moderation-only and cannot edit catches.

- [x] **CATCH-003 – Delete (soft delete) catch**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-11 (Local Docker – James)
  - **Steps:**
    - As **User A**, pick one of your catches.
    - Use the UI to delete it.
    - Refresh:
      - A’s profile.
      - Main feed.
      - Any venue page where this catch previously appeared.
    - (Optional) Try to open the catch detail via its direct URL as the owner.
    - (Optional DB check) Query `public.catches` for the catch ID.
  - **Expect:**
    - The catch no longer appears:
      - On your profile.
      - In the main feed.
      - In venue detail pages (recent/top/leaderboard sections).
    - For other users, the catch is effectively removed from normal discovery surfaces.
    - As the owner, opening the direct URL may still be allowed by RLS, but the catch is treated as deleted in all public/social contexts.
    - In the DB, the row still exists (soft delete) with `deleted_at` populated.
  - **Notes:**
    - Re-verified on 2025-12-11 with catch `95f8dad3-b6e1-4e04-8efc-b0a3ca7526c2`: `deleted_at` is populated in `public.catches` and the catch no longer appears on the owner profile, main feed, or venue detail surfaces for other users.

- [x] **RATE-LIMIT-001 – Catch creation rate limit**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-13 (Local Docker – James)
  - **What we’re testing:**
    - Server-side rate limit for catch creation (10 catches per rolling 60 minutes).
    - UI behaviour when the limit is hit.
  - **Steps:**
    1. As User A, go to `/add-catch` and create catches until you approach the limit.
    2. Watch the UI and network panel as you submit each catch.
    3. Continue submitting until the backend rejects the insert with a `RATE_LIMITED` error.
  - **Expect:**
    - Catch submissions succeed until the backend limit is reached.
    - The submit button text behaves normally (e.g. "Log this catch" / "Publishing catch…").
    - There is **no** "X remaining" counter anywhere on the form; we no longer rely on a client-side/localStorage counter.
    - When the limit is hit:
      - The user sees a clear toast indicating they have hit the catch limit (e.g. `RATE_LIMITED: catches – max 10 per hour` or the mapped friendly version).
      - Further attempts within the hour continue to be rejected by the backend.
    - After an hour has passed (or after manually clearing recent rows in `public.rate_limits` for local dev), submissions succeed again.
  - **Notes:**
    - The **backend** trigger `enforce_catch_rate_limit` (via `check_rate_limit(auth.uid(), 'catches', 10, 60)`) is the single source of truth for catch limits.
    - The **UI** no longer tracks client-side attempts or shows a "remaining attempts" counter; this avoids drift between localStorage and the server-side `rate_limits` table.
    - If we later change the allowed number of catches or the time window, we only need to update the backend configuration and the static helper text on the Add Catch page, not any client-side counter logic.

### 2.3 Comments & Mentions

- [x] **COMM-001 – Add comment to a catch**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-10 (Local Docker – James)
  - **Steps:**
    - User A owns a public catch.
    - User B visits the catch detail page.
    - User B writes a simple text comment (e.g. `Nice catch!`) and posts it.
  - **Expect:**
    - Comment appears under the catch with B’s username/avatar and correct text.
    - Comment count increments on the catch detail page and any feed/profile tiles that display a comment count.
    - No rate-limit or RLS errors for the first comment.
  - **Notes:**
    - Verified end-to-end in UI and DB:
      - `public.catch_comments` row created with the correct `catch_id`, `user_id` (User B), `body = "Nice catch!"`, and `deleted_at IS NULL`.
      - Joined query with `profiles` confirmed the correct `username` (`test2`).
    - Notification behaviour for new comments is covered under **NOTIFY-001**.
    - See `CORE-SOCIAL-FLOWS.md` → COMM-001 for full SQL snippets and run log.

- [x] **COMM-002 – Reply threading**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-10 (Local Docker – James)
  - **Steps:**
    - On a catch with at least one comment, User B posts a reply to an existing comment (not a new top-level comment).
  - **Expect:**
    - Reply appears visually threaded under its parent comment.
    - Parent/child counts and indentation look correct.
    - Deleting a parent does not leave the UI in a broken state (if reply threading is implemented).
  - **Notes:**
    - Reply threading is implemented end-to-end:
      - Replies are visually nested under their parent comment with a clear "Thread – n replies" label.
      - Comment counts on the catch detail page and any feed/profile tiles stay in sync and include both parent comments and replies.
    - Deleting a parent comment does **not** delete its replies:
      - The parent comment is soft-deleted (`deleted_at` populated) and rendered as a tombstone ("Comment deleted") in the UI.
      - Child replies remain visible underneath the tombstone, preserving the conversation context.
    - Verified in the database via `public.catch_comments`:
      - Parent top-level comment has `parent_comment_id IS NULL` and `deleted_at IS NOT NULL` after deletion.
      - Reply row has `parent_comment_id` pointing to the deleted parent and `deleted_at IS NULL`.
    - This behaviour is acceptable for v3: threads remain readable even when the initiating comment is removed, and there were no RLS or rate-limit errors observed during the test.

- [x] **COMM-003 – Mentions + notifications (happy path)**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-10 (Local Docker – James)
  - **Steps:**
    - User A owns a public catch.
    - User B comments on A’s catch and includes `@<A’s username>` in the comment body.
    - Optionally, B also mentions a third user C in a separate comment on the same catch.
    - Each mentioned user opens their notifications bell dropdown and then clicks through to the catch.
  - **Expect:**
    - The comments themselves render correctly with the mention text visible on the catch detail page.
    - Mentioned users (A and C) receive a **“Mention”** notification type (distinct from a generic new-comment notification).
    - When the catch owner A is @mentioned on their own catch, they receive a **mention** notification instead of a generic new-comment notification.
    - Clicking a mention notification opens the correct catch detail page and scrolls to the related comment so it is visible in context.
  - **Notes:**
    - Behaviour matches the documented expectations in `CORE-SOCIAL-FLOWS.md` under COMM-003 and in `NOTIFICATION-FLOWS.md` under NOTIFY-002.
    - Verified in the database that:
      - Mention notifications are stored with `type = 'mention'`, correct `user_id` (recipient), `actor_id` (comment author), and matching `catch_id` / `comment_id`.
      - Non-mention comments still produce generic `new_comment` notifications for the catch owner only.
    - No RLS or rate-limit errors were observed during these tests; the existing notification and comment flows remain stable.

### 2.4 Profiles & Following / Blocking

- [x] **PROFILE-001 – View profile**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-10 (Local Docker – James)
  - **Steps:**
    - Open `/profile/:username` for your own profile.
    - Open `/profile/:username` for another user (someone you follow, and someone you don’t).
  - **Expect:**
    - Basic stats render: catches count, followers/following counts, avatar, bio.
    - Your own profile shows full self-view (edit controls, settings links, etc.).
    - Other users’ profiles show only what is allowed by current privacy/blocking rules (see BLOCK-001 for detailed block-specific checks).
  - **Notes:**
    - Verified with users `test` and `test2`:
      - `public.catches` showed `catches_count = 8` for `test` and `6` for `test2`, matching the UI.
      - `public.profile_follows` `following_count` for `test` matched the profile header.
    - No unexpected self-controls appeared on other users’ profiles, and no RLS or Supabase errors were observed in the network tab.
    - This test is mainly about the basic profile shell and counts; detailed blocking behaviour is covered in BLOCK-001.

- [x] **FOLLOW-001 – Follow / unfollow**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-10 (Local Docker – James)
  - **Steps:**
    - Create users A and B.
    - From A, visit B’s profile and follow B.
    - Check follower/following counts on both profiles.
    - From A, unfollow B.
  - **Expect:**
    - After following:
      - A’s “following” count increments.
      - B’s “followers” count increments.
      - B’s public catches appear in A’s “People you follow” feed filter.
    - After unfollowing:
      - Counts decrement appropriately on both sides.
      - B’s catches disappear from A’s “People you follow” feed.
  - **Notes:**

    - Verified via `public.profile_follows`:
      - Follow row created with `follower_id = 17f4… (B)`, `following_id = cc2e… (A)`.
      - `followers_count` for A matched the UI before and after unfollow.
    - Behaviour matches FEED-002 expectations for the “People you follow” filter.

- [x] **BLOCK-001 – Blocked user visibility (feed/profile/catches/leaderboard)**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-07 (Local Docker – James)
  - **Steps:**

    - Create users A and B.
    - Ensure B has:
      - At least one public catch that appears in the main feed.
      - That catch visible on B’s profile.
      - That catch contributing to the leaderboard (if seeded appropriately).
      - At least one comment on a catch A can see (for comment visibility checks).
    - From A, use the UI to block B.
    - As A, re-check:
      - Main feed.
      - Catch detail pages where B’s content previously appeared.
      - Comments where B had commented.
      - Leaderboard (overall board + any spotlight widgets).
    - Optionally, as B, try to view A’s catches/profile to confirm symmetric blocking behaviour, if designed that way.

  - **Expect:**

    - From A’s point of view:
      - B’s catches no longer appear in A’s feed or on A’s own catch/comment surfaces, consistent with current RLS/block rules.
      - B’s comments no longer appear under catches where A would otherwise see them.
      - A can still see the global leaderboard rankings:
        - B’s rows remain visible and correctly ranked (leaderboard is a global scoreboard).
        - When A clicks a leaderboard row for B (profile or catch links), navigation is blocked and a toast explains that one of the users has blocked the other.
    - From B’s point of view (if symmetric blocking is enabled):
      - Similar behaviour when viewing A’s content (feed/profile/catch pages).
    - From anon/admin:
      - Leaderboard remains fully visible and clickable (no block gating for anon; admins bypass for moderation).

  - **Notes:**
    - Verified that the global leaderboard now uses a viewer-relative `is_blocked_from_viewer` flag plus centralised navigation gating. Rows for blocked users stay in the ranking, but clickthrough shows a toast:  
      _“You can’t view this angler’s catches or profile because one of you has blocked the other.”_
    - This test verifies the balance between:
      - Blocked content being hidden on interactive/social surfaces (feed, profiles, catches, comments).
      - The leaderboard remaining a truthful global ranking, with blocks only affecting drill-down.

### 2.5 Reactions & Ratings

- [x] **RATE-SUMMARY-001 – Global rating averages & visibility**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-15 (Local Docker – James)
  - **Steps:**
    - Create users A and B.
    - Ensure B has a public catch (or followers-only, with A following B) and that **allow community ratings** is enabled.
    - As A and at least one additional user (or test account), rate B’s catch with different scores.
    - Visit the catch detail page as:
      - The owner (B).
      - A different authenticated user (A).
      - An anonymous visitor in an incognito window (for a public catch).
    - Visit `/feed` and locate the same catch card in the feed.
  - **Expect:**
    - The catch detail page shows:
      - A non-zero **rating count**.
      - A **global average rating** that reflects all submitted ratings (not just the viewer’s).
      - A “Your rating” value that matches the current user’s rating when signed in, and is blank/absent for anonymous visitors.
    - Feed cards (and any other surfaces using `CatchCard`) show a rating badge with:
      - The same global average.
      - The same rating count.
    - For followers-only catches:
      - Only followers (and the owner/admin) see the catch and its aggregated ratings.
      - Non-followers / anon cannot access the catch or the rating summary.
    - For private catches:
      - Only the owner/admin can see the catch and rating summary; others are blocked.
    - Catches with **allow community ratings** turned off:
      - Show zero rating count and no average, even if rows exist in `public.ratings`.
  - **Notes:**
    - Aggregated ratings are provided via the `get_catch_rating_summary(p_catch_id uuid)` RPC, which returns:
      - `rating_count` (int)
      - `average_rating` (numeric)
      - `your_rating` (int or null)
    - Hardened in migration `2113_harden_get_catch_rating_summary.sql`:
      - Denied viewers (deleted/blocked/insufficient visibility) now receive **0 rows** (no exception) to avoid information leaks.
      - Access checks include **block rules** (`is_blocked_either_way`) for non-admin viewers.
      - `allow_ratings = false` still returns **one row** for allowed viewers with `rating_count = 0` and `average_rating = NULL`.
    - Frontend handling updated so **empty results** are treated as “not accessible” without error toasts (rating UI hides cleanly):
      - `src/hooks/useCatchData.ts`
      - `src/components/feed/CatchCard.tsx`
    - Related write-side hardening (migration `2115_harden_reactions_and_ratings_rls.sql`):
      - Blocked/unauthorized viewers cannot INSERT/UPDATE ratings, even if they guess a catch id.
      - Ratings require `c.allow_ratings = true`; self-rating is denied.
    - Latest manual validation (SQL editor impersonation, 2025-12-15):
      - Follower sees `public` + `followers` summaries; not `private`.
      - Stranger + anon see `public` only.
      - Blocked viewer sees **0 rows**.
      - Upsert paths for ratings/reactions (insert → update) work for allowed viewers.

- [x] **RATE-004 – Reactions & ratings when blocking is involved**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-15 (Local Docker – James)
  - Steps (high level, see `CORE-SOCIAL-FLOWS.md` for full details):
    - User A creates a **public** catch.
    - User B likes and rates A’s catch (e.g. 7/10).
    - As A, confirm B’s like and rating appear correctly on:
      - Catch detail.
      - The `/feed` card.
      - Rating summary (average + count).
    - As A, block B via the profile UI.
    - As A, re-check feed/profile/catch views to ensure B’s content is hidden per `BLOCK-001` and nothing explicitly surfaces “B liked/rated this” in a way that breaks the block UX.
    - As B, attempt to:
      - Like/unlike A’s catch again.
      - Change the rating previously set on A’s catch.
  - **Expect:**
    - Before the block, B’s like and rating are fully reflected in A’s UI and in the global rating summary (average/count).
    - After the block:
      - From A’s perspective, B’s content is hidden on social surfaces in line with `BLOCK-001`; no UI copy explicitly exposes “B liked/rated this catch.”
      - From B’s perspective, post-block attempts to interact with A’s catch do not break the block model:
        - The UI does **not** allow B to change their existing rating on A’s catch.
        - No new ratings are created or updated for A’s catch via B after the block.
        - No unexpected RPC/RLS errors or noisy toasts occur when B attempts these actions.
    - Global rating summaries continue to reflect only valid ratings; A’s rating summary does not change based on B’s post-block attempts.
  - **Notes:**
    - Write-side enforcement is now defence-in-depth at the DB layer (migration `2115_harden_reactions_and_ratings_rls.sql`): blocked users and unauthorized viewers are denied INSERT/UPDATE on `catch_reactions` / `ratings` even if they bypass the UI.

- [x] **JOURNEY-001 – New angler first-session journey**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-12 (Local Docker – James)
  - **Steps:**
    - In an incognito window, arrive at the site logged out and explore the public surfaces:
      - `/venues` and a few `/venues/:slug` pages.
      - Any public leaderboard/highlights surfaces if present.
    - Sign up as a brand new user (fresh email/username) via `/auth`.
    - As this new angler:
      - Add your first catch via `/add-catch`.
      - Find and select a real venue from `/venues` and log another catch there.
      - Follow at least one other angler.
      - React to and comment on at least one catch.
      - Visit `/settings/profile`, set an avatar, and edit your bio.
    - Log out and log back in with the same credentials.
    - Re-orient yourself using the main navigation (feed, profile, venues).
  - **Expect:**
    - The “what is this?” story is clear for a logged-out visitor (public venues/leaderboard surfaces make sense).
    - Sign-up and first catch flows are smooth with no confusing dead-ends, blank states, or raw error messages.
    - Navigation between feed, venues, profile, and settings feels coherent; nothing critical is hidden or hard to find for a new user.
    - After logging out and back in, the app lands on a sensible page (currently the feed/home) and makes it easy to rediscover core actions (log catch, view profile, browse venues).
  - **Notes:**
    - This is a **holistic UX test**, meant to catch rough edges that per-feature tests can miss (e.g. copy, empty states, and the overall narrative).
    - Any issues found during this journey should result in new, more granular test cases in the relevant sections (Auth, Feed, Catches, Settings, etc.), with this test case remaining as the high-level “feels good for a new angler” check.
    - On 2025-12-12 we observed a minor UX bug when changing username from `/settings/profile`: after saving a new username, the app briefly shows an "Angler not found" state before the profile loads correctly under the new username. Likely cause is a short delay between the username update and the profile lookup/route transition. For v3 this is acceptable but should be addressed in a future pass (either by ensuring the profile URL + data update atomically, or by showing a clearer "We’re updating your profile…" loading state instead of a not-found screen).

---

## 3. Venues

### 3.1 Venues Directory

- [x] **VENUES-001 – Venues index loads**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-10 (Local Docker – James)
  - **Steps:**
    - Go to `/venues` while signed in as a normal user.
    - Repeat in an incognito window (logged out) to sanity-check the hybrid access model.
  - **Expect:**
    - Paginated list of venues (or empty state).
    - Basic metadata per venue: name, location, short tagline/price where available.
    - No Supabase or network errors in the console.
  - **Notes:**
    - `/venues` renders a list of published venues including examples like “Barston Lakes, West Midlands” and “Bewl Water, Kent”, matching rows in `public.venues`.
    - SQL sanity checks showed `total_venues = 96` and `published_venues = 96`, which aligns with the visible directory list (all current venues are published).
    - Venue cards link through correctly to `/venues/:slug` (e.g. `/venues/anglers-paradise-devon`), and the page behaves read-only but visible for logged-out visitors, consistent with the v3 hybrid model.

- [x] **VENUES-002 – Filters / search**

  - **Status:** ✅ Pass (v3 scope)
  - **Last run:** 2025-12-15 (Local Docker – James)
  - **Steps:**
    - Use the search bar and ticket-type filter on `/venues` while signed in.
    - Repeat basic behaviour in an incognito window (logged out) to confirm the hybrid access model behaves consistently.
    - With no search term:
      - Apply a ticket-type filter and confirm the list shrinks.
      - Clear the filter and confirm the full list returns.
    - With a search term (e.g. “Devon”):
      - Apply a ticket-type filter and confirm results reflect the intersection.
      - Clear the filter and confirm results return to the search-only list.
  - **Expect:**
    - Search query changes update the venue list, and clearing the search resets back to the full list.
    - Ticket-type filtering is consistent with the values shown on venue cards:
      - Selecting a ticket type shrinks the list to venues with that ticket type.
      - Clearing the filter restores the unfiltered list.
    - Combined search + filter reflects the intersection.
  - **Result:**
    - **Search query behaviour** – ✅ Pass
      - Search remains backed by `get_venues(p_search, p_limit, p_offset)` and is intentionally applied to **name/location** only.
    - **Ticket type filter (no search term)** – ✅ Pass
      - Ticket-type options are built dynamically from the loaded venues and matched using a normalization layer (trim/lowercase/space collapsing), so free-text variants from admin no longer cause mismatches.
    - **Combined search + filter** – ✅ Pass
      - Location search + ticket type narrowing works as expected.
  - **Notes:**
    - **Known limitation (accepted for v3):** the search bar does **not** search `ticket_type`/tags; it remains name/location only.
    - Frontend changes:
      - `/venues` ticket-type dropdown options are derived from venue data (normalized), and matching uses normalized values.
      - This removes the previous hardcoded-options mismatch that caused filter-only failures.
    - Re-run this test after any changes to `get_venues` or venue metadata fields.

Follow-up / current v3 behaviour

- Search bar (v3 reality)

  - Backed by the `get_venues(p_search, p_limit, p_offset)` RPC.
  - `p_search` is applied in SQL to **name** and **location** fields only:
    - `WHERE name ILIKE %p_search% OR location ILIKE %p_search%`.
  - It **does not** search ticket types/tags/facilities.

- Ticket type filter (v3 reality)

  - `ticket_type` remains stored as free text on venues.
  - The ticket-type dropdown options on `/venues` are derived from the loaded venue data (normalized).
  - Filtering is performed client-side using normalized comparisons (trim/lowercase/space collapsing), so common variants entered in admin no longer cause mismatches.

- Combined search + filter (v3 reality)

  - Location search + ticket-type narrowing works as the intersection.

Known limitations (accepted for v3 hardening)

- Search is intentionally limited to `name` + `location` only.
- Ticket-type filtering is client-side (not server-side); performance is acceptable at current catalogue size.

Out of scope for v3 — v4+ improvements

- Extend `get_venues`:
  - Add `p_ticket_type` (and later tags/facilities params) for server-side filtering.
  - Optionally expand `p_search` to include ticket types/tags.
- Normalise ticket types fully:
  - Introduce an enum/lookup table so admin input and UI filters share a single source of truth.
- Indexing / performance:
  - Once the model is stable, consider indexes for any new server-side filter columns.

### 3.2 Venue Detail

- [x] **VENUES-DETAIL-001 – Venue detail loads by slug**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-10 (Local Docker – James)
  - **Steps:**
    - Click any venue from the directory.
  - **Expect:**
    - "/venues/:slug" renders full venue card, stats, and recent catches.
    - "get_venue_recent_catches" returns without 400 errors.
  - **Notes:**
    - Verified using the seeded venue `Anglers Paradise, Devon` (slug `anglers-paradise-devon`).
    - `public.venues` returned the correct row, and `/venues/anglers-paradise-devon` rendered as expected without Supabase errors.

- [x] **VENUES-DETAIL-002 – Recent catches widget**
  - **Status:** ✅ Pass
  - **Last run:** 2025-12-10 (Local Docker – James)
  - **Steps:**
    - Ensure a venue has at least one catch tagged with that venue.
    - Open venue detail.
  - **Expect:**
    - Recent catches section shows those catches.
    - Weight/units/species text match catch data.
  - **Notes:**
    - For `Anglers Paradise, Devon`, `get_venue_recent_catches('d9525dae-9fff-44df-972c-d0e88f1f2708'::uuid, 1, 0)` returned the expected catch (title `Seed`) with joined `profiles`, `ratings`, `comments`, `reactions`, and `venues` data.
    - The venue detail page showed the same catch, with matching angler username, species, weight, and counts, and no RLS or RPC errors in the network tab.

### 3.3 My Venues / Admin

- [x] **VENUES-OWNER-001 – Owner manage entry point (per-venue)**

  - **Status:** ✅ Pass (v3 scope)
  - **Last run:** 2025-12-15 (Local Docker – James)
  - **Steps:**
    - Add a user as an owner for a known venue in `venue_owners`.
    - As that owner user, open the venue detail page at `/venues/:slug`.
    - Observe the “Manage venue” control.
    - As an admin user, open the same venue detail page and observe the admin manage control.
  - **Expect (v3 intent):**
    - Owners should not be sent to a broken route.
    - Admins should retain access to the working admin manage route.
  - **Result:**
    - **Owner (non-admin):** “Manage venue” is shown as a **disabled** outline button with a tooltip/title (e.g. “Owner tools coming soon”), preventing navigation to the nonexistent `/my/venues/:slug` route.
    - **Admin:** continues to see the working `/admin/venues/:slug` manage link.
  - **Notes:**
    - Owner management UI (`/my/venues` and `/my/venues/:slug`) remains a **v4+** feature.
    - This test is considered passing for v3 because the UI no longer exposes a 404 path for owners.

- [ ] **VENUES-OWNER-002 – Owner “My venues” dashboard (future)**

  - **Status:** ☐ (not implemented – v4+)
  - **Last run:** —
  - Intended steps (future):
    - Create an owner user with multiple venues in `venue_owners`.
    - Visit a dedicated owner dashboard route (e.g. `/my/venues`).
  - Intended expect:
    - List shows only venues where this user is an owner.
    - Each row links to an owner-only manage view (e.g. `/my/venues/:slug`).
    - Non-owners cannot access this page (RLS + UI guard).
  - **Notes:**
    - There is currently **no** `/my/venues` route and no owner-venues list RPC/view.
    - Keep this as a placeholder for a future v4 feature: proper “My Venues” dashboard backed by `venue_owners` and owner-aware RPCs.

- [ ] **VENUES-OWNER-INVITE-001 – Admin invites venue owner by email (v4+)**

  - **Status:** ☐ (not implemented – v4+)
  - **Last run:** —
  - Intended steps (future):
    - From an internal/admin UI, select a venue and enter the prospective owner’s business email.
    - Trigger an “Invite owner” action which creates an invitation record and sends an email with a secure claim link (e.g. `/owner-invite/:token`).
  - Intended expect:
    - An invitation row is created (e.g. in `venue_owner_invites`) with `status = 'pending'` and a valid token.
    - The email link, when opened, routes the invitee into a dedicated claim flow (sign-up/sign-in + venue claim).
  - **Notes:**
    - This test will be fully defined in v4 once the owner invite/claim data model and email templates are implemented.

- [ ] **VENUES-OWNER-INVITE-002 – Invitee claims venue via link (v4+)**

  - **Status:** ☐ (not implemented – v4+)
  - **Last run:** —
  - Intended steps (future):
    - As an invitee, click the owner invite link from email.
    - If not signed in, complete sign-up/sign-in.
    - Complete the claim flow to become an owner of the venue.
  - Intended expect:
    - On successful claim, a `venue_owners` row is created linking the invitee’s user id to the venue.
    - The invitation record is marked as `accepted` (or equivalent) and cannot be reused.
    - The new owner can now see the venue listed under `/my/venues` and access `/my/venues/:slug` without RLS errors.
  - **Notes:**
    - Exact URL structure and UI copy will be finalised in v4; this test case is a placeholder so we remember to validate the full end-to-end claim path.

- [ ] **VENUES-OWNER-INVITE-003 – Owner self-claim request from public venue page (v4+)**

  - **Status:** ☐ (not implemented – v4+)
  - **Last run:** —
  - Intended steps (future):
    - On a public `/venues/:slug` page, a prospective owner clicks an “I manage this venue” / “Claim this venue” link.
    - They submit a business email and optional message to request ownership.
    - An admin reviews and approves the request, triggering the same invite flow as VENUES-OWNER-INVITE-001.
  - Intended expect:
    - A self-claim request record is created and visible to admins.
    - Approved requests result in a standard owner invite being sent and claimed.
    - Rejected requests are marked as such and do not grant ownership.
  - **Notes:**
    - This flow is optional for v4 but documented here so that, if implemented, we wire it into the same invite/claim machinery and test it alongside the admin-initiated invite flows.

---

## 4. Admin / Moderation

> For detailed RLS checks, see **HARDENING-TEST-PLAN.md**. Here we verify UI + happy paths.

- [x] **ADMIN-001 – Admin dashboard access**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-12 (Local Docker – James)
  - **Steps:**
    - Mark a user as admin in `admin_users` (seed or SQL).
    - Log in as that user; open `/admin/...` pages.
  - **Expect:**
    - Admin pages are accessible.
    - Non-admins are redirected or get a clear “not allowed”.
  - **Notes:**
    - Verified that a user added to public.admin_users can access the existing /admin/… pages (e.g. /admin/venues and /admin/venues/:slug) without RLS or routing issues.
    - Verified that a normal non-admin user cannot access /admin/… tooling; they are either blocked or see a clear non-admin state, so there is no accidental exposure of admin controls in v3.
    - Current admin UI is functional but basic; further UX polish and a richer dashboard are deferred to a future phase.

- [x] **ADMIN-002 – Issue a warning**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-12 (Local Docker – James)
  - Goal:
    - Confirm that admins can issue a warning/suspension/ban to a user via the existing moderation UI.
    - Verify that this flows through `admin_warn_user` as intended and updates:
      - `user_warnings`
      - `profiles.moderation_status` / `warn_count` / `suspension_until`
      - `moderation_log`
      - `notifications` (type `admin_warning`)
  - **Steps:**
    1. **Prepare an admin and a normal user**
       - In SQL, pick or create a normal user (e.g. `mod_target_001`) and note their `profiles.id`.
       - Mark a separate user as admin (if not already) by inserting them into `public.admin_users`.
    2. **Open the moderation UI as admin**
       - Log in as the admin user.
       - Navigate to the admin user moderation screen (e.g. `/admin/moderation` or `/admin/users/:id` depending on routing).
       - Locate the target user (`mod_target_001`) in the UI.
    3. **Issue a warning/suspension**
       - From the admin moderation screen, open the “Warn / Suspend / Ban” dialog for the target user.
       - Fill in:
         - A clear **reason** (e.g. “Test warning – manual QA”).
         - A **severity** (e.g. `warning` or `temporary_suspension`).
         - For temporary suspensions, a **duration** in hours (e.g. 24).
       - Submit the form.
    4. **UI expectations**
       - The dialog validates the input (reason required; duration required for temporary suspension).
       - On success:
         - A severity-specific success toast appears (e.g. “Warning issued”, “User suspended”, etc.).
         - The dialog closes.
         - The page refreshes the target user’s moderation status, warnings list, and moderation log.
       - No unhandled errors appear in the console.
    5. **Database checks (using the target user’s profile id)**
       - `user_warnings`:
         ```sql
         select id, user_id, reason, severity, duration_hours, created_at
         from public.user_warnings
         where user_id = '<target_profile_id>'
         order by created_at desc
         limit 5;
         ```
         **Expect:**
         - A new row for this warning with:
           - `user_id` = target profile id.
           - `reason` = the reason you entered.
           - `severity` = the selected severity.
           - `duration_hours` = the duration you entered (or `NULL` for a simple warning).
       - `profiles`:
         ```sql
         select warn_count, moderation_status, suspension_until
         from public.profiles
         where id = '<target_profile_id>';
         ```
         **Expect:**
         - `warn_count` incremented by 1 (from previous value).
         - `moderation_status` updated appropriately (`warned`, `suspended`, or `banned` depending on severity).
         - `suspension_until` populated only for temporary suspensions.
       - `moderation_log`:
         ```sql
         select action, user_id, metadata, created_at
         from public.moderation_log
         where user_id = '<target_profile_id>'
         order by created_at desc
         limit 5;
         ```
         **Expect:**
         - A new log entry with:
           - `action = 'warn_user'`.
           - `user_id` = target profile id.
           - `metadata` json containing the reason, severity, duration, and source (e.g. `{"reason": "...", "severity": "warning", ...}`).
       - `notifications`:
         ```sql
         select type, user_id, extra_data, created_at
         from public.notifications
         where user_id = '<target_profile_id>'
           and type = 'admin_warning'
         order by created_at desc
         limit 5;
         ```
         **Expect:**
         - A notification row with:
           - `type = 'admin_warning'`.
           - `extra_data` including the warning details (severity, duration, reason, etc.).
    6. **End-user experience sanity check**
       - Log in as the warned user.
       - Open the notifications UI.
       - Expect an “admin warning” style notification (shield icon, clear copy about the warning/suspension/ban) that matches the `extra_data` from the DB.
       - Confirm that any moderation restrictions (e.g. temporary suspension) behave as expected on social surfaces.
  - **Notes:**
    - This test validates the existing `admin_warn_user` flow and its integration with the admin moderation UI.
    - RLS ensures that:
      - `user_warnings` and `moderation_log` are **admin-read-only** (via `is_admin(auth.uid())` policies).
      - Warnings are created only through the `admin_warn_user` SECURITY DEFINER function, which checks `admin_users` and should not be directly callable by normal users.
    - For v3, no additional schema changes are required; future phases may tighten the SQL grants on `admin_warn_user` for extra defence-in-depth.
    - Verified on 2025-12-12 using target user id 8a34774a-bca0-4ec7-98a3-01f778e7fd2b: user_warnings, profiles.moderation_status, moderation_log, and notifications (type admin_warning) all updated as expected, and the end-user saw a shield-style admin warning notification that routed correctly from the notifications UI.

- [ ] **ADMIN-003 – Clear moderation status**

  - **Status:** ☐ (v4+ – not implemented in v3)
  - **Last run:** —
  - Intended goal (future):
    - Allow admins to **clear or relax** a user’s moderation status (e.g. move from `suspended`/`warned` back to `normal`) via the admin UI, without deleting historic warnings.
  - Intended v4 steps (not currently available in the app):
    1. Put a user into a restricted state (e.g. issue a warning or temporary suspension via `ADMIN-002`).
    2. From the admin moderation UI (`AdminUserModeration`), click a **“Clear status” / “Restore normal access”** action.
    3. Confirm in a dialog that you want to restore the user’s normal status.
    4. On success, the UI updates the user’s moderation status and shows a success toast; warnings history remains readable for admins.
  - Intended expect:
    - `profiles.moderation_status` is set back to `'normal'`.
    - `profiles.suspension_until` is cleared (`NULL`).
    - `profiles.warn_count` is either:
      - Left as-is (history preserved), or
      - Adjusted based on the product decision for how “clear status” should behave.
    - A `moderation_log` entry is inserted reflecting that moderation was cleared/restored for this user.
    - No `user_warnings` rows are deleted; they remain as an immutable audit trail.
  - **Notes:**
    - There is currently **no** `admin_clear_moderation` RPC or equivalent backend function, and no “clear status” button in `AdminUserModeration.tsx`.
    - Any clearing of moderation today must be done manually via SQL changes to `profiles.moderation_status` / `suspension_until` and is considered out of scope for v3.
    - This test case is retained as a placeholder for a v4+ feature that would introduce a dedicated admin RPC and UI for clearing moderation status.

---

### 4. Reports

- [x] **REPORTS-001 – Create reports (happy path)**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-13 (Local Docker – James)
  - **Steps:**
    1. Ensure there are at least two normal users: **A** and **B**.
    2. As **B**, create at least one public catch (or reuse an existing public catch owned by B).
    3. As **A**, visit B’s public catch detail page.
    4. From the catch actions, click **Report** and submit a report with a simple reason (e.g. `test` or `fake`), leaving details blank.
    5. As **A**, report a **comment** as well:
       - On B’s catch, add a comment as B (or reuse an existing comment from B).
       - As A, open the comment’s action menu and choose **Report comment**.
       - Submit another report with a distinct reason.
    6. (Optional DB check) Run a SQL query as an admin to inspect the underlying rows:
       ```sql
       select id,
              reporter_id,
              target_type,
              target_id,
              reason,
              status,
              created_at
       from public.reports
       where reporter_id = '<user A uuid>'
       order by created_at desc
       limit 5;
       ```
  - **Expect:**
    - From the UI:
      - Both catch and comment reports show a success toast after submission.
      - The report dialog closes and the user remains on the catch detail page.
      - There is **no** visible client-side “X reports left” counter; the button simply shows **Submit report** / **Sending…**.
    - In the database:
      - For each report submitted by A:
        - A new row exists in `public.reports` with:
          - `reporter_id = A`
          - `target_type = 'catch'` or `'comment'` as appropriate.
          - `target_id` matching the catch or comment id.
          - `reason` equal to the text entered.
          - `status = 'open'`.
          - A recent `created_at` timestamp.
      - Each successful report also produces exactly **one** row in `public.rate_limits` with:
        - `user_id = A`
        - `action = 'reports'`
        - `created_at` within the last hour.
  - **Notes:**
    - This test confirms that the basic report flows for catches and comments work end-to-end via the `create_report_with_rate_limit` RPC, with RLS ensuring that only users who can actually view a catch/comment can report it.
    - Notification behaviour for reports is not currently implemented and is out of scope for v3; admins will review reports via the admin UI rather than via notifications.

- [x] **REPORTS-002 – Admin review & resolution**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-14 (Local Docker – James)
  - Steps (to run later, after REPORTS-001 and Admin UI are fully exercised):
    1. As a normal user **A**, file at least one catch report and one comment report against content owned by **B** (see REPORTS-001).
    2. As an **admin** user, open the **Admin → Reports** page.
    3. Filter by:
       - `status = open`
       - `target_type = catch` and then `target_type = comment`
       - (Optionally) search by reporter username or reason text if the UI supports it.
    4. For one of A’s open reports:
       - Change `status` to **resolved**, add some `resolution_notes`, and save.
    5. For another open report:
       - Change `status` to **dismissed**, optionally add `resolution_notes`, and save.
    6. (Optional DB check) Verify the updates:
       ```sql
       select id,
              reporter_id,
              target_type,
              target_id,
              status,
              resolution_notes,
              reviewed_at,
              reviewed_by
       from public.reports
       where id in ('<resolved_report_id>', '<dismissed_report_id>');
       ```
  - **Expect:**
    - AdminReports surface:
      - Lists all open reports for the project with correct reporter, target_type, target_id, reason, and created_at.
      - Filters and search behave as expected.
      - Saving a status change does not produce any Supabase/RLS errors.
    - In the database:
      - The resolved report row now has:
        - `status = 'resolved'`
        - Non-null `reviewed_at`
        - `reviewed_by` equal to the admin’s user id.
        - `resolution_notes` populated if the admin chose to add notes (optional in v3).
      - The dismissed report row has:
        - `status = 'dismissed'`
        - Non-null `reviewed_at`
        - `reviewed_by` equal to the admin’s user id.
        - Optional `resolution_notes` (may be null if the admin did not add any).
    - Reporters **do not** gain any extra capabilities from status changes; they can still only read (and, where allowed, update/delete) their own report rows per RLS.
  - **Notes:**
    - This test is primarily about admin workflow and RLS on `public.reports`:
      - Admins should see **all** reports and be able to update them.
      - Non-admins should never see reports filed by other users.
    - Consider adding a small success toast in the Admin UI when a report is updated, to give clearer feedback to admins (v4+ polish).

- [x] **REPORTS-003 – RLS & abuse / rate-limit edge cases**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-16 · Local Docker · James

  - **What we’re testing:**

    - RLS on `public.reports`:
      - Only the **reporter** and **admins** can read report rows.
      - Other users and anon cannot see them.
    - Per-user report rate limit:
      - Each user can file up to **5 reports per rolling 60 minutes**, regardless of target type.
      - Each successful report logs **exactly one** row in `public.rate_limits` with `action = 'reports'`.
    - Abuse checks:
      - Users cannot report content they are **not allowed to see** (private/followers-only without following/blocked).

  - **Fix / migration applied:**

    - `2116_fix_reports_rate_limit_single_logger.sql`
      - Updates `enforce_report_rate_limit()` to use `COALESCE(NEW.reporter_id, auth.uid())` so the trigger checks/logs consistently even in SQL-editor contexts where `auth.uid()` can be NULL.
      - Confirms **single-logger** behavior: one successful report → one `rate_limits` row.

  - **SQL editor impersonation prerequisite (important):**

    - In Supabase’s SQL editor, `auth.uid()` is **NULL** unless you explicitly impersonate a user.
    - If you run statements in separate editor executions, transaction-local settings can be lost and the RPC may raise **`Not authenticated`**.

      ```sql
      -- Run as a single batch
      begin;
        set local role authenticated;
        select set_config('request.jwt.claim.sub', '<VIEWER_UUID>', true);
        select set_config('request.jwt.claim.role', 'authenticated', true);

        -- sanity
        select current_user as current_user, auth.uid() as uid;

        -- ...run your test statements here...

      rollback;
      ```

  - **Verified behaviours (2025-12-16):**

    - ✅ **RLS isolation**

      - B querying for A’s reports returned **0 rows**.
      - C querying for B’s reports returned **0 rows**.
      - Admin can list recent reports across all reporters.

    - ✅ **Rate-limit correctness (5 per rolling hour)**

      - For reporter **B**: after creating 5 reports in a short window:
        - `reports_last_hour = 5`
        - `rate_limits_last_hour = 5`
      - The 6th report attempt errors with:
        - `RATE_LIMITED: reports – max 5 per hour`

    - ✅ **Abuse / access checks**
      - Reporting a target the reporter cannot view errors with:
        - `Target not accessible`
      - Inaccessible targets do **not** create a `reports` row and do **not** log a `rate_limits` row.

  - **Repro + verification script (clean run):**

    1.  **Admin cleanup (Local Docker only)** – clear recent noise for user B:

        ```sql
        -- run as admin (SQL editor default), or `reset role;`
        delete from public.rate_limits
        where user_id = '8fdb5a09-18b1-4f40-babe-a96959c3ee04'::uuid
          and action = 'reports'
          and created_at > now() - interval '24 hours';

        delete from public.reports
        where reporter_id = '8fdb5a09-18b1-4f40-babe-a96959c3ee04'::uuid
          and created_at > now() - interval '24 hours';
        ```

    2.  **As B (impersonated), create 6 reports quickly** against a known public catch:

        ```sql
        begin;
          set local role authenticated;
          select set_config('request.jwt.claim.sub', '8fdb5a09-18b1-4f40-babe-a96959c3ee04', true);
          select set_config('request.jwt.claim.role', 'authenticated', true);

          -- baseline (use explicit UUID to avoid confusion if claims drop)
          select
            (select count(*) from public.reports
              where reporter_id = '8fdb5a09-18b1-4f40-babe-a96959c3ee04'::uuid
                and created_at > now() - interval '1 hour') as reports_last_hour,
            (select count(*) from public.rate_limits
              where user_id = '8fdb5a09-18b1-4f40-babe-a96959c3ee04'::uuid
                and action = 'reports'
                and created_at > now() - interval '1 hour') as rate_limits_last_hour;

          select public.create_report_with_rate_limit('catch', '5429154e-a7cc-4513-aa5e-eeac1ccad16e'::uuid, 'reports-003 rate 1', null);
          select public.create_report_with_rate_limit('catch', '5429154e-a7cc-4513-aa5e-eeac1ccad16e'::uuid, 'reports-003 rate 2', null);
          select public.create_report_with_rate_limit('catch', '5429154e-a7cc-4513-aa5e-eeac1ccad16e'::uuid, 'reports-003 rate 3', null);
          select public.create_report_with_rate_limit('catch', '5429154e-a7cc-4513-aa5e-eeac1ccad16e'::uuid, 'reports-003 rate 4', null);
          select public.create_report_with_rate_limit('catch', '5429154e-a7cc-4513-aa5e-eeac1ccad16e'::uuid, 'reports-003 rate 5', null);

          -- 6 should fail with RATE_LIMITED
          select public.create_report_with_rate_limit('catch', '5429154e-a7cc-4513-aa5e-eeac1ccad16e'::uuid, 'reports-003 rate 6', null);
        rollback;
        ```

    3.  **Admin verification:**

        ```sql
        reset role;

        select count(*) as reports_created_last_hour
        from public.reports
        where reporter_id = '8fdb5a09-18b1-4f40-babe-a96959c3ee04'::uuid
          and created_at > now() - interval '1 hour';

        select count(*) as reports_rate_events_last_hour
        from public.rate_limits
        where user_id = '8fdb5a09-18b1-4f40-babe-a96959c3ee04'::uuid
          and action = 'reports'
          and created_at > now() - interval '1 hour';
        ```

        **Expect:**

        - `reports_created_last_hour = 5`
        - `reports_rate_events_last_hour = 5`

  - **Notes:**

    - `RATE_LIMITED: reports – max 5 per hour` is expected if the user already has 5 `rate_limits` rows for `action='reports'` within the last 60 minutes.
    - `Target not accessible` is expected and desired for private/followers-only/blocked targets.
    - `Not authenticated` indicates the call was made without a valid `auth.uid()` context (most commonly: not impersonating, or settings lost between SQL-editor runs).

## 5. Settings / Privacy

- [x] **SETTINGS-001 – Update profile settings**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-12 (Local Docker – James)
  - **Steps:**
    - Go to `/settings/profile` as a logged-in user.
    - Update basic profile fields (e.g. full name, bio) and save.
    - Upload a new avatar image and save.
    - Refresh your profile at `/profile/:username` and, if needed, the main app shell to confirm the avatar appears in all expected places.
  - **Expect:**
    - Profile text fields (full name, bio, etc.) persist and show correctly on both `/settings/profile` and `/profile/:username` after refresh.
    - Avatar upload succeeds with no `Bucket not found` or other 4xx storage errors in the console.
    - A new object is created in `storage.objects` under the `avatars` bucket with a path of the form `<user_id>/filename`.
    - The new avatar appears:
      - In the profile settings preview.
      - In the navbar/profile chip (after refresh).
      - On `/profile/:username` for that user.
    - Avatars are publicly readable for profile viewing (they render even when viewing profiles while logged out), but only the owning user can write/delete their own avatar objects.
  - **Notes:**
    - Backed by migration `2109_avatars_bucket.sql`, which:
      - Ensures a public `avatars` bucket exists.
      - Adds `avatars_public_read` (public SELECT) and `avatars_authenticated_manage_own` (owner-only FOR ALL) RLS policies on `storage.objects`.
    - This test should be re-run after any changes to storage buckets, avatar upload UI, or storage RLS to ensure users can still update avatars and that ownership constraints remain intact.
    - Additional edge cases to cover in future runs:
      - Validate large and unusual avatar uploads (e.g. >5MB, very tall/wide aspect ratios, unsupported file types) and confirm the UI shows a clear error without breaking the page.
      - Replace the avatar multiple times in a single session and across sessions; confirm the latest avatar URL is consistently used in the navbar, profile page, and comments/catches, and note whether old files are left behind in storage (acceptable for v3, but worth tracking).
      - View your profile while logged out (or from another user) to confirm avatars are publicly readable as intended and that there are no broken-image placeholders.
      - Temporarily break storage (e.g. by pausing the storage container in local Docker) and confirm the avatar uploader surfaces a friendly error state instead of hanging or crashing the form.

- [x] **SETTINGS-002 – Privacy toggles (private profile + hide exact spot)**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-12 (Local Docker – James)
  - **Steps:**
    1. **Private profile toggle (profiles.is_private)**
       - As **User A**, go to `/settings/profile`.
       - Enable the **"Private account" / "Private profile"** toggle and save.
       - As **User B (not following A)**:
         - Check A's profile page `/profile/:username`.
         - Check your feed for A's catches.
       - As **User B now following A**:
         - Follow A.
         - Re-check A's profile and feed visibility for followers-only vs public catches.
       - As **anon (incognito)**:
         - Visit A's profile and watch which catches (if any) are visible.
    2. **Per-catch "Hide exact spot" (catches.hide_exact_spot)**
       - As **User A**, create a new catch with a concrete location/venue and tick the **"Hide exact spot"** option on the catch form.
       - As **User B (non-owner)**, view the catch detail page and any tiles/cards that show its location.
       - As **User A (owner)**, re-open the same catch detail page and tiles.
  - **Expect:**
    - **Private profile toggle**:
      - When `is_private = true` for A:
        - **User B (not following A)** does **not** see A's followers-only or private catches in the feed or on `/profile/:username`.
        - **User B (following A)** can see A's followers-only catches (subject to each catch's own `visibility`), but still cannot see A's private catches.
        - **Anon** only sees A's public catches, never followers-only or private ones.
      - A's profile page is still reachable as a URL, but:
        - The visible catches/comments are constrained by RLS, and
        - The profile shows a clear **"This account is private – only followers can see this angler's catches and detailed stats"** banner in the catches section when viewed by non-followers.
    - **Per-catch "Hide exact spot"**:
      - When `hide_exact_spot = true` on a catch:
        - **Non-owners** see a coarse or "undisclosed" location label instead of the exact peg/spot (e.g. "Exact peg/swim hidden by angler"), as controlled by the location display helpers.
        - The catch itself remains visible (subject to its `visibility` and profile privacy); only the precise location is hidden.
        - **Owners** still see the full location/peg details for their own catches, even when `hide_exact_spot = true`.
      - When `hide_exact_spot = false` on a catch:
        - Everyone who can see the catch (based on `visibility` and privacy) sees the normal location and peg/swim.
  - **Notes:**
    - `profiles.is_private` is working as intended and is enforced via RLS on catches/comments; non-followers and anon only see what they are allowed to see, and the profile surfaces a clear "private account" banner when appropriate.
    - `catches.hide_exact_spot` now correctly hides exact location details from **non-owners** while allowing the **owner** to see their full location/peg on the catch detail page and tiles.
    - The earlier bug where owners saw the same "Exact peg/swim hidden by angler" text as non-owners when `hide_exact_spot = true` has been fixed in the catch detail location logic.
    - Catch visibility remains per catch via the `visibility` enum (`public` / `followers` / `private`) and is tested more deeply under **RLS-001 – Private catch not visible to stranger**; this SETTINGS-002 test focuses on the interaction between the global profile privacy toggle and the per-catch hide-exact-spot flag.

- [x] **SETTINGS-003 – Soft-delete account (request_account_deletion)**

  - **Status:** ✅ (functional soft-delete + deleted-account gate)
  - **Last run:** 2025-12-12 (Local Docker – James)
  - Goal:

    - A user can delete/close their account from Profile Settings.
    - Deletion is a **soft-delete / tombstone**, not a hard delete:
      - `profiles.is_deleted = true`
      - `profiles.deleted_at` is set
      - Profile is locked and anonymised (username changed, content hidden/cleaned up).
    - Deleted users cannot re-enter the app as normal users; if they sign in again, they are immediately sent to the “account deleted” page.

  - **Steps:**

    1.  **Create a throwaway user and some activity**

        - Sign up as a new user (e.g. `test4@test.com` / username `test4`).
        - Confirm email if required and complete onboarding.
        - In SQL, capture the user’s IDs:

          ```sql
          -- Supabase auth user
          select id, email, raw_user_meta_data, created_at
          from auth.users
          where email = 'test4@test.com';

          -- Profiles row
          select id, username, is_deleted, deleted_at, locked_for_deletion
          from public.profiles
          where username = 'test4';
          ```

        - Note the **profile id** (e.g. `ec1497f1-68ce-4a47-a988-b40707304a4b`).

        - As this user, create some social activity:
          - At least one or two catches (mixed visibility is fine).
          - At least one comment on someone else’s catch.
          - At least one rating and one reaction.
          - Follow at least one other profile.

    2.  **Trigger delete from Profile Settings**

        - As this user, go to `/settings/profile`.
        - Scroll to the **Danger zone** section and click **“Delete your account”**.
        - Read the dialog copy (it should clearly explain that this is an **immediate account deletion/closure**, not just a request).
        - Enter a short reason (optional) and confirm.

        **Expect:**

        - The confirm dialog appears and sets expectations correctly.
        - On confirm:
          - The client calls `supabase.rpc('request_account_deletion', { p_reason })` successfully (no unhandled errors in the console).
          - The user is signed out.
          - The browser is redirected to a dedicated `/account-deleted` page.
        - `/account-deleted` is accessible as a **public** route (no auth guard) and shows clear messaging that:
          - The account has been deleted/closed.
          - Data has been anonymised/hidden where appropriate.
          - The account cannot be used normally.

    3.  **Database checks after deletion**

        Use the **profile id** you captured earlier in each query.

        - **Profile is soft-deleted, not removed**

          ```sql
          select id, username, is_deleted, deleted_at, locked_for_deletion
          from public.profiles
          where id = 'ec1497f1-68ce-4a47-a988-b40707304a4b';
          ```

          **Expect:**

          - Exactly one row.
          - `is_deleted = true`
          - `deleted_at IS NOT NULL`
          - `locked_for_deletion = true`
          - `username` is changed to a tombstone value, e.g. `deleted-user-<id>`.

        - **Catches are hidden / made private and soft-deleted**

          ```sql
          select id, title, visibility, deleted_at
          from public.catches
          where user_id = 'ec1497f1-68ce-4a47-a988-b40707304a4b';
          ```

          **Expect:**

          - All rows for this user have:
            - `visibility = 'private'`
            - `deleted_at IS NOT NULL`

        - **Comments are tombstoned**

          ```sql
          select id, catch_id, body, deleted_at
          from public.catch_comments
          where user_id = 'ec1497f1-68ce-4a47-a988-b40707304a4b';
          ```

          **Expect:**

          - `body = '[deleted]'`
          - `deleted_at IS NOT NULL`

        - **Ratings, reactions, follows removed**

          ```sql
          -- Ratings
          select id, catch_id, rating
          from public.ratings
          where user_id = 'ec1497f1-68ce-4a47-a988-b40707304a4b';

          -- Reactions
          select id, catch_id
          from public.catch_reactions
          where user_id = 'ec1497f1-68ce-4a47-a988-b40707304a4b';

          -- Follows (both directions)
          select follower_id, following_id
          from public.profile_follows
          where follower_id = 'ec1497f1-68ce-4a47-a988-b40707304a4b'
             or following_id = 'ec1497f1-68ce-4a47-a988-b40707304a4b';
          ```

          **Expect:**

          - All three queries return **no rows**.

    4.  **Sign-in behaviour after deletion**

        - From `/auth`, attempt to sign in again with the same email/password (e.g. `test4@test.com`).
        - Supabase Auth will still authenticate the credentials (the auth user is not deleted).
        - Once the app loads, the deleted-account gate should detect `profiles.is_deleted = true`, immediately sign the user out again, and route them back to `/account-deleted`.

        **Expect (v3):**

        - After login:
          - The user should not see normal social UI or remain on the homepage.
          - They should end up on `/account-deleted` and stay there.
          - They briefly see a loading state and are then taken straight to `/account-deleted` with **no homepage flash or partial UI**.

    5.  **Social surfaces sanity check**

        From other accounts (A/B) and anon:

        - The deleted user:
          - Does not appear in follower/following lists.
          - Does not show active catches in feed/profile (their catches are private+deleted).
          - Comments appear as `[deleted]` where tombstoned.
          - Ratings/reactions from them no longer appear in the ratings/reactions tables and do not affect rating summaries.
        - No Supabase/RLS errors appear when loading feeds, profiles, or catches that previously involved the deleted user.

  - **Notes:**
    - Backend soft-delete behaviour (including tombstoning of profile fields, catches, comments, and removal of ratings/reactions/follows) is implemented via the existing `request_account_deletion` RPC and associated SQL; this test verifies that behaviour via SQL queries rather than by re-implementing the logic here.
    - The **DeletedAccountGate** in `src/App.tsx` ensures that any successfully authenticated user whose profile has `is_deleted = true` is immediately signed out and redirected to `/account-deleted`, preventing deleted accounts from participating in the app.
    - When a deleted user attempts to sign in again, the auth flow now shows an informational toast: _"This account has been deleted. You can’t reuse this account or email address."_
    - After that toast, `DeletedAccountGate` immediately signs them out and routes them to `/account-deleted` with no homepage flash. Reusing emails for deleted accounts is **not** supported in v3 and is an intentional part of the deletion model.

---

## 6. Notifications

> Summary (2025-12-09, Local Docker)
>
> - Core social notifications (comment, mention, rating, reaction, follow) are firing and routing correctly.
> - `read_at` is now populated when notifications are marked read (single or “mark all”), and existing read rows have been backfilled.
> - “Clear all notifications” from the bell deletes notifications immediately with no confirm dialog.
> - Admin notifications (report, moderation, warning) are wired and render with distinct styling; details live in `NOTIFICATION-FLOWS.md`.

> Future polish (v4+)
>
> - Tighten the copy for admin warning notifications so we avoid repeating the word “Warning” in both the card heading and the body. For example, use a title like “You’ve received a warning from the moderators” and a body such as “Reason: strike 1. Please follow the community guidelines.”
> - As notification volume grows, consider grouping multiple likes/ratings on the same catch into a single notification (e.g. “3 anglers liked your catch ‘RLS Public Catch’”) and adding simple time dividers (“Today”, “Yesterday”) to make long notification lists easier to scan.

- [x] **NOTIFY-001 – New comment notifications**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-09 (Local Docker – James)
  - **Steps:**
    - User A owns a catch.
    - User B comments on A’s catch **without** mentioning A (no `@<A’s username>` in the body).
    - Open A’s notifications bell dropdown.
  - **Expect:**
    - A sees a **“New comment”** (or equivalent) notification for B’s comment.
    - Clicking the notification opens the correct catch detail page.
    - The page scrolls so that the related comment is visible in context.
    - The notification is marked as read after viewing (badge count updates).
  - **Notes:**
    - This case explicitly covers comments **without mentions**. Mention behaviour is covered under NOTIFY-002 / COMM-003.

- [x] **NOTIFY-002 – Mention notifications**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-09 (Local Docker – James)
  - **Steps:**
    - User A owns a catch.
    - User B comments on A’s catch and includes `@<A’s username>` in the comment body.
    - Optionally, B also mentions a third user C on the same or a separate comment.
    - Each mentioned user opens their notifications bell dropdown.
  - **Expect:**
    - Mentioned users see a **“Mention”** notification type (distinct from generic comment notifications).
    - When the catch owner A is @mentioned on their own catch:
      - A receives a **mention** notification instead of a generic new-comment notification.
    - Clicking the mention notification:
      - Opens the correct catch detail page.
      - Scrolls to the related comment and shows it in context.
    - The redesigned notification header and list behave correctly (no layout glitches; mark-all-read works as expected).
  - **Notes:**
    - Behaviour matches the documented COMM-003 expectations in `CORE-SOCIAL-FLOWS.md`.
    - Verified that both owner and third-party mentions receive `type = 'mention'` rows in `public.notifications`.

- [x] **NOTIFY-003 – Mark / clear notifications**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-09 (Local Docker – James)
  - **Steps:**
    - From the notifications UI, mark a single notification as read.
    - Use “Mark all read”.
    - Use “Clear all notifications” from the bell dropdown.
  - **Expect:**
    - Badge counts update correctly after marking single or all as read.
    - In the DB:
      - `notifications.is_read` is set to `true`.
      - `notifications.read_at` is populated (for both single and mark-all paths).
      - Existing read notifications have `read_at` backfilled (older rows where `is_read = true` now have `read_at` set to their original `created_at`).
    - “Clear all notifications” immediately deletes the user’s notifications (no confirm modal); on reload, no cleared notifications reappear.
  - **Notes:**
    - UI still styles based on `is_read`; `read_at` is now available as the long-term source of truth for “has this been read?”.
    - See `NOTIFICATION-FLOWS.md` for admin-specific notification behaviour (reports, warnings, moderation actions).

- [x] **NOTIFY-004 – Follow notifications**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-13 (Local Docker – James)
  - **Steps:**
    - Create users A and B.
    - As B, follow A from A's profile page.
    - As A, open the notifications panel from the header.
  - **Expect:**
    - A sees a **new follower** style notification (e.g. “bfollower started following you”) with the follower’s username and avatar.
    - Clicking the notification navigates to B’s profile (or another sensible destination such as A’s followers list) without errors.
    - The notification is marked as read after being viewed; badge counts update correctly.
  - **Notes:**
    - Behaviour was verified via UI (A’s notifications list) and by inspecting `public.notifications` for rows with `type = 'new_follower'` for A’s `user_id`.
    - Follow notifications are part of the core social loop and should be re-checked whenever follow/unfollow flows or notification rendering are changed.

- [x] **NOTIFY-005 – Rating / reaction notifications**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-13 (Local Docker – James)
  - **Steps:**
    - Seed users A (catch owner) and B (follower of A).
    - Ensure A has at least one **public** catch and one **followers-only** catch with `allow_ratings = true`.
    - As B, on each of A’s catches:
      - Add a like/reaction.
      - Leave a simple comment.
      - Add a rating (e.g. 7/10 on followers catch, 9/10 on public catch).
    - As A, open the notifications panel and review the newest entries.
  - **Expect:**
    - For B’s actions on A’s catches, A receives:
      - `new_rating` notifications with `extra_data` including at least `rating`, `catch_title`, and `actor_username`.
      - `new_reaction` notifications with `extra_data.catch_title` set appropriately.
      - `new_comment` notifications with `extra_data.catch_id`, `comment_id`, `catch_title`, and `actor_username`.
    - Clicking each notification navigates to the correct catch detail page and surfaces the relevant context (catch and comment) without errors.
    - Notifications can be marked read / cleared using NOTIFY-003 flows.
  - **Notes:**
    - Verified via SQL on 2025-12-13 that A’s `public.notifications` rows included entries such as:
      - `type = 'new_rating'` with `extra_data = {"rating": 9, "catch_title": "RLS Public Catch", "actor_username": "bfollower"}`.
      - `type = 'new_rating'` with `extra_data = {"rating": 7, "catch_title": "RLS Followers Catch", "actor_username": "bfollower"}`.
      - `type = 'new_comment'` with `extra_data` containing the correct `catch_id`, `comment_id`, `catch_title`, and `actor_username`.
      - `type = 'new_reaction'` with `extra_data.catch_title` set to the corresponding catch title.
    - This confirms that rating, reaction, and comment notifications are wired end-to-end and that the payload shape matches what the UI expects.

- [x] **NOTIFY-006 – Admin warning notifications**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-13 (Local Docker – James)
  - **Steps:**
    - As an admin, open the user moderation UI (see ADMIN-002) for a normal user A.
    - Issue a **warning** with a clear reason (e.g. “strike 1”) and severity `warning`.
    - As A, open the notifications panel.
  - **Expect:**
    - Admin-side (ADMIN-002) behaviour works as documented: a `user_warnings` row, `profiles.moderation_status = 'warned'`, an appropriate `moderation_log` entry, etc.
    - A sees an **admin warning** style notification at the top of their notifications list:
      - Styled distinctly (shield icon, “You’ve received a warning from the moderators” title, etc.).
      - Body text summarises the reason/severity (e.g. “Reason: strike 1. Please follow community guidelines.”).
    - Clicking the notification takes A to a sensible destination (currently their notifications/profile context) without errors.
    - Mark-as-read and clear-all behaviour from NOTIFY-003 still applies.
  - **Notes:**
    - Verified via SQL on 2025-12-13 that A’s `public.notifications` contained a row with `type = 'admin_warning'` and `extra_data`:
      - `{"reason": "strike 1", "severity": "warning", "new_status": "warned", "warning_id": "74cf7ea0-a903-4179-a7c3-3a0db54f2577", "duration_hours": null, "suspension_until": null}`.
    - This matches the payload produced by the `admin_warn_user` RPC and confirms that the admin warning notification is persisted with all relevant context for rendering.
    - Future v4+ polish: tighten the copy to avoid repeating “Warning” in both the card heading and body while keeping severity and reason clear.

## 7. RLS / Visibility Smoke Tests (UI-Level)

> Full detail lives in **HARDENING-TEST-PLAN.md**. These are quick UI checks to catch regressions.

- [x] **RLS-001 – Private catch not visible to stranger**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-11 (Local Docker – James)
  - **Steps:**
    - User A creates two catches:
      - One with visibility **“followers”**.
      - One with visibility **“private”**.
    - User C is a separate account that does **not** follow A.
    - As A:
      - Confirm both catches appear on A’s profile and (where appropriate) in A’s feed.
      - Confirm both are reachable via `/catch/:id`.
    - As C (stranger, not following A):
      - Confirm neither catch appears in C’s feed.
      - Confirm A’s profile does **not** show the followers-only or private catches.
      - Visit each catch directly via `/catch/:id`:
        - Followers-only: cannot be viewed by C; the UI shows a neutral error when C deep-links to `/catch/:id` (see Notes).
        - Private: cannot be viewed by C; the UI shows the same neutral error when C deep-links to `/catch/:id`.
        - In both cases, the UI behaves as if the catch is not accessible to C (no partial data, no raw Supabase errors).
    - (Optional) Have C follow A:
      - Followers-only catch becomes visible to C.
      - Private catch remains hidden.
  - **Notes:**
    - Behaviour matches the intended visibility model:
      - Followers-only catches are only visible to the owner, admins, and followers.
      - Private catches are only visible to the owner and admins.
    - No unexpected RLS or Supabase errors were observed in the network tab during these checks.
    - When any user (including a blocked user or a stranger) attempts to open an inaccessible catch via a direct `/catch/:id` deep link (e.g. private, followers-only, deleted, or blocked), the catch-detail loader now shows a neutral toast: “This catch isn’t available. It may have been deleted, made private, or you don’t have permission to view it.” and then navigates back to the main feed. This replaces the older “Failed to load catch” message and ensures we do not leak whether a catch was specifically blocked vs deleted/private.

- [x] **RLS-002 – Blocked user cannot comment**

  - **Status:** ✅ Pass
  - **Last run:** 2025-12-11 (Local Docker – James)
  - **Steps:**
    - A blocks B.
    - B tries to comment on A’s catches.
  - **Expect:**
    - UI prevents action or Supabase returns a clear error.
    - No new comment rows are created after the block.
  - **Notes:**
    - Before blocking, the blocked user could create top-level comments and replies on the other user’s public catch; `public.catch_comments` showed the expected rows with `deleted_at IS NULL`.
    - After A blocked B, B can no longer access A’s catch detail page at all (RLS denies access), so there is no UI surface to post new comments or replies.
    - Re-running the `catch_comments` query for that catch/user showed no additional rows after the block.
    - This behaviour is stricter than required but acceptable for v3: a blocked user cannot view or comment on the blocker’s catches.

- [x] **RLS-003 – Venues: unpublished vs published**

- **Status:** ✅ Pass
- **Last run:** 2025-12-11 (Local Docker – James)
- **Steps:**
  - Pick an existing published venue (e.g. `Anglers Paradise, Devon`).
  - As an admin (or via SQL), set `is_published = false` while leaving `deleted_at` as `NULL`.
  - As an anonymous visitor (incognito window):
    - Open `/venues` and confirm the venue no longer appears in the directory list.
    - Try to open `/venues/:slug` for that venue directly by URL.
  - As a signed-in **non-owner, non-admin** user:
    - Repeat the directory and direct slug checks.
  - As a **venue owner or admin**:
    - Open `/venues` and confirm the venue still appears in the list (via owner/admin RLS).
    - Open `/venues/:slug` and confirm the venue detail page still renders.
- **Expect:**

  - Anonymous and non-owner/non-admin users:
    - Do **not** see unpublished venues in the `/venues` directory.
    - Cannot access unpublished venues via `/venues/:slug` – the client behaves as if the venue does not exist (empty state / 404), because RLS prevents the row from being returned.
  - Owners/admins:
    - Continue to see their unpublished venues in both the directory and detail pages.
    - Can still edit/manage venue metadata via the existing admin tooling.

- [x] **RLS-HARDEN-001 – Deep RLS pass: catches, comments, reactions, ratings**

  - **Status:** ✅ Pass (SQL editor matrix)
  - **Last run:** 2025-12-16 (Local Docker – James)
  - **Runbook:** `docs/version3/tests/RLS-HARDEN-001-RUN.md` (SQL impersonation matrix)

  - **Fixtures / setup used for the matrix:**

    - Seeded test users:
      - A (owner)
      - B (follower of A)
      - C (stranger, not following A)
      - D (blocked by A)
      - Admin (admin_users)
    - Seeded catches for A:
      - One **public** catch.
      - One **followers-only** catch.
      - One **private** catch.

  - **Migrations validated in this run:**

    - `2113_harden_get_catch_rating_summary.sql`
      - Rating summary returns **0 rows** when denied (no exception) to avoid information leaks.
      - Adds block checks (`is_blocked_either_way`) for non-admin viewers.
    - `2114_rate_limits_rls_insert_fix.sql`
      - Ensures RLS is enabled on `public.rate_limits`.
      - Ensures there is a single self-insert policy for authenticated users (`auth.uid() = user_id`) so trigger/RPC logging can write without cross-user access.
      - Runbook now includes a prerequisite snippet to verify impersonated inserts into `rate_limits` work before running the full matrix.
    - `2115_harden_reactions_and_ratings_rls.sql`
      - Adds **RESTRICTIVE** write policies (INSERT + UPDATE) for `public.catch_reactions` and `public.ratings` enforcing:
        - `auth.uid() = user_id` (no cross-user writes)
        - Catch exists + not deleted
        - Viewer not blocked by/against the catch owner
        - Visibility respected (public / followers when following; private denied to non-owner)
        - No self-react/rate (`c.user_id <> auth.uid()`)
        - Ratings require `c.allow_ratings = true`

  - **Verified behaviours (SQL editor impersonation via `SET LOCAL ROLE` + `request.jwt.claim.*`):**

    - **Reads (catches + rating summary)**

      - **Public catch**: readable by B and C; anon can read; D denied.
      - **Followers-only catch**: readable by B only (plus owner/admin); C/anon/D denied.
      - **Private catch**: readable by owner/admin only; B/C/anon/D denied.
      - `get_catch_rating_summary(catch_id)`:
        - Allowed viewers get **one row** (count/average/your_rating).
        - Denied viewers get **0 rows** (not an exception).

    - **Writes: comments**

      - RPC `create_comment_with_rate_limit`:
        - B allowed on **public** + **followers**; denied on **private**.
        - C allowed on **public** only; denied on **followers/private**.
        - D denied everywhere (blocked) with clear RPC messaging.
      - Direct table INSERT to `public.catch_comments`:
        - Mirrors the same visibility model as above (B allowed on public/followers; C allowed on public; others denied).
        - Note: when using DO blocks in the SQL editor, ensure the script uses `INSERT ... RETURNING id` (or `PERFORM`) so you don’t hit “query has no destination for result data”.

    - **Writes: reactions + ratings (including update/upsert paths)**

      - **Public**: B and C can upsert (insert → update) reactions and ratings.
      - **Followers-only**: B can upsert; C denied.
      - **Private**: non-owners denied (B/C/D).
      - **Blocked (D)**: denied INSERT/UPDATE for reactions/ratings even if they know the catch id.
      - Ratings additionally require `c.allow_ratings = true`; self-react/rate is denied.
      - Upsert scripts should use `ON CONFLICT (user_id, catch_id) DO UPDATE ...` rather than constraint names (more portable across environments).

    - **Rate-limit logging**

      - Confirmed `public.rate_limits` INSERT works for impersonated users **when both** `request.jwt.claim.sub` and `request.jwt.claim.role` are set.
      - Trigger/RPC paths that log to `rate_limits` no longer fail under RLS when running as a normal authenticated user.

  - **Frontend follow-up (rating summary empty-row handling):**

    - Hardened RPC behaviour (0 rows when denied) is now treated as **“not accessible”** client-side without noisy toasts; rating UI hides cleanly:
      - `src/hooks/useCatchData.ts`
      - `src/components/feed/CatchCard.tsx`

  - **pgTAP note:**

    - pgTAP coverage for this matrix was attempted but is **deferred** while we continue iterating migrations.
    - Current source of truth is the SQL editor impersonation matrix in `RLS-HARDEN-001-RUN.md`.

  - No RLS leaks observed: visibility, blocking, read surfaces, and write surfaces all agree with the intended model.

- [x] **RLS-HARDEN-002 – Deep RLS pass: profiles, follows, blocks**

  - **Status:** ✅ Pass (RLS matrix)
  - **Last run:** 2025-12-17 (Local Docker – James)
  - **Runbook:** `docs/version3/tests/RLS-HARDEN-002-RUN.md`

  - **Actors / UUIDs used:**

    - A (owner): `aa35e9b8-9826-4e45-a5b0-cec5d3bd6f3a`
    - B (follower): `8fdb5a09-18b1-4f40-babe-a96959c3ee04`
    - C (stranger): `dc976a2a-03fe-465a-be06-0fa1038c95cf`
    - D (blocked): `8641225a-8917-435e-95f2-bb4356cd44d0`
    - Admin: `d38c5e8d-7dc6-42f0-b541-906e793f2e20`

  - **Scope:**

    - `profiles` privacy (`is_private`)
    - `profile_follows` read/write visibility
    - `profile_blocks` + downstream impact on follow attempts

  - **Fixes / migrations validated during this run:**

    - `2117_harden_profile_follows_rls.sql`
      - Added admin visibility over follow edges (`profile_follows_admin_select_all`).
      - Added RESTRICTIVE insert guard (`profile_follows_insert_not_blocked`) preventing self-follow and blocked follows.
      - Hardened `follow_profile_with_rate_limit` to reject blocked relationships with `Target not accessible`.
    - One-off cleanup executed (local-only): removed existing invalid follow rows where `is_blocked_either_way(...)` or self-follow.

  - **Verified behaviours (SQL editor impersonation matrix):**

    - **Anon:** cannot list A’s followers.
    - **Admin:** can read follow edges (e.g. followers of A) for moderation.
    - **A (private account):** can see inbound follow edges to A.
    - **C (stranger):** can follow A if not blocked, but cannot see other people’s edges (e.g. cannot see B → A).
    - **D (blocked by A):** cannot follow A via RPC (`Target not accessible`) and cannot insert follow edge directly (RLS denies under `profile_follows_insert_not_blocked`).
    - **Self-follow:** denied (`Cannot follow yourself`).

  - **Notes:**
    - When validating rate-limit logging for follows via SQL editor, ensure the RPC call and the `rate_limits` verification query run in the **same transaction/batch** _before_ any `ROLLBACK`/`COMMIT`. A standalone `rate_limits_last_hour = 0` after a rollback is not treated as a failure of the RLS matrix; it’s typically a transaction-scoping artifact.

- [x] **RLS-HARDEN-003 – Deep RLS pass: notifications, warnings, moderation**

  - **Status:** ✅ Pass (SQL editor matrix)
  - **Last run:** 2025-12-17 (Local Docker – James)
  - **Runbook:** `docs/version3/tests/RLS-HARDEN-003-RUN.md` (SQL impersonation matrix)

  - **Verified behaviours (high-signal outcomes):**

    - ✅ **Admin RPC surface exists**

      - `admin_warn_user` present.
      - `admin_list_reports` present.

    - ✅ **Reports read isolation**

      - Non-admin cross-user reads returned **0 rows** (e.g. “reports_other_A/B = 0”).
      - Admin can read reports via `admin_list_reports` RPC (no direct table exposure required).

    - ✅ **Notifications isolation**

      - Each user can only see their own `notifications` rows.
      - Cross-user selects return **0 rows** (admin included).

    - ✅ **Warnings + moderation side-effects (admin-only)**

      - Admin issuing a warning creates:
        - A `user_warnings` row for the target user.
        - A `moderation_log` entry (`action = 'warn_user'`).
        - A `notifications` row for the target (`type = 'admin_warning'`).
      - Example sanity check (admin): `admin_moderation_log_count = 27`.

    - ✅ **Non-admin callers blocked**
      - Calling `admin_warn_user` as a non-admin errors with **`Admin privileges required`**.
      - No side effects were observed from rejected calls.

  - **Notes:**
    - Scope includes `notifications`, `reports`, `user_warnings`, `moderation_log`, and admin-only moderation/report RPCs.
    - Use single-transaction impersonation (`SET LOCAL ROLE authenticated; set_config('request.jwt.claim.*', ...)`) per actor (A/B/C/D/Admin/Anon) to avoid `auth.uid()` dropping in the SQL editor.

---

## 8. How to Use This Document

1. **Pick a section** (e.g. Venues).
2. For each checklist item:
   - Run the described flow in the UI.
   - Update:
     - **Status:** ✅ / ❌
     - Last run date.
     - Short note if it failed (e.g. “400 on get_venue_recent_catches”).
3. If a test is complex:
   - Create `docs/version3/tests/<AREA>-tests.md`.
   - Move detailed steps/edge-cases into that file.
   - Keep only the summary + link here.

Over time, this file becomes your **living regression checklist** for v3. When you’re happy everything is ✅ on local and dev, you can be more confident promoting changes to production.
