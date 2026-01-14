# Index Pipeline (E2E)
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
- Route: `/` (public, under `Layout`). `src/App.tsx:219`, `src/App.tsx:220`.
- Page: `src/pages/Index.tsx`.
- Auth gate: none; `useAuth` only drives CTA labels/targets. `src/pages/Index.tsx:1`, `src/pages/Index.tsx:559`.
- Admin gate: none; `isAdminUser` only toggles CTA destinations and hides add-catch promos. `src/pages/Index.tsx:549`, `src/pages/Index.tsx:560`, `src/pages/Index.tsx:167`, `src/pages/Index.tsx:641`.
- Core components/hooks: `HeroLeaderboardSpotlight`, `LeaderboardSection`, `Leaderboard`, `useLeaderboardRealtime`, `useSpeciesOptions`, `useCountUp`. `src/pages/Index.tsx:2`, `src/pages/Index.tsx:3`, `src/components/Leaderboard.tsx:33`, `src/hooks/useLeaderboardRealtime.ts:48`, `src/hooks/useSpeciesOptions.ts:43`, `src/pages/Index.tsx:12`.
- Related routes: `/auth`, `/feed`, `/add-catch`, `/leaderboard`, `/catch/:id`, `/profile/:slug`. `src/pages/Index.tsx:569`, `src/pages/Index.tsx:571`, `src/pages/Index.tsx:577`, `src/components/LeaderboardSection.tsx:33`, `src/components/Leaderboard.tsx:145`, `src/components/HeroLeaderboardSpotlight.tsx:411`.

## Surface narrative (step-by-step)
1) Route + access gate
   - `/` is not wrapped by `RequireAuth`; public access under `Layout`. `src/App.tsx:219`, `src/App.tsx:220`.
   - `useAuth` is only used to pick CTA labels/targets and admin checks (no redirect). `src/pages/Index.tsx:481`, `src/pages/Index.tsx:559`.

2) Community stats load (RPC)
   - On mount, `loadHomepageData` calls `supabase.rpc("get_community_stats")` and populates totals. `src/pages/Index.tsx:494`, `src/pages/Index.tsx:499`, `src/pages/Index.tsx:516`.
   - Failure shows "We couldn't load the latest stats. Please try again shortly." in the stats section. `src/pages/Index.tsx:524`.

3) Hero leaderboard spotlight (PostgREST reads)
   - `HeroLeaderboardSpotlight` fetches the top catch from `leaderboard_scores_detailed` (ordered by score + created_at) and stores it as `topCatch`. `src/components/HeroLeaderboardSpotlight.tsx:145`, `src/components/HeroLeaderboardSpotlight.tsx:154`.
   - If `topCatch.user_id` exists, it fetches `profiles.username` for the angler. `src/components/HeroLeaderboardSpotlight.tsx:184`, `src/components/HeroLeaderboardSpotlight.tsx:186`.
   - Refreshes every 5 minutes via `setInterval`. `src/components/HeroLeaderboardSpotlight.tsx:218`, `src/components/HeroLeaderboardSpotlight.tsx:222`.
   - Loading/error/empty states are rendered inline with copy set in the component. `src/components/HeroLeaderboardSpotlight.tsx:229`, `src/components/HeroLeaderboardSpotlight.tsx:237`, `src/components/HeroLeaderboardSpotlight.tsx:245`.
   - "View" button navigates to `/catch/:id`. `src/components/HeroLeaderboardSpotlight.tsx:428`.

