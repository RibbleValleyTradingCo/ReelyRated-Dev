Note: Raw evidence is stored locally under `_local_evidence/` and is not committed.
References here are pointers only.

# Evidence Index

> Sweep-ready evidence plan for `/auth` and `/account-deleted`.
> This does **not** assert tests have been run.
> Canonical, code-referenced behavior for this surface lives in `PIPELINE.md`.

| Evidence ID               | Type (HAR/SQL/Shot/Note) | Persona       | Scenario                             | File path                                                                             | Notes                                             |
| ------------------------- | ------------------------ | ------------- | ------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------- |
| AUTH-ANON-ALLOW-HAR       | HAR                      | Anon          | Visit `/auth` and confirm page loads | `docs/version5/hardening/surfaces/auth/evidence/har/AUTH-ANON-ALLOW.har`              | Capture initial load + no redirect.               |
| AUTH-ANON-ALLOW-SHOT      | Shot                     | Anon          | Auth page visible                    | `docs/version5/hardening/surfaces/auth/evidence/screenshots/AUTH-ANON-ALLOW.png`      | Show sign-in tab and URL bar.                     |
| AUTH-AUTHED-REDIRECT-HAR  | HAR                      | Authenticated | Visit `/auth` while signed in        | `docs/version5/hardening/surfaces/auth/evidence/har/AUTH-AUTHED-REDIRECT.har`         | Expect redirect to `/` (unless in reset view).    |
| AUTH-AUTHED-REDIRECT-SHOT | Shot                     | Authenticated | Post-redirect landing screen         | `docs/version5/hardening/surfaces/auth/evidence/screenshots/AUTH-AUTHED-REDIRECT.png` | Capture URL bar.                                  |
| AUTH-ACCOUNT-DELETED-SHOT | Shot                     | Anon          | Visit `/account-deleted`             | `docs/version5/hardening/surfaces/auth/evidence/screenshots/AUTH-ACCOUNT-DELETED.png` | Capture message + link back to `/auth` + URL bar. |

| AUTH-SIGNIN-SUCCESS-HAR | HAR | Anon | Successful sign-in | `docs/version5/hardening/surfaces/auth/evidence/har/AUTH-SIGNIN-SUCCESS.har` | Include `auth.signInWithPassword` request and redirect to `/`. |
| AUTH-SIGNIN-FAIL-WRONG-PASSWORD-HAR | HAR | Anon | Sign-in with wrong password | `docs/version5/hardening/surfaces/auth/evidence/har/AUTH-SIGNIN-FAIL-WRONG-PASSWORD.har` | Expect generic error message (anti-enumeration). |
| AUTH-SIGNIN-FAIL-WRONG-EMAIL-HAR | HAR | Anon | Sign-in with wrong email | `docs/version5/hardening/surfaces/auth/evidence/har/AUTH-SIGNIN-FAIL-WRONG-EMAIL.har` | Compare with wrong-password attempt for parity (copy/status/shape/timing). |
| AUTH-SIGNIN-FAIL-SHOT | Shot | Anon | Sign-in failure message | `docs/version5/hardening/surfaces/auth/evidence/screenshots/AUTH-SIGNIN-FAIL.png` | Capture toast text. |
| AUTH-SIGNIN-RATE-LIMIT-PROBE-HAR | HAR | Anon | Repeated wrong-password attempts | `docs/version5/hardening/surfaces/auth/evidence/har/AUTH-SIGNIN-RATE-LIMIT-PROBE.har` | Attempt N times and capture any rate-limit/lockout response (Supabase Auth is primarily server-side). |

| AUTH-SIGNUP-SUCCESS-HAR | HAR | Anon | Successful sign-up | `docs/version5/hardening/surfaces/auth/evidence/har/AUTH-SIGNUP-SUCCESS.har` | Include `auth.signUp` request + any observable side-effects. |
| AUTH-SIGNUP-FAIL-EXISTING-USERNAME-HAR | HAR | Anon | Sign-up with existing username | `docs/version5/hardening/surfaces/auth/evidence/har/AUTH-SIGNUP-FAIL-EXISTING-USERNAME.har` | Expect generic error message (anti-enumeration). |
| AUTH-SIGNUP-FAIL-EXISTING-EMAIL-HAR | HAR | Anon | Sign-up with existing email | `docs/version5/hardening/surfaces/auth/evidence/har/AUTH-SIGNUP-FAIL-EXISTING-EMAIL.har` | Verify provider/GoTrue behavior; ensure UI remains generic and does not confirm existence. |
| AUTH-SIGNUP-FAIL-SHOT | Shot | Anon | Sign-up failure message | `docs/version5/hardening/surfaces/auth/evidence/screenshots/AUTH-SIGNUP-FAIL.png` | Capture toast text. |
| AUTH-USERNAME-AVAIL-CHECK-HAR | HAR | Anon | Username availability pre-check | `docs/version5/hardening/surfaces/auth/evidence/har/AUTH-USERNAME-AVAIL-CHECK.har` | Capture PostgREST call(s) to `profiles`; confirm select is minimal (`id` only) + schema is public-safe. |
| AUTH-USERNAME-AVAIL-CHECK-SHOT | Shot | Anon | Username availability UI state | `docs/version5/hardening/surfaces/auth/evidence/screenshots/AUTH-USERNAME-AVAIL-CHECK.png` | Capture “available/unavailable” state with URL bar. |

