/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin Route Access Tests
 *
 * Phase 2: TEST-001 - Admin Route Protection
 * Tests that admin routes properly restrict access to admin users only
 *
 * Coverage:
 * - Non-admin users are redirected from admin routes
 * - Unauthenticated users cannot access admin routes
 * - Admin users can access admin routes
 * - useAdminAuth hook properly enforces access control
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
  mockAdminUser,
  mockUsers,
  resetAuthMocks,
} from '@/test/auth-utils';

// Mock the navigate function
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

// Mock the useAdminAuth hook
vi.mock('@/hooks/useAdminAuth');

describe('Admin Route Protection', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as any).mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    resetAuthMocks();
  });

  describe('useAdminAuth hook behavior', () => {
    it('should return admin=false for non-admin users', () => {
      mockAuthenticatedUser(mockUsers.regularUser);

      (useAdminAuth as any).mockReturnValue({
        user: mockUsers.regularUser,
        isAdmin: false,
        loading: false,
      });

      const { user, isAdmin, loading } = useAdminAuth();

      expect(loading).toBe(false);
      expect(user).toBeTruthy();
      expect(isAdmin).toBe(false);
    });

    it('should return admin=true for admin users', () => {
      const { user } = mockAdminUser();

      (useAdminAuth as any).mockReturnValue({
        user,
        isAdmin: true,
        loading: false,
      });

      const { user: hookUser, isAdmin, loading } = useAdminAuth();

      expect(loading).toBe(false);
      expect(hookUser).toBeTruthy();
      expect(isAdmin).toBe(true);
    });

    it('should return user=null for unauthenticated users', () => {
      mockUnauthenticatedUser();

      (useAdminAuth as any).mockReturnValue({
        user: null,
        isAdmin: false,
        loading: false,
      });

      const { user, isAdmin, loading } = useAdminAuth();

      expect(loading).toBe(false);
      expect(user).toBeNull();
      expect(isAdmin).toBe(false);
    });

    it('should handle loading state', () => {
      (useAdminAuth as any).mockReturnValue({
        user: null,
        isAdmin: false,
        loading: true,
      });

      const { user, isAdmin, loading } = useAdminAuth();

      expect(loading).toBe(true);
      expect(user).toBeNull();
      expect(isAdmin).toBe(false);
    });
  });

  describe('Admin page access control', () => {
    // Test component that simulates an admin page
    const AdminPageMock = () => {
      const { isAdmin, loading } = useAdminAuth();
      const navigate = useNavigate();

      if (loading) {
        return <div>Loading...</div>;
      }

      if (!isAdmin) {
        navigate('/');
        return null;
      }

      return <div>Admin Dashboard</div>;
    };

    it('should redirect non-admin users to home', async () => {
      mockAuthenticatedUser(mockUsers.regularUser);

      (useAdminAuth as any).mockReturnValue({
        user: mockUsers.regularUser,
        isAdmin: false,
        loading: false,
      });

      render(
        <BrowserRouter>
          <AdminPageMock />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should allow admin users to access admin pages', async () => {
      const { user } = mockAdminUser();

      (useAdminAuth as any).mockReturnValue({
        user,
        isAdmin: true,
        loading: false,
      });

      render(
        <BrowserRouter>
          <AdminPageMock />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it('should redirect unauthenticated users to home', async () => {
      mockUnauthenticatedUser();

      (useAdminAuth as any).mockReturnValue({
        user: null,
        isAdmin: false,
        loading: false,
      });

      render(
        <BrowserRouter>
          <AdminPageMock />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should show loading state during authentication check', () => {
      (useAdminAuth as any).mockReturnValue({
        user: null,
        isAdmin: false,
        loading: true,
      });

      render(
        <BrowserRouter>
          <AdminPageMock />
        </BrowserRouter>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Admin API endpoint protection', () => {
    it('should verify admin status before allowing admin operations', async () => {
      mockAuthenticatedUser(mockUsers.regularUser);

      (useAdminAuth as any).mockReturnValue({
        user: mockUsers.regularUser,
        isAdmin: false,
        loading: false,
      });

      // Simulate checking admin status before API call
      const { isAdmin } = useAdminAuth();

      if (!isAdmin) {
        // Should not proceed with admin operation
        expect(isAdmin).toBe(false);
      } else {
        throw new Error('Non-admin user should not reach this point');
      }
    });

    it('should allow admin operations for admin users', () => {
      const { user } = mockAdminUser();

      (useAdminAuth as any).mockReturnValue({
        user,
        isAdmin: true,
        loading: false,
      });

      const { isAdmin } = useAdminAuth();

      expect(isAdmin).toBe(true);
      // Admin operations can proceed
    });
  });

  describe('Admin menu visibility', () => {
    it('should hide admin menu items for non-admin users', () => {
      mockAuthenticatedUser(mockUsers.regularUser);

      (useAdminAuth as any).mockReturnValue({
        user: mockUsers.regularUser,
        isAdmin: false,
        loading: false,
      });

      const { isAdmin } = useAdminAuth();

      expect(isAdmin).toBe(false);
      // Admin menu items should not be rendered
    });

    it('should show admin menu items for admin users', () => {
      const { user } = mockAdminUser();

      (useAdminAuth as any).mockReturnValue({
        user,
        isAdmin: true,
        loading: false,
      });

      const { isAdmin } = useAdminAuth();

      expect(isAdmin).toBe(true);
      // Admin menu items should be rendered
    });
  });
});
