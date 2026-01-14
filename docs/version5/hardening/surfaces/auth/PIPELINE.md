# Auth Pipeline (E2E)
<!-- PHASE-GATES:START -->
## Phase Gates

| Gate | Status | Evidence | Notes |
| --- | --- | --- | --- |
| Contract & personas defined | TODO | (link to section below) | |
| Data entrypoints inventoried (tables/RPC/storage/realtime) | TODO | | |
| Anti-enumeration UX verified | TODO | | |
| RLS/policies verified for surface tables | TODO | | |
| Grants verified (least privilege) | TODO | | |
| RPC posture verified (EXECUTE + SECURITY DEFINER hygiene if used) | TODO | | |
| Manual UX pass (4 personas) | TODO | HAR + screenshots | |
| SQL probe evidence captured | TODO | CSV/SQL outputs | |
| Result | TODO | | PASS / FAIL |
<!-- PHASE-GATES:END -->

<!-- PERSONA-CONTRACT-REF:START -->
Persona contract: `docs/version5/hardening/_global/legacy/PERSONA-PERMISSIONS.md`
<!-- PERSONA-CONTRACT-REF:END -->


## Scope

- Route: `/auth` (public). `src/App.tsx:217`.
- Related route: `/account-deleted` (public). `src/App.tsx:218`, `src/pages/AccountDeleted.tsx`.
- Page: `src/pages/Auth.tsx`.
- Auth bootstrap: `AuthProvider` loads user/session and subscribes to auth state. `src/components/AuthProvider.tsx:73`, `src/components/AuthProvider.tsx:104`.
- Query param: `?reset_password=1` sets the reset view. `src/pages/Auth.tsx:27`.
- Related redirect param: `?fromEmailChange=true` is used by ProfileSettings redirects; Auth page does not handle it explicitly. `src/pages/ProfileSettings.tsx:268`.
- Redirect targets:
  - Sign-up verification email: `/auth`. `src/pages/Auth.tsx:133`.
  - Password reset link: `/auth?reset_password=1`. `src/pages/Auth.tsx:154`.
  - Google OAuth redirect: `window.location.origin`. `src/pages/Auth.tsx:211`.

### OAuth callback posture (SPA vs callback route)

- This app is a SPA (Vite/React). OAuth uses `supabase.auth.signInWithOAuth(...)` with `redirectTo = window.location.origin`, and session hydration is handled client-side via `AuthProvider` (`getSession/getUser` + `onAuthStateChange`).
- There is no dedicated `/auth/callback` route in this codebase today (the surface is `/auth` + client bootstrap).
- If a callback route is introduced later (common in server frameworks using PKCE code exchange), it becomes a surfaced route that must be added to the routes/surface inventory and hardened like any other auth-critical surface.

### Auth safety requirements (copy/paste checklist)

#### Anti-enumeration requirements

- Responses for auth failures must be indistinguishable across:
  - wrong email vs wrong password (sign-in)
  - existing vs non-existing email (reset request)
  - existing vs non-existing username/email (sign-up)
- “Indistinguishable” means: same UI copy, same HTTP status class where feasible, and no reliable timing side-channel.
- Avoid any copy that confirms account existence (no “email not found”, “account does not exist”, etc.).

#### OAuth / callback / code-exchange requirements

- Any OAuth `redirectTo` target must be on an allow-list (dev + prod).
- After OAuth returns, exchange the auth code for a session and ensure tokens/codes are not left in the URL.
- If a return path param is supported (e.g. `next` / `returnTo`):
  - Only allow same-origin relative paths (must start with `/`).
  - If invalid, fall back to `/`.

#### Redirect allow-list requirements (Supabase project config)

- Confirm the project “Site URL” is correct for the environment (dev/prod).
- Confirm additional redirect URLs include:
  - local dev origin(s)
  - production origin(s)
  - any explicit callback route used by the app (if applicable)

#### Evidence expectations (what we will prove in sweep)

- Capture at least one HAR showing the reset request response is generic and does not change for existing vs non-existing emails.
- Capture at least one HAR showing sign-in failure is generic (wrong email vs wrong password).
- Capture at least one HAR showing OAuth returns and session exchange occurs without leaving secrets in the URL.
- Capture screenshots of the UI messages used for each failure class (sign-in/sign-up/reset) to prove wording parity.

References (optional)

- OWASP WSTG: Account Enumeration (WSTG-ATHN-04) — https://owasp.org/www-project-web-security-testing-guide/stable/4-Web_Application_Security_Testing/04-Authentication_Testing/04-Testing_for_Account_Enumeration
- OWASP Cheat Sheet: Error Handling — https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html
- Supabase docs: Auth config (site_url / redirect allow list fields) — https://supabase.com/docs/guides/cli/config#auth
- Supabase docs: OAuth redirect allow list + code exchange examples — https://supabase.com/docs/guides/auth/social-login/auth-spotify

