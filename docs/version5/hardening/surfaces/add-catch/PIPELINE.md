# Add Catch — Surface Hardening Pipeline
<!-- PHASE-GATES:START -->
## Phase Gates

| Gate | Status | Evidence | Notes |
| --- | --- | --- | --- |
| Contract & personas defined | PASS | Contract section below | |
| Data entrypoints inventoried (tables/RPC/storage/realtime) | PASS | Entrypoints inventory below | |
| Anti-enumeration UX verified | PASS | `src/pages/AddCatch.tsx:701-717` | Permission errors use generic copy. |
| RLS/policies verified for surface tables | PASS | `supabase/migrations/1004_policies_and_grants.sql`, `supabase/migrations/2097_block_admin_catch_inserts.sql`, `supabase/migrations/2157_add_catch_rate_limits_definer_fix.sql` | sessions/catches RLS + storage.objects policies. |
| Grants verified (least privilege) | PASS | `supabase/migrations/2154_p0_global_grants_lockdown.sql`, `supabase/migrations/2157_add_catch_rate_limits_definer_fix.sql` | rate_limits internal; EXECUTE restricted. |
| RPC posture verified (EXECUTE + SECURITY DEFINER hygiene if used) | PASS | `supabase/migrations/2157_add_catch_rate_limits_definer_fix.sql` | enforce_catch_rate_limit/check_rate_limit definer + pinned search_path. |
| Manual UX pass (4 personas) | PARTIAL | `docs/version5/hardening/surfaces/add-catch/evidence/har/HAR_add-catch_rate-limits_YYYY-MM-DD_local_pass.har` | Normal user pass confirmed; anon/owner/admin pending. |
| SQL probe evidence captured | TODO | `docs/version5/hardening/surfaces/add-catch/evidence/sql/SQL_add-catch_rate-limits_probes_YYYY-MM-DD.txt`, `docs/version5/hardening/surfaces/add-catch/evidence/sql/SQL_add-catch_storage_policies_YYYY-MM-DD.txt` | Pending capture. |
| Result | PARTIAL | | PASS / FAIL |
<!-- PHASE-GATES:END -->

<!-- PERSONA-CONTRACT-REF:START -->
Persona contract: `docs/version5/hardening/_global/legacy/PERSONA-PERMISSIONS.md`
<!-- PERSONA-CONTRACT-REF:END -->


## Scope
- Route: `/add-catch` (RequireAuth gate in `src/App.tsx:232`)
- Page: `src/pages/AddCatch.tsx`
- Admin check helper: `src/lib/admin.ts`
- Dependencies: direct inserts to `public.sessions` + `public.catches`, storage uploads to bucket `catches`, and catch insert triggers (moderation, rate-limit, leaderboard, community stats).

## Contract (personas + allow/deny UX)

### Personas
- anon: denied; redirected to `/auth` and cannot submit the form.
- authenticated (non-owner): allowed to complete Add Catch (create session if needed, insert catch, upload photos).
- owner: same as authenticated (no owner-only behavior in this surface).
- admin: blocked by client admin guard (renders block screen; no submit path).

### Success criteria
- Authenticated user can create a session (optional) and insert a catch.
- Photo upload to the `catches` bucket succeeds and the catch references the public URL(s).
- Success ends with a toast and navigation to `/feed`.

### Deny UX expectations
- Anon: redirect to `/auth` with no partial writes.
- Admin: blocked view (no submit controls).
- Permission-denied failures surface a generic error without leaking internal table names or policy details. `src/pages/AddCatch.tsx:701-717`.

## Anti-enumeration expectations
- Denied paths use generic messaging and avoid revealing whether a venue/session exists.
- Error responses are indistinguishable across “not allowed” cases (no table names or policy IDs in UI copy).

## Evidence (post-fix)
- FAIL HAR (captured): `docs/version5/hardening/surfaces/add-catch/evidence/har/HAR_add-catch_rate-limits_2026-01-12_local_fail.har`
- PASS HAR (pending capture): `docs/version5/hardening/surfaces/add-catch/evidence/har/HAR_add-catch_rate-limits_YYYY-MM-DD_local_pass.har`
- Screenshots (pending capture): `docs/version5/hardening/surfaces/add-catch/evidence/screenshots/IMG_add-catch_rate-limits_YYYY-MM-DD_local_fail.png`, `docs/version5/hardening/surfaces/add-catch/evidence/screenshots/IMG_add-catch_rate-limits_YYYY-MM-DD_local_pass.png`
- SQL probes (pending capture): `docs/version5/hardening/surfaces/add-catch/evidence/sql/SQL_add-catch_rate-limits_probes_YYYY-MM-DD.txt`, `docs/version5/hardening/surfaces/add-catch/evidence/sql/SQL_add-catch_storage_policies_YYYY-MM-DD.txt`

