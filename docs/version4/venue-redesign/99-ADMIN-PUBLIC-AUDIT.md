# Venue Public + Admin Audit (DB-First)

Scope: /venues/:slug public venue page + venue admin/owner edit pages.
Status: Report-only snapshot (updated for migrations 2125–2131 + recent UI-only admin save UX changes).

## Executive Summary (Top 10 Gotchas / Risks)

1. **Owner events: success‑only refresh/reset (`handleSaveEvent`, `src/pages/MyVenueEdit.tsx`) [Info]** — create/update refresh + reset only on success; on error we keep user input.
2. **Dual “record” sources [Medium]** — CTA strip uses `venue_stats.headline_pb_*` while the record card uses `topCatches[0]` (limited list). This can show different “record” values.
3. **Admin/owner edit pages not React Query backed [Medium]** — Edit pages use local state; cross‑tab edits won’t auto‑hydrate.
4. **Public page is a hot path (~10 queries) [Medium]** — Acceptable, but any additional reads should be carefully justified to avoid regressions.
5. **Venue photo delete is storage‑first [Medium]** — Storage object is deleted first, then DB row. If the DB delete fails after storage succeeds, you can temporarily end up with a DB row pointing at a missing file (consider retry/cleanup if this becomes a real‑world issue).
6. **`venue_stats` is global [Low]** — Stats are the same for all viewers by design (approved), but this should be understood when interpreting “active anglers”.
7. **Opening hours ordering is Mon‑first [Low]** — Stored values are 0=Sun…6=Sat, but UI sorts Mon→Sun for display. This is intentional and should remain explicit.
8. **Legacy photo paths may not match new validation [Low]** — New inserts enforce `venue-photos/<venueId>/...` (2130). Older rows may not conform; they still render.
9. **Redundant single‑column `venue_id` indexes dropped in 2131 [Info]** — validated via `pg_stat_user_indexes` + `EXPLAIN`, then dropped in `supabase/migrations/2131_drop_redundant_venue_id_indexes.sql`.
10. **Admin/public events split is correct [Info]** — Admin uses `admin_get_venue_events` for load + post‑mutation refresh (success‑only); public uses published‑only RPCs. Keep them strictly separated.

---

## Hardening Task Tracker (Focused)

Status legend: **[TODO]** not started, **[DONE]** completed in this hardening pass, **[DEFER]** parked for later.

### Must‑fix before production

- [x] **[DONE] Owner events: success‑only refresh/reset (`handleSaveEvent`, `src/pages/MyVenueEdit.tsx`)** — create/update refresh + reset only on success; on failure: toast + preserve form values.

### Should‑fix soon

- [ ] **[TODO] Record display consistency** — decide a single source of truth (stats vs `topCatches`) or explicitly label differences.
- [ ] **[TODO] Legacy photo path audit** — run the SQL audit query and decide whether to backfill/fix non‑conforming historical paths.
- [x] **[DONE] Index redundancy audit + drop** — validated 0 scans + composite usage, then dropped single‑column indexes via `supabase/migrations/2131_drop_redundant_venue_id_indexes.sql`.

### Nice‑to‑have

- [ ] **[DEFER] Edit pages read via React Query** — reduce staleness across tabs/users; not required for this hardening pass.

## A) What Changed Recently (Changelog‑style)

- **Species stock is now public DB‑truth** — via React Query: `qk.venueSpeciesStock(venueId)` and invalidation on admin/owner edits.  
  Files: `src/pages/venue-detail/hooks/useVenueDetailData.ts`, `src/pages/venue-owner-admin/components/SpeciesStockCard.tsx`.
- **Venue photos + primary selection (2125)** — `venue_photos.is_primary`, unique partial index, `get_venue_photos` ordering primary‑first.  
  Migration: `supabase/migrations/2125_venue_photos_primary.sql`.
- **Top catches moved to React Query** — `qk.venueTopCatches(venueId)`; invalidated after AddCatch.  
  Files: `useVenueDetailData.ts`, `src/pages/AddCatch.tsx`.
- **Photos + events moved to React Query** — on public page.  
  Files: `useVenueDetailData.ts`.
- **Opening hours DOW normalized (2124)** — to 0=Sun…6=Sat; UI aligned.  
  Migration: `supabase/migrations/2124_normalize_opening_hours_day_of_week.sql`.
- **DB‑first stats only** — removed UI‑derived fallbacks; show “—” when stats are null.  
  Files: `src/pages/venue-detail/viewModel.ts`, `HeroStatsStrip.tsx`.
- **Public‑only catch RPCs hardened (2127)** — `get_venue_recent_catches` + `get_venue_top_catches` enforce `visibility='public'` + `deleted_at IS NULL`.  
  Migration: `supabase/migrations/2127_harden_venue_catch_rpcs_public_only.sql`.
- **Venue detail hot-path composite indexes added (2128)** — Added composite indexes covering public hot paths for photos/species/hours/pricing.  
  Migration: `supabase/migrations/2128_add_venue_detail_indexes.sql`.
- **Admin events refresh** — uses `admin_get_venue_events` only.  
  Files: `src/pages/AdminVenueEdit.tsx`.
- **Admin event mutation refresh hardened** — create/update now refresh + reset only on success (admin).  
  Files: `src/pages/AdminVenueEdit.tsx`
- **Admin photo add/delete RPCs (2129) + path validation (2130) + storage delete first in UI** — admin RPCs for photo add/delete, path validation enforced, storage object deleted before DB row.  
  Migrations: `supabase/migrations/2129_admin_venue_photo_rpcs.sql`, `supabase/migrations/2130_harden_venue_photo_path_validation.sql`  
  Files: `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx`
- **Save UX honesty** — AutoSaveChip with “Auto‑saves” vs “Save each row”.  
  Files: `src/components/ui/AutoSaveChip.tsx`, `MyVenueEdit.tsx`, `AdminVenueEdit.tsx`
- **Recent catches + venue stats refresh on AddCatch** — AddCatch now invalidates `qk.venueRecentCatches(venueId)` and `qk.venueBySlug(slug)` (when the venue slug is known), so the recent list and hero stats update immediately.  
  Files: `src/pages/AddCatch.tsx`
- **Schema snapshot scripts (repo-local)** — schema/roles dump scripts added under `docs/db/` so Codex can reference DB shape during hardening without pulling live data into git.  
  Files: `docs/db/schema.sql`, `docs/db/roles.sql`, `docs/db/README.md`

### Local schema dump commands (for Codex)

Prefer Supabase CLI dumps (they avoid `pg_dump` client/server version mismatch and don’t require you to know container names):

```bash
mkdir -p docs/db

# confirm local stack + get the DB URL
supabase status

# set DB_URL using the value shown under “Database URL”
export DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"  # example; use your `supabase status` output

# schema (schema-only)
supabase db dump --db-url "$DB_URL" -f docs/db/schema.sql

# roles/grants (globals-only)
supabase db dump --db-url "$DB_URL" --role-only -f docs/db/roles.sql
```

Notes:

- These commands avoid pg_dump client/server version mismatch (the local DB may be newer than your Homebrew pg_dump).
- Do not commit data dumps (keep schema/roles only).
- If you prefer Docker, ensure you target the current `supabase_db_*` container name from `docker ps`.
- If you do use Docker exec for dumps, always discover the current DB container name via `docker ps | grep -i supabase_db`.
- The DB container name can change across resets/projects; prefer the CLI commands above.

---

## B) DB‑First Coverage Matrix (Admin Save → DB → Public Read → Render → Cache)

