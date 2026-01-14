# Catch Detail Pipeline (E2E)
<!-- PHASE-GATES:START -->
## Phase Gates

| Gate | Status | Evidence | Notes |
| --- | --- | --- | --- |
| Contract & personas defined | PASS | Contract section below | |
| Data entrypoints inventoried (tables/RPC/storage/realtime) | PASS | Entrypoints inventory below | |
| Anti-enumeration UX verified | PASS | `docs/version5/hardening/surfaces/catch-detail/evidence/har/HAR_catch-detail_anon_redirect_YYYY-MM-DD.har` (+ screenshot) | RequireAuth redirect to /auth confirmed; no Supabase data calls for anon before redirect. |
| RLS/policies verified for surface tables | PASS | `docs/version5/hardening/surfaces/catch-detail/evidence/sql/SQL_catch-detail_rls_policies_YYYY-MM-DD.txt` | Verified via pg_policies output for catches/catch_reactions/profile_follows/catch_comments/admin_users. |
| Grants verified (least privilege) | PASS | `docs/version5/hardening/surfaces/catch-detail/evidence/sql/SQL_catch-detail_grants_YYYY-MM-DD.txt` | Verified table/view grants snapshot for anon/authenticated aligns with Path A (auth-only route). |
| RPC posture verified (EXECUTE + SECURITY DEFINER hygiene if used) | PASS | `docs/version5/hardening/surfaces/catch-detail/evidence/sql/SQL_catch-detail_routine_privileges_post2159_YYYY-MM-DD.txt`; `docs/version5/hardening/surfaces/catch-detail/evidence/sql/SQL_catch-detail_rpc_posture_YYYY-MM-DD.txt` | Post-2158/2159: anon/PUBLIC cannot EXECUTE catch-detail interaction RPCs; ratings RPC is authenticated-only (Path A). |
| Manual UX pass (4 personas) | TODO | HAR + screenshots | |
| SQL probe evidence captured | PASS | `docs/version5/hardening/surfaces/catch-detail/sql/CATCH-DETAIL-PROBES.sql` + outputs under `evidence/sql/` | Probe pack executed; outputs saved per filenames in Evidence checklist. |
| Result | PASS-with-notes | See gates above | Remaining: complete Manual UX pass HAR set for authenticated/owner/admin interactions per checklist (optional hardening completeness). |
<!-- PHASE-GATES:END -->

<!-- PERSONA-CONTRACT-REF:START -->
Persona contract: `docs/version5/hardening/_global/legacy/PERSONA-PERMISSIONS.md`
<!-- PERSONA-CONTRACT-REF:END -->


## Scope
- Route: `/catch/:id` (RequireAuth). `src/App.tsx:241`, `src/App.tsx:58`.
- Page: `src/pages/CatchDetail.tsx`.
- Route params: `:id` is passed as `catchId` into data queries and RPCs; `id === "new"` redirects to `/add-catch`. `src/pages/CatchDetail.tsx:70`, `src/pages/CatchDetail.tsx:151`.
- Query params: `?commentId=...` is read and used to expand/scroll to a comment. `src/pages/CatchDetail.tsx:72`, `src/components/CatchComments.tsx:839`.
- Related routes: `/add-catch` (redirect), `/feed` (inaccessible catch), `/auth` (RequireAuth redirect).
- Auth gate: RequireAuth sends unauthenticated users to `/auth` and shows a route skeleton while loading. `src/App.tsx:58`.
- Admin gate: no route-level admin guard; admin status is fetched for UI decisions. `src/pages/catch-detail/hooks/useCatchDetailData.ts:179`, `src/lib/admin.ts:10`.

## Contract (personas + allow/deny UX)

### Personas
- anon: denied; RequireAuth redirects to `/auth`. No data access required for this surface under Path A. `src/App.tsx:58`.
- authenticated: can view catches allowed by RLS, react/follow/rate/comment/report; can edit/delete only their own catches. `src/pages/CatchDetail.tsx:712`, `src/hooks/useCatchInteractions.ts:84`, `src/components/CatchComments.tsx:397`.
- owner: same as authenticated + edit/delete affordances for their own catch. `src/pages/CatchDetail.tsx:712`.
- admin: no route-level admin gate; UI hides edit/delete for admins, but admin can delete comments and bypasses client-side comment rate-limit checks. `src/pages/CatchDetail.tsx:712`, `src/components/CatchComments.tsx:441`, `src/components/CatchComments.tsx:574`.

