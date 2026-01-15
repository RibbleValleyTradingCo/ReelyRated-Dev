# Policy Lint Worksheet (auth_rls_initplan + multiple_permissive_policies)

## Purpose
Summarize advisor lint findings for RLS policy shape and annotate which tables
require initplan rewrites or have multiple permissive policies.

This worksheet is driven by:
- `docs/version6/hardening/_global/sql/65_POLICY_LINTS_ADVISOR_RECHECK.sql`
- `docs/version6/hardening/_global/sql/67_MULTIPLE_PERMISSIVE_POLICIES_BREAKDOWN.sql`

## Data source + how to run
1) Populate the `lint_tables` VALUES list in:
   `docs/version6/hardening/_global/sql/65_POLICY_LINTS_ADVISOR_RECHECK.sql`
   using the tables flagged by the advisor lints:
   - `auth_rls_initplan`
   - `multiple_permissive_policies`
2) Run the probe and export results (CSV or copy/paste).
3) Fill the tables below.

> Note: No advisor output was found in-repo; this worksheet is a template
> to be completed after running the advisor and the probe.
> Raw evidence (CSV/exports) is local-only under `_local_evidence/` and is not committed.

## Tables flagged for initplan rewrite
| Table | Policy | Cmd | Roles | contains_auth_call | Initplan rewrite needed | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD | TBD | Populate from probe output. |

## 0006_multiple_permissive_policies (SQL triage)
Use `67_MULTIPLE_PERMISSIVE_POLICIES_BREAKDOWN.sql` to fill the command/roles columns.
Risk ratings below are provisional based on table criticality; confirm after SQL output.
Note: Probe #67 aggregates distinct roles correctly from `pg_policies.roles` (name[]).
summary_permissive lists tables/cmds with >=2 permissive policies in total.
summary_by_role lists tables/cmds with >=2 permissive policies applying to the same role (higher risk).
If a table appears only in summary_permissive, multiplicity may be split across roles (typically lower risk, still review).

Soft-delete visibility contract:
- Admins can see soft-deleted rows (moderation/audit).
- Owners must NOT see soft-deleted rows.

Initial soft-delete checks (verify with `docs/version6/hardening/_global/sql/68_0006_SOFT_DELETE_VISIBILITY_CHECK.sql`):
- catches: `catches_owner_all` uses `(uid() = user_id)` with no `deleted_at IS NULL`; because PERMISSIVE policies OR together, owners can see deleted rows → ❗CONFLICT. Minimal fix: tighten to `(uid() = user_id AND deleted_at IS NULL)` while leaving `catches_admin_read_all` for admin visibility. Mark FIXED once Probe #68 is clean after migration 2176.
- catch_comments: SELECT policies appear to include `deleted_at IS NULL` (e.g., `catch_comments_public_read`, `catch_comments_select_viewable`) → no conflict observed yet; confirm with probe #68.

Candidate change notes (no migration yet):
- catches SELECT: tighten `catches_owner_all` to include `deleted_at IS NULL` or remove the owner policy and rely on `catches_public_read` (which already branches owner/admin visibility), while keeping `catches_admin_read_all` unchanged.
- catch_comments SELECT: if any owner/self SELECT policy lacks a deleted filter, add `deleted_at IS NULL` or consolidate so owner visibility respects soft-delete while admin visibility remains.

catch_comments policy relationship (SQL-first):
- Run `docs/version6/hardening/_global/sql/69_0006_CATCH_COMMENTS_POLICY_RELATIONSHIP.sql` to compare `catch_comments_public_read` vs `catch_comments_select_viewable`.
- If the heuristics show one policy is a clear superset of the other, consider consolidation; if they diverge by audience or gates, defer to surface pass.
Update: 0006 SELECT multiplicity resolved by dropping `catch_comments_select_viewable` (missing block/private gates per probe 69 diff hints). Re-run probe 69 to confirm only `catch_comments_public_read` remains.

