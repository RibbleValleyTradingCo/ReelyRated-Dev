# ReelyRated – Version 3 Hardening & Test Plan

Location: `docs/version3/`

---

## 1. Goals for Version 3

For Version 3, our goal is to have a **fully working, secure, and stable app**.

We will:

1. **Document all product features** and their criticality.
2. **Map each page** to the RPCs and table queries it uses.
3. **Define acceptance criteria and test cases** for each feature.
4. **Introduce a small but meaningful set of automated tests** (unit, integration, and E2E smoke tests).
5. **Freeze new feature work** while we harden v3 on a dedicated branch, and only merge back to `main` when the plan is satisfied.

---

## 2. Current Working Plan (High Level)

1. Ask Codex to list all features the website has.
2. List all pages in the app.
3. For each page, list all RPCs and functions used on that page.
4. Test the app page by page until we’re happy with Version 3.
5. Only then open a new branch and continue iterating.

This is a strong starting point, especially the focus on:

- Code-driven inventory (pages → RPCs).
- Freezing new feature work.
- Using Codex to assist with repo-level analysis.

However, we need to refine it so that:

- We cover **cross-cutting flows**, not just individual pages.
- We explicitly test **security and RLS**.
- We mix **manual and automated** testing to avoid regressions later.

---

## 3. File Structure for Version 3 Docs

All docs for this phase will live in `docs/version3/`:

- `README.md` – overview and high-level plan (this file).
- `FEATURE-INVENTORY.md` – product-level feature list and criticality.
- `PAGE-RPC-MAP.md` – mapping of pages/routes to RPCs and table queries.
- `TEST-PLAN.md` – detailed test cases and acceptance criteria per feature.
- `SECURITY-RLS-CHECKLIST.md` – focused security and RLS checks.
- (Optional) `AUTOMATED-TESTS-PLAN.md` – outline and status of automated tests.

---

## 4. Product-Level Feature Inventory

**File:** `docs/version3/FEATURE-INVENTORY.md`

### Purpose

Capture all significant features of the app from a **product perspective**, not just what appears in the code.

We’ll organise features by **domain** rather than by page, for example:

- **Auth & Accounts**

  - Sign up / sign in / sign out
  - Password reset and email change
  - Profile editing (bio, avatar, etc.)
  - Privacy settings & blocking

- **Catches**

  - Add / edit / delete catch
  - Upload photos / media
  - Comments, replies, and mentions
  - Reactions (like / love / fire)
  - Ratings (if applicable on catches)

- **Venues**

  - Venue listing, search, and filters
  - Venue detail (leaderboard, recent catches, events, maps/region info)
  - “My venues” (venue owner flows)
  - Venue events (create/edit/publish)

- **Social**

  - Follow/unfollow
  - Feed: “people you follow” vs “all catches”
  - Notifications (new comment, reaction, rating, mentions, etc.)
  - Blocking / muted content behaviours

- **Admin / Moderation**
  - User moderation (warnings, bans, suspensions)
  - Moderation log
  - Venue admin tools
  - Reports & report review

For each feature, we should record:

- **Description**
- **User roles involved** (anon / logged-in / venue owner / admin)
- **Criticality**: `Critical | High | Medium | Low`
- **Linked pages/routes** (where it appears in the UI)
- **Linked RPCs** (if known)

---

## 5. Page → RPC & Query Mapping

**File:** `docs/version3/PAGE-RPC-MAP.md`

### Purpose

Make it explicit which backend pieces each page depends on. This is especially important in a Supabase app where the UI calls:

- RPCs (e.g. `get_venue_recent_catches`, `admin_warn_user`)
- Direct table queries (`from("catches")`, `from("venues")` etc.)

### Approach

Use Codex to scan the repo and generate a structured map:

For each page (`src/pages/*.tsx`):

- Route (e.g. `/`, `/venues/:slug`, `/my-venues`)
- **RPCs** used on that page.
- **Tables** queried directly.
- **Important interactions**:
  - Forms (create/edit)
  - Filters / search
  - Charts / insights
  - Uploads

**Example table format:**

| Page         | Route           | RPCs used                                    | Tables queried                | Notes                               |
| ------------ | --------------- | -------------------------------------------- | ----------------------------- | ----------------------------------- |
| Feed         | `/`             | `get_feed`, `get_notifications_summary`      | `catches`, `profiles`         | Infinite scroll, filters            |
| Venue detail | `/venues/:slug` | `get_venue`, `get_venue_recent_catches`, ... | `venues`, `catches`, `events` | Leaderboard, recent catches, events |
| My venues    | `/my-venues`    | `get_user_venues`, `get_venue_events`        | `venues`, `venue_events`      | Owner-only, event editing           |
| Admin users  | `/admin/users`  | `admin_list_users`, `admin_warn_user`, ...   | `profiles`, `user_warnings`   | Moderation, warnings, logs          |

This map will be the backbone for understanding **impact** when we change an RPC or table.

---

## 6. Test Plan by Feature

**File:** `docs/version3/TEST-PLAN.md`

### Purpose

Define what “working” means for each feature and how we’ll verify it.

For each feature in `FEATURE-INVENTORY.md`, define:

- **Acceptance criteria** – the conditions that must be true for this feature to be considered “working”.
- **Test cases** – broken down into:
  - Happy path
  - Edge/error cases
  - Role-based access behaviour
  - RLS / security checks (when relevant)

**Example – Add Catch**

- **Feature:** Add catch
- **Criticality:** Critical

