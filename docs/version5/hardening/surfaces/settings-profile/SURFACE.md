# Surface: settings-profile

## Route patterns
- `/settings/profile`

## Router entry files
- `src/App.tsx`
- `src/pages/ProfileSettings.tsx`

## Personas
- Auth required; role restrictions UNKNOWN

## Deny UX
- Redirect to /auth (RequireAuth)

## Entrypoints

### RPCs
| RPC | File | DB posture | Notes |
| --- | --- | --- | --- |
| request_account_export | `src/pages/ProfileSettings.tsx:289` | UNKNOWN |  |
| request_account_deletion | `src/pages/ProfileSettings.tsx:346` | UNKNOWN |  |
| unblock_profile | `src/pages/ProfileSettings.tsx:374` | UNKNOWN |  |

### PostgREST
| Table | Operations | File | DB posture | Notes |
| --- | --- | --- | --- | --- |
| profiles | select | `src/pages/ProfileSettings.tsx:142` | UNKNOWN |  |
| profiles | update | `src/pages/ProfileSettings.tsx:195` | UNKNOWN |  |
| profiles | update | `src/pages/ProfileSettings.tsx:320` | UNKNOWN |  |
| profile_blocks | select | `src/pages/ProfileSettings.tsx:397` | UNKNOWN |  |

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

