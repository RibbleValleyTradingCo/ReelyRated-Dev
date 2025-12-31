# Venue Pages Production Readiness Review

Date: 2025-12-29  
Commit: 40c966b

Scope
- Public venue page: /venues/:slug (VenueDetail.tsx + viewModel + PlanYourVisitSection.tsx + recent catches + events + hero)
- Admin edit: /admin/venues/:slug (AdminVenueEdit.tsx + shared cards)
- Owner edit: /my/venues/:slug (MyVenueEdit.tsx + shared cards)

Method
- Code inspection only (no manual UI run in this pass)
- DB/RLS review via migrations (RLS policies + RPC definitions)

## Test Matrix (Roles x Venue State)

Legend: Code review only (not manually executed)

| Role | Published venue | Unpublished venue | Edge data (no photos/hours/pricing/events/catches) |
| --- | --- | --- | --- |
| anon | Reviewed | N/A | Reviewed |
| authenticated non-owner | Reviewed | N/A | Reviewed |
| venue owner | Reviewed | Reviewed | Reviewed |
| admin | Reviewed | Reviewed | Reviewed |

## Findings

| Issue | Severity | Where | Steps | Expected | Actual | Root cause | Fix recommendation | UI-only vs DB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Resolved: public get_venue_by_slug no longer returns notes_for_rr_team | P1 (resolved) | supabase/migrations/2132_split_get_venue_by_slug_public_admin.sql + AdminVenueEdit.tsx | As anon, inspect get_venue_by_slug RPC response | Admin-only/internal fields should not be exposed to anon/auth users | notes_for_rr_team removed from public response; admin uses admin_get_venue_by_slug | Public RPC previously returned notes_for_rr_team; RLS is row-level only | Split public vs admin RPCs; admin-only RPC gated by is_admin | DB change |

## Public /venues/:slug Review (DB-first + consistency)

Checked
- Data loading via useVenueDetailData.ts: get_venue_by_slug + table reads (opening hours, pricing tiers, species) + RPCs (events, photos, catches)
- View model mapping in viewModel.ts (no best_for_tags usage; facilities only)
- Empty-state safety in VenueDetail.tsx + PlanYourVisitSection.tsx + VenueHero.tsx
- Error UX via RouteErrorElement (App.tsx) and NotFound (App.tsx + NotFound page)

No issues found
- Rendering handles missing photos/opening hours/pricing/species/events with fallbacks and/or empty states
- View model uses facilities and pricing fields only; deprecated best_for_tags not referenced
- PlanYourVisitSection uses "Open Today" logic and handles closed/missing hours

Risks/notes
- Public venue read uses get_venue_by_slug (public-safe; internal notes removed)

## Admin + Owner Edit Review (Save model + guards + rehydrate)

A) Metadata group commit (Facilities / Pricing & Tickets / Contact & Handoff)
- AdminVenueEdit.tsx + MyVenueEdit.tsx
- Dirty tracking: metadataBaseline vs metadataDraftSnapshot (normalizeMetadata)
- Save path: admin_update_venue_metadata / owner_update_venue_metadata
- Rehydrate path: admin_get_venue_by_slug (Admin) / get_venue_by_slug (Owner); on refresh failure, keep dirty + show "Saved, but refresh failed" toast
- Guarding: useBlocker + beforeunload; UnsavedChangesDialog

No issues found
- Save only reports success on RPC success
- Failure preserves draft + dirty state
- Guards reset on discard and proceed with blocker

B) Section commits (Species / Pricing Tiers / Opening Hours)
- SpeciesStockCard.tsx, PricingTiersCard.tsx, OpeningHoursCard.tsx
- Diff queues: delete -> create -> update, sequential RPCs
- Partial failure handling: per-row errors, "X saved, Y failed", draft preserved
- Post-success rehydrate: load* + invalidate qk.venueSpeciesStock / qk.venuePricingTiers / qk.venueOpeningHours

