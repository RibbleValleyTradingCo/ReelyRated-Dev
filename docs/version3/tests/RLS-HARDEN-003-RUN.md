# RLS-HARDEN-003 – Runbook (notifications, reports, warnings, moderation)

Use this checklist to validate RLS and admin-only RPCs for notifications, reports, user warnings, and moderation logs. Mirrors the viewer matrix (A, B, C, D, Admin, Anon) used in RLS-HARDEN-001/002.

## Actors (stable UUIDs)

- **A (owner)** – `aa35e9b8-9826-4e45-a5b0-cec5d3bd6f3a`
- **B (follower)** – `8fdb5a09-18b1-4f40-babe-a96959c3ee04`
- **C (stranger)** – `dc976a2a-03fe-465a-be06-0fa1038c95cf`
- **D (blocked)** – `8641225a-8917-435e-95f2-bb4356cd44d0`
- **Admin** – `d38c5e8d-7dc6-42f0-b541-906e793f2e20` (in `admin_users`)

## Impersonation helper (SQL editor)

Run **as one batch** so `auth.uid()` persists:

```sql
BEGIN;
  SET LOCAL ROLE authenticated;
  SELECT set_config('request.jwt.claim.sub', '<viewer-uuid>', true);
  SELECT set_config('request.jwt.claim.role', 'authenticated', true);

  -- Sanity
  SELECT auth.uid() AS uid, current_user;

  -- ...place scenario queries here...
ROLLBACK;
```

For **admin**, set `request.jwt.claim.role` to `service_role` or ensure the user is present in `public.admin_users`. For **anon**, use `SET LOCAL ROLE anon;` and skip the claim config.

## Core snippets

- Notifications (recipient-only):
  ```sql
  SELECT id, user_id, type, message
  FROM public.notifications
  WHERE user_id = '<viewer-uuid>';

  -- Cross-user probe (should return 0 rows or permission denied)
  SELECT id FROM public.notifications WHERE user_id = '<someone-else>';
  ```

- Reports (reporter-only, admin via RPC):
  ```sql
  -- Table read as reporter/non-reporter
  SELECT id, reporter_id, target_type, status
  FROM public.reports;

  -- Admin list via RPC (should return rows)
  SELECT * FROM public.admin_list_reports(NULL, NULL, NULL, NULL, NULL, 'desc', 10, 0);
  ```

- User warnings (admin-only select):
  ```sql
  SELECT id, user_id, severity, reason, admin_id
  FROM public.user_warnings;
  ```

- Moderation log (admin-only select):
  ```sql
  SELECT id, action, target_type, target_id, admin_id
  FROM public.moderation_log;
  ```

- Admin RPC: warn user (admin only, logs warning + moderation_log + notification):
  ```sql
  SELECT public.admin_warn_user(
    p_user_id := '8fdb5a09-18b1-4f40-babe-a96959c3ee04', -- B
    p_reason := 'rls-harden-003 test warning',
    p_severity := 'warning',
    p_duration_hours := NULL
  );
  ```

## Scenarios (per actor)

1) **Notifications visibility**
   - As A/B/C/D: `SELECT ... FROM notifications WHERE user_id = '<self>'` returns only own rows.
   - Cross-user `SELECT ... WHERE user_id = '<other>'` returns 0 rows (or permission denied).
   - Admin: notifications table still recipient-only (expected), but admin can see warning/report context via admin RPCs instead.

2) **Reports table vs admin RPC**
   - As B (reporter with known rows): table SELECT returns only B’s reports; C/D see 0 rows.
   - Admin: table SELECT likely 0/denied (reporter-only policy); **admin_list_reports** RPC returns all.
   - Insert path covered in REPORTS-003; here focus on read isolation.

3) **User warnings**
   - As B/C/D: `SELECT ... FROM user_warnings` returns 0 rows/permission denied.
   - Admin: can SELECT warnings; after issuing a warning via `admin_warn_user`, row appears with `user_id = B`, `admin_id = Admin`.

4) **Moderation log**
   - As A/B/C/D: `SELECT ... FROM moderation_log` returns 0 rows/permission denied.
   - Admin: can SELECT; warning action above should add a `warn_user` entry referencing B.

5) **Admin-only RPC guards**
   - As Admin: `admin_warn_user` succeeds; `admin_list_reports` returns data; `admin_list_moderation_log` (optional) returns data.
   - As B/C/D: calling any admin RPC should raise `Admin privileges required` / permission denied; no rows written to warnings/moderation_log.

## Matrix (expected outcomes)

| Actor  | notifications (own) | notifications (others) | reports table | admin_list_reports | user_warnings table | moderation_log table | admin RPCs |
| ------ | ------------------- | ---------------------- | ------------- | ------------------ | ------------------- | -------------------- | ---------- |
| A      | Allow self          | Deny/0                 | Own only/0    | N/A (not admin)    | Deny/0              | Deny/0               | Deny       |
| B      | Allow self          | Deny/0                 | Own only      | N/A                | Deny/0              | Deny/0               | Deny       |
| C      | Allow self          | Deny/0                 | 0             | N/A                | Deny/0              | Deny/0               | Deny       |
| D      | Allow self          | Deny/0                 | 0             | N/A                | Deny/0              | Deny/0               | Deny       |
| Admin  | Allow self (recipient) | Deny/0 (by design)  | 0/denied (policy is reporter-only) | **Allow** (via RPC) | **Allow** | **Allow** | **Allow** |
| Anon   | Deny/0              | Deny/0                 | Deny/0        | N/A                | Deny/0              | Deny/0               | Deny       |

Record any deviation:
- If non-admin can read `user_warnings` or `moderation_log` → RLS gap.
- If non-admin can call admin RPCs → add admin guard.
- If admin cannot read warnings/moderation_log → add admin SELECT policies or fix RPC grants.
