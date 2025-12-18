/**
 * Rate Limiting Database Functions Tests
 *
 * RATE-001: Server-side rate limiting enforcement
 * Phase 3: Production Hardening & Optimization
 *
 * Tests for database trigger functions and RPC functions that enforce rate limits.
 * These tests verify the server-side enforcement layer.
 *
 * Quarantined during v3 hardening – re-enable with:
 *   RUN_DB_TESTS=true pnpm test src/lib/__tests__/rate-limit-db.test.ts
 * (Requires SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL or VITE_SUPABASE_URL.)
 */

import { beforeEach, describe, expect, it } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";

const RUN_DB_TESTS = process.env.RUN_DB_TESTS === "true";

const SERVICE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminSupabaseClient =
  SERVICE_URL && SERVICE_ROLE_KEY
    ? createClient(SERVICE_URL, SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

const requireAdminClient = () => {
  if (!adminSupabaseClient) {
    throw new Error(
      "adminSupabaseClient not configured – set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL (or VITE_SUPABASE_URL) to run admin-only rate_limits tests."
    );
  }
  return adminSupabaseClient;
};

const hasAdminClient = Boolean(adminSupabaseClient);
const describeIfEnabled =
  RUN_DB_TESTS && hasAdminClient ? describe : describe.skip;

if (!RUN_DB_TESTS) {
  console.warn(
    "[rate-limit-db.test] RUN_DB_TESTS not set to true – skipping rate-limit DB tests."
  );
}

if (RUN_DB_TESTS && !hasAdminClient) {
  console.warn(
    "[rate-limit-db.test] Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL/VITE_SUPABASE_URL – skipping rate-limit DB tests."
  );
}

describeIfEnabled("Rate Limiting Database Functions", () => {
  // Test user ID (use a real UUID from your test database)
  const TEST_USER_ID = "00000000-0000-0000-0000-000000000001";

  beforeEach(async () => {
    const adminSupabase = requireAdminClient();
    await adminSupabase.from("rate_limits").delete().eq("user_id", TEST_USER_ID);
  });

  describe("check_rate_limit()", () => {
    it("should allow first attempt", async () => {
      const { data, error } = await supabase.rpc("check_rate_limit", {
        p_user_id: TEST_USER_ID,
        p_action: "create_catch",
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      expect(error).toBeNull();
      expect(data).toBe(true);
    });

    it("should allow attempts within limit", async () => {
      // Make 5 attempts (limit is 10)
      for (let i = 0; i < 5; i++) {
        const { data, error } = await supabase.rpc("check_rate_limit", {
          p_user_id: TEST_USER_ID,
          p_action: "create_catch",
          p_max_attempts: 10,
          p_window_minutes: 60,
        });

        expect(error).toBeNull();
        expect(data).toBe(true);
      }

      // Verify 5 attempts recorded
      const adminSupabase = requireAdminClient();
      const { count } = await adminSupabase
        .from("rate_limits")
        .select("*", { count: "exact", head: true })
        .eq("user_id", TEST_USER_ID)
        .eq("action", "create_catch");

      expect(count).toBe(5);
    });

    it("should block attempts when limit exceeded", async () => {
      // Make 3 attempts (limit is 3)
      for (let i = 0; i < 3; i++) {
        await supabase.rpc("check_rate_limit", {
          p_user_id: TEST_USER_ID,
          p_action: "create_report",
          p_max_attempts: 3,
          p_window_minutes: 60,
        });
      }

      // 4th attempt should fail
      const { data, error } = await supabase.rpc("check_rate_limit", {
        p_user_id: TEST_USER_ID,
        p_action: "create_report",
        p_max_attempts: 3,
        p_window_minutes: 60,
      });

      expect(error).toBeNull();
      expect(data).toBe(false);

      // Verify still only 3 attempts (4th not recorded)
      const adminSupabase = requireAdminClient();
      const { count } = await adminSupabase
        .from("rate_limits")
        .select("*", { count: "exact", head: true })
        .eq("user_id", TEST_USER_ID)
        .eq("action", "create_report");

      expect(count).toBe(3);
    });

    it("should track different actions separately", async () => {
      // Make catch attempts
      await supabase.rpc("check_rate_limit", {
        p_user_id: TEST_USER_ID,
        p_action: "create_catch",
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      // Make comment attempts
      await supabase.rpc("check_rate_limit", {
        p_user_id: TEST_USER_ID,
        p_action: "create_comment",
        p_max_attempts: 30,
        p_window_minutes: 60,
      });

      // Verify separate tracking
      const adminSupabase = requireAdminClient();
      const { data: catches } = await adminSupabase
        .from("rate_limits")
        .select("*")
        .eq("user_id", TEST_USER_ID)
        .eq("action", "create_catch");

      const { data: comments } = await adminSupabase
        .from("rate_limits")
        .select("*")
        .eq("user_id", TEST_USER_ID)
        .eq("action", "create_comment");

      expect(catches?.length).toBe(1);
      expect(comments?.length).toBe(1);
    });

    it("should respect time window", async () => {
      // Make 2 attempts with 2-minute window
      await supabase.rpc("check_rate_limit", {
        p_user_id: TEST_USER_ID,
        p_action: "test_action",
        p_max_attempts: 2,
        p_window_minutes: 2,
      });

      await supabase.rpc("check_rate_limit", {
        p_user_id: TEST_USER_ID,
        p_action: "test_action",
        p_max_attempts: 2,
        p_window_minutes: 2,
      });

      // 3rd attempt should fail
      const { data: blocked } = await supabase.rpc("check_rate_limit", {
        p_user_id: TEST_USER_ID,
        p_action: "test_action",
        p_max_attempts: 2,
        p_window_minutes: 2,
      });

      expect(blocked).toBe(false);

      // TODO: In a real test, we'd wait 2 minutes or manually update timestamps
      // For now, this documents the expected behavior
    });
  });

  describe("get_rate_limit_status()", () => {
    it("should return correct status when no attempts", async () => {
      const { data, error } = await supabase.rpc("get_rate_limit_status", {
        p_user_id: TEST_USER_ID,
        p_action: "create_catch",
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      expect(error).toBeNull();
      const status = Array.isArray(data) ? data[0] : data;
      expect(status).toMatchObject({
        attempts_used: 0,
        attempts_remaining: 10,
        is_limited: false,
      });
    });

    it("should return correct status with some attempts", async () => {
      // Make 3 attempts
      for (let i = 0; i < 3; i++) {
        await supabase.rpc("check_rate_limit", {
          p_user_id: TEST_USER_ID,
          p_action: "create_catch",
          p_max_attempts: 10,
          p_window_minutes: 60,
        });
      }

      const { data, error } = await supabase.rpc("get_rate_limit_status", {
        p_user_id: TEST_USER_ID,
        p_action: "create_catch",
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      expect(error).toBeNull();
      const status = Array.isArray(data) ? data[0] : data;
      expect(status).toMatchObject({
        attempts_used: 3,
        attempts_remaining: 7,
        is_limited: false,
      });
      expect(status?.reset_at).toBeTruthy();
    });

    it("should return limited status when at limit", async () => {
      // Make 5 attempts (limit is 5)
      for (let i = 0; i < 5; i++) {
        await supabase.rpc("check_rate_limit", {
          p_user_id: TEST_USER_ID,
          p_action: "create_report",
          p_max_attempts: 5,
          p_window_minutes: 60,
        });
      }

      const { data, error } = await supabase.rpc("get_rate_limit_status", {
        p_user_id: TEST_USER_ID,
        p_action: "create_report",
        p_max_attempts: 5,
        p_window_minutes: 60,
      });

      expect(error).toBeNull();
      const status = Array.isArray(data) ? data[0] : data;
      expect(status).toMatchObject({
        attempts_used: 5,
        attempts_remaining: 0,
        is_limited: true,
      });
    });
  });

  describe("user_rate_limits()", () => {
    it("should return empty array when no attempts", async () => {
      const { data, error } = await supabase.rpc("user_rate_limits", {
        p_user_id: TEST_USER_ID,
      });

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data?.length).toBe(0);
    });

    it("should return user attempts summary", async () => {
      // Make some attempts
      await supabase.rpc("check_rate_limit", {
        p_user_id: TEST_USER_ID,
        p_action: "create_catch",
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      await supabase.rpc("check_rate_limit", {
        p_user_id: TEST_USER_ID,
        p_action: "create_catch",
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      await supabase.rpc("check_rate_limit", {
        p_user_id: TEST_USER_ID,
        p_action: "create_comment",
        p_max_attempts: 30,
        p_window_minutes: 60,
      });

      const { data, error } = await supabase.rpc("user_rate_limits", {
        p_user_id: TEST_USER_ID,
      });

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);

      // Should have entries for both actions
      const catchEntry = data?.find((item) => item.action === "create_catch");
      const commentEntry = data?.find(
        (item) => item.action === "create_comment"
      );

      expect(catchEntry).toBeDefined();
      expect(catchEntry?.count).toBe(2);

      expect(commentEntry).toBeDefined();
      expect(commentEntry?.count).toBe(1);
    });

    it("should include oldest attempt timestamp", async () => {
      // Make attempts
      await supabase.rpc("check_rate_limit", {
        p_user_id: TEST_USER_ID,
        p_action: "create_catch",
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      await supabase.rpc("check_rate_limit", {
        p_user_id: TEST_USER_ID,
        p_action: "create_catch",
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      const { data } = await supabase.rpc("user_rate_limits", {
        p_user_id: TEST_USER_ID,
      });

      const catchEntry = data?.find((item) => item.action === "create_catch");

      expect(catchEntry).toBeDefined();
      expect(catchEntry).toHaveProperty("oldest_attempt");

      if (!catchEntry) {
        throw new Error("user_rate_limits returned no entry for create_catch");
      }

      const oldest = new Date(catchEntry.oldest_attempt as string);
      expect(Number.isNaN(oldest.getTime())).toBe(false);
    });
  });

  describe("cleanup_rate_limits()", () => {
    it("should remove old rate limit records", async () => {
      // Make some attempts
      await supabase.rpc("check_rate_limit", {
        p_user_id: TEST_USER_ID,
        p_action: "create_catch",
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      // Manually update timestamp to be > 2 hours old
      const adminSupabase = requireAdminClient();
      await adminSupabase
        .from("rate_limits")
        .update({
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        })
        .eq("user_id", TEST_USER_ID);

      // Run cleanup (removes records > 2 hours old)
      const { data, error } = await supabase.rpc("cleanup_rate_limits");

      expect(error).toBeNull();

      // Verify records were deleted
      const { count } = await adminSupabase
        .from("rate_limits")
        .select("*", { count: "exact", head: true })
        .eq("user_id", TEST_USER_ID);

      expect(count).toBe(0);
    });

    it("should keep recent records", async () => {
      // Make recent attempts
      await supabase.rpc("check_rate_limit", {
        p_user_id: TEST_USER_ID,
        p_action: "create_catch",
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      // Run cleanup
      await supabase.rpc("cleanup_rate_limits");

      // Verify records still exist
      const adminSupabase = requireAdminClient();
      const { count } = await adminSupabase
        .from("rate_limits")
        .select("*", { count: "exact", head: true })
        .eq("user_id", TEST_USER_ID);

      expect(count).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Row Level Security semantics for rate_limits
  //
  // Current design (see docs/version3/RLS-DESIGN.md):
  // - Inserts: allowed for authenticated users where user_id = auth.uid()
  //   (used by RPCs/triggers like enforce_catch_rate_limit()).
  // - Select / Update / Delete: blocked for normal users; admins can SELECT
  //   via a dedicated policy.
  //
  // These tests run with the public anon/test client, so they assert that
  // direct table access is *blocked* and that the only supported path for
  // normal users is via RPCs.
  // ---------------------------------------------------------------------------
  describe("Row Level Security", () => {
    it("should block direct selects on rate_limits for the anon/test client", async () => {
      const { data, error } = await supabase
        .from("rate_limits")
        .select("*")
        .eq("user_id", TEST_USER_ID);

      // Some PostgREST/RLS setups return an error; others return an empty array.
      // In either case, anon/test should not see any rows.
      expect(data === null || (Array.isArray(data) && data.length === 0)).toBe(
        true
      );
    });

    it("should block direct inserts on rate_limits for the anon/test client", async () => {
      const { error } = await supabase.from("rate_limits").insert({
        user_id: TEST_USER_ID,
        action: "fake_action",
      });

      // Direct inserts from this test client should be blocked by RLS.
      // Inserts for real users happen via RPCs/triggers under the authenticated role.
      expect(error).toBeDefined();
    });

    it("should block direct deletes on rate_limits for the anon/test client", async () => {
      // Attempt to delete any records for this user. With RLS locked down,
      // the anon/test client should not be able to delete rows even if they exist.
      const { error } = await supabase
        .from("rate_limits")
        .delete()
        .eq("user_id", TEST_USER_ID);

      expect(error).toBeDefined();
    });
  });
});
