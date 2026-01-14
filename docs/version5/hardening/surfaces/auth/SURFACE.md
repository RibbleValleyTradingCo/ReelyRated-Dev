# Surface: auth

> Canonical, code-referenced behavior for this surface lives in `PIPELINE.md` (file:line truth). This `SURFACE.md` is the contract + summary and intentionally avoids brittle line-number references.

## Route patterns

- `/auth` (public)
  - Query param `reset_password=1` forces the reset view
  - Query param `fromEmailChange=true` is used by ProfileSettings redirects; the Auth page does not handle it explicitly
- `/account-deleted` (public info page after deleted-account sign-out)

## Router entry files

- `src/App.tsx`
- `src/pages/Auth.tsx`
- `src/pages/AccountDeleted.tsx`
- See `PIPELINE.md` for canonical file:line references.

## Personas

- Anon: allowed to access `/auth` and `/account-deleted`.
- Authenticated (any role: normal/owner/private/blocked/admin): redirected away from `/auth` to `/` unless in reset view; `/account-deleted` remains accessible.

## Deny UX

- `/auth` shows a loading state until auth bootstrap is ready.
- Authenticated users visiting `/auth` are redirected to `/` unless the view is "reset".
- Reset view with no session shows an inline error banner and disables update.
- Deleted accounts: sign-in checks `profiles.is_deleted` and shows an info toast; `DeletedAccountGate` then signs out and redirects to `/account-deleted`.
- Evidence for exact UI copy and the precise redirect sequencing is captured in `PIPELINE.md`.

## Entrypoints

### Supabase auth

| Call                     | File(s) (see PIPELINE for exact refs)   | DB posture        | Notes                                        |
| ------------------------ | --------------------------------------- | ----------------- | -------------------------------------------- |
| signInWithPassword       | `src/pages/Auth.tsx`                    | Auth API (GoTrue) | Generic error toast on failure.              |
| signUp                   | `src/pages/Auth.tsx`                    | Auth API (GoTrue) | Sends `emailRedirectTo` and `data.username`. |
| resetPasswordForEmail    | `src/pages/Auth.tsx`                    | Auth API (GoTrue) | Always shows generic reset toast.            |
| updateUser (password)    | `src/pages/Auth.tsx`                    | Auth API (GoTrue) | Requires a valid session.                    |
| signInWithOAuth (google) | `src/pages/Auth.tsx`                    | Auth API (GoTrue) | Redirects to `window.location.origin`.       |
| getUser / getSession     | `src/components/AuthProvider.tsx`       | Auth API (GoTrue) | Auth bootstrap state for loading UI.         |
| onAuthStateChange        | `src/components/AuthProvider.tsx`       | Auth API (GoTrue) | Updates session/user on auth events.         |
| signOut                  | `src/components/DeletedAccountGate.tsx` | Auth API (GoTrue) | Used for deleted-account forced logout.      |

### RPCs

None found in route/feature files.

### PostgREST

| Table    | Operations | File(s) (see PIPELINE for exact refs)   | DB posture                 | Notes                                                                                                               |
| -------- | ---------- | --------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| profiles | select     | `src/pages/Auth.tsx`                    | RLS: `profiles_select_all` | Reads `is_deleted` after sign-in. `supabase/migrations/1004_policies_and_grants.sql:28`.                            |
| profiles | select     | `src/pages/Auth.tsx`                    | RLS: `profiles_select_all` | Username availability check for sign-up (selects only `id`). `supabase/migrations/1004_policies_and_grants.sql:28`. |
| profiles | select     | `src/components/DeletedAccountGate.tsx` | RLS: `profiles_select_all` | Deletion gate in app shell. `supabase/migrations/1004_policies_and_grants.sql:28`.                                  |

### Storage

None found in route/feature files.

### Realtime

None found in route/feature files.

## Implicit DB side-effects

- `auth.users` insert triggers `public.handle_new_user()` which inserts into `public.profiles`. `supabase/migrations/1001_core_schema.sql:194`.

## Security posture notes

### Facts from code/migrations

- `/auth` is a public route.
- Authenticated users are redirected away from `/auth` unless in reset view.
- Username pre-check uses PostgREST `profiles` select for anon users; UI messaging is generic.
- Password reset request uses a generic success message regardless of email existence.
- OAuth redirect target is fixed to `window.location.origin` (no user-supplied URL).
- Codebase note: there is no dedicated `/auth/callback` route and no explicit `exchangeCodeForSession` usage referenced by this surface; OAuth return URL shape (query/hash) and any URL cleanup must be verified during sweep.
- Redirect allow list requirements: Supabase Dashboard Auth settings must explicitly allow the redirect targets you use (at minimum `window.location.origin` for OAuth, and any password-reset/update-password routes you pass via `redirectTo`).
  - Supabase supports wildcard patterns for preview deployments; prefer exact origins/paths in production and avoid overly-broad patterns (especially `**`) outside local dev.
- `profiles_select_all` allows SELECT for anon/auth. `supabase/migrations/1004_policies_and_grants.sql:28`.
- Risk watch: `profiles_select_all` is used for an anon username availability check (selects only `id`). During sweep, confirm the PostgREST select remains minimal and that no sensitive profile fields become readable to anon via this policy.
- `public.handle_new_user` is SECURITY DEFINER with `SET search_path = public, extensions`. `supabase/migrations/1001_core_schema.sql:195`.

### OAuth callback posture (SPA vs callback route)

- Current posture is “SPA root return”: OAuth uses `redirectTo = window.location.origin`, so the provider returns to `/`.
- During sweep, capture what returns to the SPA in the URL (query/hash), confirm the app ends in an authenticated state, and confirm the URL does not retain access/refresh tokens. If a PKCE auth `code` appears, record whether it is removed after session establishment.
- Confirm allowed redirect targets are restricted (via Supabase Redirect URLs allow list) and that there is no open-redirect behavior via query params.

### To verify during sweep

- Enumeration parity (UI + network):
  - Sign-in: wrong email vs wrong password → same user-facing copy and no reliable network-level distinguishers.
  - Reset request: existing vs non-existing email → same user-facing copy and no reliable network-level distinguishers.
  - Sign-up: existing vs non-existing username (pre-check) → user-facing copy parity; record whether network response differs (rowcount/size/timing).
  - Sign-up: existing vs non-existing email → verify provider/GoTrue behavior; ensure UI remains generic.
- Supabase Auth rate limiting: confirm server-side rate limits are configured for sign-in/reset and capture the relevant project settings as evidence.
- OAuth return handling: capture URL before/after; confirm no token leakage; record whether a `code` is present and whether it is removed.
- Least privilege: confirm anon/auth roles cannot access more profile fields than intended via PostgREST (`profiles_select_all`).
- Reset flow: confirm `reset_password=1` + session handling cannot be abused to set passwords without a valid session.

## Test checklist

- Persona sweeps: Anon / Normal / Owner / Private / Blocked / Admin
- Expected allow/deny outcomes documented
- Evidence to capture: HAR + SQL + screenshots
- Note: we are preparing this surface pack only (no sweeps executed yet).

## Decisions/Exceptions

- TBD

## Discovery methods

- Route discovery: `src/App.tsx` (createBrowserRouter / <Route>)
- Entrypoint discovery commands:
  - `rg -n "supabase\.auth\." src -S`
  - `rg -n "supabase\.from\(" src -S`
  - `rg -n "storage\.from\(" src -S`
  - `rg -n "channel\(|realtime" src -S`
  - `rg -n "<Route|createBrowserRouter|path=" src -S`
