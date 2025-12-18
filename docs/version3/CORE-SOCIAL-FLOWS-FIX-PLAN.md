# Core Social Flows – Fix Plan

Context:  
This doc tracks the fixes and feature work arising from `docs/version3/CORE-SOCIAL-FLOWS.md`.  
Goal: clear, small Codex tasks to get core social flows behaving as specified before we expand testing.

---

## 0. Scope

Flows covered (from `CORE-SOCIAL-FLOWS.md`):

- FEED-001 / FEED-002
- CATCH-001 / CATCH-002 / CATCH-003
- COMM-001 / COMM-002 / COMM-003
- PROFILE-001 / FOLLOW-001 / BLOCK-001

Only items marked ❌ Fail or ⚠️ Partial are in scope for this fix plan.

---

## 1) CATCH-003 – Delete catch must be soft delete (✅ – implemented 2025-12-05)

**Status:** Soft delete is implemented. Deleting a catch now sets `deleted_at`, and all user-facing queries filter on `deleted_at IS NULL`. No further changes planned here before automated tests.

**Problem**

- Manual test `CATCH-003 – Delete (soft delete) catch` currently fails.
- After deleting a catch as User A:
  - Catch disappears from feed/profile (good),
  - But the row is **gone entirely** from `catches` in Supabase Studio,
  - No row with `deleted_at` populated → deletion is effectively hard.

**Intended behaviour**

- Deleting a catch should **soft delete**:
  - Set `deleted_at` on the row.
  - All user-facing queries should filter on `deleted_at IS NULL`.

**Codex task (summary)**

- Confirm `catches.deleted_at` exists and is used in all read queries/views.
- Change delete logic so catch deletion:
  - Performs an `UPDATE ... SET deleted_at = now()` instead of `DELETE`.
- Ensure RLS allows:
  - Owners (and admins, as appropriate) to soft-delete their catches.
  - Deleted rows are hidden in feed/profile/detail queries.

**Re-test criteria**

- Delete a catch as User A:
  - It disappears from feed + profile.
  - In Studio, catch row still exists with `deleted_at` set.
- Other users cannot see the deleted catch anywhere.
- No RLS or 4xx/5xx errors when deleting.

---

## 2) FEED-002 – Admins must not be able to create catches (✅ – implemented 2025-12-05)

**Status:** Admin accounts are now moderation-only. UI entry points for adding catches are hidden for admins, `/add-catch` shows a friendly message, and RLS prevents admin inserts. No further changes planned here before automated tests.

**Problem**

- `FEED-002 – “People you follow” filter` result:
  - Filters behave correctly (All vs People you follow).
  - **But** admin accounts can see and use “Add catch” and successfully create catches.
- Product decision: admin accounts are **moderation-only**, not anglers.

**Intended behaviour**

- Admin profiles:
  - Should **not** be able to create catches via UI or API.
- Normal users:
  - Keep current catch creation behaviour (CATCH-001 already passes).

**Codex task (summary)**

- UI:
  - Hide “Add catch” entry points for admins (nav, profile, etc.).
  - If an admin hits `/add-catch` directly, show a friendly message and redirect.
- RLS:
  - Update `catches` policies so inserts are only allowed when the caller is **not** an admin (`NOT public.is_admin()`).
  - Keep admin read/moderation abilities (as designed).

**Re-test criteria**

- As admin:
  - No visible “Add catch”.
  - `/add-catch` cannot create a catch and shows a clear message.
- As normal user:
  - `CATCH-001` still passes.
- Feed filters (FEED-002) still pass, with no admin-created catches.

---

## 3) COMM-003 – Mentions + notifications (✅ – implemented 2025-12-06)

**Status:** Mention notifications (including owners) and notification UI are implemented and working as expected. Clicking a notification opens the correct catch detail and scrolls to the related comment. No further changes planned here before automated tests.

**Problem**

- `COMM-003 – Mentions + notifications (happy path)` currently fails:
  - B comments with `@<A’s username>`, but A does not reliably get a mention notification.
  - Clicking notifications does not reliably open the right catch/comment.
  - Copy is clunky / not clearly structured.

**Intended behaviour**

