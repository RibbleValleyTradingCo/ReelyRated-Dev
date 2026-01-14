# Surface: catch-detail

## Route patterns
- `/catch/:id`

## Router entry files
- `src/App.tsx`
- `src/pages/CatchDetail.tsx`

## Personas
- Auth required; role restrictions UNKNOWN

## Deny UX
- Redirect to /auth (RequireAuth)

## Entrypoints

### RPCs
| RPC | File | DB posture | Notes |
| --- | --- | --- | --- |
| get_catch_rating_summary | `src/pages/catch-detail/hooks/useCatchDetailData.ts:100` | UNKNOWN |  |

### PostgREST
| Table | Operations | File | DB posture | Notes |
| --- | --- | --- | --- | --- |
| catches | select | `src/pages/catch-detail/hooks/useCatchDetailData.ts:54` | UNKNOWN |  |
| catch_reactions | select | `src/pages/catch-detail/hooks/useCatchDetailData.ts:134` | UNKNOWN |  |
| profile_follows | select | `src/pages/catch-detail/hooks/useCatchDetailData.ts:159` | UNKNOWN |  |

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

