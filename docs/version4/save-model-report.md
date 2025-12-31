# Save Model Report — Admin & Manage Venue Pages

Report-only, code-grounded audit of save behaviors for Admin and Manage venue pages.

## Scope

- Admin view: `src/pages/AdminVenueEdit.tsx`
- Manager/owner view: `src/pages/MyVenueEdit.tsx`
- Related cards/components:
  - `src/pages/venue-owner-admin/components/BookingCard.tsx`
  - `src/pages/venue-owner-admin/components/PricingTiersCard.tsx`
  - `src/pages/venue-owner-admin/components/SpeciesStockCard.tsx`
  - `src/pages/venue-owner-admin/components/OpeningHoursCard.tsx`
  - `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx`
  - `src/pages/my-venues/components/RulesCard.tsx`

## 1) Section-by-Section Save Matrix

### Species Stocked

**Admin**

- Render: `src/pages/AdminVenueEdit.tsx` → `SpeciesStockCard` (`src/pages/venue-owner-admin/components/SpeciesStockCard.tsx`)
- Trigger: Row Save button; row Delete button
- Handler(s): `handleSaveRow`, `handleDeleteRow`
- Write: RPCs `admin_create_venue_species_stock` / `admin_update_venue_species_stock` (payload: `p_venue_id`, `p_species_name`, `p_record_weight`, `p_record_unit`, `p_avg_weight`, `p_size_range_min`, `p_size_range_max`, `p_stock_density`, `p_stock_notes`), delete via `admin_delete_venue_species_stock` (`p_id`)
- Refresh/Invalidate: `loadSpeciesStock` (reads `venue_species_stock`); `qk.venueSpeciesStock(venueId)`
- Failure behavior: toast on error; row remains; no form reset
- Save semantics: Row-save

**Manage**

- Render: `src/pages/MyVenueEdit.tsx` → `SpeciesStockCard` (`src/pages/venue-owner-admin/components/SpeciesStockCard.tsx`)
- Trigger: Row Save button; row Delete button
- Handler(s): `handleSaveRow`, `handleDeleteRow`
- Write: RPCs `owner_create_venue_species_stock` / `owner_update_venue_species_stock` (same payload fields as admin), delete via `owner_delete_venue_species_stock` (`p_id`)
- Refresh/Invalidate: `loadSpeciesStock`; `qk.venueSpeciesStock(venueId)`
- Failure behavior: toast on error; row remains; no form reset
- Save semantics: Row-save

### Facilities & Comfort (metadata fields)

Note: Metadata sections now use a shared group baseline + draft; any section Save commits the full metadata group, and unsaved-change guards cover accordion switches, in-app navigation, and beforeunload.

**Admin**

- Render: `src/pages/AdminVenueEdit.tsx` (Facilities & Comfort accordion)
- Trigger: Section Save button (enabled only when metadata group dirty; any section Save commits the group)
- Handler(s): `saveMetadataGroup`
- Write: RPC `admin_update_venue_metadata` (`p_venue_id`, `p_short_tagline`, `p_description`, `p_ticket_type`, `p_price_from`, `p_best_for_tags`, `p_facilities`, `p_website_url`, `p_booking_url`, `p_contact_phone`, `p_notes_for_rr_team`, `p_payment_methods`, `p_payment_notes`) — note: client always sends `p_best_for_tags: []` (deprecated in-app).
- Refresh/Invalidate: `get_venue_by_slug` refresh + `setVenue`/`setForm`; `qk.venueBySlug(slug)`
- Failure behavior: toast on error; form state preserved
- Save semantics: Metadata group commit

#### TODO (contract phase)

- Drop `best_for_tags` column, remove `p_best_for_tags` from metadata RPCs, and remove any DB views that still return the field.

**Manage**

- Render: `src/pages/MyVenueEdit.tsx` (Facilities & Comfort accordion)
- Trigger: Section Save button (enabled only when metadata group dirty; any section Save commits the group)
- Handler(s): `saveMetadataGroup`
- Write: RPC `owner_update_venue_metadata` (`p_venue_id`, `p_tagline`, `p_description`, `p_ticket_type`, `p_best_for_tags`, `p_facilities`, `p_price_from`, `p_website_url`, `p_booking_url`, `p_contact_phone`, `p_payment_methods`, `p_payment_notes`) — note: client always sends `p_best_for_tags: []` (deprecated in-app).
- Refresh/Invalidate: `get_venue_by_slug` refresh + `setVenue`/`setForm`; `qk.venueBySlug(slug)`
- Failure behavior: toast on error; form state preserved
- Save semantics: Metadata group commit

