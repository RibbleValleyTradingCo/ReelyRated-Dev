# Settings Profile Pipeline (E2E)
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
- Route: `/settings/profile` (auth required). `src/App.tsx:256-262`.
- Page: `src/pages/ProfileSettings.tsx` (ProfileSettings component).
- Auth gate: `RequireAuth` redirects unauthenticated users to `/auth`. `src/App.tsx:58-69`.
- Deleted account gate: `DeletedAccountGate` checks `profiles.is_deleted` and signs out + redirects to `/account-deleted`. `src/components/Layout.tsx:9-16`, `src/components/DeletedAccountGate.tsx:49-67`.
- Related surfaces / handoffs: `/auth`, `/auth?fromEmailChange=true`, `/account-deleted`. `src/pages/ProfileSettings.tsx:113-116`, `src/pages/ProfileSettings.tsx:266-272`, `src/pages/ProfileSettings.tsx:362`.

## Surface narrative (step-by-step)
1) Route + access gate
   - `RequireAuth` shows `RouteSkeleton` while loading and redirects to `/auth` when no user. `src/App.tsx:58-69`, `src/App.tsx:256-262`.
   - `DeletedAccountGate` runs inside the layout and checks `profiles.is_deleted`; deleted accounts are signed out and redirected to `/account-deleted`. `src/components/DeletedAccountGate.tsx:49-67`.
   - The page also redirects to `/auth` when `useAuth` resolves to no user (redundant UX guard). `src/pages/ProfileSettings.tsx:113-116`.

2) Initial load
   - Loads profile data from `profiles` and `supabase.auth.getUser()` in parallel. `src/pages/ProfileSettings.tsx:140-148`.
   - Populates form defaults, avatar path, privacy flag, and initial email. `src/pages/ProfileSettings.tsx:160-175`.
   - Fetches blocked profiles list via `profile_blocks` join to `profiles`. `src/pages/ProfileSettings.tsx:389-429`, `src/pages/ProfileSettings.tsx:449-451`.
   - Admin status is checked via `isAdminUser` for UI badge only. `src/pages/ProfileSettings.tsx:119-129`, `src/lib/admin.ts:10-18`.

3) Profile edits
   - Save profile details (username, full_name, bio, avatar_path) updates `profiles`. `src/pages/ProfileSettings.tsx:195-198`.
   - Avatar upload uses `uploadAvatarToStorage` (storage bucket `avatars`) and only persists to `profiles` when the user saves the profile. `src/components/settings/ProfileAvatarSection.tsx:64-79`, `src/pages/ProfileSettings.tsx:186-198`, `src/lib/storage.ts:36-41`.
   - Privacy toggle updates `profiles.is_private`. `src/pages/ProfileSettings.tsx:320-323`.

4) Security / account actions
   - Password change reauths with `supabase.auth.signInWithPassword` and then calls `supabase.auth.updateUser` with the new password. `src/pages/ProfileSettings.tsx:219-231`.
   - Email change calls `supabase.auth.updateUser` with `emailRedirectTo` set to `/auth?fromEmailChange=true`. `src/pages/ProfileSettings.tsx:266-272`.
   - Data export calls RPC `request_account_export` and downloads the JSON response as a file. `src/pages/ProfileSettings.tsx:287-307`.
   - Account deletion calls RPC `request_account_deletion`, then signs out and navigates to `/account-deleted`. `src/pages/ProfileSettings.tsx:345-362`.
   - Unblock user calls RPC `unblock_profile` and refreshes the blocked list. `src/pages/ProfileSettings.tsx:372-382`, `src/pages/ProfileSettings.tsx:389-429`.

5) Loading / error UX
   - While auth or profile loads, the page shows a skeleton. `src/pages/ProfileSettings.tsx:482-488`.
   - Errors show toasts for profile load, save, password change, email change, privacy update, export, and account deletion. `src/pages/ProfileSettings.tsx:150-154`, `src/pages/ProfileSettings.tsx:210-212`, `src/pages/ProfileSettings.tsx:225-242`, `src/pages/ProfileSettings.tsx:274-283`, `src/pages/ProfileSettings.tsx:325-334`, `src/pages/ProfileSettings.tsx:291-311`, `src/pages/ProfileSettings.tsx:350-365`, `src/pages/ProfileSettings.tsx:384-386`.

