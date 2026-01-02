# Verification Log — /admin/venues

This log captures _evidence_ for the `/admin/venues` hardening/verification pass.

Do not mark items as DONE unless evidence is attached (HAR/screenshots/SQL output notes).

**Linked audit doc:** [admin-venues.md](./admin-venues.md)

---

## Run metadata

- Date: 2026-01-02
- Environment: local
- Branch / commit:
- Tester: James
- Browser + version: Chrome (desktop)
- Device(s): desktop
- Notes:
  - Admin, non-admin, and anonymous HARs captured and attached (see Evidence index). Network gating verified ✅.
  - Non-admin (authenticated) run: visiting `/admin/venues` redirects to `/index` in the UI. HAR shows repeated `rest/v1/admin_users?select=user_id&user_id=eq.<NON_ADMIN_ID>` calls returning `[]` (200) and **no** calls to `rest/v1/rpc/get_venues`.
  - Anonymous run: cleared site data and visited `/admin/venues` while signed out; redirected to `/index` observed in UI. HAR shows no Supabase calls (`rest/v1/*` or `auth/v1/*`) and no `rpc/get_venues` payload.

---

## Personas under test

- Admin:
  - user id / email:
- Non-admin (authenticated):
  - user id / email:
- Anonymous:
  - (signed out)

---

## Evidence index (files)

### HAR exports

- Admin: `admin-venues-admin-2026-01-02.har`
- Non-admin: `admin-venues-non-admin-non-user-2026-01-02.har`
- Anonymous: `admin-venues-anon-2026-01-02.har`

### Screenshots (filenames)

- Network list filtered to `admin_users` + `rpc/get_venues` (per persona):
- Response preview for `rest/v1/admin_users` (per persona):
- Response preview for `rest/v1/rpc/get_venues` (per persona):
- UI states:
  - Admin venues list visible:
  - Non-admin redirect target visible in address bar (/index):
  - Anon redirect target visible in address bar (/index or /auth):

### SQL / RLS evidence (notes or saved output)

- RLS flags checked (2026-01-02):
  - `public.admin_users`: relrowsecurity = true / relforcerowsecurity = false
  - `public.venue_owners`: relrowsecurity = true / relforcerowsecurity = false
  - `public.venues`: relrowsecurity = true / relforcerowsecurity = true
- Policies listed (public):
  - `admin_users`: `admin_users_select_all` (SELECT, qual=true), `admin_users_self_select` (SELECT, qual=uid()=user_id)
  - `venue_owners`: `venue_owners_admin_all` (ALL, qual/admin gate), `venue_owners_self_select` (SELECT, qual=uid()=user_id)
  - `venues`: `venues_select_published`, `venues_select_owner`, `venues_select_admin_all`, plus update/insert policies
- RPC definition inspected:
  - `public.get_venues(p_search, p_limit, p_offset)` is a SQL function with `SET search_path TO 'public','extensions'`.
  - It selects from `public.venues` and left-joins `public.venue_stats`, with no explicit admin predicate.
  - Result rows are therefore controlled by **RLS on `public.venues`** (published/owner/admin).
- Anomalies / risks:
  - `admin_users_select_all` allows any role to SELECT all rows from `admin_users` (admin user list is publicly readable).
  - `get_venues` has EXECUTE granted to `PUBLIC` (and `anon`/`authenticated`), so non-admin/anon can call it directly; they will receive at least published venues due to `venues_select_published`.

---

## Verification checklist (per persona)

> Use ✅ PASS / ❌ FAIL / ⏳ PENDING and add short notes + evidence refs.

### 1) Network / data reads (HAR)

| Persona   | Expected request(s)                                                                                  | Observed                                                                                                                                                                          | Status  | Evidence                                         |
| --------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------ |
| Admin     | `rest/v1/admin_users?select=user_id&user_id=eq.<ADMIN_ID>` (200) then `rest/v1/rpc/get_venues` (200) | `admin_users` (200) returned admin row; `rpc/get_venues` (200) called with `{p_search:null,p_limit:20,p_offset:0}`. App-shell reads also present (profiles/notifications/auth).   | ✅ PASS | `admin-venues-admin-2026-01-02.har`              |
| Non-admin | `admin_users` returns `[]` or denied; `rpc/get_venues` must NOT return venue data                    | `admin_users (200) returned [] (no admin row). No rpc/get_venues call. Redirected to /index observed in UI (SPA redirect may not show as separate network doc request).`          | ✅ PASS | `admin-venues-non-admin-non-user-2026-01-02.har` |
| Anonymous | Redirect to `/auth` or `/index`; no successful admin payload or `get_venues` result                  | No Supabase calls observed (`rest/v1/*` or `auth/v1/*`); no rpc/get_venues call. Redirected to /index observed in UI (SPA redirect may not show as separate network doc request). | ✅ PASS | `admin-venues-anon-2026-01-02.har`               |

**Notes (network):**

- Expected endpoints for `/admin/venues` are `rest/v1/admin_users` (admin gate) and `rest/v1/rpc/get_venues` (listing). Additional app-shell reads (profiles/notifications/auth) are acceptable if RLS is correct.
- Go/No-Go: Non-admin must not receive a successful `get_venues` payload.
- Evidence captured: Admin/non-admin/anon HARs (see Evidence index). Add 2–3 UI screenshots (address bar + page state) to strengthen redirect evidence.