No issues found
- Draft/baseline diffing is stable; operations are sequential
- New rows are replaced with RPC-returned rows (ID stabilization)
- Closed toggle uses Switch and updates draft (OpeningHoursCard.tsx)

C) Pricing & Tickets combined Save
- AdminVenueEdit.tsx + MyVenueEdit.tsx: savePricingAndMetadata orchestrates metadata save then PricingTiersCard.save()
- Success only sets pricingSectionJustSaved when both succeed

No issues found
- Combined save does not mark "Changes saved" if tiers fail

D) Events + Rules
- Events: AdminVenueEdit.tsx + MyVenueEdit.tsx
- Rules: RulesCard.tsx

No issues found
- Event edit forms populate date fields via toDateTimeLocalInput; dirty tracking stable
- Save uses admin/owner update/create RPCs with success-only refresh/reset
- Rules save uses admin/owner_update_venue_rules with revalidation of qk.venueRules

E) Action-based sections (Photos, Owners, Booking toggle)
- Photos: VenuePhotosCard.tsx (storage upload -> RPC insert; rollback on insert failure; storage-first delete)
- Owners: AdminVenueEdit.tsx (admin_add/remove_venue_owner)
- Booking toggle: BookingCard.tsx (admin/owner_update_venue_booking)

No issues found
- Auto-save flows are explicit with toasts and error handling

## Cache + Invalidation Map (Write -> Refetch)

Metadata group
- admin_update_venue_metadata -> admin_get_venue_by_slug -> invalidate qk.venueBySlug
- owner_update_venue_metadata -> get_venue_by_slug -> invalidate qk.venueBySlug

Pricing tiers
- admin/owner_create/update/delete_venue_pricing_tier -> loadPricingTiers -> invalidate qk.venuePricingTiers

Species stock
- admin/owner_create/update/delete_venue_species_stock -> loadSpeciesStock -> invalidate qk.venueSpeciesStock

Opening hours
- admin/owner_create/update/delete_venue_opening_hour -> loadOpeningHours -> invalidate qk.venueOpeningHours

Rules
- admin/owner_update_venue_rules -> update baseline -> invalidate qk.venueRules

Photos
- admin/owner_add_venue_photo -> loadPhotos -> invalidate qk.venuePhotos
- admin/owner_delete_venue_photo -> loadPhotos -> invalidate qk.venuePhotos
- admin/owner_set_venue_photo_primary -> loadPhotos -> invalidate qk.venuePhotos

Events
- admin/owner_create/update_venue_event -> admin/owner_get_venue_events -> invalidate qk.venuePastEvents + qk.venueUpcomingEvents
- admin/owner_delete_venue_event -> admin/owner_get_venue_events -> invalidate qk.venuePastEvents + qk.venueUpcomingEvents

## Routing + Error Handling

- RouterProvider + createBrowserRouter in App.tsx
- errorElement at route level uses RouteErrorElement with log-once
- NotFound remains the path="*" route (consistent 404 UX)
- useBlocker/useBeforeUnload used in AdminVenueEdit.tsx and MyVenueEdit.tsx under Data Router

No issues found
- Suspense boundary wraps RouterProvider (RouteSkeleton fallback)

## Security/RLS Sanity Pass

Reviewed
- venues RLS policies: public select for published, owner/admin select; row-level only (2086_venues_rls.sql)
- venue_opening_hours / venue_pricing_tiers / venue_photos policies: published or owner/admin select (2118_venue_owner_phase1_mvp.sql, 2078_venue_photos_and_rpcs.sql)

Resolved
- Public get_venue_by_slug no longer returns notes_for_rr_team; admin_get_venue_by_slug is restricted via is_admin (2132_split_get_venue_by_slug_public_admin.sql).

## Leak Closure Confirmation

- Public get_venue_by_slug no longer returns notes_for_rr_team to anon/auth responses.
- Admin edit uses admin_get_venue_by_slug for internal notes.

## Manual Testing Notes

- No manual UI testing executed in this pass (code-only review)