## Entrypoints inventory (with file:line)

### Supabase Auth
- `supabase.auth.getUser()` (profile load). `src/pages/ProfileSettings.tsx:147`.
- `supabase.auth.signInWithPassword()` (password change reauth). `src/pages/ProfileSettings.tsx:219-223`.
- `supabase.auth.updateUser({ password })`. `src/pages/ProfileSettings.tsx:229-231`.
- `supabase.auth.updateUser({ email }, { emailRedirectTo })`. `src/pages/ProfileSettings.tsx:266-272`.
- `supabase.auth.signOut()` via `useAuth().signOut`. `src/pages/ProfileSettings.tsx:357`, `src/components/AuthProvider.tsx:118-126`.

### RPCs
| RPC | Args | File | Notes |
| --- | --- | --- | --- |
| request_account_export | none | `src/pages/ProfileSettings.tsx:287-290` | SECURITY DEFINER with `SET search_path` in `supabase/migrations/2050_request_account_export.sql:7-11`. |
| request_account_deletion | `p_reason` | `src/pages/ProfileSettings.tsx:345-348` | SECURITY DEFINER with `SET search_path` in `supabase/migrations/2051_request_account_deletion.sql:7-12`. |
| unblock_profile | `p_blocked_id` | `src/pages/ProfileSettings.tsx:374-376` | SECURITY DEFINER in `supabase/migrations/2062_profile_blocks_rpcs.sql:59-66`. |

### PostgREST
| Table | Operations | File | Notes |
| --- | --- | --- | --- |
| profiles | select | `src/pages/ProfileSettings.tsx:142-146` | Loads username/full_name/avatar/bio/is_private for current user. |
| profiles | update | `src/pages/ProfileSettings.tsx:195-198` | Saves profile details + avatar path. |
| profiles | update | `src/pages/ProfileSettings.tsx:320-323` | Updates `is_private`. |
| profile_blocks | select (join profiles) | `src/pages/ProfileSettings.tsx:397-400` | Loads blocked list with profile fields and `is_deleted`. |
| admin_users | select | `src/lib/admin.ts:14-18` | Admin badge only (UX). |
| profiles | select `is_deleted` | `src/components/DeletedAccountGate.tsx:49-53` | Global gate applied in layout. |

### Storage
- `avatars` bucket upload via `uploadAvatarToStorage` (`userId/<random>.<ext>`, `upsert: false`). `src/lib/storage.ts:30-41`, `src/components/settings/ProfileAvatarSection.tsx:64-79`.

### Realtime
- None.

### Third-party APIs
- None.

## Implicit DB side-effects
- `request_account_export` aggregates data from profiles, catches, catch_comments, ratings, catch_reactions, profile_follows, notifications, reports, user_warnings, moderation_log, and admin_users. `supabase/migrations/2050_request_account_export.sql:31-103`.
- `request_account_deletion` soft-deletes the profile and updates or deletes rows across catches, catch_comments, catch_reactions, ratings, profile_follows, notifications. `supabase/migrations/2051_request_account_deletion.sql:59-97`.
- `unblock_profile` deletes from `profile_blocks`. `supabase/migrations/2062_profile_blocks_rpcs.sql:74-76`.

## Security posture notes (facts only)
- `/settings/profile` is auth-only via `RequireAuth`. `src/App.tsx:58-69`, `src/App.tsx:256-262`.
- `DeletedAccountGate` signs out and redirects deleted accounts based on `profiles.is_deleted`. `src/components/DeletedAccountGate.tsx:49-67`.
- Profile edits and privacy toggles use PostgREST updates on `profiles`; RLS must enforce that users can only update their own rows. `src/pages/ProfileSettings.tsx:195-198`, `src/pages/ProfileSettings.tsx:320-323`.
- `request_account_export` and `request_account_deletion` are SECURITY DEFINER functions with `SET search_path = public, extensions`. `supabase/migrations/2050_request_account_export.sql:7-11`, `supabase/migrations/2051_request_account_deletion.sql:7-12`.
- Email change uses `emailRedirectTo` pointing at `/auth?fromEmailChange=true`; redirect allow list must include this origin. `src/pages/ProfileSettings.tsx:266-272`.
- Blocked list reads `profile_blocks` joined to `profiles`; RLS must prevent reading other users' blocked lists. `src/pages/ProfileSettings.tsx:397-400`.
- Migration `2160_restore_get_profile_for_profile_page_auth_only.sql` restores the auth-only profile page RPC; profile load should no longer 404. (Surface dependency: `/profile/:slug`.)

