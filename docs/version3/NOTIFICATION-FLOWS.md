# Notification Flows – Types, Bell, Clickthrough

Environment

- **Env:** Local Docker (Supabase + Vite dev)
- **Frontend:** http://localhost:8081
- **DB:** Fresh local DB seeded with a few users, catches, and interactions

Test users

- **User A** – main test account (you).
- **User B** – second normal user.
- **User C** – optional third user (for mentions/blocks).
- **Admin** – admin user (in `admin_users`).

---

## 1. Notification Types – Backend behaviour

### 1.1 NOTIF-TYPES-001 – New follower

**Goal:** Verify `new_follower` notifications are created correctly and visible to the followed user.

**Steps**

1. As **User B**, follow **User A**.
2. As **User A**, open the app and the notifications bell.

**Expected**

- DB: a `notifications` row exists for A with:
  - `type = 'new_follower'`
  - `actor_id = B`
- UI:
  - A sees a “New follower” notification in the bell.
  - Clicking the notification opens the follower’s profile (User B).

---

### 1.2 NOTIF-TYPES-002 – Ratings, likes, comments

**Goal:** Verify notifications for catch interactions are created and routed correctly.

**Scopes**

- **New rating** (`new_rating`)
- **New like/reaction** (`new_reaction` / `new_like` depending on current enum)
- **New comment** (`new_comment` when there is no mention)

**Steps**

For each event type:

1. Ensure **User A** has at least one public catch.
2. As **User B**, perform the interaction on A’s catch:
   - Rate the catch.
   - Like/react to the catch.
   - Comment on the catch **without any @mention**.
3. As **User A**, open the notifications bell and the full notifications page (if present).

**Expected**

- One notification per interaction, with:
  - Correct type (`new_rating`, `new_reaction`/`new_like`, `new_comment`).
  - `user_id = A` (recipient).
  - `actor_id = B`.
  - `catch_id` pointing to A’s catch.
- UI:
  - Cards have the appropriate type label (NEW RATING / NEW LIKE / NEW COMMENT).
  - Copy references the catch title where available.
  - Clicking a card navigates to the catch detail page.

#### 1.2.1 NOTIF-RATING-001 – New rating on your catch

**Goal:** Ensure the catch owner is notified when another user rates their catch.

**Setup**

- User A has a public catch C: for example, "No admin test".
- User B can view C.

**Steps**

1. As **User B**, open catch C.
2. Leave a star rating (without adding a comment).
3. As **User A**, open the notifications bell dropdown.

**Expected**

- A new notification appears for **User A** with:
  - `type = 'new_rating'`
  - A message similar to: `test2 rated your catch "No admin test" 10/10.`
  - `actor_id = B`, `catch_id = C`.
  - `extra_data` including the numeric rating, e.g. `{"rating":10}`.
- Clicking the notification:
  - Marks it as read (`is_read = TRUE`, `read_at` populated in the DB).
  - Navigates to the catch detail page for C.
- **User B** does **not** receive any notification for their own rating.

#### 1.2.2 NOTIF-REACTION-001 – New reaction on your catch

**Goal:** Ensure the catch owner is notified when another user reacts to their catch.

**Setup**

- User A has a public catch C (for example, "No admin test").
- User B can view C.

**Steps**

1. As **User B**, open catch C.
2. Add a reaction (e.g. like/emoji) to the catch.
3. As **User A**, open the notifications bell dropdown.

**Expected**

- A new notification appears for **User A** with:
  - `type = 'new_reaction'`.
  - A message similar to: `test2 liked your catch "No admin test".`
  - `actor_id = B`, `catch_id = C`.
  - `extra_data` including the catch title, e.g. `{"catch_title":"No admin test"}`.
- Clicking the notification:
  - Marks it as read (`is_read = TRUE`, `read_at` populated in the DB).
  - Navigates to the catch detail page for C.
- **User B** does **not** receive any notification for their own reaction.