Legend: ✅ DB‑first, ⚠️ partial/dual source, ❌ not DB‑first.

| Feature                                                                                     | Admin UI Source                         | Save Mechanism                                                                                                                                                                                    | DB Storage                             | Public Read + Key                                                                                        | Public Render                               | Invalidation                          | DB‑first |
| ------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------- | -------- |
| Venue metadata (ticket type, price_from, payment fields, contact, facilities, booking URLs) | `MyVenueEdit.tsx`, `AdminVenueEdit.tsx` | `owner_update_venue_metadata` / `admin_update_venue_metadata`                                                                                                                                     | `public.venues`                        | `get_venue_by_slug` via `qk.venueBySlug(slug)`                                                           | `viewModel.ts` → `PlanYourVisitSection.tsx` | `qk.venueBySlug(slug)`                | ✅       |
| Booking enabled                                                                             | BookingCard (owner/admin)               | `owner_update_venue_booking` / `admin_update_venue_booking`                                                                                                                                       | `venues.booking_enabled`               | `get_venue_by_slug` via `qk.venueBySlug(slug)`                                                           | Hero CTAs + Plan Your Visit                 | `qk.venueBySlug(slug)`                | ✅       |
| Pricing tiers + audience                                                                    | PricingTiersCard                        | `owner/admin_*_venue_pricing_tier`                                                                                                                                                                | `venue_pricing_tiers`                  | `select *` via `qk.venuePricingTiers(venueId)`                                                           | Plan Your Visit                             | `qk.venuePricingTiers(venueId)`       | ✅       |
| Opening hours                                                                               | OpeningHoursCard                        | `owner/admin_*_venue_opening_hour`                                                                                                                                                                | `venue_opening_hours`                  | `select *` via `qk.venueOpeningHours(venueId)`                                                           | Plan Your Visit                             | `qk.venueOpeningHours(venueId)`       | ✅       |
| Rules                                                                                       | RulesCard                               | `owner/admin_update_venue_rules`                                                                                                                                                                  | `venue_rules.rules_text`               | `select rules_text` via `qk.venueRules(venueId)`                                                         | Plan Your Visit                             | `qk.venueRules(venueId)`              | ✅       |
| Species stock                                                                               | SpeciesStockCard                        | `owner/admin_*_venue_species_stock`                                                                                                                                                               | `venue_species_stock`                  | `select *` via `qk.venueSpeciesStock(venueId)`                                                           | Plan Your Visit                             | `qk.venueSpeciesStock(venueId)`       | ✅       |
| Events (admin)                                                                              | AdminVenueEdit                          | `admin_*_venue_event`                                                                                                                                                                             | `venue_events`                         | `admin_get_venue_events`                                                                                 | Admin events list                           | local refresh + public invalidation   | ✅       |
| Events (owner)                                                                              | MyVenueEdit                             | `owner_*_venue_event`                                                                                                                                                                             | `venue_events`                         | `owner_get_venue_events`                                                                                 | Owner events list                           | local refresh + public invalidation   | ✅       |
| Events (public)                                                                             | n/a                                     | n/a                                                                                                                                                                                               | `venue_events`                         | `get_venue_upcoming_events` / `get_venue_past_events` via `qk.venueUpcomingEvents`, `qk.venuePastEvents` | Events section                              | invalidated on admin/owner save       | ✅       |
| Photos + primary                                                                            | VenuePhotosCard                         | `owner_add_venue_photo / owner_delete_venue_photo / admin_add_venue_photo / admin_delete_venue_photo` (path validation 2130) + `owner/admin_set_venue_photo_primary` (UI delete is storage‑first) | `venue_photos` + `is_primary`          | `get_venue_photos` via `qk.venuePhotos(venueId)`                                                         | Hero + carousel                             | `qk.venuePhotos(venueId)`             | ✅       |
| Recent catches                                                                              | AddCatch (public)                       | Insert into `public.catches` (AddCatch flow)                                                                                                                                                      | `public.catches`                       | `get_venue_recent_catches` via `qk.venueRecentCatches(venueId)`                                          | `RecentCatchesSection.tsx`                  | invalidated after AddCatch            | ✅       |
| Top catches                                                                                 | AddCatch (public)                       | Insert into `public.catches` (AddCatch flow)                                                                                                                                                      | `public.catches`                       | `get_venue_top_catches` via `qk.venueTopCatches(venueId)`                                                | Record card + leaderboard                   | invalidated after AddCatch            | ✅       |
| CTA stats (total, 30d, record, top species, active anglers)                                 | n/a                                     | n/a                                                                                                                                                                                               | `public.venue_stats` / `public.venues` | `get_venue_by_slug` via `qk.venueBySlug(slug)`                                                           | `HeroStatsStrip.tsx`                        | invalidated on admin saves + AddCatch | ✅       |

---

## C) Public Reads Inventory (Queries + Cache)

Source: `src/pages/venue-detail/hooks/useVenueDetailData.ts`

- `qk.venueBySlug(slug)` → `get_venue_by_slug` (60s stale, no focus refetch)
- `qk.venueRating(userId, venueId)` → `get_my_venue_rating` (60s, no focus refetch)
- `qk.venueOpeningHours(venueId)` → `venue_opening_hours` select
- `qk.venuePricingTiers(venueId)` → `venue_pricing_tiers` select
- `qk.venueRules(venueId)` → `venue_rules` select
- `qk.venueSpeciesStock(venueId)` → `venue_species_stock` select
- `qk.venueUpcomingEvents(venueId)` → `get_venue_upcoming_events`
- `qk.venuePastEvents(venueId)` → `get_venue_past_events` (infinite)
- `qk.venuePhotos(venueId)` → `get_venue_photos`
- `qk.venueTopCatches(venueId)` → `get_venue_top_catches`
- `qk.venueRecentCatches(venueId)` → `get_venue_recent_catches` (infinite)

All are DB‑first and use canonical query keys.

---

## D) Security + Correctness Audit

**RPC safety**

- Owner/admin RPCs are SECURITY DEFINER with `SET search_path = public, extensions` (safe).
- `owner_*` and `admin_*` functions enforce either `is_venue_admin_or_owner` or `is_admin` checks.

**Public‑only catches**

- `get_venue_recent_catches` / `get_venue_top_catches` now explicitly filter `visibility='public'` and `deleted_at IS NULL` (2127).

**Path validation (2130)**

- Both `owner_add_venue_photo` and `admin_add_venue_photo` enforce:
  - non‑empty path
  - no `..`
  - prefix `venue-photos/<venueId>/...`
- Matches current UI path format.

**Storage policies**

- `venue-photos` bucket policies allow `is_venue_admin_or_owner` for write.  
  Admins can remove storage objects; delete now happens client‑side first.

**venue_stats semantics**

- Global aggregates, same for all viewers (approved product decision). This is DB‑first by design.

**Remaining admin flow risk**

- Owner event save resets on failure — resolved in `handleSaveEvent` (`src/pages/MyVenueEdit.tsx`).

---

## E) Performance Audit

**Indexes**
Composite indexes added in 2128 align with public hot paths:

- `venue_photos (venue_id, is_primary DESC, created_at DESC)`
- `venue_species_stock (venue_id, created_at)`
- `venue_opening_hours (venue_id, order_index)`
- `venue_pricing_tiers (venue_id, order_index)`

**Potential redundancy**
Single‑column `venue_id` indexes were confirmed unused and dropped in `supabase/migrations/2131_drop_redundant_venue_id_indexes.sql` (composite indexes remain).

**Query count**
~10 queries on `/venues/:slug` (acceptable for now). Any new reads should consider batching or RPC aggregation later.

