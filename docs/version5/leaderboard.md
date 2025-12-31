# Page Audit — /leaderboard

---

## Purpose

Leaderboard ranking top catches with highlights and navigation links.

---

## Dark Mode Contrast Checklist

Use `DARK-MODE-CONTRAST-CHECKLIST.md` as reference:

- [x] Page background (`bg-background`)
- [x] Card surfaces (`bg-card`, `border-border`)
- [x] Primary text contrast (`text-foreground`)
- [x] Secondary text (`text-muted-foreground`)
- [x] Icons & UI elements

---

## Token Usage

Use `TOKEN-REFERENCE.md` as reference:

- [x] No raw palette classes (`bg-white`, `text-slate-*`, etc.)
- [x] Semantic tokens applied consistently
- [x] Shadow and focus states tokenized (`shadow-card`, `ring-ring`)

---

## Code Quality

- [x] Components are readable and maintainable
- [x] No redundant or hacky logic
- [x] Semantic HTML elements used
- [x] React rendering patterns are optimized

---

## Accessibility

Use `ACCESSIBILITY-STANDARDS.md` as reference:

- [x] Headings hierarchy (H1 → H2 → H3)
- [x] Keyboard focus visible
- [x] ALT text on all images/icons
- [x] Form labels and aria attributes

---

## Security

Use `OWASP‑TOP‑10‑CHECKLIST.md` as reference:

- [x] Auth and authorization enforced appropriately
- [x] Inputs validated/sanitized
- [x] Sensitive data not exposed in UI or logs
- [x] CSRF-safe mutation patterns (if applicable)

---

## Charts & Data Visualizations (if applicable)

Use `CHART-STYLE-GUIDELINES.md` as reference:

- [ ] N/A — no charts on this page

---

## Responsive & Interaction Check

- [x] Layout holds at mobile breakpoints
- [x] Dark mode persists on orientation change
- [x] Touch/hover states remain visible

---

## Performance

- [x] Lazy loading used for heavy sections
- [x] Images and media optimized
- [x] Avoid unnecessary re-renders

---

## Notes

- Page title now renders as H1 via `SectionHeader` (`titleAs="h1"`).
- Leaderboard table includes an accessible caption for screen readers.
- Public /leaderboard uses periodic refresh (120s) instead of realtime subscriptions to reduce chatter.
- Select list trimmed to match rendered fields (removed `created_at`, `conditions`, and `gallery_photos`).
- Thumbnails now use `image_url` with a placeholder fallback (no gallery array).
- Periodic refresh pauses while the tab is hidden and resumes on visibility change.
- Added index hygiene migration for the underlying leaderboard view: ratings by `catch_id`, catches species coalesce, and public-visible created/id partial index.
- Species label formatting is shared between leaderboard components via a common util.
- `leaderboard_scores_detailed` is a VIEW; verify indexes on the underlying tables (catches/ratings) — see `2145_leaderboard_index_hygiene.sql`.
- Blocked-row safety: all consumers now filter `.eq('is_blocked_from_viewer', false)` (hook + `HeroLeaderboardSpotlight.tsx`).
- Stage 2 verification: EXPLAIN evidence captured for unfiltered + species-filtered patterns (note: local dataset is tiny, so seq scans may still appear despite indexes).

---

## Actions

- [ ] Verify H1 appears once and caption is announced by a screen reader.
- [ ] Confirm dark-mode contrast for header stripe and score chips.
- [ ] Verify periodic refresh (~120s) and no realtime subscription on /leaderboard.
- [ ] Verify refresh pauses while the tab is hidden and resumes when visible.
- [ ] Check horizontal scroll + touch behavior on mobile/tablet.
- [ ] Confirm network payload is smaller and rows still render correctly after select trimming (no gallery photos/conditions).
- [x] Run an EXPLAIN (ANALYZE, BUFFERS) on the leaderboard query patterns (unfiltered + species-filtered) and capture evidence.
- [x] Verify leaderboard indexes exist (2145) and validate planner behavior (with the caveat that tiny datasets may still choose seq scans).
- [x] Confirm blocked users’ catches are filtered out in landing, /leaderboard, and spotlight when signed in.

---

## Stage 1 Status

✅ **Stage 1 is complete** (UI + UX hygiene)

Completed items:

- Accessibility: H1 + table caption.
- Public page refresh: periodic refresh (landing 180s, /leaderboard 120s) and no realtime websockets.
- Payload trim: removed `created_at`, `conditions`, `gallery_photos` from the fetch and updated UI fallbacks.
- Refresh hygiene: pause periodic refresh while the tab is hidden.

---

## Stage 2 Plan

🎯 **Goal:** Make the current leaderboard query pattern as _index-friendly_ and _predictable at scale_ as possible **without changing any DB contracts** (no RPC signature changes, no endpoint renames).

### 2.1 Apply index hygiene (DB, contract-neutral)

- Migration: `2145_leaderboard_index_hygiene.sql`
  - `idx_ratings_catch_id` on `public.ratings(catch_id)` to speed the join/aggregate.
  - `idx_catches_species_coalesce` expression index on `(COALESCE(species_slug, species))` to support the species filter.
  - `idx_catches_public_visible_created_id` partial index for the common filter path: `visibility='public' AND deleted_at IS NULL`.

