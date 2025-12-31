import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isAdminUser } from "@/lib/admin";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { qk } from "@/lib/queryKeys";

const PAGE_SIZE = 18;

type CustomFields = {
  species?: string;
  method?: string;
};

type CatchConditions = {
  customFields?: CustomFields;
  gps?: {
    lat: number;
    lng: number;
    accuracy?: number;
    label?: string;
  };
  [key: string]: unknown;
} | null;

export interface FeedCatch {
  id: string;
  title: string;
  image_url: string;
  user_id: string;
  location: string | null;
  species: string | null;
  weight: number | null;
  weight_unit: string | null;
  created_at: string;
  visibility: string | null;
  hide_exact_spot: boolean | null;
  session_id: string | null;
  profiles: {
    username: string;
    avatar_path: string | null;
    avatar_url: string | null;
  };
  ratings: { rating: number }[];
  comments: { id: string }[];
  reactions: { user_id: string }[] | null;
  conditions: CatchConditions;
  avg_rating?: number | null;
  rating_count?: number | null;
  venues?: {
    id?: string;
    slug: string;
    name: string;
  } | null;
}

export type FeedScope = "all" | "following";

type VenueFilter = {
  id: string;
  name: string;
  slug: string;
} | null;

interface UseFeedDataParams {
  userId: string | undefined;
  venueSlug: string | null;
  sessionFilter: string | null;
  feedScope: FeedScope;
  speciesFilter: string;
  customSpeciesFilter: string;
  sortBy: string;
}

interface UseFeedDataResult {
  catches: FeedCatch[];
  filteredCatches: FeedCatch[];
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  venueFilter: VenueFilter;
  venueFilterError: boolean;
  isAdmin: boolean;
}

export const useFeedData = ({
  userId,
  venueSlug,
  sessionFilter,
  feedScope,
  speciesFilter,
  customSpeciesFilter,
  sortBy,
}: UseFeedDataParams): UseFeedDataResult => {
  const [venueFilter, setVenueFilter] = useState<VenueFilter>(null);
  const [venueFilterError, setVenueFilterError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!venueSlug) {
      setVenueFilter(null);
      setVenueFilterError(false);
      return;
    }

    let active = true;
    const loadVenue = async () => {
      setVenueFilterError(false);
      const { data, error } = await supabase
        .from("venues")
        .select("id, name, slug")
        .eq("slug", venueSlug)
        .maybeSingle();

      if (!active) return;

      if (error || !data) {
        setVenueFilter(null);
        setVenueFilterError(true);
      } else {
        setVenueFilter(data as { id: string; name: string; slug: string });
      }
    };

    void loadVenue();

    return () => {
      active = false;
    };
  }, [venueSlug]);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }

    let active = true;
    const loadAdmin = async () => {
      try {
        const adminStatus = await isAdminUser(userId);
        if (active) setIsAdmin(adminStatus);
      } catch {
        if (active) setIsAdmin(false);
      }
    };
    void loadAdmin();

    return () => {
      active = false;
    };
  }, [userId]);

  const resolvedCustomSpecies =
    speciesFilter === "other" && customSpeciesFilter.trim()
      ? customSpeciesFilter.trim()
      : null;

  const feedKeyParams = useMemo(
    () => ({
      scope: feedScope,
      filter: speciesFilter,
      customSpecies: resolvedCustomSpecies,
      venueId: venueFilter?.id ?? null,
      userId: userId ?? null,
      sort: sortBy,
      sessionId: sessionFilter ?? null,
    }),
    [
      feedScope,
      speciesFilter,
      resolvedCustomSpecies,
      venueFilter?.id,
      userId,
      sortBy,
      sessionFilter,
    ]
  );

  const feedEnabled =
    Boolean(userId) && (!venueSlug || Boolean(venueFilter)) && !venueFilterError;

  const feedQuery = useInfiniteQuery<FeedCatch[]>({
    queryKey: qk.feed(feedKeyParams),
    enabled: feedEnabled,
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase.rpc("get_feed_catches", {
        p_limit: PAGE_SIZE,
        p_offset: pageParam,
        p_scope: feedScope,
        p_sort: sortBy,
        p_species: speciesFilter,
        p_custom_species: resolvedCustomSpecies,
        p_venue_id: venueFilter?.id ?? null,
        p_session_id: sessionFilter ?? null,
      });

      if (error) {
        const message = pageParam ? "Unable to load more catches" : "Failed to load catches";
        toast.error(message);
        logger.error("Failed to load catches", error, { userId });
        return [];
      }

      const rows = (data ?? []) as FeedCatch[];
      return rows.map((row) => ({
        ...row,
        profiles: row.profiles ?? { username: "Unknown", avatar_path: null, avatar_url: null },
        ratings: Array.isArray(row.ratings) ? row.ratings : [],
        comments: Array.isArray(row.comments) ? row.comments : [],
        reactions: Array.isArray(row.reactions) ? row.reactions : [],
      }));
    },
    getNextPageParam: (lastPage, allPages) => {
      if (sessionFilter) return undefined;
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      const loadedCount = allPages.reduce((acc, page) => acc + page.length, 0);
      return loadedCount;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const catches = useMemo(() => {
    if (!userId || venueFilterError) return [];
    const pages = feedQuery.data?.pages ?? [];
    const map = new Map<string, FeedCatch>();
    pages.forEach((page) => {
      page.forEach((row) => {
        if (!map.has(row.id)) {
          map.set(row.id, row);
        }
      });
    });
    return Array.from(map.values());
  }, [feedQuery.data, userId, venueFilterError]);

  const filteredCatches = useMemo(() => {
    if (!userId || venueFilterError) return [];
    return catches;
  }, [catches, userId, venueFilterError]);

  const waitingOnVenue =
    Boolean(userId && venueSlug && !venueFilter && !venueFilterError);
  const isLoading = Boolean(userId) && (waitingOnVenue || feedQuery.isLoading);

  const loadMore = useCallback(() => {
    if (!feedEnabled || sessionFilter) return;
    if (!feedQuery.hasNextPage || feedQuery.isFetchingNextPage) return;
    void feedQuery.fetchNextPage();
  }, [feedEnabled, sessionFilter, feedQuery]);

  return {
    catches,
    filteredCatches,
    isLoading,
    isFetchingMore: feedQuery.isFetchingNextPage,
    hasMore: Boolean(feedQuery.hasNextPage),
    loadMore,
    venueFilter,
    venueFilterError,
    isAdmin,
  };
};
