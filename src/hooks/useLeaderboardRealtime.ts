import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  id: string;
  user_id: string | null;
  owner_username: string | null;
  title: string | null;
  species_slug: string | null;
  species: string | null;
  weight: number | null;
  weight_unit: string | null;
  length: number | null;
  length_unit: string | null;
  image_url: string | null;
  total_score: number | null;
  avg_rating: number | null;
  rating_count: number | null;
  location_label: string | null;
  method_tag: string | null;
  method: string | null;
  caught_at: string | null;
  is_blocked_from_viewer?: boolean | null;
}

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeEntries = (entries: LeaderboardEntry[] | null | undefined) =>
  (entries ?? []).map((entry) => ({
    ...entry,
    total_score: toNumber(entry.total_score),
    avg_rating: toNumber(entry.avg_rating),
    rating_count: toNumber(entry.rating_count),
    weight: toNumber(entry.weight),
    length: toNumber(entry.length),
  }));

type UseLeaderboardRealtimeOptions = {
  enableRealtime?: boolean;
  refreshIntervalMs?: number;
};

export function useLeaderboardRealtime(
  selectedSpecies: string | null = null,
  limit = 50,
  options: UseLeaderboardRealtimeOptions = {},
) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { enableRealtime = true, refreshIntervalMs } = options;

  const speciesFilter = useMemo(
    () => (selectedSpecies ? selectedSpecies : null),
    [selectedSpecies],
  );

  const fetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLeaderboard = useCallback(
    async (isBackground = false) => {
      if (!isBackground) {
        setLoading(true);
      }

      try {
        if (speciesFilter) {
          const { data, error: queryError } = await supabase.rpc("get_leaderboard_scores", {
            p_species_slug: speciesFilter,
            p_limit: limit,
          });

          if (queryError) {
            setError(queryError.message);
            console.error("Leaderboard fetch error:", queryError);
            return;
          }

          const filtered = (data ?? []).filter(
            (entry) => !entry.is_blocked_from_viewer,
          );

          setEntries(normalizeEntries(filtered));
        } else {
          const { data, error: queryError } = await supabase
            .from("leaderboard_scores_detailed")
            .select(
              "id, user_id, owner_username, title, species_slug, species, weight, weight_unit, length, length_unit, image_url, total_score, avg_rating, rating_count, location_label, method_tag, method, caught_at",
            )
            .eq("is_blocked_from_viewer", false)
            .order("total_score", { ascending: false })
            .order("created_at", { ascending: true })
            .order("id", { ascending: true })
            .limit(limit);

          if (queryError) {
            setError(queryError.message);
            console.error("Leaderboard fetch error:", queryError);
            return;
          }

          setEntries(normalizeEntries(data));
        }
        setError(null);
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
        setError("Failed to fetch leaderboard");
      } finally {
        if (!isBackground) {
          setLoading(false);
        }
      }
    },
    [speciesFilter, limit],
  );

  useEffect(() => {
    void fetchLeaderboard(false);
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (!enableRealtime) return;

    const channel = supabase
      .channel("leaderboard_catches_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "catches",
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setEntries((prev) => prev.filter((entry) => entry.id !== payload.old?.id));
          }

          if (fetchRef.current) {
            clearTimeout(fetchRef.current);
          }

          fetchRef.current = setTimeout(() => {
            void fetchLeaderboard(true);
          }, 150);
        },
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          console.warn("Leaderboard realtime subscription status:", status);
        }
      });

    return () => {
      if (fetchRef.current) {
        clearTimeout(fetchRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard, enableRealtime]);

  useEffect(() => {
    if (enableRealtime || !refreshIntervalMs) return;

    let interval: number | null = null;

    const startInterval = () => {
      if (interval !== null) return;
      interval = window.setInterval(() => {
        void fetchLeaderboard(true);
      }, refreshIntervalMs);
    };

    const stopInterval = () => {
      if (interval === null) return;
      window.clearInterval(interval);
      interval = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopInterval();
        return;
      }
      startInterval();
      void fetchLeaderboard(true);
    };

    if (document.visibilityState !== "hidden") {
      startInterval();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchLeaderboard, enableRealtime, refreshIntervalMs]);

  return { entries, loading, error };
}

export type { LeaderboardEntry };
