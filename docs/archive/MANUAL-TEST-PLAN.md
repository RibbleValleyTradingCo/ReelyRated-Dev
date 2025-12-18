# Manual Test Plan – Main DB (Dec 2025)

This checklist is for sanity-testing the **main Supabase DB + main branch** after merging the Phase-1 work (venues, ratings, privacy, blocks, etc).

Use it as a working doc: tick things off, note failures, and turn them into focused bug tickets / Codex prompts.

---

## 0. Priority

- **P0 (must test now)**
  - Auth + profiles basics
  - Catches + visibility
  - Social basics (follows, comments, reactions)
  - Venues (directory + detail + ratings)
  - Blocks & privacy
- **P1 (soon, after P0)**
  - Sessions
  - Notifications
  - Venue owners/admin flows, events, photos
  - Rate limits (smoke tests)
- **P2 (later / nice to have)**
  - Reports, moderation log, user warnings
  - Insights & leaderboard edge cases

Use P0 as your “go/no-go” for main.

---

## A. Auth & Profiles (`profiles`, `admin_users`) – **P0**

### A1. Basic profile lifecycle

- [ ] Sign up a new user (User A).
  - [ ] Confirm a `profiles` row exists.
- [ ] Edit profile:
  - [ ] Change username, full name, bio, location, website.
  - [ ] Changes show on `/profile/:username`.
- [ ] Upload/change avatar:
  - [ ] Avatar shows in navbar.
  - [ ] Avatar shows on profile page.
  - [ ] Avatar shows on feed cards.

### A2. Admin behaviour

(Assumes you have an admin user.)

- [ ] Log in as admin, view another user’s profile.
  - [ ] Admin “staff” UX appears where expected.
  - [ ] Normal profile view does **not** show moderation fields (warn_count, moderation_status, etc).

---

## B. Catches & Sessions – **P0/P1**

### B1. Sessions basics (`sessions`) – **P1**

- [ ] Create a session from the UI (date, title, venue text).
- [ ] Log a catch into that session.
  - [ ] Session appears on `/sessions`.
  - [ ] Session catch count looks correct.
- [ ] Delete/soft delete a session (if supported in UI).
  - [ ] Associated catches disappear from feed/profile.
  - [ ] DB shows `deleted_at` on those catches (if you inspect it).

### B2. Catch creation & editing (`catches`) – **P0**

- [ ] From `/add-catch`, create a catch with:
  - Title
  - Species
  - Weight + unit
  - Method + bait
  - Water type
  - Description
  - Image
- [ ] Confirm:
  - [ ] Catch appears in `/feed`.
  - [ ] Catch appears on your `/profile`.
  - [ ] Catch detail page shows correct metadata + image.

### B3. Visibility rules (`visibility`) – **P0**

You need two users: **User A** (owner) and **User B** (viewer, not admin).

#### Public

- [ ] A logs a **public** catch.
  - [ ] Logged out: catch appears in `/feed`.
  - [ ] B sees it in feed and A’s profile.

#### Followers-only

- [ ] A logs a **followers** catch.
  - [ ] B **not following** A: cannot see it in feed/search/profile.
  - [ ] B follows A.
  - [ ] Now B can see it in feed/profile.

#### Private

- [ ] A logs a **private** catch.
  - [ ] B cannot see it anywhere.
  - [ ] Logged out cannot see it.
  - [ ] A still sees it on profile and catch detail.

---

## C. Social: Follows, Comments, Reactions, Ratings – **P0**

### C1. Follows (`profile_follows`)

- [ ] B follows A.
  - [ ] Follower/following counts update on both profiles.
- [ ] On `/feed`, switch to “Following” filter:
  - [ ] Only catches from followed users appear.

### C2. Comments (`catch_comments`)

- [ ] A comments on B’s catch.
  - [ ] Comment appears under the catch.
  - [ ] (If wired) B gets a “new comment” notification.
- [ ] A replies to their own comment (thread).
  - [ ] Reply is nested correctly.
- [ ] A deletes/soft-deletes their comment.
  - [ ] UI either removes it or shows a “deleted” stub.
  - [ ] DB has `deleted_at` set (optional check).

### C3. Reactions (`catch_reactions`)

- [ ] B likes A’s catch.
  - [ ] Reaction count increases.
- [ ] B toggles like off and back on.
  - [ ] Only one reaction is counted; no duplicates per user.

### C4. Catch ratings (`ratings`) – **P1**

- [ ] B rates A’s catch.
  - [ ] Average rating and rating count update.
- [ ] Try to rate your own catch.
  - [ ] Should be blocked or disabled (no self-rating).

---

## D. Notifications (`notifications`) – **P1**

- [ ] New follower:
  - [ ] B follows A → A sees “new follower” notification.
  - [ ] Click routes to B’s profile.
- [ ] New comment:
  - [ ] A comments on B’s catch → B sees “new comment” notification.
  - [ ] Click goes to `/catch/:id?commentId=...`.
- [ ] Mention:
  - [ ] B comments on a catch and @mentions A.
  - [ ] A gets `mention` notification.
  - [ ] Click routes to the correct catch detail (ideally scrolls/highlights).
- [ ] Reaction (if notifications exist):
  - [ ] Liking a catch creates a notification that routes correctly.

---

## E. Privacy & Blocks (`profiles.is_private`, `profile_blocks`) – **P0**

- [ ] A sets profile to **private**.
  - [ ] Logged out: A’s profile should be gated.
  - [ ] B not following A: sees private stub / restricted view.
  - [ ] B following A: sees normal profile and catches (respecting visibility).
- [ ] A blocks B.
  - [ ] B can’t see A’s catches in feed, venues, or comments.
  - [ ] B visiting `/profile/:A` sees blocked stub or is prevented.
  - [ ] A doesn’t see B’s content (if symmetric behaviour).