**Acceptance criteria:**

- Logged-in user can open the “Add catch” page.
- Required fields are enforced (e.g. species, weight, date, venue or manual location).
- Valid submission creates a catch and:
  - It appears on the user’s profile.
  - It appears in relevant feeds according to visibility rules.
- If visibility is `private`, the catch:
  - Is visible to the owner.
  - Is not visible on public feeds or to other users.

**Test cases (examples):**

- A. Logged-in user creates a public catch with all fields filled → catch appears in:

  - User’s profile
  - Public feed

- B. User sets visibility to `private`:

  - User can see the catch in their own profile.
  - Another logged-in user cannot see the catch via feed or direct ID.

- C. Required fields missing:

  - Form shows validation errors and prevents submission.

- D. RLS / API-level test:
  - Direct query to `catches` table by another user for a private catch should fail or return no rows.

Follow a similar pattern for other major features.

---

## 7. Security & RLS Checklist

**File:** `docs/version3/SECURITY-RLS-CHECKLIST.md`

### Purpose

Ensure we explicitly verify:

- Row-Level Security behaviour.
- Permissions for admin-only RPCs.
- Leak-free responses (no sensitive fields exposed).

### Checklist (draft)

Auth & Sessions:

- [ ] Password reset flow:
  - [ ] Valid link allows password change.
  - [ ] Expired/invalid link shows appropriate error.
- [ ] Email change flow behaves correctly (if used).
- [ ] Session tokens expire and refresh as expected.

RLS: Catches & Visibility:

- [ ] Public catches are visible to everyone.
- [ ] Followers-only catches are:
  - [ ] Visible to followers in feeds and on profile.
  - [ ] Hidden from non-followers and anonymous users.
- [ ] Private catches:
  - [ ] Visible to the owner.
  - [ ] Hidden from all other users via normal queries and RPCs.

RLS: Social / Blocking:

- [ ] When User A blocks User B:
  - [ ] B’s content is hidden where intended for A and/or vice versa (according to app rules).
  - [ ] RPCs and queries respect blocks.

RLS: Venues & Ownership:

- [ ] Only venue owners/admins can update venue details and events.
- [ ] Non-owners cannot update or delete venues/events via RPCs or table queries.
- [ ] Venue-related RPCs cannot be abused to read other users’ private data.

Admin & Moderation:

- [ ] `admin_*` RPCs are only callable by admin users.
- [ ] Moderation actions (warning, suspension, deletion) are audit-logged correctly.
- [ ] Non-admin users are rejected when attempting to call admin RPCs.

Data exposure:

- [ ] RPCs and views do not leak:
  - Password hashes.
  - Sensitive tokens.
  - Internal-only flags or metadata that should stay private.

Add more points as you discover new rules or behaviours.

---

## 8. Automated Testing Strategy (Lightweight but Useful)

**File:** `docs/version3/AUTOMATED-TESTS-PLAN.md` (optional but recommended)

We don’t aim for full, exhaustive automation right now. Instead, we want a **thin safety net**:

### 8.1. Unit & Small Integration Tests

Focus on:

- Domain mappers (e.g. row → domain types).
- Utility functions:
  - Sorting, filtering, mapping data for charts.
  - Input sanitisation/normalisation.

Use existing Jest setup (or whatever is in the repo) and let Codex generate tests for critical helpers.

### 8.2. Supabase Integration Tests (Optional but Powerful)

Against a **local test database**:

- Verify critical RLS rules:
  - Allowed operations succeed.
  - Forbidden operations fail.
- Verify key RPCs:
  - Contract is as expected (parameters, fields, enums).
  - Typical happy-path results make sense.

This can be a small number of tests but gives high confidence that the DB layer is behaving correctly.

### 8.3. E2E Smoke Tests

Pick 5–10 **end-to-end flows** to automate using Playwright or Cypress, e.g.:

- [ ] Sign up, verify, and login.
- [ ] Add catch and verify it appears in the feed/profile.
- [ ] Follow another user and see their catches in “people you follow”.
- [ ] Create and edit a venue (if self-serve).
- [ ] Admin warns a user and the warning appears in moderation log.

These should be treated as **smoke tests**, not exhaustive coverage.

---

## 9. Branching & Workflow

To avoid messy merges and keep releases clean:

- **`main`**: last known stable version.
- **`v3-hardening` branch** (or similar):
  - All v3 test/docs/bug-fix work happens here.
  - No new features unless they are necessary to complete v3 goals.
- When v3 is ready:
  - Run the full test plan (manual + automated).
  - Merge `v3-hardening` into `main`.
  - Tag it (e.g. `v3.0.0`).

For new features after v3:

- Create feature branches off `main`.
- Ensure any new feature updates:
  - `FEATURE-INVENTORY.md`
  - Relevant sections of `TEST-PLAN.md`
  - Any impacted checklists.

---

## 10. Simple Summary (for the top of the folder)

You can optionally paste this snippet at the top of `README.md` for a quick reminder:

> For version 3, our goal is a fully working, secure, and stable app.  
> We will:
>
> 1. Document all product features and their criticality,
> 2. Map pages to RPCs and table queries,
> 3. Define acceptance criteria and test cases for each feature,
> 4. Implement a thin but meaningful layer of automated tests (unit, integration, and a small E2E smoke suite), and
> 5. Freeze new feature work while we harden v3 on a dedicated branch, merging back to main only when the feature and test inventory is satisfied.

---
