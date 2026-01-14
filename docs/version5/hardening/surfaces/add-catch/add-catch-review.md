# Add Catch Surface Review (Plan-Only)

Status: REVIEW + PLAN ONLY (no changes performed)

## Summary
- Entrypoints: direct PostgREST reads (venues/tags/baits/water_types/sessions), direct writes (sessions/catches), storage uploads to `catches`; no RPCs or realtime.
- Root cause candidates for `rate_limits` 42501: `enforce_catch_rate_limit()` trigger writes `public.rate_limits` as SECURITY INVOKER; P0/P1 revoked table privileges for client roles, so the trigger INSERT fails.
- Storage posture: object keys are user-prefixed but not path-scoped; policies must enforce bucket + owner constraints.
- Error-hygiene posture: current UI likely surfaces raw PostgREST error messages and should be normalized to generic user copy.
- Proposed remediation: keep `rate_limits` internal; fix via SECURITY DEFINER boundary with pinned `search_path` or move Add Catch behind an RPC. Do not widen global grants.

---

## A) Code paths + entrypoints table

### Route + component
- Route: `/add-catch` (RequireAuth in `src/App.tsx:233`)
- Page: `src/pages/AddCatch.tsx`
- Admin gate: `src/lib/admin.ts` (used in `src/pages/AddCatch.tsx`)

### Entrypoints
| Type | Operation | Object | Evidence |
| --- | --- | --- | --- |
| PostgREST read | select | `public.venues` (prefill by slug, resolve venue_id) | `src/pages/AddCatch.tsx:155-166`, `src/pages/AddCatch.tsx:485-498` |
| PostgREST read | select | `public.tags` | `src/pages/AddCatch.tsx:199-214` |
| PostgREST read | select | `public.baits` | `src/pages/AddCatch.tsx:240-255` |
| PostgREST read | select | `public.water_types` | `src/pages/AddCatch.tsx:283-296` |
| PostgREST read | select | `public.sessions` | `src/pages/AddCatch.tsx:323-339` |
| PostgREST write | insert + select | `public.sessions` | `src/pages/AddCatch.tsx:526-556` |
| PostgREST write | insert | `public.catches` | `src/pages/AddCatch.tsx:653-666` |
| Storage | upload + getPublicUrl | `catches` bucket | `src/pages/AddCatch.tsx:548-585` |
| Realtime | none | — | no `channel(` or `postgres_changes` usage in Add Catch |

### Persona expectations (per entrypoint)
- anon: denied by RequireAuth (no reads/writes).
- authenticated: allowed for own rows; can insert sessions and catches; can upload images to `catches`.
- owner: same as authenticated.
- admin: blocked by UI; DB also blocks catch insert via RLS (`catches_owner_mutate`).

---

## B) DB trigger/function chain (rate_limits path)

### Trigger chain
- Trigger: `enforce_catch_rate_limit_trigger` on `public.catches` (BEFORE INSERT).
  - Migration: `supabase/migrations/1003_rate_limits_and_helpers.sql:157-162`
- Function: `public.enforce_catch_rate_limit()`
  - Writes: `INSERT INTO public.rate_limits (user_id, action, created_at)`
  - Migration: `supabase/migrations/1003_rate_limits_and_helpers.sql:110-125`
  - Updated single-logger behavior: `supabase/migrations/2112_fix_rate_limit_helpers_single_logger.sql:33-47`
  - SECURITY DEFINER: **No** (SECURITY INVOKER)
- Helper: `public.check_rate_limit(...)`
  - Reads: `public.rate_limits`
  - SECURITY DEFINER: **Yes**
  - Migration: `supabase/migrations/1003_rate_limits_and_helpers.sql:15-37`

### Rate limits policies / grants context
- RLS enabled on `public.rate_limits`.
- P0 revokes all table privileges on `public.rate_limits` for PUBLIC/anon/authenticated:
  - `supabase/migrations/2154_p0_global_grants_lockdown.sql:13-23`
- RLS policies:
  - Admin-only SELECT: `supabase/migrations/2089_lockdown_rate_limits.sql`
  - Self-insert policy for authenticated: `supabase/migrations/2114_rate_limits_rls_insert_fix.sql` (but INSERT privilege removed by P0).

### Hypothesis (why 42501 happens now)
- `enforce_catch_rate_limit()` is SECURITY INVOKER; it runs as the authenticated client role.
- P0/P1 removed INSERT on `public.rate_limits`, so the trigger fails on INSERT with 42501.
- `check_rate_limit` is SECURITY DEFINER (read-only) and should still succeed; the write is the failure point.

---

## C) Minimal evidence checklist (local-first)

### HAR
- Fail (current):  
  `docs/version5/hardening/surfaces/add-catch/evidence/har/HAR_add-catch_rate-limits_YYYY-MM-DD_local_fail.har`
