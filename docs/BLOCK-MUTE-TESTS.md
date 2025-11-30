# Block / Mute – Manual Test Checklist

## Blocking flow
- User A blocks User B via RPC/UI:
  - B’s catches disappear from A’s feed/search/venue pages (blocked via catches RLS).
  - B’s comments no longer appear for A (blocked via catch_comments RLS).
- User B still sees User A normally (block is one-way).
- User B blocks User A:
  - Both are now blocked from seeing each other’s catches/comments.
- Admin user:
  - Admin can still see all catches/comments regardless of blocks.

## Unblocking flow
- User A unblocks User B:
  - B’s content reappears per normal privacy rules.
  - Follow relationships remain removed until explicitly re-followed.

## UI + End-to-end (Profile block)
- User A blocks User B on B’s profile:
  - Confirmation dialog shows; after confirm, A sees a “You have blocked this angler” banner with Unblock.
  - Follow is hidden/disabled for A with helper text.
  - B’s catches disappear from A’s feed/venue pages/catch detail (RLS already enforces).
- User A unblocks User B:
  - Banner removed; block button returns.
  - B’s content reappears for A per existing privacy rules.
- Admin behaviour:
  - Admin can still view content even if A and B have blocked each other; block/unblock UI remains available.
- Edge cases:
  - Blocking yourself fails.
  - Blocking a user with no catches/comments is a no-op beyond UI state.

## Comments enforcement
- Block scenario:
  - A blocks B.
  - B comments on A’s catch, on their own catch, and on a third user’s catch.
  - A should not see B’s comments anywhere (catch detail, feed previews, venue pages, profile).
- Unblock scenario:
  - A unblocks B; comments reappear according to privacy rules.
- Admin scenario:
  - Admin can see comments regardless of blocks.
- Posting:
  - If a block exists either way between commenter and catch owner, commenter gets a clear error: “You cannot comment on this angler right now.”

## Blocked Anglers List – UI Tests

**Preconditions**

- Accounts: `test`, `test2`, `test6`.
- Backend block enforcement is already live:
  - `block_profile` / `unblock_profile`.
  - RLS for catches/comments with `is_blocked_either_way`.

**1. Empty state**

1. Log in as a user who hasn’t blocked anyone.
2. Go to **Settings → Profile**.
3. Find the **Safety & blocking** card.

Expected:
- The card is visible but subtle.
- The list area shows a neutral empty state like:
  - “You haven’t blocked any anglers yet. If someone’s behaviour isn’t for you, you can block them from their profile.”
- No errors in the console.

**2. List shows blocked users**

1. As `test`, visit `/profile/test6` and click **Block user**.
2. Go to **Settings → Profile → Safety & blocking**.

Expected:
- `test6` appears in the blocked list.
- Row shows avatar (or fallback), username, and a short bio snippet.
- An **Unblock** button is visible and enabled.

**3. Unblock from the list**

1. Still as `test`, click **Unblock** on `test6` in the blocked list.

Expected:
- A success toast is shown.
- `test6` disappears from the list without a full page refresh.
- After a hard refresh, `test6` is still absent.
- Visiting `/profile/test6` now shows the normal profile again (subject to privacy/is_private).

**4. Multiple blocked users**

1. As `test`, block both `test2` and `test6`.
2. Go back to Safety & blocking.

Expected:
- Both users appear in the list.
- Unblocking one removes that entry only; the other remains.
- Re-blocking them from their profiles will make them reappear in the list.

**5. Admin behaviour**

- Admin accounts see the same Safety & blocking list for themselves.
- Block/unblock works the same via the list.
- There is no view exposing “who has blocked me”; only “who I blocked”.
