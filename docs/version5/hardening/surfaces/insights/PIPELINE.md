# Insights Pipeline (E2E)
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
- Route: `/insights` (RequireAuth, under `Layout`). `src/App.tsx:219`, `src/App.tsx:320`, `src/App.tsx:323`.
- Page: `src/pages/Insights.tsx`.
- Auth gate: `RequireAuth` plus local redirect if `!user` once auth loading completes. `src/App.tsx:320`, `src/pages/Insights.tsx:126`.
- Admin gate: none (no admin-only logic).
- Core components/hooks: `TrendLineChart`, `StatsCards`, `FiltersPanel`, `InfoCards`, `ChartCard`, `useInsightsChartData`, `useInsightsFilters`. `src/pages/Insights.tsx:11`, `src/pages/Insights.tsx:12`, `src/pages/Insights.tsx:13`, `src/pages/Insights.tsx:14`, `src/pages/Insights.tsx:15`, `src/pages/Insights.tsx:27`, `src/pages/Insights.tsx:28`.
- Related routes: `/auth` (redirect), `/add-catch` (empty state CTA). `src/pages/Insights.tsx:128`, `src/pages/Insights.tsx:703`.

## Surface narrative (step-by-step)
1) Route + access gate
   - `/insights` is wrapped by `RequireAuth`. `src/App.tsx:320`, `src/App.tsx:323`.
   - The page also redirects to `/auth` if auth loading completes and no user is present. `src/pages/Insights.tsx:126`, `src/pages/Insights.tsx:128`.

2) Initial load (sessions + aggregates)
   - Sessions list is fetched with PostgREST from `sessions` for the signed-in user, ordered by date and created_at. `src/pages/Insights.tsx:132`, `src/pages/Insights.tsx:138`, `src/pages/Insights.tsx:141`, `src/pages/Insights.tsx:142`, `src/pages/Insights.tsx:143`.
   - Aggregates are fetched via RPC `get_insights_aggregates` when `aggregationMode="server"` and user is present; query key includes date/session/venue filters. `src/pages/Insights.tsx:191`, `src/pages/Insights.tsx:201`, `src/pages/Insights.tsx:203`.
   - If the aggregates RPC errors, the page falls back to client aggregation and shows a notice. `src/pages/Insights.tsx:232`, `src/pages/Insights.tsx:234`, `src/pages/Insights.tsx:235`.

3) Client fallback path
   - When in client mode, the page fetches `catches` for the user and stores a local list used for chart/filter calculations. `src/pages/Insights.tsx:162`, `src/pages/Insights.tsx:167`, `src/pages/Insights.tsx:172`.
   - The fallback fetch runs once after switching to client aggregation. `src/pages/Insights.tsx:186`, `src/pages/Insights.tsx:188`.

4) Filters, panels, and derived charts
   - Filter changes update query key inputs (`datePreset`, custom range, session, venue), which re-runs the aggregates RPC when in server mode. `src/pages/Insights.tsx:193`, `src/pages/Insights.tsx:199`, `src/pages/Insights.tsx:203`.
   - Client-side filters run through `useInsightsFilters` and `useInsightsChartData` to compute chart data. `src/pages/Insights.tsx:336`, `src/pages/Insights.tsx:360`.
   - Panel toggles switch between "trends", "species", "venues", and "sessions" views (no new data fetch). `src/pages/Insights.tsx:590`, `src/pages/Insights.tsx:718`.

5) UI states and actions
   - Loading state shows a skeleton page until auth + data loads complete. `src/pages/Insights.tsx:600`, `src/pages/Insights.tsx:604`.
   - Error state renders `ErrorStateCard` when catch fetch fails. `src/pages/Insights.tsx:176`, `src/pages/Insights.tsx:622`.
   - Empty insights state shows a CTA to log a catch and navigates to `/add-catch`. `src/pages/Insights.tsx:693`, `src/pages/Insights.tsx:702`, `src/pages/Insights.tsx:703`.

## Entrypoints inventory (with file:line)

