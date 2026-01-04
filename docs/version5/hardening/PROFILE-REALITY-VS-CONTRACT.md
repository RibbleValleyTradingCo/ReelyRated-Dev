# PROFILE Reality vs Contract (Option A)

Contract reference: `docs/version5/hardening/PERSONA-CONTRACTS.md` (Option A, auth-only surfaces, anti-enumeration)

Scope:

- Primary surface: `/profile/:slug`
- Secondary surface: `/feed`
- Cross-cutting: relationship RPCs and follower-count behavior

Related docs:

- `docs/version5/hardening/profile-detail/START-HERE.md`
- `docs/version5/hardening/profile-detail/profile-detail-verification-log.md`
- `docs/version5/hardening/RPC-REGISTRY.md`
- `docs/version5/hardening/GRANTS-LEDGER.md`
- `docs/version5/hardening/SQL-AUTHZ-CHECKS.md`

## Security guidance references (why Option A is strict)

These are the external references we’re aligning this surface to:

- OWASP WSTG: Testing for Account Enumeration and Guessable User Account (generic responses, consistent behavior).
- OWASP Cheat Sheet: Authentication and Error Messages (generic responses + avoid discrepancy factors like timing).
- Supabase docs: Row Level Security (RLS) expectations for anon/auth and defense-in-depth.
- Postgres docs: Row Security Policies (default-deny, SECURITY DEFINER caveats, FORCE RLS considerations).

We treat these as baseline guidance; this doc still records _our_ contract and evidence.

## A) Route guards reality

Evidence:

- `src/App.tsx` wraps `/profile/:slug` and `/feed` with `RequireAuth` and redirects anon to `/auth`.

```tsx
const RequireAuth = ({ children }: { children: JSX.Element }) => {
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }
  return children;
};

<Route path="/feed" element={<RequireAuth><Feed /></RequireAuth>} />
<Route path="/profile/:slug" element={<RequireAuth><Profile /></RequireAuth>} />
```

Notes:

- `src/pages/Feed.tsx` also navigates to `/auth` when `!user`, but the route guard should prevent render for anon.
- No unguarded `/profile` or `/feed` routes found in `src/App.tsx`. Public routes (`/`, `/venues`, `/venues/:slug`, `/leaderboard`) may still surface profile data via other queries; those are out of scope here and should be audited separately if they become enumeration vectors.

## B) Data access reality (code path inventory)

### `/profile/:slug` (auth-only)

Reads:

- `profiles` read (profile load) in `src/pages/profile/hooks/useProfileData.ts`:

  ```ts
  let query = supabase.from("profiles").select(PROFILE_SELECT).limit(1);
  query = slugIsUuid ? query.eq("id", slug) : query.eq("username", slug);
  ```

  Runs for any authenticated viewer when `slug` exists; no privacy/blocked gating before query.

- `get_follower_count` RPC in `src/pages/profile/hooks/useProfileData.ts`:

  ```ts
  const { data } = await supabase.rpc("get_follower_count", {
    p_profile_id: profileId,
  });
  ```

  Runs when `profileId` exists; no gating for private/blocked.

- `profile_follows` (following list) in `src/pages/profile/hooks/useProfileData.ts`:

  ```ts
  supabase
    .from("profile_follows")
    .select(
      "followed_profile:profiles!profile_follows_following_id_fkey (id, username, avatar_path, avatar_url, bio)"
    )
    .eq("follower_id", profileId);
  ```

  Runs when `profileId` exists; no gating for private/blocked.

- `catches` (with ratings + venues) in `src/pages/profile/hooks/useProfileData.ts`:

  ```ts
  supabase
    .from("catches")
    .select(CATCHES_SELECT)
    .eq("user_id", profileId)
    .is("deleted_at", null);
  ```

  Runs when `profileId` exists; no gating for private/blocked.

- `profile_follows` (follow status) in `src/pages/profile/hooks/useProfileData.ts`:

  ```ts
  supabase
    .from("profile_follows")
    .select("id")
    .eq("follower_id", viewerId)
    .eq("following_id", profileId)
    .maybeSingle();
  ```

  Runs when viewer is authenticated and viewing someone else.