## Pipeline narrative (step-by-step)
1) Route guard + auth bootstrap
   - The router wraps `/add-catch` with `RequireAuth` (auth-only surface). `src/App.tsx:232`.
   - `AddCatch` also redirects to `/auth` if no user after auth finishes loading. `src/pages/AddCatch.tsx:178`.

2) Initial state + URL prefill
   - Initializes form state, image previews, and session state. `src/pages/AddCatch.tsx:84`.
   - If a `?venue=<slug>` query param exists, it fetches the venue by slug and pre-fills the form location and new-session venue name. `src/pages/AddCatch.tsx:154`.

3) Admin guard (client)
   - Calls `isAdminUser` to determine if the user is an admin. `src/pages/AddCatch.tsx:184`.
   - If admin, renders a block screen and no form submission path. `src/pages/AddCatch.tsx:720`.
   - `isAdminUser` reads `admin_users` via PostgREST. `src/lib/admin.ts:14`.

4) Preload dropdown data (client reads)
   - Methods: load from `tags` where category = method. `src/pages/AddCatch.tsx:211`.
   - Baits: load from `baits`. `src/pages/AddCatch.tsx:252`.
   - Water types: load from `water_types`. `src/pages/AddCatch.tsx:292`.
   - Sessions: load last 20 sessions for the user from `sessions`. `src/pages/AddCatch.tsx:333`.

5) UI flow (form sections)
   - Primary sections: CatchBasicsSection + LocationSection. `src/pages/AddCatch.tsx:772` and `src/pages/AddCatch.tsx:794`.
   - Optional accordion sections: Tactics, Story, Conditions, Media, Privacy. `src/pages/AddCatch.tsx:840`.
   - Image previews use `URL.createObjectURL` and revoke on cleanup. `src/pages/AddCatch.tsx:133`.

6) Optional GPS
   - Clicking “Use GPS” triggers `navigator.geolocation.getCurrentPosition`. `src/pages/AddCatch.tsx:394`.
   - GPS coordinates are stored in local state and later written into the `conditions` payload.

7) Submit flow (validation + normalization)
   - Requires a main image file, Zod schema validation, and custom field checks for “Other” selections. `src/pages/AddCatch.tsx:435`.
   - Requires a location (manual or GPS). `src/pages/AddCatch.tsx:476`.
   - Normalizes the location and, if it is a known fishery or was prefilled, resolves `venue_id` and `venueSlug` via a venues lookup. `src/pages/AddCatch.tsx:481`.

8) Optional session creation (write before catch insert)
   - If “Create session” is selected, it inserts a new `sessions` row and selects it back, then uses that `session_id` for the catch. `src/pages/AddCatch.tsx:535`.

9) Storage uploads (before catch insert)
   - Uploads the main image to the `catches` bucket. File name pattern: `${user.id}-${Date.now()}.${ext}`. `src/pages/AddCatch.tsx:554`.
   - Retrieves a public URL for the main image. `src/pages/AddCatch.tsx:563`.
   - Uploads each gallery image to the same bucket with `${user.id}-${Date.now()}-${Math.random()}.${ext}` and collects public URLs on success. `src/pages/AddCatch.tsx:567`.
   - Gallery upload errors are ignored (no throw); only successful uploads contribute to `galleryUrls`.

10) Catch insert
   - Builds `conditions` payload (weather, water, GPS, customFields), tags array, and catch insert payload.
   - Inserts into `public.catches` via PostgREST. `src/pages/AddCatch.tsx:662`.

11) Post-submit refresh + navigation
   - Invalidates React Query caches for venue top/recent catches, venue detail, and feed. `src/pages/AddCatch.tsx:666`.
   - Updates local sessions list if a session was created and resets session form state. `src/pages/AddCatch.tsx:675`.
   - Shows success toast and navigates to `/feed`. `src/pages/AddCatch.tsx:682`.

12) Errors + retries
   - No explicit retries. `isSubmitting` disables the submit button during the request. `src/pages/AddCatch.tsx:505`.
   - Bucket errors show a specific toast. `src/pages/AddCatch.tsx:690`.
   - Moderation errors (MODERATION_BANNED / MODERATION_SUSPENDED) map to tailored messaging. `src/pages/AddCatch.tsx:693` and `src/lib/moderation-errors.ts:1`.
   - Permission errors (403/42501) are sanitized to a generic message. `src/pages/AddCatch.tsx:701-717`.

## Data entrypoints inventory (initial)

### RPCs
- None found in AddCatch surface.

