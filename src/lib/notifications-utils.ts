import type { Database } from "@/integrations/supabase/types";
import { getProfilePath } from "@/lib/profile";

type DbNotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type NotificationType = DbNotificationRow["type"] | "comment_reply";
export type NotificationRow = Omit<DbNotificationRow, "type"> & { type: NotificationType };

type NotificationExtraData = {
  catch_id?: string;
  catchId?: string;
  comment_id?: string;
  commentId?: string;
  actor_username?: string;
  catch_title?: string;
  action?: string;
  [key: string]: unknown;
};

export const formatNotificationTimeShort = (timestamp: string | number | Date): string => {
  const now = Date.now();
  const value = new Date(timestamp).getTime();
  if (Number.isNaN(value)) return "";
  const diffMs = Math.max(0, now - value);
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return `${weeks > 0 ? weeks : days}w`;
};

export const resolveNotificationPath = (notification: NotificationRow): string | null => {
  if (notification.type === "admin_report") {
    return "/admin/reports";
  }

  const extraData = (notification.extra_data ?? {}) as NotificationExtraData;
  const catchTypes = new Set<NotificationRow["type"]>([
    "new_comment",
    "comment_reply",
    "mention",
    "new_reaction",
    "new_rating",
  ]);

  const catchIdFromExtra =
    (typeof extraData.catch_id === "string" && extraData.catch_id.length > 0
      ? extraData.catch_id
      : null) ??
    (typeof extraData.catchId === "string" && extraData.catchId.length > 0
      ? extraData.catchId
      : null);

  const commentIdFromExtra =
    (typeof extraData.comment_id === "string" && extraData.comment_id.length > 0
      ? extraData.comment_id
      : null) ??
    (typeof extraData.commentId === "string" && extraData.commentId.length > 0
      ? extraData.commentId
      : null);

  if (notification.type === "admin_moderation") {
    const action = typeof extraData.action === "string" ? extraData.action : null;
    if (action === "clear_moderation") {
      return `${getProfilePath({ id: notification.user_id })}#notifications`;
    }

    const targetCatchId = notification.catch_id ?? catchIdFromExtra;
    if (targetCatchId) {
      return `/catch/${targetCatchId}`;
    }

    const commentCatchId = catchIdFromExtra;
    if (commentCatchId) {
      return `/catch/${commentCatchId}`;
    }

    return getProfilePath({ id: notification.user_id });
  }

  if (notification.type === "admin_warning") {
    return `${getProfilePath({ id: notification.user_id })}#notifications`;
  }

  if (catchTypes.has(notification.type)) {
    const catchId = notification.catch_id ?? catchIdFromExtra;
    const commentId = notification.comment_id ?? commentIdFromExtra;
    if (catchId) {
      return commentId ? `/catch/${catchId}?commentId=${commentId}` : `/catch/${catchId}`;
    }
  }

  if (notification.actor_id) {
    const actorUsername =
      typeof extraData.actor_username === "string" ? extraData.actor_username : null;
    return getProfilePath({ username: actorUsername, id: notification.actor_id });
  }

  return null;
};
