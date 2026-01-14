# Surface: sessions

## Route patterns
- `/sessions`

## Router entry files
- `src/App.tsx`
- `src/pages/Sessions.tsx`

## Personas
- Auth required; role restrictions UNKNOWN

## Deny UX
- Redirect to /auth (RequireAuth)

## Entrypoints

### RPCs
None found in route/feature files.

### PostgREST
| Table | Operations | File | DB posture | Notes |
| --- | --- | --- | --- | --- |
| sessions | select | `src/pages/Sessions.tsx:43` | UNKNOWN |  |

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