### PostgREST (table operations)
| Table | Verb | File | Notes |
| --- | --- | --- | --- |
| venues | select | `src/pages/AddCatch.tsx:157` | Prefill location by `?venue` slug. |
| admin_users | select | `src/lib/admin.ts:14` | Admin check (isAdminUser). |
| tags | select | `src/pages/AddCatch.tsx:211` | Methods dropdown (`category = method`). |
| baits | select | `src/pages/AddCatch.tsx:252` | Baits dropdown. |
| water_types | select | `src/pages/AddCatch.tsx:292` | Water types dropdown. |
| sessions | select | `src/pages/AddCatch.tsx:333` | Load user sessions list. |
| venues | select | `src/pages/AddCatch.tsx:491` | Resolve `venue_id` by normalized name. |
| sessions | insert + select | `src/pages/AddCatch.tsx:535` | Optional create session before catch insert. |
| catches | insert | `src/pages/AddCatch.tsx:662` | Main catch write. |

### Storage
| Bucket | Operation | File | Notes |
| --- | --- | --- | --- |
| catches | upload | `src/pages/AddCatch.tsx:557` | Main image upload. |
| catches | getPublicUrl | `src/pages/AddCatch.tsx:563` | Public URL for main image. |
| catches | upload | `src/pages/AddCatch.tsx:572` | Gallery image upload (best-effort). |
| catches | getPublicUrl | `src/pages/AddCatch.tsx:577` | Public URL for gallery images. |

### Realtime
- None found.

### Third-party / browser APIs
- Geolocation: `navigator.geolocation.getCurrentPosition`. `src/pages/AddCatch.tsx:394`.

## Implicit DB side effects (from migrations)

### Triggers/functions on catch inserts
- `trg_enforce_catch_moderation` (BEFORE INSERT on `public.catches`) calls `public.enforce_catch_moderation` which runs `public.assert_moderation_allowed` (SECURITY DEFINER). `supabase/migrations/2045_moderation_enforcement.sql:233`.
  - Blocks banned/suspended users by raising `MODERATION_BANNED` / `MODERATION_SUSPENDED until <timestamp>`. `supabase/migrations/2045_moderation_enforcement.sql:7`.

- `enforce_catch_rate_limit_trigger` (BEFORE INSERT on `public.catches`) calls `public.enforce_catch_rate_limit`. `supabase/migrations/1003_rate_limits_and_helpers.sql:157`.
  - Uses `public.check_rate_limit` (SECURITY DEFINER) and inserts a row into `public.rate_limits` for each successful catch insert. `supabase/migrations/2112_fix_rate_limit_helpers_single_logger.sql:7`.
  - `public.enforce_catch_rate_limit()` is SECURITY DEFINER with pinned `search_path` (2157). `supabase/migrations/2157_add_catch_rate_limits_definer_fix.sql`.

- `catches_leaderboard_refresh` (AFTER INSERT/UPDATE on `public.catches`) calls `public.handle_catches_leaderboard_change` (SECURITY DEFINER), which refreshes leaderboard precompute. `supabase/migrations/2146_leaderboard_precompute.sql:143`.
  - Updates `public.catch_leaderboard_scores` and the derived `public.leaderboard_scores_detailed` view. `supabase/migrations/2146_leaderboard_precompute.sql:165`.

- `trg_community_stats_catches` (AFTER INSERT/UPDATE/DELETE on `public.catches`) calls `public.community_stats_handle_catches_change` (SECURITY DEFINER). `supabase/migrations/2137_community_stats_live.sql:251`.
  - Updates `public.community_stats_live` and `public.community_stats_waterways` counters. `supabase/migrations/2137_community_stats_live.sql:90`.

### Notifications
- No direct notification insert was found for catch inserts. Notifications appear in comment/rating RPCs, not in the catch insert path.

## Security posture notes (facts only)

### RLS vs SECURITY DEFINER
- Catches insert uses RLS policy `catches_owner_mutate` (auth.uid() = user_id AND NOT admin). `supabase/migrations/2097_block_admin_catch_inserts.sql:16`.
- Sessions select/insert uses RLS policies `sessions_select_own` and `sessions_modify_own` (auth.uid() = user_id). `supabase/migrations/1004_policies_and_grants.sql:38`.
- Storage uses `storage.objects` policies for bucket `catches` that are owner-scoped for authenticated users and do not grant public SELECT on `storage.objects`. `supabase/migrations/2157_add_catch_rate_limits_definer_fix.sql`.
- `public.enforce_catch_rate_limit()` is SECURITY DEFINER with pinned `search_path` and EXECUTE restricted to `authenticated`. `supabase/migrations/2157_add_catch_rate_limits_definer_fix.sql`.
- SECURITY DEFINER helpers triggered by catch insert: `assert_moderation_allowed`, `handle_catches_leaderboard_change`, `community_stats_handle_catches_change`, `check_rate_limit`. See references above.

