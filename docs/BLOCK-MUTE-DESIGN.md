# Block / Mute Design (v1)

**Scope (v1):** Implement hard blocks via `profile_blocks`. Mutes are out of scope for this pass and can be added later as a softer filter.

## Behaviour (implemented, backend-only)
- A row in `profile_blocks` means `blocker_id` does not want to see or interact with `blocked_id`:
  - Feed/search/venue/notifications/comments should exclude content from blocked users for the blocker.
  - Follow/interaction attempts between the two should be prevented (follows are cleaned on block).
- Only `blocker_id` (and admins) can see or modify their block rows (RLS to follow in a later pass if needed).

## Data Model
- Table: `public.profile_blocks`
  - `blocker_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE`
  - `blocked_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE`
  - `reason text` (optional internal note)
  - `created_at timestamptz NOT NULL DEFAULT now()`
  - Primary key: `(blocker_id, blocked_id)`
  - Indexes: on `blocker_id`, `blocked_id`

## RLS / RPC Notes (implemented)
- RPCs:
  - `block_profile(p_blocked_id uuid, p_reason text)` — SECURITY DEFINER, uses `auth.uid()`, cleans follow links, upserts block row.
  - `unblock_profile(p_blocked_id uuid)` — SECURITY DEFINER, deletes block row.
- Helper:
  - `is_blocked_either_way(p_user_id uuid, p_other_id uuid)` — used in RLS predicates.
- Enforcement targets (now enforced in RLS):
  - Catches SELECT policy checks profile privacy/visibility AND ensures `NOT is_blocked_either_way(auth.uid(), user_id)` (owner/admin bypass intact).
  - Catch comments SELECT policy mirrors catch visibility, adds `NOT is_blocked_either_way` for both catch owner and comment author (owner/admin bypass intact).

## Test Checklist (for later implementation)
- Blocking user B as user A:
  - Feed/search: B’s content hidden from A.
  - Comments: B’s comments hidden/collapsed for A.
  - Follow: A cannot follow B (and vice versa if symmetric check applied).
  - Notifications: no new notifications from B shown to A.
- Unblock restores normal visibility/interaction.
