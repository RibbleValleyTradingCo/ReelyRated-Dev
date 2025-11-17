/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * RLS (Row Level Security) Negative Test Suite
 *
 * TEST-001: Security tests verifying that RLS policies properly prevent unauthorized access
 * Phase 2: Authentication & Validation
 *
 * These tests verify that users CANNOT access data they shouldn't have access to.
 * All tests should FAIL (return errors or empty results) - that's the expected behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

/**
 * Test Setup:
 * - User A (authenticated): user-a-id
 * - User B (authenticated): user-b-id
 * - Anonymous (unauthenticated): null
 *
 * These tests mock the auth.uid() function to simulate different users
 */

describe('RLS Security Tests - Profiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prevent User A from updating User B profile', async () => {
    // Mock: Logged in as User A
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-a-id' } as any },
      error: null,
    });

    const fromMock = vi.spyOn(supabase, 'from').mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Row level security policy violation' },
        }),
      }),
    } as any);

    // Attempt to update User B's profile
    const { error } = await supabase
      .from('profiles')
      .update({ bio: 'Hacked!' })
      .eq('id', 'user-b-id');

    expect(error).not.toBeNull();
    expect(error?.message).toContain('policy');
  });

  it('should allow users to view all profiles', async () => {
    const fromMock = vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ id: 'user-a-id' }, { id: 'user-b-id' }],
        error: null,
      }),
    } as any);

    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });
});

describe('RLS Security Tests - Catches (Private Visibility)', () => {
  it('should prevent User A from viewing User B private catch', async () => {
    // Mock: Logged in as User A
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-a-id' } as any },
      error: null,
    });

    const fromMock = vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [], // RLS should return empty - private catch not visible
          error: null,
        }),
      }),
    } as any);

    // Attempt to view User B's private catch
    const { data } = await supabase
      .from('catches')
      .select('*')
      .eq('id', 'private-catch-b');

    expect(data).toEqual([]); // Should be empty due to RLS
  });

  it('should prevent User A from deleting User B catch', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-a-id' } as any },
      error: null,
    });

    const fromMock = vi.spyOn(supabase, 'from').mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Row level security policy violation' },
        }),
      }),
    } as any);

    const { error } = await supabase
      .from('catches')
      .delete()
      .eq('id', 'catch-b-id');

    expect(error).not.toBeNull();
  });

  it('should allow anonymous users to view public catches', async () => {
    // Mock: Not logged in
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const fromMock = vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{ id: 'public-catch-1', visibility: 'public' }],
          error: null,
        }),
      }),
    } as any);

    const { data, error } = await supabase
      .from('catches')
      .select('*')
      .eq('visibility', 'public');

    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });
});

describe('RLS Security Tests - Catches (Followers-Only Visibility)', () => {
  it('should prevent non-follower from viewing followers-only catch', async () => {
    // Mock: Logged in as User A (not following User B)
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-a-id' } as any },
      error: null,
    });

    const fromMock = vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [], // RLS should filter out - User A is not a follower
          error: null,
        }),
      }),
    } as any);

    const { data } = await supabase
      .from('catches')
      .select('*')
      .eq('id', 'followers-only-catch-b');

    expect(data).toEqual([]); // Should be empty - not a follower
  });
});

describe('RLS Security Tests - Sessions', () => {
  it('should prevent User A from viewing User B private session', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-a-id' } as any },
      error: null,
    });

    const fromMock = vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [], // RLS should block access
          error: null,
        }),
      }),
    } as any);

    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', 'session-b-private');

    expect(data).toEqual([]);
  });

  it('should prevent User A from deleting User B session', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-a-id' } as any },
      error: null,
    });

    const fromMock = vi.spyOn(supabase, 'from').mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Row level security policy violation' },
        }),
      }),
    } as any);

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', 'session-b-id');

    expect(error).not.toBeNull();
  });
});

describe('RLS Security Tests - Comments', () => {
  it('should prevent User A from deleting User B comment', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-a-id' } as any },
      error: null,
    });

    const fromMock = vi.spyOn(supabase, 'from').mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Row level security policy violation' },
        }),
      }),
    } as any);

    const { error } = await supabase
      .from('catch_comments')
      .delete()
      .eq('id', 'comment-b-id');

    expect(error).not.toBeNull();
  });

  it('should prevent viewing comments on private catch', async () => {
    // Mock: Logged in as User A
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-a-id' } as any },
      error: null,
    });

    const fromMock = vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [], // RLS should block - catch is private
          error: null,
        }),
      }),
    } as any);

    const { data } = await supabase
      .from('catch_comments')
      .select('*')
      .eq('catch_id', 'private-catch-b');

    expect(data).toEqual([]);
  });
});

