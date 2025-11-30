# Profile page refactor plan

Context: `src/pages/Profile.tsx` has grown large and now covers multiple concerns:

- Normal angler profiles (self + other)
- Admin/staff profiles (self + public view)
- Deleted profile stub
- Blocked-viewer stub
- Block / unblock UI
- Follow / unfollow UI
- Notifications section
- Following strip
- Catches grid / cards
- Derived stats

This refactor is **presentation/structure only**. Behaviour, data fetching, RPC usage, and hook ordering must stay the same.

---

## Goals

- Make `Profile.tsx` easier to understand and maintain.
- Separate **container logic** (data fetching, derived state, branching) from **presentation components**.
- Avoid regressions in:
  - Block / unblock behaviour
  - Deleted-profile handling
  - Admin vs non-admin views
  - Private-profile gating & RLS assumptions

No SQL/migrations or new RPCs are allowed in this refactor.

---

## High-level structure

After refactor:

- `src/pages/Profile.tsx`

  - Remains the **container** and route entry point.
  - Keeps **all hooks** (Supabase queries / effects / state).
  - Computes all derived booleans & stats.
  - Decides which variant to render:
    - Not found
    - Deleted stub
    - Blocked-viewer stub
    - Loading state
    - Admin self view
    - Admin public view
    - Normal profile (own vs other)
  - Passes plain props into smaller **presentational components**.

- New components under `src/components/profile/`:

  - `ProfileDeletedStub.tsx`
  - `ProfileBlockedViewerStub.tsx`
  - `ProfileHero.tsx`
  - `ProfileAdminModerationTools.tsx`
  - `ProfileAboutStaffCard.tsx`
  - `ProfileAnglerStatsSection.tsx`
  - `ProfileFollowingStrip.tsx`
  - `ProfileCatchesGrid.tsx`

Names can be tweaked if needed, but they should live in a `profile/` folder and map closely to current sections in `Profile.tsx`.

---

## Component responsibilities & props

### 1. `ProfileDeletedStub`

**File:** `src/components/profile/ProfileDeletedStub.tsx`

**Responsibility:** Render the “account has been deleted” card seen by:

- Deleted self
- Non-admin viewer of a deleted profile

**Props (suggested):**

- `isOwnProfile: boolean`

**Behaviour:**

- Pure presentational: no hooks.
- Copy and layout must match existing deleted stub in `Profile.tsx`.

---

### 2. `ProfileBlockedViewerStub`

**File:** `src/components/profile/ProfileBlockedViewerStub.tsx`

**Responsibility:** Render the “This angler isn’t available” stub when viewer is blocked by profile owner.

**Props:**

- none (just static copy + “Back to feed / Browse venues” links)

**Behaviour:**

- Pure presentational.
- `Profile.tsx` is responsible for deciding when to show this stub.

---

### 3. `ProfileHero`

**File:** `src/components/profile/ProfileHero.tsx`

**Responsibility:**

- Render the top hero for all profile variants:
  - Normal angler (self + other)
  - Admin self
  - Admin public view
- Handle hero background styling, avatar, username, staff pill, bio, and hero-level actions.

**Props (suggested – can be adjusted):**

- `profile` (shape matching the Profile interface used in `Profile.tsx`)
- `profileAvatarUrl: string | null`
- `isOwnProfile: boolean`
- `isAdminProfile: boolean`
- `isAdminViewer: boolean`
- `isAdminSelf: boolean`
- `isAdminPublicView: boolean`
- `isUsingStaffBioFallback: boolean`
- `bio: string`
- `bioExpanded: boolean`
- `onToggleBioExpanded: () => void`
- `heroStatTiles: { label: string; value: string | number; hint?: string | null }[]`
- `showStatusPill: boolean`
- Action callbacks / flags:
  - `onAddCatch?`
  - `onEditProfile?`
  - `onViewStats?`
  - `onOpenSettings`
  - `onViewFeed`
  - `onModeration?`
  - `onReports?`
  - `onAuditLog?`
  - `onFollowToggle?`
  - `onBlockToggle?`
  - `isFollowing?`
  - `followLoading?`
  - `isBlockedByMe?`
  - `blockLoading?`

**Important:** All logic (when to show which button) can stay in `Profile.tsx` if simpler; `ProfileHero` can either:

- Receive a **pre-built `primaryActions` / `secondaryActions` array**, or
- Receive booleans & callbacks and decide layout.

Either approach is acceptable as long as behaviour is unchanged.

---

### 4. `ProfileAdminModerationTools`

**File:** `src/components/profile/ProfileAdminModerationTools.tsx`

