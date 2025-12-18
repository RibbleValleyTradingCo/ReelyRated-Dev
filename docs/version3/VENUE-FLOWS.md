# Venue Flows – Directory, Detail, Owner Tools

Environment:

- **Env:** Local Docker (Supabase + Vite dev)
- **Frontend:** http://localhost:8081
- **DB:** Fresh local DB, test users + seed venues only

Test users (recommended)

- **User A** – main test account (you).
- **User B** – second normal user.
- **User C** – optional third user (for block/stranger checks).

Test venues (recommended)

- **Venue V1 – Public carp lake**
  - At least a few public catches from User A and/or B.
- **Venue V2 – Another public venue**
  - Optional, for pagination/search checks.
- **(Optional) Venue owner account**
  - If venue-owner flows are wired, designate one user as the owner/admin of V1.

---

## 1. Venue Directory

### 1.1 VENUE-DIR-001 – Directory loads and lists venues

**Goal:** Ensure the main venue directory loads without errors and shows venues with sensible summary info.

**Steps**

1. Sign in as **User A**.
2. Navigate to the venue directory (e.g. `/venues` or the venues tab/link in the shell).
3. Ensure at least V1 and (optionally) V2 exist in the DB.

**Expected**

- Page renders without React/Supabase errors.
- Venue list/grid shows:
  - Venue name.
  - Location/region (if stored).
  - Summary stats (e.g. catches count, ratings, or a simple “X recent catches”).
- Clicking a venue takes you to that venue’s detail page.
- If there are no venues, a clear empty-state message is shown.

**Result log**

- _TODO – to be filled during manual pass._

---

### 1.2 VENUE-DIR-002 – Directory search / filters (if implemented)

**Goal:** Verify that searching/filtering the venue directory works as designed.

**Steps**

1. On the venue directory page as **User A**:
   - Use any search bar to search for V1 by name (e.g. “Test Carp Lake”).
   - If filters exist (region/species/etc.), apply one that should include V1 and exclude others.
2. Clear the search/filter and confirm the directory returns to the full list.

**Expected**

- Search by name:
  - Shows V1 when searching for its name (or partial name).
  - Does not show unrelated venues.
- Filters (if present):
  - Include the correct venues based on the selected filter.
  - Do not include obviously unrelated venues.
- Clearing search/filters returns to the full directory view.
- No React/Supabase errors.

**Notes**

- If search/filters are not implemented yet, document current behaviour and treat as a feature gap, not a bug.

**Result log**

- _TODO – to be filled during manual pass._

---

## 2. Venue Detail – Public View

### 2.1 VENUE-DETAIL-001 – Basic layout & hero

**Goal:** Confirm the venue detail page renders the correct hero information and layout for a public venue.

**Steps**

1. As **User A**, open the detail page for V1 (via directory or direct URL).
2. Inspect the hero and top section:
   - Venue name, location, and any tagline/description.
   - Hero image/banner (if configured).
   - Primary stats row (e.g. total catches, average rating, top species).

**Expected**

- Page renders without errors.
- Hero section shows:
  - Correct venue name and location.
  - Any configured hero image (or a sensible default if none).
- Stats row shows reasonable values for V1 (non-zero if seeded).
- Any “Log a catch at this venue” CTA:
  - Is visible for **normal users**.
  - Is hidden or blocked for **admin accounts**, consistent with the “admins can’t create catches” rule.

**Result log**

- _TODO – to be filled during manual pass._

---

### 2.2 VENUE-DETAIL-002 – Recent and top catches for venue

**Goal:** Verify recent/top catches widgets on the venue detail page show the right catches and respect soft delete and visibility.

**Steps**

1. Ensure V1 has:
   - At least two public catches by **User A** and/or **User B**.
2. As **User A**, open V1’s venue detail page.
3. Look at:
   - Recent catches section (e.g. a list/grid of latest catches).
   - Any “top catches” / highlight section.
4. Soft delete test (if you want to combine):
   - As the owner of one catch at V1, delete that catch (CATCH-003).
   - Refresh the venue detail page.

**Expected**

- Recent catches:
  - Show only non-deleted catches for V1.
  - Do not show catches from other venues.
- Top catches (if present):
  - Show the heaviest/most noteworthy catches for V1 only.
- After soft-deleting a catch:
  - That catch disappears from the venue’s recent/top lists.
  - Counts/stats update accordingly (if wired).
- No 4xx/5xx or RLS errors loading venue catches.
- Enum `weight_unit` issues (e.g. legacy `"lb"` values) are handled by migrations `2101_normalize_weight_units_and_fix_venue_rpcs.sql` and `2102_fix_weight_unit_case_in_venue_rpcs.sql`; venue RPCs no longer return 400/`22P02` errors when loading recent/top catches.

**Result log**

- 2025-12-07 – ✅ Verified in local Docker: recent/top venue RPCs return 200 and recent/top widgets render correctly after applying migrations 2101 & 2102.

---

### 2.3 VENUE-DETAIL-003 – Block & visibility rules on venue page

**Goal:** Ensure the venue detail page respects blocking/visibility rules for catches and comments, consistent with the core social flows.

**Steps**

1. Ensure V1 has:
   - At least one catch by **User B**.
2. As **User A**, block **User B** using the blocking UI.
3. As **User A**, open V1’s venue detail page again.
4. Check:
   - Recent catches section.
   - Any comments/discussion related to V1 (if present).
5. Optionally:
   - As **User B**, open V1 and verify behaviour when viewing A’s content (if symmetric blocking is intended).

**Expected**

- From A’s perspective:
  - B’s catches no longer appear in the venue’s recent/top catch lists.
  - B’s comments related to V1 are hidden, in line with the global block behaviour.
