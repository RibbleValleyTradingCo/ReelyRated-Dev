# Profile Privacy – Design (Implemented: schema, UI, and basic RLS)

This document describes the approach for “public vs private” profiles in ReelyRated. Schema, settings toggle, profile stub, and RLS on catches/comments are implemented. Feed/search/browse reuse the RLS and existing client guards; block/mute integration is future work.

The goal is to let anglers mark their account as **private**, so only followers (and admins) can see their catches and detailed profile content. This must integrate cleanly with existing RLS, feed/search RPCs, and moderation.

---

## 1. Goals

- Allow users to choose between:
  - **Public profile** – current behaviour (anyone can see their catches, subject to catch visibility).
  - **Private profile** – only:
    - The owner,
    - Their followers,
    - Admins
      can see their catches and certain details.
- Ensure **no private content leaks** into:
  - Feed,
  - Search results,
  - Future browse/leaderboard surfaces,
    for non-followers.
- Keep admin tools (reports, moderation) working as today.

---

## 2. Non-goals (for this phase)

- Private catches independent of profile privacy (we already have per-catch visibility).
- Fine-grained controls like “show profile but hide catches to non-followers”.
- Per-follower lists or close-friends/crew features.
- Email flows or messaging tied to privacy changes.

These can be layered on top later.

---

## 3. Data Model & Schema

### 3.1 profiles

Add a simple privacy flag:

- `profiles.is_private BOOLEAN NOT NULL DEFAULT FALSE`

Indexes:

- Consider an index for privacy filters:
  - `CREATE INDEX idx_profiles_is_private ON public.profiles (is_private);`

Semantics:

- `is_private = FALSE` (default):
  - Profile behaves as today.
- `is_private = TRUE`:
  - Profile is considered private.
  - Catches from this profile should only be visible to:
    - The profile owner,
    - Followers,
    - Admins.

No changes to existing moderation fields (`moderation_status`, `warn_count`, etc.).

---

## 4. Behaviour

### 4.1 Visibility Rules (High-Level)

For a given viewer `viewer_id` and profile `profile_id`:

- **Owner view** (viewer_id = profile_id):
  - Can see everything as today (their own catches, stats, etc.), regardless of `is_private`.
- **Admin view** (viewer is in `admin_users`):
  - Can see everything for moderation (even if `is_private = TRUE`).
- **Follower view**:
  - If `viewer_id` follows `profile_id`:
    - Can see catches and profile details, subject to per-catch visibility as today.
- **Non-follower view**:
  - If `is_private = TRUE`:
    - Cannot see catches or certain detailed stats.
    - Should see a “This account is private” stub instead of the catch grid.
  - Profile header (name/avatar) may still be visible to allow discovering/joining.

### 4.2 Feed / Search / Discovery

All **server-side** RPCs/selects now rely on RLS for `catches`/`catch_comments` to respect:

- Profile privacy: `profiles.is_private`.
- Relationship: only return private-profile catches when:
  - Viewer is the owner, OR
  - Viewer is a follower, OR
  - Viewer is admin.

Future browse/leaderboard endpoints must reuse this rule. Client guards remain as a secondary check; RLS is the source of truth.

---

## 5. RLS & RPC Considerations

- RLS policies on `catches` and `catch_comments` now check `profiles.is_private` combined with:
  - Viewer = owner,
  - Viewer is follower (via `profile_follows`),
  - Viewer is admin.
- RLS on `profiles` remains open for discoverability; privacy is enforced on catches/comments. Future contact fields may need RPC-level filtering if added.
- Feed/search currently use client guards; RLS now provides backend enforcement. Future RPCs must not bypass these checks.

---

## 6. Frontend UX

### 6.1 Settings – Privacy Toggle

Location: `ProfileSettings` page (existing “My account” area).

Add:

- A **“Private account”** toggle with helper text, e.g.:

  > **Private account**  
  > Only people who follow you can see your catches. Your profile may still appear in search.

Behaviour:

- Toggling on/off calls a Supabase update on `profiles.is_private` for the logged-in user.
- No change to existing moderation fields.

### 6.2 Profile Page (Viewing Another User)

When viewing `/profile/:slug`:

- If profile is **private** and viewer is **not**:

  - The owner,
  - A follower,
  - Or an admin,

  Then:

  - Show a clear stub in place of the catches grid, e.g.:

    > This account is private  
    > Follow this angler to see their catches and stats.

  - Hide catches grid and potentially detailed stats.
  - Profile hero (avatar, username, basic info) can still show so the account is discoverable.

- If viewer is a follower or admin:
  - Page behaves as normal (as today).

Implementation detail:

- The frontend should rely on:
  - `is_private` flag from profiles,
  - Follow relationship from `profile_follows`,
  - Admin status via `isAdminUser`.

We must not rely solely on client-side checks for privacy; server-side RPCs/RLS must already enforce this.

---

## 7. Manual Test Plan (High Level)

See `PROFILE-PRIVACY-TESTS.md` for detailed cases. Core scenarios:

1. **Owner view**

   - As user A (private account ON):
     - Can see own profile, catches, stats as normal.

2. **Follower vs non-follower**

   - User A sets account to private.
   - User B follows A.
   - User C does not follow A.
   - Check:
     - B can see A’s catches in feed/profile.
     - C cannot see A’s catches (gets private stub) and does not see A’s catches in feed/search.

3. **Admin view**

   - Admin visits private profile:
     - Can see everything, including catches and stats.
   - Admin feed/search:
     - Private catches appear where appropriate.

4. **Feed & search**

   - Private user’s catches:
     - Do not appear in feed/search for non-followers.
     - Do appear for followers and admin.

5. **Toggle behaviour**
   - Flip profile from public → private → public:
     - Verify feed/search behaviour updates accordingly.

---

## 8. Implementation Plan (Incremental)

We’ll follow the usual pattern:

1. **Migration**: add `is_private` to `profiles` (+ index and comments referencing this design doc).
2. **RLS / RPC**:
   - Update feed and search RPCs so they respect `is_private` + follow/admin logic.
   - Add any missing checks in other list endpoints.
3. **Frontend**:
   - Add Settings toggle and helper.
   - Add profile-page stub for non-followers of private accounts.
4. **Docs & Tests**:
   - Create `PROFILE-PRIVACY-TESTS.md` with the scenarios above.
   - Run through tests with at least three users (owner, follower, non-follower) and an admin account.
