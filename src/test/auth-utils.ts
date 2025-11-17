/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Authentication Test Utilities
 *
 * Phase 2: TEST-001 - RLS & Auth Negative Tests
 * Provides utilities for mocking authentication states in tests
 */

import { vi } from 'vitest';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Mock user data for testing
 */
export const mockUsers = {
  admin: {
    id: 'test-admin-user-id',
    email: 'admin@test.com',
    user_metadata: {
      username: 'testadmin',
    },
  } as User,

  regularUser: {
    id: 'test-regular-user-id',
    email: 'user@test.com',
    user_metadata: {
      username: 'testuser',
    },
  } as User,

  anotherUser: {
    id: 'test-another-user-id',
    email: 'another@test.com',
    user_metadata: {
      username: 'anotheruser',
    },
  } as User,
};

/**
 * Create a mock session for a user
 */
export function createMockSession(user: User): Session {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Date.now() / 1000 + 3600,
    token_type: 'bearer',
    user,
  };
}

/**
 * Mock Supabase auth to return an authenticated user
 */
export function mockAuthenticatedUser(user: User = mockUsers.regularUser) {
  const session = createMockSession(user);

  vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
    data: { session },
    error: null,
  });

  vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
    data: { user },
    error: null,
  });

  return { user, session };
}

/**
 * Mock Supabase auth to return no authenticated user
 */
export function mockUnauthenticatedUser() {
  vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
    data: { session: null },
    error: null,
  });

  vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
    data: { user: null },
    error: null,
  });
}

/**
 * Mock an admin user (requires admin_users table entry)
 */
export function mockAdminUser() {
  const adminUser = mockUsers.admin;
  const session = createMockSession(adminUser);

  vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
    data: { session },
    error: null,
  });

  vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
    data: { user: adminUser },
    error: null,
  });

  // Mock admin_users table check
  vi.spyOn(supabase.from('admin_users'), 'select').mockReturnValue({
    eq: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
        data: { user_id: adminUser.id },
        error: null,
      }),
    }),
  } as any);

  return { user: adminUser, session };
}

/**
 * Create a mock database error for RLS violations
 */
export function createRLSError() {
  return {
    code: '42501', // PostgreSQL insufficient_privilege error
    message: 'new row violates row-level security policy',
    details: null,
    hint: null,
  };
}

/**
 * Create a mock database error for permission denied
 */
export function createPermissionDeniedError() {
  return {
    code: 'PGRST301',
    message: 'permission denied for table',
    details: null,
    hint: null,
  };
}

/**
 * Reset all auth mocks
 */
export function resetAuthMocks() {
  vi.restoreAllMocks();
}
