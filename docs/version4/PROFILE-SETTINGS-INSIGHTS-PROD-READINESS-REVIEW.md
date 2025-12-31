# Profile / Settings / Insights Production Readiness Review

Date: 2025-12-29  
Commit: 40c966b

## Route map

| Route             | Element                       | Guard/Wrapper                   | Notes                                                                      |
| ----------------- | ----------------------------- | ------------------------------- | -------------------------------------------------------------------------- |
| /insights         | src/pages/Insights.tsx        | RequireAuth -> Layout (App.tsx) | Lazy-loaded; also client-side redirect to /auth in page effect             |
| /profile/:slug    | src/pages/Profile.tsx         | RequireAuth -> Layout (App.tsx) | Lazy-loaded; slug can be username or UUID; redirects to canonical username |
| /settings/profile | src/pages/ProfileSettings.tsx | RequireAuth -> Layout (App.tsx) | Lazy-loaded; also client-side redirect to /auth in page effect             |

## Component map

### Insights

- Page: src/pages/Insights.tsx
- Charting/UI: src/components/insights/TrendLineChart.tsx, StatsCards.tsx, FiltersPanel.tsx, InfoCards.tsx, ChartCard.tsx
- Data utils: src/lib/insights-utils.ts, src/lib/insights-aggregation.ts, src/lib/useInsightsChartData.ts, src/lib/useInsightsFilters.ts

### Profile

- Page: src/pages/Profile.tsx
- Data hook: src/pages/profile/hooks/useProfileData.ts
- Sections: src/components/profile/ProfileHero.tsx, ProfileAnglerStatsSection.tsx, ProfileFollowingStrip.tsx, ProfileCatchesGrid.tsx
- Own-profile only: src/components/ProfileNotificationsSection.tsx, src/hooks/useNotificationsData.ts
- Admin-specific: src/components/profile/ProfileAdminModerationTools.tsx

### Settings

- Page: src/pages/ProfileSettings.tsx
- Sections: src/components/settings/ProfileSettingsNav.tsx, ProfileSettingsAvatarCard.tsx, ProfileSettingsAccountCard.tsx, ProfileSettingsEmailChangeCard.tsx, ProfileSettingsPasswordCard.tsx, ProfileSettingsDataExportCard.tsx, ProfileSettingsPrivacyCard.tsx, ProfileSettingsSafetyBlockingCard.tsx, ProfileSettingsDeleteAccountCard.tsx, ProfileSettingsDangerZoneCard.tsx
- Avatar upload: src/components/settings/ProfileAvatarSection.tsx + src/lib/storage.ts

## Data flow inventory

### Insights

A) Queries (no React Query)

- Direct Supabase reads (inside useEffect):
  - public.catches
    - select: id, created_at, caught_at, weight, weight_unit, location, bait_used, method, time_of_day, conditions, session_id, species
    - filter: user_id = auth.uid
  - public.sessions
    - select: id, title, venue, date, created_at
    - filter: user_id = auth.uid
- Caching: local React state only; no staleTime/refetch controls.

B) Mutations

- None.

C) Supabase usage

- Table reads only: public.catches, public.sessions.

### Profile

A) Queries (React Query)

- qk.profile(slug) in src/pages/profile/hooks/useProfileData.ts
  - public.profiles select: id, username, avatar_path, avatar_url, bio, is_private, is_deleted
  - staleTime=60s, refetchOnWindowFocus=false
- qk.profileFollowerCount(profileId)
  - RPC: get_follower_count(p_profile_id)
- qk.profileFollowing(profileId)
  - public.profile_follows select with joined profiles
- qk.profileCatches(profileId) (useInfiniteQuery)
  - public.catches select: id, user_id, location, hide_exact_spot, visibility, title, image_url, weight, weight_unit, species, created_at, ratings(rating), venues:venue_id(id, slug, name)
  - filters: user_id, deleted_at is null; pagination via range; PAGE_SIZE=24
- qk.profileFollowStatus(viewerId, profileId)
  - public.profile_follows maybeSingle
- qk.profileBlockStatus(viewerId, profileId)
  - public.profile_blocks for both block directions (two reads)
- qk.adminStatus(viewerId), qk.adminStatus(profileId)
  - public.admin_users read via isAdminUser()
