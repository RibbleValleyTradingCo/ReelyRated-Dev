/**
 * DEV-ONLY helper for verifying notification RPC wiring.
 * Import and call manually in a local console; do not ship in production UI.
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export const sendTestNotification = async (userId: string | null | undefined) => {
  if (!userId) {
    logger.warn("[notifications-debug] Cannot send test notification without a user ID");
    return;
  }

  const message = "Dev helper notification";

  const { data, error } = await supabase.rpc("create_notification", {
    p_user_id: userId,
    p_actor_id: userId,
    p_type: "new_follower",
    p_message: message,
    p_catch_id: null,
    p_comment_id: null,
    p_extra_data: null,
  });

  if (error) {
    logger.error("[notifications-debug] RPC failed", error);
    return;
  }

  logger.info("[notifications-debug] create_notification result", { data });

  const { data: recent, error: fetchError } = await supabase
    .from("notifications")
    .select("id, user_id, actor_id, type, message, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (fetchError) {
    logger.error("[notifications-debug] Fetch failed", fetchError);
  } else {
    logger.info("[notifications-debug] Recent notifications", { recent });
  }
};
