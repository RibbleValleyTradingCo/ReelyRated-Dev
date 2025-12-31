import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if a user is an admin by querying the admin_users table.
 * This is a server-side check enforced by RLS policies.
 *
 * @param userId - The user ID to check
 * @returns Promise<boolean> - True if user is admin, false otherwise
 */
export const isAdminUser = async (userId?: string | null): Promise<boolean> => {
  if (!userId) return false;

  // Query database
  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  const isAdmin = !error && !!data;

  return isAdmin;
};