---

### 1.3 NOTIF-TYPES-003 – Mentions vs comments

**Goal:** Ensure mention notifications behave as designed and don’t double-notify recipients.

**Design intent**

- If a comment **does not** contain an @mention:
  - Only the **catch owner** gets a `new_comment`.
- If a comment **does** contain one or more @mentions:
  - Mentioned users get a `mention` notification.
  - The catch owner:
    - Gets `mention` if they’re @mentioned.
    - Otherwise gets `new_comment`.
  - Each recipient should get **at most one** notification per comment, with **mention > comment** priority.

**Steps**

1. A owns a public catch.
2. Case 1 – simple comment:
   - B comments on A’s catch with no @mention.
3. Case 2 – mention non-owner:
   - B comments on A’s catch with `@C`.
4. Case 3 – owner mentioned:
   - B comments on A’s catch with `@A`.
5. Case 4 – reply mention:
   - C replies on A’s catch with `@B`.

Check notifications for A, B, C.

**Expected**

- Case 1:
  - A gets a `new_comment`.
- Case 2:
  - A gets `new_comment`.
  - C gets `mention`.
- Case 3:
  - A gets **only** `mention` (no extra `new_comment`).
- Case 4:
  - A gets `new_comment` (catch owner).
  - B gets `mention`.
- DB: `notifications.type` matches the above; no duplicate rows for the same `(recipient, comment)` pair.
- UI: “Mention” cards show:
  - Actor username (`actor_username`).
  - Catch title (`catch_title`) if present.
  - Clicking navigates to the catch detail, scrolled/highlighted to the relevant comment.

---

## 2. Notification Bell UI – Dropdown behaviour

### 2.1 NOTIF-UI-001 – Bell counter & header

**Goal:** Confirm the bell badge and header reflect unread counts and behave consistently on desktop & mobile.

**Steps**

1. As **User A**, ensure A has **exactly 3 unread** notifications (mark others read if needed).
2. Reload the app.

**Expected**

- Navbar:
  - Bell shows a red badge with the count (e.g. `3`), using the softer red used elsewhere.
- Dropdown:
  - Header text reads `(<N>) Notifications`, where `<N>` is the unread count; the number is red, brackets and word “Notifications” are black.
  - “Mark all read” appears in the top-right of the header.
- No underline on hover for header actions.

---

### 2.2 NOTIF-UI-002 – List layout & card design

**Goal:** Ensure notification cards render with the new layout and icon colours.

**Expected**

For each card type:

- Layout:
  - Icon + type label inline at the top (e.g. ⭐ NEW RATING).
  - Main message line(s) below.
  - Time indicator in the **top-right** (e.g. `7m`).
  - For unread notifications:
    - A blue dot appears **to the right of the time**.
- Icons:
  - New follower icon: teal.
  - New rating star: yellow.
  - New comment bubble: green.
  - New like heart: red.
  - Mention icon: blue.
- “Mark read” / “Read” appears in the lower-right of the card.
- Cards look balanced and tappable in mobile view (adequate padding, tap targets not cramped).

---

### 2.3 NOTIF-UI-003 – Empty state

**Goal:** Verify the empty state appears correctly when there are no notifications.

**Steps**

1. As **User A**, “Clear all notifications” and/or mark all as read until no notifications remain.
2. Open the bell dropdown.

**Expected**

- Header still shows `Notifications` with no count, or `(0) Notifications` depending on final implementation.
- Body shows an empty state such as:
  - “You’re all caught up!”
  - Supporting copy about being notified when there’s new activity.
- No console or network errors.

---

## 3. Mark Read, Clear All & Pagination

### 3.1 NOTIF-ACTIONS-001 – Mark single notification read

**Goal:** Ensure marking a single notification as read works and updates UI state.

**Steps**

1. With several unread notifications, click “Mark read” on one item.

**Expected**

