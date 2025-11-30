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
  - Comment creation RPC blocks when either side is blocked (owner/admin bypass intact).

## Profile Block UI – v1
- Placement: on `/profile/:username` in the hero/action area.
- States:
  - Own profile: no block controls shown.
  - Viewing another user:
    - Not blocked: show a “Block user” button (or menu item) in the hero actions.
    - Blocked: show a banner “You have blocked this angler.” with an “Unblock” button; Follow is hidden/disabled (tooltip can say “Follow disabled while blocked”).
  - Admin: can use block/unblock; RLS still grants full visibility for moderation.
- Copy:
  - Block confirmation dialog:
    - Title: “Block this user?”
    - Body: “You won’t see this angler’s catches or comments. They won’t know you blocked them. You can unblock anytime.”
    - Optional reason textarea.
  - Banner when blocked: “You have blocked this angler. Unblock to see their catches again.”
  - Tooltip/helper when Follow hidden/disabled: “Unavailable while blocked.”
- API usage (no new RPCs in this phase):
  - `block_profile(p_blocked_id uuid, p_reason text)`
  - `unblock_profile(p_blocked_id uuid)`
  - Call via Supabase JS client; do not introduce new endpoints.

### Profile Block UI – Blocked Anglers List (v2)

**Placement**

- Surface: **Settings → Profile** (ProfileSettings).
- Entry point: a small card near the bottom of the page, under other settings.
- Card content:
  - Title: “Safety & blocking”
  - Copy: “See and manage anglers you’ve blocked.”
  - Primary action: “Manage blocked anglers”

For v1, clicking the action expands an inline list on the same page. In future we may move this to a dedicated `/settings/safety` route.

**Behaviour**

- The list shows **profiles that the current user has blocked**:
  - Data source: `profile_blocks` with `blocker_id = auth.uid()`.
  - We do **not** expose “who has blocked me”.
- Each row should display:
  - Avatar
  - Username
  - Short bio (or “No bio yet”)
  - “Unblock” button
- When the user clicks **Unblock**:
  - Call `unblock_profile(p_blocked_id)` via Supabase RPC.
  - On success:
    - Remove that entry from the list.
    - Show a success toast (e.g. “User unblocked. Their content will reappear based on privacy settings.”).
  - On error:
    - Show an error toast (e.g. “We couldn’t unblock this user. Please try again.”).

**Empty state**

When there are no blocked profiles:

> “You haven’t blocked any anglers yet. If someone’s behaviour isn’t for you, you can block them from their profile.”

**Safety & UX notes**

- The list is **deliberately tucked away in Settings**, not on the public profile.
- The list is one-way:
  - Only shows blocks made by the current user.
  - There is no way to see who has blocked you.
- Behaviour is built on existing backend:
  - `block_profile` / `unblock_profile` RPCs.
  - RLS using `profile_blocks` and `is_blocked_either_way`.

## Admin profile UX
- Admin accounts are visually flagged with an Admin/“ReelyRated team” badge and a short explainer in the profile hero.
- Admin profiles suppress social CTAs:
  - No Follow/Unfollow button shown.
  - No Block/Unblock controls shown.
- Admins may be excluded from competitive leaderboards/venue “top anglers” strips where appropriate to avoid ranking staff test accounts.

## Test Checklist (for later implementation)
- Blocking user B as user A:
  - Feed/search: B’s content hidden from A.
  - Comments: B’s comments hidden/collapsed for A.
  - Follow: A cannot follow B (and vice versa if symmetric check applied).
  - Notifications: no new notifications from B shown to A.
- Unblock restores normal visibility/interaction.
