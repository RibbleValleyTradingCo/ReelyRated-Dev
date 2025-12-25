import { useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
} from "@/lib/notifications";
import type { NotificationRow } from "@/lib/notifications-utils";
import { qk } from "@/lib/queryKeys";
import { logger } from "@/lib/logger";

interface UseNotificationsDataParams {
  limit?: number;
  enableRealtime?: boolean;
}

export const useNotificationsData = (
  userId: string | null | undefined,
  { limit = 50, enableRealtime = false }: UseNotificationsDataParams = {},
) => {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery<NotificationRow[]>({
    queryKey: qk.notificationsList(userId ?? null, limit),
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return [];
      return fetchNotifications(userId, limit);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
    placeholderData: (prev) => prev,
  });

  const markOneMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!userId) throw new Error("AUTH_REQUIRED");
      await markNotificationAsRead(notificationId, userId);
      return notificationId;
    },
    retry: false,
  });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("AUTH_REQUIRED");
      await markAllNotificationsAsRead(userId);
      return true;
    },
    retry: false,
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("AUTH_REQUIRED");
      const success = await clearAllNotifications(userId);
      if (!success) {
        throw new Error("CLEAR_FAILED");
      }
      return true;
    },
    retry: false,
  });

  useEffect(() => {
    if (!enableRealtime || !userId) return;

    const channel = supabase
      .channel(`notifications:user:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as NotificationRow;
          queryClient.setQueryData(
            qk.notificationsList(userId, limit),
            (prev?: NotificationRow[]) => {
              const current = prev ?? [];
              const existingIds = new Set(current.map((item) => item.id));
              if (existingIds.has(newNotification.id)) return current;
              return [newNotification, ...current].slice(0, limit);
            },
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enableRealtime, limit, queryClient, userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    await queryClient.invalidateQueries({ queryKey: qk.notificationsList(userId, limit) });
  }, [limit, queryClient, userId]);

  const markOne = useCallback(
    async (notificationId: string) => {
      if (!userId) return;
      try {
        const id = await markOneMutation.mutateAsync(notificationId);
        queryClient.setQueryData(
          qk.notificationsList(userId, limit),
          (prev?: NotificationRow[]) =>
            (prev ?? []).map((item) =>
              item.id === id
                ? { ...item, is_read: true, read_at: item.read_at ?? new Date().toISOString() }
                : item,
            ),
        );
      } catch (error) {
        logger.error("Failed to mark notification as read", error, { notificationId });
      }
    },
    [limit, markOneMutation, queryClient, userId],
  );

  const markAll = useCallback(async () => {
    if (!userId) return;
    try {
      await markAllMutation.mutateAsync();
      queryClient.setQueryData(
        qk.notificationsList(userId, limit),
        (prev?: NotificationRow[]) =>
          (prev ?? []).map((item) => ({
            ...item,
            is_read: true,
            read_at: item.read_at ?? new Date().toISOString(),
          })),
      );
      await queryClient.invalidateQueries({ queryKey: qk.notificationsList(userId, limit) });
    } catch (error) {
      logger.error("Failed to mark all notifications as read", error, { userId });
    }
  }, [limit, markAllMutation, queryClient, userId]);

  const clearAll = useCallback(async () => {
    if (!userId) return;
    try {
      await clearAllMutation.mutateAsync();
      queryClient.setQueryData(qk.notificationsList(userId, limit), []);
      await queryClient.invalidateQueries({ queryKey: qk.notificationsList(userId, limit) });
    } catch (error) {
      logger.error("Failed to clear notifications", error, { userId });
    }
  }, [clearAllMutation, limit, queryClient, userId]);

  return {
    notifications: notificationsQuery.data ?? [],
    isLoading: notificationsQuery.isLoading,
    refresh,
    markOne,
    markAll,
    clearAll,
  };
};
