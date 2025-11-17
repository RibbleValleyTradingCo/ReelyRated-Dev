import type { Database } from "@/integrations/supabase/types";
import { getProfilePath } from "@/lib/profile";

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export const resolveNotificationPath = (notification: NotificationRow): string | null => {
  if (notification.type === "admin_report") {
    return "/admin/reports";
  }

  const extraData = (notification.extra_data ?? {}) as Record<string, unknown>;
  const catchTypes = new Set<NotificationRow["type"]>([
    "new_comment",
    "mention",
    "new_reaction",
    "new_rating",
  ]);

  if (catchTypes.has(notification.type) && notification.catch_id) {
    return `/catch/${notification.catch_id}`;
  }

  if (notification.actor_id) {
    const actorUsername =
      typeof extraData.actor_username === "string" ? extraData.actor_username : null;
    return getProfilePath({ username: actorUsername, id: notification.actor_id });
  }

  return null;
};