---

## F) UX Honesty + Save Model Audit

**Auto‑save (chip: “Auto‑saves”)**

- Booking toggle  
  Files: `MyVenueEdit.tsx`, `AdminVenueEdit.tsx`
- Photos add/delete/primary  
  File: `VenuePhotosCard.tsx`
- Owners add/remove (admin)  
  File: `AdminVenueEdit.tsx`

**Row‑save (chip: “Save each row”)**

- Opening Hours  
  Files: `MyVenueEdit.tsx`, `AdminVenueEdit.tsx`
- Pricing Tiers  
  Files: `MyVenueEdit.tsx`, `AdminVenueEdit.tsx`
- Species Stock  
  Files: `MyVenueEdit.tsx`, `AdminVenueEdit.tsx`

**Explicit Save**

- Rules (Markdown editor)  
  File: `RulesCard.tsx`
- Events (create/update) — per-form Save action.  
  Files: `MyVenueEdit.tsx`, `AdminVenueEdit.tsx`

**Remaining misleading UX**

- Owner events refresh/reset on failure (input loss) — fixed in `handleSaveEvent` (`src/pages/MyVenueEdit.tsx`).

---

## G) Remaining Hardening Recommendations (Prioritized)

### Must‑fix before production

1. **Owner events: success‑only refresh/reset [DONE]**  
   **Status:** handled in `handleSaveEvent` (`src/pages/MyVenueEdit.tsx`); refresh + reset only on success, preserve input on error.

### Should‑fix soon

2. **Record display consistency**  
   **Risk:** record card can diverge from CTA strip (limited vs stats).  
   **Fix:** decide single source of record for display.

3. **Legacy photo path audit**  
   **Risk:** historical rows may not match new validation.  
   **Fix:** run SQL audit and fix paths as needed.

4. **Index redundancy audit + drop [DONE]**  
   **Status:** validated with `pg_stat_user_indexes` + `EXPLAIN`, then dropped via `supabase/migrations/2131_drop_redundant_venue_id_indexes.sql`.

### Nice‑to‑have

5. **Edit pages read via React Query**  
   **Risk:** stale data across tabs/users.  
   **Fix:** convert edit reads to RQ when time permits.

---

## H) Hardening Pass Boundaries

- This doc tracks DB‑first correctness, security boundaries, and cache/invalidation on venue public/admin surfaces.
- During the hardening pass we prefer small, testable changes (RLS/RPC correctness, invalidations, indexes, and UI honesty).
- UI polish work should be separate and must not change data shape, query keys, RPC semantics, or migrations unless explicitly planned.

---

## QA Checklist (High‑level)

**Public**

- Hero stats show “—” when stats are null (no inferred counts).
- Species stock shows DB rows and updates after admin save.
- Primary venue photo controls hero order.
- Recent/top catches return only public catches.

**Owner/Admin**

- Row‑save sections show “Save each row”.
- Auto‑save sections show “Auto‑saves”.
- Admin events show drafts/past after save.

---

## SQL Spot‑Checks

**Venue stats**

```sql
select id, total_catches, recent_catches_30d, active_anglers_all_time,
       headline_pb_weight, headline_pb_unit, headline_pb_species, top_species
from public.venue_stats
where venue_id = '<VENUE_UUID>';
```

**Species stock**

```sql
select * from public.venue_species_stock
where venue_id = '<VENUE_UUID>'
order by created_at;
```

**Photos (primary ordering)**

```sql
select id, venue_id, image_path, is_primary, created_at
from public.venue_photos
where venue_id = '<VENUE_UUID>'
order by is_primary desc, created_at desc;
```

**Events (admin vs public)**

```sql
select id, title, starts_at, is_published from public.venue_events
where venue_id = '<VENUE_UUID>'
order by starts_at desc;
```

---

# Venue Public + Admin Audit (DB‑First)

Scope: `/venues/:slug` public venue page + venue admin/owner edit pages.

Status: Living hardening tracker (updated for migrations **2125–2131** + recent admin Save‑UX changes).

---

## Executive summary

### Top risks / gotchas (10)

1. **Owner events: success‑only refresh/reset (`handleSaveEvent`, `src/pages/MyVenueEdit.tsx`) [Info]** — create/update refresh + reset only on success; on error we keep user input.
2. **Public venue page hot path (many reads) [Medium]** — `/venues/:slug` loads ~10–12 queries (venue + rules + hours + tiers + species + photos + events + catches). This is OK with caching, but any new reads should be justified.
3. **Edit pages not React Query‑backed [Medium]** — `MyVenueEdit.tsx` / `AdminVenueEdit.tsx` rely on local state reads; cross‑tab edits won’t auto‑hydrate.
4. **Venue photo delete is storage‑first [Medium]** — UI deletes the storage object first, then deletes the DB row. If the DB delete fails after storage succeeds, you can temporarily end up with a DB row pointing at a missing file.
5. **Photo insert can orphan storage objects [Medium]** — upload puts the object in storage, then calls `*_add_venue_photo`. If the DB insert fails after upload, the file may remain in storage without a DB row (needs cleanup handling if it becomes common).
6. **`venue_stats` is global (approved) [Low]** — stats are the same for all viewers by design; keep this in mind when interpreting “active anglers”.
7. **Opening hours ordering is Mon‑first (intentional) [Low]** — stored values are `0=Sun … 6=Sat`, but UI sorts Mon→Sun for display. Keep this explicit.
8. **Legacy photo paths may not match new validation [Low]** — new inserts enforce `venue-photos/<venueId>/...` (2130). Older rows may not conform; they still render.
9. **Redundant single‑column `venue_id` indexes dropped in 2131 [Info]** — validated via `pg_stat_user_indexes` + `EXPLAIN`, then dropped in `supabase/migrations/2131_drop_redundant_venue_id_indexes.sql`.
10. **Admin vs public events split must remain strict [Info]** — admin uses `admin_get_venue_events` for load + post‑mutation refresh (success‑only); public uses published‑only RPCs. Keep them separated.

---

## Hardening task tracker (focused)

Status legend: **[TODO]** not started, **[DONE]** completed in this hardening pass, **[DEFER]** parked for later.

### Must‑fix before production

- [x] **[DONE] Owner events: success‑only refresh/reset (`handleSaveEvent`, `src/pages/MyVenueEdit.tsx`)** — create/update refresh + reset only on success; on failure: toast + preserve form values.

### Should‑fix soon

- [ ] **[TODO] Legacy photo path audit + cleanup decision** — run the SQL audit query (Section D) and decide whether to backfill/fix any non‑conforming historical paths.
- [ ] **[TODO] Photo insert failure cleanup** — if DB insert fails after storage upload, consider deleting the newly uploaded object or surfacing a “cleanup required” warning + retry (UI‑only guardrail; no new RPCs required).
- [x] **[DONE] Index redundancy audit + drop** — validated 0 scans + composite usage, then dropped single‑column indexes via `supabase/migrations/2131_drop_redundant_venue_id_indexes.sql`.

### Nice‑to‑have

- [ ] **[DEFER] Edit pages read via React Query** — reduces staleness across tabs/users; not required for this hardening pass.

---

## A) What changed recently (changelog‑style)

- **Species stock is now public DB‑truth** — React Query: `qk.venueSpeciesStock(venueId)` + invalidation on admin/owner edits.  
  Files: `src/pages/venue-detail/hooks/useVenueDetailData.ts`, `src/pages/venue-owner-admin/components/SpeciesStockCard.tsx`
