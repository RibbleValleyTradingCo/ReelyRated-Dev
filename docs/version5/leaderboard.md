<file name=0 path=/Users/jamesoneill/Documents/ReelyRatedv3/docs/version5/leaderboard.md># Page Audit — /leaderboard

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
  - Expectation: Stage 3 precomputes total_score, so this is primarily a baseline check (no ratings aggregation).
- 2.2b Species-filtered query:
  - Expectation: filter aligns with `idx_catches_species_coalesce` (at scale), and join work benefits from `idx_ratings_catch_id`.

What to capture:

- Planning time + execution time
- Presence/absence of Seq Scan on `ratings` and `catches`
- Join strategy (Hash/Merge/Nested Loop) and whether `idx_ratings_catch_id` is used
- Whether a big Sort dominates (should be reduced now that `total_score` is precomputed in Stage 3)

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
- [x] Stage 2 complete; Stage 3 tracked separately below.

### Stage 2 status

- Local: ✅ 2145 applied; EXPLAIN captured (note: tiny datasets may still choose Seq Scans).
- Dev/Prod: ensure rollout plan covers Postgres restrictions (e.g., CREATE INDEX CONCURRENTLY cannot run in a transaction block).

---

## Stage 3 Implementation

🎯 **Goal:** Make leaderboard reads index-driven at scale while keeping the public view contract stable and per-viewer block logic dynamic.

Stage 3 is deliberately about _read-path scalability_ (ORDER BY + LIMIT) while keeping the public view contract stable. The precompute tables remove per-request aggregation over ratings; the view shape then aims to let Postgres use ordering indexes on the precomputed score table before joining wider catch/profile fields.

### 3.1 Precompute base (2146)

- `catch_rating_stats` stores rating_sum + rating_count per catch (maintained via triggers on `ratings`).
- `catch_leaderboard_scores` stores species_key, created_at, total_score per catch (maintained via triggers on `catches` and rating refresh).
- `refresh_leaderboard_precompute` uses a per-catch advisory lock to prevent concurrent updates from clobbering stats.
- Ratings trigger is narrowed to `UPDATE OF rating, catch_id` to reduce noise.

### 3.2 View tuning (2147)

- The view now selects top 100 **per species** from `catch_leaderboard_scores` (ordered by total_score/created_at/id) before joining to `catches`, `profiles`, and `catch_rating_stats`.
- Why: this pushes ordering into the score table indexes and avoids full joins/sorts before LIMIT.
- Contract remains stable: same columns, same meanings, `is_blocked_from_viewer` stays dynamic.
- The view should “LIMIT early”: select Top-N from score table first, then join wider fields.

### 3.3 Species-key index tuning (2148)

- Enforces `catch_leaderboard_scores.species_key` as NOT NULL with a reserved sentinel (`__unknown__`) to make equality predicates indexable.
- View predicate uses strict equality (`species_key = ?`) so the composite ordering index can be used.
- `species_slug` output maps back via `NULLIF(species_key, '__unknown__')` fallback.
- Sentinel is **precompute-only** and must never appear in canonical species lists or UI output.

### 3.4 App Query Alignment (2149)

**Current behavior:** when a species filter is applied, the app calls `get_leaderboard_scores(p_species_slug, p_limit)` (2149). Unfiltered paths still use the view to preserve “top 100 per species” behavior.

**RPC shape:** `public.get_leaderboard_scores(p_species_slug text default null, p_limit int default 100)`:

- Starts from `catch_leaderboard_scores` (uses `species_key = p_species_slug` when provided).
- Orders by `total_score DESC, created_at ASC, catch_id ASC` and LIMITs early.
- Joins to `catches`, `profiles`, `catch_rating_stats` for details.
- Computes `is_blocked_from_viewer` dynamically (same CASE as the view).
- Returns the **same columns** as `leaderboard_scores_detailed` to keep the contract stable.

**Why:** Aligns the app with the fast path (index-driven Top‑N), avoids per-species LATERAL work for all species, and keeps the view backward‑compatible.

**Species mapping:** the UI already uses canonical species slugs (`useSpeciesOptions`). Use that slug directly as `species_key`, and map the reserved sentinel back via `NULLIF(species_key,'__unknown__')` in the RPC.

**Block logic:** keep `is_blocked_from_viewer` computed per request (do not materialize). The view path remains filtered client-side via `.eq("is_blocked_from_viewer", false)` for safety. The RPC fast-path (2150/2151) also applies `is_blocked_from_viewer = false` server-side, so the client-side filter is now redundant on the RPC path but can remain as a safety belt.