### SQL probe outputs (evidence files)
- Probe pack source: `docs/version5/hardening/surfaces/settings-profile/sql/PROFILE-SETTINGS-PROBES.sql`
- Suggested outputs (save under `docs/version5/hardening/surfaces/settings-profile/evidence/sql/`): `SQL_profile-settings_grants_YYYY-MM-DD.txt`, `SQL_profile-settings_rls_policies_YYYY-MM-DD.txt`, `SQL_profile-settings_rpc_posture_YYYY-MM-DD.txt`, `SQL_profile-settings_routine_privileges_YYYY-MM-DD.txt`, `SQL_profile-settings_storage_policies_YYYY-MM-DD.txt`, `SQL_profile-settings_storage_objects_sample_YYYY-MM-DD.txt`
- Profile load evidence (post-2160): `docs/version5/hardening/surfaces/settings-profile/evidence/har/HAR_profile-load_post2160_YYYY-MM-DD.har`, `docs/version5/hardening/surfaces/settings-profile/evidence/sql/SQL_profile-settings_get_profile_rpc_post2160_YYYY-MM-DD.txt`

## SQL queries to run during sweep
```
-- Grants for touched tables
select *
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'profiles',
    'profile_blocks',
    'catches',
    'catch_comments',
    'ratings',
    'catch_reactions',
    'profile_follows',
    'notifications',
    'reports',
    'user_warnings',
    'moderation_log',
    'admin_users'
  );

-- RLS policies for touched tables
select *
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles',
    'profile_blocks',
    'catches',
    'catch_comments',
    'ratings',
    'catch_reactions',
    'profile_follows',
    'notifications',
    'reports',
    'user_warnings',
    'moderation_log',
    'admin_users'
  );

-- RPC posture
select proname, pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in ('request_account_export', 'request_account_deletion', 'unblock_profile');

select *
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in ('request_account_export', 'request_account_deletion', 'unblock_profile');

select proname, prosecdef, proconfig
from pg_proc
join pg_namespace n on n.oid = pronamespace
where n.nspname = 'public'
  and proname in ('request_account_export', 'request_account_deletion', 'unblock_profile');

-- Storage policies (avatars bucket)
select
  pol.polname as policyname,
  pol.polcmd,
  pol.polroles::regrole[] as roles,
  pg_get_expr(pol.polqual, pol.polrelid) as qual,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check
from pg_policy pol
join pg_class c on c.oid = pol.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'storage'
  and c.relname = 'objects'
order by pol.polname;

select *
from storage.objects
where bucket_id = 'avatars'
limit 5;
```

## Open verification items
- Confirm RLS on `profiles` allows only self updates for profile details and `is_private`.
- Confirm RLS on `profile_blocks` restricts list reads to the blocker.
- Verify storage policies for the `avatars` bucket enforce user ownership and prevent overwrite.
- Validate `request_account_export` and `request_account_deletion` grants and search_path posture match intended access.

## Repro commands used
```
cat docs/version5/hardening/surfaces/settings-profile/PIPELINE.md
nl -ba src/App.tsx | sed -n '50,80p'
nl -ba src/App.tsx | sed -n '240,270p'
nl -ba src/components/Layout.tsx
nl -ba src/components/DeletedAccountGate.tsx
nl -ba src/pages/ProfileSettings.tsx
nl -ba src/components/settings/ProfileSettingsIdentityHeader.tsx
nl -ba src/components/settings/ProfileAvatarSection.tsx
nl -ba src/lib/storage.ts
nl -ba src/lib/admin.ts
nl -ba src/components/AuthProvider.tsx
rg -n "request_account_export|request_account_deletion" supabase/migrations -S
nl -ba supabase/migrations/2050_request_account_export.sql | sed -n '1,140p'
nl -ba supabase/migrations/2051_request_account_deletion.sql | sed -n '1,200p'
nl -ba supabase/migrations/2062_profile_blocks_rpcs.sql | sed -n '1,120p'
```
