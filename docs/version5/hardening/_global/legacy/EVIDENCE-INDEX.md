> ⚠️ LEGACY (archived 2026-01-13)
> This file is the v1 global hardening attempt preserved for audit/history.
> Current work lives in: docs/version5/hardening/_global/v2/ (see _global/README.md).
> Do not update posture here unless you are explicitly updating legacy history notes.

# Evidence Index

| Evidence ID | Type (SQL/Doc) | Scope | Scenario | File path | Notes |
| --- | --- | --- | --- | --- | --- |
| GLOBAL-GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-TOTAL | SQL | Global | GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS total (POST-P0) | `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-TOTAL_2026-01-12.csv` | total_redflags: 1238; rows: 1; date: 2026-01-12; supports P0 checks A–D (aggregated) |
| GLOBAL-GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-GROUPED | SQL | Global | GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS grouped (POST-P0) | `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-GROUPED_2026-01-12.csv` | rows: 10; date: 2026-01-12; supports P0 checks A–D (aggregated) |
| GLOBAL-GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS-TOTAL | SQL | Global | GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS total (POST-P0) | `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS-TOTAL_2026-01-12.csv` | total_redflags: 383; rows: 1; date: 2026-01-12 |
| GLOBAL-GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS-GROUPED | SQL | Global | GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS grouped (POST-P0) | `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS-GROUPED_2026-01-12.csv` | rows: 55; date: 2026-01-12 |
| GLOBAL-GRANTS-REDFLAGS-PUBLIC-ONLY-CSV | SQL | Global | GRANTS-REDFLAGS-PUBLIC-ONLY output (row-level, POST-P0) | `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PUBLIC-ONLY_2026-01-12.csv` | rows: 1238; date: 2026-01-12; used for P0 checks A–D |
| GLOBAL-GRANTS-REDFLAGS-PLATFORM-MANAGED-CSV | SQL | Global | GRANTS-REDFLAGS-PLATFORM-MANAGED output (row-level, POST-P0) | `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PLATFORM-MANAGED_2026-01-12.csv` | rows: 383; date: 2026-01-12 |
| GLOBAL-GRANTS-REDFLAGS-LIVE-POST-P0 | SQL | Global | GRANTS-REDFLAGS-LIVE output (row-level, POST-P0) | `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-LIVE_2026-01-12.csv` | rows: 1621; date: 2026-01-12 |
| GLOBAL-GRANTS-LIVE-POST-P0 | SQL | Global | GRANTS-LIVE output (row-level, POST-P0) | `docs/version5/hardening/_global/legacy/evidence/GRANTS-LIVE_2026-01-12.csv` | rows: 4680; date: 2026-01-12; used for P0 checks C (MAINTAIN) and E |
| GLOBAL-GRANTS-SUMMARY-LIVE-POST-P0 | SQL | Global | GRANTS-SUMMARY-LIVE output (POST-P0) | `docs/version5/hardening/_global/legacy/evidence/GRANTS-SUMMARY-LIVE_2026-01-12.csv` | rows: 186; date: 2026-01-12 |
| GLOBAL-GRANTS-DEFAULT-PRIVS-LIVE-POST-P0 | SQL | Global | GRANTS-DEFAULT-PRIVS-LIVE output (POST-P0) | `docs/version5/hardening/_global/legacy/evidence/GRANTS-DEFAULT-PRIVS-LIVE_2026-01-12.csv` | rows: 27; date: 2026-01-12; used for P0 check F |
| GLOBAL-RLS-COVERAGE-LIVE-POST-P0 | SQL | Global | RLS-COVERAGE-LIVE output (POST-P0) | `docs/version5/hardening/_global/legacy/evidence/RLS-COVERAGE-LIVE_2026-01-12.csv` | rows: 153; date: 2026-01-12 |
| GLOBAL-RLS-POLICIES-LIVE-POST-P0 | SQL | Global | RLS-POLICIES-LIVE output (POST-P0) | `docs/version5/hardening/_global/legacy/evidence/RLS-POLICIES-LIVE_2026-01-12.csv` | rows: 86; date: 2026-01-12 |
| GLOBAL-RPC-REGISTRY-LIVE-POST-P0 | SQL | Global | RPC-REGISTRY-LIVE output (POST-P0) | `docs/version5/hardening/_global/legacy/evidence/RPC-REGISTRY-LIVE_2026-01-12.csv` | rows: 834; date: 2026-01-12 |
| GLOBAL-RPC-POSTURE-LIVE-POST-P0 | SQL | Global | RPC-POSTURE-LIVE output (POST-P0) | `docs/version5/hardening/_global/legacy/evidence/RPC-POSTURE-LIVE_2026-01-12.csv` | rows: 106; date: 2026-01-12 |
| GLOBAL-GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-TOTAL-POST-P1 | SQL | Global | GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS total (POST-P1) | `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-TOTAL_2026-01-12_P1.csv` | total_redflags: 757; rows: 1; date: 2026-01-12 |
| GLOBAL-GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-GROUPED-POST-P1 | SQL | Global | GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS grouped (POST-P1) | `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PUBLIC-ONLY-COUNTS-GROUPED_2026-01-12_P1.csv` | rows: 10; date: 2026-01-12 |
| GLOBAL-GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS-TOTAL-POST-P1 | SQL | Global | GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS total (POST-P1) | `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS-TOTAL_2026-01-12_P1.csv` | total_redflags: 383; rows: 1; date: 2026-01-12 |
| GLOBAL-GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS-GROUPED-POST-P1 | SQL | Global | GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS grouped (POST-P1) | `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PLATFORM-MANAGED-COUNTS-GROUPED_2026-01-12_P1.csv` | rows: 55; date: 2026-01-12 |
| GLOBAL-GRANTS-REDFLAGS-PUBLIC-ONLY-CSV-POST-P1 | SQL | Global | GRANTS-REDFLAGS-PUBLIC-ONLY output (row-level, POST-P1) | `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PUBLIC-ONLY_2026-01-12_P1.csv` | rows: 757; date: 2026-01-12 |
| GLOBAL-GRANTS-REDFLAGS-PLATFORM-MANAGED-CSV-POST-P1 | SQL | Global | GRANTS-REDFLAGS-PLATFORM-MANAGED output (row-level, POST-P1) | `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-PLATFORM-MANAGED_2026-01-12_P1.csv` | rows: 383; date: 2026-01-12 |
| GLOBAL-GRANTS-REDFLAGS-LIVE-POST-P1 | SQL | Global | GRANTS-REDFLAGS-LIVE output (row-level, POST-P1) | `docs/version5/hardening/_global/legacy/evidence/GRANTS-REDFLAGS-LIVE_2026-01-12_P1.csv` | rows: 1140; date: 2026-01-12 |
| GLOBAL-GRANTS-LIVE-POST-P1 | SQL | Global | GRANTS-LIVE output (row-level, POST-P1) | `docs/version5/hardening/_global/legacy/evidence/GRANTS-LIVE_2026-01-12_P1.csv` | rows: 4199; date: 2026-01-12 |
| GLOBAL-GRANTS-SUMMARY-LIVE-POST-P1 | SQL | Global | GRANTS-SUMMARY-LIVE output (POST-P1) | `docs/version5/hardening/_global/legacy/evidence/GRANTS-SUMMARY-LIVE_2026-01-12_P1.csv` | rows: 186; date: 2026-01-12 |
| GLOBAL-GRANTS-DEFAULT-PRIVS-LIVE-POST-P1 | SQL | Global | GRANTS-DEFAULT-PRIVS-LIVE output (POST-P1) | `docs/version5/hardening/_global/legacy/evidence/GRANTS-DEFAULT-PRIVS-LIVE_2026-01-12_P1.csv` | rows: 27; date: 2026-01-12 |
| GLOBAL-RLS-COVERAGE-LIVE-POST-P1 | SQL | Global | RLS-COVERAGE-LIVE output (POST-P1) | `docs/version5/hardening/_global/legacy/evidence/RLS-COVERAGE-LIVE_2026-01-12_P1.csv` | rows: 153; date: 2026-01-12 |
| GLOBAL-RLS-POLICIES-LIVE-POST-P1 | SQL | Global | RLS-POLICIES-LIVE output (POST-P1) | `docs/version5/hardening/_global/legacy/evidence/RLS-POLICIES-LIVE_2026-01-12_P1.csv` | rows: 86; date: 2026-01-12 |
| GLOBAL-RPC-REGISTRY-LIVE-POST-P1 | SQL | Global | RPC-REGISTRY-LIVE output (POST-P1) | `docs/version5/hardening/_global/legacy/evidence/RPC-REGISTRY-LIVE_2026-01-12_P1.csv` | rows: 834; date: 2026-01-12 |
| GLOBAL-RPC-POSTURE-LIVE-POST-P1 | SQL | Global | RPC-POSTURE-LIVE output (POST-P1) | `docs/version5/hardening/_global/legacy/evidence/RPC-POSTURE-LIVE_2026-01-12_P1.csv` | rows: 106; date: 2026-01-12 |