### 3.5 RPC fast-path hardening (2150)

**Why this exists:** When a single species is selected, we should not pay the cost of “top-100 per species for all species.” The RPC fast-path uses a bounded candidate set from `catch_leaderboard_scores`, then joins and filters before the final LIMIT.

**Call sites (species-filtered path):**

- `src/hooks/useLeaderboardRealtime.ts` (species-filtered path calls `get_leaderboard_scores`)
- `src/components/Leaderboard.tsx` (landing leaderboard via hook)
- `/leaderboard` remains view-driven when unfiltered (preserves “top-100 per species” semantics)

**Behavior summary (post‑2150):**

- Two sargable branches (no OR):
  - p_species_slug IS NULL → `idx_catch_leaderboard_scores_ordering`
  - p_species_slug IS NOT NULL → `idx_catch_leaderboard_scores_species_ordering`
- Buffered candidate set: `candidate_limit = LEAST(p_limit * 5, 1000)`
- Join to `catches`, `profiles`, `catch_rating_stats`
- Apply **public + blocked gates** before final LIMIT:
  - `c.deleted_at IS NULL`
  - `c.visibility = 'public'`
  - `is_blocked_from_viewer = false` (server-side)
- Sentinel guardrail: `NULLIF(species_key, '__unknown__')` so sentinel never surfaces in `species_slug`
- 2151: fix PL/pgSQL output-column ambiguity by qualifying `expanded` references (e.g., `e.is_blocked_from_viewer`, `e.total_score`).
- 2151 resolves PL/pgSQL `RETURNS TABLE` name collisions by qualifying CTE output columns (e.g. `e.is_blocked_from_viewer`) to avoid "column reference ... is ambiguous" errors.

**Acceptance criteria:**

- EXPLAIN (ANALYZE, BUFFERS) shows:
  - unfiltered uses `idx_catch_leaderboard_scores_ordering`
  - filtered uses `idx_catch_leaderboard_scores_species_ordering`
- No GroupAggregate/HashAggregate over ratings in the read path.
- Parity checks for a species (carp) show zero diffs (view vs RPC, both directions).
- Privilege checks pass (`has_function_privilege` for anon/authenticated).
- Sentinel guardrails: `__unknown__` not present in `public.catches` or `public.species`.

**Evidence captured (2026-01-01, local):**

- Privileges: `anon_can_exec = true`, `authed_can_exec = true` for `public.get_leaderboard_scores(text,int)`.
- Candidate selection is index-driven:
  - Unfiltered candidate set uses `idx_catch_leaderboard_scores_ordering` (Index Only Scan; `Heap Fetches: 0`).
  - Species candidate set uses `idx_catch_leaderboard_scores_species_ordering` with `Index Cond: (species_key = 'carp')` (Index Only Scan; `Heap Fetches: 0`).
- Expanded join path (EXPLAINing the RPC body) shows:
  - `Limit -> top-N heapsort` over the 500-row candidate buffer, then nested loop joins into `catches` (by PK), `profiles` (memoized), and `catch_rating_stats` (by PK).
  - Filters enforced on `catches`: `deleted_at IS NULL`, `visibility = 'public'`, and the per-viewer block predicate.
- Timing (local): ~12–26ms for the expanded-body plan (500 candidates, final LIMIT 100). The plain `Function Scan` timing (~22–33ms) is not sufficient to prove index usage by itself; the inlined/expanded EXPLAIN above is the proof.

**Verification SQL (RPC + parity + privileges):**