- [ ] A unblocks B.
  - [ ] Content visibility returns to normal.

---

## F. Venues Core (`venues` & RPCs) – **P0**

### F1. Directory `/venues`

- [ ] Page loads with no errors.
- [ ] Search:
  - [ ] Type part of a venue name → only matching cards remain.
- [ ] Filters:
  - [ ] Ticket type: selecting each option filters as expected.
  - [ ] Carp-only: hides non-carp venues.
- [ ] Sort:
  - [ ] A–Z: sorted by name.
  - [ ] Most catches: check counts in cards vs order.
  - [ ] Most active (last 30 days): order matches “last 30 days” stats.
  - [ ] Highest rated: rated venues first; tie-breaker feels sane (rating then count then name).

### F2. Thumbnails & venue-linked catches – **P0**

Check the fallback chain: **venue photo → record catch → recent catch → placeholder**.

1. **Venue with a venue photo**

   - [ ] `/venues` card shows venue photo thumbnail.
   - [ ] `/venues/:slug` uses same image where appropriate (hero/record).

2. **Venue with no photo but with a record catch**

   - [ ] Ensure venue has a catch with `venue_id` set and `get_venue_top_catches` returns it.
   - [ ] Card shows the record catch image (NOT placeholder).
   - [ ] Venue detail record card also uses this image.

3. **Venue with no photo, but with recent catches only**

   - [ ] Card shows the most recent catch image.

4. **Venue with no catches at all**
   - [ ] Card uses placeholder image.
   - [ ] Venue detail page shows placeholder + “no record yet” state.

> Any failures here become immediate bugs to fix (we already know #2/3 have broken on main).

### F3. Venue detail `/venues/:slug`

- [ ] Hero:

  - [ ] Name, location, tagline all correct.
  - [ ] Micro rating line: `X.X ⭐ (N)` or “No ratings yet”.
  - [ ] “Your rating” stars present for logged-in users; login prompt for anon.

- [ ] CTA row (hero left column):

  - [ ] Maps opens the correct map / directions.
  - [ ] Website opens venue website.
  - [ ] Booking opens booking URL if present.
  - [ ] Call triggers tel: link if phone exists.
  - [ ] “Log a catch here” sends you to `/add-catch?venue=slug` with venue prefilled.

- [ ] Venue record + stats (hero right column):

  - [ ] If record exists: image, weight, species, angler, date, “View catch” works.
  - [ ] If not: placeholder + “Log a catch here”.
  - [ ] Venue stats card under record:
    - Total catches on ReelyRated.
    - Last 30 days + flame when “hot”.
    - Top species list or “No species data yet”.

- [ ] Visiting Us band (left column below hero/CTAs):

  - [ ] With photos: nice gallery (venue photos first, then catch fallbacks).
  - [ ] With no photos but catches: uses catch images as fallback.
  - [ ] With neither: friendly empty state; admin/owner hints to add photos.

- [ ] Plan your visit (right column):

  - [ ] Tickets/pricing show correctly.
  - [ ] Phone / website / booking displayed.
  - [ ] best_for and facilities chips look tidy.

- [ ] Events:

  - [ ] Upcoming tab shows future events (correct times).
  - [ ] Past tab shows historical events.
  - [ ] Empty states look OK with no events.

- [ ] Community catches:
  - [ ] Grid shows only catches with that `venue_id`.
  - [ ] “View all catches from this venue” → `/feed?venue=slug` with venue filter active.

---

## G. Venue Ratings (`venue_ratings`) – **P0**

- [ ] As logged-in User A:
  - [ ] Rate a venue (1–5).
  - [ ] No error toast; RPC succeeds.
  - [ ] Hero micro rating updates (avg & count).
  - [ ] `/venues` card shows micro rating line.
  - [ ] Sorting by “Highest rated” moves venue appropriately.
- [ ] As User B, rate same venue.
  - [ ] Averages & count update and reconcile with expectations.

---

## H. Venue Owners & Admin Flows – **P1**

- [ ] `/admin/venues`:
  - [ ] Lists venues with stats.
  - [ ] Links to public page and admin edit page.
- [ ] `/admin/venues/:slug`:
  - [ ] Edit tagline, ticket_type, price_from, tags, facilities, URLs, contact.
  - [ ] Changes reflected on:
    - `/venues` cards.
    - `/venues/:slug` hero / Plan your visit.
- [ ] `/my/venues` + `/my/venues/:slug` (owner flows):
  - [ ] Shows only venues where you’re the owner.
  - [ ] Edits within allowed fields behave correctly.

---

## I. Moderation, Reports, Warnings – **P2**

- [ ] From a catch, file a report.
  - [ ] Row appears in `reports` table.
  - [ ] Any admin UI for reports updates accordingly.
- [ ] As admin, change report status to resolved/dismissed.
- [ ] Issue a user warning (if UI exists):
  - [ ] `user_warnings` row created.
  - [ ] Warned user can see their warning somewhere (if implemented).

---

## J. Rate Limits (`rate_limits`) – **P2**

- [ ] Try to exceed comment rate limit from a single user (e.g. >20/hour if you can simulate).
  - [ ] You eventually hit `RATE_LIMITED: comments – max N per hour` error.
  - [ ] UI shows a friendly toast based on that error.

---

## K. Notes & Follow-ups

Use this area to jot down issues found while running the plan:

- [ ] BUG:
  - Notes:
- [ ] BUG:
  - Notes:
- [ ] UX tweak:
  - Notes:

Once P0 is fully ticked and any red items have a bug ticket / Codex prompt, main is in a decent place to treat as your new baseline.
