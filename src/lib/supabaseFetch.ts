import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

interface FetchListParams<T> {
  table: string;
  select: string;
  buildQuery?: (query: ReturnType<typeof supabase.from<T>>) => ReturnType<typeof supabase.from<T>>;
}

export async function fetchList<T = any>({ table, select, buildQuery }: FetchListParams<T>) {
  try {
    let query = supabase.from(table).select(select);
    if (buildQuery) {
      query = buildQuery(query);
    }
    const { data, error } = await query;
    return { data: (data as T[] | null) ?? null, error };
  } catch (err) {
    logger.error("Supabase fetch failed", err, { table, select });
    return { data: null, error: { message: err instanceof Error ? err.message : "Unknown error" } };
  }
}