- **Venue photos + primary selection (2125)** — `venue_photos.is_primary`, unique partial index, `get_venue_photos` ordering primary‑first.  
  Migration: `supabase/migrations/2125_venue_photos_primary.sql`
- **Venue stats extended (2126)** — `venue_stats` expanded (e.g., active anglers) and used via `get_venue_by_slug`.  
  Migration: `supabase/migrations/2126_extend_venue_stats_active_anglers.sql`
- **Opening hours DOW normalized (2124)** — to `0=Sun … 6=Sat`; UI aligned.  
  Migration: `supabase/migrations/2124_normalize_opening_hours_day_of_week.sql`
- **DB‑first stats only (UI)** — removed UI‑derived fallbacks; shows “—” when stats are null.  
  Files: `src/pages/venue-detail/viewModel.ts`, `src/pages/venue-detail/components/HeroStatsStrip.tsx`
- **Public‑only catch RPCs hardened (2127)** — `get_venue_recent_catches` + `get_venue_top_catches` enforce `visibility='public'` + `deleted_at IS NULL`.  
  Migration: `supabase/migrations/2127_harden_venue_catch_rpcs_public_only.sql`
- **Top catches moved to React Query** — `qk.venueTopCatches(venueId)`; invalidated after AddCatch.  
  Files: `src/pages/venue-detail/hooks/useVenueDetailData.ts`, `src/pages/AddCatch.tsx`
- **Recent catches + venue stats refresh on AddCatch** — AddCatch invalidates `qk.venueRecentCatches(venueId)` and `qk.venueBySlug(slug)` (when slug known).  
  File: `src/pages/AddCatch.tsx`
- **Venue detail hot‑path composite indexes added (2128)** — composite indexes for photos/species/hours/pricing.  
  Migration: `supabase/migrations/2128_add_venue_detail_indexes.sql`
- **Admin events refresh hardened** — admin load + post‑mutation refresh uses `admin_get_venue_events` only; create/update reset only on success.  
  File: `src/pages/AdminVenueEdit.tsx`
- **Admin photo add/delete RPCs (2129) + path validation (2130) + storage‑first delete** — admin RPCs for photo add/delete; path validation enforced; delete removes storage object before DB row.  
  Migrations: `supabase/migrations/2129_admin_venue_photo_rpcs.sql`, `supabase/migrations/2130_harden_venue_photo_path_validation.sql`  
  File: `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx`
- **Save UX honesty** — standardized status chip (“Auto‑saves” vs “Save each row”).  
  Files: `src/components/ui/AutoSaveChip.tsx`, `src/pages/MyVenueEdit.tsx`, `src/pages/AdminVenueEdit.tsx`

---

## B) DB‑first coverage matrix (admin save → DB → public read → render → cache)

Legend: ✅ DB‑first, ⚠️ partial/dual source, ❌ not DB‑first.

| Feature                                                                                     | Admin UI source                         | Save mechanism                                                                       | DB storage                             | Public read + key                                                                                        | Public render                               | Invalidation                          | DB‑first |
| ------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------- | -------- |
| Venue metadata (ticket type, price_from, payment fields, contact, facilities, booking URLs) | `MyVenueEdit.tsx`, `AdminVenueEdit.tsx` | `owner_update_venue_metadata` / `admin_update_venue_metadata`                        | `public.venues`                        | `get_venue_by_slug` via `qk.venueBySlug(slug)`                                                           | `viewModel.ts` → `PlanYourVisitSection.tsx` | `qk.venueBySlug(slug)`                | ✅       |
| Booking enabled                                                                             | BookingCard                             | `owner_update_venue_booking` / `admin_update_venue_booking`                          | `venues.booking_enabled`               | `get_venue_by_slug` via `qk.venueBySlug(slug)`                                                           | hero CTAs + Plan Your Visit                 | `qk.venueBySlug(slug)`                | ✅       |
| Pricing tiers + audience                                                                    | PricingTiersCard                        | `owner/admin_*_venue_pricing_tier`                                                   | `venue_pricing_tiers`                  | select via `qk.venuePricingTiers(venueId)`                                                               | Plan Your Visit                             | `qk.venuePricingTiers(venueId)`       | ✅       |
| Opening hours                                                                               | OpeningHoursCard                        | `owner/admin_*_venue_opening_hour`                                                   | `venue_opening_hours`                  | select via `qk.venueOpeningHours(venueId)`                                                               | Plan Your Visit                             | `qk.venueOpeningHours(venueId)`       | ✅       |
| Rules                                                                                       | RulesCard                               | `owner/admin_update_venue_rules`                                                     | `venue_rules.rules_text`               | select via `qk.venueRules(venueId)`                                                                      | Plan Your Visit                             | `qk.venueRules(venueId)`              | ✅       |
| Species stock                                                                               | SpeciesStockCard                        | `owner/admin_*_venue_species_stock`                                                  | `venue_species_stock`                  | select via `qk.venueSpeciesStock(venueId)`                                                               | Plan Your Visit                             | `qk.venueSpeciesStock(venueId)`       | ✅       |
| Events (admin)                                                                              | `AdminVenueEdit.tsx`                    | `admin_*_venue_event`                                                                | `venue_events`                         | `admin_get_venue_events` (admin list)                                                                    | admin events list                           | local refresh + public invalidation   | ✅       |
| Events (owner)                                                                              | `MyVenueEdit.tsx`                       | `owner_*_venue_event`                                                                | `venue_events`                         | `owner_get_venue_events` (owner list)                                                                    | owner events list                           | local refresh + public invalidation   | ✅       |
| Events (public)                                                                             | n/a                                     | n/a                                                                                  | `venue_events`                         | `get_venue_upcoming_events` / `get_venue_past_events` via `qk.venueUpcomingEvents`, `qk.venuePastEvents` | Events section                              | invalidated after admin/owner save    | ✅       |
| Photos + primary                                                                            | VenuePhotosCard                         | `owner_*` + `admin_*` add/delete (2129/2130) + `owner/admin_set_venue_photo_primary` | `venue_photos`                         | `get_venue_photos` via `qk.venuePhotos(venueId)`                                                         | hero + carousel                             | `qk.venuePhotos(venueId)`             | ✅       |
| Recent catches                                                                              | AddCatch                                | insert into `public.catches`                                                         | `public.catches`                       | `get_venue_recent_catches` via `qk.venueRecentCatches(venueId)`                                          | `RecentCatchesSection.tsx`                  | invalidated after AddCatch            | ✅       |
| Top catches                                                                                 | AddCatch                                | insert into `public.catches`                                                         | `public.catches`                       | `get_venue_top_catches` via `qk.venueTopCatches(venueId)`                                                | record/top catches                          | invalidated after AddCatch            | ✅       |
| Hero stats (total/30d/top species/active anglers + PB label)                                | n/a                                     | n/a                                                                                  | `public.venue_stats` / `public.venues` | `get_venue_by_slug` via `qk.venueBySlug(slug)`                                                           | `HeroStatsStrip.tsx`                        | invalidated on admin saves + AddCatch | ✅       |

---

## C) Public reads inventory (queries + cache)

Source: `src/pages/venue-detail/hooks/useVenueDetailData.ts`

- `qk.venueBySlug(slug)` → `get_venue_by_slug` (60s stale, no focus refetch)
- `qk.venueRating(userId, venueId)` → `get_my_venue_rating` (60s, no focus refetch)
- `qk.venueOpeningHours(venueId)` → `venue_opening_hours` select
- `qk.venuePricingTiers(venueId)` → `venue_pricing_tiers` select
- `qk.venueRules(venueId)` → `venue_rules` select
- `qk.venueSpeciesStock(venueId)` → `venue_species_stock` select
- `qk.venueUpcomingEvents(venueId)` → `get_venue_upcoming_events`
- `qk.venuePastEvents(venueId)` → `get_venue_past_events` (infinite)
- `qk.venuePhotos(venueId)` → `get_venue_photos`
- `qk.venueTopCatches(venueId)` → `get_venue_top_catches`
- `qk.venueRecentCatches(venueId)` → `get_venue_recent_catches` (infinite)