| Table | Cmd | Policy set | Decision | Rationale | Probe file | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| catch_comments | SELECT | catch_comments_public_read, catch_comments_admin_read_all | FIXED | `catch_comments_select_viewable` dropped (missing block/private gates); probe 69 diff hints confirmed bypass risk. | `docs/version6/hardening/_global/sql/70_0006_catch_comments_SELECT_RELATIONSHIP.sql` | Re-run 69/70 after migration 2177. |
| catch_comments | UPDATE | catch_comments_admin_update, catch_comments_update_owner | INTENTIONAL | Admin vs owner split; no public policy. Confirm no missing gates via probe. | `docs/version6/hardening/_global/sql/70_0006_catch_comments_UPDATE_RELATIONSHIP.sql` | Defer to profile-detail surface pass if tokens diverge. |
| catches | SELECT | catches_public_read, catches_owner_all, catches_admin_read_all | INTENTIONAL | Role split; owner soft-delete filter fixed in 2176 to align with contract. | `docs/version6/hardening/_global/sql/70_0006_catches_SELECT_RELATIONSHIP.sql` | Re-run 68 to confirm owner deleted visibility remains blocked. |
| profile_blocks | INSERT | profile_blocks_insert_admin_all, profile_blocks_insert_self | INTENTIONAL | Admin vs self split; auth-only surface. | `docs/version6/hardening/_global/sql/70_0006_profile_blocks_INSERT_RELATIONSHIP.sql` | Defer to surface pass if new gates appear. |
| profile_blocks | SELECT | profile_blocks_select_admin_all, profile_blocks_select_self_or_blocked | INTENTIONAL | Admin vs self/blocked split; auth-only. | `docs/version6/hardening/_global/sql/70_0006_profile_blocks_SELECT_RELATIONSHIP.sql` | Defer to surface pass if gates diverge. |
| profile_blocks | DELETE | profile_blocks_delete_admin_all, profile_blocks_delete_self | INTENTIONAL | Admin vs self split; auth-only. | `docs/version6/hardening/_global/sql/70_0006_profile_blocks_DELETE_RELATIONSHIP.sql` | Defer to surface pass if gates diverge. |
| profile_follows | SELECT | profile_follows_admin_select_all, profile_follows_owner_all, profile_follows_select_related | INTENTIONAL | Admin vs owner/related split; review for consistent self/related gates. | `docs/version6/hardening/_global/sql/70_0006_profile_follows_SELECT_RELATIONSHIP.sql` | Defer to surface pass if role-split is not clean. |
| reports | ALL | reports_admin_all, reports_owner_all | INTENTIONAL | Admin vs reporter split; auth-only. | `docs/version6/hardening/_global/sql/70_0006_reports_ALL_RELATIONSHIP.sql` | Defer to surface pass if gates diverge. |
| venue_ratings | SELECT | Admins can select all venue ratings, Allow users to select own venue ratings | INTENTIONAL | Admin vs self split. | `docs/version6/hardening/_global/sql/70_0006_venue_ratings_SELECT_RELATIONSHIP.sql` | Defer to surface pass if gates diverge. |
| venues | SELECT | venues_select_admin_all, venues_select_owner | INTENTIONAL | Admin vs owner split; public listing handled elsewhere. | `docs/version6/hardening/_global/sql/70_0006_venues_SELECT_RELATIONSHIP.sql` | Defer to surface pass if public-read needs separate policy. |
| venues | UPDATE | venues_update_admin_all, venues_update_owner | INTENTIONAL | Admin vs owner split; auth-only. | `docs/version6/hardening/_global/sql/70_0006_venues_UPDATE_RELATIONSHIP.sql` | Defer to surface pass if gates diverge. |

How to run (local-only):
- Execute `docs/version6/hardening/_global/sql/67_MULTIPLE_PERMISSIVE_POLICIES_BREAKDOWN.sql` in Studio.
- Save outputs under `_local_evidence/global/YYYY-MM-DD/0006/`.
- Re-run after any consolidation pass to confirm the list shrinks.

## Combined policy inventory (for flagged tables)
| Table | Policy | Cmd | Roles | contains_auth_call | Notes |
| --- | --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD | Populate from probe output. |
