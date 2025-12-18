# App Shell & Navigation – Test Plan (v3)

This document covers **manual end-to-end testing** of the application shell and navigation in ReelyRated v3.

It is the detailed companion to `docs/version3/TEST-PLAN.md` section **1.2 App Shell & Navigation**, and focuses on:

- Top-level navigation (header/sidebar)
- Route changes and URL behaviour
- Auth guards and redirects (shell-level)
- 404 / not found handling
- Basic browser navigation (Back/Forward)
- Multi-tab consistency (for nav/auth state)

---

## 1. Scope & Invariants

**Tech context**

- Router: React Router (v6+).
- Auth wiring: `src/components/AuthProvider.tsx` and route guards.
- Nav components:
  - Main nav / shell (header, sidebar, etc.).
  - Any mobile/compact nav if present.

**Global invariants to watch**

- The **active nav state** always matches the **current route**.
- Protected routes:
  - Redirect unauthenticated users to `/auth` (or equivalent).
  - Never briefly show protected content before redirect.
- Public routes (e.g. venues index) must remain accessible to signed-out users, as designed.
- Browser **Back/Forward** works naturally (no weird loops).
- 404s are handled with a friendly “Not found” page, not a blank screen or stack trace.

---

## 2. Navigation Basics (Signed-In)

### 2.1 SHELL-001 – Primary nav links

**Goal:** Confirm each nav item routes correctly and highlights appropriately.

**Steps**

1. Sign in as a normal user.
2. Starting from the default landing page (e.g. `/` / feed):
   - Click each primary nav item in turn:
     - Feed/Home
     - Venues
     - Insights
     - Profile
     - Settings
     - Any other main nav item present (e.g. “Community”, “Leaderboard”).
3. For each click:
   - Observe the **URL** in the address bar.
   - Observe the **active nav highlight**.
   - Confirm the page content matches the selected nav item.
4. Use the browser **Back** and **Forward** buttons a few times after navigating.

**Expected**

- Each nav item sends you to the correct route (e.g. `/`, `/venues`, `/insights`, `/settings/profile`, `/profile/:username` or `/me`).
- The correct nav item appears **active** (highlight/underline) for each page.
- No 404 or “route not found” for valid nav links.
- Back/Forward steps move between pages without:
  - Infinite redirect loops.
  - Nav highlight getting out of sync with the current route.

**Result log**

- **2025-12-04 – Local Docker – James – Pass**
  - **Issue:**
    - None.
  - **Notes:**
    - None. All working as expected.
  - **Bug(s):**
    - None.

---

### 2.2 SHELL-002 – Deep-link nav behaviour

**Goal:** Confirm that if you land on a deeper route via direct URL, the shell still behaves correctly.

**Steps**

1. Ensure you are **signed in**.
2. Manually enter URLs for deeper pages in the address bar, for example:
   - A specific catch detail: `/catches/:id` (use a real ID).
   - A specific venue: `/venues/:slug`.
   - Settings: `/settings/profile`.
3. After each navigation:
   - Check that the shell loads (header/nav present).
   - Check that nav highlight is appropriate (e.g. “Venues” is active on `/venues/:slug` or not highlighted if that’s the design).
4. Use a hard refresh (Cmd+Shift+R) on at least one of these deep links.

**Expected**

- Shell (header/nav) always appears around content for valid routes.
- No bare “content only” layouts unless intentionally designed.
- Hard refresh:
  - Restores auth state (if session is valid).
  - Keeps you on the same deep link route.
- Nav highlight is either:
  - Correct (e.g. “Venues” active on `/venues/:slug`), or
  - Consistently un-highlighted if that’s the chosen behaviour for deep routes (document whichever you see).

**Result log**

- **2025-12-04 – Local Docker – James – Pass**
  - **Issue:**
    - None.
  - **Notes:**
    - None. All working as expected.
  - **Bug(s):**
    - None.

---

## 3. Auth Guards & Redirects (Shell-Level)

### 3.1 SHELL-003 – Protected routes (unauthenticated)

**Goal:** Signed-out users cannot access protected routes; the shell enforces redirects correctly.

**Steps**

