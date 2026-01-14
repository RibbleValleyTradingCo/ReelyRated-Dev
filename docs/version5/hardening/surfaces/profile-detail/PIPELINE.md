# Profile Detail Pipeline (E2E)
<!-- PHASE-GATES:START -->
## Phase Gates

| Gate | Status | Evidence | Notes |
| --- | --- | --- | --- |
| Contract & personas defined | TODO | (link to section below) | |
| Data entrypoints inventoried (tables/RPC/storage/realtime) | TODO | | |
| Anti-enumeration UX verified | TODO | | |
| RLS/policies verified for surface tables | TODO | | |
| Grants verified (least privilege) | TODO | | |
| RPC posture verified (EXECUTE + SECURITY DEFINER hygiene if used) | TODO | | |
| Manual UX pass (4 personas) | TODO | HAR + screenshots | |
| SQL probe evidence captured | TODO | CSV/SQL outputs | |
| Result | TODO | | PASS / FAIL |
<!-- PHASE-GATES:END -->

<!-- PERSONA-CONTRACT-REF:START -->
Persona contract: `docs/version5/hardening/_global/legacy/PERSONA-PERMISSIONS.md`
<!-- PERSONA-CONTRACT-REF:END -->


## Scope
- Route: `/profile/:slug/*` (auth required). `src/App.tsx:248-254`.
- Page: `src/pages/Profile.tsx` (Profile component).
- Data hooks: `useProfileData` (`src/pages/profile/hooks/useProfileData.ts`) and `useNotificationsData` (`src/hooks/useNotificationsData.ts`) when viewing own profile.
- Auth gate: `RequireAuth` redirects unauthenticated users to `/auth`. `src/App.tsx:58-69`.
- Deleted account gate: `DeletedAccountGate` checks `profiles.is_deleted` and signs out + redirects to `/account-deleted`. `src/components/Layout.tsx:9-16`, `src/components/DeletedAccountGate.tsx:49-67`.
- Related surfaces / handoffs: `/add-catch`, `/catch/:id`, `/feed`, `/insights`, `/settings/profile`, `/admin/reports`, `/admin/audit-log`, `/admin/users/:userId/moderation`. `src/pages/Profile.tsx:264-275`, `src/components/profile/ProfileAdminModerationTools.tsx:14-33`.

## Surface narrative (step-by-step)
1) Route + access gate
   - `RequireAuth` shows `RouteSkeleton` while loading, then redirects unauthenticated users to `/auth` with `state.from`. `src/App.tsx:58-69`.
   - `DeletedAccountGate` runs inside the layout and queries `profiles.is_deleted`. If `true`, it calls `supabase.auth.signOut()` and navigates to `/account-deleted`. While checking/redirecting it renders `RouteSkeleton`. `src/components/DeletedAccountGate.tsx:16-85`.

2) Initial load + profile fetch
   - `Profile` reads `slug` from the URL and calls `useProfileData`. `src/pages/Profile.tsx:92-127`.
   - `useProfileData` calls `supabase.rpc("get_profile_for_profile_page", { p_username: slug })`. `src/pages/profile/hooks/useProfileData.ts:41-43`.
   - If the returned profile has a different `username`, the page navigates to `/profile/{username}`. `src/pages/profile/hooks/useProfileData.ts:59-64`.
   - When `profileId` is available, the hook fetches follower count (RPC), following list (PostgREST), catches (PostgREST with embedded relations), follow status (PostgREST), block status (PostgREST), and admin status (PostgREST via `isAdminUser`). `src/pages/profile/hooks/useProfileData.ts:66-231`, `src/lib/admin.ts:14-18`.
   - If the profile is unavailable (missing slug, RPC error, or no profile), the page renders `ProfileBlockedViewerStub` with a generic "This angler isn't available" message. `src/pages/Profile.tsx:196-198`, `src/components/profile/ProfileBlockedViewerStub.tsx:5-24`.
   - While loading (or while block status is loading), the page renders skeleton placeholders. `src/pages/Profile.tsx:221-233`.