- Notifications (own profile only): qk.notificationsList(userId, limit)
  - public.notifications table via fetchNotifications
  - optional realtime channel (enableRealtime=false by default)

B) Mutations

- Follow/unfollow
  - unfollow: public.profile_follows delete
  - follow: RPC follow_profile_with_rate_limit(p_following_id)
  - on success: queryClient.setQueryData for qk.profileFollowStatus + qk.profileFollowerCount
  - side effect: createNotification -> RPC create_notification
- Update bio
  - public.profiles update
  - on success: setQueryData for qk.profile(slug) (and canonical username)
- Block/unblock
  - RPC block_profile / unblock_profile
  - on success: setQueryData for qk.profileBlockStatus
- Notifications
  - markOne: public.notifications update
  - markAll: public.notifications update
  - clearAll: public.notifications delete
  - on success: setQueryData + invalidate qk.notificationsList

C) Supabase usage

- Direct table reads: profiles, catches, profile_follows, profile_blocks, notifications, admin_users
- RPCs: get_follower_count, follow_profile_with_rate_limit, block_profile, unblock_profile, create_notification

### Settings

A) Queries (no React Query)

- public.profiles select: username, full_name, avatar_path, avatar_url, bio, is_private (ProfileSettings load)
- supabase.auth.getUser()
- public.profile_blocks select with joined profiles (blocked list)

B) Mutations

- public.profiles update (profile save)
- public.profiles update (privacy toggle)
- supabase.auth.updateUser (email change + password change)
- RPC request_account_export
- RPC request_account_deletion(p_reason)
- RPC unblock_profile(p_blocked_id)
- supabase.auth.signOut
- Avatar upload to storage bucket "avatars" via uploadAvatarToStorage()

C) Supabase usage

- Tables: profiles, profile_blocks
- RPCs: request_account_export, request_account_deletion, unblock_profile
- Storage: avatars bucket (upload only in UI; DB update occurs on profile save)

## RPC inventory

| RPC                            | Used by               | Purpose                 | Source                                                                   |
| ------------------------------ | --------------------- | ----------------------- | ------------------------------------------------------------------------ |
| get_follower_count             | Profile               | follower count          | src/pages/profile/hooks/useProfileData.ts                                |
| follow_profile_with_rate_limit | Profile               | follow user             | src/pages/profile/hooks/useProfileData.ts                                |
| block_profile                  | Profile               | block user              | src/pages/profile/hooks/useProfileData.ts                                |
| unblock_profile                | Profile + Settings    | unblock user            | src/pages/profile/hooks/useProfileData.ts, src/pages/ProfileSettings.tsx |
| create_notification            | Profile (side effect) | notify on follow        | src/lib/notifications.ts                                                 |
| request_account_export         | Settings              | download account export | src/pages/ProfileSettings.tsx                                            |
| request_account_deletion       | Settings              | delete account          | src/pages/ProfileSettings.tsx                                            |

## Cache / invalidation map

- Profile follow/unfollow: updates qk.profileFollowStatus + qk.profileFollowerCount via setQueryData (no invalidation of other profile keys).
- Profile bio update: setQueryData for qk.profile(slug) and qk.profile(username).
- Profile block/unblock: setQueryData for qk.profileBlockStatus only.
- Notifications: markAll/clearAll invalidate qk.notificationsList; markOne updates cache without invalidation.
- Insights + Settings: no React Query; state is updated locally after mutations.

## Security / RLS notes

- RLS is enabled for profiles, catches, sessions, profile_follows, notifications (see supabase/migrations/1004_policies_and_grants.sql). These pages rely on RLS for privacy and block enforcement.
- profile_blocks has dedicated RLS (supabase/migrations/2085_profile_blocks_rls.sql). Profile/Settings use direct table reads and assume these policies are enforced.
- admin_users has a SELECT policy (supabase/migrations/2036_fix_admin_badge_author_flag.sql). This makes admin IDs readable; UI must not treat this as security (server-side checks must gate admin actions).
- The catches SELECT policy was recently hardened for block/privacy (supabase/migrations/2134_reinstate_catches_feed_visibility.sql). Profile and Insights read public.catches directly; they rely on this policy for privacy and block enforcement.
- profiles SELECT policy is permissive in 1004 (USING true). If moderation fields (moderation_status, warn_count, suspension_until) are stored in profiles, confirm whether they should be publicly readable or moved behind a restricted view/column policy.

