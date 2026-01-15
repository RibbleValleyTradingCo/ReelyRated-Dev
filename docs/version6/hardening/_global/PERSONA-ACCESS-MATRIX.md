# Persona Access Matrix (v0)

This matrix defines intended access at the DB boundary for personas. It is a living document used to validate grants/RLS/RPC posture.

## Personas
- anon
- authenticated
- owner (application persona; enforced via RLS/RPC logic)
- admin (application persona; enforced via RLS/RPC logic)
- service_role (server-only)

## How to use this matrix
- "Allowed" means the GRANT exists *and* RLS/RPC logic permits the action.
- If a surface requires an exception, document it in that surface pipeline and reference the row here.

## Tables / Views Matrix (template)

| Object | Exposure | anon | authenticated | owner | admin | service_role | RLS expectation | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| public.profiles | public-safe? | TBD | TBD | TBD | TBD | allowed | RLS enabled; owner-only updates | |
| public.notifications | private | deny | own rows only | own rows only | admin-only reads | allowed | RLS enabled; recipient-only | |
| public.venue_photos (view/table) | public-safe? | TBD | TBD | TBD | TBD | allowed | RLS enabled | |

## RPC Matrix (template)

| RPC | anon EXECUTE | authenticated EXECUTE | owner/admin logic | SECURITY DEFINER | search_path pinned | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| public.get_profile_for_profile_page(text) | deny | allow | RLS/in-function checks | invoker/definer TBD | TBD | |
| public.owner_update_venue_metadata(uuid, ...) | deny | allow | is_venue_admin_or_owner | definer | pinned | |

## Storage Matrix (template)

| Bucket | anon read | anon write | authenticated read | authenticated write | Owner scoping | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| avatars | TBD | deny | own-only | own-only | owner_id or owner | |
| catches | public URL? | deny | own-only | own-only | owner_id or owner | |

## Realtime Matrix (template)

| Publication/Table | anon | authenticated | owner/admin | RLS required | Notes |
| --- | --- | --- | --- | --- | --- |
| supabase_realtime / public.catches | TBD | TBD | TBD | yes | |