## Surface narrative (step-by-step)

1. Auth bootstrap + loading

   - AuthProvider initializes by calling `supabase.auth.getUser()` and `supabase.auth.getSession()`, then listens for `onAuthStateChange`. `src/components/AuthProvider.tsx:73`, `src/components/AuthProvider.tsx:104`.
   - While `loading` or `isAuthReady` is false, `/auth` shows a loading state with message "Loading your account…". `src/pages/Auth.tsx:228`.

2. Route access behavior

   - `/auth` is public (no RequireAuth). `src/App.tsx:217`.
   - If a user is already authenticated and the view is not reset, `/auth` redirects to `/`. `src/pages/Auth.tsx:70`.
   - If `reset_password=1` is present, the view is forced to "reset" and the redirect is skipped. `src/pages/Auth.tsx:76`.

3. Sign in (password)

   - User submits the sign-in form -> `supabase.auth.signInWithPassword`. `src/pages/Auth.tsx:83`.
   - On error, show generic toast "Unable to sign in. Please check your details and try again." `src/pages/Auth.tsx:89`.
   - On success, load `profiles.is_deleted` for the user. `src/pages/Auth.tsx:99`.
   - If `is_deleted` is true, show info toast and rely on DeletedAccountGate to sign out + redirect. `src/pages/Auth.tsx:107`.
   - Otherwise show "Welcome back!" and navigate `/`. `src/pages/Auth.tsx:110`.

4. Deleted account handling (post-auth)

   - After navigation into the app shell, DeletedAccountGate re-checks `profiles.is_deleted` and signs out + redirects to `/account-deleted` if true. `src/components/DeletedAccountGate.tsx:49`, `src/components/DeletedAccountGate.tsx:65`, `src/components/DeletedAccountGate.tsx:66`.
   - `/account-deleted` displays a dedicated message and links back to `/auth`. `src/pages/AccountDeleted.tsx:33`.

5. Sign up (email + password)

   - Pre-checks username availability via `profiles` (`select id where username = lower(input)`). `src/pages/Auth.tsx:119`.
   - If username exists, show generic sign-up error message. `src/pages/Auth.tsx:124`.
   - Otherwise call `supabase.auth.signUp` with `emailRedirectTo` and `data.username`. `src/pages/Auth.tsx:129`.
   - On success, show "Account created! Check your email to verify!" `src/pages/Auth.tsx:143`.

6. Password reset request

   - Uses `supabase.auth.resetPasswordForEmail` with redirect to `/auth?reset_password=1`. `src/pages/Auth.tsx:155`.
   - Always shows a generic success toast: "If an account exists for that email, we'll send password reset instructions." `src/pages/Auth.tsx:161`.

7. Password reset completion

   - Reset view requires a valid `session`; if missing, show error and disable update. `src/pages/Auth.tsx:169`, `src/pages/Auth.tsx:451`, `src/pages/Auth.tsx:495`.
   - Validates password length (>= 8) and match, then calls `supabase.auth.updateUser`. `src/pages/Auth.tsx:191`.
   - On success, shows "Your password has been updated." and navigates `/`. `src/pages/Auth.tsx:195`.

8. OAuth sign-in (Google)
   - Calls `supabase.auth.signInWithOAuth` with provider "google" and redirect to `window.location.origin`. `src/pages/Auth.tsx:208`.
   - Errors are reported via a generic toast. `src/pages/Auth.tsx:215`.

## Entrypoints inventory (with file:line)

### Supabase auth

| Call                     | File                                       | Notes                                                           |
| ------------------------ | ------------------------------------------ | --------------------------------------------------------------- |
| signInWithPassword       | `src/pages/Auth.tsx:83`                    | Auth API (GoTrue). Errors shown via generic message; no RPCs.   |
| signUp                   | `src/pages/Auth.tsx:129`                   | Auth API (GoTrue). Sends `emailRedirectTo` and `data.username`. |
| resetPasswordForEmail    | `src/pages/Auth.tsx:155`                   | Auth API (GoTrue). Always shows generic reset toast.            |
| updateUser (password)    | `src/pages/Auth.tsx:191`                   | Auth API (GoTrue). Requires a valid session.                    |
| signInWithOAuth (google) | `src/pages/Auth.tsx:208`                   | Auth API (GoTrue). Redirects to `window.location.origin`.       |
| getUser / getSession     | `src/components/AuthProvider.tsx:73`       | Auth bootstrap used to render loading state.                    |
| onAuthStateChange        | `src/components/AuthProvider.tsx:104`      | Updates session/user on auth events.                            |
| signOut                  | `src/components/DeletedAccountGate.tsx:65` | Used to force logout for deleted accounts (post-auth).          |

