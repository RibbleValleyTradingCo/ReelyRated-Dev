#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <DATABASE_URL> <YYYY-MM-DD>" >&2
  exit 1
fi

DATABASE_URL="$1"
DATE="$2"
BASE_DIR="docs/version6/hardening/_global"
SQL_DIR="$BASE_DIR/sql"
OUT_DIR="$BASE_DIR/evidence/$DATE"

mkdir -p "$OUT_DIR"

probes=(
  "00_CONTEXT.sql"
  "10_GRANTS_SNAPSHOT.sql"
  "20_RLS_COVERAGE.sql"
  "30_RLS_POLICIES.sql"
  "63_RLS_DISABLED_EXPOSED_RECHECK.sql"
  "64_RLS_ENABLED_NO_POLICIES_RECHECK.sql"
  "40_RPC_REGISTRY.sql"
  "45_RPC_DEPENDENCIES.sql"
  "50_RPC_POSTURE_GATES.sql"
  "55_RPC_SCOPING_WORKSHEET.sql"
  "56_RPC_PUBLIC_EXECUTE_RECHECK.sql"
  "60_VIEW_SECURITY_POSTURE.sql"
  "61_VIEW_PUBLIC_GRANTS_RECHECK.sql"
  "62_PUBLIC_ANON_DML_RECHECK.sql"
  "65_POLICY_LINTS_ADVISOR_RECHECK.sql"
  "66_UID_INITPLAN_CANDIDATES.sql"
  "70_STORAGE_POSTURE.sql"
  "80_REALTIME_POSTURE.sql"
  "90_GATES_SUMMARY.sql"
)

for probe in "${probes[@]}"; do
  sql_path="$SQL_DIR/$probe"
  out_path="$OUT_DIR/${probe%.sql}.csv"
  echo "Running $probe -> $out_path"
  psql -X -v ON_ERROR_STOP=1 "$DATABASE_URL" <<SQL
\\copy (\
$(cat "$sql_path")
) TO '$out_path' WITH CSV HEADER
SQL
done

echo "Done. Evidence written to $OUT_DIR"