### User-controlled fields in catch insert payload
- Directly derived from user form input: `title`, `description`, `location`, `bait_used`, `equipment_used`, `caught_at`, `species`, `weight`, `weight_unit`, `length`, `length_unit`, `peg_or_swim`, `water_type`, `method`, `time_of_day`, `conditions`, `tags`, `gallery_photos`, `video_url`, `visibility`, `hide_exact_spot`, `allow_ratings`. `src/pages/AddCatch.tsx:632`.
- System-derived or lookup-derived: `user_id` (auth), `image_url` (storage public URL), `venue_id` (lookup from venues), `session_id` (selected or created session). `src/pages/AddCatch.tsx:632`.

### Rate-limit / abuse controls
- Catch insert is rate-limited to 10/hour via `enforce_catch_rate_limit_trigger` and `check_rate_limit`. `supabase/migrations/1003_rate_limits_and_helpers.sql:157` and `supabase/migrations/2112_fix_rate_limit_helpers_single_logger.sql:7`.
- `enforce_catch_rate_limit` is SECURITY DEFINER with pinned `search_path` and EXECUTE restricted to `authenticated` (internal `rate_limits` remains non-client). `supabase/migrations/2157_add_catch_rate_limits_definer_fix.sql`.
- Moderation status is enforced on catch insert via `enforce_catch_moderation` / `assert_moderation_allowed`. `supabase/migrations/2045_moderation_enforcement.sql:233`.
- Storage bucket `catches` policies are owner-scoped (owner_id/owner) and deny public listing. `supabase/migrations/2157_add_catch_rate_limits_definer_fix.sql`.

## rate_limits 42501 (resolved in 2157) — Evidence Checklist

Observed issue (pre-2157): Add Catch failed with 403 `permission denied for table rate_limits` (Postgres 42501) on `POST /rest/v1/catches` after P0+P1.
Resolved in `supabase/migrations/2157_add_catch_rate_limits_definer_fix.sql`: `public.enforce_catch_rate_limit()` is SECURITY DEFINER with pinned `search_path`, schema-qualified refs, and EXECUTE restricted to `authenticated`.

### 1) HAR capture (required)
- Capture the failing network request(s):
  - `POST /rest/v1/catches` (and any preceding `POST /rest/v1/sessions`).
  - Include response body showing 403 + 42501 + `permission denied for table rate_limits`.
- Save to:
  - `docs/version5/hardening/surfaces/add-catch/evidence/HAR_add-catch_rate-limits_YYYY-MM-DD_local_fail.har`
- Screenshot the UI error/toast + network response:
  - `docs/version5/hardening/surfaces/add-catch/evidence/IMG_add-catch_rate-limits_YYYY-MM-DD_local_fail.png`

### 2) SQL probes (required)
Run these in the Supabase SQL editor and save outputs:
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

-- Triggers on catches/sessions (identify rate_limit touchpoints)
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

-- Function definitions + posture for identified helpers
select n.nspname, p.proname, p.prosecdef, p.proconfig, pg_get_functiondef(p.oid) as function_def
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('enforce_catch_rate_limit', 'check_rate_limit');

-- EXECUTE grants for helper functions
select routine_schema, routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in ('enforce_catch_rate_limit', 'check_rate_limit')
order by routine_name, grantee;
```
Save outputs to:
- `docs/version5/hardening/surfaces/add-catch/evidence/SQL_add-catch_rate-limits_probes_YYYY-MM-DD.txt`

### 3) Fix applied (post-2157)
- `public.enforce_catch_rate_limit()` is SECURITY DEFINER with `SET search_path = ''` and schema-qualified references.
- EXECUTE is revoked from `PUBLIC`/`anon` and granted to `authenticated`.
- No direct INSERT/UPDATE/DELETE grants are added for `public.rate_limits` (table remains internal).

## Test matrix (manual)

| Persona | Expected outcome | Evidence |
| --- | --- | --- |
| anon | Denied; redirect to `/auth`; no writes | HAR + screenshot |
| authenticated | Can create session (optional), insert catch, upload image | HAR + screenshots |
| owner | Same as authenticated | HAR + screenshots |
| admin | Blocked by admin guard; no submit | Screenshot |
| object-swap attempt | Insert with spoofed `user_id` or `venue_id` fails | HAR + SQL probe |

## Next actions
- Capture the PASS evidence listed above and attach to this surface’s evidence folder.
- Verify remaining personas (anon/owner/admin) and update the Phase Gates table.
- If any residual issues remain, address them with surface-scoped fixes (no global grants widening).

## Repro commands
```
rg -n "AddCatch|add catch|create catch|insert\(|upsert\(|supabase\.from\(|supabase\.rpc\(|storage\.from\(" src -S
rg -n "create_catch|add_catch|get_venue_by_slug|venues|venue_id" supabase/migrations -S
rg -n "bucket|signedUrl|upload\(" src -S
```
