# Feed Pipeline (E2E)
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
- Route: `/feed` (RequireAuth). `src/App.tsx:224`, `src/App.tsx:58`.
- Page: `src/pages/Feed.tsx`.
- Query params: `?venue=<slug>` and `?session=<uuid>` read from URL. `src/pages/Feed.tsx:30`, `src/pages/Feed.tsx:35`.
- Core hooks/components: `useFeedData` (data), `useSpeciesOptions` (filters), `FeedFilters`, `CatchCard`. `src/pages/Feed.tsx:13`, `src/pages/Feed.tsx:16`, `src/pages/Feed.tsx:145`, `src/components/feed/CatchCard.tsx:78`.
- Related routes: `/auth` (auth redirect), `/add-catch` (CTA), `/catch/:id` (card navigation), `/venues/:slug` (venue link). `src/pages/Feed.tsx:66`, `src/pages/Feed.tsx:107`, `src/components/feed/CatchCard.tsx:82`, `src/components/feed/CatchCard.tsx:163`.
- Admin UI state uses `isAdminUser` to hide CTA/empty action. `src/pages/feed/useFeedData.ts:143`, `src/pages/Feed.tsx:102`, `src/pages/Feed.tsx:203`, `src/lib/admin.ts:14`.

## Surface narrative (step-by-step)
1) Route + access gate
   - Route is wrapped by `RequireAuth`; unauthenticated users are redirected to `/auth`. `src/App.tsx:58`, `src/App.tsx:224`.
   - Feed also performs a local redirect if `!loading && !user` (defense-in-depth UI gate). `src/pages/Feed.tsx:65`.

2) Filter and query state initialization
   - Default filter state: `speciesFilter="all"`, `sortBy="newest"`, `customSpeciesFilter=""`, `feedScope="all"`. `src/pages/Feed.tsx:31`, `src/pages/Feed.tsx:32`, `src/pages/Feed.tsx:33`, `src/pages/Feed.tsx:34`.
   - `useSpeciesOptions` loads species options with `includeOther=true` (RPC-backed, fallback to static list on error). `src/pages/Feed.tsx:36`, `src/hooks/useSpeciesOptions.ts:59`, `src/hooks/useSpeciesOptions.ts:66`.

3) Venue filter resolution
   - When `?venue=` is present, `useFeedData` loads `venues` by slug; sets `venueFilter` or `venueFilterError`. `src/pages/feed/useFeedData.ts:111`.
   - If the venue is missing, the UI shows "We couldn't find this venue" and offers "Clear filter". `src/pages/Feed.tsx:126`.

4) Feed fetch (RPC)
   - `useFeedData` enables the feed query only once `userId` is present and the venue filter (if any) resolves. `src/pages/feed/useFeedData.ts:182`.
   - `useFeedData` calls `get_feed_catches` via `useInfiniteQuery` with `limit=18`, `offset`, `scope`, `sort`, `species/custom`, `venue_id`, `session_id`. `src/pages/feed/useFeedData.ts:9`, `src/pages/feed/useFeedData.ts:189`.
   - RPC errors show a toast ("Failed to load catches" or "Unable to load more catches") and return an empty page. `src/pages/feed/useFeedData.ts:200`.

5) Render states
   - While auth or feed is loading, the page shows a spinner with "Loading your feed" text. `src/pages/Feed.tsx:162`.
   - On success, it renders a grid of `CatchCard` items. `src/pages/Feed.tsx:164`.

6) Pagination and session filtering
   - Pagination is disabled when `?session=` is present; otherwise `getNextPageParam` advances by page size (18). `src/pages/feed/useFeedData.ts:9`, `src/pages/feed/useFeedData.ts:216`.
   - "Load more catches" button appears only when not busy, no `session` filter, and `hasMore` is true. `src/pages/Feed.tsx:176`.

7) Empty state and CTA
   - When no results remain after filters, `EmptyState` shows a scope-specific message and offers "Log Your First Catch" for non-admin users. `src/pages/Feed.tsx:191`, `src/pages/Feed.tsx:203`.

8) Navigation actions
   - "Log a catch" CTA navigates to `/add-catch` (hidden for admins). `src/pages/Feed.tsx:102`, `src/pages/Feed.tsx:107`.
   - `CatchCard` click navigates to `/catch/:id`; venue link navigates to `/venues/:slug`. `src/components/feed/CatchCard.tsx:82`, `src/components/feed/CatchCard.tsx:163`.
   - Location labels are hidden client-side when `hide_exact_spot` is true and viewer is not the owner. `src/components/feed/CatchCard.tsx:173`, `src/lib/visibility.ts:28`.

## Entrypoints inventory (with file:line)

