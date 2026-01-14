# Leaderboard Pipeline (E2E)
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
- Route: `/leaderboard` (public, under `Layout`). `src/App.tsx:219`, `src/App.tsx:231`.
- Page: `src/pages/LeaderboardPage.tsx`.
- Auth gate: none (no RequireAuth wrapper on this route). `src/App.tsx:231`.
- Admin gate: none.
- Core components/hooks: `useLeaderboardRealtime`, `formatLeaderboardSpeciesLabel`, `getProfilePath`. `src/pages/LeaderboardPage.tsx:8`, `src/pages/LeaderboardPage.tsx:9`, `src/pages/LeaderboardPage.tsx:10`, `src/pages/LeaderboardPage.tsx:43`, `src/pages/LeaderboardPage.tsx:61`, `src/pages/LeaderboardPage.tsx:154`.
- Related routes: `/profile/:slug` (profile link). `src/pages/LeaderboardPage.tsx:154`, `src/App.tsx:248`.

## Surface narrative (step-by-step)
1) Route + access gate
   - `/leaderboard` is public and not wrapped by `RequireAuth`. `src/App.tsx:231`.

2) Initial load (polling only)
   - `useLeaderboardRealtime` is called with `selectedSpecies=null`, `limit=100`, `enableRealtime=false`, and `refreshIntervalMs=120000`. `src/pages/LeaderboardPage.tsx:43`, `src/pages/LeaderboardPage.tsx:44`, `src/pages/LeaderboardPage.tsx:45`.
   - The hook performs an initial fetch on mount. `src/hooks/useLeaderboardRealtime.ts:122`, `src/hooks/useLeaderboardRealtime.ts:123`.
   - With `selectedSpecies=null`, the hook reads from `leaderboard_scores_detailed` via PostgREST (select list, block filter, ordering, limit). `src/hooks/useLeaderboardRealtime.ts:90`, `src/hooks/useLeaderboardRealtime.ts:93`, `src/hooks/useLeaderboardRealtime.ts:95`, `src/hooks/useLeaderboardRealtime.ts:99`.

3) Polling behavior
   - Because realtime is disabled, the hook uses a timer and refreshes on tab visibility with the provided interval. `src/hooks/useLeaderboardRealtime.ts:166`, `src/hooks/useLeaderboardRealtime.ts:173`, `src/pages/LeaderboardPage.tsx:45`.

4) Row shaping and rendering
   - Results are mapped into ranked rows (rank, title, species label, weights/length, location, method, score). `src/pages/LeaderboardPage.tsx:48`, `src/pages/LeaderboardPage.tsx:61`, `src/pages/LeaderboardPage.tsx:62`, `src/pages/LeaderboardPage.tsx:63`, `src/pages/LeaderboardPage.tsx:66`.

5) Error/empty/loading states
   - Error state renders a banner with the error message from the hook. `src/pages/LeaderboardPage.tsx:92`, `src/pages/LeaderboardPage.tsx:95`.
   - Loading state shows a loading card. `src/pages/LeaderboardPage.tsx:100`, `src/pages/LeaderboardPage.tsx:102`.
   - Empty state message renders when there are zero rows. `src/pages/LeaderboardPage.tsx:173`, `src/pages/LeaderboardPage.tsx:174`.

6) Navigation actions
   - When a row has `owner_username` and `user_id`, the username links to `/profile/:slug` via `getProfilePath`. `src/pages/LeaderboardPage.tsx:152`, `src/pages/LeaderboardPage.tsx:154`, `src/lib/profile.ts:1`.

## Entrypoints inventory (with file:line)

### RPCs
| RPC | Args | File | Notes |
| --- | --- | --- | --- |
| get_leaderboard_scores | p_species_slug, p_limit | `src/hooks/useLeaderboardRealtime.ts:73` | RPC branch exists in the shared hook but is not used by this page because `selectedSpecies` is `null`. `src/pages/LeaderboardPage.tsx:43`. SECURITY DEFINER, `search_path=''`, EXECUTE granted to anon/auth. `supabase/migrations/2151_leaderboard_rpc_fast_path_ambiguity_fix.sql:3`, `supabase/migrations/2151_leaderboard_rpc_fast_path_ambiguity_fix.sql:37`, `supabase/migrations/2151_leaderboard_rpc_fast_path_ambiguity_fix.sql:165`. |