### RPCs

- None found in route/feature files.

### PostgREST

| Table    | Operations | File                                       | Notes                                                                                                                                    |
| -------- | ---------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| profiles | select     | `src/pages/Auth.tsx:99`                    | Reads `is_deleted` after sign-in. RLS policy `profiles_select_all` allows select. `supabase/migrations/1004_policies_and_grants.sql:28`. |
| profiles | select     | `src/pages/Auth.tsx:119`                   | Checks username availability (anon). RLS policy `profiles_select_all`. `supabase/migrations/1004_policies_and_grants.sql:28`.            |
| profiles | select     | `src/components/DeletedAccountGate.tsx:49` | Post-auth deletion gate in app shell. RLS policy `profiles_select_all`. `supabase/migrations/1004_policies_and_grants.sql:28`.           |

### Storage

- None found.

### Realtime

- None found.

### Third-party APIs

- Google OAuth via `supabase.auth.signInWithOAuth`. `src/pages/Auth.tsx:208`.

## Implicit DB side-effects

- `auth.users` insert triggers `public.handle_new_user()` to insert into `public.profiles`. `supabase/migrations/1001_core_schema.sql:194`.
- `public.handle_new_user()` is SECURITY DEFINER with `SET search_path = public, extensions`. `supabase/migrations/1001_core_schema.sql:195`.

## Security posture notes (facts only)

- `/auth` is a public route (not wrapped by RequireAuth). `src/App.tsx:217`.
- Authenticated users are redirected away from `/auth` unless in reset view. `src/pages/Auth.tsx:70`.
- Username pre-check uses direct PostgREST `profiles` read (anon) and returns a generic error message. `src/pages/Auth.tsx:119`, `src/pages/Auth.tsx:124`.
- Password reset uses a generic success toast regardless of email existence. `src/pages/Auth.tsx:161`.
- OAuth redirect target is `window.location.origin` (no user-supplied URL). `src/pages/Auth.tsx:211`.
- Redirect allow list requirements: `redirectTo` / `emailRedirectTo` targets must be restricted to the project’s configured redirect allow list (Site URL + additional redirect URLs). Treat misconfiguration here as both a broken-auth risk (flows fail) and an open-redirect risk (if overly broad).
- `profiles_select_all` policy allows SELECT for all roles. `supabase/migrations/1004_policies_and_grants.sql:28`.
- Risk watch: `profiles_select_all` is used for an anon username availability pre-check (direct PostgREST read). Confirm the query is strictly minimal (only `id`), that no extra columns can be inferred, and consider a narrow RPC/view for username availability if you later want to tighten public profile exposure.

## SQL queries to run during sweep

```
-- Profiles RLS + grants
select *
from pg_policies
where schemaname = 'public' and tablename = 'profiles';

select *
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'profiles';

-- Trigger + function for auth user creation
select tgname, pg_get_triggerdef(t.oid)
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'auth' and c.relname = 'users';

select proname, pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'handle_new_user';

select *
from information_schema.routine_privileges
where routine_schema = 'public' and routine_name = 'handle_new_user';

select proname, prosecdef, proconfig
from pg_proc
join pg_namespace n on n.oid = pronamespace
where n.nspname = 'public' and proname = 'handle_new_user';

-- Rate limit posture (auth flow does not use these directly; verify if any enforcement exists)
select *
from pg_policies
where schemaname = 'public' and tablename = 'rate_limits';

select proname, pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in ('check_rate_limit','get_rate_limit_status','user_rate_limits');
```

## Repro commands used

```
rg -n "<Route|createBrowserRouter|path=" src/App.tsx -S
rg -n "src/pages/Auth\\.tsx|/auth|auth/callback" src -S
rg -n "exchangeCodeForSession|auth/callback|reset_password|fromEmailChange|auth\\?" src -S
rg -n "supabase\\.auth\\." src/pages/Auth.tsx src/components/AuthProvider.tsx src/components/DeletedAccountGate.tsx src/components/Navbar.tsx -S
rg -n "resetPasswordForEmail|updateUser|signInWithPassword|signUp|signInWithOAuth|exchangeCodeForSession" src -S
rg -n "check_email_exists|rate_limit|request_account_export|request_account_deletion" src supabase -S
rg -n "on_auth_user_created|auth\\.users|auth.users|handle_new_user|create_profile|profiles" supabase/migrations -S
```