## Performance notes

- Insights loads all user catches + sessions in one shot (no pagination) and runs multiple derived aggregations. For large accounts this is a heavy payload and client CPU load.
- Profile makes 6-8 queries on first render (profile, follower count, following list, catches pages, follow status, block status, admin checks). This is acceptable but will produce visible network burst.
- Profile catches query includes ratings(rating) for every catch; this is a potentially large payload and could be trimmed if not needed for the grid.
- Settings loads profile + auth user + blocked list; the blocked list query joins profiles and can grow with long block lists.

## Findings

| Issue                                                                           | Severity | Risk                                                                                                  | Evidence                                                                                                                                                                         | Recommendation                                                                                                             | Scope   |
| ------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------- |
| Privacy/block enforcement for profile catches depends entirely on RLS policy    | P1       | If catches SELECT policy regresses, private/blocked catches could be exposed on profile pages         | Profile uses direct public.catches reads (src/pages/profile/hooks/useProfileData.ts); policy recently adjusted in supabase/migrations/2134_reinstate_catches_feed_visibility.sql | Verify catches SELECT policy includes block + privacy checks and is deployed; add regression tests for profile visibility  | DB/RLS  |
| profiles SELECT policy may expose moderation fields to public viewers           | P1       | moderation_status / warn_count / suspension_until could be readable if profile SELECT is fully public | profiles_select_all policy in supabase/migrations/1004_policies_and_grants.sql uses USING (true)                                                                                 | Audit whether moderation columns exist in profiles and should be public; consider a restricted view or column-level grants | DB/RLS  |
| Admin badge in ProfileSettings is computed with a Promise, likely always truthy | P2       | UI shows admin badge to non-admins (misleading)                                                       | src/pages/ProfileSettings.tsx uses const isAdmin = isAdminUser(user?.id) without await                                                                                           | Convert to async state (or reuse useProfileData admin status)                                                              | UI-only |
| Insights loads unbounded catch history                                          | P2       | Large accounts may experience slow load + heavy charts                                                | src/pages/Insights.tsx fetches all catches/sessions without pagination                                                                                                           | Add pagination or a server-side aggregation RPC for Insights                                                               | UI + DB |
| Error handling relies on message parsing for rate limit                         | P2       | Error handling brittle; message changes break UX                                                      | src/lib/rateLimit.ts + useProfileData follow mutation                                                                                                                            | Prefer SQLSTATE codes for rate limit RPCs and check code, not message                                                      | DB + UI |

## Manual QA checklist (not executed)

- Insights: load with a high-volume account; confirm charts render without timeouts; verify session/date filters update charts correctly.
- Profile: view own profile, a private profile you follow, and a profile that blocked you; confirm correct access gates and empty states.
- Profile: follow/unfollow a user and confirm follower count + CTA state updates.
- Profile: block/unblock a user and confirm blocked state + content visibility.
- Settings: update profile fields, avatar upload, privacy toggle, email/password updates.
- Settings: request export and account deletion flows.

# Profile / Settings / Insights Production Readiness Review

Date: 2025-12-29  
Commit: 40c966b

## TL;DR

**Pages in scope**

- `/insights` → `src/pages/Insights.tsx`
- `/profile/:slug` → `src/pages/Profile.tsx`
- `/settings/profile` → `src/pages/ProfileSettings.tsx`

**Fetching model (do not change in UI phases)**

- Insights: **direct Supabase reads** (no React Query), client-side aggregation.
- Profile: **TanStack React Query** (multi-query + cache writes via `setQueryData`).
- Settings: **direct Supabase reads/writes** + Auth updates; avatars via Storage.

**Top risks**

- **P1**: `public.catches` SELECT policy is the single source of truth for privacy/block enforcement on Profile + Insights.
- **P1**: `public.profiles` SELECT policy appears permissive; if moderation/internal columns exist in `profiles`, this could be a public data leak.
- **P2**: Insights loads unbounded history (payload + client CPU) for large accounts.

