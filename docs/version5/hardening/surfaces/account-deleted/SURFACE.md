# Surface: account-deleted

## Route patterns

- `/account-deleted`

## Router entry files

- `src/App.tsx`
- `src/pages/AccountDeleted.tsx`

## Personas

- UNKNOWN

## Deny UX

- UNKNOWN

## Entrypoints

### RPCs

None found in route/feature files.

### PostgREST

None found in route/feature files.

### Storage

None found in route/feature files.

### Realtime

None found in route/feature files.

## Test checklist

- Persona sweeps: Anon / Auth / Owner / Admin
- Expected allow/deny outcomes documented
- Evidence to capture: HAR + SQL + screenshots

## Decisions/Exceptions

- TBD

## Discovery methods

- Route discovery: `src/App.tsx` (createBrowserRouter / <Route>)
- Entrypoint discovery commands:
  - `rg -n "supabase\.rpc\(" src -S`
  - `rg -n "supabase\.from\(" src -S`
  - `rg -n "storage\.from\(" src -S`
  - `rg -n "channel\(|realtime" src -S`
  - `rg -n "<Route|createBrowserRouter|path=" src -S`

# Surface: account-deleted

## Purpose

A static confirmation / information page shown after a user completes an account deletion flow.

**Security intent:** this page must not disclose whether a particular account exists, was deleted, or any user-identifying details. It should be safe to load directly (deep link) by any visitor.

## Route patterns

- `/account-deleted`

## Router entry files

- `src/App.tsx`
- `src/pages/AccountDeleted.tsx`

## Related flows

- Likely reached from an authenticated **account deletion request** / **account deletion completion** flow.
- Likely reachable by deep link (bookmarks, browser history) after the user has been signed out.

## Personas and contract

| Persona          | Allow?   | Expected UX                                                            | Notes                                    |
| ---------------- | -------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| Anon             | ✅ Allow | Show generic “account deleted / request received” confirmation content | Page should not require a session.       |
| Auth (non-admin) | ✅ Allow | Same as anon                                                           | Do **not** display private profile data. |
| Owner            | ✅ Allow | Same as anon                                                           | Same behavior.                           |
| Admin            | ✅ Allow | Same as anon                                                           | No admin-only data.                      |

## Deny UX / anti-enumeration

- **No deny** expected (page should be universally accessible).
- Content must remain **generic**:
  - No username/email
  - No “we deleted account X”
  - No different messaging based on whether an account existed

## Identifiers and IDOR hooks

- None expected (no `:id`, `:slug`, or sensitive query parameters).
- If query params exist in practice (e.g. `?reason=`), treat them as **display-only** and never as authorization inputs.

## Entrypoints

This surface should be **read-only** and ideally **data-plane silent**.

### RPCs

- None expected.

### PostgREST (tables/views)

- None expected.

### Storage

- None expected.

### Realtime

- None expected.

### Auth/session side effects

- If the deletion flow signs the user out, the sign-out should occur **before** redirecting here.
- This page must not attempt privileged reads using stale session state.

## Security expectations (what must be true)

- Visiting `/account-deleted` must not trigger any reads of user/profile/catch data.
- Page must not reveal whether a given email/username exists.
- Page must not leak tokens, user ids, or PII in the DOM, network calls, or error messages.

## Test checklist (sweep-ready)

### A) Network / data-plane

- [ ] As **anon**, load `/account-deleted` and capture HAR.
  - Expect: **no** `rest/v1/*` calls, **no** `rpc/*` calls.
  - Acceptable: static asset loads only.
- [ ] As **authenticated** (use `oneill467348`), load `/account-deleted` and capture HAR.
  - Expect: same as anon.

### B) Content / privacy

- [ ] Confirm the page contains no user identifiers (username/email/user_id).
- [ ] Confirm the page does not echo query parameters into the UI unsafely.

### C) Navigation / session correctness

- [ ] If accessed immediately after account deletion, confirm the user is signed out (no authenticated UI state).
- [ ] Attempt to navigate back to a previously authenticated page; confirm normal auth guards apply.

### D) Regression checks

- [ ] Confirm no console errors that include tokens or PII.
- [ ] Confirm page works on refresh / direct deep link.

## Evidence to capture

- HAR (anon + authenticated)
- Screenshot of page content (anon)
- Optional: console log screenshot if errors occur

## Decisions/Exceptions

- None.

## Followups

- If any data calls are observed in HAR, add them to the Entrypoints section and re-classify this surface (it should remain data-plane silent).

## Discovery methods

- Route discovery: `src/App.tsx` (createBrowserRouter / <Route>)
- Entrypoint discovery commands:
  - `rg -n "AccountDeleted" src -S`
  - `rg -n "supabase\.rpc\(" src -S`
  - `rg -n "supabase\.from\(" src -S`
  - `rg -n "storage\.from\(" src -S`
  - `rg -n "channel\(|realtime" src -S`
  - `rg -n "<Route|createBrowserRouter|path=" src -S`
