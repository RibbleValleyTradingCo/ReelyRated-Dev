# Surface: venue-detail

## Route patterns
- `/venues/:slug`

## Router entry files
- `src/App.tsx`
- `src/pages/VenueDetail.tsx`

## Personas
- UNKNOWN

## Deny UX
- UNKNOWN

## Entrypoints

### RPCs
| RPC | File | DB posture | Notes |
| --- | --- | --- | --- |
| get_venue_by_slug | `src/pages/venue-detail/hooks/useVenueDetailData.ts:93` | UNKNOWN |  |
| get_my_venue_rating | `src/pages/venue-detail/hooks/useVenueDetailData.ts:131` | UNKNOWN |  |
| get_venue_upcoming_events | `src/pages/venue-detail/hooks/useVenueDetailData.ts:250` | UNKNOWN |  |
| get_venue_photos | `src/pages/venue-detail/hooks/useVenueDetailData.ts:269` | UNKNOWN |  |
| get_venue_top_catches | `src/pages/venue-detail/hooks/useVenueDetailData.ts:308` | UNKNOWN |  |
| get_venue_recent_catches | `src/pages/venue-detail/hooks/useVenueDetailData.ts:353` | UNKNOWN |  |
| get_venue_past_events | `src/pages/venue-detail/hooks/useVenueDetailData.ts:389` | UNKNOWN |  |
| upsert_venue_rating | `src/pages/venue-detail/hooks/useVenueDetailData.ts:522` | UNKNOWN |  |

### PostgREST
| Table | Operations | File | DB posture | Notes |
| --- | --- | --- | --- | --- |
| venue_opening_hours | select | `src/pages/venue-detail/hooks/useVenueDetailData.ts:154` | UNKNOWN |  |
| venue_pricing_tiers | select | `src/pages/venue-detail/hooks/useVenueDetailData.ts:178` | UNKNOWN |  |
| venue_rules | select | `src/pages/venue-detail/hooks/useVenueDetailData.ts:202` | UNKNOWN |  |
| venue_species_stock | select | `src/pages/venue-detail/hooks/useVenueDetailData.ts:226` | UNKNOWN |  |
| venue_owners | select | `src/pages/venue-detail/hooks/useVenueDetailData.ts:465` | UNKNOWN |  |

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