- `profile_blocks` (block status) in `src/pages/profile/hooks/useProfileData.ts`:

  ```ts
  supabase
    .from("profile_blocks")
    .select("blocker_id, blocked_id")
    .eq("blocker_id", viewerId)
    .eq("blocked_id", profileId)
    .maybeSingle();
  ```

  Second query flips blocker/blocked to check the reverse direction.

- `admin_users` check in `src/lib/admin.ts` (used for viewer + profile owner):

  ```ts
  supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  ```

- Owner-only notifications in `src/components/ProfileNotificationsSection.tsx`:
  - Moderation status read:
    ```ts
    supabase
      .from("profiles")
      .select("moderation_status, warn_count, suspension_until")
      .eq("id", userId)
      .maybeSingle();
    ```
  - Notifications reads/updates/deletes via `src/hooks/useNotificationsData.ts` -> `src/lib/notifications.ts`:
    ```ts
    supabase.from("notifications").select("*").eq("user_id", userId)
    supabase.from("notifications").update(...)
    supabase.from("notifications").delete().eq("user_id", userId)
    ```

Mutations:

- Follow/unfollow in `src/pages/profile/hooks/useProfileData.ts`:

  ```ts
  supabase.rpc("follow_profile_with_rate_limit", { p_following_id: profileId });
  supabase
    .from("profile_follows")
    .delete()
    .eq("follower_id", viewerId)
    .eq("following_id", profileId);
  ```

- Block/unblock in `src/pages/profile/hooks/useProfileData.ts`:

  ```ts
  supabase.rpc("block_profile", { p_blocked_id: profileId, p_reason: null });
  supabase.rpc("unblock_profile", { p_blocked_id: profileId });
  ```

- Bio update in `src/pages/profile/hooks/useProfileData.ts`:

  ```ts
  supabase.from("profiles").update({ bio: nextBio }).eq("id", viewerId);
  ```

- Follow notification in `src/lib/notifications.ts` (called by `toggleFollow`):
  ```ts
  supabase.rpc("create_notification", { p_user_id, p_actor_id, p_type, p_message, ... });
  ```

Anon viability:

- Route guard (`RequireAuth`) prevents anon render for `/profile/:slug`. If the guard is bypassed, none of these queries have a privacy gate beyond RLS; they execute once `slug` and `profileId` are available.

### `/feed` (auth-only)

Reads:

- `get_feed_catches` RPC in `src/pages/feed/useFeedData.ts`:

  ```ts
  supabase.rpc("get_feed_catches", { p_limit, p_offset, p_scope, p_sort, p_species, ... });
  ```

- `venues` lookup (venue filter) in `src/pages/feed/useFeedData.ts`:

  ```ts
  supabase
    .from("venues")
    .select("id, name, slug")
    .eq("slug", venueSlug)
    .maybeSingle();
  ```

- `admin_users` check in `src/lib/admin.ts` (via `useFeedData`).

- Species options via `get_species_options` RPC in `src/hooks/useSpeciesOptions.ts`:
  ```ts
  supabase.rpc("get_species_options", {
    p_only_active: true,
    p_only_with_catches: onlyWithCatches,
  });
  ```

Anon viability:

- Route guard (`RequireAuth`) blocks anon from `/feed`.
- `useFeedData` also requires `userId` for `get_feed_catches`, but the venue lookup and species options would run if the hook rendered without the guard.

## C) Anti-enumeration checks for profile deny states (Option A)

Observed UI states are distinguishable in code:

- Missing profile -> `ProfileNotFound` in `src/pages/Profile.tsx`:

  ```tsx
  if (isNotFound) {
    return <ProfileNotFound />;
  }
  ```

  `src/components/ProfileNotFound.tsx` renders "Angler not found" and a missing-specific message.

- Deleted profile -> `ProfileDeletedStub` in `src/pages/Profile.tsx`:

  ```tsx
  if (isDeleted && !isAdminViewer && !isLoading) {
    return <ProfileDeletedStub isOwnProfile={!!isOwnProfile} />;
  }
  ```

  `src/components/profile/ProfileDeletedStub.tsx` renders "This account has been deleted".

- Private (not allowed) -> `ProfileCatchesGrid` in `src/components/profile/ProfileCatchesGrid.tsx`:

  ```tsx
  {isPrivateAndBlocked ? (
    <h3 className="text-base font-semibold text-foreground">This account is private</h3>
  ) : ...}
  ```