### Deny / anti-enumeration UX (code paths)
- Inaccessible catch shows a generic message and redirects to `/feed`. `src/pages/catch-detail/hooks/useCatchDetailData.ts:89-93`.
- Rating summary access errors use generic copy (“Ratings unavailable” / “You can’t view ratings for this catch”). `src/pages/CatchDetail.tsx:469-478`.
- Comment access errors map to generic copy (“You don't have access to comment on this catch”). `src/components/CatchComments.tsx:467-468`.

## Evidence checklist (minimal)

- Anon redirect (auth gate): `docs/version5/hardening/surfaces/catch-detail/evidence/har/HAR_catch-detail_anon_redirect_YYYY-MM-DD.har`
- Anon redirect screenshot: `docs/version5/hardening/surfaces/catch-detail/evidence/img/IMG_catch-detail_anon_redirect_YYYY-MM-DD.png`
- View catch (authenticated): `docs/version5/hardening/surfaces/catch-detail/evidence/har/HAR_catch-detail_auth_view_YYYY-MM-DD.har`
- React add/remove: `docs/version5/hardening/surfaces/catch-detail/evidence/har/HAR_catch-detail_react_add_YYYY-MM-DD.har`, `..._react_remove_YYYY-MM-DD.har`
- Follow/unfollow: `docs/version5/hardening/surfaces/catch-detail/evidence/har/HAR_catch-detail_follow_add_YYYY-MM-DD.har`, `..._follow_remove_YYYY-MM-DD.har`
- Rate catch: `docs/version5/hardening/surfaces/catch-detail/evidence/har/HAR_catch-detail_rate_add_YYYY-MM-DD.har`
- Comment add/delete: `docs/version5/hardening/surfaces/catch-detail/evidence/har/HAR_catch-detail_comment_add_YYYY-MM-DD.har`, `..._comment_delete_YYYY-MM-DD.har`
- Report content: `docs/version5/hardening/surfaces/catch-detail/evidence/har/HAR_catch-detail_report_submit_YYYY-MM-DD.har`
- Owner-only edits (optional): `docs/version5/hardening/surfaces/catch-detail/evidence/har/HAR_catch-detail_edit_YYYY-MM-DD.har`, `..._delete_YYYY-MM-DD.har`

### SQL probe outputs
- RPC posture (prosecdef/proconfig/proacl): `docs/version5/hardening/surfaces/catch-detail/evidence/sql/SQL_catch-detail_rpc_posture_YYYY-MM-DD.txt`
- Routine privileges (post-2159): `docs/version5/hardening/surfaces/catch-detail/evidence/sql/SQL_catch-detail_routine_privileges_post2159_YYYY-MM-DD.txt`
- Grants for touched tables/views: `docs/version5/hardening/surfaces/catch-detail/evidence/sql/SQL_catch-detail_grants_YYYY-MM-DD.txt`
- RLS policies for touched tables: `docs/version5/hardening/surfaces/catch-detail/evidence/sql/SQL_catch-detail_rls_policies_YYYY-MM-DD.txt`
- View posture (owner/reloptions/security_invoker): `docs/version5/hardening/surfaces/catch-detail/evidence/sql/SQL_catch-detail_view_posture_YYYY-MM-DD.txt`
- Probe pack source: `docs/version5/hardening/surfaces/catch-detail/sql/CATCH-DETAIL-PROBES.sql`

## Surface narrative (step-by-step)
1) Route access and params
   - RequireAuth gates the route; unauthenticated users are navigated to `/auth` with the current location in state. `src/App.tsx:58`.
   - `:id` is taken from the route. If `id === "new"`, the page redirects to `/add-catch`. `src/pages/CatchDetail.tsx:70`, `src/pages/CatchDetail.tsx:151`.
   - `commentId` query param is read and passed into comments for expansion/scroll. `src/pages/CatchDetail.tsx:72`, `src/components/CatchComments.tsx:839`.

