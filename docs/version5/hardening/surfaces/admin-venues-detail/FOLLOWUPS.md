# Followups

- [ ] **RPC posture inventory (all functions):** capture `pg_get_functiondef`, `prosecdef`, `proconfig` (search_path), and `proacl` for **each** RPC used by this surface:
  - `admin_get_venue_by_slug`, `admin_get_venue_events`, `admin_update_venue_metadata`
  - `admin_add_venue_owner`, `admin_remove_venue_owner`
  - `admin_create_venue_event`, `admin_update_venue_event`, `admin_delete_venue_event`
  - `admin_update_venue_booking`
  - `admin_update_venue_rules`
  - `admin_create_venue_opening_hour`, `admin_update_venue_opening_hour`, `admin_delete_venue_opening_hour`
  - `admin_create_venue_pricing_tier`, `admin_update_venue_pricing_tier`, `admin_delete_venue_pricing_tier`
  - `admin_create_venue_species_stock`, `admin_update_venue_species_stock`, `admin_delete_venue_species_stock`
  - `get_venue_photos` (SECURITY INVOKER)
  - `admin_add_venue_photo`, `admin_delete_venue_photo`, `admin_set_venue_photo_primary`
- [ ] **SECURITY DEFINER hardening:** for every `admin_*` function, verify:
  - admin check is enforced server-side
  - all object references are schema-qualified
  - `search_path` is pinned (prefer `SET search_path = ''` if feasible)
- [ ] **SECURITY INVOKER check:** confirm `get_venue_photos` succeeds only via **RLS/grants** on `public.venue_photos` (no definer privilege assumptions).
- [ ] **Non-admin execution denial:** prove non-admins cannot execute each admin RPC (even if EXECUTE is granted to `authenticated`) — capture error text + SQL proof.
- [ ] **RLS policies + grants:** verify RLS + table grants for all PostgREST tables touched here:
      `admin_users`, `venue_owners`, `profiles`, `venue_rules`, `venue_opening_hours`, `venue_pricing_tiers`, `venue_species_stock`, `venue_photos`, `venue_events`, plus any `venues/venue_stats` dependencies.
- [ ] **Sensitive field containment:** confirm `admin_get_venue_by_slug` returns `notes_for_rr_team` **only** to admins and no public endpoints (RPC/view) expose it.
- [ ] **View posture:** validate `venue_stats` view posture (owner, `security_invoker`, reloptions) so it can’t bypass RLS when referenced inside RPCs.
- [ ] **Shared components coupling:** this surface composes shared owner/admin cards from:
  - `src/pages/venue-owner-admin/components/*`
  - `src/pages/my-venues/components/RulesCard.tsx`
    Confirm shared components perform **select-only PostgREST** and that all mutations are **RPC-only** (no `.insert/.update/.delete`).
- [ ] **Storage hardening:** verify `venue-photos` bucket policies + app behavior:
  - uploads/deletes constrained to `venue-photos/<venue_id>/...`
  - RPC path validation (`admin_add_venue_photo`) matches bucket policy expectations
  - failed DB insert cleanup cannot delete arbitrary objects (prefix/venue guard)
- [ ] **Profiles lookup scope:** confirm the owner lookup query only selects `id, username` and does not expose extra columns to non-admins.
- [ ] **Venue events integrity:** confirm admin update/delete event RPCs enforce event→venue ownership (no cross-venue edits), and list endpoints are bounded (limit/offset caps, deterministic ordering).
- [ ] **Triggers/side effects:** review triggers on `venue_rules`, `venue_opening_hours`, `venue_pricing_tiers`, `venue_species_stock` to ensure no unexpected side effects beyond timestamps.
