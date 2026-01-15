# Global Probe Script (Local)

## Usage

```
export DATABASE_URL="postgresql://..."
./docs/version6/hardening/_global/scripts/run_global_probes.sh "$DATABASE_URL" YYYY-MM-DD
```

## Output

CSV files are written to:
- `docs/version6/hardening/_global/evidence/YYYY-MM-DD/`

## Notes
- The script is read-only (no DDL/DML).
- Each SQL file produces a single result set, exported as CSV.
- If you only need one probe, run:

```
psql -X -v ON_ERROR_STOP=1 "$DATABASE_URL" \
  -c "\\copy ( $(cat docs/version6/hardening/_global/sql/20_RLS_COVERAGE.sql) ) TO 'docs/version6/hardening/_global/evidence/YYYY-MM-DD/20_RLS_COVERAGE.csv' WITH CSV HEADER"
```