3) Notifications panel (own profile only)
   - When viewing your own profile (and the profile is not a staff/admin profile), `ProfileNotificationsSection` renders and uses `useNotificationsData` to fetch and manage notifications. `src/pages/Profile.tsx:337-340`, `src/components/ProfileNotificationsSection.tsx:16-45`.
   - Realtime support exists in `useNotificationsData`, but it is disabled here (`enableRealtime` defaults to `false` and is not passed). `src/hooks/useNotificationsData.ts:19-99`, `src/components/ProfileNotificationsSection.tsx:25`.

4) User actions
   - Follow/unfollow:
     - If no authenticated viewer, it shows a toast ("Sign in to follow anglers") and navigates to `/auth`. `src/pages/profile/hooks/useProfileData.ts:297-301`.
     - Follow calls `follow_profile_with_rate_limit`; unfollow deletes from `profile_follows`. `src/pages/profile/hooks/useProfileData.ts:240-252`.
     - On follow, the client calls `create_notification` to notify the target user. `src/pages/profile/hooks/useProfileData.ts:321-328`, `src/lib/notifications.ts:40-48`.
   - Update bio (own profile only): PostgREST update on `profiles`. `src/pages/profile/hooks/useProfileData.ts:260-268`.
   - Block/unblock: `block_profile` / `unblock_profile` RPCs, with toasts and local cache updates. `src/pages/profile/hooks/useProfileData.ts:275-403`.
   - Load more catches: `fetchNextPage` uses range pagination (PAGE_SIZE 24). `src/pages/profile/hooks/useProfileData.ts:15, 120-148`.

5) Navigation handoffs
   - The profile UI navigates to `/add-catch`, `/feed`, `/insights`, `/settings/profile`, `/admin/reports`, `/admin/audit-log`, `/admin/users/:userId/moderation`, and `/catch/:id` via handlers in `Profile`. `src/pages/Profile.tsx:264-275`.

## Entrypoints inventory (with file:line)

### RPCs
| RPC | Args | File | Notes |
| --- | --- | --- | --- |
| get_profile_for_profile_page | `p_username` | `src/pages/profile/hooks/useProfileData.ts:41-43` | Restored in `supabase/migrations/2160_restore_get_profile_for_profile_page_auth_only.sql`; SECURITY INVOKER; EXECUTE allowlisted to authenticated (PUBLIC/anon revoked). |
| get_follower_count | `p_profile_id` | `src/pages/profile/hooks/useProfileData.ts:71-73` | SECURITY DEFINER, `SET search_path` in `supabase/migrations/2015_phase1_follow_visibility_and_counts.sql:55-70`; EXECUTE granted to anon/auth `2015:72-73`. |
| follow_profile_with_rate_limit | `p_following_id` | `src/pages/profile/hooks/useProfileData.ts:250-252` | SECURITY DEFINER with rate-limit check in `supabase/migrations/2117_harden_profile_follows_rls.sql:44-84`; EXECUTE grant in `supabase/migrations/1006_auth_and_rpc_helpers.sql:850`. |
| block_profile | `p_blocked_id`, `p_reason` | `src/pages/profile/hooks/useProfileData.ts:281-284` | SECURITY DEFINER in `supabase/migrations/2062_profile_blocks_rpcs.sql:26-57`; EXECUTE grant `2062:100`. |
| unblock_profile | `p_blocked_id` | `src/pages/profile/hooks/useProfileData.ts:288-290` | SECURITY DEFINER in `supabase/migrations/2062_profile_blocks_rpcs.sql:59-78`; EXECUTE grant `2062:101`. |
| create_notification | `p_user_id`, `p_actor_id`, `p_type`, `p_message`, `p_catch_id`, `p_comment_id`, `p_extra_data` | `src/lib/notifications.ts:40-48` (invoked from `src/pages/profile/hooks/useProfileData.ts:321-328`) | SECURITY DEFINER in `supabase/migrations/2044_allow_admin_report_notifications.sql:8-79`; EXECUTE grant in `supabase/migrations/1006_auth_and_rpc_helpers.sql:843`. |