All reads are DB‑first and use canonical query keys.

---

## D) Security + correctness audit

### RPC safety

- Owner/admin RPCs are SECURITY DEFINER with `SET search_path = public, extensions`.
- `owner_*` and `admin_*` functions enforce either `is_venue_admin_or_owner` or `is_admin` checks.

### Public‑only catches (2127)

- `get_venue_recent_catches` / `get_venue_top_catches` explicitly filter `visibility='public'` and `deleted_at IS NULL`.

### Path validation (2130)

- Both `owner_add_venue_photo` and `admin_add_venue_photo` enforce:
  - non‑empty path
  - no `..`
  - prefix `venue-photos/<venueId>/...`

### Storage policies

- `venue-photos` bucket policies allow venue admins/owners to manage objects.
- Delete is client‑side storage‑first: if storage delete fails, DB delete is skipped.

### Legacy photo path audit query

```sql
select id, venue_id, image_path
from public.venue_photos
where image_path is null
   or image_path not like ('venue-photos/' || venue_id::text || '/%')
   or image_path like '%..%';
```

---

## E) Performance audit

### Indexes (2128)

Composite indexes align with public hot paths:

- `venue_photos (venue_id, is_primary DESC, created_at DESC)`
- `venue_species_stock (venue_id, created_at)`
- `venue_opening_hours (venue_id, order_index)`
- `venue_pricing_tiers (venue_id, order_index)`

### Redundancy verification (post‑2131)

Single‑column `venue_id` indexes were confirmed unused and dropped in `supabase/migrations/2131_drop_redundant_venue_id_indexes.sql`. Use the SQL below to verify in other environments:

```sql
select relname as table_name, indexrelname as index_name, idx_scan, idx_tup_read, idx_tup_fetch
from pg_stat_user_indexes
where relname in ('venue_photos','venue_species_stock','venue_opening_hours','venue_pricing_tiers')
order by relname, idx_scan desc;
```

---

## F) UX honesty + save model audit

### Auto‑save (chip: “Auto‑saves”)

- Booking toggle
- Photos add/delete/primary
- Owners add/remove (admin)

### Row‑save (chip: “Save each row”)

- Opening Hours
- Pricing Tiers (owner + admin)
- Species Stock

### Explicit Save

- Rules (Markdown editor)
- Events (create/update) — per‑form Save action

---

## G) Hardening pass boundaries

- This doc tracks DB‑first correctness, security boundaries, and cache/invalidation on venue public/admin surfaces.
- During hardening we prefer small, testable changes (RLS/RPC correctness, invalidations, indexes, UI honesty).
- UI polish work is separate and must not change data shape, query keys, RPC semantics, or migrations unless explicitly planned.

---

## H) QA checklist (high‑level)

### Public `/venues/:slug`

- Hero stats show “—” when stats are null (no inferred counts).
- Species stock shows DB rows and updates after admin save.
- Primary venue photo controls hero order.
- Recent/top catches return only public catches.

### Owner/Admin edit pages

- Row‑save sections show “Save each row”.
- Auto‑save sections show “Auto‑saves”.
- Admin events show drafts/past after save; create/update refresh + reset only on success.

# Venue Public + Admin Audit (DB‑First)

Scope: `/venues/:slug` public venue page + venue admin/owner edit pages.

Status: Living hardening tracker (aligned to migrations **2125–2131** and recent UI‑only admin/owner Save‑UX changes).

## Executive summary

### Top risks / gotchas (current)

1. **Public venue page is a hot path (~10–12 reads) [Medium]** — `/venues/:slug` loads venue + rules + hours + tiers + species + photos + events + catches. This is OK with React Query caching, but any additional reads should be carefully justified.
2. **Edit pages are not React Query‑backed [Medium]** — `MyVenueEdit.tsx` / `AdminVenueEdit.tsx` use local state for most reads; cross‑tab edits won’t auto‑hydrate.
3. **Photo delete is storage‑first [Medium]** — UI deletes the storage object first, then the DB row. If the DB delete fails after storage succeeds, you can temporarily end up with a DB row pointing at a missing file (consider retry/cleanup if it becomes a real‑world issue).
4. **`venue_stats` is global (approved) [Low]** — stats are identical for all viewers by design; keep this in mind when interpreting “active anglers”.
5. **Opening hours ordering is Mon‑first (intentional) [Low]** — stored values are `0=Sun … 6=Sat`, but UI sorts Mon→Sun for display. Keep this explicit.
6. **Redundant single‑column `venue_id` indexes dropped in 2131 [Info]** — validated via `pg_stat_user_indexes` + `EXPLAIN`, then dropped in `supabase/migrations/2131_drop_redundant_venue_id_indexes.sql`.
7. **Admin vs public events split must remain strict [Info]** — admin uses `admin_get_venue_events` (load + post‑mutation refresh, success‑only); public uses published‑only RPCs. Keep them separated.

### Recently resolved in this hardening pass

- ✅ **Owner events: success‑only refresh/reset (`handleSaveEvent`, `src/pages/MyVenueEdit.tsx`)** — owner create/update now refresh + reset only on success; on error we keep user input.
- ✅ **Admin events: success‑only refresh/reset + admin refresh path only** — admin post‑mutation refresh uses `admin_get_venue_events` only.
- ✅ **Admin photo add/delete RPCs + path validation** — admin add/delete RPCs added (2129) and hardened with path validation (2130).
- ✅ **Legacy photo path audit (local DB)** — audit query returned **0 rows** (no non‑conforming historical paths detected).
- ✅ **Photo upload rollback on DB insert failure** — if storage upload succeeds but `owner_add_venue_photo` / `admin_add_venue_photo` fails, the UI now removes the uploaded object and toasts “Upload rolled back” or “cleanup failed”. (No new RPCs/migrations/query keys.)

---

## Hardening task tracker (focused)

Status legend: **[TODO]** not started, **[DONE]** completed in this hardening pass, **[DEFER]** parked for later.

### Must‑fix before production

- [x] **[DONE] Owner events: success‑only refresh/reset (`handleSaveEvent`, `src/pages/MyVenueEdit.tsx`)** — create/update refresh + reset only on success; on failure: toast + preserve form values.

### Should‑fix soon

- [x] **[DONE] Photo insert failure cleanup** — on DB insert failure after storage upload, the UI removes the uploaded object and toasts success/failure of the rollback. (UI‑only; no new RPCs/migrations/query keys.)
- [x] **[DONE] Index redundancy audit + drop** — validated 0 scans + composite usage, then dropped single‑column indexes via `supabase/migrations/2131_drop_redundant_venue_id_indexes.sql`.

### Nice‑to‑have

- [ ] **[DEFER] Edit pages read via React Query** — reduces staleness across tabs/users; not required for this hardening pass.

---

## A) What changed recently (changelog)

- **Venue photos + primary selection (2125)** — `venue_photos.is_primary`, unique partial index, and `get_venue_photos` ordering primary‑first.
  - Migration: `supabase/migrations/2125_venue_photos_primary.sql`