- When B comments on a catch with `@A`:
  - A receives a clear “mention” notification.
  - Clicking it opens the correct catch detail and focuses/highlights the mentioned comment.
  - Notification copy is readable and descriptive.

**Codex task (summary)**

- Backend:
  - Inspect comment creation path (e.g. `create_comment_with_rate_limit`).
  - Ensure:
    - Comment body is scanned for `@username`.
    - Matched usernames map to profiles.
    - Mention notifications are inserted with enough metadata (`catch_id`, `comment_id`, etc.).
- Frontend:
  - Notification list:
    - Render mention notifications with clear text:
      - e.g. “User B mentioned you in a comment on [Catch summary]”.
    - Use stored metadata to route to the catch (`/catches/:id`) with a comment identifier (query param or hash).
  - Catch page:
    - On load, if `commentId` is provided:
      - Scroll to that comment and/or temporarily highlight it.

**Re-test criteria**

- Run COMM-003:
  - B posts `@<A’s username>` on a catch.
  - A sees a mention notification with good copy.
  - Clicking it opens the correct catch and focuses the mentioned comment.
- No regression to:
  - Basic commenting (COMM-001),
  - Reply threading (COMM-002),
  - Other notification types.

---

## 4) BLOCK-001 – Leaderboard vs blocking (✅ – implemented 2025-12-06)

**Status:** Implemented (2025-12-06) via migration `2099_leaderboard_block_flag.sql` and the centralised `leaderboard-navigation` helper; pending future automated tests only.

**Problem**

- `BLOCK-001 – Blocked user visibility` is **partial**:
  - When A blocks B:
    - A no longer sees B’s content in feed or on A’s catches (comments hidden) → correct.
    - B cannot see A’s catches or comments → correct.
    - **But** A can still see B’s catches on the **leaderboard**.
- Product ambiguity:
  - Is the leaderboard meant to be fully global (ignores blocks)?
  - Or should blocking hide a user everywhere?

**Decision (recommended)**

- Leaderboard remains a global, truthful scoreboard: do **not** hide/re-rank blocked users.
- Blocking only affects drill-down/interactive surfaces:
  - Feed/profile/catch detail/comments remain block-aware.
  - From the leaderboard, clicking a blocked user’s row should be disabled/intercepted with a clear message.
- Aligns with the final product decision captured in `CORE-SOCIAL-FLOWS.md` (4.3).

**Codex task (summary)**

- Inspect leaderboard data path (`leaderboard_scores_detailed` + any related views/RPCs).
- Add a viewer-relative block flag (e.g. `is_blocked_from_viewer` via `is_blocked_either_way(...)`/`auth.uid()`; admins bypass).
- Frontend: render all rows; for blocked rows, disable/intercept drill-down with clear messaging.
- Do **not** break existing block behaviour in feed/profile/catch detail/comments.

**Re-test criteria**

- When A blocks B:
  - Leaderboard still shows B’s row (and vice versa) in correct rank order.
  - Drill-down from leaderboard into a blocked user’s profile/catches is blocked or clearly messaged.
- Existing BLOCK-001 checks still pass:
  - Feed/profile/comments visibility rules remain correct.

---

## 5) CATCH-002 – Implement “edit catch” (✅ – implemented 2025-12-06 – description/tags only)

**Status:** Owners (non-admin) can now edit description/notes and tags for their own catches via the catch detail page. Leaderboard-critical fields (weight/length, species, capture date/time) remain immutable for anglers and require a future admin-only correction flow. No further changes planned here before automated tests.

**Problem**

- `CATCH-002 – Edit catch` currently fails as “Not implemented”:
  - There is no UI affordance to edit a catch.
  - No dedicated edit form/route.

**Intended behaviour**

- Catch owners can edit their own catches, but only for non-leaderboard fields:
  - **Editable for anglers:** description/notes and tags.
  - **Not editable for anglers (leaderboard-critical):** weight/length, species, capture date/time, and any future score/points fields. These remain fixed once the catch is created.
  - Any genuine corrections to leaderboard-critical fields (e.g. obvious typos in weight) must be handled via a future, admin-only correction flow with an audit trail (out of scope for this fix plan).
- Non-owners cannot edit.

**Codex task (summary)**

- Backend:
  - Confirm `catches` supports updates for chosen fields.
  - Ensure RLS allows updates only by the owner (and admins, if moderation requires it).
