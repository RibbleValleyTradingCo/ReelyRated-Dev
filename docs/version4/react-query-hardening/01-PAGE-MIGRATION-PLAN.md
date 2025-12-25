# Page Migration Plan

_Last updated: 2025-12-25_

## Current status

- **VenueDetail (/venues/:slug)**: migrated to React Query (reference implementation).
- **Feed**: migrated to React Query and now uses a **server-shaped** read for scope/species/sort (so infinite pagination remains globally correct).
- **Next up**: Notifications surfaces (bell + profile section).

Notes:

- Query keys must be **arrays** and should include **every variable that affects the result**.
- Infinite queries should use `getNextPageParam` + `fetchNextPage()` and must not rely on client-only global sorting across partially loaded pages.

## Overview table

| Page                     | Current approach                                          | Target React Query approach                                                              | Query key(s) (via key factory)                                                 | Definition of Done                                                   | PR slicing |
| ------------------------ | --------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ---------- |
| Feed                     | useEffect + manual Supabase reads, local pagination state | useInfiniteQuery + **server-side** scope/species/sort + stable paging + id dedupe        | `qk.feed({ scope, sort, species, customSpecies, venueId, sessionId, userId })` | No focus flicker, pagination stable, no duplicates, globally correct | PR#1 ✅    |
| CatchDetail              | useEffect + hook-based reads + manual refetch             | useQuery for catchById + ratings/reactions/comments + targeted invalidation/mutations    | `qk.catchById(catchId)`, `qk.catchRatingSummary(catchId, userId)`, `qk.catchComments(catchId)` | No rating/comment flash, no duplicate fetches                        | PR#2 ✅    |
| Profile                  | mixed useEffect + direct reads                            | useQuery for profile + useInfiniteQuery for catches list + stats                         | `qk.profile(slug)`, `qk.profileCatches(profileId)`                             | Stable cache per username/id + predictable invalidations             | PR#3 ✅    |
| Notifications (surfaces) | manual reads + local polling                              | useQuery for list + explicit refetch triggers (no polling by default)                    | `qk.notificationsList(userId, limit)`                                          | Consistent badge count, no focus thrash                              | PR#4 ✅    |

## PR#1 — Feed (complete)

This PR is complete.

What we implemented:

1. Migrated the feed list to `useInfiniteQuery`.
2. Moved **scope/species/sort** into the server read layer (RPC) so the feed remains _globally correct_ under infinite pagination.
3. Included scope/sort/species/customSpecies/venueId/sessionId/userId in the query key so cache isolation is predictable.
4. Preserved UI behavior: the same controls, the same pagination UX, and stable appends with id dedupe.

DoD (met):

- No duplicate feed items when paginating.
- Tab focus does not trigger reset/flicker.
- “Following” scope, “Heaviest”, and “Highest rated” produce correct ordering across multiple pages.

**Query key(s):**

- `qk.feed({ scope, sort, species, customSpecies, venueId, sessionId, userId })`

**Pagination strategy:**

- Infinite pagination with `getNextPageParam` and page-based parameters (limit/offset or equivalent), aligned with the existing backend contract.

**Out of scope (PR#1):**

- Broad invalidation matrix (likes/reactions/comments/follows), background polling, changing ranking logic beyond matching the existing options.

**Rollback:**

- Revert PR#1 (restores the prior useEffect + local pagination implementation).

## PR#2 — CatchDetail (complete)

Smallest safe steps:

1. Migrate catchById primary fetch to useQuery (stable key).
2. Migrate ratings and comments to useQuery.
3. Add invalidations for rating, comment, and reaction mutations.
4. Ensure React Query key usage is via `qk.*` factories (no ad-hoc arrays).

DoD:

- No rating flash or comment flicker on focus.
- No duplicate calls on rapid navigation.
- Error states remain non-blocking.
- “Download share image” still works (no blank PNG regression).

**Query key(s):**

- `qk.catchById(catchId)`
- `qk.catchRatingSummary(catchId, userId)`
- `qk.catchComments(catchId)`
- `qk.catchReactions(catchId, userId)`
- `qk.catchFollowStatus(userId, ownerId)`
- `qk.adminStatus(userId)`

**Out of scope (PR#2):**

- Changing comment threading/ordering behavior or adding new comment features.

**Rollback:**

- Revert PR#2 (restores the prior useEffect/hook-based reads).

## PR#3 — Profile (complete)

Smallest safe steps:

1. Migrate profile header + counts to useQuery.
2. Migrate profile catches list to useInfiniteQuery.
3. Add invalidations for follow/unfollow and catch updates.

**Query key(s):**

- `qk.profile(slug)`
- `qk.profileCatches(profileId)`
- `qk.profileFollowerCount(profileId)`
- `qk.profileFollowing(profileId)`
- `qk.profileFollowStatus(viewerId, profileId)`
- `qk.profileBlockStatus(viewerId, profileId)`

**Pagination strategy:**

- Migrate the catches list to useInfiniteQuery using the same paging approach used today.

**Rollback:**

- Revert PR#3.

## PR#4 — Notifications (complete)

_This covers the notifications **surfaces** (bell + any profile notifications view), not a standalone page._

Smallest safe steps:

1. Migrate notification list to useQuery.
2. Explicitly invalidate on “mark read” or settings change.
3. Keep polling off by default and set refetchOnWindowFocus: false; add manual refetch actions only.

**Query key(s):**

- `qk.notificationsList(userId, limit)`

**Rollback:**

- Revert PR#4.
