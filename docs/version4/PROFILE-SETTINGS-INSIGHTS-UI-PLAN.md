# Profile / Settings / Insights UI Plan

Date: 2025-12-29  
Applies to: `/insights`, `/profile/:slug`, `/settings/profile`  
Companion doc (source of truth for current behavior): `PROFILE-SETTINGS-INSIGHTS-PROD-READINESS-REVIEW.md`

---

## TL;DR

We are redesigning the **UI** for Insights / Profile / Settings while keeping **data paths unchanged**.

### UI-only by default

- Do not change: RPC names/signatures, query keys, invalidation keys, table selects, RLS behavior, storage object paths.
- Only exceptions: explicitly scheduled DB/RLS phases (separate prompts + migrations).

### Recommended execution order

1. **Settings** → 2) **Insights** → 3) **Profile**

### Primary goals

- Consistent page layout + section styling
- Clear loading/empty/error states
- No regressions in behavior or data access
- Improved perceived performance (without changing fetch logic)

---

## Scope

### In scope (UI-only)

- Layout, component structure, spacing/typography, information hierarchy
- Loading/empty/error states (presentation only)
- Progressive disclosure UX (tabs/accordion) _without changing underlying queries_
- Minor UI correctness fixes (e.g., admin badge Promise bug) **without** changing backend calls

### Out of scope (unless a separate DB phase is scheduled)

- New RPCs/migrations
- Changing RLS policies
- Replacing direct Supabase reads with React Query
- Refactoring query keys, invalidation strategies, pagination models
- Reworking storage policies or object naming/prefixes

---

## Non-negotiables / guardrails for Codex

### 1) Data-flow invariants (must remain true in UI phases)

- Insights: direct Supabase reads of `public.catches` + `public.sessions`; client-side aggregation.
- Profile: React Query queries/mutations and query keys remain exactly as-is.
- Settings: direct Supabase reads/writes + auth updates; avatar upload uses existing `avatars` bucket behavior.

### 2) “No shortcuts” engineering standard

- No `window.location.reload`, no timeouts to “fix” race conditions.
- No message-string parsing for errors; when error mapping is required, use `error.code` (but only in a scheduled task).
- Keep diffs small and reversible; avoid broad refactors.

### 3) Documentation discipline

- Every implemented UI task must update:
  - This plan (“Progress” section)
  - If behavior/user expectations change, update `PROFILE-SETTINGS-INSIGHTS-PROD-READINESS-REVIEW.md` notes (UI-only)

---

## UI baseline decisions (shared across all three pages)

### A) Page shell

- Standard page header:
  - Eyebrow (optional)
  - Title
  - Short subtitle (1 line)
  - Optional right-side action slot (e.g., “Edit profile” / “Share”)
- Consistent max-width + spacing across pages

### B) Section framing

- Every section uses the same primitives:
  - Section header (title + optional helper text)
  - Content area (cards/rows)
  - State area (loading/empty/error)
- Avoid layout shift: reserve space for skeletons where possible

### C) State components (standardize)

Create/reuse a minimal set of shared components (UI-only):

- `PageSkeleton`
- `SectionSkeleton`
- `EmptyStateCard` (title, body, CTA)
- `ErrorStateCard` (title, body, optional retry callback)

**Rule:** these components must not alter fetch logic; they only render based on existing state flags.

---

## Phases

### Phase 0 — Baseline correctness + state polish (UI-only)

Goal: fix misleading UI and standardize states before visual redesign.

#### Tasks

- [x] P0-A: Fix Settings "admin badge Promise" bug (commit: TBD)

  - File(s): `src/pages/ProfileSettings.tsx` (and any helper it uses)
  - Requirement: render admin badge only after real async resolution; non-admins must never see it.
  - No changes to data paths, only UI state handling.

- [x] P0-B: Add consistent loading/empty/error states (no data changes) (commit: TBD)
  - Insights: skeleton + empty state when no catches/sessions
  - Profile: skeleton for profile header + empty state for catches
  - Settings: skeleton for initial profile load + error state for blocked list

#### Acceptance criteria

- No change in network call counts beyond incidental render timing.
- No console errors.
- Manual smoke:
  - Settings: admin badge correct
  - Insights: empty state works
  - Profile: empty catches state works

---

### Phase 1 — Visual redesign (UI-only), page-by-page

#### 1A) Settings redesign (recommended first)

Goal: make Settings feel like a “modern account center”.

**Information architecture**

- Left rail on desktop, top tabs on mobile:
  - Profile
  - Account
  - Privacy
  - Safety/Blocking
  - Data
  - Danger Zone

**Layout**

- Top “Identity” card: avatar + username + short bio preview
- Group cards:
  - Account (email/password)
  - Privacy (profile privacy)
  - Safety (blocked list)
  - Data (export)
  - Danger zone (delete account)

**Must not change**

- Avatar storage object key conventions and bucket usage.
- Auth update flows.

Tasks

