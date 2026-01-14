# Not Found Pipeline (E2E)
<!-- PHASE-GATES:START -->
## Phase Gates

| Gate | Status | Evidence | Notes |
| --- | --- | --- | --- |
| Contract & personas defined | TODO | (link to section below) | |
| Data entrypoints inventoried (tables/RPC/storage/realtime) | TODO | | |
| Anti-enumeration UX verified | TODO | | |
| RLS/policies verified for surface tables | TODO | | |
| Grants verified (least privilege) | TODO | | |
| RPC posture verified (EXECUTE + SECURITY DEFINER hygiene if used) | TODO | | |
| Manual UX pass (4 personas) | TODO | HAR + screenshots | |
| SQL probe evidence captured | TODO | CSV/SQL outputs | |
| Result | TODO | | PASS / FAIL |
<!-- PHASE-GATES:END -->

<!-- PERSONA-CONTRACT-REF:START -->
Persona contract: `docs/version5/hardening/_global/legacy/PERSONA-PERMISSIONS.md`
<!-- PERSONA-CONTRACT-REF:END -->


## Scope
- Route: `*` (catch-all under `Layout`). `src/App.tsx:219`, `src/App.tsx:344`.
- Page: `src/pages/NotFound.tsx`.
- Auth gate: none (public).
- Admin gate: none.
- Related surfaces: `/` (home), browser back navigation. `src/pages/NotFound.tsx:37`, `src/pages/NotFound.tsx:43`.

## Surface narrative (step-by-step)
1) Route + access gate
   - Catch-all route (`path="*"`) renders the NotFound page. `src/App.tsx:344`.

2) Initial load
   - Uses `useLocation` to log the missing path to the console on mount. `src/pages/NotFound.tsx:13`, `src/pages/NotFound.tsx:16`.

3) User actions / flows
   - "Go home" button links to `/`. `src/pages/NotFound.tsx:36`, `src/pages/NotFound.tsx:37`.
   - "Back" button navigates to `-1` in history. `src/pages/NotFound.tsx:39`, `src/pages/NotFound.tsx:43`.

4) Error/deny UX
   - Page shows a 404 message ("Your page got away...") with guidance text. `src/pages/NotFound.tsx:28`, `src/pages/NotFound.tsx:30`, `src/pages/NotFound.tsx:33`.

## Entrypoints inventory (with file:line)

### RPCs
- None found.

### PostgREST
- None found.

### Storage
- None found.

### Realtime
- None found.

### Third-party APIs
- None found.

## Implicit DB side-effects
- No reads or writes are issued from this surface.

## Security posture notes (facts only)
- Catch-all route is public and does not access the database. `src/App.tsx:344`.
- The page logs the attempted path to the client console. `src/pages/NotFound.tsx:17`.

## SQL queries to run during sweep
```
-- No SQL probes required (surface has no DB access).
```

## Open verification items
- None.

## Repro commands used
```
rg -n "NotFound|not found" src -S
rg -n "<Route|createBrowserRouter|path=" src/App.tsx -S
rg -n "supabase\\.rpc\\(|supabase\\.from\\(|storage\\.from\\(|channel\\(|postgres_changes|realtime" src/pages/NotFound.tsx -S
```