| AUTH-RESET-REQUEST-EXISTING-HAR | HAR | Anon | Request password reset (existing email) | `docs/version5/hardening/surfaces/auth/evidence/har/AUTH-RESET-REQUEST-EXISTING.har` | Capture request + generic success messaging. |
| AUTH-RESET-REQUEST-NONEXISTENT-HAR | HAR | Anon | Request password reset (non-existing email) | `docs/version5/hardening/surfaces/auth/evidence/har/AUTH-RESET-REQUEST-NONEXISTENT.har` | Compare with existing-email attempt for parity (copy/status/shape/timing). |
| AUTH-RESET-REQUEST-SHOT | Shot | Anon | Password reset requested message | `docs/version5/hardening/surfaces/auth/evidence/screenshots/AUTH-RESET-REQUEST.png` | Capture generic reset confirmation. |
| AUTH-RESET-RATE-LIMIT-PROBE-HAR | HAR | Anon | Repeated reset requests | `docs/version5/hardening/surfaces/auth/evidence/har/AUTH-RESET-RATE-LIMIT-PROBE.har` | Attempt N times; capture any rate-limit/abuse control signals (Supabase Auth is primarily server-side). |
| AUTH-RESET-COMPLETE-HAR | HAR | Anon | Complete password reset from emailed link | `docs/version5/hardening/surfaces/auth/evidence/har/AUTH-RESET-COMPLETE.har` | Includes `auth.updateUser`; capture that update requires a valid session and ends authenticated. |
| AUTH-RESET-INVALID-TOKEN-HAR | HAR | Anon | Attempt reset with invalid/expired token | `docs/version5/hardening/surfaces/auth/evidence/har/AUTH-RESET-INVALID-TOKEN.har` | Confirm generic failure UI (no detail leakage). |

| AUTH-OAUTH-START-HAR | HAR | Anon | Start OAuth flow (Google) | `docs/version5/hardening/surfaces/auth/evidence/har/AUTH-OAUTH-START.har` | Capture `signInWithOAuth` request. Note: app computes `redirectTo` as `window.location.origin` (not user-controlled). |
| AUTH-OAUTH-RETURN-URL-SHOT | Shot | Anon | OAuth returns to SPA root (`/`) | `docs/version5/hardening/surfaces/auth/evidence/screenshots/AUTH-OAUTH-RETURN-URL.png` | Capture URL bar showing return shape (query/hash). Confirm no access/refresh tokens are retained. If an auth `code` appears, record whether it is removed after session establishment. |
| AUTH-OAUTH-RETURN-HAR | HAR | Anon | Post-OAuth app bootstraps authenticated state | `docs/version5/hardening/surfaces/auth/evidence/har/AUTH-OAUTH-RETURN.har` | Capture first authenticated bootstrapped state after OAuth return (AuthProvider session/user setup as observable in network). |
| AUTH-OAUTH-REDIRECT-CONFIG-SHOT | Shot | Admin | Supabase Redirect URLs allow-list evidence | `docs/version5/hardening/surfaces/auth/evidence/screenshots/AUTH-OAUTH-REDIRECT-CONFIG.png` | Screenshot Supabase Dashboard Auth Redirect URLs (Site URL + additional redirect URLs). Note any wildcard use and scope. |

| AUTH-ENUMERATION-PROBE-NOTE | Note | Anon | Enumeration parity summary | `docs/version5/hardening/surfaces/auth/evidence/notes/AUTH-ENUMERATION-PROBE.md` | Summarize parity across sign-in/reset/sign-up pre-check using the captured HARs (copy/status/shape/timing), per OWASP enumeration guidance. |

| AUTH-SQL-PROFILES-POLICIES | SQL | Admin | Profiles RLS + grants (anon scope) | `docs/version5/hardening/surfaces/auth/evidence/sql/AUTH-PROFILES-POLICIES.sql` | Confirm `profiles_select_all` posture and whether anon reads are intentionally broad (risk watch). |
| AUTH-SQL-PROFILES-COLUMNS | SQL | Admin | Profiles column inventory | `docs/version5/hardening/surfaces/auth/evidence/sql/AUTH-PROFILES-COLUMNS.sql` | Record `profiles` columns to validate public-safe schema given `profiles_select_all` allows SELECT. |
| AUTH-SQL-TRIGGER-SIDE-EFFECTS | SQL | Admin | Auth user creation side-effects | `docs/version5/hardening/surfaces/auth/evidence/sql/AUTH-TRIGGER-SIDE-EFFECTS.sql` | Capture `on_auth_user_created` trigger + `handle_new_user` function + SECURITY DEFINER/search_path posture. |
| AUTH-SQL-HANDLE-NEW-USER-PRIVS | SQL | Admin | `handle_new_user` privileges | `docs/version5/hardening/surfaces/auth/evidence/sql/AUTH-HANDLE-NEW-USER-PRIVS.sql` | Capture routine privileges + `prosecdef`/`proconfig` for `public.handle_new_user`. |
| AUTH-SQL-RATE-LIMIT-POSTURE | SQL | Admin | App-level rate limit table/policy posture | `docs/version5/hardening/surfaces/auth/evidence/sql/AUTH-RATE-LIMIT-POSTURE.sql` | Inspect `rate_limits` policies + helper functions (separate from Supabase Auth server-side rate limits). |