**Recommended execution order (UI-only first)**

1. Settings (lowest risk) → 2) Insights → 3) Profile (highest complexity)

---

## Guardrails (Codex must follow)

### UI-only default

- **Do not change** RPC names/signatures, query keys, or invalidate-key structure unless explicitly requested.
- No hacks: no forced reloads/timeouts, no brittle message-string parsing.

### DB/RLS is the enforcement layer

- Do not rely on UI gating for privacy/security.
- If DB work is required, ship it as migrations with explicit grants/revokes and verification SQL.

---

## Route map

| Route               | Element                         | Guard/Wrapper                     | Notes                                                                      |
| ------------------- | ------------------------------- | --------------------------------- | -------------------------------------------------------------------------- |
| `/insights`         | `src/pages/Insights.tsx`        | `RequireAuth -> Layout` (App.tsx) | Lazy-loaded; also client-side redirect to `/auth` in page effect           |
| `/profile/:slug`    | `src/pages/Profile.tsx`         | `RequireAuth -> Layout` (App.tsx) | Lazy-loaded; slug can be username or UUID; redirects to canonical username |
| `/settings/profile` | `src/pages/ProfileSettings.tsx` | `RequireAuth -> Layout` (App.tsx) | Lazy-loaded; also client-side redirect to `/auth` in page effect           |

---

## Component map

### Insights

- Page: `src/pages/Insights.tsx`
- Charting/UI: `src/components/insights/TrendLineChart.tsx`, `StatsCards.tsx`, `FiltersPanel.tsx`, `InfoCards.tsx`, `ChartCard.tsx`
- Data utils: `src/lib/insights-utils.ts`, `src/lib/insights-aggregation.ts`, `src/lib/useInsightsChartData.ts`, `src/lib/useInsightsFilters.ts`

### Profile

- Page: `src/pages/Profile.tsx`
- Data hook: `src/pages/profile/hooks/useProfileData.ts`
- Sections: `src/components/profile/ProfileHero.tsx`, `ProfileAnglerStatsSection.tsx`, `ProfileFollowingStrip.tsx`, `ProfileCatchesGrid.tsx`
- Own-profile only: `src/components/ProfileNotificationsSection.tsx`, `src/hooks/useNotificationsData.ts`
- Admin-specific: `src/components/profile/ProfileAdminModerationTools.tsx`

### Settings

- Page: `src/pages/ProfileSettings.tsx`
- Sections: `src/components/settings/ProfileSettingsNav.tsx`,
  `ProfileSettingsAvatarCard.tsx`, `ProfileSettingsAccountCard.tsx`,
  `ProfileSettingsEmailChangeCard.tsx`, `ProfileSettingsPasswordCard.tsx`,
  `ProfileSettingsDataExportCard.tsx`, `ProfileSettingsPrivacyCard.tsx`,
  `ProfileSettingsSafetyBlockingCard.tsx`, `ProfileSettingsDeleteAccountCard.tsx`,
  `ProfileSettingsDangerZoneCard.tsx`
- Avatar upload: `src/components/settings/ProfileAvatarSection.tsx` + `src/lib/storage.ts`

---

## Data flow inventory (code-grounded)

### Insights (`/insights`)

**Entry**

- Page: `src/pages/Insights.tsx`

**Reads (direct table reads; no React Query)**

- `public.catches`
  - select: `id, created_at, caught_at, weight, weight_unit, location, bait_used, method, time_of_day, conditions, session_id, species`
  - filter: `user_id = auth.uid()`
- `public.sessions`
  - select: `id, title, venue, date, created_at`
  - filter: `user_id = auth.uid()`

**Writes**

- None.

**Caching**

- Local React state only.

**Notes**

- All aggregation is client-side via `insights-aggregation.ts` + `useInsightsChartData.ts`.

---

### Profile (`/profile/:slug`)

**Entry**

- Page: `src/pages/Profile.tsx`
- Hook: `src/pages/profile/hooks/useProfileData.ts`

**Queries (React Query)**

- `qk.profile(slug)`
  - table: `public.profiles` select: `id, username, avatar_path, avatar_url, bio, is_private, is_deleted`
  - `staleTime=60s`, `refetchOnWindowFocus=false`
