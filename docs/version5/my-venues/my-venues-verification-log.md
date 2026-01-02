# Verification Log — /my/venues

This log captures _evidence_ for the /my/venues hardening pass.
Do not mark items as DONE unless evidence is attached (HAR/screenshots/SQL output notes).

**Linked audit doc:** [my-venues.md](./my-venues.md)

---

## Run metadata (fill in each session)

- Date:
- Environment: (local / staging / prod)
- Branch / commit:
- Tester:
- Browser + version:
- Device(s): (desktop / iPhone / Android)
- Notes:

- Anonymous run: navigated to `/my/venues` while signed out and was redirected to `/auth`.
- HAR (`my-venues-anon-2026-01-02.har`) includes the initial document load for `/my/venues` and shows **no** Supabase `rest/v1/*` calls (no `venue_owners` payload). Note: SPA route redirect to `/auth` may not appear as a separate network document request; capture a UI screenshot of the `/auth` URL if needed.

---

## Personas under test

- Admin: (N/A for `/my/venues` — admin venue management lives at `/admin/venues`)
  - user id / email:
- Owner:
  - user id / email:
- Non-owner:
  - user id / email:
- Anonymous:
  - (signed out)

---

## Evidence index (files)

### HAR exports

- Admin: `my-venues-admin-YYYY-MM-DD.har`
- Owner: `my-venues-owner-YYYY-MM-DD.har`
- Non-owner: `my-venues-non-owner-YYYY-MM-DD.har`
- Anonymous: `my-venues-anon-2026-01-02.har`

### Screenshots (filenames)

- Network list filtered to `venue_owners` (per persona):
- `venue_owners` response preview (per persona):
- UI state screenshots:
  - Owner shows venues:
  - Non-owner empty state:
  - Anon redirect to /auth:

### SQL / RLS evidence (notes or saved output)

- RLS flags checked:
- Policies listed:
- Any anomalies:

---

## Verification checklist (per persona)

> Use ✅ PASS / ❌ FAIL / ⏳ PENDING and add short notes + evidence refs.

### 1) Network / data reads (HAR)

| Persona   | Expected request(s)                                                                      | Observed                                                                                                                                        | Status  | Evidence                        |
| --------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------- |
| Admin     | `rest/v1/venue_owners?...select=venues:venue_id(...)&user_id=eq.<ADMIN_ID>` + auth calls | N/A for /my/venues (admin venue management verified separately at /admin/venues)                                                                | —       |                                 |
| Owner     | `rest/v1/venue_owners?...user_id=eq.<OWNER_ID>` + auth calls                             |                                                                                                                                                 |         |                                 |
| Non-owner | `rest/v1/venue_owners?...user_id=eq.<NON_OWNER_ID>` returns `[]` (or denied)             |                                                                                                                                                 |         |                                 |
| Anonymous | Redirect to `/auth`; no successful `venue_owners` payload                                | Loaded /my/venues (doc request); no rest/v1 calls; redirect to /auth observed in UI (SPA redirect may not show as separate network doc request) | ✅ PASS | `my-venues-anon-2026-01-02.har` |

**Notes (network):**

- Any unexpected endpoints?
- Any extra reads?
- Response size/shape correct (only `id, slug, name, location, short_tagline, price_from`)?

---

### 2) Data-layer authorization (RLS / OWASP)

#### RLS enabled checks

- `public.venue_owners`: relrowsecurity = **_ / relforcerowsecurity = _**
- `public.venues`: relrowsecurity = **_ / relforcerowsecurity = _**

#### Policies present

- `venue_owners` SELECT policies:
- `venues` SELECT policies (relevant to join):
- Admin policy intent (define expected behaviour):

| Persona   | Expected                                            | Observed | Status | Evidence |
| --------- | --------------------------------------------------- | -------- | ------ | -------- |
| Admin     | (define: all rows? or restricted?)                  |          |        |          |
| Owner     | Only rows where `venue_owners.user_id = auth.uid()` |          |        |          |
| Non-owner | 0 rows / denied                                     |          |        |          |
| Anonymous | denied / 0 rows                                     |          |        |          |

**Notes (authZ):**

- Confirm join does not widen exposure.
- If any non-owner data appears: **Go/No-Go FAIL** until fixed.

---

### 3) Dark mode contrast (manual)

| Area                                       | Status | Notes | Evidence |
| ------------------------------------------ | ------ | ----- | -------- |
| Page background (`bg-background`)          | ⏳     |       |          |
| Card surfaces (`bg-card`, `border-border`) | ⏳     |       |          |
| Primary text (`text-foreground`)           | ⏳     |       |          |
| Secondary text (`text-muted-foreground`)   | ⏳     |       |          |
| Buttons/CTAs                               | ⏳     |       |          |
| Focus ring visibility                      | ⏳     |       |          |

---

### 4) Responsive / touch (manual)

| Scenario                  | Status | Notes | Evidence |
| ------------------------- | ------ | ----- | -------- |
| 360px portrait            | ⏳     |       |          |
| 390px portrait            | ⏳     |       |          |
| 414px portrait            | ⏳     |       |          |
| Landscape rotation        | ⏳     |       |          |
| No horizontal scroll      | ⏳     |       |          |
| Tap targets (View/Manage) | ⏳     |       |          |

---

### 5) Accessibility (manual + light DOM inspection)

| Check                           | Status | Notes | Evidence |
| ------------------------------- | ------ | ----- | -------- |
| Exactly one H1 present          | ⏳     |       |          |
| Heading order sensible (H1→H2…) | ⏳     |       |          |
| Keyboard tab order sane         | ⏳     |       |          |
| Buttons have clear labels       | ⏳     |       |          |

---

## Go / No-Go gates (for marking /my/venues DONE)

- [ ] Data-layer authZ proven (RLS enabled + policies exist + non-owner/anon cannot read rows)
- [ ] HAR evidence saved for Owner / Non-owner / Anon (Admin if applicable)
- [ ] Dark mode contrast checklist completed with screenshots/notes
- [ ] Responsive/touch checks completed with screenshots/notes
- [ ] Accessibility checks completed (including H1 decision)

---

## Outcome summary

- Current status: (NOT READY / READY WITH FOLLOW-UPS / READY)
- Blockers:
- Follow-ups / tickets:
