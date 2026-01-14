# Evidence Index

| Evidence ID | Type (HAR/SQL/Shot) | Persona | Scenario | File path | Notes |
| --- | --- | --- | --- | --- | --- |
| AUM-ANON-ROUTE-DENY-HAR | HAR | Anon | Visit `/admin/users/:userId/moderation` and confirm redirect to `/auth` | `docs/version5/hardening/surfaces/admin-user-moderation/evidence/har/AUM-ANON-ROUTE-DENY.har` | Capture 302/redirect chain + toast. |
| AUM-ANON-ROUTE-DENY-SHOT | Shot | Anon | Auth redirect screen | `docs/version5/hardening/surfaces/admin-user-moderation/evidence/screenshots/AUM-ANON-ROUTE-DENY.png` | Include URL bar + toast. |
| AUM-NORMAL-DENY-HAR | HAR | Normal | Authenticated non-admin blocked from moderation page | `docs/version5/hardening/surfaces/admin-user-moderation/evidence/har/AUM-NORMAL-DENY.har` | Expect redirect to `/feed` + toast. |
| AUM-NORMAL-DENY-SHOT | Shot | Normal | Post-redirect screen + toast | `docs/version5/hardening/surfaces/admin-user-moderation/evidence/screenshots/AUM-NORMAL-DENY.png` | Capture toast text. |
| AUM-OWNER-DENY-HAR | HAR | Owner | Owner blocked from moderation page | `docs/version5/hardening/surfaces/admin-user-moderation/evidence/har/AUM-OWNER-DENY.har` | Expect redirect to `/feed`. |
| AUM-OWNER-DENY-SHOT | Shot | Owner | Post-redirect screen + toast | `docs/version5/hardening/surfaces/admin-user-moderation/evidence/screenshots/AUM-OWNER-DENY.png` | Capture toast text. |
| AUM-PRIVATE-DENY-HAR | HAR | Private | Private persona blocked from moderation page | `docs/version5/hardening/surfaces/admin-user-moderation/evidence/har/AUM-PRIVATE-DENY.har` | Expect redirect to `/feed`. |
| AUM-PRIVATE-DENY-SHOT | Shot | Private | Post-redirect screen + toast | `docs/version5/hardening/surfaces/admin-user-moderation/evidence/screenshots/AUM-PRIVATE-DENY.png` | Capture toast text. |
| AUM-BLOCKED-DENY-HAR | HAR | Blocked | Blocked persona blocked from moderation page | `docs/version5/hardening/surfaces/admin-user-moderation/evidence/har/AUM-BLOCKED-DENY.har` | Expect redirect to `/feed`. |
| AUM-BLOCKED-DENY-SHOT | Shot | Blocked | Post-redirect screen + toast | `docs/version5/hardening/surfaces/admin-user-moderation/evidence/screenshots/AUM-BLOCKED-DENY.png` | Capture toast text. |
| AUM-ADMIN-ALLOW-HAR | HAR | Admin | Admin loads moderation page | `docs/version5/hardening/surfaces/admin-user-moderation/evidence/har/AUM-ADMIN-ALLOW.har` | Should include profile + warnings + `admin_list_moderation_log` RPC. |
| AUM-ADMIN-ALLOW-SHOT | Shot | Admin | Moderation page loaded | `docs/version5/hardening/surfaces/admin-user-moderation/evidence/screenshots/AUM-ADMIN-ALLOW.png` | Show status + warnings + history. |
| AUM-RPC-NONADMIN-DENY-LOG-HAR | HAR | Normal | Call `admin_list_moderation_log` as non-admin | `docs/version5/hardening/surfaces/admin-user-moderation/evidence/har/AUM-RPC-NONADMIN-DENY-LOG.har` | Expect error "Admin privileges required". |
| AUM-RPC-NONADMIN-DENY-LOG-SHOT | Shot | Normal | RPC error surfaced in UI/console | `docs/version5/hardening/surfaces/admin-user-moderation/evidence/screenshots/AUM-RPC-NONADMIN-DENY-LOG.png` | Capture error text. |
| AUM-RPC-NONADMIN-DENY-WARN-HAR | HAR | Normal | Trigger warn/suspend/ban action to call `admin_warn_user` as non-admin | `docs/version5/hardening/surfaces/admin-user-moderation/evidence/har/AUM-RPC-NONADMIN-DENY-WARN.har` | Expect error "Admin privileges required". |
| AUM-RPC-NONADMIN-DENY-WARN-SHOT | Shot | Normal | RPC error surfaced in UI/console | `docs/version5/hardening/surfaces/admin-user-moderation/evidence/screenshots/AUM-RPC-NONADMIN-DENY-WARN.png` | Capture error text. |
| AUM-RPC-NONADMIN-DENY-CLEAR-HAR | HAR | Normal | Trigger lift restrictions action to call `admin_clear_moderation_status` as non-admin | `docs/version5/hardening/surfaces/admin-user-moderation/evidence/har/AUM-RPC-NONADMIN-DENY-CLEAR.har` | Expect error "Admin privileges required". |
| AUM-RPC-NONADMIN-DENY-CLEAR-SHOT | Shot | Normal | RPC error surfaced in UI/console | `docs/version5/hardening/surfaces/admin-user-moderation/evidence/screenshots/AUM-RPC-NONADMIN-DENY-CLEAR.png` | Capture error text. |
| AUM-SQL-GRANTS | SQL | Admin | Grants on touched tables | `docs/version5/hardening/surfaces/admin-user-moderation/evidence/sql/AUM-GRANTS.sql` | `admin_users, profiles, user_warnings, moderation_log, notifications`. |
| AUM-SQL-RLS-POLICIES | SQL | Admin | RLS policies for touched tables | `docs/version5/hardening/surfaces/admin-user-moderation/evidence/sql/AUM-RLS-POLICIES.sql` | Include `profiles_select_all`, `user_warnings_admin_read`, `moderation_log_admin_read`, `admin_users_self_select`. |
| AUM-SQL-RPC-GRANTS | SQL | Admin | EXECUTE grants + definitions for admin RPCs | `docs/version5/hardening/surfaces/admin-user-moderation/evidence/sql/AUM-RPC-GRANTS.sql` | Include `admin_list_moderation_log`, `admin_warn_user`, `admin_clear_moderation_status`. |
| AUM-SQL-NONADMIN-DIRECT-SELECT | SQL | Normal | Direct SELECT on moderation tables as non-admin | `docs/version5/hardening/surfaces/admin-user-moderation/evidence/sql/AUM-NONADMIN-SELECT.sql` | Probe `user_warnings` + `moderation_log` + `admin_users`. Expect RLS deny/0 rows. |