### Pricing & Tickets (headline/payment fields)

**Admin**

- Render: `src/pages/AdminVenueEdit.tsx` (Pricing & Tickets accordion)
- Trigger: Section Save button (enabled only when metadata group dirty; any section Save commits the group)
- Handler(s): `saveMetadataGroup`
- Write: RPC `admin_update_venue_metadata` (same payload as Facilities & Comfort)
- Refresh/Invalidate: `get_venue_by_slug` refresh + `setVenue`/`setForm`; `qk.venueBySlug(slug)`
- Failure behavior: toast on error; form state preserved
- Save semantics: Metadata group commit

**Manage**

- Render: `src/pages/MyVenueEdit.tsx` (Pricing & Tickets accordion)
- Trigger: Section Save button (enabled only when metadata group dirty; any section Save commits the group)
- Handler(s): `saveMetadataGroup`
- Write: RPC `owner_update_venue_metadata` (same payload as Facilities & Comfort)
- Refresh/Invalidate: `get_venue_by_slug` refresh + `setVenue`/`setForm`; `qk.venueBySlug(slug)`
- Failure behavior: toast on error; form state preserved
- Save semantics: Metadata group commit

### Pricing Tiers (row list inside Pricing & Tickets)

**Admin**

- Render: `src/pages/AdminVenueEdit.tsx` → `PricingTiersCard` (`src/pages/venue-owner-admin/components/PricingTiersCard.tsx`)
- Trigger: Row Save button; row Delete button; Move up/down buttons
- Handler(s): `handleSaveRow`, `handleDeleteRow`, `handleMove`
- Write: RPCs `admin_create_venue_pricing_tier` / `admin_update_venue_pricing_tier` (payload: `p_venue_id`, `p_label`, `p_price`, `p_unit`, `p_audience`, `p_order_index`; update includes `p_id`), delete via `admin_delete_venue_pricing_tier` (`p_id`); reorder uses two `admin_update_venue_pricing_tier` calls
- Refresh/Invalidate: `loadPricingTiers` (reads `venue_pricing_tiers`); `qk.venuePricingTiers(venueId)`
- Failure behavior: toast on error; row remains; reorder error triggers reload
- Save semantics: Row-save

**Manage**

- Render: `src/pages/MyVenueEdit.tsx` → `PricingTiersCard` (`src/pages/venue-owner-admin/components/PricingTiersCard.tsx`)
- Trigger: Row Save button; row Delete button; Move up/down buttons
- Handler(s): `handleSaveRow`, `handleDeleteRow`, `handleMove`
- Write: RPCs `owner_create_venue_pricing_tier` / `owner_update_venue_pricing_tier` (same payload fields as admin), delete via `owner_delete_venue_pricing_tier` (`p_id`); reorder uses two `owner_update_venue_pricing_tier` calls
- Refresh/Invalidate: `loadPricingTiers`; `qk.venuePricingTiers(venueId)`
- Failure behavior: toast on error; row remains; reorder error triggers reload
- Save semantics: Row-save

### Contact & Handoff (tagline/description/URLs/phone/notes)

**Admin**

- Render: `src/pages/AdminVenueEdit.tsx` (Contact & Handoff accordion)
- Trigger: Section Save button (enabled only when metadata group dirty; any section Save commits the group)
- Handler(s): `saveMetadataGroup`
- Write: RPC `admin_update_venue_metadata` (includes `p_short_tagline`, `p_description`, `p_website_url`, `p_booking_url`, `p_contact_phone`, `p_notes_for_rr_team`, plus other metadata fields)
- Refresh/Invalidate: `get_venue_by_slug` refresh + `setVenue`/`setForm`; `qk.venueBySlug(slug)`
- Failure behavior: toast on error; form state preserved
- Save semantics: Metadata group commit

**Manage**

