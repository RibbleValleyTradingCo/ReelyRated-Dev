# Feed Production Readiness Review

Date: 2025-12-29  
Commit: 40c966b

Scope
- Route: /feed (App.tsx -> RequireAuth -> Feed.tsx)
- Primary components: Feed.tsx, CatchCard.tsx, FeedFilters.tsx
- Data hook: useFeedData.ts (useInfiniteQuery -> get_feed_catches RPC)
- Related RPCs/views: get_feed_catches (2121_add_feed_catches_rpc.sql), get_catch_rating_summary (2113_harden_get_catch_rating_summary.sql)

Method
- Code inspection only (no manual UI run in this pass)
- DB/RLS review via migrations

## Entry Points + Data Flow

- Feed page (Feed.tsx) uses useFeedData to fetch feed pages via get_feed_catches (RPC), with PAGE_SIZE=18 and offset pagination.
- Filter state (scope/species/sort/custom species/venue/session) is encoded in qk.feed(...) and drives the query.
- Venue filter uses direct table read on venues (RLS enforced).
- Each CatchCard triggers a per-card get_catch_rating_summary RPC to compute rating summary with block/visibility logic.

## Test Matrix (roles x scenarios)

| Scenario | anon | authenticated | blocked user | deleted user | empty feed | large feed |
| --- | --- | --- | --- | --- | --- | --- |
| Base feed load | N/A (route gated) | Reviewed | Reviewed | Reviewed | Reviewed | Reviewed |
| Filters (scope/species/venue/session) | N/A | Reviewed | Reviewed | Reviewed | Reviewed | Reviewed |
| Pagination (load more) | N/A | Reviewed | Reviewed | Reviewed | Reviewed | Reviewed |

## Findings

| Issue | Severity | Where | Steps | Expected | Actual | Root cause | Fix recommendation | UI-only vs DB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Block/privacy enforcement missing in catches SELECT policy | P1 | supabase/migrations/2025_fix_catch_visibility.sql | Block a user (or use a private profile) then load /feed | Blocked or private-profile catches should not appear | Catches can appear because RLS no longer checks is_blocked_either_way / profile privacy | catches_select_viewable removed block/privacy checks from 2063_profile_blocks_enforcement.sql | Reintroduce block/privacy checks in the active SELECT policy (or replace with a stricter policy) | DB change |
| GPS data can leak via feed RPC | P1 | supabase/migrations/2121_add_feed_catches_rpc.sql | Create a catch with hide_exact_spot=true + GPS data, then inspect get_feed_catches response | GPS should be stripped/obfuscated for non-owner viewers | conditions JSON is returned as stored (including gps) | get_feed_catches returns c.conditions verbatim | Redact gps from conditions when hide_exact_spot is true and viewer is not owner/admin, or return null/filtered conditions | DB change |
| Feed not invalidated after new catch creation | P2 (resolved) | src/pages/AddCatch.tsx | Add a catch, then land on /feed within 30s | New catch should appear immediately | Previously could show cached feed until staleTime elapsed | Missing qk.feedBase invalidation after insert | Added invalidateQueries(qk.feedBase()) after catch insert | UI change (done) |
| Feed counts can be stale after reactions/comments/ratings | P2 (resolved) | src/hooks/useCatchInteractions.ts, src/components/CatchComments.tsx | React/comment/rate on a catch, return to /feed quickly | Counts should reflect the latest DB state | Fixed: feed invalidates on comment/reaction/rating success | Missing qk.feedBase invalidation on those mutations | Implemented: invalidate qk.feedBase on comment/reaction/rating success | UI change (done) |
| N+1 rating summary calls per feed page | P2 | src/components/feed/CatchCard.tsx | Load feed with 18+ cards | Ratings summary should not require per-card RPC | get_catch_rating_summary is called per card | CatchCard ignores avg_rating/rating_count from feed RPC and makes per-card calls | Prefer feed RPC aggregates for display; keep summary RPC only when needed | UI change |

## Cache + Invalidation Map

- Feed data: useInfiniteQuery(qk.feed(params)) -> get_feed_catches
- AddCatch: inserts into catches -> invalidates qk.feedBase (added) + venue queries
- Delete catch (CatchDetail): remove catch queries + invalidate qk.feedBase
- Comment/reaction/rating: invalidate qk.feedBase on success (useCatchInteractions + CatchComments)

## RLS/Security Notes

- get_feed_catches is SECURITY INVOKER and relies on catches RLS.
- Current catches SELECT policy in 2025_fix_catch_visibility.sql does not include block/privacy checks present in 2063_profile_blocks_enforcement.sql.
- get_catch_rating_summary includes block/visibility checks, which can conflict with feed visibility if RLS is looser.

## Manual Testing Notes

- Not executed in this pass (code-only review)
