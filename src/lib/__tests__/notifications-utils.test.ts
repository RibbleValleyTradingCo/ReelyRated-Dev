import { describe, it, expect } from 'vitest';
import { resolveNotificationPath, type NotificationRow } from '@/lib/notifications-utils';

const baseNotification = (overrides: Partial<NotificationRow> = {}): NotificationRow => ({
  id: 'notif-1',
  user_id: 'user-1',
  actor_id: 'actor-1',
  type: 'new_comment',
  catch_id: 'catch-1',
  comment_id: null,
  extra_data: null,
  deleted_at: null,
  is_read: false,
  read_at: null,
  created_at: new Date().toISOString(),
  message: 'Test notification',
  ...overrides,
});

describe('resolveNotificationPath', () => {
  it('returns admin reports path for admin notifications', () => {
    const notification = baseNotification({ type: 'admin_report' });
    expect(resolveNotificationPath(notification)).toBe('/admin/reports');
  });

  it('returns catch path for catch-related notifications', () => {
    const notification = baseNotification({
      type: 'new_comment',
      catch_id: 'catch-123',
    });
    expect(resolveNotificationPath(notification)).toBe('/catch/catch-123');
  });

  it('falls back to actor profile path when catch id missing', () => {
    const notification = baseNotification({
      type: 'new_follower',
      catch_id: null,
      extra_data: { actor_username: 'angler_jane' } as NotificationRow['extra_data'],
    });
    expect(resolveNotificationPath(notification)).toBe('/profile/angler_jane');
  });
});
