# Block / Mute Design (v1)

**Scope (v1):** Implement hard blocks via `profile_blocks`. Mutes are out of scope for this pass and can be added later as a softer filter.

## Behaviour (future state, not implemented yet)
- A row in `profile_blocks` means `blocker_id` does not want to see or interact with `blocked_id`:
  - Feed/search/notifications/comments should exclude or collapse content from blocked users.
  - Follow/interaction attempts between the two should be prevented.
- Only `blocker_id` (and admins) can see or modify their block rows.

## Data Model
- Table: `public.profile_blocks`
  - `blocker_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE`
  - `blocked_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE`
  - `reason text` (optional internal note)
  - `created_at timestamptz NOT NULL DEFAULT now()`
  - Primary key: `(blocker_id, blocked_id)`
  - Indexes: on `blocker_id`, `blocked_id`

## RLS / RPC Notes (design-only for later)
- RLS: only the blocker (and admins) can see/edit their rows.
- Future SECURITY DEFINER RPCs:
  - `block_profile(p_target uuid)`
  - `unblock_profile(p_target uuid)`
- Enforcement targets (future):
  - Feed/search RPCs should anti-join against `profile_blocks`.
  - Follow RPC should prevent following when either party has blocked the other.

## Test Checklist (for later implementation)
- Blocking user B as user A:
  - Feed/search: B’s content hidden from A.
  - Comments: B’s comments hidden/collapsed for A.
  - Follow: A cannot follow B (and vice versa if symmetric check applied).
  - Notifications: no new notifications from B shown to A.
- Unblock restores normal visibility/interaction.
