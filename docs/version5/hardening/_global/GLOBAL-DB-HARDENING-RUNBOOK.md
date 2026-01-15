# GLOBAL DB LOCKDOWN + COMPARE RUNBOOK (Codex-Readable)

> Purpose: Provide a deterministic, repeatable process to (1) lock down global database posture (least privilege) and
> (2) compare this runbook against the *current* DB state to identify drift and generate safe, minimal migrations.

## Standards anchors (why we do it this way)
- Keep authorization in the database (PostgREST model): authenticate request → switch role → DB authorizes via GRANT/RLS.  [oai_citation:1‡PostgREST 14](https://postgrest.org/en/stable/references/auth.html)
- Enforce Row Level Security and treat GRANTs as “table visibility + action capability,” with RLS as the fine-grained gate.  [oai_citation:2‡PostgREST 14](https://postgrest.org/en/stable/references/auth.html)
- Treat SECURITY DEFINER as a sharp tool; pin `search_path` and be explicit about execution boundaries.  [oai_citation:3‡GitHub](https://github.com/OWASP/ASVS/wiki/What-is-new-in-version-4.0.3)
- OWASP verification approach: evidence-driven checks, repeatable probes, clear PASS/FAIL gates. (Use as guiding discipline.)  [oai_citation:4‡Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)

---

## Repo conventions
- Probes live in: `docs/version5/hardening/_global/sql/probes/`
- Probe outputs live in: `docs/version5/hardening/_global/sql/results/`
- Global probe runner: `docs/version5/hardening/_global/sql/run_global_probes.sh`
- All changes: **Codex writes code**, humans verify + capture evidence.

---

## Phase gates (paste-friendly)
| Gate | Description | PASS criteria | Evidence |
|---|---|---|---|
| G0 | Inventory present | Routes + entrypoints + personas documented | Surface inventory docs |
| G1 | No public/anon DML grants | PUBLIC/anon have 0 INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER | Probe 62 output = 0 rows |
| G2 | RLS coverage | All user-facing tables have RLS enabled | RLS probe outputs |
| G3 | Grants are least-privilege | No unexpected SELECT/EXECUTE grants to anon/auth | Grants ledger + probes |
| G4 | RPC posture is safe | Definer/invoker intentional; search_path pinned; EXECUTE allowlisted | RPC posture probe |
| G5 | Multiple permissive policy risks understood | Multi-permissive (same role/cmd) is intentional or refactored | Probe 67 output reviewed |
| G6 | Per-surface validation | For each surface: HARs + SQL checks PASS across personas | Surface verification logs |

---

# Part A — “COMPARE TO CURRENT DB” (Codex should do this first)

## A1. Codex deliverable
Codex must produce a report (Markdown) with:
1) A snapshot of current DB posture (grants/RLS/policies/RPCs/views).
2) A diff vs. this runbook’s intended posture.
3) A minimal, ordered list of migrations to close gaps (global-first, then surface-scoped).
4) Any risks (breaking changes) and how to verify safely.

Output file suggestion:
`docs/version5/hardening/_global/COMPARE-REPORT.md`

## A2. Inventory queries Codex should run (read-only)
> Note: exact SQL can reuse your existing probe pack; below is the minimum inventory.

### Tables / views / materialized views
- List relations in `public` and other app schemas.
- Identify: base tables vs views, and which views require `security_invoker` / `security_barrier` consideration.

### Grants ledger
- Table privileges for roles: `anon`, `authenticated`, `public`, and any app roles.
- Function EXECUTE privileges for the same roles.

### RLS posture
- Which tables have RLS enabled?
- Which tables have **no** policies?
- Which policies are `PERMISSIVE` and target the same role + command?

### RPC posture
For every function exposed to clients:
- `SECURITY DEFINER` vs invoker
- `proacl` (EXECUTE grants)
- `search_path` pinned (or explicitly set)
- any dynamic SQL hazards
- dependency tables/views touched (and whether those are protected)

### View posture
- For each view used by PostgREST: owner, security mode, dependencies, and whether it can bypass RLS.

### Storage and realtime (if applicable)
- Buckets that are public vs private
- Policies on `storage.objects`
- Any realtime publications / replication configs relevant to exposure

### Lint warnings (non-blocking but track)
- Record `supabase db lint --schema public` warnings and classify:
  - harmless (unused param)
  - needs cleanup (variable never read, etc.)

---

# Part B — Global posture we expect (baseline)