### RPCs
| RPC | Args | File | Notes |
| --- | --- | --- | --- |
| get_feed_catches | p_limit, p_offset, p_scope, p_sort, p_species, p_custom_species, p_venue_id, p_session_id | `src/pages/feed/useFeedData.ts:189` | SECURITY INVOKER; GPS redaction when `hide_exact_spot` for non-owner/non-admin; clamps limit to 100. `supabase/migrations/2135_redact_feed_conditions_gps.sql:39`, `supabase/migrations/2135_redact_feed_conditions_gps.sql:43`, `supabase/migrations/2135_redact_feed_conditions_gps.sql:102`. |
| get_species_options | p_only_active, p_only_with_catches | `src/hooks/useSpeciesOptions.ts:59` | SECURITY DEFINER; uses `species` and (if `p_only_with_catches`) `leaderboard_scores_detailed`. Feed passes `p_only_with_catches=false`. `src/hooks/useSpeciesOptions.ts:43`, `supabase/migrations/2139_species_canonical.sql:78`, `supabase/migrations/2139_species_canonical.sql:96`. |

### PostgREST
| Table | Operations | File | Notes |
| --- | --- | --- | --- |
| venues | select | `src/pages/feed/useFeedData.ts:111` | Resolve `?venue=<slug>` to id/name/slug for filtering and display. |
| admin_users | select | `src/lib/admin.ts:14` | Admin check used to hide CTA/empty-state action; UX only. |

### Storage
- None found.

### Realtime
- None found.

### Third-party APIs
- None found.

## Implicit DB side-effects
- No writes are issued from this surface. No triggers/functions are invoked by client writes.

## Security posture notes (facts only)
- Route is guarded by `RequireAuth` and redirects to `/auth` if no session. `src/App.tsx:58`, `src/App.tsx:67`.
- `get_feed_catches` is SECURITY INVOKER with pinned `search_path`; RLS on underlying tables governs visibility. `supabase/migrations/2135_redact_feed_conditions_gps.sql:39`, `supabase/migrations/2135_redact_feed_conditions_gps.sql:40`.
- GPS is redacted server-side for `hide_exact_spot` catches when viewer is not owner or admin. `supabase/migrations/2135_redact_feed_conditions_gps.sql:102`.
- `get_feed_catches` enforces server-side paging with `LEAST(p_limit, 100)` and non-negative offset. `supabase/migrations/2135_redact_feed_conditions_gps.sql:43`.
- URL-derived filters (`?venue`, `?session`) are passed as `p_venue_id` and `p_session_id`; ensure RLS and function logic prevent overexposure. `src/pages/Feed.tsx:30`, `src/pages/feed/useFeedData.ts:189`.
- `get_species_options` is SECURITY DEFINER with pinned `search_path` and is granted to anon/auth. `supabase/migrations/2139_species_canonical.sql:78`, `supabase/migrations/2139_species_canonical.sql:105`.
- Admin status lookup is a PostgREST select on `admin_users` and is not a security boundary; it only toggles CTA visibility. `src/lib/admin.ts:14`, `src/pages/Feed.tsx:107`, `src/pages/Feed.tsx:203`.

## SQL queries to run during sweep
```
-- Grants for touched tables/views
select *
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'catches','ratings','catch_comments','catch_reactions',
    'profiles','profile_follows','venues','admin_users',
    'species','leaderboard_scores_detailed'
  );

-- RLS policies for touched tables
select *
from pg_policies
where schemaname = 'public'
  and tablename in (
    'catches','ratings','catch_comments','catch_reactions',
    'profiles','profile_follows','venues','admin_users','species'
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
  and proname in ('get_feed_catches','get_species_options');

select *
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in ('get_feed_catches','get_species_options');

select proname, prosecdef, proconfig
from pg_proc
join pg_namespace n on n.oid = pronamespace
where n.nspname = 'public'
  and proname in ('get_feed_catches','get_species_options');
```

## Open verification items
- Confirm view security posture for `leaderboard_scores_detailed` (owner/reloptions) and that it does not bypass RLS in any future use of `p_only_with_catches=true`. How to verify: run the view security posture query above and check view owner role + reloptions.

## Repro commands used
```
rg -n "Feed" src/pages src/hooks src/components -S
rg -n "get_feed_catches" supabase/migrations -S
rg -n "get_species_options" supabase/migrations -S
rg -n "leaderboard_scores_detailed" supabase/migrations -S
rg -n "RequireAuth" src -S
rg -n "<Route|createBrowserRouter|path=" src/App.tsx -S
rg -n "supabase\\.rpc\\(|supabase\\.from\\(" src/pages/Feed.tsx src/pages/feed/useFeedData.ts src/hooks/useSpeciesOptions.ts -S
```