- [x] S-A: Page shell + navigation layout refresh (commit: TBD)
- [x] S-B: Identity header card refresh (avatar + basic profile) (commit: TBD)
- [x] S-C: Section grouping and card styling consistency (commit: TBD)
- [x] S-D: Loading/empty/error polish pass (use shared state components) (commit: TBD)
- Note: Microcopy dedupe pass completed (commit: TBD)
- Note: Responsive overflow fix + final microcopy polish completed (commit: TBD)
- Note: Final Settings polish: button consistency + mobile nav + success feedback (commit: TBD)
- Note: Added section header icons + removed redundant save helper copy (commit: TBD)

Acceptance criteria

- All existing actions still work with the same behaviors.
- No storage path changes; avatar still persists after refresh.

---

#### 1B) Insights redesign (progressive disclosure, no fetch changes)

Goal: reduce “overwhelming wall of charts” and improve perceived performance.

**Layout**

- “Overview” first: 3–6 headline stat cards
- Filters: compact (collapsible on mobile)
- Charts behind tabs/accordion:
  - Trends
  - Species breakdown
  - Venues
  - Sessions

**Perf-friendly UI rules**

- Defer rendering of heavy chart components until the tab/accordion is opened.
- Keep chart containers stable height to minimize layout shift.

Tasks

- [x] I-A: New layout + overview cards hierarchy (commit: TBD)
- [x] I-B: Tabs/accordion progressive disclosure for charts (commit: TBD)
- [x] I-C: Loading/empty/error state polish (shared components) (commit: TBD)
- [x] I-D: Microcopy pass (what this chart means; empty hints) (commit: TBD)
- Note: Insights polish pass: dedupe copy + hierarchy + mobile nav refinements (commit: TBD)
- Note: Removed Overview block; Filters now render as a full-width row (commit: TBD)

Acceptance criteria

- Underlying reads remain identical (still loads the same catches/sessions).
- No chart “remount storms” when toggling filters (watch for repeated expensive computation).

---

#### 1C) Profile redesign (highest complexity; do last)

Goal: modern “social profile” feel with clear CTAs and stable lists.

**Layout**

- Hero: avatar, username, bio, follow/block CTA, (admin tools hidden unless admin)
- Stats row: followers/following/catches (and optionally PB highlight if already present)
- Catches grid: stable scroll + clear loading (infinite)
- Own-profile notifications section: consistent state visuals

**UI-only precautions**

- Do not change query keys or mutation cache logic.
- Be careful with rerenders: avoid passing unstable objects into memoized components.

Tasks

- [ ] P-A: Hero redesign (CTA placement, spacing, clarity)
- [ ] P-B: Stats + following strip redesign
- [ ] P-C: Catches grid visual redesign (no logic change)
- [ ] P-D: Notifications section UI refresh (own profile only)
- [ ] P-E: Loading/empty/error polish (shared components)

Acceptance criteria

- Follow/unfollow, block/unblock, bio edit all behave as before.
- Infinite catches pagination still works and scroll anchoring remains acceptable.

---

## Phase 2 — Production gates (DB/RLS) — separate prompts only

Not part of UI-only work; listed here so we don’t forget.

- [ ] DB-A: Audit `public.profiles` exposure; restrict public reads if moderation/internal columns exist.
- [ ] DB-B: Move rate-limit errors to SQLSTATE codes (no message parsing).
- [ ] DB-C: Maintain/verify catches SELECT policy hardening stays deployed across envs.

---

## Progress tracker (update as we go)

| Phase | Task                                        | Status | Notes / PR / Commit |
| ----- | ------------------------------------------- | ------ | ------------------- |
| 0     | P0-A admin badge fix                        | DONE   | commit: TBD         |
| 0     | P0-B shared state components + state polish | DONE   | commit: TBD         |
| 1A    | Settings redesign                           | DONE   | S-A/S-B/S-C/S-D done (commit: TBD) |
| 1B    | Insights redesign                           | DONE   | commit: TBD         |
| 1C    | Profile redesign                            | TODO   |                     |
| 2     | DB gates                                    | TODO   | separate prompts    |

---

## Manual QA checklist (run after each page redesign)

### Global

- No console errors on navigation between `/settings/profile`, `/insights`, `/profile/:slug`
- Mobile + desktop layouts check

### Settings

- Update profile fields
- Toggle privacy
- Upload avatar, refresh, avatar persists
- Unblock user, list updates
- Request export + deletion flows still reachable

### Insights

- Empty state with no data
- Filters update visible summaries
- Tabs/accordion do not cause layout explosions

### Profile

- View own profile vs someone else
- Follow/unfollow updates CTA and follower count
- Block/unblock updates blocked state
- Empty catches state is clear
- Notifications section (own profile) still works

---

## Codex execution protocol (must follow)

For each task:

1. Quote the relevant sections from this plan + the readiness review.
2. Provide a short “minimal diff” plan (files + what changes).
3. Implement.
4. Report: files changed, what stayed untouched (RPCs/query keys), and a manual QA list.
5. Update the Progress tracker row(s).