### PostgREST
| Table/View | Operations | File | Notes |
| --- | --- | --- | --- |
| leaderboard_scores_detailed (view) | select | `src/hooks/useLeaderboardRealtime.ts:91` | Reads ranked public catches; filters `is_blocked_from_viewer=false`; ordered by score and created_at; limited to 100. `supabase/migrations/2148_leaderboard_species_key_index_tuning.sql:87`, `supabase/migrations/2148_leaderboard_species_key_index_tuning.sql:145`. |

### Storage
- None found.

### Realtime
- None (realtime is disabled for this page). `src/pages/LeaderboardPage.tsx:44`, `src/hooks/useLeaderboardRealtime.ts:126`.

### Third-party APIs
- None found.

## Implicit DB side-effects
- No writes are issued from this surface. All operations are read-only.

## Security posture notes (facts only)
- `/leaderboard` is public; there is no RequireAuth wrapper. `src/App.tsx:231`.
- PostgREST reads filter `leaderboard_scores_detailed` to `is_blocked_from_viewer=false` in the client query. `src/hooks/useLeaderboardRealtime.ts:95`.
- The view computes `is_blocked_from_viewer` using `auth.uid()` and block checks; for anon it resolves to false. `supabase/migrations/2148_leaderboard_species_key_index_tuning.sql:134`, `supabase/migrations/2148_leaderboard_species_key_index_tuning.sql:136`.
- `get_leaderboard_scores` is SECURITY DEFINER with `search_path=''` and includes block filtering logic; not used on this page today. `supabase/migrations/2151_leaderboard_rpc_fast_path_ambiguity_fix.sql:37`, `supabase/migrations/2151_leaderboard_rpc_fast_path_ambiguity_fix.sql:85`.
- `leaderboard_scores_detailed` is granted to anon/auth; confirm view security posture (owner/reloptions) during sweep. `supabase/migrations/2148_leaderboard_species_key_index_tuning.sql:87`, `supabase/migrations/2148_leaderboard_species_key_index_tuning.sql:145`.

## SQL queries to run during sweep
```
-- Grants for touched tables/views
select *
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'leaderboard_scores_detailed',
    'catch_leaderboard_scores',
    'catches',
    'profiles',
    'catch_rating_stats'
  );

-- RLS policies for touched tables/views (views may not have policies; still confirm)
select *
from pg_policies
where schemaname = 'public'
  and tablename in (
    'leaderboard_scores_detailed',
    'catch_leaderboard_scores',
    'catches',
    'profiles',
    'catch_rating_stats'
  );

-- View security posture (owner/reloptions)
select c.relname, c.relkind, c.relowner::regrole, c.reloptions
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('leaderboard_scores_detailed');

-- RPC posture (shared hook path; not used by this page today)
select proname, pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in ('get_leaderboard_scores');

select *
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in ('get_leaderboard_scores');

select proname, prosecdef, proconfig
from pg_proc
join pg_namespace n on n.oid = pronamespace
where n.nspname = 'public'
  and proname in ('get_leaderboard_scores');
```

## Open verification items
- Confirm view security posture for `leaderboard_scores_detailed` (owner/reloptions) and that it does not bypass RLS unexpectedly. How to verify: run the view security posture query above.
- Confirm PostgREST access to `leaderboard_scores_detailed` does not expose fields outside intended scope (compare select list in `useLeaderboardRealtime`). How to verify: run an anon select of the view with a minimal column list and compare to UI fields.

## Repro commands used
```
rg --files -g 'Leaderboard*.tsx' src/pages
rg -n "<Route|createBrowserRouter|path=" src/App.tsx -S
rg -n "LeaderboardPage|leaderboard" src/pages src/components src/hooks -S
rg -n "supabase\\.rpc\\(|supabase\\.from\\(|storage\\.from\\(|channel\\(|postgres_changes|realtime" src/pages/LeaderboardPage.tsx src/hooks/useLeaderboardRealtime.ts -S
rg -n "get_leaderboard_scores" supabase/migrations -S
rg -n "leaderboard_scores_detailed" supabase/migrations -S
```