- Frontend:
  - Add an “Edit” action on owner’s catch detail (and/or tiles).
  - Provide an edit form that:
    - Pre-populates fields from the existing catch.
    - Reuses add-catch form logic where possible.
    - Calls a Supabase update and returns user to the updated catch.
- UX:
  - Make it visually clear the user is editing, not creating.
  - No edit option for non-owners.

**Re-test criteria**

- As User A (owner):
  - Edit button is visible on A’s catches.
  - Editing description/tags updates detail, feed tiles, and profile list.
- As User B (non-owner):
  - No edit option for A’s catches.
- CATCH-002 can be marked ✅ in `CORE-SOCIAL-FLOWS.md`.

---

## 6) Recommended order of work

To keep things small and focused:

1. **CATCH-003 – Delete catch must be soft delete** – completed; no further work required here until we add automated tests.
2. **FEED-002 – Admins must not be able to create catches** – completed; no further work required here until we add automated tests.
3. **COMM-003 – Mentions + notifications** – completed; no further work required here until we add automated tests.
4. **BLOCK-001 – Leaderboard vs blocking** – completed (global scoreboard + gated drill-down; see migration `2099_leaderboard_block_flag.sql`). No further work required here until we add automated tests.
5. **CATCH-002 – Edit catch (description/tags only)** – completed; no further work required here until we add automated tests.

---

## 7) Status – v3 hardening complete (2025-12-09)

**Summary**

- All in-scope flows from `CORE-SOCIAL-FLOWS.md` for v3 hardening are now implemented and verified via manual tests:
  - CATCH-003 – Delete catch must be soft delete
  - FEED-002 – Admins must not be able to create catches
  - COMM-003 – Mentions + notifications
  - BLOCK-001 – Leaderboard vs blocking (global scoreboard + gated drill-down)
  - CATCH-002 – Edit catch (description/tags only)
- The main behaviour is now considered **v3 baseline** for core social flows.

**Next steps**

- Any **new behaviour changes** (for example, introducing approval-based follow requests instead of instant follows) are **out of scope for v3 hardening** and should be captured as separate, future epics/docs.
- Future work will focus on:
  - Adding automated tests to lock in the behaviour described in `CORE-SOCIAL-FLOWS.md`.
  - Working through `docs/version3/test-plan.md` end-to-end.

For each item:

- Send the corresponding Codex prompt.
- Apply changes.
- Re-run the specific manual test from `CORE-SOCIAL-FLOWS.md`.
- Update the Result log there (and this file if the scope changes).

This doc should stay tightly focused on these five pieces until they’re all ✅.

### v4+ – Future feature concepts (out of scope for v3 hardening)

The following ideas are **explicitly out of scope for v3** and are parked for future design/implementation:

- **Fishing clubs & group leaderboards**

  - Create “clubs” with name, avatar, description, public/private visibility.
  - Invite friends via trackable links (“You’ve been invited to the ReelyRated Angler Club…”).
  - Club-specific feeds and leaderboards showing only catches associated with that club.
  - Clear privacy model for public vs private clubs (who can see club, members, and catches).

- **Add-catch hierarchy & completeness scoring**

  - Refactor the Add Catch flow into:
    - A **top-level “hero” section** (main image of angler + fish, species, weight, venue) that is always visible.
    - Nested / collapsible sections for advanced/optional data (conditions, tactics, notes, etc.).
  - Introduce more structured fields such as:
    - **Season selector** (Spring/Summer/Autumn/Winter) and better date/time shortcuts.
  - (Future) Use a **“data completeness” score** internally to influence feed ranking or discovery, without blocking quick/low-friction logging.

- **Saved rigs & reusable setups**
  - Allow users to define named “rigs” (e.g. _Carp Rig_, _Bream Feeder_, etc.) with fields like rod, reel, line, terminal tackle, and notes.
  - Each rig can be **public or private**:
    - Public rigs are linkable from catch cards and discoverable.
    - Private rigs are only visible to the owner.
  - In **Add Catch**, the angler can:
    - Select from their saved rigs.
    - Optionally create a new rig inline.
  - From a catch detail page, a selected rig is shown and (when public) links to a rig detail view.
