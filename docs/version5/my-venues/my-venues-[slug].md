# Page Audit — /my/venues/:slug

---

## Purpose

Owner management page for a specific venue’s details and settings.

---

## Current Status

Implementation work for **Phase 1 (Performance)** and **Phase 3 (Security link hardening)** has been applied in this branch, but the **manual verification steps have not yet been completed**.

What is implemented (code-level):

- Lazy-mount gating for heavy accordion sections using `SECTION_KEYS` + `openedSections` + `forceMount`.
- Events fetch gated so `owner_get_venue_events` only runs after the **Events** section is opened.
- Persisted venue photos use `loading="lazy"` and `decoding="async"`.
- Centralized URL sanitization (`sanitizeExternalUrl`) + standardized external link rel handling (`rel="noopener noreferrer"` for `target="_blank"`).
- Removed any raw URL fallback that bypassed sanitization (e.g. `normalizeExternalUrl(x) ?? x`).
- Audit doc runbook/checklists refreshed (this file).

What remains (must be done interactively):

- Network proof (HAR) to confirm heavy reads are deferred.
- Dark mode contrast verification and responsive/touch verification.
- Security test-vector verification for markdown/URL sanitization.

Note on "no heavy reads on initial load": the accordion defaults open to `species`, so **Species may still fetch on first paint** unless we change the default open behavior. The network proof rules below treat **Species** as allowed-on-initial-load, and all other heavy reads as forbidden until first open.

---

## Dark Mode Contrast Checklist

Use `DARK-MODE-CONTRAST-CHECKLIST.md` as reference:

- [ ] Page background (`bg-background`) — tokenized; needs manual contrast verification in dark mode
- [ ] Card surfaces (`bg-card`, `border-border`) — tokenized; needs manual contrast verification in dark mode
- [ ] Primary text contrast (`text-foreground`) — tokenized; needs manual contrast verification in dark mode
- [ ] Secondary text (`text-muted-foreground`) — tokenized; needs manual contrast verification in dark mode
- [ ] Icons & UI elements — status/autosave chips tuned; needs manual contrast verification in dark mode

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
- [x] React rendering patterns are optimized (perf follow-up: defer heavy section mounts)

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
- [ ] Inputs validated/sanitized (uploads validated client-side; markdown/URL sanitization + rel standardization implemented — verify with test vectors)
- [x] Sensitive data not exposed in UI or logs
- [x] CSRF-safe mutation patterns (if applicable)

---

## Charts & Data Visualizations

N/A — no charts or data visualizations on this page.

---

## Responsive & Interaction Check

- [ ] Layout holds at mobile breakpoints
- [ ] Dark mode persists on orientation change
- [ ] Touch/hover states remain visible

---

## Performance

- [ ] Lazy loading used for heavy sections (implemented — requires network proof)
- [ ] Images and media optimized (implemented: `loading="lazy"`/`decoding="async"` on persisted photos — requires verification)
- [ ] Avoid unnecessary re-renders (only optimize if perf becomes an issue)

---

## Notes

- Found a security leak: `/my/venues/:slug` called `public.get_venue_by_slug` before ownership checks, so non-owners could receive venue JSON for published venues via a 200 response.
- Cause: `public.get_venue_by_slug` is executable by `anon`/`authenticated` and `venues` RLS allows `is_published = true`, so ownership gating only happened in the UI.
- Fix: added `public.owner_get_venue_by_slug` (SECURITY DEFINER, locked search_path, owner/admin gate) and updated the owner page to use it for the initial fetch and post-save refresh.
- Implementation: DB migration `2152_owner_get_venue_by_slug.sql` adds `public.owner_get_venue_by_slug`; `MyVenueEdit.tsx` now uses this RPC for initial load and post-save refresh.
- OWASP mapping: this was a Broken Access Control issue (server returned data before authorization); the fix enforces authorization at the data layer (non-owners receive zero rows).
- Public pages remain unchanged: `/venues/:slug` continues using the public-safe `get_venue_by_slug` (published venues).

---

## Actions

