# Profile Privacy – Manual Test Checklist

Use four accounts: Owner (A), Follower (B), Non-follower (C), Admin (D). Assume A sets `is_private = TRUE` unless stated otherwise.

## A) Baseline (public profile)
- A leaves profile public.
- B/C/D see A’s catches and comments as today; feed/search unchanged.

## B) Owner view (A)
- Set A to private.
- Visit own profile: catches grid and stats visible.
- Feed/search as A: A’s catches still appear for A.

## C) Follower view (B)
- B follows A.
- With A private:
  - Profile page shows catches grid (no private stub).
  - Feed shows A’s catches.
  - Search shows A’s catches.

## D) Non-follower view (C)
- C does not follow A.
- With A private:
  - Profile page shows “This account is private” stub; catches grid hidden.
  - Feed: A’s catches do not appear.
  - Search: A’s catches do not appear.

## E) Admin view (D)
- As admin D, with A private:
  - Profile page shows catches/stats normally.
  - Feed/search: A’s catches appear (admin bypass).

## F) Regression checks
- Switching A back to public restores normal visibility for all.
- Changing follow/unfollow updates access accordingly.
- Moderation/admin pages still load for A (no RLS regression).