### PostgREST
| Table | Operations | File | Notes |
| --- | --- | --- | --- |
| profiles | select `is_deleted` | `src/components/DeletedAccountGate.tsx:49-53` | Global deleted-account gate. |
| profiles | update `bio` | `src/pages/profile/hooks/useProfileData.ts:265-268` | Own profile only (client-side gate). |
| profile_follows | select (following list) | `src/pages/profile/hooks/useProfileData.ts:90-104` | Embedded `profiles` via FK (`profile_follows_following_id_fkey`). |
| profile_follows | select (follow status) | `src/pages/profile/hooks/useProfileData.ts:172-177` | Viewer vs profile. |
| profile_follows | delete (unfollow) | `src/pages/profile/hooks/useProfileData.ts:240-244` | Requires RLS to enforce follower_id. |
| catches | select (paged) | `src/pages/profile/hooks/useProfileData.ts:128-134` | Select includes embedded `ratings` and `venues` (`CATCHES_SELECT` at `useProfileData.ts:13-14`). |
| profile_blocks | select (block status) | `src/pages/profile/hooks/useProfileData.ts:200-205` | Viewer -> profile. |
| admin_users | select | `src/lib/admin.ts:14-18` (used in `src/pages/profile/hooks/useProfileData.ts:215-218` and `src/components/ProfileNotificationsSection.tsx:31-37`) | Admin gating is UX only; relies on RLS. |
| notifications | select | `src/lib/notifications.ts:67-73` (via `src/hooks/useNotificationsData.ts:25-36`) | Own profile only. |
| notifications | update | `src/lib/notifications.ts:83-88`, `src/lib/notifications.ts:96-103` | Mark one/all read. |
| notifications | delete | `src/lib/notifications.ts:109-111` | Clear all. |

### Storage
- None in this surface. `resolveAvatarUrl` constructs public URLs only. `src/lib/storage.ts:52-53`.

### Realtime
- Not enabled here. `useNotificationsData` supports `supabase.channel` when `enableRealtime` is `true`, but it is not enabled for this surface. `src/hooks/useNotificationsData.ts:71-94`, `src/components/ProfileNotificationsSection.tsx:25`.

### Third-party APIs
- None found.

## Implicit DB side-effects
- `follow_profile_with_rate_limit` inserts into `profile_follows` and `rate_limits`. `supabase/migrations/2117_harden_profile_follows_rls.sql:72-79`.
- `block_profile` inserts into `profile_blocks` and deletes follow edges in either direction. `supabase/migrations/2062_profile_blocks_rpcs.sql:46-55`.
- `unblock_profile` deletes from `profile_blocks`. `supabase/migrations/2062_profile_blocks_rpcs.sql:74-76`.
- `create_notification` inserts into `notifications`. `supabase/migrations/2044_allow_admin_report_notifications.sql:54-76`.
- Client-driven mutations: `profile_follows` delete (unfollow), `profiles` update (bio), `notifications` update/delete (mark/clear). `src/pages/profile/hooks/useProfileData.ts:240-268`, `src/lib/notifications.ts:83-111`.

## Security posture notes (facts only)
- Access to `/profile/:slug/*` is enforced by `RequireAuth` (redirects to `/auth` when no user). `src/App.tsx:58-69`, `src/App.tsx:248-254`.
- `DeletedAccountGate` queries `profiles.is_deleted` and signs out + redirects to `/account-deleted` when true. `src/components/DeletedAccountGate.tsx:49-67`.
- `get_follower_count` is SECURITY DEFINER and bypasses RLS for accurate counts. `supabase/migrations/2015_phase1_follow_visibility_and_counts.sql:54-70`.
- `follow_profile_with_rate_limit`, `block_profile`, `unblock_profile`, and `create_notification` are SECURITY DEFINER with `SET search_path = public, extensions` in their migrations. `supabase/migrations/2117_harden_profile_follows_rls.sql:44-51`, `supabase/migrations/2062_profile_blocks_rpcs.sql:26-66`, `supabase/migrations/2044_allow_admin_report_notifications.sql:8-21`.
- PostgREST mutations (profiles bio update, profile_follows delete, notifications update/delete) rely on RLS/grants for enforcement.
- `catches` selects embed `ratings` and `venues` via PostgREST; RLS on those relations must align with profile visibility. `src/pages/profile/hooks/useProfileData.ts:13-14, 128-134`.
- `get_profile_for_profile_page` restored in `supabase/migrations/2160_restore_get_profile_for_profile_page_auth_only.sql` with auth-only EXECUTE; returns 0 rows for blocked/private/deleted or missing profiles (anti-enumeration).