- Pass (after fix):  
  `docs/version5/hardening/surfaces/add-catch/evidence/har/HAR_add-catch_rate-limits_YYYY-MM-DD_local_pass.har`
- Screenshot:  
  `docs/version5/hardening/surfaces/add-catch/evidence/screenshots/IMG_add-catch_rate-limits_YYYY-MM-DD_local_fail.png`

### SQL probes (save in `docs/version5/hardening/surfaces/add-catch/evidence/sql/`)
```
-- Grants on rate_limits for PUBLIC/anon/authenticated
select grantee, privilege_type
from information_schema.table_privileges
where table_schema = 'public'
  and table_name = 'rate_limits'
  and grantee in ('PUBLIC', 'anon', 'authenticated')
order by grantee, privilege_type;

-- RLS posture for rate_limits
select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity, c.relforcerowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'rate_limits';

-- Policies for rate_limits
select * from pg_policies
where schemaname = 'public' and tablename = 'rate_limits';

-- Triggers on catches/sessions
select
  c.relname as table_name,
  t.tgname as trigger_name,
  p.proname as function_name,
  pg_get_triggerdef(t.oid) as trigger_def
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
where n.nspname = 'public'
  and c.relname in ('catches', 'sessions')
  and not t.tgisinternal
order by c.relname, t.tgname;

-- Function definitions + posture
select n.nspname, p.proname, p.prosecdef, p.proconfig, pg_get_functiondef(p.oid) as function_def
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('enforce_catch_rate_limit', 'check_rate_limit');

-- EXECUTE grants for helpers
select routine_schema, routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in ('enforce_catch_rate_limit', 'check_rate_limit')
order by routine_name, grantee;
```
Save output to:  
`docs/version5/hardening/surfaces/add-catch/evidence/sql/SQL_add-catch_rate-limits_probes_YYYY-MM-DD.txt`

---

## D) Remediation plan (least privilege, no code yet)

### Preferred fix shape
- Keep `public.rate_limits` internal (no direct INSERT/UPDATE/DELETE grants for PUBLIC/anon/authenticated).
- Fix the trigger boundary:
  - Make `public.enforce_catch_rate_limit()` SECURITY DEFINER, or
  - Wrap the INSERT into a SECURITY DEFINER helper and call it from the trigger.
- Pin `search_path` (prefer `search_path = ''`) and schema-qualify all object references.

### Explicitly do NOT do
- Do not grant authenticated INSERT/UPDATE/DELETE on `public.rate_limits`.
- Do not disable RLS or add broad client policies on `rate_limits`.
- Do not widen global grants to make this surface pass.

### Expected implementation files (future pass)
- One new migration file in `supabase/migrations/` adjusting `enforce_catch_rate_limit` posture.
- Possibly no app code changes if the trigger fix is sufficient.

---

## E) Error-hygiene plan (anti-leakage)

### Current user-facing error path (from code)
- `src/pages/AddCatch.tsx` surfaces `error.message` directly when not a known bucket/moderation error.
- This can expose raw PostgREST messages (e.g., “permission denied for table rate_limits”) to end users.

### Plan (no code yet)
- Use generic UI copy for permission errors (403/42501) and other sensitive failures.
- Keep raw technical details only in structured logs (`logger.error`) or local dev console, not user UI.
- Ensure user-facing errors do not mention internal table names, functions, or schema details.

---

## F) Storage policy confirmation plan (catches bucket)

### Object key pattern (from code)
- Main image: `${user.id}-${Date.now()}.${ext}`
- Gallery images: `${user.id}-${Date.now()}-${Math.random()}.${ext}`

### Policy listing queries (save under `evidence/sql/`)
```
-- Storage policies (bucket = catches)
select
  pol.polname as policyname,
  pol.polcmd,
  pol.polroles::regrole[] as roles,
  pg_get_expr(pol.polqual, pol.polrelid) as qual,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check
from pg_policy pol
join pg_class c on c.oid = pol.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'storage'
  and c.relname = 'objects'
order by pol.polname;

-- Bucket spot-check
select id, bucket_id, name, owner, created_at
from storage.objects
where bucket_id = 'catches'
limit 5;
```
Save as:  
`docs/version5/hardening/surfaces/add-catch/evidence/sql/SQL_add-catch_storage_policies_YYYY-MM-DD.txt`

### Minimal storage evidence
- One anon upload attempt (expected fail).
- One authenticated upload attempt (expected pass).
- Policy listing output (above) proving bucket/owner constraints.

---

## Notes
- This review is evidence-driven and local-first. Use the evidence checklist above before proposing any migration.
- Align with `docs/version5/hardening/_global/legacy/PERSONA-PERMISSIONS.md` for persona expectations.
