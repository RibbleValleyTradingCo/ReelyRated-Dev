# Test Run Reference – Vitest / pnpm

This document is a quick reference for how to run the automated tests in this repo, and _when_ to run them during development.

The test stack is:

- **Vitest** for unit/integration tests
- **pnpm** as the package manager

---

## 1. Core commands

### 1.1 Run the full test suite

From the project root:

```bash
pnpm test
```

This runs:

```json
"test": "vitest --run"
```

It will execute all `*.test.ts` / `*.test.tsx` files under `src/**` and `tests/**` (except anything explicitly skipped).

You’ll see a summary at the end, for example:

```text
Test Files  2 failed | 9 passed (11)
     Tests  110 passed (110)
```

**Goal for serious changes:** 0 failed suites.

---

### 1.2 Run a single test file

When working on a specific area, it’s useful to run just one file:

```bash
pnpm test -- src/lib/__tests__/rls-catches.test.ts
pnpm test -- src/lib/__tests__/rate-limit-db.test.ts
pnpm test -- src/components/__tests__/NotificationsBell.test.tsx
```

Vitest will only run that file and report its results.

---

## 2. Environment required for DB/RLS tests

Some database tests (especially **rate limits** and **storage RLS**) expect a running Supabase instance and certain env vars.

When running against **local Docker Supabase**, set:

```bash
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=sb_secret_... \
VITE_SUPABASE_URL=http://127.0.0.1:54321 \
pnpm test
```

Notes:

- `SUPABASE_URL` / `VITE_SUPABASE_URL` should match the local Supabase URL (usually `http://127.0.0.1:54321`).
- `SUPABASE_SERVICE_ROLE_KEY` is taken from the local project’s service role key.
- The **service role key** is used only in tests that need an admin client to inspect internal tables (e.g. `rate_limits`) under RLS.

If these are missing, `rate-limit-db.test.ts` may log warnings or throw `adminSupabase not configured` errors.

---

## 3. What the different suites cover

High level view of the current suites:

- `src/lib/__tests__/rls-*.test.ts`  
  RLS behaviour for:

  - catches
  - profiles
  - storage buckets
  - admin_users
  - general security

- `src/lib/__tests__/rate-limit-db.test.ts`  
  Database-level rate limiting:

  - `check_rate_limit()`
  - `get_rate_limit_status()`
  - `user_rate_limits()`
  - `cleanup_rate_limits()`
  - RLS on the `rate_limits` table itself.

- `src/hooks/__tests__/useRateLimit.test.ts`  
  Frontend hook tests for the rate limit UX.

- `src/lib/__tests__/admin-routes.test.tsx`  
  Checks admin-only routes and redirects.

- `src/lib/__tests__/notifications*.test.ts[x]`  
  Notifications querying and small helpers.

These are fast and good indicators that migrations/RLS/app wiring haven’t regressed.

---

## 4. When to run tests in the dev flow

Use this as a simple checklist.

### 4.1 After **schema or RLS changes** (migrations)

**Run:**

```bash
pnpm test
```

Why:

- `rls-*` tests catch broken policies (e.g. public data leaks or overly strict rules).
- `rate-limit-db` tests catch mismatches between migrations and rate limit functions.

If failures appear:

- Fix the underlying migration or policy, or
- Temporarily `describe.skip` a test **with a clear TODO** if you are intentionally changing behaviour and will revisit.

### 4.2 Before merging a feature branch

**Run at least:**

```bash
pnpm test
```

You want:

- 0 failing suites.
- Any skipped tests (`it.skip` / `describe.skip`) to be intentional and documented in the test file.

### 4.3 After major auth / session changes

**Run:**

- `AUTH-FLOWS.md` manual checklist (UI-level)
- Automated tests touching auth and RLS:

```bash
pnpm test -- src/lib/__tests__/rls-profiles.test.ts
pnpm test -- src/lib/__tests__/rls-catches.test.ts
```

This gives quick feedback that sign-in/out and basic RLS still behave as expected.

### 4.4 Before cutting a “production candidate”

Do a **full** run:

```bash
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=sb_secret_... \
VITE_SUPABASE_URL=http://127.0.0.1:54321 \
pnpm test
```

- Confirm all DB/RLS tests pass against the same schema that will be deployed.
- This pairs nicely with manual checks from `test-plan.md` and feature-specific docs like `AUTH-FLOWS.md` and `SHELL-NAV.md`.

---

## 5. Interpreting common messages

### 5.1 GoTrue multiple client warning

```text
Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided...
```

- This is a **warning**, not a failure.
- It appears when tests create more than one Supabase auth client with the same storage key.
- OK to ignore unless you’re actively working on auth client wiring.

### 5.2 React Router “future flag” warnings

```text
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in React.startTransition in v7...
```

- Also **warnings**, not failures.
- They’re reminders that some behaviour will change in React Router v7.
- We can address them when we do a router upgrade.

### 5.3 Storage errors: `StorageUnknownError: fetch failed`

If you see something like:

```text
StorageUnknownError {
  "message": "fetch failed",
  "originalError": {
    "code": "ENOTFOUND",
    "hostname": "test.supabase.co"
  }
}
```

This usually means:

- The storage tests are trying to hit a Supabase URL that doesn’t exist or isn’t running.
- Check `SUPABASE_URL` / `VITE_SUPABASE_URL` and ensure local Supabase is up (`supabase start`).

---

## 6. Parking or fixing tests

If a test is failing because you’re **intentionally changing behaviour**, you have two options:

1. **Update the test** to match the new behaviour.
2. **Temporarily skip** it:
   ```ts
   describe.skip("Rate Limiting Database Functions", () => {
     // TODO: Re-enable once new rate-limit behaviour is finalised.
   });
   ```

If you skip, always leave a clear `TODO` comment with context.

---

## 7. Quick checklist before push/merge

Before pushing or opening a PR for anything non-trivial:

- [ ] `pnpm test` passes (or any failures are known and documented).
- [ ] Schema/RLS changes have been applied to local Supabase (`supabase db reset` or `supabase db push` depending on workflow).
- [ ] If rate limiting or storage was touched, tests in:

  - `src/lib/__tests__/rate-limit-db.test.ts`
  - `src/hooks/__tests__/useRateLimit.test.ts`
  - `src/lib/__tests__/rls-storage.test.ts`

  are passing or intentionally skipped with notes.

This gives a repeatable baseline so future you doesn’t have to re-remember the test incantations.

---

_Last updated: 2025-12-04_