1. Sign out completely.
2. In the browser address bar, manually navigate to:
   - `/` (feed/home)
   - `/add-catch`
   - `/settings/profile`
   - `/my-venues` (if applicable)
   - Any `/admin/...` route (if you have an admin user; otherwise just note “not tested”)
3. Observe what happens for each route.

**Expected**

- For **protected routes**:
  - Immediate redirect to `/auth` (or equivalent login page).
  - No flash of the protected page before redirect.
- For **public routes**:
  - `/venues` (and other public pages) remain accessible without auth.
- URL after redirect matches the auth page.
- No React errors or Supabase auth errors in the console for normal unauthenticated hits.

**Result log**

- **2025-12-04 – Local Docker – James – Pass**
  - **Issue:**
    - None for core protected/public routes; missing `/my-venues` and `/admin` UX is acceptable for now.
  - **Notes:**
    - `/` (feed/home) → redirects to `/auth` with no feed content leakage; loading spinner shows briefly until auth loads.
    - `/add-catch` → redirects to `/auth` with no add-catch content leakage; loading spinner shows briefly until auth loads.
    - `/settings/profile` → redirects to `/auth` with no settings/profile content leakage; loading spinner shows briefly until auth loads.
    - `/venues` → remains publicly accessible while signed out (expected).
    - `/my-venues` → 404 Not Found (page does not appear to exist yet).
    - `/admin/...` → 404 Not Found. We don’t expose a dedicated admin login page; this is acceptable for v3.
    - No React or Supabase auth errors seen in the console during these tests.
  - **Bug(s):**
    - None identified for the current scope. `/my-venues` and `/admin` UX can be revisited when those areas are implemented.

---

### 3.2 SHELL-004 – Auth→Target redirect (optional nice-to-have)

**Goal:** If the user is sent to `/auth` from a protected route, check whether they return to the original target after login.

**Steps**

1. While signed out, manually go to a protected route, e.g. `/add-catch`.
2. You should get redirected to `/auth`.
3. Sign in with a valid account.

**Expected**

- **Ideal behaviour**:
  - After signing in, you land on the originally requested route (e.g. `/add-catch`).
- **Minimum acceptable behaviour (if “return-to” isn’t implemented yet)**:
  - You land on a safe default page (e.g. feed/home), and never see protected content while unauthenticated.
- No redirect loops between `/auth` and the target route.

**Result log**

- **2025-12-04 – Local Docker – James – Pass**
  - **Issue:**
    - Ideal “return-to target route” behaviour is not implemented; after logging in from a protected route you land on the home/feed page.
  - **Notes:**
    - Starting signed out, navigating directly to `/add-catch` redirects to `/auth` with no protected content leakage.
    - After successful login, the app consistently redirects to the home page (`/`), not back to `/add-catch`.
    - This matches the “minimum acceptable” behaviour for v3; “return-to” is a future UX enhancement.
    - No redirect loops observed between `/auth` and any protected route.
  - **Bug(s):**
    - None for current scope. Track “return-to original route after login” as a future improvement rather than a bug.

---

## 4. 404 / Not Found Handling

### 4.1 SHELL-005 – Unknown routes

**Goal:** Confirm that invalid URLs show a friendly 404, not a blank screen or crash.

**Steps**

1. While **signed out**, go to an obviously bogus route:
   - `/this/does/not/exist`
2. While **signed in**, do the same:
   - `/this/does/not/exist`
3. With dynamic params, try malformed or non-existent values:
   - `/catches/not-a-uuid`
   - `/catches/97d5b489-7c3e-4b47-bcec-9c84c4756222` (non-existent catch)
   - `/venues/not-a-real-slug` (non-existent venue)

**Expected**

- A consistent **Not Found** page (or error state) appears:
  - Includes a message such as “Page not found”.
  - Offers a way back (e.g. link to home/venues).
- No React stack traces or unhandled errors.
- The app shell (header/nav) still renders around the 404 page, unless the design intentionally hides it.

**Result log**