- Implemented owner-safe read (migration `2152_owner_get_venue_by_slug.sql`): `public.owner_get_venue_by_slug(p_slug text)` is `SECURITY DEFINER`, uses locked `search_path`, enforces `auth.uid()` + (admin OR venue_owners) gate, and is executable by `authenticated` only (no `anon` access).
- Updated owner page fetch order: `/my/venues/:slug` (`MyVenueEdit.tsx`) now calls `owner_get_venue_by_slug` for initial load and for refresh after `owner_update_venue_metadata`; non-owners receive **zero rows** from the server (no venue JSON leak).
- Verification (SQL, Supabase editor):

```sql
-- anon should not be able to execute
select has_function_privilege('anon', 'public.owner_get_venue_by_slug(text)', 'execute') as anon_can_exec;

-- simulate authenticated context for auth.uid()
select set_config('request.jwt.claim.role', 'authenticated', true);

-- owner user -> returns 1 row
select set_config('request.jwt.claim.sub', 'OWNER_UUID', true);
select count(*) as owner_rows
from public.owner_get_venue_by_slug('VENUE_SLUG');

-- admin user -> returns 1 row
select set_config('request.jwt.claim.sub', 'ADMIN_UUID', true);
select count(*) as admin_rows
from public.owner_get_venue_by_slug('VENUE_SLUG');

-- non-owner user -> returns 0 rows
select set_config('request.jwt.claim.sub', 'NON_OWNER_UUID', true);
select count(*) as non_owner_rows
from public.owner_get_venue_by_slug('VENUE_SLUG');
```

- Verification (browser/network) — pending (expected outcomes):
- Expected: Non-owner visits `/my/venues/:slug`: Access denied UI, and the `owner_get_venue_by_slug` response body is an empty array (zero rows).
- Expected: Owner/admin visits `/my/venues/:slug`: venue data loads normally and owner sections work as before.
- Expected: Network proof: on `/my/venues/:slug`, confirm there is **no** request to `get_venue_by_slug` and the page only calls `owner_get_venue_by_slug` for the venue read.

## Phased Implementation Plan (Draft)

### Ground truth (confirmed)

- Route is behind `RequireAuth` and renders `MyVenueEdit`.
- Initial venue read on this route uses `owner_get_venue_by_slug`.
- Accordion is controlled (`value`/`onValueChange`) with default open `["species"]`.
- Accordion item values are exactly: `species`, `facilities`, `pricing`, `contact`, `hours`, `rules`, `photos`, `events`.
- `AccordionContent` supports `forceMount` (props passthrough to Radix).

> If any of the above differs in code, STOP and update this plan before making changes.

### Phase 1: Performance (lazy-mount + image lazy loading)

- **Files likely to touch:** `src/pages/MyVenueEdit.tsx`, `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx`, `src/components/loading/InlineSpinner.tsx` (only if a placeholder is needed)
- **Implementation approach:**

  - #### SECTION_KEYS (use exactly)

  ```ts
  const SECTION_KEYS = {
    species: "species",
    facilities: "facilities",
    pricing: "pricing",
    contact: "contact",
    hours: "hours",
    rules: "rules",
    photos: "photos",
    events: "events",
  } as const;
  ```

  - Add `openedSections` state seeded with default open keys; update it from committed `accordionValue` via `useEffect` (current implementation does not block accordion changes).
  - Use mount-on-first-open, never-unmount: `AccordionContent` `forceMount` gated by `openedSections` and only render heavy cards when the section has been opened.
  - Gate heavy fetches: cards that fetch on mount should not mount until opened; `owner_get_venue_events` should only run after the Events section opens.
  - Loading UX on first open: rely on existing spinners/skeletons in cards; add a minimal placeholder only if any section flashes empty.
  - Photo lazy loading (VenuePhotosCard): identify all `<img>` render sites:
    - Upload queue preview `<img src={item.previewUrl}>` stays eager (no `loading="lazy"`).
    - Current photos grid `<img src={publicUrl}>` gets `loading="lazy"` and optional `decoding="async"` (covers primary photo too).
  - Minimal-change principle: keep changes localized; no refactor beyond small helpers unless explicitly justified.