- Blocked (viewer blocked by owner) -> `ProfileBlockedViewerStub` in `src/pages/Profile.tsx`:

  ```tsx
  if (!isLoading && !blockStatusLoading && shouldShowBlockedViewerStub) {
    return <ProfileBlockedViewerStub />;
  }
  ```

  `src/components/profile/ProfileBlockedViewerStub.tsx` renders "This angler isn't available".

- Viewer-blocked banner -> `src/pages/Profile.tsx`:
  ```tsx
  {
    isBlockedByMe && !isDeleted && !isAdminProfileOwner ? (
      <span>
        You have blocked this angler. Unblock to see their catches again.
      </span>
    ) : null;
  }
  ```

Contract mismatch (Option A): deny states are not uniform, and private/missing/deleted/blocked have distinct UI strings and layouts. Option A requires a generic "not available" outcome with no reason strings.

### Discrepancy-factor checklist (Option A)

Option A anti-enumeration isn’t just about the UI string. We must avoid _distinguishable signals_ across deny states:

UI-level

- Same headline/body copy for: missing, deleted, private-not-allowed, blocked-either-way.
- Same layout (no special banners such as “You have blocked this angler”).

Network/data-layer

- Prefer: avoid fetching follower counts, follows lists, catches, or relationship status when the profile isn’t visible.
- If a query/RPC must run, responses must remain non-distinguishing:
  - No “Target not accessible” style errors for one deny state and 0 rows for another.
  - Same HTTP status class (no 404 vs 403 vs 200-with-empty that differs by state).
  - Same response shape/size (roughly; no extra fields that differ by state).

Timing

- Avoid “quick exit” paths that respond faster for missing vs existing-but-denied.
- When practical, ensure similar processing paths or add constant-time style padding for high-risk checks.

Evidence expectations

- For each deny-state HAR, record: endpoint list, status codes, any error bodies, and whether results are 0 rows vs errors.
- For relationship RPCs (follow/block/count), explicitly document whether they return generic outcomes when target isn’t visible.

Additional signal: `src/lib/__tests__/rls-profiles.test.ts` asserts public profile readability (including unauthenticated SELECT), which is inconsistent with Option A private-profile invisibility. This is test-only evidence; verify in DB.

## D) Relationship RPC leakage review

Key functions and risks:

- `get_follower_count` (SECURITY DEFINER) in `supabase/migrations/2015_phase1_follow_visibility_and_counts.sql`:

  ```sql
  CREATE OR REPLACE FUNCTION public.get_follower_count(p_profile_id uuid)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
    SELECT COUNT(*) FROM public.profile_follows WHERE following_id = p_profile_id;
  $$;
  ```

  Risk: bypasses RLS and returns counts for any profile id, which can leak existence or relationship state for private/blocked/missing targets.

  - 2157 locks down anon/public EXECUTE: `supabase/migrations/2157_lockdown_auth_surface_executes.sql`.
  - Still callable by authenticated; must verify response is non-distinguishing for private/blocked/missing.

- `follow_profile_with_rate_limit` (SECURITY DEFINER) in `supabase/migrations/2117_harden_profile_follows_rls.sql`:

  ```sql
  IF public.is_blocked_either_way(v_user_id, p_following_id) THEN
    RAISE EXCEPTION 'Target not accessible';
  END IF;
  ```

  Risk: distinguishable error for blocked. No explicit check for private/missing; if this RPC is reachable by id, it can be used to infer state unless guarded by visibility checks.

- `is_following` helper in `supabase/migrations/2015_phase1_follow_visibility_and_counts.sql` and `is_blocked_either_way` helper in `supabase/migrations/2062_profile_blocks_rpcs.sql` live in `public`. If EXECUTE is granted to anon/auth, these are callable as RPCs and can leak relationship/existence. Confirm EXECUTE privileges are locked down.

- `block_profile` / `unblock_profile` (SECURITY DEFINER) in `supabase/migrations/2062_profile_blocks_rpcs.sql` are auth-only in 2156. Confirm no anon EXECUTE and review error shapes for enumeration signals.

- `get_feed_catches` (SECURITY INVOKER) in `supabase/migrations/2121_add_feed_catches_rpc.sql` relies on RLS to enforce privacy and block visibility. Validate that private/blocked profiles do not appear and that embedded profile JSON is not returned for denied cases.

