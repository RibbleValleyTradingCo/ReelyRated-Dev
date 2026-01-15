# Global Hardening Runbook (Local)

## Scope
Local-only execution for global probes and evidence capture. No DB mutations in this runbook.

## Preconditions
- Local Postgres/Supabase is running.
- You have a valid connection string to the local database.
- The repository working tree is clean (or changes are understood).

## Run the full probe pack

1) Choose a capture date (YYYY-MM-DD).
2) Run the probe driver:

```
export DATABASE_URL="postgresql://..."
./docs/version6/hardening/_global/scripts/run_global_probes.sh "$DATABASE_URL" YYYY-MM-DD
```

Outputs are written to:
- `docs/version6/hardening/_global/evidence/YYYY-MM-DD/`

## Run a single probe (debug)

```
psql -X -v ON_ERROR_STOP=1 "$DATABASE_URL" \
  -c "\copy ( $(cat docs/version6/hardening/_global/sql/20_RLS_COVERAGE.sql) ) TO 'docs/version6/hardening/_global/evidence/YYYY-MM-DD/20_RLS_COVERAGE.csv' WITH CSV HEADER"
```

## Interpretation
- PASS means the gate query returns 0 rows.
- Use `sql/90_GATES_SUMMARY.sql` for a consolidated PASS/FAIL summary.

## Evidence indexing
- Add new CSVs to `docs/version6/hardening/_global/EVIDENCE-INDEX.md` (manual step).
- Record outcomes and any exceptions in the surface pipelines that required them.
