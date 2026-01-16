#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <DATABASE_URL> <YYYY-MM-DD>" >&2
  exit 1
fi

DATABASE_URL="$1"
DATE="$2"
ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$ROOT_DIR" ]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  ROOT_DIR="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"
fi
BASE_DIR="$ROOT_DIR/docs/version6/hardening/_global"
SQL_DIR="$BASE_DIR/sql"
OUT_DIR="$BASE_DIR/evidence/$DATE"

mkdir -p "$OUT_DIR"

CONFIG_PATH="$ROOT_DIR/supabase/config.toml"
EXPOSED_SCHEMAS=""
EXTRA_SEARCH_PATH=""

if [ -f "$CONFIG_PATH" ]; then
  parsed="$(python - "$CONFIG_PATH" <<'PY'
import sys
try:
    import tomllib  # py3.11+
except Exception:  # pragma: no cover
    import tomli as tomllib  # fallback if installed

path = sys.argv[1]
with open(path, "rb") as f:
    d = tomllib.load(f)

api = d.get("api", {}) or {}
schemas = api.get("schemas", []) or []
extra = api.get("extra_search_path", []) or []

print(",".join([str(x) for x in schemas if x]))
print(",".join([str(x) for x in extra if x]))
PY
)"
  IFS=$'\n' read -r EXPOSED_SCHEMAS EXTRA_SEARCH_PATH <<< "$parsed"
fi

PGRST_DB_SCHEMAS="$(psql -X -v ON_ERROR_STOP=1 -At "$DATABASE_URL" -c \
  "select coalesce(nullif(current_setting('pgrst.db_schemas', true), ''), '')")"

if [ -z "$PGRST_DB_SCHEMAS" ] && [ -z "$EXPOSED_SCHEMAS" ]; then
  echo "No exposed schemas found (pg_settings pgrst.db_schemas empty and supabase/config.toml [api].schemas missing)." >&2
  exit 1
fi

probes=(
  "00_CONTEXT.sql"
  "10_GRANTS_SNAPSHOT.sql"
  "20_RLS_COVERAGE.sql"
  "30_RLS_POLICIES.sql"
  "63_RLS_DISABLED_EXPOSED_RECHECK.sql"
  "64_RLS_ENABLED_NO_POLICIES_RECHECK.sql"
  "40_RPC_REGISTRY.sql"
  "41_EXPOSED_SCHEMAS.sql"
  "42_RPC_CALLABILITY.sql"
  "43_RPC_DYNAMIC_SQL_FLAGS.sql"
  "44_RPC_CATALOG_DEPENDENCIES.sql"
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
  psql -X -v ON_ERROR_STOP=1 --csv \
    -v EXPOSED_SCHEMAS="$EXPOSED_SCHEMAS" \
    -v EXTRA_SEARCH_PATH="$EXTRA_SEARCH_PATH" \
    -f "$sql_path" "$DATABASE_URL" > "$out_path"
done

echo "Done. Evidence written to $OUT_DIR"