- From anon/admin:
  - Anon sees public data without block-based filtering (consistent with global design).
  - Admin sees all data (bypassing blocks) for moderation.
- No leakage of blocked content on the venue page.

**Result log**

- 2025-12-08 – ✅ Verified in local Docker: after A blocks B, B’s catches no longer appear on V1’s venue detail page for A; anon and admin still see B’s catches; no errors observed.

- Note: On venue “top catches” lists, blocked anglers’ rows are removed entirely for the viewer, so ranks shift up (e.g. if B was #1 and A blocks B, A may now see their own catch in the top spot). This is acceptable for v3, but we may later align venue leaderboards with the global leaderboard pattern (global rankings + gated drill-down).

  • TODO (post-v3): Align venue top-catches behaviour with global leaderboard (global rankings + gated drill-down, no rank shifting when blocking).

---

## 3. Venue-Linked Catch Flows

### 3.1 VENUE-CATCH-001 – Log catch from venue detail

**Goal:** Confirm that logging a catch from a venue detail page works for normal users and is correctly restricted for admins.

**Steps**

1. As **User A** (normal user, not admin), open V1’s venue detail page.
2. Use the “Log a catch at this venue” (or equivalent) CTA.
3. Fill in the add-catch form:
   - Confirm the venue field is prefilled with V1 (or clearly linked to V1).
4. Save the catch and wait for redirect.
5. Return to V1’s venue detail page and check recent/top catches.
6. As an **admin user**, open the same venue detail page and observe available CTAs.

**Expected**

- For **User A**:
  - The “Log a catch at this venue” CTA is visible on V1’s detail page.
  - The add-catch form either:
    - Prefills the venue selection with V1, or
    - Clearly associates the new catch with V1 upon save.
  - After saving:
    - The catch appears under V1’s recent/top catches.
    - The catch appears in A’s profile and in the main feed.
- For **admin users**:
  - The venue “Log a catch” CTA is not shown; admins see admin-only options instead.
  - Admins cannot create catches (consistent with the global “admins can’t create catches” rule).
- No React/Supabase errors are seen in the console or Network tab during these flows.

**Result log**

- 2025-12-08 – ✅ Verified in local Docker: normal users see “add catch” CTAs and their catches appear on venue detail/profile/feed; admins see admin-only options with no “add catch” button; no errors observed.

---

### 3.2 VENUE-CATCH-002 – Soft-deleted catches vanish from venue

**Goal:** Ensure soft-deleting a catch removes it from venue lists and stats, while preserving the DB row.

**Steps**

1. As **User A**, create a catch at V1 (via VENUE-CATCH-001 or standard add-catch).
2. Confirm it appears on:
   - V1’s venue detail page in recent/top catches.
3. Use the delete catch flow (CATCH-003) to delete the catch.
4. Refresh:
   - V1’s venue detail page.
   - A’s profile page.

**Expected**

- The deleted catch no longer appears:
  - On V1’s venue detail (recent/top catches).
  - On A’s profile.
- Other users cannot see the deleted catch from any venue surface.
- In the DB, the catch row still exists with `deleted_at` populated (soft delete).
- Venue stats (if shown) do not count the deleted catch.

**Result log**

- 2025-12-08 – ✅ Verified in local Docker: soft-deleted catch no longer appears in V1’s venue recent/top lists or on the owner’s profile; `deleted_at` is populated in `public.catches` for the catch.

---

## 4. My Venues / Owner Tools

_This section assumes there is some concept of venue owners/managers in the app. If not, treat these as future/feature-gap checks._

### 4.1 VENUE-OWNER-001 – “My venues” list

**Goal:** Verify that venue owners can see a list of venues they manage.

**Steps**

1. Sign in as the designated **venue owner** for V1 (if configured).
2. Navigate to the “My venues” or equivalent owner dashboard.
3. Observe the list of venues.

**Expected**

- V1 appears in the owner’s venue list.
- Any basic stats (catches, ratings, etc.) look reasonable.
- Non-owner users do not see this owner-specific list (or see an empty state).

**Result log**

- _TODO – to be filled during manual pass._

---

### 4.2 VENUE-OWNER-002 – Edit venue metadata (if implemented)

**Goal:** Confirm that venue owners can edit allowed metadata fields (e.g. description, website) and that changes propagate.

**Steps**

1. As the venue owner for V1, open the venue detail or owner-edit screen for V1.
2. Update:
   - Description and/or website link.
3. Save changes.
4. As a normal user (User A/B), re-open V1’s venue detail page.

**Expected**

- Owner can modify only allowed fields (no direct editing of system-managed stats).
- After save:
  - Updated description/website appear on the public venue detail page.
- No RLS or permission errors.
- Non-owners cannot see or use the edit controls.

**Notes**

- If owner-editing is not implemented, document current behaviour as a feature gap.

**Result log**

- _TODO – to be filled during manual pass._

---

## 5. Admin / Moderation – Venues

### 5.1 VENUE-ADMIN-001 – Admin view of venue pages

**Goal:** Ensure admins see venue pages appropriately for moderation without conflicting with normal user flows.

**Steps**

1. Sign in as an **admin user**.
2. Open:
   - Venue directory.
   - V1 venue detail page.
3. Check:
   - Visible CTAs (Log a catch, owner tools, etc.).
   - Any admin-specific moderation links (if implemented).

**Expected**

- Admin can:
  - View venue directory and detail pages without errors.
- Admin does **not** see normal user CTAs that conflict with “admins are moderation-only” (e.g. “Log a catch at this venue” should be hidden/blocked).
- If admin-specific venue moderation tools exist, they are visible only to admins.
- No RLS errors when admins view venue-related data.

**Result log**

- _TODO – to be filled during manual pass._