- `qk.profileFollowerCount(profileId)`
  - RPC: `get_follower_count(p_profile_id)`
- `qk.profileFollowing(profileId)`
  - table: `public.profile_follows` select with joined profiles
- `qk.profileCatches(profileId)` (useInfiniteQuery)
  - table: `public.catches` select: `id, user_id, location, hide_exact_spot, visibility, title, image_url, weight, weight_unit, species, created_at, ratings(rating), venues:venue_id(id, slug, name)`
  - filters: `user_id`, `deleted_at is null`
  - pagination: `range`, `PAGE_SIZE=24`
- `qk.profileFollowStatus(viewerId, profileId)`
  - table: `public.profile_follows` (maybeSingle)
- `qk.profileBlockStatus(viewerId, profileId)`
  - table: `public.profile_blocks` (two reads for both directions)
- `qk.adminStatus(viewerId)` and `qk.adminStatus(profileId)`
  - table: `public.admin_users` via `isAdminUser()`
- Notifications (own profile only): `qk.notificationsList(userId, limit)`
  - table: `public.notifications` via `fetchNotifications`
  - realtime optional (`enableRealtime=false` default)

**Mutations**

- Follow/unfollow
  - follow: RPC `follow_profile_with_rate_limit(p_following_id)`
  - unfollow: delete from `public.profile_follows`
  - success: `setQueryData` for `qk.profileFollowStatus` + `qk.profileFollowerCount`
  - side-effect: `create_notification` RPC
- Update bio
  - update `public.profiles`
  - success: `setQueryData` for `qk.profile(slug)` and canonical username key
- Block/unblock
  - RPCs: `block_profile`, `unblock_profile`
  - success: `setQueryData` for `qk.profileBlockStatus`
- Notifications
  - markOne: update `public.notifications` (cache update)
  - markAll/clearAll: update/delete `public.notifications` + invalidate `qk.notificationsList`

**Notes**

- Privacy correctness for profile catches depends on DB/RLS (see Security notes).

---

### Settings (`/settings/profile`)

**Entry**

- Page: `src/pages/ProfileSettings.tsx`

**Reads (direct; no React Query)**

- `public.profiles` select: `username, full_name, avatar_path, avatar_url, bio, is_private`
- `supabase.auth.getUser()`
- `public.profile_blocks` select with joined profiles (blocked list)

**Writes**

- `public.profiles` update (profile save)
- `public.profiles` update (privacy toggle)
- `supabase.auth.updateUser` (email + password)
- RPC `request_account_export`
- RPC `request_account_deletion(p_reason)`
- RPC `unblock_profile(p_blocked_id)`
- `supabase.auth.signOut`
- Storage upload to bucket `avatars` via `uploadAvatarToStorage()`

**Storage (avatars bucket)**

- Bucket: `avatars`
- Bucket configured as **public read** (per migration `2109_avatars_bucket.sql`)
- Policies (per migration):
  - public read policy (SELECT)
  - authenticated manage own objects policy (ALL) enforced by `auth.uid()`-scoped object naming/prefix

---

## RPC inventory

| RPC                              | Used by               | Purpose          | Source                                                                       |
| -------------------------------- | --------------------- | ---------------- | ---------------------------------------------------------------------------- |
| `get_follower_count`             | Profile               | follower count   | `src/pages/profile/hooks/useProfileData.ts`                                  |
| `follow_profile_with_rate_limit` | Profile               | follow user      | `src/pages/profile/hooks/useProfileData.ts`                                  |
| `block_profile`                  | Profile               | block user       | `src/pages/profile/hooks/useProfileData.ts`                                  |
| `unblock_profile`                | Profile + Settings    | unblock user     | `src/pages/profile/hooks/useProfileData.ts`, `src/pages/ProfileSettings.tsx` |
| `create_notification`            | Profile (side effect) | notify on follow | `src/lib/notifications.ts`                                                   |
| `request_account_export`         | Settings              | request export   | `src/pages/ProfileSettings.tsx`                                              |
| `request_account_deletion`       | Settings              | request deletion | `src/pages/ProfileSettings.tsx`                                              |

---

## Cache / invalidation map

### Profile (React Query)