- DB: that notification’s `is_read` flag is set to `true` and `read_at` is set to a non-NULL timestamp (when it was marked read).
- UI:
  - The card visually switches to “Read” state.
  - Unread count in header/badge decreases by 1.

---

### 3.2 NOTIF-ACTIONS-002 – Mark all read

**Goal:** Verify “Mark all read” marks all notifications read for the current user.

**Steps**

1. Ensure A has multiple unread notifications.
2. Click “Mark all read” in the header.

**Expected**

- All A’s notifications have `is_read = true` and `read_at` is non-NULL in the DB (legacy rows are backfilled; newly read items use the mark-read timestamp).
- Bell badge disappears.
- Header counter updates to 0 (or is hidden).
- Cards show as “Read”.

---

### 3.3 NOTIF-ACTIONS-003 – Clear all notifications

**Goal:** Document current behaviour for “Clear all notifications” (hard delete + confirmation) and keep room for a future UX improvement (no confirmation from the bell).

**Steps**

1. With multiple notifications present, click “Clear all notifications” at the bottom of the dropdown.
2. Reload the page.

**Expected**

- Current v3 behaviour:

  - A confirmation dialog appears when A clicks “Clear all notifications” in the bell dropdown.
  - After confirming, all of A’s notifications are **hard deleted** from `public.notifications` (no rows remain for `user_id = A`).
  - Reloading the app shows no notifications in the bell dropdown; the empty state is rendered.
  - No RLS or 4xx/5xx errors in the console.

- Future improvement (not yet implemented):
  - From the bell dropdown, “Clear all notifications” should clear immediately **without** a confirmation popup, while still performing the same hard delete in the backend.
  - Any separate, full notifications page (if we add one later) may still use a confirmation if desired.

---

## 4. Blocking & Notifications

### 4.1 NOTIF-BLOCK-001 – Blocked users and notifications

**Goal:** Clarify and verify how blocking interacts with new notifications in practice.

**Actual behaviour (v3)**

- When **A blocks B**:
  - B can no longer access A’s profile or catches (RLS + block checks).
  - Because B cannot see A’s content, they also cannot:
    - Follow/unfollow A.
    - Like/react to A’s catches.
    - Rate A’s catches.
    - Comment on A’s catches (with or without mentions).
  - As a result, **no new notifications** from B to A can be created after the block.
- Existing (historical) notifications from B to A remain visible unless A explicitly clears them.

**Steps**

1. **Baseline (before block)**

   - A and B can see each other’s public content.
   - B performs some actions on A’s content (follow, like, rating, comment), and A receives the expected notifications.

2. **Apply block**

   - As **User A**, block **User B** from B’s profile.

3. **Post-block behaviour**
   - As **User B**:
     - Attempt to open A’s profile.
     - Attempt to open one of A’s catches (e.g. via direct URL or previous links).
   - As **User A**:
     - Open the notifications bell and check the timeline of notifications.

**Expected**

- After the block:
  - B is unable to access A’s profile or catches (blocked/empty state, no interaction UI).
  - B cannot follow, like, rate, or comment on A’s content, so **no new notifications** from B to A are created.
- Existing notifications:
  - A can still see historical notifications from B (until they are cleared).
- Optional:
  - If A later unblocks B, B regains access to A’s public content and can once again perform actions that generate notifications.

---

## 5. Admin / System Notifications

### 5.1 NOTIF-ADMIN-001 – Admin/system notifications

**Goal:** Verify admin-generated notifications behave correctly.

#### 5.1.1 Admin report (`admin_report`)

**Steps**

1. As a normal user (e.g. **User B**), report a catch owned by **User A**.
2. As an **Admin**, open the app and check the notifications bell.

**Expected**

- Bell dropdown:
  - A card appears with type label **NEW REPORT** and copy like `test5 reported a catch.`
  - The card uses the amber “alert/bell” style so it is visually distinct from social notifications.