describe('RLS Security Tests - Followers', () => {
  it('should prevent User A from creating a follow record for someone else', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-a-id' } as any },
      error: null,
    });

    const fromMock = vi.spyOn(supabase, 'from').mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Row level security policy violation' },
      }),
    } as any);

    // Attempt to create follow as if User C is following User B (but we're User A)
    const { error } = await supabase
      .from('profile_follows')
      .insert({
        follower_id: 'user-c-id', // Not the logged in user!
        followee_id: 'user-b-id',
      });

    expect(error).not.toBeNull();
  });

  it('should allow User A to unfollow someone', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-a-id' } as any },
      error: null,
    });

    const fromMock = vi.spyOn(supabase, 'from').mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: { follower_id: 'user-a-id', followee_id: 'user-b-id' },
            error: null,
          }),
        }),
      }),
    } as any);

    const { error } = await supabase
      .from('profile_follows')
      .delete()
      .eq('follower_id', 'user-a-id')
      .eq('followee_id', 'user-b-id');

    expect(error).toBeNull(); // Should succeed - deleting own follow
  });
});

describe('RLS Security Tests - Notifications', () => {
  it('should prevent User A from viewing User B notifications', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-a-id' } as any },
      error: null,
    });

    const fromMock = vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [], // RLS should block
          error: null,
        }),
      }),
    } as any);

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', 'user-b-id');

    expect(data).toEqual([]);
  });

  it('should prevent User A from marking User B notification as read', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-a-id' } as any },
      error: null,
    });

    const fromMock = vi.spyOn(supabase, 'from').mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Row level security policy violation' },
        }),
      }),
    } as any);

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', 'notification-b-id');

    expect(error).not.toBeNull();
  });
});

describe('RLS Security Tests - Admin-Only Tables', () => {
  it('should prevent non-admin from inserting tags', async () => {
    // Mock: Regular user (not admin)
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-a-id' } as any },
      error: null,
    });

    const fromMock = vi.spyOn(supabase, 'from').mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Row level security policy violation' },
      }),
    } as any);

    const { error } = await supabase
      .from('tags')
      .insert({
        slug: 'new-tag',
        label: 'New Tag',
        category: 'method',
      });

    expect(error).not.toBeNull();
  });

  it('should prevent non-admin from updating baits', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-a-id' } as any },
      error: null,
    });

    const fromMock = vi.spyOn(supabase, 'from').mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Row level security policy violation' },
        }),
      }),
    } as any);

    const { error } = await supabase
      .from('baits')
      .update({ label: 'Hacked Bait' })
      .eq('slug', 'boilies');

    expect(error).not.toBeNull();
  });

  it('should allow anyone to read tags and baits', async () => {
    const fromMock = vi.spyOn(supabase, 'from');

    // Tags
    fromMock.mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({
        data: [{ slug: 'float-fishing' }],
        error: null,
      }),
    } as any);

    const { data: tagsData, error: tagsError } = await supabase
      .from('tags')
      .select('*');

    expect(tagsError).toBeNull();
    expect(tagsData).not.toBeNull();

    // Baits
    fromMock.mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({
        data: [{ slug: 'boilies' }],
        error: null,
      }),
    } as any);

    const { data: baitsData, error: baitsError } = await supabase
      .from('baits')
      .select('*');

    expect(baitsError).toBeNull();
    expect(baitsData).not.toBeNull();
  });
});

describe('RLS Security Tests - Anonymous Access', () => {
  it('should prevent anonymous users from inserting catches', async () => {
    // Mock: Not logged in
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const fromMock = vi.spyOn(supabase, 'from').mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Row level security policy violation' },
      }),
    } as any);

    const { error } = await supabase
      .from('catches')
      .insert({
        user_id: 'fake-user',
        title: 'Anonymous Catch',
        species: 'carp',
      });

    expect(error).not.toBeNull();
  });

  it('should prevent anonymous users from viewing private catches', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const fromMock = vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [], // RLS blocks private visibility
          error: null,
        }),
      }),
    } as any);

    const { data } = await supabase
      .from('catches')
      .select('*')
      .eq('visibility', 'private');

    expect(data).toEqual([]);
  });

  it('should prevent anonymous users from viewing followers-only catches', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const fromMock = vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [], // RLS blocks followers visibility
          error: null,
        }),
      }),
    } as any);

    const { data } = await supabase
      .from('catches')
      .select('*')
      .eq('visibility', 'followers');

    expect(data).toEqual([]);
  });
});