## Evidence outputs (post-2160)
- Profile load HAR: `docs/version5/hardening/surfaces/settings-profile/evidence/har/HAR_profile-load_post2160_YYYY-MM-DD.har`
- SQL verification output: `docs/version5/hardening/surfaces/settings-profile/evidence/sql/SQL_profile-settings_get_profile_rpc_post2160_YYYY-MM-DD.txt`

## SQL queries to run during sweep
```
-- Grants for touched tables/views
select *
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'profiles',
    'profile_follows',
    'profile_blocks',
    'catches',
    'ratings',
    'venues',
    'notifications',
    'admin_users',
    'rate_limits'
  );

-- RLS policies for touched tables/views
select *
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles',
    'profile_follows',
    'profile_blocks',
    'catches',
    'ratings',
    'venues',
    'notifications',
    'admin_users',
    'rate_limits'
  );

-- RPC posture
select proname, pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in (
    'get_profile_for_profile_page',
    'get_follower_count',
    'follow_profile_with_rate_limit',
    'block_profile',
    'unblock_profile',
    'create_notification'
  );

select *
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in (
    'get_profile_for_profile_page',
    'get_follower_count',
    'follow_profile_with_rate_limit',
    'block_profile',
    'unblock_profile',
    'create_notification'
  );

select proname, prosecdef, proconfig
from pg_proc
join pg_namespace n on n.oid = pronamespace
where n.nspname = 'public'
  and proname in (
    'get_profile_for_profile_page',
    'get_follower_count',
    'follow_profile_with_rate_limit',
    'block_profile',
    'unblock_profile',
    'create_notification'
  );
```

## Open verification items
- Verify `get_profile_for_profile_page` EXECUTE grants are authenticated-only and the function returns 0 rows for blocked/private/deleted/missing profiles (per migration 2160).
- Confirm RLS policies for `catches`, `ratings`, and `venues` align with profile visibility (followers/private/admin).
- Verify `notifications` RLS allows only the owner to read/update/delete.

## Repro commands used
```
rg -n "<Route|createBrowserRouter|path=" src/App.tsx src -S
nl -ba src/App.tsx | sed -n '40,90p'
nl -ba src/App.tsx | sed -n '230,270p'
nl -ba src/components/Layout.tsx
nl -ba src/components/DeletedAccountGate.tsx
rg -n "ProfileNotificationsSection" -n src/pages/Profile.tsx
nl -ba src/pages/Profile.tsx | sed -n '1,200p'
nl -ba src/pages/Profile.tsx | sed -n '200,280p'
nl -ba src/pages/Profile.tsx | sed -n '280,330p'
nl -ba src/pages/Profile.tsx | sed -n '320,380p'
rg -n "supabase\\.from\\(|supabase\\.rpc\\(|supabase\\.auth\\.|storage\\.from\\(|channel\\(|postgres_changes" src/pages/profile src/pages/Profile.tsx src/components -S
nl -ba src/pages/profile/hooks/useProfileData.ts | sed -n '1,240p'
nl -ba src/pages/profile/hooks/useProfileData.ts | sed -n '240,520p'
rg -n "get_profile_for_profile_page|get_follower_count|follow_profile_with_rate_limit|block_profile|unblock_profile" supabase/migrations -S
rg -n "get_profile_for_profile_page" supabase/migrations -S
rg -n "profile_for_profile_page" supabase/migrations -S
rg -n "get_profile" supabase/migrations -S
rg -n "get_profile_for_profile_page" -S
rg -n "get_profile_for_profile_page" supabase -S
rg -n "create_notification" supabase/migrations -S
nl -ba supabase/migrations/2015_phase1_follow_visibility_and_counts.sql | sed -n '1,120p'
nl -ba supabase/migrations/2117_harden_profile_follows_rls.sql | sed -n '1,220p'
rg -n "follow_profile_with_rate_limit" supabase/migrations/1006_auth_and_rpc_helpers.sql -n
nl -ba supabase/migrations/2062_profile_blocks_rpcs.sql | sed -n '1,200p'
nl -ba src/lib/notifications.ts
nl -ba src/hooks/useNotificationsData.ts
nl -ba src/components/ProfileNotificationsSection.tsx
nl -ba src/lib/admin.ts
nl -ba src/lib/storage.ts
ls -la src/pages/profile/components
ls -la src/pages/profile
cat docs/version5/hardening/surfaces/profile-detail/PIPELINE.md
```