4) Leaderboard section (RPC + PostgREST)
   - `LeaderboardSection` renders `Leaderboard` with `limit={6}`. `src/pages/Index.tsx:636`, `src/components/LeaderboardSection.tsx:29`.
   - `Leaderboard` uses `useLeaderboardRealtime` with `enableRealtime=false` and `refreshIntervalMs=3min`, so it polls and refreshes on tab visibility, not realtime. `src/components/Leaderboard.tsx:37`, `src/components/Leaderboard.tsx:42`, `src/hooks/useLeaderboardRealtime.ts:166`, `src/hooks/useLeaderboardRealtime.ts:173`.
   - For species filter not equal to "all", `useLeaderboardRealtime` calls RPC `get_leaderboard_scores`. `src/hooks/useLeaderboardRealtime.ts:73`.
   - For species "all", it reads `leaderboard_scores_detailed` via PostgREST with select list, block filter, ordering, and limit. `src/hooks/useLeaderboardRealtime.ts:91`, `src/hooks/useLeaderboardRealtime.ts:93`, `src/hooks/useLeaderboardRealtime.ts:95`, `src/hooks/useLeaderboardRealtime.ts:99`.
   - Species options are loaded via `get_species_options` with `onlyWithCatches=true`. `src/components/Leaderboard.tsx:45`, `src/hooks/useSpeciesOptions.ts:59`.
   - UI renders error/loading/empty states for leaderboard data. `src/components/Leaderboard.tsx:85`, `src/components/Leaderboard.tsx:91`, `src/components/Leaderboard.tsx:97`.

5) CTA/navigation actions
   - Primary CTA: `/feed` if signed in, else `/auth`. `src/pages/Index.tsx:567`, `src/pages/Index.tsx:571`.
   - Secondary CTA: `/add-catch` for signed-in non-admin, otherwise `/feed`. `src/pages/Index.tsx:575`, `src/pages/Index.tsx:580`.
   - Feature highlight links include `/add-catch` and `/feed`, but `/add-catch` is hidden for admins. `src/pages/Index.tsx:34`, `src/pages/Index.tsx:41`, `src/pages/Index.tsx:167`.
   - Leaderboard row links to `/catch/:id`; spotlight profile link uses `/profile/:slug`. `src/components/Leaderboard.tsx:145`, `src/components/HeroLeaderboardSpotlight.tsx:411`.

## Entrypoints inventory (with file:line)

### RPCs
| RPC | Args | File | Notes |
| --- | --- | --- | --- |
| get_community_stats | none | `src/pages/Index.tsx:499` | SECURITY DEFINER; reads `community_stats_live`. `supabase/migrations/2137_community_stats_live.sql:257`, `supabase/migrations/2137_community_stats_live.sql:265`. |
| get_leaderboard_scores | p_species_slug, p_limit | `src/hooks/useLeaderboardRealtime.ts:73` | SECURITY DEFINER, `search_path=''`, filters visibility + block logic; granted to anon/auth. `supabase/migrations/2151_leaderboard_rpc_fast_path_ambiguity_fix.sql:3`, `supabase/migrations/2151_leaderboard_rpc_fast_path_ambiguity_fix.sql:37`, `supabase/migrations/2151_leaderboard_rpc_fast_path_ambiguity_fix.sql:165`. |
| get_species_options | p_only_active, p_only_with_catches | `src/hooks/useSpeciesOptions.ts:59` | SECURITY DEFINER; uses `species` and `leaderboard_scores_detailed` when `p_only_with_catches=true`. `supabase/migrations/2139_species_canonical.sql:78`, `supabase/migrations/2139_species_canonical.sql:96`. |

### PostgREST
| Table/View | Operations | File | Notes |
| --- | --- | --- | --- |
| leaderboard_scores_detailed (view) | select | `src/components/HeroLeaderboardSpotlight.tsx:146` | Fetches top catch; filters `is_blocked_from_viewer=false`; ordered by score. `supabase/migrations/2148_leaderboard_species_key_index_tuning.sql:87`, `supabase/migrations/2148_leaderboard_species_key_index_tuning.sql:145`. |
| leaderboard_scores_detailed (view) | select | `src/hooks/useLeaderboardRealtime.ts:91` | Leaderboard list for "all species" view; select list + order + limit. |
| profiles | select | `src/components/HeroLeaderboardSpotlight.tsx:185` | Fetches `username` for spotlight user. |
| admin_users | select | `src/lib/admin.ts:14` | Admin check used for CTA gating only. |

### Storage
- None found.

### Realtime
- None (leaderboard hook is called with `enableRealtime=false`). `src/components/Leaderboard.tsx:41`.

### Third-party APIs
- None found.

## Implicit DB side-effects
- No writes are issued from this surface. Community stats are maintained by triggers on `public.catches` (not by this page). `supabase/migrations/2137_community_stats_live.sql:252`.

