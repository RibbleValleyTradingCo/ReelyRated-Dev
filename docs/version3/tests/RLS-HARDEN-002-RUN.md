- [x] **RLS-HARDEN-002** (profiles, follows, blocks)  
      **Status:** ✅ Pass  
      **Last run:** 2025-12-16 (SQL editor impersonation – James)  
      **Runbook:** `docs/version3/tests/RLS-HARDEN-002-RUN.md`

  **Summary:**  
  Seeded actors:

  - A (aowner): aa35e9b8-9826-4e45-a5b0-cec5d3bd6f3a
  - B (bfollower): 8fdb5a09-18b1-4f40-babe-a96959c3ee04
  - C (cstranger): dc976a2a-03fe-465a-be06-0fa1038c95cf
  - D (dblocked): 8641225a-8917-435e-95f2-bb4356cd44d0
  - Admin: d38c5e8d-7dc6-42f0-b541-906e793f2e20

  **Migrations in scope:**

  - `2117_harden_profile_follows_rls.sql` (admin follow visibility + blocked/self follow guards + RPC guard)

  **Verified behaviours:**

  - **Anon:** cannot list A’s followers (0 rows).
  - **Admin:** can list followers for A (admin SELECT policy works).
  - **A (target):** can see inbound follow edges to A (B → A visible to A).
  - **C (stranger):**
    - can create/see only edges involving C (can see own C → A edge if present; cannot see B → A).
  - **D (blocked by A):**
    - RPC `follow_profile_with_rate_limit(A)` rejected with `Target not accessible`.
    - Direct INSERT to `profile_follows` rejected by RLS (`profile_follows_insert_not_blocked`).
  - **Self-follow:** RPC rejects with `Cannot follow yourself`.
  - **Admin visibility gap closed:** admin can see follow edges across users (previously 0 rows, now 1+).

  **Notes:**

  - `rate_limits` rows for follows are only produced by the RPC path (not by direct table INSERT tests). Transaction batching matters when verifying counts.