- Render: `src/pages/MyVenueEdit.tsx` (Contact & Handoff accordion)
- Trigger: Section Save button (enabled only when metadata group dirty; any section Save commits the group)
- Handler(s): `saveMetadataGroup`
- Write: RPC `owner_update_venue_metadata` (includes `p_tagline`, `p_description`, `p_website_url`, `p_booking_url`, `p_contact_phone`, plus other metadata fields)
- Refresh/Invalidate: `get_venue_by_slug` refresh + `setVenue`/`setForm`; `qk.venueBySlug(slug)`
- Failure behavior: toast on error; form state preserved
- Save semantics: Metadata group commit

### Booking toggle (inside Contact & Handoff)

**Admin**

- Render: `src/pages/AdminVenueEdit.tsx` → `BookingCard` (`src/pages/venue-owner-admin/components/BookingCard.tsx`)
- Trigger: Switch toggle
- Handler(s): `handleToggle`
- Write: RPC `admin_update_venue_booking` (`p_venue_id`, `p_booking_enabled`)
- Refresh/Invalidate: parent `onUpdated` sets local `venue.booking_enabled`; `qk.venueBySlug(slug)`
- Failure behavior: toast on error; toggle reverts to previous value
- Save semantics: Auto-save

**Manage**

- Render: `src/pages/MyVenueEdit.tsx` → `BookingCard` (`src/pages/venue-owner-admin/components/BookingCard.tsx`)
- Trigger: Switch toggle
- Handler(s): `handleToggle`
- Write: RPC `owner_update_venue_booking` (`p_venue_id`, `p_booking_enabled`)
- Refresh/Invalidate: parent `onUpdated` sets local `venue.booking_enabled`; `qk.venueBySlug(slug)`
- Failure behavior: toast on error; toggle reverts to previous value
- Save semantics: Auto-save

### Opening Hours

**Admin**

- Render: `src/pages/AdminVenueEdit.tsx` → `OpeningHoursCard` (`src/pages/venue-owner-admin/components/OpeningHoursCard.tsx`)
- Trigger: Row Save button; row Delete button; Copy to days button
- Handler(s): `handleSaveGroup`, `handleDeleteGroup`, `handleCopyToDays`
- Write: RPCs `admin_create_venue_opening_hour` / `admin_update_venue_opening_hour` / `admin_delete_venue_opening_hour` (payload base: `p_venue_id`, `p_label`, `p_opens_at`, `p_closes_at`, `p_is_closed`, `p_order_index`; create/update also include `p_day_of_week`; update/delete include `p_id`)
- Refresh/Invalidate: `loadOpeningHours` (reads `venue_opening_hours`); `qk.venueOpeningHours(venueId)`
- Failure behavior: toast on error; reload always; multi-RPC batch can partially succeed
- Save semantics: Row-save

**Manage**

- Render: `src/pages/MyVenueEdit.tsx` → `OpeningHoursCard` (`src/pages/venue-owner-admin/components/OpeningHoursCard.tsx`)
- Trigger: Row Save button; row Delete button; Copy to days button
- Handler(s): `handleSaveGroup`, `handleDeleteGroup`, `handleCopyToDays`
- Write: RPCs `owner_create_venue_opening_hour` / `owner_update_venue_opening_hour` / `owner_delete_venue_opening_hour` (same payload fields as admin)
- Refresh/Invalidate: `loadOpeningHours`; `qk.venueOpeningHours(venueId)`
- Failure behavior: toast on error; reload always; multi-RPC batch can partially succeed
- Save semantics: Row-save

### Rules

**Admin**

- Render: `src/pages/AdminVenueEdit.tsx` → `RulesCard` (`src/pages/my-venues/components/RulesCard.tsx`)
- Trigger: Save button; Clear button
- Handler(s): `handleSave`, `handleClear`
- Write: RPC `admin_update_venue_rules` (`p_venue_id`, `p_rules_text`)
- Refresh/Invalidate: `qk.venueRules(venueId)`
- Failure behavior: toast on error; text preserved; Clear is UI-only
- Save semantics: Explicit save

**Manage**

- Render: `src/pages/MyVenueEdit.tsx` → `RulesCard` (`src/pages/my-venues/components/RulesCard.tsx`)
- Trigger: Save button; Clear button
- Handler(s): `handleSave`, `handleClear`
- Write: RPC `owner_update_venue_rules` (`p_venue_id`, `p_rules_text`)
- Refresh/Invalidate: `qk.venueRules(venueId)`
- Failure behavior: toast on error; text preserved; Clear is UI-only
- Save semantics: Explicit save