- **Venue stats extended (2126)** — `venue_stats` expanded (e.g., active anglers) and used via `get_venue_by_slug`.
  - Migration: `supabase/migrations/2126_extend_venue_stats_active_anglers.sql`
- **Opening hours DOW normalized (2124)** — to `0=Sun … 6=Sat`; UI aligned.
  - Migration: `supabase/migrations/2124_normalize_opening_hours_day_of_week.sql`
- **DB‑first stats only (UI)** — removed UI‑derived fallbacks; shows “—” when stats are null.
  - Files: `src/pages/venue-detail/viewModel.ts`, `src/pages/venue-detail/components/HeroStatsStrip.tsx`
- **Public‑only catch RPCs hardened (2127)** — `get_venue_recent_catches` + `get_venue_top_catches` enforce `visibility='public'` + `deleted_at IS NULL`.
  - Migration: `supabase/migrations/2127_harden_venue_catch_rpcs_public_only.sql`
- **Top catches moved to React Query** — `qk.venueTopCatches(venueId)`; invalidated after AddCatch.
  - Files: `src/pages/venue-detail/hooks/useVenueDetailData.ts`, `src/pages/AddCatch.tsx`
- **Recent catches + venue stats refresh on AddCatch** — AddCatch invalidates `qk.venueRecentCatches(venueId)` and `qk.venueBySlug(slug)` (when slug known).
  - File: `src/pages/AddCatch.tsx`
- **Venue detail hot‑path composite indexes added (2128)** — composite indexes for photos/species/hours/pricing.
  - Migration: `supabase/migrations/2128_add_venue_detail_indexes.sql`
- **Admin events refresh hardened** — admin load + post‑mutation refresh uses `admin_get_venue_events` only; create/update refresh + reset only on success.
  - File: `src/pages/AdminVenueEdit.tsx`
- **Owner events refresh hardened** — owner create/update refresh + reset only on success (`handleSaveEvent`, `src/pages/MyVenueEdit.tsx`).
  - File: `src/pages/MyVenueEdit.tsx`
- **Admin photo add/delete RPCs (2129) + path validation (2130) + storage‑first delete**
  - Migrations: `supabase/migrations/2129_admin_venue_photo_rpcs.sql`, `supabase/migrations/2130_harden_venue_photo_path_validation.sql`
  - File: `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx`
- **Photo upload rollback on DB insert failure (UI)** — if `*_add_venue_photo` fails after storage upload, `VenuePhotosCard` now attempts `storage.remove([storagePath])` and toasts “Upload rolled back” or “cleanup failed”.`
  - File: `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx`
- **Save UX honesty** — standardized status chip (“Auto‑saves” vs “Save each row”).
  - Files: `src/components/ui/AutoSaveChip.tsx`, `src/pages/MyVenueEdit.tsx`, `src/pages/AdminVenueEdit.tsx`
- **Schema snapshot scripts (repo‑local)** — schema/roles dumps under `docs/db/` so Codex can reference DB shape during hardening.
  - Files: `docs/db/schema.sql`, `docs/db/roles.sql`, `docs/db/README.md`

---

## B) Local schema dump commands (for Codex)

### Option A: Supabase CLI (preferred when available)

```bash
mkdir -p docs/db

# confirm local stack + get the DB URL
supabase status

# set DB_URL using the value shown under “Database URL”
export DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"  # example

# schema (schema-only)
supabase db dump --db-url "$DB_URL" -f docs/db/schema.sql

# roles/grants (globals-only)
supabase db dump --db-url "$DB_URL" --role-only -f docs/db/roles.sql
```

### Option B: Docker exec into the local Postgres container (avoids pg_dump version mismatch)

```bash
mkdir -p docs/db

# find the current DB container name
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -i supabase_db

# example container name: supabase_db_reelyratedv3
export DB_CONTAINER="supabase_db_reelyratedv3"

docker exec -t "$DB_CONTAINER" pg_dump -U postgres -d postgres \
  --schema-only --no-owner --no-privileges \
  > docs/db/schema.sql

docker exec -t "$DB_CONTAINER" pg_dumpall -U postgres --globals-only \
  > docs/db/roles.sql
```

Notes:

- Prefer committing **schema + roles only** (no data dumps).
- Container names can change across resets/projects; always rediscover with `docker ps`.

---

## C) DB‑first coverage matrix (admin save → DB → public read → render → cache)

Legend: ✅ DB‑first, ⚠️ partial/dual source, ❌ not DB‑first.

| Feature                                                                                     | Admin UI source                         | Save mechanism                                                | DB storage                             | Public read + key                                                                                        | Public render                               | Invalidation                          | DB‑first |
| ------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------- | -------- |
| Venue metadata (ticket type, price_from, payment fields, contact, facilities, booking URLs) | `MyVenueEdit.tsx`, `AdminVenueEdit.tsx` | `owner_update_venue_metadata` / `admin_update_venue_metadata` | `public.venues`                        | `get_venue_by_slug` via `qk.venueBySlug(slug)`                                                           | `viewModel.ts` → `PlanYourVisitSection.tsx` | `qk.venueBySlug(slug)`                | ✅       |
| Booking enabled                                                                             | BookingCard                             | `owner_update_venue_booking` / `admin_update_venue_booking`   | `venues.booking_enabled`               | `get_venue_by_slug` via `qk.venueBySlug(slug)`                                                           | hero CTAs + Plan Your Visit                 | `qk.venueBySlug(slug)`                | ✅       |
| Pricing tiers + audience                                                                    | PricingTiersCard                        | `owner/admin_*_venue_pricing_tier`                            | `venue_pricing_tiers`                  | select via `qk.venuePricingTiers(venueId)`                                                               | Plan Your Visit                             | `qk.venuePricingTiers(venueId)`       | ✅       |
| Opening hours                                                                               | OpeningHoursCard                        | `owner/admin_*_venue_opening_hour`                            | `venue_opening_hours`                  | select via `qk.venueOpeningHours(venueId)`                                                               | Plan Your Visit                             | `qk.venueOpeningHours(venueId)`       | ✅       |
| Rules                                                                                       | RulesCard                               | `owner/admin_update_venue_rules`                              | `venue_rules.rules_text`               | select via `qk.venueRules(venueId)`                                                                      | Plan Your Visit                             | `qk.venueRules(venueId)`              | ✅       |
| Species stock                                                                               | SpeciesStockCard                        | `owner/admin_*_venue_species_stock`                           | `venue_species_stock`                  | select via `qk.venueSpeciesStock(venueId)`                                                               | Plan Your Visit                             | `qk.venueSpeciesStock(venueId)`       | ✅       |
| Events (admin)                                                                              | `AdminVenueEdit.tsx`                    | `admin_*_venue_event`                                         | `venue_events`                         | `admin_get_venue_events` (admin list)                                                                    | admin events list                           | local refresh + public invalidation   | ✅       |
| Events (owner)                                                                              | `MyVenueEdit.tsx`                       | `owner_*_venue_event`                                         | `venue_events`                         | `owner_get_venue_events` (owner list)                                                                    | owner events list                           | local refresh + public invalidation   | ✅       |
| Events (public)                                                                             | n/a                                     | n/a                                                           | `venue_events`                         | `get_venue_upcoming_events` / `get_venue_past_events` via `qk.venueUpcomingEvents`, `qk.venuePastEvents` | Events section                              | invalidated after admin/owner save    | ✅       |
| Photos + primary                                                                            | VenuePhotosCard                         | owner/admin add/delete (2129/2130) + owner/admin set primary  | `venue_photos`                         | `get_venue_photos` via `qk.venuePhotos(venueId)`                                                         | hero + carousel                             | `qk.venuePhotos(venueId)`             | ✅       |
| Recent catches                                                                              | AddCatch                                | insert into `public.catches`                                  | `public.catches`                       | `get_venue_recent_catches` via `qk.venueRecentCatches(venueId)`                                          | `RecentCatchesSection.tsx`                  | invalidated after AddCatch            | ✅       |
| Top catches                                                                                 | AddCatch                                | insert into `public.catches`                                  | `public.catches`                       | `get_venue_top_catches` via `qk.venueTopCatches(venueId)`                                                | record/top catches                          | invalidated after AddCatch            | ✅       |
| Hero stats (total/30d/top species/active anglers + PB label)                                | n/a                                     | n/a                                                           | `public.venue_stats` / `public.venues` | `get_venue_by_slug` via `qk.venueBySlug(slug)`                                                           | `HeroStatsStrip.tsx`                        | invalidated on admin saves + AddCatch | ✅       |

---

## D) Public reads inventory (queries + cache)

Source: `src/pages/venue-detail/hooks/useVenueDetailData.ts`

- `qk.venueBySlug(slug)` → `get_venue_by_slug` (60s stale, no focus refetch)
- `qk.venueRating(userId, venueId)` → `get_my_venue_rating` (60s, no focus refetch)
- `qk.venueOpeningHours(venueId)` → `venue_opening_hours` select
- `qk.venuePricingTiers(venueId)` → `venue_pricing_tiers` select
- `qk.venueRules(venueId)` → `venue_rules` select
- `qk.venueSpeciesStock(venueId)` → `venue_species_stock` select
- `qk.venueUpcomingEvents(venueId)` → `get_venue_upcoming_events`
- `qk.venuePastEvents(venueId)` → `get_venue_past_events` (infinite)
- `qk.venuePhotos(venueId)` → `get_venue_photos`
- `qk.venueTopCatches(venueId)` → `get_venue_top_catches`
- `qk.venueRecentCatches(venueId)` → `get_venue_recent_catches` (infinite)

All reads are DB‑first and use canonical query keys.

---

## E) Security + correctness audit

### RPC safety

- Owner/admin RPCs are SECURITY DEFINER with `SET search_path = public, extensions`.
- `owner_*` and `admin_*` functions enforce either `is_venue_admin_or_owner` or `is_admin` checks.

### Public‑only catches (2127)

- `get_venue_recent_catches` / `get_venue_top_catches` explicitly filter `visibility='public'` and `deleted_at IS NULL`.

### Path validation (2130)

- `owner_add_venue_photo` and `admin_add_venue_photo` enforce:
  - non‑empty path
  - no `..`
  - prefix `venue-photos/<venueId>/...`

### Legacy photo path audit

Audit query:

```sql
select id, venue_id, image_path
from public.venue_photos
where image_path is null
   or image_path not like ('venue-photos/' || venue_id::text || '/%')
   or image_path like '%..%';