- **Risks + mitigations:**
  - Unsaved state loss if unmounted; mitigate with `openedSections` + `forceMount` (mount once, never unmount).
  - Interaction with `useBlocker`/`useBeforeUnload`; current implementation allows accordion changes even when dirty (blocker is navigation-only).
- **Verification checklist:**

  - #### Network proof runbook (HAR required)

  **DevTools setup (Chrome):**

  1. Open **DevTools → Network**
  2. Enable **Preserve log**
  3. Enable **Disable cache**
  4. Use **Fetch/XHR** to validate REST/RPC requests
  5. Switch to **Img** (or **All**) when validating `storage/v1/*` image requests

  **Filters to paste into the Network search box (copy/paste):**

  ```
  rest/v1/
  rpc/
  storage/v1/
  storage/v1/object
  venue-photos
  venue_species_stock
  venue_pricing_tiers
  venue_opening_hours
  venue_rules
  get_venue_photos
  owner_get_venue_events
  owner_get_venue_by_slug
  get_venue_by_slug
  ```

  **Initial load (before opening any accordion sections):**

  - MUST SEE: `rpc/owner_get_venue_by_slug` (owner/admin/non-owner) + auth/session traffic (+ `rest/v1/venue_species_stock` is allowed if Species is the default-open section)
  - MUST NOT SEE:
    - `rest/v1/venue_pricing_tiers`
    - `rest/v1/venue_opening_hours`
    - `rest/v1/venue_rules`
    - `rpc/get_venue_photos`
    - `rpc/owner_get_venue_events`
    - `storage/v1/object/public/venue-photos/*`
    - `rpc/get_venue_by_slug` (from this route)

  > If you require **zero** heavy reads on first paint, change the default accordion open value away from `species` (or add a separate “user-opened” gate for Species). Otherwise, treat Species as the only heavy read allowed on initial load.

  **First open (expected reads per section):**

  - Species → `rest/v1/venue_species_stock` (already on initial load if `species` is default-open)
  - Pricing → `rest/v1/venue_pricing_tiers`
  - Hours → `rest/v1/venue_opening_hours`
  - Rules → `rest/v1/venue_rules`
  - Photos → `rpc/get_venue_photos`, then `storage/v1/object/public/venue-photos/*`
  - Events → `rpc/owner_get_venue_events`

  **Reopen behavior:** close/reopen must NOT repeat the “first open” reads unless you intentionally trigger a refresh/invalidation.

  **HAR artifacts (export with content):**

  - `my-venues-slug-initial-load-<role>-<YYYY-MM-DD>.har`
  - `my-venues-slug-after-open-all-<role>-<YYYY-MM-DD>.har`

  Export for roles: `owner`, `non-owner`, `admin`.

  - Open each section once and confirm its fetch occurs only on first open; close/reopen preserves edits.
  - Photos still render; primary selection works; previews are immediate; lazy loading visible in Elements.

- **Exit criteria:**
  - Heavy RPCs/selects deferred until open; opened sections retain state; photo lazy loading verified.
- **Checklist updates after phase (only after verification):**
  - Code Quality: "React rendering patterns are optimized (perf follow-up: defer heavy section mounts)"
  - Performance: "Lazy loading used for heavy sections (follow-up)" + "Images and media optimized (follow-up: add loading=\"lazy\" for photos)"
  - Remaining checklist items: "Defer heavy accordion sections..." + "Add `loading=\"lazy\"`..."
  - Leave "Avoid unnecessary re-renders" unchecked unless a specific re-render issue is addressed.

### Phase 2: Manual verification (dark mode + responsive/touch) + conditional token tweaks

- **Files likely to touch (conditional):** `src/styles/tokens.css` (tokens only if contrast fails)
- **Implementation approach:**
  - Run the dark-mode checklist on `/my/venues/:slug` (backgrounds, cards, text, icons, autosave chips, focus rings).
  - Mobile checks at 360/390/414 widths and landscape; confirm no horizontal scroll, 44px tap targets, and focus/hover visibility.
  - If any contrast fails, adjust tokens only (no raw palette classes) and recheck.