### Photos

**Admin**

- Render: `src/pages/AdminVenueEdit.tsx` → `VenuePhotosCard` (`src/pages/venue-owner-admin/components/VenuePhotosCard.tsx`)
- Trigger: Upload button; Delete button; Set primary button
- Handler(s): `handleUploadAll`, `handleDeletePhoto`, `handleSetPrimary`
- Write: storage upload `supabase.storage.from("venue-photos").upload`; RPC `admin_add_venue_photo` (`p_venue_id`, `p_image_path`, `p_caption`); delete RPC `admin_delete_venue_photo` (`p_id`) after storage remove; primary RPC `admin_set_venue_photo_primary` (`p_photo_id`)
- Refresh/Invalidate: `loadPhotos` via `get_venue_photos`; `qk.venuePhotos(venueId)`
- Failure behavior: upload error → toast; DB insert error → cleanup remove attempt + toast; storage delete error → toast; DB delete error after storage delete leaves row
- Save semantics: Action-based (upload/save)

**Manage**

- Render: `src/pages/MyVenueEdit.tsx` → `VenuePhotosCard` (`src/pages/venue-owner-admin/components/VenuePhotosCard.tsx`)
- Trigger: Upload button; Delete button; Set primary button
- Handler(s): `handleUploadAll`, `handleDeletePhoto`, `handleSetPrimary`
- Write: storage upload; RPC `owner_add_venue_photo` (`p_venue_id`, `p_image_path`, `p_caption`); delete RPC `owner_delete_venue_photo` (`p_id`) after storage remove; primary RPC `owner_set_venue_photo_primary` (`p_photo_id`)
- Refresh/Invalidate: `loadPhotos`; `qk.venuePhotos(venueId)`
- Failure behavior: same as admin
- Save semantics: Action-based (upload/save)

### Events

**Admin**

- Render: `src/pages/AdminVenueEdit.tsx` (inline event editor + list)
- Trigger: Save button; Clear form button; Delete button per event
- Handler(s): `handleSaveEvent`, `handleEditEvent`, `resetEventForm`, `handleDeleteEvent`
- Write: RPCs `admin_create_venue_event` (`p_venue_id`, `p_title`, `p_event_type`, `p_starts_at`, `p_ends_at`, `p_description`, `p_ticket_info`, `p_website_url`, `p_booking_url`, `p_is_published`), `admin_update_venue_event` (adds `p_event_id`, `p_venue_id`), delete via `admin_delete_venue_event` (`p_event_id`)
- Refresh/Invalidate: `admin_get_venue_events`; `qk.venuePastEvents(venue.id)` and `qk.venueUpcomingEvents(venue.id)`
- Failure behavior: missing title/starts_at → toast + no save; RPC error → toast + no refresh/reset; refresh error skips setEvents; form resets after create/update success path
- Save semantics: Explicit save

**Manage**

- Render: `src/pages/MyVenueEdit.tsx` (inline event editor + list)
- Trigger: Save button; Clear form button; Delete button per event
- Handler(s): `handleSaveEvent`, `handleEditEvent`, `resetEventForm`, `handleDeleteEvent`
- Write: RPCs `owner_create_venue_event` (`p_venue_id`, `p_title`, `p_event_type`, `p_starts_at`, `p_ends_at`, `p_description`, `p_ticket_info`, `p_website_url`, `p_booking_url`, `p_contact_phone`, `p_is_published`), `owner_update_venue_event` (adds `p_event_id` and `p_contact_phone`), delete via `owner_delete_venue_event` (`p_event_id`)
- Refresh/Invalidate: `owner_get_venue_events`; `qk.venuePastEvents(venue.id)` and `qk.venueUpcomingEvents(venue.id)`
- Failure behavior: RPC error → toast + no refresh/reset; refresh error skips setEvents; form resets after create/update success path
- Save semantics: Explicit save

### Owners (admin-only)

**Admin**

