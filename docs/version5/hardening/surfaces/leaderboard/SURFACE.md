# Surface: leaderboard

## Route patterns
- `/leaderboard`

## Router entry files
- `src/App.tsx`
- `src/pages/LeaderboardPage.tsx`

## Personas
- UNKNOWN

## Deny UX
- UNKNOWN

## Entrypoints

### RPCs
| RPC | File | DB posture | Notes |
| --- | --- | --- | --- |
| get_leaderboard_scores | `src/hooks/useLeaderboardRealtime.ts:73` | UNKNOWN |  |

### PostgREST
| Table | Operations | File | DB posture | Notes |
| --- | --- | --- | --- | --- |
| leaderboard_scores_detailed | select | `src/hooks/useLeaderboardRealtime.ts:90` | UNKNOWN |  |

### Storage
None found in route/feature files.

### Realtime
| Channel | File | DB posture | Notes |
| --- | --- | --- | --- |
| leaderboard_catches_realtime | `src/hooks/useLeaderboardRealtime.ts:130` | UNKNOWN |  |

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