```

Result (local DB): **Success. No rows returned.**

---

## F) Performance audit

### Indexes (2128)

Composite indexes align with public hot paths:

- `venue_photos (venue_id, is_primary DESC, created_at DESC)`
- `venue_species_stock (venue_id, created_at)`
- `venue_opening_hours (venue_id, order_index)`
- `venue_pricing_tiers (venue_id, order_index)`

### Index redundancy verification SQL (post‑2131)

```sql
select
  relname as table_name,
  indexrelname as index_name,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
from pg_stat_user_indexes
where relname in ('venue_photos','venue_species_stock','venue_opening_hours','venue_pricing_tiers')
order by relname, idx_scan desc;
```

---

## G) UX honesty + save model audit

### Auto‑save (chip: “Auto‑saves”)

- Booking toggle
- Photos add/delete/primary
- Owners add/remove (admin)

### Row‑save (chip: “Save each row”)

- Opening Hours
- Pricing Tiers (owner + admin)
- Species Stock

### Explicit Save

- Rules (Markdown editor)
- Events (create/update) — per‑form Save action

---

## H) Hardening pass boundaries

- This doc tracks DB‑first correctness, security boundaries, and cache/invalidation on venue public/admin surfaces.
- During hardening we prefer small, testable changes (RLS/RPC correctness, invalidations, indexes, UI honesty).
- UI polish work is separate and must not change data shape, query keys, RPC semantics, or migrations unless explicitly planned.

---

## I) QA checklist (high‑level)

### Public `/venues/:slug`

- Hero stats show “—” when stats are null (no inferred counts).
- Species stock shows DB rows and updates after admin save.
- Primary venue photo controls hero order.
- Recent/top catches return only public catches.

### Owner/Admin edit pages

- Row‑save sections show “Save each row”.
- Auto‑save sections show “Auto‑saves”.
- Admin events show drafts/past after save; create/update refresh + reset only on success.
- Owner events create/update refresh + reset only on success.
- Photo upload: if DB insert fails after storage upload, the uploaded object is rolled back (removed) and a toast confirms rollback/cleanup status (owner + admin).

---

# Venue Public + Admin Audit (DB‑First)

Scope: `/venues/:slug` public venue page + venue owner/admin edit pages.

Status: Living hardening tracker (aligned to migrations **2124–2131** + recent UI‑only admin/owner save‑UX changes).

---

## Executive summary

### Current risks / gotchas (keep an eye on these)

1. **Public venue page is a hot path (many reads) [Medium]** — `/venues/:slug` loads venue + rules + hours + tiers + species + photos + events + catches. This is OK with React Query caching, but any additional reads should be carefully justified.
2. **Edit pages are not React Query‑backed [Medium]** — `MyVenueEdit.tsx` / `AdminVenueEdit.tsx` use local state for most reads; cross‑tab edits won’t auto‑hydrate.
3. **Photo delete is storage‑first [Medium]** — UI deletes the storage object first, then deletes the DB row. If the DB delete fails after storage succeeds, you can temporarily end up with a DB row pointing at a missing file (consider retry/cleanup if this becomes a real‑world issue).
4. **`venue_stats` is global (approved) [Low]** — stats are identical for all viewers by design; keep this in mind when interpreting “active anglers”.
5. **Opening hours ordering is Mon‑first (intentional) [Low]** — stored values are `0=Sun … 6=Sat`, but UI sorts Mon→Sun for display. Keep this explicit.

### Resolved in this hardening pass

- ✅ **Owner events: success‑only refresh/reset (`handleSaveEvent`, `src/pages/MyVenueEdit.tsx`)** — owner create/update now refresh + reset only on success; on error we keep user input.
- ✅ **Admin events: success‑only refresh/reset + admin refresh path only** — admin post‑mutation refresh uses `admin_get_venue_events` only.
- ✅ **Admin photo add/delete RPCs + path validation** — admin add/delete RPCs added (2129) and hardened with path validation (2130).
- ✅ **Legacy photo path audit (local DB)** — audit query returned **0 rows** (no non‑conforming historical paths detected).
- ✅ **Photo upload rollback on DB insert failure** — if storage upload succeeds but `owner_add_venue_photo` / `admin_add_venue_photo` fails, the UI now removes the uploaded object and toasts “Upload rolled back” or “cleanup failed”.
- ✅ **Dropped redundant single‑column `venue_id` indexes** — confirmed unused, composite indexes are chosen by planner, then dropped via `supabase/migrations/2131_drop_redundant_venue_id_indexes.sql`.

---

## Hardening task tracker (focused)

Status legend: **[TODO]** not started, **[DONE]** completed in this hardening pass, **[DEFER]** parked for later.

### Must‑fix before production

- [x] **[DONE] Owner events: success‑only refresh/reset (`handleSaveEvent`, `src/pages/MyVenueEdit.tsx`)** — create/update refresh + reset only on success; on failure: toast + preserve form values.

### Should‑fix soon

- [x] **[DONE] Photo insert failure cleanup** — on DB insert failure after storage upload, the UI removes the uploaded object and toasts success/failure of the rollback. (UI‑only; no new RPCs/migrations/query keys.)
- [x] **[DONE] Legacy photo path audit + cleanup decision** — audit query returned 0 rows locally; no cleanup required.
- [x] **[DONE] Index redundancy audit + drop** — validated via `pg_stat_user_indexes` + `EXPLAIN`, then dropped redundant single‑column indexes via `supabase/migrations/2131_drop_redundant_venue_id_indexes.sql`.

### Nice‑to‑have

- [ ] **[DEFER] Edit pages read via React Query** — reduces staleness across tabs/users; not required for this hardening pass.

---

## A) What changed recently (changelog)

- **Opening hours DOW normalized (2124)** — to `0=Sun … 6=Sat`; UI aligned.
  - Migration: `supabase/migrations/2124_normalize_opening_hours_day_of_week.sql`
- **Venue photos + primary selection (2125)** — `venue_photos.is_primary`, unique partial index, and `get_venue_photos` ordering primary‑first.
  - Migration: `supabase/migrations/2125_venue_photos_primary.sql`
- **Venue stats extended (2126)** — `venue_stats` expanded (e.g., active anglers) and used via `get_venue_by_slug`.
  - Migration: `supabase/migrations/2126_extend_venue_stats_active_anglers.sql`
- **Public‑only catch RPCs hardened (2127)** — `get_venue_recent_catches` + `get_venue_top_catches` enforce `visibility='public'` + `deleted_at IS NULL`.
  - Migration: `supabase/migrations/2127_harden_venue_catch_rpcs_public_only.sql`
- **Venue detail hot‑path composite indexes added (2128)** — composite indexes for photos/species/hours/pricing.
  - Migration: `supabase/migrations/2128_add_venue_detail_indexes.sql`
- **Admin photo add/delete RPCs (2129)** — admin RPCs for photo add/delete.
  - Migration: `supabase/migrations/2129_admin_venue_photo_rpcs.sql`
- **Photo path validation hardening (2130)** — enforced `venue-photos/<venueId>/...` and blocked traversal.
  - Migration: `supabase/migrations/2130_harden_venue_photo_path_validation.sql`
- **Redundant index drops (2131)** — dropped unused single‑column `venue_id` indexes superseded by 2128 composites.
  - Migration: `supabase/migrations/2131_drop_redundant_venue_id_indexes.sql`

Key UI hardening:

- **Admin events refresh hardened** — admin load + post‑mutation refresh uses `admin_get_venue_events` only; create/update refresh + reset only on success.
  - File: `src/pages/AdminVenueEdit.tsx`
- **Owner events refresh hardened** — owner create/update refresh + reset only on success (`handleSaveEvent`, `src/pages/MyVenueEdit.tsx`).
  - File: `src/pages/MyVenueEdit.tsx`
- **Photo storage‑first delete + rollback on insert failure**
  - File: `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx`
- **Save UX honesty** — standardized status chip (“Auto‑saves” vs “Save each row”).
  - Files: `src/components/ui/AutoSaveChip.tsx`, `src/pages/MyVenueEdit.tsx`, `src/pages/AdminVenueEdit.tsx`
- **Schema snapshot scripts (repo‑local)** — schema/roles dumps under `docs/db/` so Codex can reference DB shape during hardening.
  - Files: `docs/db/schema.sql`, `docs/db/roles.sql`, `docs/db/README.md`

---

## B) Local schema dump commands (for Codex)

### Option A: Supabase CLI (preferred when available)

```bash
mkdir -p docs/db