- Render: `src/pages/AdminVenueEdit.tsx` (Owners accordion)
- Trigger: Add owner button; Remove button per owner
- Handler(s): `handleAddOwner`, `handleRemoveOwner`
- Write: RPCs `admin_add_venue_owner` (`p_venue_id`, `p_user_id`, `p_role`), `admin_remove_venue_owner` (`p_venue_id`, `p_user_id`)
- Refresh/Invalidate: Add → reload owners via `supabase.from("venue_owners")`; Remove → local `setOwners` filter
- Failure behavior: toast on error; Add aborts when `resolveOwnerUser` fails
- Save semantics: Action-based

## 2) Global Save/Clear/Delete Truth Table

| Control        | Location                                                    | Handler                                         | Persists?                           | Scope          |
| -------------- | ----------------------------------------------------------- | ----------------------------------------------- | ----------------------------------- | -------------- |
| Save (section) | `src/pages/AdminVenueEdit.tsx` (Facilities/Pricing/Contact) | `handleSave`                                    | Yes (`admin_update_venue_metadata`) | Admin          |
| Save (section) | `src/pages/MyVenueEdit.tsx` (Facilities/Pricing/Contact)    | `handleSave`                                    | Yes (`owner_update_venue_metadata`) | Manage         |
| Save (row)     | `PricingTiersCard`                                          | `handleSaveRow`                                 | Yes (pricing tier RPCs)             | Admin + Manage |
| Delete (row)   | `PricingTiersCard`                                          | `handleDeleteRow`                               | Yes (pricing tier delete RPCs)      | Admin + Manage |
| Save (row)     | `SpeciesStockCard`                                          | `handleSaveRow`                                 | Yes (species stock RPCs)            | Admin + Manage |
| Delete (row)   | `SpeciesStockCard`                                          | `handleDeleteRow`                               | Yes (species stock delete RPCs)     | Admin + Manage |
| Save (row)     | `OpeningHoursCard`                                          | `handleSaveGroup`                               | Yes (opening hours RPCs)            | Admin + Manage |
| Delete (row)   | `OpeningHoursCard`                                          | `handleDeleteGroup`                             | Yes (opening hours delete RPCs)     | Admin + Manage |
| Save           | `RulesCard`                                                 | `handleSave`                                    | Yes (rules RPCs)                    | Admin + Manage |
| Clear          | `RulesCard`                                                 | `handleClear`                                   | No (UI only)                        | Admin + Manage |
| Save           | Events editor                                               | `handleSaveEvent`                               | Yes (event RPCs)                    | Admin + Manage |
| Clear form     | Events editor                                               | `handleEditEvent(undefined)` / `resetEventForm` | No (UI only)                        | Admin + Manage |
| Delete         | Events list                                                 | `handleDeleteEvent`                             | Yes (event delete RPCs)             | Admin + Manage |
| Delete         | `VenuePhotosCard`                                           | `handleDeletePhoto`                             | Yes (storage + photo delete RPCs)   | Admin + Manage |
| Remove         | Owners list                                                 | `handleRemoveOwner`                             | Yes (`admin_remove_venue_owner`)    | Admin          |

Other persistence controls (non Save/Clear/Delete):

- Booking toggle: `BookingCard.handleToggle` → `owner_update_venue_booking` / `admin_update_venue_booking`
- Upload button: `VenuePhotosCard.handleUploadAll` → storage upload + add photo RPC
- Set primary: `VenuePhotosCard.handleSetPrimary` → `owner_set_venue_photo_primary` / `admin_set_venue_photo_primary`
- Move up/down (pricing): `PricingTiersCard.handleMove` → two update RPCs
- Copy to days (opening hours): `OpeningHoursCard.handleCopyToDays` → create/update RPCs

## 3) Cross-Section Coupling

- `handleSave` in `src/pages/AdminVenueEdit.tsx` and `src/pages/MyVenueEdit.tsx` writes multiple UI sections in one RPC call: Facilities (facilities list), Pricing & Tickets (ticket type, price from, best-for tags, payment methods/notes), and Contact & Handoff (tagline, description, website/booking URLs, contact phone, notes for RR team in admin).
- Booking toggle is separate and only updates `booking_enabled` via `admin_update_venue_booking` / `owner_update_venue_booking`.

## 4) RPC + Migration Dependency List (saving paths)

Admin RPCs

