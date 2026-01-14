# Surface: add-catch

## Route patterns
- `/add-catch`

## Router entry files
- `src/App.tsx`
- `src/pages/AddCatch.tsx`

## Personas
- Auth required (RequireAuth). Admins are explicitly blocked (client UI + RLS). Owners have no special behavior beyond normal authenticated users.

## Deny UX
- Anon users are redirected to `/auth` by `RequireAuth` and the page also redirects if `user` is missing after loading. `src/App.tsx:232`, `src/pages/AddCatch.tsx:178`.
- Admin users see a blocking panel (“Admins can’t create catches”) with navigation to `/feed` or admin tools. `src/pages/AddCatch.tsx:720`.

## Entrypoints

### RPCs
None found in route/feature files.

### PostgREST
| Table | Operations | File | DB posture | Notes |
| --- | --- | --- | --- | --- |
| venues | select | `src/pages/AddCatch.tsx:157` | UNKNOWN | Prefill location by `?venue=<slug>`. |
| admin_users | select | `src/lib/admin.ts:14` | RLS (commented in code) | Admin gate check. |
| tags | select | `src/pages/AddCatch.tsx:211` | UNKNOWN | Methods dropdown (`category = method`). |
| baits | select | `src/pages/AddCatch.tsx:252` | UNKNOWN | Baits dropdown. |
| water_types | select | `src/pages/AddCatch.tsx:292` | UNKNOWN | Water types dropdown. |
| sessions | select | `src/pages/AddCatch.tsx:333` | RLS: `sessions_select_own` | User session list (own rows). |
| venues | select | `src/pages/AddCatch.tsx:491` | UNKNOWN | Resolve `venue_id` by normalized name. |
| sessions | insert, select | `src/pages/AddCatch.tsx:535` | RLS: `sessions_modify_own` | Optional session creation before catch insert. |
| catches | insert | `src/pages/AddCatch.tsx:662` | RLS: `catches_owner_mutate` (non-admin) | Main catch write. |

### Storage
| Bucket | Operation | File | DB posture | Notes |
| --- | --- | --- | --- | --- |
| catches | upload | `src/pages/AddCatch.tsx:557` | storage policy `catches_authenticated_manage` | Main image upload; object key `${user.id}-${Date.now()}.${ext}`. |
| catches | getPublicUrl | `src/pages/AddCatch.tsx:563` | storage policy `catches_public_read` | Public URL for main image. |
| catches | upload | `src/pages/AddCatch.tsx:572` | storage policy `catches_authenticated_manage` | Gallery upload; object key `${user.id}-${Date.now()}-${Math.random()}.${ext}`. |
| catches | getPublicUrl | `src/pages/AddCatch.tsx:577` | storage policy `catches_public_read` | Public URL for gallery image. |

### Realtime
None found in route/feature files.

## Implicit DB side-effects
- `trg_enforce_catch_moderation` (BEFORE INSERT on `public.catches`) calls `public.enforce_catch_moderation` -> `public.assert_moderation_allowed` (SECURITY DEFINER) to block banned/suspended. `supabase/migrations/2045_moderation_enforcement.sql:233`.
- `enforce_catch_rate_limit_trigger` (BEFORE INSERT on `public.catches`) calls `public.enforce_catch_rate_limit`, which logs to `public.rate_limits` and enforces 10/hour. `supabase/migrations/1003_rate_limits_and_helpers.sql:157`.
- `catches_leaderboard_refresh` (AFTER INSERT/UPDATE on `public.catches`) calls `public.handle_catches_leaderboard_change` to refresh leaderboard precompute. `supabase/migrations/2146_leaderboard_precompute.sql:143`.
- `trg_community_stats_catches` (AFTER INSERT/UPDATE/DELETE on `public.catches`) calls `public.community_stats_handle_catches_change` to update `public.community_stats_live` and `public.community_stats_waterways`. `supabase/migrations/2137_community_stats_live.sql:251`.

## Abuse & validation controls
- Client validation: image required, Zod schema validation (`catchSchemaWithRefinements`), and conditional checks for `species = other` / `method = other`. `src/pages/AddCatch.tsx:435`.
- Client validation: location required (manual or GPS), gallery limited to 6 images. `src/pages/AddCatch.tsx:476`, `src/pages/AddCatch.tsx:364`.
- Moderation enforcement: `public.assert_moderation_allowed` invoked by `enforce_catch_moderation` trigger (SECURITY DEFINER). `supabase/migrations/2045_moderation_enforcement.sql:233`.
- Rate limit: `enforce_catch_rate_limit` trigger enforces 10 catches/hour and logs to `public.rate_limits`. `supabase/migrations/1003_rate_limits_and_helpers.sql:157`.
- Admin block: RLS policy `catches_owner_mutate` requires `NOT public.is_admin(auth.uid())`. `supabase/migrations/2097_block_admin_catch_inserts.sql:16`.
- Storage policy: bucket-scoped authenticated manage (`storage.objects`), public read for `catches` bucket. `supabase/migrations/1007_storage_and_add_catch_fixes.sql:106`.

## Consistency note (shared hooks/components)
- `isAdminUser` (`src/lib/admin.ts`) is a shared helper used across surfaces; its `admin_users` read is included above.
- React Query invalidations use shared query keys (`src/lib/queryKeys`) but do not introduce additional backend entrypoints.

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