- Follow/unfollow: `setQueryData` for `qk.profileFollowStatus` + `qk.profileFollowerCount`.
- Bio update: `setQueryData` for `qk.profile(slug)` + canonical username key.
- Block/unblock: `setQueryData` for `qk.profileBlockStatus` only.
- Notifications:
  - markOne: cache update only
  - markAll/clearAll: invalidate `qk.notificationsList`

### Insights + Settings (no React Query)

- Local React state updates only.

---

## Security / RLS dependencies

**Key principle**: Profile + Insights read `public.catches` directly. Privacy/block correctness must be enforced in DB.

- RLS enabled for: `profiles, catches, sessions, profile_follows, notifications` (see `supabase/migrations/1004_policies_and_grants.sql`).
- `profile_blocks` RLS: `supabase/migrations/2085_profile_blocks_rls.sql`.
- `admin_users` SELECT policy exists (`supabase/migrations/2036_fix_admin_badge_author_flag.sql`). Treat UI checks as cosmetic; server-side must gate admin actions.
- `public.catches` SELECT policy was hardened for block/privacy: `supabase/migrations/2134_reinstate_catches_feed_visibility.sql`.
  - If this policy regresses, private/blocked content can leak into Profile/Insights.
- `public.profiles` SELECT policy appears permissive (`USING (true)` in 1004).
  - **Action required**: audit whether moderation/internal columns exist in `profiles` and whether they should be publicly readable.

---

## Performance notes

- Insights loads all user catches + sessions (no pagination) and runs multiple derived aggregations → heavy payload + client CPU for large accounts.
- Profile can trigger ~6–8 queries on first render (burst), including admin checks and block status reads.
- Profile catches query includes `ratings(rating)` for each catch → potentially large payload.
- Settings blocked list joins profiles and can grow with large block lists.

---

## Findings & actions

| Issue                                                                                         | Severity | Scope   | Status                     | Next action                                                                                 |
| --------------------------------------------------------------------------------------------- | -------- | ------- | -------------------------- | ------------------------------------------------------------------------------------------- |
| Privacy/block enforcement for profile catches depends entirely on `public.catches` SELECT RLS | P1       | DB/RLS  | OPEN (must stay locked in) | Ensure 2134 is deployed everywhere; add regression checks for profile visibility            |
| `public.profiles` SELECT policy may expose moderation/internal fields                         | P1       | DB/RLS  | OPEN                       | Audit schema; if moderation columns exist, restrict via view/RPC/column strategy            |
| Settings admin badge uses a Promise (likely always truthy)                                    | P2       | UI-only | OPEN                       | Fix async admin state in `ProfileSettings.tsx` (no data-flow changes)                       |
| Insights loads unbounded catch history                                                        | P2       | UI + DB | OPEN                       | UI-only: progressive disclosure/skeletons; Later: pagination or server-side aggregation RPC |
| Rate limit error handling uses message parsing                                                | P2       | DB + UI | OPEN                       | Move to SQLSTATE codes for rate-limit RPCs; map by `error.code` client-side                 |

---

## Execution plan summary

### Phase 0 (UI-only) — baseline correctness + state UI

- Fix Settings admin badge Promise bug.
- Standardize loading/empty/error states across Insights/Profile/Settings.

### Phase 1 (UI-only) — redesign in safe order

1. Settings → 2) Insights → 3) Profile

### Phase 2 (DB/RLS) — production gates

- Restrict `profiles` public select if needed.
- SQLSTATE-based rate limit errors.

### Phase 3 (Perf) — optional

- Insights: server-side aggregation/pagination.
- Profile: reduce payload / virtualize grid if needed.

---

## Manual QA checklist (not executed)

### Routing

- `/insights`, `/profile/:slug`, `/settings/profile` load under RequireAuth with correct redirects.

### Settings

- Update profile fields.
- Toggle privacy.
- Avatar upload: uploads to `avatars` bucket; refresh preserves avatar.
- Unblock user: list updates correctly.
- Request export + deletion flows.

### Profile

- View own profile.
- View a private profile you follow vs do not follow.
- Follow/unfollow updates CTA + count.
- Block/unblock updates state and content visibility.

### Insights

- Empty state (no catches/sessions).
- High-volume account: charts render without lockups (perf work may be needed).