- `admin_update_venue_metadata` — `src/pages/AdminVenueEdit.tsx`; migrations: `supabase/migrations/2068_admin_update_venue_metadata.sql`, `supabase/migrations/2075_admin_update_venue_metadata_description.sql`, `supabase/migrations/2076_drop_old_admin_update_venue_metadata.sql`, `supabase/migrations/2122_add_payment_fields_and_pricing_audience.sql`.
- `admin_update_venue_booking` — `BookingCard.tsx`; migration: `supabase/migrations/2118_venue_owner_phase1_mvp.sql`.
- `admin_create_venue_pricing_tier`, `admin_update_venue_pricing_tier`, `admin_delete_venue_pricing_tier` — `PricingTiersCard.tsx`; migrations: `supabase/migrations/2118_venue_owner_phase1_mvp.sql`, `supabase/migrations/2122_add_payment_fields_and_pricing_audience.sql`.
- `admin_create_venue_species_stock`, `admin_update_venue_species_stock`, `admin_delete_venue_species_stock` — `SpeciesStockCard.tsx`; migration: `supabase/migrations/2123_create_venue_species_stock.sql`.
- `admin_create_venue_opening_hour`, `admin_update_venue_opening_hour`, `admin_delete_venue_opening_hour` — `OpeningHoursCard.tsx`; migration: `supabase/migrations/2118_venue_owner_phase1_mvp.sql`.
- `admin_update_venue_rules` — `RulesCard.tsx`; migration: `supabase/migrations/2118_venue_owner_phase1_mvp.sql`.
- `admin_add_venue_photo`, `admin_delete_venue_photo` — `VenuePhotosCard.tsx`; migrations: `supabase/migrations/2129_admin_venue_photo_rpcs.sql`, `supabase/migrations/2130_harden_venue_photo_path_validation.sql`.
- `admin_set_venue_photo_primary` — `VenuePhotosCard.tsx`; migration: `supabase/migrations/2125_venue_photos_primary.sql`.
- `admin_create_venue_event`, `admin_update_venue_event`, `admin_delete_venue_event` — `AdminVenueEdit.tsx`; migration: `supabase/migrations/2090_venue_events_rpcs.sql`.
- `admin_add_venue_owner`, `admin_remove_venue_owner` — `AdminVenueEdit.tsx`; migration: `supabase/migrations/2073_venue_owners_and_owner_rpcs.sql`.

Owner/manager RPCs

- `owner_update_venue_metadata` — `MyVenueEdit.tsx`; migrations: `supabase/migrations/2073_venue_owners_and_owner_rpcs.sql`, `supabase/migrations/2074_fix_owner_update_venue_metadata_ticket_type.sql`, `supabase/migrations/2122_add_payment_fields_and_pricing_audience.sql`.
- `owner_update_venue_booking` — `BookingCard.tsx`; migration: `supabase/migrations/2118_venue_owner_phase1_mvp.sql`.
- `owner_create_venue_pricing_tier`, `owner_update_venue_pricing_tier`, `owner_delete_venue_pricing_tier` — `PricingTiersCard.tsx`; migrations: `supabase/migrations/2118_venue_owner_phase1_mvp.sql`, `supabase/migrations/2122_add_payment_fields_and_pricing_audience.sql`.
- `owner_create_venue_species_stock`, `owner_update_venue_species_stock`, `owner_delete_venue_species_stock` — `SpeciesStockCard.tsx`; migration: `supabase/migrations/2123_create_venue_species_stock.sql`.
- `owner_create_venue_opening_hour`, `owner_update_venue_opening_hour`, `owner_delete_venue_opening_hour` — `OpeningHoursCard.tsx`; migration: `supabase/migrations/2118_venue_owner_phase1_mvp.sql`.
- `owner_update_venue_rules` — `RulesCard.tsx`; migration: `supabase/migrations/2118_venue_owner_phase1_mvp.sql`.
- `owner_add_venue_photo`, `owner_delete_venue_photo` — `VenuePhotosCard.tsx`; migrations: `supabase/migrations/2078_venue_photos_and_rpcs.sql`, `supabase/migrations/2130_harden_venue_photo_path_validation.sql`.
- `owner_set_venue_photo_primary` — `VenuePhotosCard.tsx`; migration: `supabase/migrations/2125_venue_photos_primary.sql`.
- `owner_create_venue_event`, `owner_update_venue_event`, `owner_delete_venue_event` — `MyVenueEdit.tsx`; migration: `supabase/migrations/2073_venue_owners_and_owner_rpcs.sql`.