## B1. Role model expectation (PostgREST/Supabase)
- Requests run as `anon` or `authenticated` by default.
- PostgREST/Supabase use role switching; DB must be configured so anon/auth cannot do more than intended.  [oai_citation:5‡PostgREST 14](https://postgrest.org/en/stable/references/auth.html)

## B2. Grant baseline
- PUBLIC / anon:
  - ✅ SELECT only where explicitly intended (public content only)
  - ❌ No INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER anywhere
- authenticated:
  - ✅ only the minimal SELECT/INSERT/UPDATE/DELETE required for app features
  - ❌ no broad grants “just to make it work”
- service_role:
  - allowed (server-side), but never used client-side

> You already added a deterministic DML recheck probe and a revoke migration. Gate G1 should be validated by Probe 62.

## B3. RLS baseline
- All user-facing tables: RLS enabled.  [oai_citation:6‡PostgREST 14](https://postgrest.org/en/stable/references/auth.html)
- Policies:
  - prefer role-specific policies where it materially reduces complexity
  - be careful with multiple PERMISSIVE policies for same role+cmd:
    - it’s not “wrong,” but it increases reasoning complexity and can hide unintended access.
    - Probe 67 output must be reviewed and either accepted (documented) or refactored (split roles / rewrite).

## B4. RPC baseline
- Use invoker by default.
- SECURITY DEFINER only when:
  - it is intentionally encapsulating privileged logic AND
  - execution is allowlisted AND
  - `search_path` is pinned/controlled.  [oai_citation:7‡GitHub](https://github.com/OWASP/ASVS/wiki/What-is-new-in-version-4.0.3)
- RPCs must not become “policy bypass tunnels.”

---

# Part C — How to interpret Probe 67 / “multiple permissive” findings

## C1. What Probe 67 is telling you
If a table+cmd has >1 PERMISSIVE policy applying to the same role set:
- Access is effectively the OR of policy predicates.
- This can be fine (e.g., admin OR owner OR public visibility), but it must be deliberate.

## C2. Allowed patterns (document as intentional)
- Admin override policy + public visibility policy (read-only) is often acceptable, but document why it’s safe.
- Owner policy + visibility policy: common, but verify blocked/private/follow logic is correct.

## C3. Preferable refactors (if complexity is too high)
- Role split: move admin override to a dedicated role path (or ensure `is_admin()` is the only “extra” and clearly testable).
- Reduce nested EXISTS complexity by using stable helper functions (but ensure helpers don’t bypass RLS unexpectedly).
- Add explicit `deleted_at IS NULL` consistently where soft-delete is a security boundary (anti-enumeration + integrity).

---

# Part D — Verification workflow (global-first, then surface-by-surface)

## D1. Global lock workflow
1) Run global probes (baseline “before” evidence)
2) Apply smallest global migrations (e.g., revoke PUBLIC/anon DML)
3) Re-run probes (expect deterministic PASS)
4) Update global evidence logs + grants ledger

## D2. Surface workflow (repeat per route)
1) Confirm persona contract (anon/auth/owner/admin)
2) Inventory entrypoints (tables/views/RPCs/storage/realtime/triggers)
3) Capture minimal evidence (HAR per key persona + SQL probe mini-pack)
4) Diagnose exact failure: object + layer (GRANT vs RLS vs RPC boundary)
5) Apply smallest surface-scoped fix
6) Re-test + capture evidence
7) Update surface verification log + EVIDENCE-INDEX

---

# Part E — Codex instructions (copy/paste to Codex)

## E1. Compare pass (PLAN ONLY)
“Read this runbook and compare to the current local Supabase DB. Produce `docs/version5/hardening/_global/COMPARE-REPORT.md` containing:
- Current state inventory: tables/views/functions used by PostgREST; grants; RLS enabled/policies; SECURITY DEFINER RPCs + pinned search_path; view security posture.
- Identify mismatches vs intended baseline in this doc.
- Propose an ordered list of minimal migrations to resolve mismatches, clearly marked as GLOBAL vs SURFACE-SCOPED.
- For each proposed migration, include: risk level, verification steps (which probes/HARs), and rollback note.”

## E2. If PLAN is accepted (next step)
“Implement only the GLOBAL fixes that are clearly safe (no surface behavior changes), then wire them into existing global probes so we can validate deterministically.”

---

## Appendix — References
- PostgREST role switching + DB authorization model.  [oai_citation:8‡PostgREST 14](https://postgrest.org/en/stable/references/auth.html)
- Supabase guidance on enabling and using RLS policies.  [oai_citation:9‡PostgREST 14](https://postgrest.org/en/stable/references/auth.html)
- PostgreSQL RLS concepts and policy behavior.  [oai_citation:10‡Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
- PostgreSQL function creation / SECURITY DEFINER considerations.  [oai_citation:11‡GitHub](https://github.com/OWASP/ASVS/wiki/What-is-new-in-version-4.0.3)
- OWASP ASVS project (use as verification discipline anchor).  [oai_citation:12‡GitHub](https://github.com/OWASP/ASVS)