If Option A is enforced, DB-first remediation should prioritize:

- Make private/blocked/missing indistinguishable at the data layer (RLS + RPC guards).
- Add visibility checks inside `get_follower_count` and `follow_profile_with_rate_limit` so they return generic outcomes for denied states.
- Ensure helper functions in `public` are not callable by anon/auth unless explicitly required.

## E) Live DB verification checklist (placeholders)

Function EXECUTE privileges (auth vs anon):

```sql
select
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as identity_args,
  p.proacl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'get_feed_catches',
    'get_follower_count',
    'follow_profile_with_rate_limit',
    'block_profile',
    'unblock_profile',
    'create_notification',
    'get_species_options',
    'is_following',
    'is_blocked_either_way'
  )
order by p.proname, identity_args;
```

Captured on 2026-01-04 (from SQL editor output):

```json
[
  {
    "schema": "public",
    "function_name": "block_profile",
    "identity_args": "p_blocked_id uuid, p_reason text",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "create_notification",
    "identity_args": "p_user_id uuid, p_message text, p_type notification_type, p_actor_id uuid, p_catch_id uuid, p_comment_id uuid, p_extra_data jsonb",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "follow_profile_with_rate_limit",
    "identity_args": "p_following_id uuid",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "get_feed_catches",
    "identity_args": "p_limit integer, p_offset integer, p_scope text, p_sort text, p_species text, p_custom_species text, p_venue_id uuid, p_session_id uuid",
    "is_security_definer": false,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "get_follower_count",
    "identity_args": "p_profile_id uuid",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "get_species_options",
    "identity_args": "p_only_active boolean, p_only_with_catches boolean",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "is_blocked_either_way",
    "identity_args": "p_user_id uuid, p_other_id uuid",
    "is_security_definer": false,
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "is_following",
    "identity_args": "p_follower uuid, p_following uuid",
    "is_security_definer": false,
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "unblock_profile",
    "identity_args": "p_blocked_id uuid",
    "is_security_definer": true,
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  }
]
```

Explicit anon/public EXECUTE check (should be empty for auth-only functions):

```sql
select
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as identity_args,
  p.proacl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'get_feed_catches',
    'get_follower_count',
    'follow_profile_with_rate_limit',
    'block_profile',
    'unblock_profile',
    'create_notification',
    'get_species_options',
    'is_following',
    'is_blocked_either_way'
  )
  and coalesce(array_to_string(p.proacl, ','), '') ~ '(=X|anon=X)'
order by p.proname, identity_args;
```

Captured on 2026-01-04 (from SQL editor output):

```json
[
  {
    "schema": "public",
    "function_name": "block_profile",
    "identity_args": "p_blocked_id uuid, p_reason text",
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "create_notification",
    "identity_args": "p_user_id uuid, p_message text, p_type notification_type, p_actor_id uuid, p_catch_id uuid, p_comment_id uuid, p_extra_data jsonb",
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "follow_profile_with_rate_limit",
    "identity_args": "p_following_id uuid",
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "get_feed_catches",
    "identity_args": "p_limit integer, p_offset integer, p_scope text, p_sort text, p_species text, p_custom_species text, p_venue_id uuid, p_session_id uuid",
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "get_follower_count",
    "identity_args": "p_profile_id uuid",
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "get_species_options",
    "identity_args": "p_only_active boolean, p_only_with_catches boolean",
    "proacl": "{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "is_blocked_either_way",
    "identity_args": "p_user_id uuid, p_other_id uuid",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "is_following",
    "identity_args": "p_follower uuid, p_following uuid",
    "proacl": "{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}"
  },
  {
    "schema": "public",
    "function_name": "unblock_profile",
    "identity_args": "p_blocked_id uuid",
    "proacl": "{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}"
  }
]
```

RLS policies (Option A focus):

```sql
select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles',
    'profile_follows',
    'profile_blocks',
    'admin_users',
    'catches',
    'notifications'
  )
order by tablename, policyname;
```

Captured on 2026-01-04 (from SQL editor output):