Direct table writes for saves

- None found for save paths; all DB writes use RPCs. Storage writes occur in `VenuePhotosCard.tsx` via `supabase.storage.from("venue-photos").upload/remove`.

## 5) Risks / Gotchas (save-related, code-grounded)

- Opening hours save (`OpeningHoursCard.handleSaveGroup`) issues multiple RPCs; partial success is possible before reload.
- Pricing tier reorder (`PricingTiersCard.handleMove`) issues two update RPCs; a single failure forces a reload and may temporarily mis-order rows.
- Photo delete is storage-first (`handleDeletePhoto`); DB delete failure after storage remove can leave a dangling DB row.
- Events save resets the form after a successful create/update even if the refresh RPC fails, leaving list potentially stale.
- Manager metadata save (`MyVenueEdit.handleSave`) does not re-fetch venue data; it only invalidates `qk.venueBySlug`.

## 6) QA Checklist (current save behavior)

- Admin and Manager metadata Save calls (`handleSave`) persist and show success toast.
- Booking toggle persists via `admin_update_venue_booking` / `owner_update_venue_booking` and reverts on error.
- Species Stock row Save/Delete persists and reloads list.
- Pricing Tiers Save/Delete persists; Move up/down persists order; errors show toast and reload list.
- Opening Hours Save/Delete/Copy-to-days persists; errors show toast and reload list.
- Rules Save persists; Clear is UI-only until Save.
- Photos Upload persists; DB insert failures attempt cleanup; Delete removes storage + DB; Set primary updates DB.
- Events Save persists and refreshes list; Clear form is UI-only; Delete persists and refreshes list.

## 7) Long-term recommendation (robustness-first)

**Decision recorded:** you selected **Option 2** as the long-term direction.

Because this report is code-grounded (current behavior), this section is intentionally **a forward-looking recommendation** and does **not** claim the code already behaves this way.

### Option 2 — Explicit section commits (recommended)

Aim: make saves predictable, reduce partial updates, and make failure states obvious.

**Model**

- Each accordion section has a single, clear call-to-action at the bottom (already aligned by the recent UI pass).
- Editing does **not** write to the DB until the section-level **Save** is pressed.
- On success: show a success toast + update local state from the server (or re-fetch) so normalization is reflected.
- On failure: preserve user input and show the error without mutating the list/rows.

**Why this is better long-term**

- Fewer partial-write edge cases (especially for fan-out writes like Opening Hours groups).
- Easier to reason about and test (one mutation per section instead of multiple implicit ones).
- Easier to add “unsaved changes” prompts and safe navigation.

### What changes would be required (high-level)

This is the minimum scope implied by Option 2:

1. **Row-save sections become staged edits**

- Species Stocked, Pricing Tiers, Opening Hours should move from per-row RPC writes to:
  - local “draft rows” in the UI
  - a single section-level Save that applies creates/updates/deletes in one commit

2. **Backend support to make commits atomic (preferred)**

- Add “bulk upsert” RPCs per domain so the section Save is one atomic call:
  - `*_upsert_venue_species_stock_bulk`
  - `*_upsert_venue_pricing_tiers_bulk`
  - `*_upsert_venue_opening_hours_bulk`
- Each should validate ownership/admin, apply a full replace/upsert, and return the canonical rows.

3. **Consistency between Admin + Manage**

- Keep identical UI semantics across both pages.
- Ensure admin uses admin read paths for post-save refresh (already done for events).

### Interim hardening (if we defer backend work)

If we need to stay UI-only for now, we can still improve robustness without changing RPCs:

- Add a section-level “Save all rows” button that sequentially triggers existing row saves for dirty rows.
- Add clear dirty-state indicators per row (e.g., “Unsaved changes”).
- Add a “Retry failed rows” affordance after partial failures.

### Robustness checklist for Option 2

- Unsaved changes prompt when navigating away (per section).
- Section Save disabled unless something changed.
- Clear success/failure feedback that does not lose user input.
- Post-save refresh uses the authoritative read path for that view.
- Public page invalidations remain unchanged (qk.\*) so /venues/:slug updates.