- **Risks + mitigations:**
  - Token tweaks affect other pages; minimize token changes and spot-check one additional page.
- **Verification checklist:**
  - Dark-mode contrast verified with DevTools contrast tool where needed.
  - Responsive/touch checks completed; dark mode persists on orientation change.
- **Exit criteria:**
  - All manual checks pass; any token changes validated.
- **Checklist updates after phase (only after verification):**
  - Dark Mode Contrast Checklist items (all)
  - Responsive & Interaction Check items (all)
  - Remaining checklist items: "Review dark-mode contrast..." + "Manual responsive/touch verification..."

### Phase 3: Security verification (sanitization + safe URLs)

- **Files already updated (code-level):** `src/components/typography/MarkdownContent.tsx`, `src/lib/urls.ts`, and venue detail link render surfaces (VenueHero / PlanYourVisitSection / LocationMapSection / EventsSection).
- **Implementation summary (completed):**
  - Shared render-time sanitizer now blocks `javascript:`/`data:` (allows `http/https/mailto/tel` and internal `/#`) for markdown links and URL fields.
  - Markdown links use the shared helper; invalid links render inert.
  - External links standardize `target="_blank"` + `rel="noopener noreferrer"` via the shared helper.
  - Raw URL fallbacks that bypass sanitization were removed (e.g., `normalizeExternalUrl(x) ?? x`).
  - Frontend-only; no DB changes.
- **Verification checklist (pending):**
  - Test vectors render inert with no execution: `<script>`, `onerror=`, `[x](javascript:...)`, `[x](data:...)`, and `javascript:` in URL fields.
  - Valid links remain functional.
- **Exit criteria (after verification):**
  - Test vectors are neutralized across all render surfaces.
- **Checklist updates after phase (only after verification):**
  - Security: "Inputs validated/sanitized..."
  - Remaining checklist items: "Review markdown/URL sanitization strategy..."

### Phase 4: Documentation sync + final sign-off checklist

- **Files likely to touch:** `docs/version5/my-venues-[slug].md`
- **Implementation approach:**
  - Update checklist items immediately after each phase exits; keep manual items unchecked until verified.
  - Add a "Runbook: Verification" section that documents network proof, dark-mode checks, responsive/touch checks, and sanitization test vectors.
  - Refresh "Remaining checklist items" to reflect reality.
- **Risks + mitigations:**
  - Doc drift; mitigate by updating after each phase and keeping manual checks honest.
- **Verification checklist:**
  - Audit doc reflects actual completion status; runbook present.
- **Exit criteria:**
  - Docs synced with the latest status; verification steps recorded.

### Go/No-Go Gates

- Initial load defers heavy section fetches (network proof captured).
- Unsaved changes persist across accordion toggles and blockers still trigger.
- Photo lazy loading verified without regressions.
- Dark mode contrast and responsive/touch checks pass.
- Sanitization neutralizes test vectors across all render surfaces.
- Audit doc updated with accurate checkmarks and runbook.

## Remaining checklist items

> Only tick these once the relevant phase has met its **exit criteria** and evidence is captured.

- [ ] Phase 1: Network proof captured (HAR) and reviewed (owner / non-owner / admin).
- [ ] Phase 1: Heavy reads deferred until first open for **all sections except Species** (unless default-open behavior changed).
- [ ] Phase 1: Unsaved state persists across close/reopen; blockers still trigger correctly.
- [ ] Phase 1: Photos lazy-load without regressions (preview remains immediate; primary selection works).
- [ ] Phase 2: Dark-mode contrast verification completed (record results).
- [ ] Phase 2: Responsive/touch verification completed at 360/390/414 + landscape (record results).
- [ ] Phase 3: Sanitization test vectors verified (no execution; invalid links inert across all render surfaces).
- [ ] Phase 4: Audit doc checkboxes updated to reflect verified reality.
