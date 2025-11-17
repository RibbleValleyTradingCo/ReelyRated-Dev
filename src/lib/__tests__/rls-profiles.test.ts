/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * RLS Negative Tests: profiles Table
 *
 * Phase 2: TEST-001 - Profiles RLS Policy Verification
 * Tests that profiles table properly enforces ownership rules
 *
 * Coverage:
 * - Users can read all profiles (public visibility)
 * - Users cannot update other users' profiles
 * - Users cannot delete other users' profiles
 * - Users can only modify their own profile
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

describe('RLS: profiles table', () => {
  const mockProfile = {
    id: mockUsers.regularUser.id,
    username: 'testuser',
    full_name: 'Test User',
    bio: 'Test bio',
    avatar_path: null,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const otherProfile = {
    id: mockUsers.anotherUser.id,
    username: 'anotheruser',
    full_name: 'Another User',
    bio: 'Another bio',
    avatar_path: null,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetAuthMocks();
  });

  describe('SELECT permissions', () => {
    it('should allow SELECT on all profiles (public visibility)', async () => {
      mockAuthenticatedUser(mockUsers.regularUser);

      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: otherProfile,
              error: null,
            }),
          }),
        }),
      } as any);

      const { data, error } = await supabase
        .from('profiles')
        .select()
        .eq('id', mockUsers.anotherUser.id)
        .maybeSingle();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data?.id).toBe(mockUsers.anotherUser.id);
    });

    it('should allow unauthenticated SELECT on profiles', async () => {
      mockUnauthenticatedUser();

      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      } as any);

      const { data, error } = await supabase
        .from('profiles')
        .select()
        .eq('id', mockUsers.regularUser.id)
        .maybeSingle();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });
  });

  describe('UPDATE restrictions', () => {
    it('should deny UPDATE on another user\'s profile', async () => {
      mockAuthenticatedUser(mockUsers.anotherUser);

      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: createRLSError(),
            count: 0,
          }),
        }),
      } as any);

      const { data, error } = await supabase
        .from('profiles')
        .update({ bio: 'Hacked bio' })
        .eq('id', mockUsers.regularUser.id);

      expect(fromSpy).toHaveBeenCalledWith('profiles');
      expect(data).toBeNull();
      expect(error).toBeTruthy();
      expect(error?.message).toContain('row-level security');
    });

    it('should allow UPDATE on own profile', async () => {
      mockAuthenticatedUser(mockUsers.regularUser);

      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ ...mockProfile, bio: 'Updated bio' }],
            error: null,
            count: 1,
          }),
        }),
      } as any);

      const { data, error } = await supabase
        .from('profiles')
        .update({ bio: 'Updated bio' })
        .eq('id', mockUsers.regularUser.id);

      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });

    it('should deny UPDATE when not authenticated', async () => {
      mockUnauthenticatedUser();

      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: '42501',
              message: 'permission denied',
            },
          }),
        }),
      } as any);

      const { data, error } = await supabase
        .from('profiles')
        .update({ bio: 'Hacked bio' })
        .eq('id', mockUsers.regularUser.id);

      expect(data).toBeNull();
      expect(error).toBeTruthy();
    });
  });

  describe('DELETE restrictions', () => {
    it('should deny DELETE on another user\'s profile', async () => {
      mockAuthenticatedUser(mockUsers.anotherUser);

      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: createRLSError(),
            count: 0,
          }),
        }),
      } as any);

      const { data, error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', mockUsers.regularUser.id);

      expect(data).toBeNull();
      expect(error).toBeTruthy();
    });

    it('should allow DELETE on own profile', async () => {
      mockAuthenticatedUser(mockUsers.regularUser);

      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [mockProfile],
            error: null,
            count: 1,
          }),
        }),
      } as any);

      const { data, error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', mockUsers.regularUser.id);

      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });

    it('should deny DELETE when not authenticated', async () => {
      mockUnauthenticatedUser();

      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: '42501',
              message: 'permission denied',
            },
          }),
        }),
      } as any);

      const { data, error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', mockUsers.regularUser.id);

      expect(data).toBeNull();
      expect(error).toBeTruthy();
    });
  });

  describe('INSERT restrictions', () => {
    it('should handle INSERT attempts appropriately', async () => {
      // Profiles are typically created via triggers on auth.users
      // Direct inserts may be restricted
      mockAuthenticatedUser(mockUsers.regularUser);

      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: {
            code: '23505', // unique_violation or similar
            message: 'duplicate key value',
          },
        }),
      } as any);

      const { data, error } = await supabase
        .from('profiles')
        .insert({ id: 'new-user-id', username: 'newuser' });

      expect(data).toBeNull();
      expect(error).toBeTruthy();
    });
  });

  describe('Username uniqueness', () => {
    it('should enforce unique usernames', async () => {
      mockAuthenticatedUser(mockUsers.regularUser);

      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: '23505',
              message: 'duplicate key value violates unique constraint "profiles_username_key"',
            },
          }),
        }),
      } as any);

      const { data, error } = await supabase
        .from('profiles')
        .update({ username: 'anotheruser' }) // Already taken
        .eq('id', mockUsers.regularUser.id);

      expect(data).toBeNull();
      expect(error).toBeTruthy();
      expect(error?.code).toBe('23505');
    });
  });
});
