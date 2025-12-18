/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Authentication Test Utilities
 *
 * Phase 2: TEST-001 - RLS & Auth Negative Tests
 * Provides utilities for mocking authentication states in tests
 */

import { vi } from "vitest";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type TestIdentity = {
  user_id: string;
  identity_id: string;
  id: string;
  provider: string;
  identity_data: Record<string, unknown>;
  created_at?: string;
  last_sign_in_at?: string | null;
};

interface TestUser extends User {
  email_change?: string | null;
  email_change_confirm_status?: string | number | null;
  email_change_sent_at?: string | null;
  phone_change?: string | null;
  phone_change_sent_at?: string | null;
  identities?: TestIdentity[];
}

const buildUser = (id: string, email: string, username: string): TestUser => ({
  id,
  app_metadata: {},
  aud: "authenticated",
  confirmation_sent_at: null,
  confirmed_at: null,
  email,
  email_change: "",
  email_change_confirm_status: 0,
  email_change_sent_at: null,
  email_confirmed_at: null,
  factors: [],
  identities: [
    {
      id,
      user_id: id,
      identity_id: `${id}-identity`,
      provider: "email",
      identity_data: {},
      created_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
    },
  ],
  invited_at: null,
  is_anonymous: false,
  last_sign_in_at: new Date().toISOString(),
  phone: "",
  phone_change: "",
  phone_change_sent_at: null,
  phone_confirmed_at: null,
  recovery_sent_at: null,
  role: "authenticated",
  updated_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  user_metadata: { username },
});

/**
 * Mock user data for testing
 */
export const mockUsers = {
  admin: buildUser("test-admin-user-id", "admin@test.com", "testadmin"),
  regularUser: buildUser("test-regular-user-id", "user@test.com", "testuser"),
  anotherUser: buildUser("test-another-user-id", "another@test.com", "anotheruser"),
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
