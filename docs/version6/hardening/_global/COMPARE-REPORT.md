# Compare Report (v6)

Status: **stub** — populate after running global probes.

## Inputs
- RPC inventory: `docs/version6/hardening/_global/RPC-INVENTORY.md`
- Dependency map: `docs/version6/hardening/_global/RPC-DEPENDENCY-MAP.md`
- Persona DB contract: `docs/version6/hardening/_global/PERSONA-DB-CONTRACT.md`
- Global runbook: `docs/version6/hardening/_global/GLOBAL-DB-HARDENING-RUNBOOK.md`

## Output expectations
- Current DB posture snapshot (grants/RLS/RPCs/views).
- Diff vs baseline invariants.
- Minimal migration list (global-first, then surface-scoped).
