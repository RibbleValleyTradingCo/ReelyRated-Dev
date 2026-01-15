Note: Raw evidence is stored locally under `_local_evidence/` and is not committed.
References here are pointers only.

# Evidence Index

| Evidence ID | Type (HAR/SQL/Shot) | Persona | Scenario | File path | Notes |
| --- | --- | --- | --- | --- | --- |
| AA-ANON-ROUTE-DENY-HAR | HAR | Anon | Visit `/admin/audit-log` and confirm redirect to `/auth` | `docs/version5/hardening/surfaces/admin-audit-log/evidence/har/AA-ANON-ROUTE-DENY.har` | Capture 302/redirect chain + toast. |
| AA-ANON-ROUTE-DENY-SHOT | Shot | Anon | Auth redirect screen | `docs/version5/hardening/surfaces/admin-audit-log/evidence/screenshots/AA-ANON-ROUTE-DENY.png` | Include URL bar + toast. |
| AA-NONADMIN-DENY-HAR | HAR | Normal | Authenticated non-admin blocked from audit log | `docs/version5/hardening/surfaces/admin-audit-log/evidence/har/AA-NONADMIN-DENY.har` | Expect redirect to `/feed` + toast. |
| AA-NONADMIN-DENY-SHOT | Shot | Normal | Post-redirect screen + toast | `docs/version5/hardening/surfaces/admin-audit-log/evidence/screenshots/AA-NONADMIN-DENY.png` | Capture toast text. |
| AA-OWNER-DENY-HAR | HAR | Owner | Owner blocked from audit log | `docs/version5/hardening/surfaces/admin-audit-log/evidence/har/AA-OWNER-DENY.har` | Expect redirect to `/feed`. |
| AA-OWNER-DENY-SHOT | Shot | Owner | Post-redirect screen + toast | `docs/version5/hardening/surfaces/admin-audit-log/evidence/screenshots/AA-OWNER-DENY.png` | Capture toast text. |
| AA-ADMIN-ALLOW-HAR | HAR | Admin | Admin loads audit log | `docs/version5/hardening/surfaces/admin-audit-log/evidence/har/AA-ADMIN-ALLOW.har` | Should include RPC + realtime subscribe. |
| AA-ADMIN-ALLOW-SHOT | Shot | Admin | Audit log table loaded | `docs/version5/hardening/surfaces/admin-audit-log/evidence/screenshots/AA-ADMIN-ALLOW.png` | Show filters + table. |
| AA-RPC-NONADMIN-DENY-HAR | HAR | Normal | Call `admin_list_moderation_log` as non-admin | `docs/version5/hardening/surfaces/admin-audit-log/evidence/har/AA-RPC-NONADMIN-DENY.har` | Expect error “Admin privileges required”. |
| AA-RPC-NONADMIN-DENY-SHOT | Shot | Normal | RPC error surfaced in UI/console | `docs/version5/hardening/surfaces/admin-audit-log/evidence/screenshots/AA-RPC-NONADMIN-DENY.png` | Capture error text. |
| AA-SQL-GRANTS | SQL | Admin | Grants on touched tables | `docs/version5/hardening/surfaces/admin-audit-log/evidence/sql/AA-GRANTS.sql` | `admin_users, moderation_log, profiles, catch_comments`. |
| AA-SQL-RLS-POLICIES | SQL | Admin | RLS policies for touched tables | `docs/version5/hardening/surfaces/admin-audit-log/evidence/sql/AA-RLS-POLICIES.sql` | Include `moderation_log_admin_read`, `profiles_select_all`, `catch_comments_public_read`. |
| AA-SQL-RPC-GRANTS | SQL | Admin | EXECUTE grants + definition for RPC | `docs/version5/hardening/surfaces/admin-audit-log/evidence/sql/AA-RPC-GRANTS.sql` | `admin_list_moderation_log` (SECURITY DEFINER). |
| AA-SQL-NONADMIN-DIRECT-SELECT | SQL | Normal | Direct SELECT on `moderation_log` as non-admin | `docs/version5/hardening/surfaces/admin-audit-log/evidence/sql/AA-NONADMIN-SELECT.sql` | Expect 0 rows or RLS error. |
