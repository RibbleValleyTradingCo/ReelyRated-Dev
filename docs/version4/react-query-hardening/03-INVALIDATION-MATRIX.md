# Invalidation Matrix

| Mutation                               | Invalidate queries                                                                                  | Notes                                 |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Add/update venue rating                | ["venueRating", userId, venueId], ["venueBySlug", slug]                                             | Keep rating summary in sync.          |
| Add/update catch rating                | ["catchRatingSummary", catchId, userId], ["catchById", catchId]                                     | Avoid rating row flash.               |
| Add comment                            | ["catchComments", catchId]                                                                          | Keep count/badge in sync.             |
| Delete comment                         | ["catchComments", catchId]                                                                          | Same as add.                          |
| React/like catch                       | ["catchReactions", catchId, userId], ["feed", { ... }]                                              | Update feed cards if shown.           |
| Follow/unfollow profile                | ["profileFollowStatus", viewerId, profileId], ["profileFollowerCount", profileId]                  | Keep follow state + counts fresh.     |
| Mark notification read                 | ["notificationsList", userId, limit]                                                               | Keep badge + list in sync.            |
| Mark all notifications read            | ["notificationsList", userId, limit]                                                               | Same as mark one.                     |
| Clear all notifications                | ["notificationsList", userId, limit]                                                               | Clears list + resets badge.           |
| Venue edit (owner/admin)               | ["venueBySlug", slug], ["venueById", venueId]                                                       | Public page stays current.            |
| Update opening hours / pricing / rules | ["venueOpeningHours", venueId], ["venuePricingTiers", venueId], ["venueRules", venueId]            | Public plan-your-visit stays current. |

# Invalidation Matrix

This matrix defines what to **update in cache** (preferred) and what to **invalidate/refetch** (fallback) after mutations.

## Query key conventions

- Prefer **stable tuple keys** (primitives), e.g.:
  - `["venueBySlug", slug]`
  - `["venueRating", userId, venueId]` (use `userId ?? "anon"` for logged-out)
- Use **prefix invalidation** for families of lists rather than trying to enumerate every permutation:
  - `invalidateQueries({ queryKey: ["feed"] })`
  - `invalidateQueries({ queryKey: ["catchComments", catchId] })`

> If you use a query-key factory (recommended), always invalidate via the factory so key shapes can’t drift.

---

| Mutation                               | Update cache (preferred)                                                                                      | Invalidate queries (fallback)                                                                                   | Notes                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Add/update **venue rating**            | `setQueryData(["venueRating", userId, venueId])` + patch rating summary on `["venueBySlug", slug]` if present | `["venueRating", userId, venueId]`, `["venueBySlug", slug]`                                                     | Keeps “You rated …” and venue summary in sync without UI flash.                            |
| Add/update **catch rating**            | Patch `["catchById", catchId]` rating fields; patch any cached feed cards containing that catch               | `["catchById", catchId]`, `["catchRatings", catchId]`, prefix `["feed"]`                                        | If catch cards show rating summary, update them or invalidate feed lists.                  |
| Add **comment**                        | Append to `["catchComments", catchId]` page 1 (or invalidate if paging is complex)                            | `["catchComments", catchId]`, `["catchById", catchId]`, prefix `["feed"]`                                       | Also update comment counts if displayed on cards/detail.                                   |
| Delete **comment**                     | Remove from `["catchComments", catchId]` and decrement counts                                                 | `["catchComments", catchId]`, `["catchById", catchId]`                                                          | Same surfaces as add.                                                                      |
| React/like **catch**                   | Patch `["catchById", catchId]` + patch any cached feed cards containing that catch                            | `["catchReactions", catchId]`, `["catchById", catchId]`, prefix `["feed"]`, `["venueRecentCatches", venueId]`   | Prefer cache patch to avoid “card flicker”; invalidate lists as safety net.                |
| Follow/unfollow **profile**            | Patch `["profileFollowStatus", viewerId, profileId]` + `["profileFollowerCount", profileId]`                  | `["profileFollowStatus", viewerId, profileId]`, `["profileFollowerCount", profileId]`                          | Follow state affects profile buttons + follower count.                                     |
| Venue edit (owner/admin) **metadata**  | Patch `["venueBySlug", slug]` / `["venueById", venueId]` if returned by mutation                              | `["venueBySlug", slug]`, `["venueById", venueId]`, prefix `["venuesList"]`                                      | Directory/list pages should refresh if they show venue metadata.                           |
| Update **opening hours**               | Replace `["venueOpeningHours", venueId]` with latest rows (or patch one row)                                  | `["venueOpeningHours", venueId]`                                                                                | Public “Plan your visit” should update immediately.                                        |
| Update **pricing tiers**               | Replace `["venuePricingTiers", venueId]` with latest rows (or patch one row)                                  | `["venuePricingTiers", venueId]`                                                                                | Also consider invalidating `["venueBySlug", slug]` if summary pricing is duplicated there. |
| Update **venue rules**                 | Patch `["venueRules", venueId]`                                                                               | `["venueRules", venueId]`                                                                                       | Preserve line breaks/markdown formatting.                                                  |
| Upload/delete/reorder **venue photos** | Patch `["venuePhotos", venueId]` and any hero/carousel derived state using it                                 | `["venuePhotos", venueId]`, `["venueBySlug", slug]` (only if RPC returns photo info)                            | If hero/carousel uses photos query, keep it the single source of truth.                    |
| Create/edit/delete **venue event**     | Patch `["venueUpcomingEvents", venueId]` / `["venuePastEvents", venueId]` (or invalidate the relevant list)   | `["venueUpcomingEvents", venueId]`, `["venuePastEvents", venueId]`                                              | If using `useInfiniteQuery` for past events, invalidation is often simplest.               |
| Auth: **SIGNED_IN / SIGNED_OUT**       | Clear user-scoped caches (or `removeQueries`): ratings, “me”, follows, etc.                                   | Prefix `["venueRating"]`, prefix `["me"]`, prefix `["profile"]` as needed                                       | Prevent cross-identity bleed and eliminates “rated → unrated” flashes.                     |
| Notification **mark read / clear all** | Patch `["notificationsList", userId, limit]`                                                                  | `["notificationsList", userId, limit]`                                                                         | Keep badge + list in sync across bell/profile surfaces.                                    |

## Implementation notes

- Prefer **cache updates** when the mutation response contains the new state (best UX).
- Prefer **invalidation** when:

  - the list is paged/infinite and patching is fragile,
  - multiple views can contain the mutated entity and you don’t have an ID index,
  - or server-side derived aggregates are involved.

- For prefix invalidation to work reliably, keep keys hierarchical and consistent.