## Security posture notes (facts only)
- `/` is public; no `RequireAuth` wrapper in the router. `src/App.tsx:219`, `src/App.tsx:220`.
- `get_community_stats` is SECURITY DEFINER with pinned `search_path` and EXECUTE granted to anon/auth. `supabase/migrations/2137_community_stats_live.sql:265`, `supabase/migrations/2137_community_stats_live.sql:266`, `supabase/migrations/2137_community_stats_live.sql:273`.
- `get_leaderboard_scores` is SECURITY DEFINER with `search_path=''` and applies block/visibility filtering in SQL. `supabase/migrations/2151_leaderboard_rpc_fast_path_ambiguity_fix.sql:37`, `supabase/migrations/2151_leaderboard_rpc_fast_path_ambiguity_fix.sql:85`.
- `leaderboard_scores_detailed` is a view granted to anon/auth and includes block logic via `auth.uid()`. Verify view security posture (owner/reloptions) during sweep. `supabase/migrations/2148_leaderboard_species_key_index_tuning.sql:87`, `supabase/migrations/2148_leaderboard_species_key_index_tuning.sql:134`, `supabase/migrations/2148_leaderboard_species_key_index_tuning.sql:145`.
- PostgREST reads for `profiles` and `admin_users` rely on RLS/policies; admin checks are UX-only (CTA gating). `src/components/HeroLeaderboardSpotlight.tsx:185`, `src/lib/admin.ts:14`.

## SQL queries to run during sweep
```
-- Grants for touched tables/views
select *
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'community_stats_live',
    'leaderboard_scores_detailed',
    'catch_leaderboard_scores',
    'catches',
    'profiles',
    'catch_rating_stats',
    'admin_users',
    'species'
  );

-- RLS policies for touched tables/views (views may not have policies; still confirm)
select *
from pg_policies
where schemaname = 'public'
  and tablename in (
    'community_stats_live',
    'leaderboard_scores_detailed',
    'catch_leaderboard_scores',
    'catches',
    'profiles',
    'catch_rating_stats',
    'admin_users',
    'species'
  );

-- View security posture (owner/reloptions)
select c.relname, c.relkind, c.relowner::regrole, c.reloptions
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('leaderboard_scores_detailed');

-- RPC posture
select proname, pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in ('get_community_stats','get_leaderboard_scores','get_species_options');

select *
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in ('get_community_stats','get_leaderboard_scores','get_species_options');

select proname, prosecdef, proconfig
from pg_proc
join pg_namespace n on n.oid = pronamespace
where n.nspname = 'public'
  and proname in ('get_community_stats','get_leaderboard_scores','get_species_options');
```

## Open verification items
- Confirm view security posture for `leaderboard_scores_detailed` (owner/reloptions) and that it does not bypass RLS unexpectedly. How to verify: run the view security posture query above.
- Confirm `profiles` policy allows only intended fields for public username lookup (this surface selects only `username`). How to verify: inspect `pg_policies` + test anon select with a minimal column list.

## Repro commands used
```
rg --files -g 'Index.tsx' src/pages
rg -n "<Route|createBrowserRouter|path=" src/App.tsx -S
rg -n "HeroLeaderboardSpotlight|LeaderboardSection" src -S
rg -n "get_community_stats" supabase/migrations -S
rg -n "get_leaderboard_scores" supabase/migrations -S
rg -n "get_species_options" supabase/migrations -S
rg -n "leaderboard_scores_detailed" supabase/migrations -S
rg -n "supabase\\.rpc\\(|supabase\\.from\\(|storage\\.from\\(|channel\\(|postgres_changes" src/pages/Index.tsx src/components/HeroLeaderboardSpotlight.tsx src/components/Leaderboard.tsx src/hooks/useLeaderboardRealtime.ts src/hooks/useSpeciesOptions.ts -S
rg -n "\\.from\\(" src/pages/Index.tsx src/components/HeroLeaderboardSpotlight.tsx src/hooks/useLeaderboardRealtime.ts -S
rg -n "isAdminUser" src -S
```
