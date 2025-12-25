# Phase 2 React Query Hardening — Test Checklist

## Smoke tests

- Feed
  - Pagination adds items without duplicates or missing items.
  - Tab focus does not reset feed list or scroll position.
- CatchDetail
  - Rating row does not flash on focus.
  - Comments list updates after add/delete without full reload.
- Profile
  - Switching profiles uses isolated cache keys (no cross-user data bleed).
  - Follow/unfollow updates button state and follower count without refresh.
  - Block/unblock updates visibility states without reload.
- Notifications
  - List refresh respects staleTime; no focus thrash.
  - Badge count stays in sync with list after mark-read and clear-all.

## Cache isolation

- Navigate between two venues or catches quickly → no wrong data flashes.
- Logged out vs logged in caches are isolated by userId.

## Logged-out gating

- Logged out users never see authenticated-only data.
- Mutations (rating/comment/reaction) prompt sign-in and do not poison cache.

## Regression checks

- No new network call loops.
- Query keys match documented patterns.

# Phase 2 React Query Hardening — Test Checklist

This checklist is for verifying the **React Query migration/hardening** work (Feed + CatchDetail first, then other surfaces). It focuses on:

- correct cache isolation
- no focus/refetch thrash
- correct pagination + mutation updates
- no auth leaks

## Pre-flight

- Run:
  - `npm run typecheck`
  - `npm run build`
- Start app with a clean session (then repeat once with an existing session):
  - Test logged-out
  - Test logged-in (normal user)
  - Test logged-in (admin)

## Smoke tests

### Feed

- Initial load:
  - Feed renders without skeleton loops.
  - Only **one** initial fetch for the first page (no duplicate requests).
- Pagination:
  - “Load more” (or infinite scroll) appends items.
  - No duplicates.
  - No missing gaps when loading multiple pages.
  - Rapid-click load more (3–5 times) doesn’t break ordering.
- Navigation + focus:
  - Navigate Feed → Venue/Catch → back → Feed preserves list and scroll position.
  - Tab away/back within staleTime → no list reset, no refetch burst.
- Filtering/sorting (if applicable):
  - Changing filter creates a **new cache key** and does not bleed results into other filters.
  - Switching back restores previous list from cache.

### CatchDetail

- Initial load:
  - Catch detail renders with consistent data.
  - Comments list renders (or empty state) without flicker.
- Rating UI:
  - Rated user: on hard refresh and on tab return → only “You rated X stars” (no flash of “Rate this catch/venue”).
  - Unrated user: placeholder → “Rate …” appears once resolved.
- Comments:
  - Add comment → list updates without full-page reload.
  - Delete comment (if allowed) → list updates.
  - Reply/mention notifications (if present) still fire as expected.
- Reactions:
  - Like/react toggles update UI and stay correct after refresh.
- Share image (optional regression):
  - Clicking “Download share image” produces a non-blank PNG.

### Profile

- Switching profiles:
  - Navigate Profile A → Profile B → back → no cross-profile bleed.
  - Any counts (followers/following/catches) remain correct.
- Follow/unfollow:
  - Button state updates immediately and remains correct after refresh.
  - Follower count updates without a full page reload.
- Block/unblock:
  - Blocked state updates immediately and the UI respects private content rules.
- Logged-out view:
  - Does not leak private content.

### Notifications

- Initial load:
  - No focus thrash (tab switch does not spam requests).
- Mark-as-read / open notification:
  - List updates correctly and remains correct after refresh.
- Bell + profile section:
  - Mark read in bell updates count in profile list (shared cache).
  - Clear all removes list and badge across surfaces.

## Cache isolation

- **User isolation:**
  - Log in as User A, visit Feed + CatchDetail + Profile, then sign out.
  - Log in as User B → no cached User A rating/state appears.
- **Venue/Catch isolation:**
  - Open Venue/Catch 1, then Venue/Catch 2 quickly → no wrong hero/title/data flashes.
- **Filter isolation (Feed):**
  - Two different filter states should never share pages.

## Focus / visibility behaviour

- Tab away/back:
  - Within staleTime: no refetch, no UI skeleton reset.
  - After staleTime: at most one refresh; UI should not hard-reset (use keepPreviousData where intended).
- Hard reload:
  - No infinite loading loops.

## Mutation correctness + invalidation

(Use this as a cross-check against `03-INVALIDATION-MATRIX.md`.)

- After each mutation, verify:
  - The **source view** updates immediately (optimistic or post-success).
  - Any **dependent view** updates (either via cache update or invalidation) without a full reload.

Suggested mutation passes:

- Create comment → CatchDetail + Notifications update.
- Delete comment → CatchDetail updates.
- Rate venue/catch → Hero/summary updates and persists.
- Upload venue photo (if enabled) → venue hero/carousel updates and persists.

## Error paths

- Simulate failures (turn off network / invalid session):
  - Queries show non-blocking error UI (toasts/inline) and recover on retry.
  - Mutations fail gracefully and do not poison cache.
- RLS:
  - Logged-out users cannot access owner/admin data.
  - Non-owner cannot mutate owner resources.

## Regression checks

- No new request loops:
  - Watch Network tab for repeating calls (especially on focus).
- Query key sanity:
  - Keys include identifiers that must isolate caches (`userId`, `venueId`, `catchId`, filter params).
- Memory / cache growth:
  - Navigate across 20+ venues/catches → cache growth remains reasonable (gcTime working).

## Notes to capture when something fails

- Route + slug/id
- Logged-in state (anon/user/admin)
- Which query key(s) were active
- Whether the failure happens on:
  - hard refresh
  - tab focus return
  - rapid navigation
  - pagination spam
