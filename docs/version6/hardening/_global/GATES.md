# Global Gates (v2)

PASS rule: each gate query returns **0 rows**. Any rows are actionable failures.

## Gate catalog

| Gate ID | Description | PASS rule | SQL file(s) |
| --- | --- | --- | --- |
| G0 | Context captured | 1 row in context output | `sql/00_CONTEXT.sql` |
| G1 | Schema CREATE not granted to PUBLIC/anon/auth | 0 rows | `sql/90_GATES_SUMMARY.sql` (G1) |
| G2 | No PUBLIC/anon DML on app tables | 0 rows | `sql/90_GATES_SUMMARY.sql` (G2) |
| G3 | No PUBLIC EXECUTE on non-allowlisted RPCs | 0 rows | `sql/50_RPC_POSTURE_GATES.sql` |
| G4 | No anon EXECUTE on non-allowlisted RPCs | 0 rows | `sql/50_RPC_POSTURE_GATES.sql` |
| G5 | Public views must be security_invoker or not granted | 0 rows | `sql/60_VIEW_SECURITY_POSTURE.sql` + `sql/90_GATES_SUMMARY.sql` |
| G6 | RLS enabled on exposed tables | 0 rows | `sql/20_RLS_COVERAGE.sql` |
| G7 | RLS enabled tables must have policies | 0 rows | `sql/20_RLS_COVERAGE.sql` |
| G8 | SECURITY DEFINER functions must pin search_path | 0 rows | `sql/50_RPC_POSTURE_GATES.sql` |

## PASS/FAIL tracking template

| Date | Gate ID | Status | Evidence CSV | Notes |
| --- | --- | --- | --- | --- |
| YYYY-MM-DD | G1 | PASS/FAIL | `evidence/YYYY-MM-DD/90_GATES_SUMMARY.csv` | |