**Production note:** if we need `CREATE INDEX CONCURRENTLY`, it **cannot run inside a transaction block** (Postgres restriction). If our migration runner wraps migrations in a single transaction, Codex should propose a safe alternative deployment approach (e.g., separate non-transactional step / manual runbook for prod).

### 2.2 Verify the planner uses the indexes (SQL evidence)

Run and record (copy/paste output below):

- 2.2a Unfiltered query (top N):
  - Expectation: still sorts by computed `total_score`, but avoids pathological scans at scale.
- 2.2b Species-filtered query:
  - Expectation: filter aligns with `idx_catches_species_coalesce` (at scale), and join work benefits from `idx_ratings_catch_id`.

What to capture:

- Planning time + execution time
- Presence/absence of Seq Scan on `ratings` and `catches`
- Join strategy (Hash/Merge/Nested Loop) and whether `idx_ratings_catch_id` is used
- Whether a big Sort dominates (expected until `total_score` is materialized in Stage 3)

Evidence captured (2025-12-31):

- 2.2a Unfiltered: planning ~1.7ms, execution ~0.26ms. Plan still shows Seq Scans on catches/ratings due to tiny table sizes; this is acceptable as a local-scale artifact.
- 2.2b Species-filtered: planning ~1.4ms, execution ~0.28ms. Filter uses COALESCE(species_slug, species) = 'carp'. Still Seq Scans locally; revisit once tables are larger / in prod-like data volume.

Additional spot-check (species-filtered) showed `idx_ratings_catch_id` being used in an Index Scan, with a Merge Join + Incremental Sort, indicating the new ratings index is available to the planner.

### 2.3 Security + privacy sanity checks

Even though the page is public, we should confirm:

- The view path only returns `visibility='public'` and `deleted_at IS NULL` rows.
- Ensure all `leaderboard_scores_detailed` consumers filter `eq('is_blocked_from_viewer', false)` (hook + `HeroLeaderboardSpotlight.tsx`) so blocked rows never render for authenticated viewers.

### 2.4 Monitoring checks (lightweight)

- Confirm refresh pause/resume works (no background polling when hidden).
- Confirm refresh doesn’t stack intervals (one timer only).
- Confirm response payload sizes after trimming (spot-check with DevTools).

### Stage 2 “Done” criteria

- [x] 2145 applied in local + dev environments (and production-safe plan documented if CONCURRENTLY is needed).
- [x] EXPLAIN evidence captured for both query patterns (unfiltered + species-filtered).
- [x] Confirmed no unintended data exposure (public-only, deleted excluded, blocked respected in hook + spotlight).
- [x] Confirmed payload + refresh behavior remains stable across landing + /leaderboard + spotlight.
- [ ] Stage 3 precompute (2146) applied; view tuning (2147) applied after EXPLAIN validation.

---

## Stage 3 Implementation

🎯 **Goal:** Make leaderboard reads index-driven at scale while keeping the public view contract stable and per-viewer block logic dynamic.

### 3.1 Precompute base (2146)

- `catch_rating_stats` stores rating_sum + rating_count per catch (maintained via triggers on `ratings`).
- `catch_leaderboard_scores` stores species_key, created_at, total_score per catch (maintained via triggers on `catches` and rating refresh).
- `refresh_leaderboard_precompute` uses a per-catch advisory lock to prevent concurrent updates from clobbering stats.
- Ratings trigger is narrowed to `UPDATE OF rating, catch_id` to reduce noise.

### 3.2 View tuning (2147)

- The view now selects top 100 **per species** from `catch_leaderboard_scores` (ordered by total_score/created_at/id) before joining to `catches`, `profiles`, and `catch_rating_stats`.
- Why: this pushes ordering into the score table indexes and avoids full joins/sorts before LIMIT.
- Contract remains stable: same columns, same meanings, `is_blocked_from_viewer` stays dynamic.

### 3.3 Verification (EXPLAIN)

Unfiltered top 100:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM public.leaderboard_scores_detailed
ORDER BY total_score DESC, created_at ASC, id ASC
LIMIT 100;
```

Species-filtered top 100:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM public.leaderboard_scores_detailed
WHERE species_slug = 'carp'
ORDER BY total_score DESC, created_at ASC, id ASC
LIMIT 100;
```

Expected:
- Planner uses `idx_catch_leaderboard_scores_ordering` (unfiltered).
- Planner uses `idx_catch_leaderboard_scores_species_ordering` (filtered).
- No GroupAggregate over `ratings`; no temp spill for top 100.

### 3.4 Rollback (2147)

- Restore the view definition from 2146 (cls-first join without top-N subquery).
- Keep precompute tables/triggers in place unless a broader rollback is needed.

### Stage 3 “Done” criteria

- [ ] Top 100 query remains consistently fast as data grows (no large sorts/aggregations on every request).
- [ ] Ordering indexes on `catch_leaderboard_scores` are used by the planner.
- [ ] No GroupAggregate over ratings in the leaderboard read path.
- [ ] No privacy regressions (public-only + blocked respected).