```sql
-- Privilege checks
SELECT has_function_privilege('anon', 'public.get_leaderboard_scores(text,int)', 'EXECUTE') AS anon_can_exec;
SELECT has_function_privilege('authenticated', 'public.get_leaderboard_scores(text,int)', 'EXECUTE') AS authed_can_exec;

-- EXPLAIN (unfiltered)
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM public.get_leaderboard_scores(NULL, 100);

-- EXPLAIN (species-filtered)
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM public.get_leaderboard_scores('carp', 100);

-- Note: EXPLAIN on the function call itself may show only a Function Scan; to prove index usage, EXPLAIN the inlined RPC body (see “Evidence captured” above) or use auto_explain/logging in a dev instance.

-- Parity: view vs RPC (carp)
WITH view_rows AS (
  SELECT id
  FROM public.leaderboard_scores_detailed
  WHERE species_slug = 'carp'
    AND is_blocked_from_viewer = false
  ORDER BY total_score DESC, created_at ASC, id ASC
  LIMIT 100
),
rpc_rows AS (
  SELECT id
  FROM public.get_leaderboard_scores('carp', 100)
  WHERE is_blocked_from_viewer = false
)
SELECT id FROM view_rows
EXCEPT
SELECT id FROM rpc_rows;

WITH view_rows AS (
  SELECT id
  FROM public.leaderboard_scores_detailed
  WHERE species_slug = 'carp'
    AND is_blocked_from_viewer = false
  ORDER BY total_score DESC, created_at ASC, id ASC
  LIMIT 100
),
rpc_rows AS (
  SELECT id
  FROM public.get_leaderboard_scores('carp', 100)
  WHERE is_blocked_from_viewer = false
)
SELECT id FROM rpc_rows
EXCEPT
SELECT id FROM view_rows;

-- Sentinel guardrails
SELECT COUNT(*) AS unknown_species_slug
FROM public.catches
WHERE species_slug = '__unknown__' OR species = '__unknown__';

SELECT COUNT(*) AS unknown_species_table
FROM public.species
WHERE slug = '__unknown__';
```

**Note:** A `Function Scan` plan line only summarizes the outer call; it won’t surface the internal joins/scans inside PL/pgSQL. For proof of index usage, rely on the expanded-body EXPLAIN (or server logs via `auto_explain`) rather than the top-level Function Scan.

**Rollback:** revert species-filtered UI to view-only, and drop/disable the RPC in a follow-on migration (or leave unused).

### 3.6 View verification (EXPLAIN)

**Why this step exists:** We want evidence that leaderboard reads are _index-driven_ (Top-N) and _do not aggregate ratings on every request_.

#### Local prerequisites (so the planner has something real to optimize)

- Seed volume: make sure `catches` and `catch_leaderboard_scores` are at “prod-ish” scale (e.g., 100k+ rows).
- Stats: run `ANALYZE` after bulk inserts.
- Index-only scans: if you want `Heap Fetches: 0`, you typically need VACUUM/visibility-map coverage. **VACUUM cannot run inside a transaction block**; run it as a standalone statement in a session that is not wrapping everything in BEGIN/COMMIT.

Suggested maintenance commands (run one-at-a-time):

```sql
ANALYZE public.catches;
ANALYZE public.catch_leaderboard_scores;
ANALYZE public.catch_rating_stats;
ANALYZE public.ratings;
```

```sql
VACUUM (ANALYZE) public.catch_leaderboard_scores;
VACUUM (ANALYZE) public.catch_rating_stats;
VACUUM (ANALYZE) public.ratings;
```

#### Reserved sentinel guardrails (SQL editor safe)

```sql
SELECT COUNT(*) AS unknown_species_slug
FROM public.catches
WHERE species_slug = '__unknown__';

SELECT COUNT(*) AS unknown_species_table
FROM public.species
WHERE slug = '__unknown__';
```

#### EXPLAIN checks

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

**What “good” looks like (Stage 3):**

- No `GroupAggregate` / `HashAggregate` over `ratings` in the read path.
- `catch_leaderboard_scores` is accessed via ordering indexes (unfiltered uses `idx_catch_leaderboard_scores_ordering`; filtered uses `idx_catch_leaderboard_scores_species_ordering`).
- Sorts should be over a _small working set_ (Top-N), with **no temp spill** for the LIMIT 100 query.
- Joins to `catches` / `profiles` should be against the Top-N set (avoid “join everything then sort” patterns).

**Note:** If you still see Seq Scans on `catches` locally, that can be a cost-based choice (especially if everything is cached). Focus primarily on (1) no ratings aggregation and (2) the ordering indexes being used on the score table.

### 3.4 Rollback (2147)

- Restore the view definition from 2146 (cls-first join without top-N subquery).
- Keep precompute tables/triggers in place unless a broader rollback is needed.

### Stage 3 “Done” criteria

- [ ] Top 100 query remains consistently fast as data grows (no large sorts/aggregations on every request).
- [ ] Ordering indexes on `catch_leaderboard_scores` are used by the planner.
- [ ] No GroupAggregate over ratings in the leaderboard read path.
- [ ] No privacy regressions (public-only + blocked respected).