### RPCs
| RPC | Args | File | Notes |
| --- | --- | --- | --- |
| get_insights_aggregates | p_date_preset, p_custom_start, p_custom_end, p_selected_session_id, p_selected_venue | `src/pages/Insights.tsx:203` | SECURITY DEFINER; raises if `auth.uid()` is null; uses `catches` and `species` for aggregation. `supabase/migrations/2144_fix_insights_aggregates_pb_weight_unit_cast.sql:3`, `supabase/migrations/2144_fix_insights_aggregates_pb_weight_unit_cast.sql:33`, `supabase/migrations/2144_fix_insights_aggregates_pb_weight_unit_cast.sql:39`. |

### PostgREST
| Table | Operations | File | Notes |
| --- | --- | --- | --- |
| sessions | select | `src/pages/Insights.tsx:138` | Fields: `id, title, venue, date, created_at`; filtered by `user_id`. |
| catches | select | `src/pages/Insights.tsx:167` | Fields: `id, created_at, caught_at, weight, weight_unit, location, bait_used, method, time_of_day, conditions, session_id, species`; filtered by `user_id`. |

### Storage
- None found.

### Realtime
- None found.

### Third-party APIs
- None found.

## Implicit DB side-effects
- No writes are issued from this surface. All operations are read-only.

## Security posture notes (facts only)
- `/insights` requires auth in the router and performs a local redirect to `/auth` when unauthenticated. `src/App.tsx:320`, `src/pages/Insights.tsx:126`.
- `get_insights_aggregates` is SECURITY DEFINER with pinned `search_path`; it reads `auth.uid()` and raises "Not authenticated" when null. `supabase/migrations/2144_fix_insights_aggregates_pb_weight_unit_cast.sql:33`, `supabase/migrations/2144_fix_insights_aggregates_pb_weight_unit_cast.sql:34`, `supabase/migrations/2144_fix_insights_aggregates_pb_weight_unit_cast.sql:39`.
- RPC EXECUTE is granted to `authenticated` only. `supabase/migrations/2144_fix_insights_aggregates_pb_weight_unit_cast.sql:291`, `supabase/migrations/2144_fix_insights_aggregates_pb_weight_unit_cast.sql:292`.
- Client fallback reads `catches` and `sessions` directly by `user_id`; RLS must enforce isolation if client-supplied filters are modified. `src/pages/Insights.tsx:172`, `src/pages/Insights.tsx:141`.
- Filters are passed as parameters into the RPC, but the function scopes to `auth.uid()` before applying filters. `supabase/migrations/2144_fix_insights_aggregates_pb_weight_unit_cast.sql:37`, `supabase/migrations/2144_fix_insights_aggregates_pb_weight_unit_cast.sql:47`.

## SQL queries to run during sweep
```
-- Grants for touched tables/views
select *
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'catches',
    'sessions',
    'species'
  );

-- RLS policies for touched tables
select *
from pg_policies
where schemaname = 'public'
  and tablename in (
    'catches',
    'sessions',
    'species'
  );

-- RPC posture
select proname, pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in ('get_insights_aggregates');

select *
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in ('get_insights_aggregates');

select proname, prosecdef, proconfig
from pg_proc
join pg_namespace n on n.oid = pronamespace
where n.nspname = 'public'
  and proname in ('get_insights_aggregates');
```

## Open verification items
- Confirm RLS policies on `sessions` and `catches` enforce per-user isolation for the PostgREST fallback path. How to verify: run the policy query above and test anon/auth selects with user_id filters.
- Confirm `get_insights_aggregates` only returns rows for `auth.uid()` and cannot be coerced to return another user's data. How to verify: attempt RPC calls as two users with different filters and compare results.

## Repro commands used
```
rg -n "<Route|createBrowserRouter|path=" src/App.tsx -S
rg -n "Insights|insights" src/pages src/components src/hooks -S
rg -n "supabase\\.rpc\\(|supabase\\.from\\(|storage\\.from\\(|channel\\(|postgres_changes|realtime" src/pages/Insights.tsx src/lib src/hooks src/components/insights -S
rg -n "get_insights_aggregates" supabase/migrations -S
```
