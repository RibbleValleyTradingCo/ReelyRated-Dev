# Global Hardening Workspace

This folder contains the v2 global DB hardening artifacts: baseline invariants, persona rules, probe pack, and runbooks.

## Quickstart (local)
1) Run the global probe pack:
   - `docs/version6/hardening/_global/scripts/run_global_probes.sh "${DATABASE_URL}" YYYY-MM-DD`
2) Evidence CSVs are written to:
   - `docs/version6/hardening/_global/evidence/YYYY-MM-DD/`
3) PASS means the relevant gate query returns **0 rows**. Any rows are actionable failures.

## Core docs
- Baseline invariants: `docs/version6/hardening/_global/BASELINE-INVARIANTS.md`
- Persona access matrix: `docs/version6/hardening/_global/PERSONA-ACCESS-MATRIX.md`
- Gate catalog: `docs/version6/hardening/_global/GATES.md`
- Local runbook: `docs/version6/hardening/_global/RUNBOOK-GLOBAL-LOCAL.md`

## Probe pack (SQL)
- All probes live in: `docs/version6/hardening/_global/sql/`
- Each file produces a single, deterministic result set (stable ORDER BY).

## Evidence
- Store raw CSVs locally in `_local_evidence/` (not committed).
- Do not edit CSVs after export; re-run probes if corrections are needed.

## Evidence storage policy (local-only)
- Raw evidence (HARs, screenshots, exports) goes in `_local_evidence/` and is **not committed**.
- Committed docs only contain EVIDENCE-INDEX references, timestamps, and brief test notes.