---

### 2) Data-layer authorization (RLS / OWASP)

#### Hypotheses

- H1: Anonymous cannot access `/admin/venues` UI and cannot fetch admin data.
- H2: Authenticated non-admin cannot read admin-only data (cannot pass admin gate; cannot call `get_venues` successfully).
- H3: Admin can read venues via an admin-safe pathway (RPC gated by admin status).

#### RLS enabled checks (introspection)

- `public.admin_users`: relrowsecurity = true / relforcerowsecurity = false
- `public.venues`: relrowsecurity = true / relforcerowsecurity = true
- `public.venue_owners`: relrowsecurity = true / relforcerowsecurity = false
- Note: `get_venues` also reads `public.venue_stats` (RLS status not yet recorded here).

#### Policies present

- `admin_users` SELECT policies:
  - `admin_users_select_all` (qual = true)
  - `admin_users_self_select` (qual = uid() = user_id)
- `venues` SELECT policies:
  - `venues_select_published` (qual = is_published = true)
  - `venues_select_owner` (qual = exists venue_owners for auth uid)
  - `venues_select_admin_all` (qual = exists admin_users for auth uid)

#### RPC definition sanity

- `get_venues` should enforce admin gate at the DB layer (e.g., is_admin check) and be safe against payload leakage.
- Confirm SECURITY DEFINER/search_path hardening if applicable.
- Current state: `get_venues` is **not** admin-only by itself (no admin WHERE clause) and is executable by `PUBLIC`; it relies on `venues` RLS to limit rows.

| Persona   | Expected                                                                     | Observed                                                                                                                                                                                 | Status     | Evidence                  |
| --------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------- |
| Admin     | Can pass admin gate; `get_venues` returns venue list (including unpublished) | `get_venues` has no explicit gate, but `venues_select_admin_all` allows admin to SELECT all venues; function will return all venue rows + stats for admins.                              | ⚠️ PARTIAL | SQL outputs A/B/C/D above |
| Non-admin | Should not be able to retrieve admin venue list via `get_venues`             | `get_venues` is executable by `PUBLIC`; non-admin can call it and will receive at least published venues via `venues_select_published` (and any owned venues via `venues_select_owner`). | ❌ FAIL    | SQL outputs A/B/C/D above |
| Anonymous | Should not be able to retrieve admin venue list via `get_venues`             | `get_venues` is executable by `PUBLIC`; anon can call it and will receive published venues via `venues_select_published`.                                                                | ❌ FAIL    | SQL outputs A/B/C/D above |

**Notes (authZ):**

- Access control must be enforced at the data layer (RLS/RPC), not just UI routing.
- If non-admin sees any venue rows via `get_venues`: **Go/No-Go FAIL** until fixed.
- Recommendation: split RPCs (e.g., `admin_get_venues` for admin UI; `public_get_venues` for public directory) OR add an explicit admin predicate inside `get_venues` and revoke EXECUTE from `PUBLIC`/`anon`.
- Recommendation: remove `admin_users_select_all` (keep only self-select and/or admin-only select) to avoid exposing the admin roster.

---

### 3) Dark mode contrast (manual)

| Area                        | Status | Notes | Evidence |
| --------------------------- | ------ | ----- | -------- |
| Page background / container | ⏳     |       |          |
| Table/list row contrast     | ⏳     |       |          |
| Primary + muted text        | ⏳     |       |          |
| Buttons/CTAs                | ⏳     |       |          |
| Focus ring visibility       | ⏳     |       |          |

---

### 4) Responsive / touch (manual)

| Scenario             | Status | Notes | Evidence |
| -------------------- | ------ | ----- | -------- |
| 360px portrait       | ⏳     |       |          |
| 390px portrait       | ⏳     |       |          |
| 414px portrait       | ⏳     |       |          |
| Landscape rotation   | ⏳     |       |          |
| No horizontal scroll | ⏳     |       |          |
| Tap targets usable   | ⏳     |       |          |

---

### 5) Accessibility (manual + light DOM inspection)

| Check                           | Status | Notes | Evidence |
| ------------------------------- | ------ | ----- | -------- |
| Exactly one H1 present          | ⏳     |       |          |
| Heading order sensible (H1→H2…) | ⏳     |       |          |
| Keyboard tab order sane         | ⏳     |       |          |
| Table/list semantics reasonable | ⏳     |       |          |

---

## Go / No-Go gates (for marking /admin/venues DONE)

- [x] Non-admin cannot access admin venue list (no successful `get_venues` payload)
- [x] Anonymous redirected to `/auth` or `/index` with no successful payload
- [x] Admin access works and uses only expected endpoints (admin gate + `get_venues`)
- [ ] Data-layer authZ proven (policies/RLS and RPC gating) — currently blocked: `get_venues` executable by PUBLIC and `admin_users_select_all` exposes admin roster
- [ ] Dark mode contrast checks logged
- [ ] Responsive/touch checks logged
- [ ] Accessibility checks logged

---

## Outcome summary

- Current status: NOT READY
- Blockers:
  - Data-layer authZ remediation required: restrict `get_venues` (admin-only) and remove `admin_users_select_all`
  - Dark mode contrast checks pending
  - Responsive/touch checks pending
  - Accessibility checks pending
- Follow-ups / tickets:
