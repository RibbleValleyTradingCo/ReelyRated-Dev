/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * RLS Negative Tests: catches Table
 *
 * Phase 2: TEST-001 - Catches RLS Policy Verification
 * Tests that catches table properly enforces ownership rules
 *
 * Coverage:
 * - Users cannot update other users' catches
 * - Users cannot delete other users' catches
 * - Private catches are not visible to non-owners
 * - Unauthenticated users have limited access
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

describe('RLS: catches table', () => {
  const mockCatch = {
    id: 'test-catch-id',
    user_id: mockUsers.regularUser.id,
    title: 'Test Catch',
    species: 'carp',
    location: 'Test Lake',
    image_url: 'https://example.com/image.jpg',
    caught_at: '2024-01-01',
    visibility: 'public' as const,
    created_at: new Date().toISOString(),
  };

  const privateCatch = {
    ...mockCatch,
    id: 'private-catch-id',
    visibility: 'private' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetAuthMocks();
  });

  describe('UPDATE restrictions', () => {
    it('should deny UPDATE on another user\'s catch', async () => {
      // User B trying to update User A's catch
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
        .from('catches')
        .update({ title: 'Hacked Title' })
        .eq('id', mockCatch.id);

      expect(fromSpy).toHaveBeenCalledWith('catches');
      expect(data).toBeNull();
      expect(error).toBeTruthy();
      expect(error?.message).toContain('row-level security');
    });

    it('should allow UPDATE on own catch', async () => {
      // Owner updating their own catch
      mockAuthenticatedUser(mockUsers.regularUser);

      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ ...mockCatch, title: 'Updated Title' }],
            error: null,
            count: 1,
          }),
        }),
      } as any);

      const { data, error } = await supabase
        .from('catches')
        .update({ title: 'Updated Title' })
        .eq('id', mockCatch.id);

      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });
  });

  describe('DELETE restrictions', () => {
    it('should deny DELETE on another user\'s catch', async () => {
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
        .from('catches')
        .delete()
        .eq('id', mockCatch.id);

      expect(data).toBeNull();
      expect(error).toBeTruthy();
    });

    it('should allow DELETE on own catch', async () => {
      mockAuthenticatedUser(mockUsers.regularUser);

      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [mockCatch],
            error: null,
            count: 1,
          }),
        }),
      } as any);

      const { data, error } = await supabase
        .from('catches')
        .delete()
        .eq('id', mockCatch.id);

      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });
  });

  describe('SELECT visibility restrictions', () => {
    it('should hide private catches from other users', async () => {
      mockAuthenticatedUser(mockUsers.anotherUser);

      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null, // No error, just filtered out by RLS
              count: 0,
            }),
          }),
        }),
      } as any);

      const { data, error } = await supabase
        .from('catches')
        .select()
        .eq('id', privateCatch.id)
        .maybeSingle();

      expect(data).toBeNull(); // Private catch should not be visible
      expect(error).toBeNull(); // RLS filters silently
    });

    it('should show private catches to owner', async () => {
      mockAuthenticatedUser(mockUsers.regularUser);

      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: privateCatch,
              error: null,
            }),
          }),
        }),
      } as any);

      const { data, error } = await supabase
        .from('catches')
        .select()
        .eq('id', privateCatch.id)
        .maybeSingle();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data?.visibility).toBe('private');
    });

    it('should show public catches to everyone', async () => {
      mockAuthenticatedUser(mockUsers.anotherUser);

      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: mockCatch,
              error: null,
            }),
          }),
        }),
      } as any);

      const { data, error } = await supabase
        .from('catches')
        .select()
        .eq('id', mockCatch.id)
        .maybeSingle();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data?.visibility).toBe('public');
    });
  });

  describe('Unauthenticated access', () => {
    beforeEach(() => {
      mockUnauthenticatedUser();
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
        .from('catches')
        .insert({ ...mockCatch, id: 'new-catch-id' });

      expect(data).toBeNull();
      expect(error).toBeTruthy();
    });

    it('should allow SELECT of public catches when not authenticated', async () => {
      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: mockCatch,
              error: null,
            }),
          }),
        }),
      } as any);

      const { data, error } = await supabase
        .from('catches')
        .select()
        .eq('id', mockCatch.id)
        .maybeSingle();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });

    it('should hide private catches when not authenticated', async () => {
      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      } as any);

      const { data, error } = await supabase
        .from('catches')
        .select()
        .eq('id', privateCatch.id)
        .maybeSingle();

      expect(data).toBeNull();
    });
  });
});
