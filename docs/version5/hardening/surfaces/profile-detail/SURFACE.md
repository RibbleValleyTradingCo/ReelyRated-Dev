# Surface: profile-detail

## Route patterns
- `/profile/:slug/*`

## Router entry files
- `src/App.tsx`
- `src/pages/Profile.tsx`

## Personas
- Auth required; role restrictions UNKNOWN

## Deny UX
- Redirect to /auth (RequireAuth)

## Entrypoints

### RPCs
| RPC | File | DB posture | Notes |
| --- | --- | --- | --- |
| get_profile_for_profile_page | `src/pages/profile/hooks/useProfileData.ts:41` | UNKNOWN |  |
| get_follower_count | `src/pages/profile/hooks/useProfileData.ts:71` | UNKNOWN |  |
| follow_profile_with_rate_limit | `src/pages/profile/hooks/useProfileData.ts:250` | UNKNOWN |  |
| block_profile | `src/pages/profile/hooks/useProfileData.ts:281` | UNKNOWN |  |
| unblock_profile | `src/pages/profile/hooks/useProfileData.ts:288` | UNKNOWN |  |

### PostgREST
| Table | Operations | File | DB posture | Notes |
| --- | --- | --- | --- | --- |
| profile_follows | select | `src/pages/profile/hooks/useProfileData.ts:90` | UNKNOWN |  |
| catches | select | `src/pages/profile/hooks/useProfileData.ts:128` | UNKNOWN |  |
| profile_follows | select | `src/pages/profile/hooks/useProfileData.ts:172` | UNKNOWN |  |
| profile_blocks | select | `src/pages/profile/hooks/useProfileData.ts:200` | UNKNOWN |  |
| profile_follows | delete | `src/pages/profile/hooks/useProfileData.ts:240` | UNKNOWN |  |
| profiles | update | `src/pages/profile/hooks/useProfileData.ts:265` | UNKNOWN |  |

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