```json
[
  {
    "schemaname": "public",
    "tablename": "admin_users",
    "policyname": "admin_users_self_select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "catches",
    "policyname": "catches_admin_read_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "is_admin(uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "catches",
    "policyname": "catches_owner_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "catches",
    "policyname": "catches_owner_mutate",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((uid() = user_id) AND (NOT is_admin(uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "catches",
    "policyname": "catches_owner_update_delete",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "((uid() = user_id) AND (NOT is_admin(uid())))",
    "with_check": "((uid() = user_id) AND (NOT is_admin(uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "catches",
    "policyname": "catches_public_read",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((deleted_at IS NULL) AND ((uid() = user_id) OR (EXISTS ( SELECT 1\n   FROM admin_users au\n  WHERE (au.user_id = uid()))) OR ((COALESCE(is_blocked_either_way(uid(), user_id), false) = false) AND (((visibility = 'public'::visibility_type) AND ((NOT (EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = catches.user_id) AND (p.is_private = true))))) OR ((uid() IS NOT NULL) AND (EXISTS ( SELECT 1\n   FROM profile_follows pf\n  WHERE ((pf.follower_id = uid()) AND (pf.following_id = catches.user_id))))))) OR ((visibility = 'followers'::visibility_type) AND (uid() IS NOT NULL) AND (EXISTS ( SELECT 1\n   FROM profile_follows pf\n  WHERE ((pf.follower_id = uid()) AND (pf.following_id = catches.user_id)))))))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "notifications",
    "policyname": "notifications_admin_read",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "is_admin(uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "notifications",
    "policyname": "notifications_recipient_only",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(uid() = user_id)",
    "with_check": "(uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "profile_blocks",
    "policyname": "profile_blocks_delete_admin_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(EXISTS ( SELECT 1\n   FROM admin_users au\n  WHERE (au.user_id = uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profile_blocks",
    "policyname": "profile_blocks_delete_self",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(uid() = blocker_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profile_blocks",
    "policyname": "profile_blocks_insert_admin_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(EXISTS ( SELECT 1\n   FROM admin_users au\n  WHERE (au.user_id = uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "profile_blocks",
    "policyname": "profile_blocks_insert_self",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(uid() = blocker_id)"
  },
  {
    "schemaname": "public",
    "tablename": "profile_blocks",
    "policyname": "profile_blocks_select_admin_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM admin_users au\n  WHERE (au.user_id = uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profile_blocks",
    "policyname": "profile_blocks_select_self_or_blocked",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((uid() = blocker_id) OR (uid() = blocked_id))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profile_follows",
    "policyname": "profile_follows_admin_select_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "is_admin(uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profile_follows",
    "policyname": "profile_follows_insert_not_blocked",
    "permissive": "RESTRICTIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((uid() = follower_id) AND (following_id <> uid()) AND (NOT is_blocked_either_way(uid(), following_id)))"
  },
  {
    "schemaname": "public",
    "tablename": "profile_follows",
    "policyname": "profile_follows_owner_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(uid() = follower_id)",
    "with_check": "(uid() = follower_id)"
  },
  {
    "schemaname": "public",
    "tablename": "profile_follows",
    "policyname": "profile_follows_select_related",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((uid() = follower_id) OR (uid() = following_id))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "profiles_select_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "profiles_update_self",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(uid() = id)",
    "with_check": null
  }
]
```

Table grants (visibility of auth-only data):

```sql
select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in (
    'profiles',
    'profile_follows',
    'profile_blocks',
    'admin_users',
    'catches',
    'notifications'
  )
order by table_name, grantee, privilege_type;
```

Captured on 2026-01-04 (from SQL editor output):

