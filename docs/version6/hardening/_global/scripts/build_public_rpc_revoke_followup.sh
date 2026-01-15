#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <DATABASE_URL>" >&2
  exit 1
fi

DATABASE_URL="$1"

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SQL_PATH="$ROOT_DIR/docs/version6/hardening/_global/sql/56_RPC_PUBLIC_EXECUTE_RECHECK.sql"

NEXT_ID="$(ROOT_DIR="$ROOT_DIR" python3 - <<'PY'
import re
from pathlib import Path
import os

max_id = 0
root_dir = os.environ.get('ROOT_DIR', '.')
for path in Path(root_dir, 'supabase/migrations').iterdir():
    if not path.name.endswith('.sql'):
        continue
    m = re.match(r'^(\\d+)_', path.name)
    if not m:
        continue
    prefix = m.group(1)
    if len(prefix) > 4:
        continue
    max_id = max(max_id, int(prefix))
print(max_id + 1)
PY
)"

OUT_PATH="$ROOT_DIR/supabase/migrations/${NEXT_ID}_global_revoke_public_anon_rpc_execute_followup.sql"

rows="$(psql -X -v ON_ERROR_STOP=1 -At -F '|' "$DATABASE_URL" <<SQL
$(cat "$SQL_PATH")
SQL
)"

{
  echo "-- ${NEXT_ID}_global_revoke_public_anon_rpc_execute_followup.sql"
  echo "-- Source: 56_RPC_PUBLIC_EXECUTE_RECHECK.sql output (post-allowlist)"
  echo "-- Purpose: revoke PUBLIC/anon EXECUTE for remaining non-allowlisted functions"
  echo
  echo "BEGIN;"
  echo
  if [ -n "$rows" ]; then
    printf "%s\n" "$rows" \
      | awk -F'|' 'NF>=3 {print $1 "|" $2 "|" $3}' \
      | LC_ALL=C sort -t'|' -k1,1 -k2,2 -k3,3 \
      | awk -F'|' '!seen[$1 FS $2 FS $3]++ {print $0}' \
      | while IFS='|' read -r schema_name function_name identity_args; do
          if [ -z "$identity_args" ]; then
            sig="()"
          else
            sig="($identity_args)"
          fi
          echo "REVOKE EXECUTE ON FUNCTION ${schema_name}.${function_name}${sig} FROM PUBLIC;"
          echo "REVOKE EXECUTE ON FUNCTION ${schema_name}.${function_name}${sig} FROM anon;"
          echo
        done
  fi
  echo "COMMIT;"
  echo
} > "$OUT_PATH"

echo "Wrote $OUT_PATH"
