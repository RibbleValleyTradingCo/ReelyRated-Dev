# Surface: venues

## Route patterns
- `/venues`

## Router entry files
- `src/App.tsx`
- `src/pages/VenuesIndex.tsx`

## Personas
- UNKNOWN

## Deny UX
- UNKNOWN

## Entrypoints

### RPCs
| RPC | File | DB posture | Notes |
| --- | --- | --- | --- |
| get_venues | `src/pages/VenuesIndex.tsx:90` | UNKNOWN |  |
| get_venue_photos | `src/pages/VenuesIndex.tsx:138` | UNKNOWN |  |
| get_venue_recent_catches | `src/pages/VenuesIndex.tsx:153` | UNKNOWN |  |

### PostgREST
None found in route/feature files.

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