- Clickthrough:
  - Clicking the card navigates to `/admin/reports`.
  - The reported item is visible in the Reports list (e.g. “This is AI”).
- DB:
  - A `notifications` row exists for the admin with:
    - `type = 'admin_report'`
    - `actor_id` = reporting user
    - `user_id` = admin recipient
    - `extra_data` linking the report, if present.

> Note: Other admin types (`admin_moderation`, `admin_warning`) exist in the enum and UI helpers but are not fully exercised in v3; they can be covered in a later moderation-focused pass.

#### 5.1.2 Admin moderation (`admin_moderation`)

**Goal:** Confirm that moderation actions generate `admin_moderation` notifications for the affected user and that the catch is removed.

**Steps**

1. As a normal user (e.g. **User A**), create a public catch.
2. As another user (e.g. **User C**), report A’s catch.
3. As an **Admin**, open the notifications bell and click the **NEW REPORT** card to go to `/admin/reports`.
   - Note: The Reports page may open with a previously used filter applied. Use **Reset filters** to ensure the reported catch is visible.
4. From the Reports page, open **Moderation actions** for the reported catch and choose **Delete catch**, adding a short reason (e.g. `nah`).

**Expected**

- For **User A**:

  - A new notification appears with type label **ADMIN MODERATION**.
  - Copy similar to: `An admin has moderated your catch: nah`.
  - Clicking the card takes A to their profile notifications area.
  - The moderated catch no longer appears in feed, profile, venues, or top-catches lists (subject to normal soft-delete behaviour).

- DB:
  - A `notifications` row exists for A with:
    - `type = 'admin_moderation'`
    - `actor_id` = admin who performed the action
    - `catch_id` = moderated catch
    - `extra_data` including the moderation action/reason.

---

#### 5.1.3 Admin warning (`admin_warning`)

**Goal:** Confirm that issuing a warning generates an `admin_warning` notification and updates the user’s account status.

**Steps**

1. Using the same reported catch flow as above, go to `/admin/reports` as **Admin**.
2. From **Moderation actions**, choose **Warn user**, entering a short reason (e.g. `no`).

**Expected**

- For **User A**:

  - Profile **Account status** card shows a “Warned” state (e.g. `Warnings: 1/3`) with guidance text.
  - A notification appears with label like **YOU’VE RECEIVED A WARNING FROM THE MODERATORS** and body copy similar to:
    - `Warning: Reason: no`
  - The notification is visible both in:
    - The bell dropdown.
    - The profile notifications panel.

- DB:
  - A `notifications` row exists for A with:
    - `type = 'admin_warning'`
    - `actor_id` = admin
    - A warning message in `message` and/or `extra_data`.

---

### 5.2 Edge cases & v3 decisions

**Notifications for deleted catches**

- When a catch is soft-deleted, its **owner** can still open it via:
  - A direct URL, or
  - Existing notifications that reference that catch.
- Other users can no longer see the catch in feed, profile, venues, or leaderboards.

**Notifications for deleted comments**

- If a comment is later deleted, any existing notification pointing at that comment:
  - Still routes to the parent **catch**.
  - The deleted comment itself may no longer appear in the thread.

**Notification RLS**

- Admins can read all notifications (policy `notifications_admin_read`).
- Normal users can only see and mutate rows where `user_id = auth.uid()` (policy `notifications_recipient_only`).

**Admin report volume**

- Multiple `admin_report` notifications for the same admin are allowed in v3 (e.g. one per report event).
- We are not de-duplicating or throttling these yet; any smarter behaviour is a **future improvement**.

## 6. Open questions / future improvements

- Align notification drill-down behaviour with block semantics across the app (e.g. if we later add `is_blocked_from_viewer` to notifications and gate clickthrough).
- Decide whether historical notifications from blocked users should be hidden, muted, or remain visible.
- Consider a dedicated notification centre page if the bell dropdown becomes crowded.
