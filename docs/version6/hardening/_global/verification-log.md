# Verification Log — Global SQL Posture

Links:
- ../HARDENING-GUIDELINES-SUMMARY.md
- ../UI-QUALITY-STANDARDS.md
- EVIDENCE-INDEX.md
- sql/sql-verification.sql

## Purpose

- Capture global data-layer posture across Supabase/Postgres (default ACLs, grants, RLS coverage, EXECUTE exposure, realtime publications, pg_stat_statements).
- Provide auditable evidence before and after hardening phases.

## Evidence checklist (2026-01-07)

- [ ] docs/version6/hardening/_global/evidence/sql/_global_sql_default-acl-deep-dive_2026-01-07.json
- [ ] docs/version6/hardening/_global/evidence/sql/_global_sql_publication-coverage_2026-01-07.json
- [ ] docs/version6/hardening/_global/evidence/sql/_global_sql_pg-stat-statements_2026-01-07.json
- [ ] docs/version6/hardening/_global/evidence/sql/_global_sql_rls-coverage_2026-01-07.json
- [ ] docs/version6/hardening/_global/evidence/sql/_global_sql_table-grants_2026-01-07.json
- [ ] docs/version6/hardening/_global/evidence/sql/_global_sql_function-exec-grants_2026-01-07.json
- [ ] docs/version6/hardening/_global/evidence/sql/_global_sql_security-definer-hazards_2026-01-07.json
- [ ] docs/version6/hardening/_global/evidence/sql/_global_sql_public-exec-on-admin-owner-rpcs_2026-01-07.json

## Global gates

- Default ACLs reviewed and recorded.
- No PUBLIC/anon EXECUTE on privileged RPCs (admin_/owner_) without explicit intent.
- No SECURITY DEFINER functions without pinned search_path.
- Table grants reviewed for anon/auth excessive privileges (TRIGGER/TRUNCATE/MAINTAIN/REFERENCES).
- RLS enabled on all client-reachable tables (global heuristic).
- Publication coverage reviewed for sensitive tables.

## Notes

- If pg_stat_statements is unavailable, capture the JSON error object and record as a visibility gap.
