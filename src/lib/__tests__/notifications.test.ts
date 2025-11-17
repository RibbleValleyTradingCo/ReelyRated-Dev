import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { createNotification } from '@/lib/notifications';

describe('createNotification', () => {
  const rpcMock = vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: 'new-id', error: null });

  beforeEach(() => {
    rpcMock.mockClear();
  });

  it('invokes Supabase RPC with expected payload', async () => {
    await createNotification({
      userId: 'target-user',
      type: 'new_comment',
      payload: {
        message: 'Bob commented on your catch',
        catchId: 'catch-1',
        commentId: 'comment-1',
      },
    });

    expect(rpcMock).toHaveBeenCalledWith('create_notification', {
      p_user_id: 'target-user',
      p_actor_id: null,
      p_type: 'new_comment',
      p_message: 'Bob commented on your catch',
      p_catch_id: 'catch-1',
      p_comment_id: 'comment-1',
      p_extra_data: null,
    });
  });

  it('serialises extra data when provided', async () => {
    await createNotification({
      userId: 'target-user',
      type: 'new_rating',
      payload: {
        message: 'Rating added',
        catchId: 'catch-2',
        extraData: { rating: 8 },
      },
    });

    expect(rpcMock).toHaveBeenCalledWith('create_notification', expect.objectContaining({
      p_extra_data: { rating: 8 },
    }));
  });

  it('skips when message missing', async () => {
    await createNotification({
      userId: 'target-user',
      type: 'new_comment',
      payload: { message: '' },
    });

    expect(rpcMock).not.toHaveBeenCalled();
  });
});
