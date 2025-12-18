**RPC Inventory (v4 UI reference)**  
Updated: 2025-12-17 (UI-only; do not edit RPCs)

Known RPCs used in frontend (public schema)
- `create_comment_with_rate_limit` – Inserts a comment with rate-limit check; used in comment flows (e.g., CatchDetail).
- `create_report_with_rate_limit` – Inserts report; rate-limited; used in ReportButton (catch/comment).
- `get_catch_rating_summary` – Returns rating summary; used in CatchDetail and hooks.
- `follow_profile_with_rate_limit` – Inserts follow edge; rate-limited; used in Profile follow button.
- `block_profile` / `unblock_profile` – Manage profile blocks; used in Profile block actions.
- `is_blocked_either_way` – Helper used in triggers/RPCs (referenced indirectly).
- `get_venues` – Fetch venues list; used in VenuesIndex.
- `admin_list_reports` – Admin list view; used in AdminReports.
- `admin_update_report_status` (if exposed) – Admin update; referenced in admin flows.
- `admin_list_moderation_log` – Admin moderation log; used in admin pages.
- `admin_warn_user` – Issues warnings; used in AdminUserModeration.
- Others in code: `rate_catch_with_rate_limit`, `react_to_catch_with_rate_limit`, `create_notification` (called indirectly in flows).

Notes
- Many RPCs are SECURITY DEFINER per migrations; admin RPCs enforce admin via DB checks.
- UI-only changes must not alter RPC signatures or calls. If unsure about an RPC, add to TODO below.

TODO
- Confirm any additional venue/admin RPCs (e.g., venue ratings/statistics) and storage helpers.
