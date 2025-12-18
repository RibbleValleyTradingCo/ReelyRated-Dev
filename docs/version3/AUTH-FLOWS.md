# Auth Flows – Test Plan (v3)

This document covers **manual end-to-end testing** of all authentication-related flows in ReelyRated v3.

It is the detailed companion to `docs/version3/TEST-PLAN.md` and focuses on:

- Email/password sign-up & sign-in
- Password reset (forgot + reset link flow)
- Session handling (redirects, guards)
- Account settings: change email / change password
- Logout and multi-device behaviour
- Basic security / abuse checks (rate limits, error handling)

---

## 1. Scope & Invariants

**Tech context**

- Auth provider: Supabase Auth (email/password).
- Frontend entry: `src/pages/Auth.tsx`.
- Global wiring: `src/components/AuthProvider.tsx` + router guards.
- Environments under test: local Docker + empty dev DB.

**Global invariants to watch**

- After successful auth, `AuthProvider` has a non-null user and profile.
- Protected routes:
  - Redirect unauthenticated users to `/auth` (or equivalent).
  - Allow authenticated users through without flicker/loop.
- Error messages:
  - Never leak low-level Supabase errors (tokens, SQL, raw JSON).
  - Are human-readable and specific enough (but not overly detailed).

---

## 2. Sign-Up Flow

### 2.1 Happy path – new user sign-up

**Goal:** A new email/password user can register and land in the app.

**Steps**

1. Navigate to `/auth`.
2. Switch to **Sign up** tab/form.
3. Enter a **new** email and strong password.
4. Submit.

**Expected**

- UI shows a clear success state (e.g. signed in or “check your email” depending on config).
- A new `auth.users` row exists and is linked to a `public.profiles` row (check in Studio).
- User is treated as **logged in** in the UI (nav, profile menu, etc.) if automatic sign-in is expected.
- No duplicate profile rows get created on refresh.

**Result log**

- **2025-12-04 – Local Docker – James – Partial Pass**
  - **Issue:** No verification email received.
  - **Notes:** Account created! Check your email to verify! User is automatically signed in and directed to the homepage.
  - **Bug(s):** No verification email is received.

### 2.2 Validation errors

**Goal:** Client-side validation stops obviously bad input.

**Cases**

- Invalid email format.
- Password too short / too weak (based on current rules).
- Empty fields.

**Expected**

- Inline validation messages; submit is blocked.
- No network call for purely client-side-invalid forms.

**Result log**

- **2025-12-04 – Local Docker – James – Partial Pass**
  - **Issue:**
    None.
  - **Notes:**
    When typing a bad username: Username can only contain letters, numbers, underscores, and hyphens.
    When typing a bad email address: Please enter a valid email address.
    When typing a bad password: Password must be at least 6 characters.
    When trying to sign in with empty field;
    Username is required
    Email is required
    Password is required
  - **Bug(s):**
    When trying to sign in via Google: {"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}

### 2.3 Duplicate email

**Goal:** Trying to register with an existing email shows a friendly error.

**Steps**

1. Sign up with `test@example.com`.
2. Log out.
3. Go back to **Sign up**, reuse `test@example.com`.

**Expected**

- UI shows “account already exists” (or similar).
- No second user row is created.
- No crash / no raw Supabase error JSON.

- **2025-12-04 – Local Docker – James – Pass**
  - **Issue:**
    None.
  - **Notes:**
    When typing a duplicate email: This email is already registered. Please sign in instead.
    No second user row is created.
  - **Bug(s):**
    None.

---

## 3. Sign-In Flow

### 3.1 Happy path – correct credentials

**Steps**

1. Navigate to `/auth`.
2. Switch to **Sign in**.
3. Enter a **known good** email/password.
4. Submit.

**Expected**

- Redirect to the main app (e.g. feed/home).
- Auth UI disappears; nav/header shows logged-in state.
- Refreshing the page keeps the user logged in (session restored).

- **2025-12-04 – Local Docker – James – Pass**
  - **Issue:**
    None.
  - **Notes:**
    On sign-in: Toast message: Welcome back!
  - **Bug(s):**
    None.

### 3.2 Wrong password

**Steps**

- Try to sign in with the correct email and a wrong password.

**Expected**

- Clear “incorrect email or password” style message.
- No indication which one is wrong (for security).
- No lockout after a single failure.

- **2025-12-04 – Local Docker – James – Pass**
  - **Issue:**
    None.
  - **Notes:**
    When entering incorrect password: Toast message: Invalid Login Credentials.
  - **Bug(s):**
    None.

### 3.3 Non-existent email

**Steps**

- Try to sign in with an email that does not exist.

**Expected**

- Same generic error as wrong password (no user enumeration).
- No new user silently created.

- **2025-12-04 – Local Docker – James – Pass**
  - **Issue:**
    None.
  - **Notes:**
    When entering non-existent email: Toast message: Invalid Login Credentials.
  - **Bug(s):**
    None.

---

## 4. Password Reset Flow

### 4.1 Request reset link (forgot password)

**Goal:** User can request a reset link and see a generic success.

**Steps**

1. On `/auth`, click **Forgot password?**.
2. Enter a valid email.
3. Submit.

**Expected**

- UI shows a **generic success** (“If an account exists, we’ve emailed you a link.”).
- No indication whether the email exists or not.
- No crash if the email is not registered.

_(You don’t need the actual email locally if you already tested the backend once; just verify the request completes and the success state appears.)_

- **2025-12-04 – Local Docker – James – Partial Pass**
  - **Issue:**
    Valid-email path and actual email delivery not fully verified locally.
  - **Notes:**
    Forgot Password button - on click, opens new forgot password window. Send reset link button. On click: toast message: Please enter an email address.
    Send reset link button with empty email field. On click: toast message: Please enter an email address.
    Back to sign-in button. On click: navigates to /auth.
    Mailpit/email capture is not configured locally, so the “valid email” success path and actual email delivery were not exercised in this run.

### 4.2 Invalid / expired reset link

**Goal:** The app gracefully handles a broken or expired reset token.

**Steps**

1. Manually visit a `/auth/reset` link with:
   - A clearly invalid token.
   - Or let a real token expire (if you want to be thorough).

**Expected**

- UI shows a “link invalid or expired” state.
- Clear CTA to go back to **Sign in** or **request a new link**.
- No infinite spinner or cryptic error.

- **2025-12-04 – Local Docker – James – Skipped**
  - **Issue:**
    N/A
  - **Notes:**
    Mailpit not currently configured locally. Not completed.
  - **Bug(s):**
    N/A

### 4.3 Reset password successfully

**Goal:** User can set a new password and then log in.

**Steps**

1. Use a valid reset link to open `/auth/reset`.
2. Enter a new strong password (and confirmation if required).
3. Submit.
4. Afterwards, try signing in with:
   - The **old password** → should fail.
   - The **new password** → should succeed.

**Expected**

- Password is updated in Supabase Auth.
- No stray errors in browser console.
- The user is either logged in automatically or gets a clear sign-in prompt.

- **2025-12-04 – Local Docker – James – Skipped**
  - **Issue:**
    N/A
  - **Notes:**
    Mailpit not currently configured locally. Not completed.
  - **Bug(s):**
    N/A

---

## 5. Session Handling & Guards

### 5.1 Protected route redirect (unauthenticated)

**Goal:** Unauthed users can’t hit protected routes.

**Steps**

1. Ensure you are logged **out**.
2. Try to go directly to:
   - `/` (feed)
   - `/add-catch`
   - `/venues`
   - `/settings/profile`
3. Observe behaviour.

**Expected**

- You get bounced to `/auth` (or another login page).
- No “flash” of protected content before redirect.
- URL is correct after redirect.

- **2025-12-04 – Local Docker – James – Pass**
  - **Issue:**
    None.
  - **Notes:**
  - `/` (feed) - redirect to /auth
  - `/add-catch` - redirect to /auth
  - `/venues` - accessible - expected behaviour. Venues are visible to all.
  - `/settings/profile` - redirect to /auth
  - **Bug(s):**
    None.

### 5.2 Authed access

**Goal:** Authed users can reach protected routes without loops.

**Steps**

1. Sign in.
2. Navigate to all key routes:
   - Feed/home
   - Catch detail
   - Add catch
   - Venues index/detail
   - My Venues
   - Settings pages

**Expected**

- No redirect back to `/auth`.
- No double redirects or flicker loops.

- **2025-12-04 – Local Docker – James – Pass**
  - **Issue:**
    None.
  - **Notes:**
  - Feed/home - pass
  - Catch detail - pass
  - Add catch - pass
  - Venues index/detail - pass
  - My Venues - is there a my venues page?
  - Settings pages - pass
  - **Bug(s):**
    None.

### 5.3 Session persistence on refresh

**Goal:** Refresh doesn’t log you out.

**Steps**

1. Sign in.
2. Visit feed/home.
3. Hard refresh the browser (Cmd+Shift+R).
4. Optionally close the tab and reopen the app.

**Expected**

- You remain logged in.
- `AuthProvider` restores session cleanly (no long “loading auth” state).

- **2025-12-04 – Local Docker – James – Pass**
  - **Issue:**
    None.
  - **Notes:**
    None.
  - **Bug(s):**
    None.

---

## 6. Account Settings (Email & Password)

### 6.1 Change password (in-session)

**Goal:** Logged-in user can change password from settings.

**Steps**

1. Sign in.
2. Navigate to the security/account settings page (where password change is exposed).
3. Enter current password + new password.
4. Submit.
5. Attempt sign-in afterwards with:
   - Old password → should fail.
   - New password → should work.

**Expected**

- Clear success message in UI.
- No partial state where both passwords work.

- **2025-12-04 – Local Docker – James – Pass**
  - **Issue:**
    None.
  - **Notes:**
    Password updated successfully (toast shown). Old password fails; new password works as expected.
  - **Bug(s):**
    None.

### 6.2 Change email

**Goal:** User can request an email change and complete it.

_(If the full confirm-via-email flow is wired, test it; otherwise just ensure the request path is safe.)_

**Steps**

1. Sign in.
2. Go to email change UI.
3. Enter a new email.
4. Submit.

**Expected**

- Either:
  - Immediate update of email in profile/auth, **or**
  - A message telling the user to confirm via email.
- Attempts to use the old email for sign-in should eventually fail once the change is confirmed.

- **2025-12-04 – Local Docker – James – Partial Pass**
  - **Issue:**
    Confirmation email flow not fully verified locally (no Mailpit/email capture configured).
  - **Notes:**
    Using an existing email address: toast message “A user with this email address has already been registered.”  
    Using current email address: toast message “That’s already your current email.”  
    Using a valid new email address: toast message “Check your inbox to confirm the new email address.”  
    Mailpit/email capture is not configured locally, so the actual confirmation-link step is untested.
  - **Bug(s):**
    None.

---

## 7. Logout & Multi-Device Behaviour

### 7.1 Standard logout

**Steps**

1. While logged in, use the app’s **Log out** action.
2. Attempt to navigate to protected pages.

**Expected**

- User is redirected to `/auth`.
- Protected routes do not resolve.
- No stray authenticated calls in the network tab.

- **2025-12-04 – Local Docker – James – Pass**
  - **Issue:**
    None.
  - **Notes:**
    As logged out user, cannot see protected pages. No network logs to report.
  - **Bug(s):**
    None.

### 7.2 Multi-tab behaviour (optional nice-to-have)

**Goal:** Logging out in one tab should log out others (if you rely on Supabase’s built-in session storage).

**Steps**

1. Open the app in two tabs.
2. Log out in tab A.
3. Interact with tab B.

**Expected**

- Tab B eventually detects logout (on refresh or next navigation).
- No “stale” authenticated state.

- **2025-12-04 – Local Docker – James – Pass**
  - **Issue:**
    None.
  - **Notes:**
    Two tabs with logged in status. Logging out in one tab, logs out of both windows. Pass.
  - **Bug(s):**
    None.

---

## 8. Negative / Abuse Cases (Quick Pass)

These can be smoke-tested manually; deep security review can come later.

- **Brute-force-ish behaviour:**
  - Rapidly submit wrong passwords.
  - UI should not explode; if you have rate limiting, confirm it fails gracefully (generic error).
- **Tampered URLs:**
  - Hit `/auth/reset` without any token.
  - Hit it with obviously malformed query parameters.
  - App should show a controlled error state, not a stack trace.
- **Broken network:**

  - Temporarily disable network and try to sign in.
  - Expect a clean error message (“unable to reach server”) rather than hanging forever.

- **2025-12-04 – Local Docker – James – Fail**

  - **Issue:**
    No visible auth rate limiting; some error states could be clearer.
  - **Notes:**
    Brute-force-ish behaviour:

    - Rapid wrong-password submissions show an endless “Invalid login credentials” toast with no sign of throttling or lockout.
    - Multiple wrong variations (wrong1, wrong2, etc.) behave the same way.

    Tampered URLs:

    - Visiting `/auth/reset` directly (e.g. http://localhost:8080/auth/reset) shows a generic 404 page rather than a friendly “invalid or expired link” state.

    Broken network:

    - With the network disabled, the app shows “Update Required. A new version of the application is available. Please reload the page to continue.” which is misleading for offline/error scenarios.

  - **Bug(s):**
    - Auth rate limiting not enforced at the app layer (follow-up needed at infra/Auth level).
    - `/auth/reset` should show a controlled invalid/expired-link message instead of a plain 404.
    - Offline error copy should be updated to reflect connection issues rather than version updates.

---

## 9. Test Run Log

Use this to record results each time you run through the auth tests.

Example:

- **Date:** 2025-12-04  
  **Environment:** Local Docker (fresh DB)  
  **Tester:** James  
  **Summary:**
  - ✅ Sign-up / Sign-in basic flows OK (validation, duplicate email handling, wrong password, non-existent email).
  - ✅ Forgot password: request path behaves correctly; invalid/expired link + full reset flow still partially untested locally (no Mailpit).
  - ⚠️ Change email: UI flow and toasts look correct; confirmation email not verifiable in local Docker.
  - ✅ Guards & redirects behaving correctly (protected routes, session persistence, logout, multi-tab).
  - ❌ Negative / abuse cases: no visible auth rate limiting; `/auth/reset` without a token shows 404; offline error copy is misleading. See section 8.

Add new entries below as you iterate.

---