```json
[
  {
    "table_schema": "public",
    "table_name": "admin_users",
    "grantee": "anon",
    "privileges": "{DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE}"
  },
  {
    "table_schema": "public",
    "table_name": "admin_users",
    "grantee": "authenticated",
    "privileges": "{DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE}"
  },
  {
    "table_schema": "public",
    "table_name": "admin_users",
    "grantee": "service_role",
    "privileges": "{DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE}"
  },
  {
    "table_schema": "public",
    "table_name": "catches",
    "grantee": "anon",
    "privileges": "{DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE}"
  },
  {
    "table_schema": "public",
    "table_name": "catches",
    "grantee": "authenticated",
    "privileges": "{DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE}"
  },
  {
    "table_schema": "public",
    "table_name": "catches",
    "grantee": "service_role",
    "privileges": "{DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE}"
  },
  {
    "table_schema": "public",
    "table_name": "notifications",
    "grantee": "anon",
    "privileges": "{DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE}"
  },
  {
    "table_schema": "public",
    "table_name": "notifications",
    "grantee": "authenticated",
    "privileges": "{DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE}"
  },
  {
    "table_schema": "public",
    "table_name": "notifications",
    "grantee": "service_role",
    "privileges": "{DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE}"
  },
  {
    "table_schema": "public",
    "table_name": "profile_blocks",
    "grantee": "anon",
    "privileges": "{DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE}"
  },
  {
    "table_schema": "public",
    "table_name": "profile_blocks",
    "grantee": "authenticated",
    "privileges": "{DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE}"
  },
  {
    "table_schema": "public",
    "table_name": "profile_blocks",
    "grantee": "service_role",
    "privileges": "{DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE}"
  },
  {
    "table_schema": "public",
    "table_name": "profile_follows",
    "grantee": "anon",
    "privileges": "{DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE}"
  },
  {
    "table_schema": "public",
    "table_name": "profile_follows",
    "grantee": "authenticated",
    "privileges": "{DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE}"
  },
  {
    "table_schema": "public",
    "table_name": "profile_follows",
    "grantee": "service_role",
    "privileges": "{DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE}"
  },
  {
    "table_schema": "public",
    "table_name": "profiles",
    "grantee": "anon",
    "privileges": "{DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE}"
  },
  {
    "table_schema": "public",
    "table_name": "profiles",
    "grantee": "authenticated",
    "privileges": "{DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE}"
  },
  {
    "table_schema": "public",
    "table_name": "profiles",
    "grantee": "service_role",
    "privileges": "{DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE}"
  }
]
```

## F) HAR capture plan

Anon (no session):

- `/profile/:slug` -> redirect to `/auth`; zero Supabase calls (rest/v1, rpc, storage, realtime).
  - HAR: `har-files/profile-detail_anon_redirect_no-network.har`
- `/feed` -> redirect to `/auth`; zero Supabase calls.
  - HAR: `har-files/feed_anon_redirect_no-network.har`

Authenticated non-owner (Option A expectations):

- Public profile:

  - Expect: profile read + follower count + follow status + block status + catches.
  - Confirm no moderation fields in payloads.
  - HAR: `har-files/profile-detail_non-owner_public_view.har`

- Private profile (not allowed):

  - Expect: same UX/network shape as missing/blocked (generic "not available").
  - Prefer: no `get_follower_count`, no `profile_follows`, no `catches` queries; if calls exist, responses must be non-distinguishing (0 rows, generic errors).
  - HAR: `har-files/profile-detail_non-owner_private_deny.har`

- Blocked profile (either direction):

  - Expect: same as missing/private (generic deny, no distinct reason strings).
  - HAR: `har-files/profile-detail_non-owner_blocked_deny.har`

- Missing/deleted profile:
  - Expect: same as private/blocked (generic deny).
  - HAR: `har-files/profile-detail_non-owner_missing_deny.har`

Authenticated owner/admin (sanity):

- Owner view with notifications and moderation status present only to owner.
  - HAR: `har-files/profile-detail_owner_view.har`
- Admin view of deleted profile (if intended).
  - HAR: `har-files/profile-detail_admin_deleted_view.har`

Feed (authenticated):

- Default feed load:
  - Expect: `get_feed_catches` + `get_species_options`; `venues` only when filter used.
  - HAR: `har-files/feed_auth_default.har`
- Following-only scope:
  - Expect: `get_feed_catches` with `p_scope=following` and no private/blocked leakage.
  - HAR: `har-files/feed_auth_following.har`

## Go/No-Go before surface work

- Verify `RequireAuth` behavior with anon HARs for `/profile/:slug` and `/feed` (zero Supabase calls).
- Confirm RLS and grants enforce Option A privacy (private/blocked/missing are indistinguishable and return 0 rows).
- Confirm `get_follower_count` and relationship RPCs do not leak existence/blocked/private via outputs or errors.
- Confirm profile payloads for non-admin do not include moderation fields.
- Confirm `get_feed_catches` does not return private/blocked profiles or their catches.