**Responsibility:** The “Moderation tools” card grid shown on **admin self** view.

**Props:**

- `profileId: string | null` (for building moderation link)
- Precomputed URLs (optional) if you prefer:
  - `userModerationPath?: string`
  - `reportsPath: string`
  - `auditLogPath: string`

**Behaviour:**

- No data fetching.
- Purely renders links/buttons with existing copy.

---

### 5. `ProfileAboutStaffCard`

**File:** `src/components/profile/ProfileAboutStaffCard.tsx`

**Responsibility:** The “About ReelyRated staff” section shown to **public visitors** of an admin profile.

**Props:** none (current copy is static).

---

### 6. `ProfileAnglerStatsSection`

**File:** `src/components/profile/ProfileAnglerStatsSection.tsx`

**Responsibility:** The “Angler stats” block shown on normal profiles (not admin profiles).

**Props:**

- `statsCards: { label: string; value: string | number; hint?: string | null; icon: ReactNode }[]`

**Behaviour:**

- Pure presentational, no hooks.
- Uses the same layout & classes as currently in `Profile.tsx`.

---

### 7. `ProfileFollowingStrip`

**File:** `src/components/profile/ProfileFollowingStrip.tsx`

**Responsibility:** “Anglers you follow / X follows” section.

**Props:**

- `isOwnProfile: boolean`
- `username: string`
- `followingProfiles: { id; username; avatar_path; avatar_url; bio }[]`
- `onNavigateToFeed: () => void`

**Behaviours:**

- Handles empty state vs strip of cards.
- Uses `getProfilePath` + `resolveAvatarUrl` imported at this level (no new logic).

---

### 8. `ProfileCatchesGrid`

**File:** `src/components/profile/ProfileCatchesGrid.tsx`

**Responsibility:** Catches section:

- Heading line (“Your catches” vs “X’s catches”)
- Private-account lock state
- Empty state CTA
- Grid of catch cards

**Props (suggested):**

- `isOwnProfile: boolean`
- `username: string`
- `catches: Catch[]` (reuse existing interface)
- `isPrivateAndBlocked: boolean`
- `onLogCatch: () => void`
- `onViewFeed: () => void`
- `onOpenCatch: (id: string) => void`

**Behaviour:**

- Pure presentational.
- Formatting functions `formatWeight` and `formatSpecies` can either:
  - Stay in `Profile.tsx` and be passed as helpers, or
  - Be imported in the new component from a shared util file.
- Must preserve current behaviours (clicking a card navigates to `/catch/:id`, venue link stops propagation, etc.).

---

## Container responsibilities after refactor (`Profile.tsx`)

`Profile.tsx` must still:

- Own all React hooks:
  - Auth, router hooks
  - Supabase queries / effects
  - Block status checks
  - Admin checks
  - Stats calculation
- Compute all derived booleans & helper data:
  - `isOwnProfile`
  - `isDeleted`, `isDeletedBanner`
  - `isAdminViewer`, `isAdminProfileOwner`, `isAdminSelf`, `isAdminPublicView`
  - `isBlockedByMe`, `isViewerBlockedByProfileOwner`, `shouldShowBlockedViewerStub`
  - `canViewPrivateContent`, `isPrivateAndBlocked`
  - `overallStats`, `statsCards`, `heroStatTiles`
  - `displayBio`, `isUsingStaffBioFallback`
- Maintain **existing early returns**, in this order:
  1. `isNotFound` → `ProfileNotFound`
  2. Deleted stub (non-admin)
  3. Blocked-viewer stub (once loading + blockStatusLoading are false)
  4. General loading state
  5. Main profile layout (admin or normal)

And then compose:

- `<ProfileDeletedStub />`
- `<ProfileBlockedViewerStub />`
- `<ProfileHero />`
- `<ProfileAdminModerationTools />`
- `<ProfileAboutStaffCard />`
- `<ProfileAnglerStatsSection />`
- `<ProfileFollowingStrip />`
- `<ProfileCatchesGrid />`
- `<ProfileNotificationsSection />` (existing)

---

## Non-negotiables / guardrails

- **No changes** to:
  - Supabase RPC names or parameters
  - SQL / RLS assumptions
  - Block/unblock or follow/unfollow logic
  - Comment / catch visibility logic
- **No hook reordering** in `Profile.tsx`.
- Types should remain compatible; any new props/interfaces should be thin wrappers over existing shapes.
- Visual design should remain materially the same, apart from the existing admin vs non-admin distinctions already implemented.

This is a **structural refactor** only.
