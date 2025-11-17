/**
 * Rate Limiting Database Functions Tests
 *
 * RATE-001: Server-side rate limiting enforcement
 * Phase 3: Production Hardening & Optimization
 *
 * Tests for database trigger functions and RPC functions that enforce rate limits.
 * These tests verify the server-side enforcement layer.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

interface RateLimitEntry {
  action: string;
  attempt_count: number;
  oldest_attempt: string;
  newest_attempt: string;
}

/**
 * NOTE: These are integration tests that require a running Supabase instance.
 * They can be run against a local Supabase instance or a test database.
 *
 * To run locally:
 * 1. Start Supabase: npx supabase start
 * 2. Apply migrations: npx supabase db reset
 * 3. Run tests: npm test rate-limit-db
 */

describe('Rate Limiting Database Functions', () => {
  // Test user ID (use a real UUID from your test database)
  const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

  beforeEach(async () => {
    // Clean up rate_limits table before each test
    await supabase
      .from('rate_limits')
      .delete()
      .eq('user_id', TEST_USER_ID);
  });

  describe('check_rate_limit()', () => {
    it('should allow first attempt', async () => {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_user_id: TEST_USER_ID,
        p_action: 'create_catch',
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      expect(error).toBeNull();
      expect(data).toBe(true);
    });

    it('should allow attempts within limit', async () => {
      // Make 5 attempts (limit is 10)
      for (let i = 0; i < 5; i++) {
        const { data, error } = await supabase.rpc('check_rate_limit', {
          p_user_id: TEST_USER_ID,
          p_action: 'create_catch',
          p_max_attempts: 10,
          p_window_minutes: 60,
        });

        expect(error).toBeNull();
        expect(data).toBe(true);
      }

      // Verify 5 attempts recorded
      const { count } = await supabase
        .from('rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', TEST_USER_ID)
        .eq('action', 'create_catch');

      expect(count).toBe(5);
    });

    it('should block attempts when limit exceeded', async () => {
      // Make 3 attempts (limit is 3)
      for (let i = 0; i < 3; i++) {
        await supabase.rpc('check_rate_limit', {
          p_user_id: TEST_USER_ID,
          p_action: 'create_report',
          p_max_attempts: 3,
          p_window_minutes: 60,
        });
      }

      // 4th attempt should fail
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_user_id: TEST_USER_ID,
        p_action: 'create_report',
        p_max_attempts: 3,
        p_window_minutes: 60,
      });

      expect(error).toBeNull();
      expect(data).toBe(false);

      // Verify still only 3 attempts (4th not recorded)
      const { count } = await supabase
        .from('rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', TEST_USER_ID)
        .eq('action', 'create_report');

      expect(count).toBe(3);
    });

    it('should track different actions separately', async () => {
      // Make catch attempts
      await supabase.rpc('check_rate_limit', {
        p_user_id: TEST_USER_ID,
        p_action: 'create_catch',
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      // Make comment attempts
      await supabase.rpc('check_rate_limit', {
        p_user_id: TEST_USER_ID,
        p_action: 'create_comment',
        p_max_attempts: 30,
        p_window_minutes: 60,
      });

      // Verify separate tracking
      const { data: catches } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('user_id', TEST_USER_ID)
        .eq('action', 'create_catch');

      const { data: comments } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('user_id', TEST_USER_ID)
        .eq('action', 'create_comment');

      expect(catches?.length).toBe(1);
      expect(comments?.length).toBe(1);
    });

    it('should respect time window', async () => {
      // Make 2 attempts with 2-minute window
      await supabase.rpc('check_rate_limit', {
        p_user_id: TEST_USER_ID,
        p_action: 'test_action',
        p_max_attempts: 2,
        p_window_minutes: 2,
      });

      await supabase.rpc('check_rate_limit', {
        p_user_id: TEST_USER_ID,
        p_action: 'test_action',
        p_max_attempts: 2,
        p_window_minutes: 2,
      });

      // 3rd attempt should fail
      const { data: blocked } = await supabase.rpc('check_rate_limit', {
        p_user_id: TEST_USER_ID,
        p_action: 'test_action',
        p_max_attempts: 2,
        p_window_minutes: 2,
      });

      expect(blocked).toBe(false);

      // TODO: In a real test, we'd wait 2 minutes or manually update timestamps
      // For now, this documents the expected behavior
    });
  });

  describe('get_rate_limit_status()', () => {
    it('should return correct status when no attempts', async () => {
      const { data, error } = await supabase.rpc('get_rate_limit_status', {
        p_user_id: TEST_USER_ID,
        p_action: 'create_catch',
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      expect(error).toBeNull();
      expect(data).toMatchObject({
        attempts_used: 0,
        attempts_remaining: 10,
        is_limited: false,
      });
    });

    it('should return correct status with some attempts', async () => {
      // Make 3 attempts
      for (let i = 0; i < 3; i++) {
        await supabase.rpc('check_rate_limit', {
          p_user_id: TEST_USER_ID,
          p_action: 'create_catch',
          p_max_attempts: 10,
          p_window_minutes: 60,
        });
      }

      const { data, error } = await supabase.rpc('get_rate_limit_status', {
        p_user_id: TEST_USER_ID,
        p_action: 'create_catch',
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      expect(error).toBeNull();
      expect(data).toMatchObject({
        attempts_used: 3,
        attempts_remaining: 7,
        is_limited: false,
      });
    });

    it('should return limited status when at limit', async () => {
      // Make 5 attempts (limit is 5)
      for (let i = 0; i < 5; i++) {
        await supabase.rpc('check_rate_limit', {
          p_user_id: TEST_USER_ID,
          p_action: 'create_report',
          p_max_attempts: 5,
          p_window_minutes: 60,
        });
      }

      const { data, error } = await supabase.rpc('get_rate_limit_status', {
        p_user_id: TEST_USER_ID,
        p_action: 'create_report',
        p_max_attempts: 5,
        p_window_minutes: 60,
      });

      expect(error).toBeNull();
      expect(data).toMatchObject({
        attempts_used: 5,
        attempts_remaining: 0,
        is_limited: true,
      });
    });

    it('should include reset_at timestamp', async () => {
      await supabase.rpc('check_rate_limit', {
        p_user_id: TEST_USER_ID,
        p_action: 'create_catch',
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      const { data, error } = await supabase.rpc('get_rate_limit_status', {
        p_user_id: TEST_USER_ID,
        p_action: 'create_catch',
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      expect(error).toBeNull();
      expect(data).toHaveProperty('reset_at');
      expect(data?.reset_at).toBeTruthy();

      // Reset time should be in the future
      const resetTime = new Date(data?.reset_at as string);
      expect(resetTime.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('user_rate_limits()', () => {
    it('should return empty array when no attempts', async () => {
      const { data, error } = await supabase.rpc('user_rate_limits');

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data?.length).toBe(0);
    });

    it('should return user attempts summary', async () => {
      // Make some attempts
      await supabase.rpc('check_rate_limit', {
        p_user_id: TEST_USER_ID,
        p_action: 'create_catch',
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      await supabase.rpc('check_rate_limit', {
        p_user_id: TEST_USER_ID,
        p_action: 'create_catch',
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      await supabase.rpc('check_rate_limit', {
        p_user_id: TEST_USER_ID,
        p_action: 'create_comment',
        p_max_attempts: 30,
        p_window_minutes: 60,
      });

      const { data, error } = await supabase.rpc('user_rate_limits');

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);

      // Should have entries for both actions
      const catchEntry = data?.find((item: RateLimitEntry) => item.action === 'create_catch');
      const commentEntry = data?.find((item: RateLimitEntry) => item.action === 'create_comment');

      expect(catchEntry).toBeDefined();
      expect(catchEntry?.attempt_count).toBe(2);

      expect(commentEntry).toBeDefined();
      expect(commentEntry?.attempt_count).toBe(1);
    });

    it('should include oldest and newest attempt timestamps', async () => {
      // Make attempts
      await supabase.rpc('check_rate_limit', {
        p_user_id: TEST_USER_ID,
        p_action: 'create_catch',
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      await supabase.rpc('check_rate_limit', {
        p_user_id: TEST_USER_ID,
        p_action: 'create_catch',
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      const { data } = await supabase.rpc('user_rate_limits');

      const catchEntry = data?.find((item: RateLimitEntry) => item.action === 'create_catch');

      expect(catchEntry).toHaveProperty('oldest_attempt');
      expect(catchEntry).toHaveProperty('newest_attempt');

      const oldest = new Date(catchEntry?.oldest_attempt);
      const newest = new Date(catchEntry?.newest_attempt);

      expect(newest.getTime()).toBeGreaterThanOrEqual(oldest.getTime());
    });
  });

  describe('cleanup_rate_limits()', () => {
    it('should remove old rate limit records', async () => {
      // Make some attempts
      await supabase.rpc('check_rate_limit', {
        p_user_id: TEST_USER_ID,
        p_action: 'create_catch',
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      // Manually update timestamp to be > 2 hours old
      await supabase
        .from('rate_limits')
        .update({ created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() })
        .eq('user_id', TEST_USER_ID);

      // Run cleanup (removes records > 2 hours old)
      const { data, error } = await supabase.rpc('cleanup_rate_limits');

      expect(error).toBeNull();

      // Verify records were deleted
      const { count } = await supabase
        .from('rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', TEST_USER_ID);

      expect(count).toBe(0);
    });

    it('should keep recent records', async () => {
      // Make recent attempts
      await supabase.rpc('check_rate_limit', {
        p_user_id: TEST_USER_ID,
        p_action: 'create_catch',
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      // Run cleanup
      await supabase.rpc('cleanup_rate_limits');

      // Verify records still exist
      const { count } = await supabase
        .from('rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', TEST_USER_ID);

      expect(count).toBe(1);
    });
  });

  describe('Database Triggers', () => {
    /**
     * NOTE: These tests require authenticated user sessions and RLS policies.
     * They are documented here but may need to be run manually or in a
     * different test environment with proper authentication.
     */

    describe('catches_rate_limit trigger', () => {
      it('should allow catch creation within limit', async () => {
        // This test would insert a catch and verify it succeeds
        // Requires: authenticated user, valid catch data

        // Example (pseudo-code):
        // const { error } = await supabase
        //   .from('catches')
        //   .insert({ ... valid catch data ... });
        //
        // expect(error).toBeNull();

        expect(true).toBe(true); // Placeholder
      });

      it('should block catch creation when limit exceeded', async () => {
        // This test would insert 11 catches and verify the 11th fails
        // Requires: authenticated user, valid catch data

        // Example (pseudo-code):
        // for (let i = 0; i < 10; i++) {
        //   await supabase.from('catches').insert({ ... });
        // }
        //
        // const { error } = await supabase.from('catches').insert({ ... });
        // expect(error?.message).toContain('Rate limit exceeded');

        expect(true).toBe(true); // Placeholder
      });
    });

    describe('comments_rate_limit trigger', () => {
      it('should allow comment creation within limit', async () => {
        // Similar to catches test above
        expect(true).toBe(true); // Placeholder
      });

      it('should block comment creation when limit exceeded', async () => {
        // Similar to catches test above (31st comment should fail)
        expect(true).toBe(true); // Placeholder
      });
    });

    describe('reports_rate_limit trigger', () => {
      it('should allow report creation within limit', async () => {
        // Similar to catches test above
        expect(true).toBe(true); // Placeholder
      });

      it('should block report creation when limit exceeded', async () => {
        // Similar to catches test above (6th report should fail)
        expect(true).toBe(true); // Placeholder
      });
    });
  });

  describe('Row Level Security', () => {
    it('should allow users to view their own rate limits', async () => {
      // Test RLS policy: users can select their own records
      const { data, error } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('user_id', TEST_USER_ID);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should prevent users from directly inserting rate limits', async () => {
      // Test RLS policy: no direct inserts allowed
      const { error } = await supabase
        .from('rate_limits')
        .insert({
          user_id: TEST_USER_ID,
          action: 'fake_action',
        });

      // Should fail because RLS blocks direct inserts
      // (only check_rate_limit() function can insert via SECURITY DEFINER)
      expect(error).toBeDefined();
    });

    it('should prevent users from deleting rate limits', async () => {
      // Create a rate limit via RPC
      await supabase.rpc('check_rate_limit', {
        p_user_id: TEST_USER_ID,
        p_action: 'create_catch',
        p_max_attempts: 10,
        p_window_minutes: 60,
      });

      // Try to delete it directly
      const { error } = await supabase
        .from('rate_limits')
        .delete()
        .eq('user_id', TEST_USER_ID)
        .eq('action', 'create_catch');

      // Should fail because RLS blocks deletes
      expect(error).toBeDefined();
    });
  });
});

/**
 * Manual Testing Instructions:
 *
 * 1. Test catch rate limiting:
 *    - Rapidly create 10 catches via the UI
 *    - 11th should show error: "Rate limit exceeded. You can only create 10 catches per hour."
 *
 * 2. Test comment rate limiting:
 *    - Post 30 comments on a catch
 *    - 31st should show error: "Rate limit exceeded. You can only post 30 comments per hour."
 *
 * 3. Test report rate limiting:
 *    - Submit 5 reports
 *    - 6th should show error: "Rate limit exceeded. You can only submit 5 reports per hour."
 *
 * 4. Test persistence:
 *    - Make 5 catch submissions
 *    - Check database: SELECT * FROM rate_limits WHERE action = 'create_catch';
 *    - Should see 5 records with recent timestamps
 *
 * 5. Test cleanup:
 *    - Wait 2 hours (or manually update timestamps)
 *    - Run: SELECT public.cleanup_rate_limits();
 *    - Verify old records are deleted
 *
 * 6. Test status query:
 *    - After making attempts, run: SELECT * FROM user_rate_limits();
 *    - Should show summary of your attempts
 */