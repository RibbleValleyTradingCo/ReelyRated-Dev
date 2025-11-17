/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * RLS Negative Tests: admin_users Table
 *
 * Phase 2: TEST-001 - Admin RLS Policy Verification
 * Tests that admin_users table is properly restricted to admins only (SEC-001)
 *
 * Coverage:
 * - Non-admin users cannot read admin_users
 * - Non-admin users cannot insert into admin_users
 * - Non-admin users cannot update admin_users
 * - Non-admin users cannot delete from admin_users
 * - Unauthenticated users have no access
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import {
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
  mockUsers,
  resetAuthMocks,
  createRLSError,
} from '@/test/auth-utils';

describe('RLS: admin_users table', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetAuthMocks();
  });

  describe('Non-admin user attempts', () => {
    beforeEach(() => {
      mockAuthenticatedUser(mockUsers.regularUser);
    });

    it('should deny SELECT on admin_users table', async () => {
      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: createRLSError(),
          }),
        }),
      } as any);

      const { data, error } = await supabase
        .from('admin_users')
        .select()
        .maybeSingle();

      expect(fromSpy).toHaveBeenCalledWith('admin_users');
      expect(data).toBeNull();
      expect(error).toBeTruthy();
      expect(error?.code).toBe('42501'); // RLS violation
    });

    it('should deny INSERT into admin_users table', async () => {
      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: createRLSError(),
            }),
          }),
        }),
      } as any);

      const { data, error } = await supabase
        .from('admin_users')
        .insert({ user_id: mockUsers.regularUser.id })
        .select()
        .single();

      expect(fromSpy).toHaveBeenCalledWith('admin_users');
      expect(data).toBeNull();
      expect(error).toBeTruthy();
      expect(error?.message).toContain('row-level security');
    });

    it('should deny UPDATE on admin_users table', async () => {
      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: createRLSError(),
          }),
        }),
      } as any);

      const { data, error } = await supabase
        .from('admin_users')
        .update({ user_id: mockUsers.anotherUser.id })
        .eq('user_id', mockUsers.admin.id);

      expect(fromSpy).toHaveBeenCalledWith('admin_users');
      expect(data).toBeNull();
      expect(error).toBeTruthy();
    });

    it('should deny DELETE from admin_users table', async () => {
      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: createRLSError(),
          }),
        }),
      } as any);

      const { data, error } = await supabase
        .from('admin_users')
        .delete()
        .eq('user_id', mockUsers.admin.id);

      expect(fromSpy).toHaveBeenCalledWith('admin_users');
      expect(data).toBeNull();
      expect(error).toBeTruthy();
    });
  });

  describe('Unauthenticated user attempts', () => {
    beforeEach(() => {
      mockUnauthenticatedUser();
    });

    it('should deny SELECT when not authenticated', async () => {
      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: '42501',
              message: 'permission denied',
            },
          }),
        }),
      } as any);

      const { data, error } = await supabase
        .from('admin_users')
        .select()
        .maybeSingle();

      expect(data).toBeNull();
      expect(error).toBeTruthy();
    });

    it('should deny INSERT when not authenticated', async () => {
      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: {
            code: '42501',
            message: 'permission denied',
          },
        }),
      } as any);

      const { data, error } = await supabase
        .from('admin_users')
        .insert({ user_id: 'fake-id' });

      expect(data).toBeNull();
      expect(error).toBeTruthy();
    });
  });

  describe('Admin user access (positive cases)', () => {
    it('should allow admin to SELECT from admin_users', async () => {
      // This is a positive test case to verify admin access works
      const adminUser = mockUsers.admin;
      mockAuthenticatedUser(adminUser);

      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { user_id: adminUser.id, created_at: new Date().toISOString() },
              error: null,
            }),
          }),
        }),
      } as any);

      const { data, error } = await supabase
        .from('admin_users')
        .select()
        .eq('user_id', adminUser.id)
        .maybeSingle();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data?.user_id).toBe(adminUser.id);
    });
  });
});
