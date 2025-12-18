**Hardening Regression Checklist (v4 UI-only)**  
Updated: 2025-12-17

- **Follows/Blocks (RLS-HARDEN-002):**
  - Blocked user cannot follow; follower edges only self-insert; admin can read via SQL (UI unaffected).
  - Follow button reflects state; no cross-user writes.
- **Reports (REPORTS-003):**
  - Create report uses `create_report_with_rate_limit`; one toast + one redirect on inaccessible targets; rate limit at 5/hour enforced; single rate_limits row per report.
- **Ratings/Reactions/Comments (RLS-HARDEN-001):**
  - Rating summary returns 0 rows when denied; UI treats as not accessible (no toasts).
  - Comments/reactions respect visibility/blocking; no self-react/rate leaks.
- **Notifications/Admin Warnings (RLS-HARDEN-003):**
  - Notifications table is recipient-only; warnings/admin logs admin-only; admin RPCs reject non-admin callers.
- **Access Model:**
  - Protected routes redirect to `/auth` without flashing content; navbar stays mounted.
  - Admin pages enforce admin role inside page.
- **Rate Limits:**
  - Report rate limit (5/hr) surfaces friendly message; logging single row per success.
- **UI Guardrails:**
  - No full-screen spinners; skeletons content-only; shell not remounted.
  - Navbar stable across navigation (mobile + desktop).
- **Regression watchouts:**
  - No changes to RPC/migrations/RLS; UI-only updates.
  - Keep Redirect + toast for inaccessible catch to single occurrence per catch id.