2) Initial load
   - `useCatchDetailData` runs and triggers: catch fetch, rating summary RPC, reactions, follow status, admin status, and comments/mention queries. `src/pages/CatchDetail.tsx:91`, `src/pages/catch-detail/hooks/useCatchDetailData.ts:50`, `src/hooks/useCatchComments.ts:147`.
   - Catch fetch: PostgREST select on `catches` with embedded `profiles`, `session`, and `venues`. `src/pages/catch-detail/hooks/useCatchDetailData.ts:54`.
   - Rating summary: `get_catch_rating_summary` RPC. `src/pages/catch-detail/hooks/useCatchDetailData.ts:100`.
   - Reactions: select `catch_reactions` for the catch. `src/pages/catch-detail/hooks/useCatchDetailData.ts:134`.
   - Follow status: select `profile_follows` for viewer -> owner. `src/pages/catch-detail/hooks/useCatchDetailData.ts:159`.
   - Admin status: `admin_users` lookup via `isAdminUser`. `src/pages/catch-detail/hooks/useCatchDetailData.ts:179`, `src/lib/admin.ts:14`.
   - Comments list: select from `catch_comments_with_admin` view and mention candidates from `catch_mention_candidates`. `src/hooks/useCatchComments.ts:151`, `src/hooks/useCatchComments.ts:176`.

3) Loading and deny behavior
   - While loading or if no catch data yet, the page shows a loading spinner. `src/pages/CatchDetail.tsx:168`.
   - If catch fetch returns null (not found or not viewable), a toast is shown and the user is redirected to `/feed`. `src/pages/catch-detail/hooks/useCatchDetailData.ts:89`.
   - Rating summary errors are surfaced in the UI (unavailable or access denied). `src/pages/CatchDetail.tsx:469`.

4) Interaction flows (writes and side effects)
   - Follow/unfollow: follow uses `follow_profile_with_rate_limit` RPC; unfollow deletes from `profile_follows`. `src/hooks/useCatchInteractions.ts:74`, `src/hooks/useCatchInteractions.ts:84`.
   - Reactions: add uses `react_to_catch_with_rate_limit` RPC; remove deletes from `catch_reactions`. `src/hooks/useCatchInteractions.ts:101`, `src/hooks/useCatchInteractions.ts:111`.
   - Ratings: `rate_catch_with_rate_limit` RPC with 1-10 slider input; UI blocks self-rating and disabled ratings. `src/hooks/useCatchInteractions.ts:130`, `src/hooks/useCatchInteractions.ts:410`.
   - Comments: posting calls `create_comment_with_rate_limit` RPC; delete calls `soft_delete_comment` RPC. `src/components/CatchComments.tsx:395`, `src/components/CatchComments.tsx:412`.
   - Report catch/comment: `create_report_with_rate_limit` RPC, then `notify_admins_for_report`. `src/components/ReportButton.tsx:51`, `src/lib/notifications.ts:126`.
   - Edit catch (owner-only UI): updates `description` and `tags` via `updateCatchFields` (PostgREST update). `src/pages/CatchDetail.tsx:712`, `src/pages/CatchDetail.tsx:821`, `src/lib/supabase-queries.ts:306`.
   - Delete catch (owner-only UI): soft delete via `deleteCatch` (PostgREST update). `src/pages/CatchDetail.tsx:744`, `src/hooks/useCatchInteractions.ts:148`, `src/lib/supabase-queries.ts:286`.

5) Share flows (no DB)
   - Copy/share link uses computed public URL. `src/hooks/useCatchInteractions.ts:294`, `src/hooks/useCatchInteractions.ts:301`.
   - Share to WhatsApp opens `https://wa.me` with a composed message. `src/hooks/useCatchInteractions.ts:313`.
   - Download share image renders a DOM snapshot with `html2canvas`. `src/hooks/useCatchInteractions.ts:381`.

## Entrypoints inventory (with file:line)

### RPCs
| RPC | Args | File | Notes |
| --- | --- | --- | --- |
| get_catch_rating_summary | p_catch_id | `src/pages/catch-detail/hooks/useCatchDetailData.ts:100` | SECURITY DEFINER, visibility + block checks. `supabase/migrations/2113_harden_get_catch_rating_summary.sql:5`. |
| follow_profile_with_rate_limit | p_following_id | `src/hooks/useCatchInteractions.ts:84` | SECURITY DEFINER; rate limit + blocked/self checks. `supabase/migrations/2117_harden_profile_follows_rls.sql:44`. |
| react_to_catch_with_rate_limit | p_catch_id, p_reaction | `src/hooks/useCatchInteractions.ts:111` | SECURITY DEFINER; visibility + rate limit. `supabase/migrations/2105_react_catch_visibility_fix.sql:6`. |
| rate_catch_with_rate_limit | p_catch_id, p_rating | `src/hooks/useCatchInteractions.ts:130` | SECURITY DEFINER; visibility + allow_ratings + rate limit; server emits notification. `supabase/migrations/2104_rate_catch_notifications.sql:6`. |
| create_comment_with_rate_limit | p_catch_id, p_body, p_parent_comment_id | `src/components/CatchComments.tsx:397` | SECURITY DEFINER; visibility + block + rate limit; inserts comments and emits notifications. `supabase/migrations/2112_fix_rate_limit_helpers_single_logger.sql:79`. |
| soft_delete_comment | p_comment_id | `src/components/CatchComments.tsx:414` | SECURITY DEFINER; owner/admin delete. `supabase/migrations/2024_phase2_comments_threading_enhancements.sql:221`. |
| create_report_with_rate_limit | p_target_type, p_target_id, p_reason, p_details | `src/components/ReportButton.tsx:51` | SECURITY DEFINER; target visibility + rate limit. `supabase/migrations/2112_fix_rate_limit_helpers_single_logger.sql:245`. |
| create_notification | p_user_id, p_actor_id, p_type, p_message, p_catch_id, p_comment_id, p_extra_data | `src/lib/notifications.ts:40` | SECURITY DEFINER. Used by follow/reaction client actions. `supabase/migrations/2044_allow_admin_report_notifications.sql:8`. |
| notify_admins_for_report | p_report_id, p_message, p_extra_data | `src/lib/notifications.ts:126` | SECURITY DEFINER; fan-out to admins via notifications. `supabase/migrations/2153_admin_venues_hardening.sql:152`. |

### PostgREST
| Table/View | Operations | File | Notes |
| --- | --- | --- | --- |
| catches | select | `src/pages/catch-detail/hooks/useCatchDetailData.ts:55` | Select with embedded `profiles`, `session`, `venues`. RLS via `catches_public_read`. `supabase/migrations/2134_reinstate_catches_feed_visibility.sql:10`. |
| catches | update | `src/lib/supabase-queries.ts:288` | Soft delete (sets `deleted_at`, `updated_at`). RLS via `catches_owner_update_delete`. `supabase/migrations/2097_block_admin_catch_inserts.sql:24`. |
| catches | update | `src/lib/supabase-queries.ts:310` | Edit description/tags (owner-only in UI). RLS via `catches_owner_update_delete`. `supabase/migrations/2097_block_admin_catch_inserts.sql:24`. |
| catch_reactions | select | `src/pages/catch-detail/hooks/useCatchDetailData.ts:134` | Reaction counts for a catch. |
| catch_reactions | delete | `src/hooks/useCatchInteractions.ts:101` | Remove reaction (client). |
| profile_follows | select | `src/pages/catch-detail/hooks/useCatchDetailData.ts:159` | Follow status check. |
| profile_follows | delete | `src/hooks/useCatchInteractions.ts:74` | Unfollow action. |
| admin_users | select | `src/lib/admin.ts:14` | Admin check used in UI and comment admin flags. |
| catch_comments_with_admin (view) | select | `src/hooks/useCatchComments.ts:151` | View filters blocked users and flags admin authors. `supabase/migrations/2153_admin_venues_hardening.sql:122`. |
| catch_mention_candidates (view) | select | `src/hooks/useCatchComments.ts:176` | Mention candidates (owner + commenters). `supabase/migrations/2041_mention_candidates_per_catch.sql:6`. |

### Storage
- None found (no `supabase.storage` usage on this surface).

### Realtime
- None found.

### Third-party APIs
- WhatsApp share link via `https://wa.me`. `src/hooks/useCatchInteractions.ts:313`.

## Implicit DB side-effects
- Comment creation inserts into `catch_comments`, triggers `set_comment_admin_author` and rate-limit trigger, and emits notifications for mentions/new comments. `supabase/migrations/2153_admin_venues_hardening.sql:115`, `supabase/migrations/1003_rate_limits_and_helpers.sql:164`, `supabase/migrations/2112_fix_rate_limit_helpers_single_logger.sql:79`.
- Comment deletion uses `soft_delete_comment` (updates `catch_comments.deleted_at`), which also updates `updated_at` via trigger. `supabase/migrations/2024_phase2_comments_threading_enhancements.sql:221`, `supabase/migrations/2010_core_align_with_erd.sql:48`.
- Rating RPC inserts/updates `ratings`, writes `rate_limits`, and emits `create_notification`. `supabase/migrations/2104_rate_catch_notifications.sql:6`.
- Reaction RPC inserts/updates `catch_reactions` and writes `rate_limits`. `supabase/migrations/2105_react_catch_visibility_fix.sql:6`.
- Follow RPC inserts into `profile_follows` and writes `rate_limits`. `supabase/migrations/2117_harden_profile_follows_rls.sql:44`.
- Report RPC inserts into `reports`; `enforce_report_rate_limit_trigger` runs on insert; `notify_admins_for_report` fans out admin notifications. `supabase/migrations/2112_fix_rate_limit_helpers_single_logger.sql:245`, `supabase/migrations/1003_rate_limits_and_helpers.sql:171`, `supabase/migrations/2153_admin_venues_hardening.sql:152`.
- Catch edits/soft deletes update `catches`, firing `trg_catches_set_updated_at` and `trg_community_stats_catches`. `supabase/migrations/1001_core_schema.sql:187`, `supabase/migrations/2137_community_stats_live.sql:251`.

## Security posture notes (facts only)
- Route is gated by `RequireAuth`; unauthenticated users are redirected to `/auth`. `src/App.tsx:58`.
- Catch access is enforced by RLS on `catches` (public/admin/owner/follower visibility and block checks). `supabase/migrations/2134_reinstate_catches_feed_visibility.sql:10`.
- Owner edit/delete operations rely on RLS (`catches_owner_update_delete`); UI hides edit/delete for admins and non-owners. `supabase/migrations/2097_block_admin_catch_inserts.sql:24`, `src/pages/CatchDetail.tsx:712`.
- Rating, reaction, follow, comment, and report writes go through SECURITY DEFINER RPCs that enforce visibility and rate limits server-side. `supabase/migrations/2104_rate_catch_notifications.sql:6`, `supabase/migrations/2105_react_catch_visibility_fix.sql:6`, `supabase/migrations/2117_harden_profile_follows_rls.sql:44`, `supabase/migrations/2112_fix_rate_limit_helpers_single_logger.sql:79`, `supabase/migrations/2112_fix_rate_limit_helpers_single_logger.sql:245`.
- SECURITY DEFINER RPCs in this surface set `search_path = public, extensions` (not empty). Verify hygiene (schema-qualified refs, least-privilege EXECUTE) via the RPC posture probes. Examples: `supabase/migrations/2104_rate_catch_notifications.sql:4`, `supabase/migrations/2105_react_catch_visibility_fix.sql:4`.
- Comment and mention reads use views (`catch_comments_with_admin`, `catch_mention_candidates`). Views do not specify `security_invoker` in migrations; verify view owner/reloptions to confirm RLS posture. `supabase/migrations/2153_admin_venues_hardening.sql:122`, `supabase/migrations/2041_mention_candidates_per_catch.sql:6`.
- Path A (auth-only): `get_catch_rating_summary` EXECUTE is authenticated-only (2159), despite historical migrations granting anon; verify via routine_privileges evidence. 
- `create_notification` and `notify_admins_for_report` are SECURITY DEFINER with `search_path = public, extensions` (not empty). `supabase/migrations/2044_allow_admin_report_notifications.sql:8`, `supabase/migrations/2153_admin_venues_hardening.sql:152`.

## Error hygiene (UI)
- Inaccessible catch uses generic messaging and redirects to `/feed`. `src/pages/catch-detail/hooks/useCatchDetailData.ts:89-93`.
- Rating summary access errors are generic (“Ratings unavailable” / “You can’t view ratings for this catch”). `src/pages/CatchDetail.tsx:469-478`.
- Interaction failures use generic toasts (rate-limit friendly messages, no table/policy names). `src/hooks/useCatchInteractions.ts:222-282`, `src/components/ReportButton.tsx:58-64`.
- Comment errors map to safe messages; raw error strings are not displayed directly. `src/components/CatchComments.tsx:461-477`.

## SQL queries to run during sweep
```
-- Grants for touched tables/views
select *
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'catches','profiles','sessions','venues',
    'catch_reactions','profile_follows','catch_comments',
    'catch_comments_with_admin','catch_mention_candidates',
    'ratings','reports','notifications','rate_limits','admin_users'
  );

-- RLS policies for touched tables
select *
from pg_policies
where schemaname = 'public'
  and tablename in (
    'catches','profiles','sessions','venues',
    'catch_reactions','profile_follows','catch_comments',
    'ratings','reports','notifications','rate_limits','admin_users'
  );

-- View security posture (security_invoker, owner, reloptions)
select c.relname, c.relkind, c.relowner::regrole, c.reloptions
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('catch_comments_with_admin','catch_mention_candidates');

-- RPC posture
select proname, pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in (
    'get_catch_rating_summary',
    'follow_profile_with_rate_limit',
    'react_to_catch_with_rate_limit',
    'rate_catch_with_rate_limit',
    'create_comment_with_rate_limit',
    'soft_delete_comment',
    'create_report_with_rate_limit',
    'create_notification',
    'notify_admins_for_report'
  );

select *
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in (
    'get_catch_rating_summary',
    'follow_profile_with_rate_limit',
    'react_to_catch_with_rate_limit',
    'rate_catch_with_rate_limit',
    'create_comment_with_rate_limit',
    'soft_delete_comment',
    'create_report_with_rate_limit',
    'create_notification',
    'notify_admins_for_report'
  );

select proname, prosecdef, proconfig
from pg_proc
join pg_namespace n on n.oid = pronamespace
where n.nspname = 'public'
  and proname in (
    'get_catch_rating_summary',
    'follow_profile_with_rate_limit',
    'react_to_catch_with_rate_limit',
    'rate_catch_with_rate_limit',
    'create_comment_with_rate_limit',
    'soft_delete_comment',
    'create_report_with_rate_limit',
    'create_notification',
    'notify_admins_for_report'
  );

-- Trigger posture (catch/comment/report side-effects)
select tgname, pg_get_triggerdef(t.oid)
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('catches','catch_comments','reports');
```

## Open verification items
- Verify whether soft-deleting a catch (update to `catches.deleted_at`) cascades to ratings/reactions/comments or only hides the catch via RLS (UI copy claims removal). How to verify: inspect foreign keys/on-delete triggers and attempt delete in a test DB, then check related tables for rows.
- Confirm view security posture for `catch_comments_with_admin` and `catch_mention_candidates` (owner/reloptions, security_invoker) to ensure no unintended RLS bypass. How to verify: check `pg_class.reloptions` and view owner role in SQL.

## Repro commands used
```
rg -n "catch-detail|catch detail|/catch|CatchDetail" src -S
rg -n "supabase\\.rpc\\(|supabase\\.from\\(|storage\\.from\\(|channel\\(|postgres_changes|realtime" src/pages/CatchDetail.tsx src/pages/catch-detail src/components/catch-detail src/hooks -S
rg -n "supabase\\.rpc\\(|supabase\\.from\\(|storage\\.from\\(|channel\\(|postgres_changes|realtime" src/components/catch-detail -S
rg -n "supabase\\." src/components/CatchComments.tsx -S
rg -n "ReportButton" src/pages/CatchDetail.tsx -S
rg -n "ReportButton" src/components/CatchComments.tsx -S
rg -n "updateCatchMutation|edit" src/pages/CatchDetail.tsx -S
rg -n "ratingSummary|ratingSummaryAccessError|ratingSummaryError" src/pages/CatchDetail.tsx -S
rg -n "targetCommentId" src/components/CatchComments.tsx -S
rg -n "updateCatchFields|deleteCatch" src/lib -S
rg -n "function createNotification|createNotification" src/lib -S
rg -n "get_catch_rating_summary|follow_profile_with_rate_limit|react_to_catch_with_rate_limit|rate_catch_with_rate_limit|create_comment_with_rate_limit|soft_delete_comment|create_report_with_rate_limit|create_notification|notify_admins_for_report" supabase/migrations -S
rg -n "catch_comments_with_admin|catch_mention_candidates" supabase/migrations -S
rg -n "trigger.*catches|catches.*trigger|on catch|update.*catches" supabase/migrations -S
rg -n "catches_.*policy|policy .*catches|catches_select|catches_public" supabase/migrations -S
rg -n "catch_comments" supabase/migrations -S
rg -n "RequireAuth" src -S
```
