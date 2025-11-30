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
