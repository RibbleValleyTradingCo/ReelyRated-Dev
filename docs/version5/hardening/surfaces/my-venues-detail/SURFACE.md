# Surface: my-venues-detail

## Route patterns
- `/my/venues/:slug`

## Router entry files
- `src/App.tsx`
- `src/pages/MyVenueEdit.tsx`

## Pipeline
- `docs/version5/hardening/surfaces/my-venues-detail/PIPELINE.md`

## Personas
- Anon: denied (redirect to `/auth`).
- Authenticated (non-owner): denied (Access denied card; no data rendered).
- Owner: allowed.
- Admin: allowed (server-side owner/admin checks in RPCs).

## Deny UX
- Anon → redirect to `/auth` (RequireAuth).
- Authenticated non-owner → "Access denied" card with back link; no data rendered.
- Anti-enumeration: deny responses must be generic and must not confirm venue existence.

## Entrypoints

### RPCs
| RPC | File | DB posture | Notes |
| --- | --- | --- | --- |
| owner_get_venue_by_slug | `src/pages/MyVenueEdit.tsx:400` | SECURITY DEFINER | Owner/admin check in SQL (see pipeline). |
| owner_get_venue_events | `src/pages/MyVenueEdit.tsx:495` | SECURITY DEFINER | Owner/admin check in SQL (see pipeline). |
| owner_update_venue_metadata | `src/pages/MyVenueEdit.tsx:631` | SECURITY DEFINER | Owner/admin check in SQL (see pipeline). |
| owner_update_venue_event | `src/pages/MyVenueEdit.tsx:739` | SECURITY DEFINER | Owner/admin check in SQL (see pipeline). |
| owner_create_venue_event | `src/pages/MyVenueEdit.tsx:758` | SECURITY DEFINER | Owner/admin check in SQL (see pipeline). |
| owner_delete_venue_event | `src/pages/MyVenueEdit.tsx:797` | SECURITY DEFINER | Owner/admin check in SQL (see pipeline). |
| get_venue_photos | `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:70` | UNKNOWN | Verify in pipeline; may be owner/admin gated. |
| <dynamic> | `src/pages/my-venues/components/RulesCard.tsx:93` | UNKNOWN | TO DISCOVER: resolve runtime RPC name via Discovery methods below; then add to probe pack allowlist checks. |
| <dynamic> | `src/pages/venue-owner-admin/components/BookingCard.tsx:40` | UNKNOWN | TO DISCOVER: resolve runtime RPC name via Discovery methods below; then add to probe pack allowlist checks. |
| <dynamic> | `src/pages/venue-owner-admin/components/OpeningHoursCard.tsx:475` | UNKNOWN | TO DISCOVER: resolve runtime RPC name via Discovery methods below; then add to probe pack allowlist checks. |
| <dynamic> | `src/pages/venue-owner-admin/components/OpeningHoursCard.tsx:504` | UNKNOWN | TO DISCOVER: resolve runtime RPC name via Discovery methods below; then add to probe pack allowlist checks. |
| <dynamic> | `src/pages/venue-owner-admin/components/OpeningHoursCard.tsx:543` | UNKNOWN | TO DISCOVER: resolve runtime RPC name via Discovery methods below; then add to probe pack allowlist checks. |
| <dynamic> | `src/pages/venue-owner-admin/components/PricingTiersCard.tsx:318` | UNKNOWN | TO DISCOVER: resolve runtime RPC name via Discovery methods below; then add to probe pack allowlist checks. |
| <dynamic> | `src/pages/venue-owner-admin/components/PricingTiersCard.tsx:333` | UNKNOWN | TO DISCOVER: resolve runtime RPC name via Discovery methods below; then add to probe pack allowlist checks. |
| <dynamic> | `src/pages/venue-owner-admin/components/PricingTiersCard.tsx:352` | UNKNOWN | TO DISCOVER: resolve runtime RPC name via Discovery methods below; then add to probe pack allowlist checks. |
| <dynamic> | `src/pages/venue-owner-admin/components/SpeciesStockCard.tsx:318` | UNKNOWN | TO DISCOVER: resolve runtime RPC name via Discovery methods below; then add to probe pack allowlist checks. |
| <dynamic> | `src/pages/venue-owner-admin/components/SpeciesStockCard.tsx:333` | UNKNOWN | TO DISCOVER: resolve runtime RPC name via Discovery methods below; then add to probe pack allowlist checks. |
| <dynamic> | `src/pages/venue-owner-admin/components/SpeciesStockCard.tsx:352` | UNKNOWN | TO DISCOVER: resolve runtime RPC name via Discovery methods below; then add to probe pack allowlist checks. |
| <dynamic> | `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:187` | UNKNOWN | TO DISCOVER: resolve runtime RPC name via Discovery methods below; then add to probe pack allowlist checks. |
| <dynamic> | `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:240` | UNKNOWN | TO DISCOVER: resolve runtime RPC name via Discovery methods below; then add to probe pack allowlist checks. |
| <dynamic> | `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:265` | UNKNOWN | TO DISCOVER: resolve runtime RPC name via Discovery methods below; then add to probe pack allowlist checks. |

### PostgREST
| Table | Operations | File | DB posture | Notes |
| --- | --- | --- | --- | --- |
| venue_rules | select | `src/pages/my-venues/components/RulesCard.tsx:48` | UNKNOWN |  |
| venue_opening_hours | select | `src/pages/venue-owner-admin/components/OpeningHoursCard.tsx:183` | UNKNOWN |  |
| venue_pricing_tiers | select | `src/pages/venue-owner-admin/components/PricingTiersCard.tsx:104` | UNKNOWN |  |
| venue_species_stock | select | `src/pages/venue-owner-admin/components/SpeciesStockCard.tsx:100` | UNKNOWN |  |

### Storage
- TO VERIFY: `VenuePhotosCard` likely uses bucket `venue-photos`; confirm storage operations + bucket policy scope. `src/pages/MyVenueEdit.tsx:39`.

### Evidence outputs
- `docs/version5/hardening/surfaces/my-venues-detail/evidence/`

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