# confirm local stack + get the DB URL
supabase status

# set DB_URL using the value shown under “Database URL”
export DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"  # example

# schema (schema-only)
supabase db dump --db-url "$DB_URL" -f docs/db/schema.sql

# roles/grants (globals-only)
supabase db dump --db-url "$DB_URL" --role-only -f docs/db/roles.sql
```

### Option B: Docker exec into the local Postgres container (avoids pg_dump version mismatch)

```bash
mkdir -p docs/db

# find the current DB container name
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -i supabase_db

# example container name: supabase_db_reelyratedv3
export DB_CONTAINER="supabase_db_reelyratedv3"

docker exec -t "$DB_CONTAINER" pg_dump -U postgres -d postgres \
  --schema-only --no-owner --no-privileges \
  > docs/db/schema.sql

docker exec -t "$DB_CONTAINER" pg_dumpall -U postgres --globals-only \
  > docs/db/roles.sql
```

---

## C) Index redundancy audit (and 2131 confirmation)

### Evidence (your local results)

- Redundant single‑column indexes are **absent** (query returned **0 rows**):

  - `idx_venue_opening_hours_venue_id`
  - `idx_venue_pricing_tiers_venue_id`
  - `idx_venue_species_stock_venue_id`

- Composite indexes remain (these are the hot‑path ones):
  - `idx_venue_opening_hours_venue_order` (`venue_id, order_index`)
  - `idx_venue_pricing_tiers_venue_order` (`venue_id, order_index`)
  - `idx_venue_species_stock_venue_created` (`venue_id, created_at`)

### What to verify after applying 2131 (quick checks)

```sql
-- 1) Redundant indexes should be gone (expect 0 rows)
select tablename, indexname
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'idx_venue_opening_hours_venue_id',
    'idx_venue_pricing_tiers_venue_id',
    'idx_venue_species_stock_venue_id'
  )
order by tablename, indexname;

-- 2) Composite indexes should still exist
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'idx_venue_opening_hours_venue_order',
    'idx_venue_pricing_tiers_venue_order',
    'idx_venue_species_stock_venue_created'
  )
order by tablename, indexname;
```

### Planner check (EXPLAIN)

When you run EXPLAINs like:

- `venue_opening_hours` ordered by `order_index`
- `venue_pricing_tiers` ordered by `order_index`
- `venue_species_stock` ordered by `created_at`

…the plan should reference the composite indexes above (e.g., `Bitmap Index Scan on idx_venue_pricing_tiers_venue_order`).

---

## D) Legacy photo path audit (and result)

Audit query:

```sql
select id, venue_id, image_path
from public.venue_photos
where image_path is null
   or image_path not like ('venue-photos/' || venue_id::text || '/%')
   or image_path like '%..%';
```

Result (local DB): **Success. No rows returned.**

---

## E) QA checklist (high‑level)

### Public `/venues/:slug`

- Hero stats show “—” when stats are null (no inferred counts).
- Species stock shows DB rows and updates after admin save.
- Primary venue photo controls hero order.
- Recent/top catches return only public catches.

### Owner/Admin edit pages

- Row‑save sections show “Save each row”.
- Auto‑save sections show “Auto‑saves”.
- Admin events show drafts/past after save; create/update refresh + reset only on success.
- Owner events create/update refresh + reset only on success.
- Photo upload: if DB insert fails after storage upload, the uploaded object is rolled back (removed) and a toast confirms rollback/cleanup status (owner + admin).

---

## F) Hardening pass boundaries

- This doc tracks DB‑first correctness, security boundaries, and cache/invalidation on venue public/admin surfaces.
- During hardening we prefer small, testable changes (RLS/RPC correctness, invalidations, indexes, UI honesty).
- UI polish work is separate and must not change data shape, query keys, RPC semantics, or migrations unless explicitly planned.
