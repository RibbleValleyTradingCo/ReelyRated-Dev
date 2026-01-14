# Search Pipeline (E2E)
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
- Route: `/search` (auth required). `src/App.tsx:312-318`.
- Page: `src/pages/Search.tsx` (SearchPage).
- Data helpers: `searchAll` in `src/lib/search.ts`; visibility helpers `canViewCatch` / `shouldShowExactLocation` in `src/lib/visibility.ts`.
- Auth gate: `RequireAuth` redirects unauthenticated users to `/auth`. `src/App.tsx:58-69`.
- Deleted account gate: `DeletedAccountGate` checks `profiles.is_deleted` and signs out + redirects to `/account-deleted`. `src/components/Layout.tsx:9-16`, `src/components/DeletedAccountGate.tsx:49-67`.
- Related surfaces / handoffs: `/profile/:slug` (via `getProfilePath`), `/catch/:id`, `/venues/:slug`. `src/pages/Search.tsx:223-227`, `src/pages/Search.tsx:275-278`, `src/pages/Search.tsx:305-309`, `src/lib/profile.ts:1-10`.

## Surface narrative (step-by-step)
1) Route + access gate
   - `RequireAuth` shows `RouteSkeleton` while loading, then redirects unauthenticated users to `/auth` with `state.from`. `src/App.tsx:58-69`.
   - `DeletedAccountGate` runs inside the layout and queries `profiles.is_deleted`. If `true`, it calls `supabase.auth.signOut()` and navigates to `/account-deleted`. `src/components/DeletedAccountGate.tsx:49-67`.

2) Initial load
   - The page reads the `q` search param and mirrors it into local state. `src/pages/Search.tsx:31-37`, `src/pages/Search.tsx:75-77`.
   - If a user is present, it loads the viewer's follow list from `profile_follows` (select `following_id`) to drive client-side visibility filtering. `src/pages/Search.tsx:46-68`.
   - If `q` is empty, the page clears results and exits early without querying. `src/pages/Search.tsx:90-99`.

3) Search execution
   - On `q` changes, `searchAll` runs with limits and viewer context (viewerId + followingIds). `src/pages/Search.tsx:101-110`.
   - `searchAll` issues three PostgREST reads in parallel:
     - `profiles` (username/bio match),
     - `catches` (title/location/species match, joins profile),
     - `catches` (location-only search for venue list). `src/lib/search.ts:97-143`.
   - Results are filtered client-side using `canViewCatch` and `shouldShowExactLocation` to avoid showing private/follower-only catches or hidden locations to the wrong viewer. `src/lib/search.ts:161-170`, `src/lib/search.ts:188-196`, `src/lib/visibility.ts:5-25`, `src/lib/visibility.ts:28-35`.
   - Errors are aggregated and displayed as "Some results may be incomplete." `src/pages/Search.tsx:116-122`, `src/pages/Search.tsx:196-202`.

4) User actions / flows
   - Submit search: updates `q` query param; empty query clears it. `src/pages/Search.tsx:140-148`.
   - Clear search: resets query and `q`. `src/pages/Search.tsx:150-153`.
   - Escape key: navigates back one entry in history. `src/pages/Search.tsx:79-87`.
   - Clicking results navigates to the profile, catch, or venue detail route. `src/pages/Search.tsx:223-227`, `src/pages/Search.tsx:275-278`, `src/pages/Search.tsx:305-309`.

5) Loading / empty states
   - While searching, the UI shows a loader ("Searching the water..."). `src/pages/Search.tsx:206-213`.
   - No results: shows "No results for ...". `src/pages/Search.tsx:323-334`.
   - No query: shows "Start exploring". `src/pages/Search.tsx:337-348`.

## Entrypoints inventory (with file:line)

### RPCs
- None observed.

### PostgREST
| Table | Operations | File | Notes |
| --- | --- | --- | --- |
| profile_follows | select `following_id` | `src/pages/Search.tsx:56-59` | Used to build `followingIds` for client visibility filtering. |
| profiles | select `id, username, avatar_path, avatar_url, bio` with `or` on username/bio | `src/lib/search.ts:97-101` | Uses `ilike` on user-supplied search pattern. |
| catches | select `id, title, species, location, visibility, user_id, hide_exact_spot, conditions` + `profiles:user_id` join | `src/lib/search.ts:119-136` | Ordered by `created_at` desc; limited. |
| catches | select `location, hide_exact_spot, visibility, user_id` (venue list) | `src/lib/search.ts:138-143` | Deduped into venue list after client visibility checks. |

### Storage
- None. Avatar URLs are resolved via public URL helpers only. `src/pages/Search.tsx:231-235`, `src/lib/storage.ts:52-53`.

### Realtime
- None.

### Third-party APIs
- None.

## Implicit DB side-effects
- None (read-only surface).

## Security posture notes (facts only)
- `/search` is auth-only via `RequireAuth` (redirects to `/auth` when no user). `src/App.tsx:58-69`, `src/App.tsx:312-318`.
- `DeletedAccountGate` signs out and redirects deleted accounts based on `profiles.is_deleted`. `src/components/DeletedAccountGate.tsx:49-67`.
- All search requests use PostgREST reads; server-side RLS on `profiles`, `catches`, and `profile_follows` must enforce privacy. Client filters (`canViewCatch`, `shouldShowExactLocation`) are UX-only. `src/lib/search.ts:161-170`, `src/lib/visibility.ts:5-35`.
- Search input is sanitized by replacing single quotes with doubled quotes before building `ilike`/`or` filters. `src/lib/search.ts:70-71`.
- Venue results are derived from `catches.location`; client hides exact locations when `hide_exact_spot` is true. `src/lib/search.ts:191-196`, `src/lib/visibility.ts:28-35`.

## SQL queries to run during sweep
```
-- Grants for touched tables
select *
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('profiles', 'catches', 'profile_follows');

-- RLS policies for touched tables
select *
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'catches', 'profile_follows');
```

## Open verification items
- Confirm RLS on `profiles` permits only the intended fields for search (username/avatar/bio) and does not expose private data.
- Confirm RLS on `catches` prevents private/follower-only catches (and hidden locations) from being returned to unauthorized viewers.
- Confirm `profile_follows` RLS allows a viewer to read only their own follow edges.

## Repro commands used
```
cat docs/version5/hardening/surfaces/search/PIPELINE.md
nl -ba src/App.tsx | sed -n '300,340p'
rg -n "SearchPage|Search" src/App.tsx -n
rg -n "SearchPage|/search" src -S
nl -ba src/pages/Search.tsx
nl -ba src/lib/search.ts
nl -ba src/lib/visibility.ts
nl -ba src/lib/profile.ts
```
