# Followups

- [ ] **Deny/allow UX parity:** Confirm redirects + toast copy for Anon vs Auth non-admin match the intended contract (record exact target route: `/` (home) vs `/feed`).
- [ ] **RPC posture proof:** Capture `pg_get_functiondef(public.admin_get_venues(text,int,int))`, `prosecdef`, and `proconfig` (search_path). Confirm:
  - it performs an internal admin check (e.g., `is_admin(auth.uid())`) and fails closed for non-admins.
  - pagination is bounded (limit/offset clamped) and ordering is deterministic.
- [ ] **EXECUTE grants vs behavior:** Capture `proacl` for `admin_get_venues` and prove non-admin execution still fails (save exact error text).
- [ ] **Payload scope:** Verify the RPC return shape contains only fields required for the admin list (no internal notes / hidden moderation fields / unintended joins).
- [ ] **Underlying relations are not client-readable:** As non-admin, probe direct PostgREST / direct SQL reads for `venues` and `venue_stats` and confirm deny/0 rows (document any rows/columns returned).
- [ ] **`venue_stats` footgun check (views/RLS):** Determine what `venue_stats` is and capture posture:
  - `pg_class.relkind`, owner, and `reloptions`.
  - If it is a **view/materialized view**, confirm whether it uses `security_invoker=true` (Postgres 15+) or otherwise cannot bypass underlying RLS. (Views can bypass RLS by default if owned by a privileged role.)