- **2025-12-04 – Local Docker – James – Pass**
  - **Issue:**
    - None for current behaviour. Venue 404 uses a slightly more specific message (“Venue not found”) instead of the generic 404 copy, which is acceptable.
  - **Notes:**
    - `/this/does/not/exist` (signed out) → 404 **“Oops! Page not found”** – Pass.
    - `/this/does/not/exist` (signed in) → 404 **“Oops! Page not found”** – Pass.
    - `/catches/not-a-uuid` → 404 **“Oops! Page not found”** – Pass.
    - `/catches/97d5b489-7c3e-4b47-bcec-9c84c4756222` (non-existent ID) → 404 **“Oops! Page not found”** – Pass.
    - `/venues/not-a-real-slug` → **“Venue not found. This venue doesn't exist or isn't published.”** – Pass; page still uses the standard shell and a clear error message.
    - No React stack traces or unhandled errors observed in the console.
    - The app shell (header/nav) remains visible on all 404-style pages tested.
  - **Bug(s):**
    - None identified.

---

### 5.1 SHELL-006 – Nav state across tabs

**Goal:** Validate that logging out/logging in affects all tabs’ shell state predictably.

**Steps**

1. Sign in as a user.
2. Open the app in **two tabs** (duplicate the first tab).
3. In **tab A**, navigate to a specific protected page (e.g. `/insights` or `/venues`).
4. In **tab B**, use the standard **Logout** action.
5. Return to **tab A** and:
   - Try to navigate to another protected page.
   - Refresh the page.

**Expected**

- After logout in tab B, tab A behaves as **signed-out**:
  - Protected routes redirect to `/auth`.
  - Nav no longer shows “logged-in” state.
- No stale nav state claiming you’re logged in when requests fail.
- Session handling feels consistent across tabs.

**Result log**

- **2025-12-04 – Local Docker – James – Pass**
  - **Issue:**
    - None.
  - **Notes:**
    - Logged in as an admin user in tab A, then duplicated the tab.
    - Verified both tabs showed a logged-in state initially.
    - Navigated tab A to `/venues`.
    - Logged out in tab B; tab A reflected the logged-out state as well.
    - Attempting to navigate to protected pages in tab A after logout behaved correctly (redirected to `/auth`).
    - Refreshing tab A also showed signed-out state with no stale session.
  - **Bug(s):**
    - None identified.

---

## 6. Visual & Layout Sanity (Optional, but Recommended)

### 6.1 SHELL-007 – Basic responsive nav check

**Goal:** At a high level, verify that the shell doesn’t break at different viewport widths.

**Steps**

1. While signed in, open the app and:
   - Resize the browser to a typical **desktop** width.
   - Resize to a **tablet**-ish width.
   - Resize to a **mobile**-ish width (or use dev tools device toolbar).
2. At each size:
   - Navigate between main pages via the nav.

**Expected**

- Nav remains usable (collapses or rearranges appropriately if responsive styles are implemented).
- No completely hidden nav with no replacement (unless intentionally minimal).
- No overlapping or unreadable nav labels.

**Result log**

- **2025-12-04 – Local Docker – James – Pass**
  - **Issue:**
    - None.
  - **Notes:**
    - Resized across desktop, tablet, and mobile-ish widths.
    - Nav stayed usable at all sizes.
    - On mobile, nav items and profile are accessible via the drawer nav; nothing was clipped or unreadable.
  - **Bug(s):**
    - None identified.

---

## 7. Test Run Log

Use this section to summarise each full run of the shell/nav tests.

Example:

- **Date:** 2025-12-\_\_  
  **Environment:** Local Docker (fresh DB)  
  **Tester:** James  
  **Summary:**
  - ✅ Primary nav links and deep-link behaviour OK.
  - ✅ Protected route redirects behave as expected for unauthenticated users; public venues remain accessible.
  - ⚠️ Return-to behaviour after auth not implemented (always lands on `/`); acceptable for now but should be tracked.
  - ✅ 404/Not Found page appears for invalid routes (no crashes).
  - ✅ Multi-tab shell state behaves correctly (logout propagates).
  - ⚠️ Note any responsive/layout quirks to refine later (if any).

Add new entries below as you iterate:

- **Date:**  
  **Environment:**  
  **Tester:**  
  **Summary:**
  - …
