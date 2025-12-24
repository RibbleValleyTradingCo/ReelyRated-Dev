import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { isAdminUser } from "@/lib/admin";
import { getVenueRatingCache, setVenueRatingCache } from "@/lib/venueCache";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  CatchRow,
  Venue,
  VenueEvent,
  VenueOpeningHour,
  VenuePhoto,
  VenuePricingTier,
} from "../types";
import { normalizeCatchRow } from "../utils";

const VENUE_STALE_MS = 60_000;
const RATING_STALE_MS = 60_000;

type UseVenueDetailDataResult = {
  user: ReturnType<typeof useAuth>["user"];
  debugVenue: boolean;
  venue: Venue | null;
  venueLoading: boolean;
  topCatches: CatchRow[];
  topLoading: boolean;
  recentCatches: CatchRow[];
  recentLoading: boolean;
  recentHasMore: boolean;
  upcomingEvents: VenueEvent[];
  eventsLoading: boolean;
  pastEvents: VenueEvent[];
  pastEventsLoading: boolean;
  pastHasMore: boolean;
  showPastEvents: boolean;
  photos: VenuePhoto[];
  photosLoading: boolean;
  openingHours: VenueOpeningHour[];
  pricingTiers: VenuePricingTier[];
  rulesText: string | null;
  operationalLoading: boolean;
  avgRating: number | null;
  ratingCount: number | null;
  userRating: number | null;
  userRatingResolved: boolean;
  ratingLoading: boolean;
  ratingModalOpen: boolean;
  pendingRating: number | null;
  lastKnownAvg: number | null;
  lastKnownCount: number | null;
  isAdmin: boolean;
  isOwner: boolean;
  setShowPastEvents: Dispatch<SetStateAction<boolean>>;
  setRatingModalOpen: Dispatch<SetStateAction<boolean>>;
  setPendingRating: Dispatch<SetStateAction<number | null>>;
  handleRatingSelect: (rating: number) => Promise<void>;
  loadMoreRecentCatches: () => void;
  loadMorePastEvents: () => void;
};

export const useVenueDetailData = (
  slug: string | undefined
): UseVenueDetailDataResult => {
  const { user } = useAuth();
  const debugVenue =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("debugVenue");
  const venueQuery = useQuery<Venue | null>({
    queryKey: ["venueBySlug", slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      if (!slug) return null;
      if (debugVenue) {
        console.log("[VenueDetail] loadVenue", {
          slug,
          reason: "query",
          visibility:
            typeof document === "undefined"
              ? "unknown"
              : document.visibilityState,
        });
      }
      const { data, error } = await supabase.rpc("get_venue_by_slug", {
        p_slug: slug,
      });
      if (error) {
        console.error("Failed to load venue", error);
        return null;
      }
      return (data as Venue[] | null)?.[0] ?? null;
    },
    staleTime: VENUE_STALE_MS,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    retry: false,
  });
  const venue =
    venueQuery.data && venueQuery.data.slug === slug ? venueQuery.data : null;
  const venueLoading =
    Boolean(slug) && (venueQuery.isLoading || (venueQuery.isFetching && !venue));
  const queryClient = useQueryClient();
  const venueId = venue?.id ?? null;
  const userId = user?.id ?? null;
  const ratingCacheKey =
    userId && venueId ? `${userId}:${venueId}` : null;
  const cachedRatingEntry = ratingCacheKey
    ? getVenueRatingCache(ratingCacheKey)
    : null;
  const [topCatches, setTopCatches] = useState<CatchRow[]>([]);
  const [topLoading, setTopLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<VenueEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [photos, setPhotos] = useState<VenuePhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [avgRating, setAvgRating] = useState<number | null>(
    venue?.avg_rating ?? null
  );
  const [ratingCount, setRatingCount] = useState<number | null>(
    venue?.rating_count ?? null
  );
  const ratingQuery = useQuery<number | null>({
    queryKey: ["venueRating", userId, venueId],
    enabled: Boolean(userId && venueId),
    queryFn: async () => {
      if (!venueId) return null;
      const { data, error } = await supabase.rpc("get_my_venue_rating", {
        p_venue_id: venueId,
      });
      if (error) {
        console.error("Failed to load your venue rating", error);
        return null;
      }
      const row = (
        data as { venue_id: string; user_rating: number }[] | null
      )?.[0];
      return row?.user_rating ?? null;
    },
    staleTime: RATING_STALE_MS,
    refetchOnWindowFocus: false,
    retry: false,
    initialData: cachedRatingEntry ? cachedRatingEntry.rating : undefined,
    initialDataUpdatedAt: cachedRatingEntry?.loadedAt,
  });
  const userRating = ratingQuery.data ?? null;
  const userRatingResolved = Boolean(userId && venueId && ratingQuery.isFetched);
  const openingHoursQuery = useQuery<VenueOpeningHour[]>({
    queryKey: ["venueOpeningHours", venueId],
    enabled: Boolean(venueId),
    queryFn: async () => {
      if (!venueId) return [];
      const result = await supabase
        .from("venue_opening_hours")
        .select("*")
        .eq("venue_id", venueId)
        .order("order_index", { ascending: true });
      if (result.error) {
        console.error("Failed to load venue opening hours", result.error);
        if (debugVenue) {
          toast.error("Failed to load opening hours.");
        }
        return [];
      }
      return result.data ?? [];
    },
    staleTime: VENUE_STALE_MS,
    refetchOnWindowFocus: false,
    retry: false,
    placeholderData: [],
  });
  const pricingTiersQuery = useQuery<VenuePricingTier[]>({
    queryKey: ["venuePricingTiers", venueId],
    enabled: Boolean(venueId),
    queryFn: async () => {
      if (!venueId) return [];
      const result = await supabase
        .from("venue_pricing_tiers")
        .select("*")
        .eq("venue_id", venueId)
        .order("order_index", { ascending: true });
      if (result.error) {
        console.error("Failed to load venue pricing tiers", result.error);
        if (debugVenue) {
          toast.error("Failed to load pricing tiers.");
        }
        return [];
      }
      return result.data ?? [];
    },
    staleTime: VENUE_STALE_MS,
    refetchOnWindowFocus: false,
    retry: false,
    placeholderData: [],
  });
  const rulesQuery = useQuery<string | null>({
    queryKey: ["venueRules", venueId],
    enabled: Boolean(venueId),
    queryFn: async () => {
      if (!venueId) return null;
      const result = await supabase
        .from("venue_rules")
        .select("rules_text")
        .eq("venue_id", venueId)
        .maybeSingle();
      if (result.error) {
        console.error("Failed to load venue rules", result.error);
        if (debugVenue) {
          toast.error("Failed to load venue rules.");
        }
        return null;
      }
      return result.data?.rules_text ?? null;
    },
    staleTime: VENUE_STALE_MS,
    refetchOnWindowFocus: false,
    retry: false,
    placeholderData: null,
  });
  const openingHours = openingHoursQuery.data ?? [];
  const pricingTiers = pricingTiersQuery.data ?? [];
  const rulesText = rulesQuery.data ?? null;
  const operationalLoading =
    openingHoursQuery.isLoading ||
    pricingTiersQuery.isLoading ||
    rulesQuery.isLoading;
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [pendingRating, setPendingRating] = useState<number | null>(null);
  const [lastKnownAvg, setLastKnownAvg] = useState<number | null>(null);
  const [lastKnownCount, setLastKnownCount] = useState<number | null>(null);
  const requestIdsRef = useRef({
    photos: 0,
    top: 0,
    upcoming: 0,
  });

  useEffect(() => {
    if (!venue) {
      setAvgRating(null);
      setRatingCount(null);
      return;
    }
    setAvgRating(venue.avg_rating ?? null);
    setRatingCount(venue.rating_count ?? null);
  }, [venue?.avg_rating, venue?.id, venue?.rating_count]);

  useEffect(() => {
    if (!ratingCacheKey || !ratingQuery.isFetched) return;
    setVenueRatingCache(ratingCacheKey, {
      rating: ratingQuery.data ?? null,
      loadedAt: ratingQuery.dataUpdatedAt || Date.now(),
    });
  }, [
    ratingCacheKey,
    ratingQuery.data,
    ratingQuery.dataUpdatedAt,
    ratingQuery.isFetched,
  ]);

  useEffect(() => {
    if (avgRating !== null && avgRating !== undefined) {
      setLastKnownAvg(avgRating);
    }
    if (ratingCount !== null && ratingCount !== undefined) {
      setLastKnownCount(ratingCount);
    }
  }, [avgRating, ratingCount]);

  const loadTopCatches = async (venueId: string) => {
    const requestId = ++requestIdsRef.current.top;
    setTopLoading(true);
    const { data, error } = await supabase.rpc("get_venue_top_catches", {
      p_venue_id: venueId,
      p_limit: 6,
    });
    if (requestId !== requestIdsRef.current.top) return;
    if (error) {
      console.error("Failed to load top catches", error);
      setTopCatches([]);
    } else {
      setTopCatches(((data as CatchRow[]) ?? []).map(normalizeCatchRow));
    }
    setTopLoading(false);
  };

  const RECENT_LIMIT = 12;
  const recentCatchesQuery = useInfiniteQuery<CatchRow[]>({
    queryKey: ["venueRecentCatches", venueId],
    enabled: Boolean(venueId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!venueId) return [];
      const offset = typeof pageParam === "number" ? pageParam : 0;
      const { data, error } = await supabase.rpc("get_venue_recent_catches", {
        p_venue_id: venueId,
        p_limit: RECENT_LIMIT,
        p_offset: offset,
      });
      if (error) {
        console.error("Failed to load recent catches", error);
        return [];
      }
      return ((data as CatchRow[]) ?? []).map(normalizeCatchRow);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < RECENT_LIMIT) return undefined;
      return allPages.reduce((total, page) => total + page.length, 0);
    },
    staleTime: VENUE_STALE_MS,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const recentCatches = recentCatchesQuery.data?.pages.flat() ?? [];
  const recentHasMore = Boolean(recentCatchesQuery.hasNextPage);
  const recentLoading = recentCatchesQuery.isFetching;

  const loadMoreRecentCatches = () => {
    if (!recentCatchesQuery.hasNextPage) return;
    void recentCatchesQuery.fetchNextPage();
  };

  const PAST_LIMIT = 10;
  const pastEventsQuery = useInfiniteQuery<VenueEvent[]>({
    queryKey: ["venuePastEvents", venueId],
    enabled: Boolean(venueId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!venueId) return [];
      const offset = typeof pageParam === "number" ? pageParam : 0;
      const { data, error } = await supabase.rpc("get_venue_past_events", {
        p_venue_id: venueId,
        p_limit: PAST_LIMIT,
        p_offset: offset,
      });
      if (error) {
        console.error("Failed to load past events", error);
        return [];
      }
      return (data as VenueEvent[]) ?? [];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAST_LIMIT) return undefined;
      return allPages.reduce((total, page) => total + page.length, 0);
    },
    staleTime: VENUE_STALE_MS,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const pastEvents = pastEventsQuery.data?.pages.flat() ?? [];
  const pastHasMore = Boolean(pastEventsQuery.hasNextPage);
  const pastEventsLoading = pastEventsQuery.isFetching;

  const loadMorePastEvents = () => {
    if (!pastEventsQuery.hasNextPage) return;
    void pastEventsQuery.fetchNextPage();
  };

  const loadUpcomingEvents = async (venueId: string) => {
    const requestId = ++requestIdsRef.current.upcoming;
    setEventsLoading(true);
    const { data, error } = await supabase.rpc("get_venue_upcoming_events", {
      p_venue_id: venueId,
    });
    if (requestId !== requestIdsRef.current.upcoming) return;
    if (error) {
      console.error("Failed to load events", error);
      setUpcomingEvents([]);
    } else {
      setUpcomingEvents((data as VenueEvent[]) ?? []);
    }
    setEventsLoading(false);
  };

  useEffect(() => {
    const loadPhotos = async () => {
      if (!venue?.id) return;
      const requestId = ++requestIdsRef.current.photos;
      setPhotosLoading(true);
      const { data, error } = await supabase.rpc("get_venue_photos", {
        p_venue_id: venue.id,
        p_limit: 20,
        p_offset: 0,
      });
      if (requestId !== requestIdsRef.current.photos) return;
      if (error) {
        console.error("Failed to load venue photos", error);
        setPhotos([]);
      } else {
        setPhotos((data as VenuePhoto[]) ?? []);
      }
      setPhotosLoading(false);
    };
    void loadPhotos();
  }, [venue?.id]);

  useEffect(() => {
    if (venueId) {
      void loadTopCatches(venueId);
      void loadUpcomingEvents(venueId);
    }
  }, [venueId]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const adminStatus = await isAdminUser(user.id);
      setIsAdmin(adminStatus);
      if (debugVenue) {
        console.log("[VenueDetail] admin status", {
          userId: user.id,
          isAdmin: adminStatus,
        });
      }
    };
    void checkAdmin();
  }, [debugVenue, user]);

  useEffect(() => {
    const checkOwner = async () => {
      if (!venue?.id || !user) {
        setIsOwner(false);
        return;
      }
      const { data, error } = await supabase
        .from("venue_owners")
        .select("venue_id")
        .eq("venue_id", venue.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error || !data) {
        setIsOwner(false);
        if (debugVenue) {
          console.log("[VenueDetail] owner status", {
            userId: user.id,
            venueId: venue.id,
            isOwner: false,
          });
        }
        return;
      }
      setIsOwner(true);
      if (debugVenue) {
        console.log("[VenueDetail] owner status", {
          userId: user.id,
          venueId: venue.id,
          isOwner: true,
        });
      }
    };
    void checkOwner();
  }, [debugVenue, user, venue?.id]);

  const handleRatingSelect = useCallback(
    async (rating: number) => {
      if (!venueId || !userId || ratingLoading) return;
      const previous = userRating;
      const prevAvg = avgRating;
      const prevCount = ratingCount;
      const prevLastAvg = lastKnownAvg;
      const prevLastCount = lastKnownCount;
      const ratingQueryKey: [string, string | null, string | null] = [
        "venueRating",
        userId,
        venueId,
      ];
      queryClient.setQueryData(ratingQueryKey, rating);
      if (ratingCacheKey) {
        setVenueRatingCache(ratingCacheKey, {
          rating,
          loadedAt: Date.now(),
        });
      }
      const currentAvg = avgRating ?? lastKnownAvg ?? 0;
      const currentCount = ratingCount ?? lastKnownCount ?? 0;
      const isFirst = previous === null || previous === undefined;
      const optimisticCount = isFirst ? currentCount + 1 : currentCount || 1;
      const optimisticAvg = isFirst
        ? (currentAvg * currentCount + rating) / optimisticCount
        : currentCount > 0
        ? (currentAvg * currentCount - (previous ?? 0) + rating) / currentCount
        : rating;
      setAvgRating(optimisticAvg);
      setRatingCount(optimisticCount);
      setRatingLoading(true);
      const { data, error } = await supabase.rpc("upsert_venue_rating", {
        p_venue_id: venueId,
        p_rating: rating,
      });
      if (error) {
        console.error("Failed to submit rating", error);
        toast.error("Could not save your rating. Please try again.");
        queryClient.setQueryData(ratingQueryKey, previous ?? null);
        setAvgRating(prevAvg ?? null);
        setRatingCount(prevCount ?? null);
        setLastKnownAvg(prevLastAvg);
        setLastKnownCount(prevLastCount);
        if (ratingCacheKey) {
          setVenueRatingCache(ratingCacheKey, {
            rating: previous ?? null,
            loadedAt: Date.now(),
          });
        }
        setRatingLoading(false);
        return;
      }
      const row = (
        data as
          | {
              venue_id: string;
              avg_rating: number | null;
              rating_count: number | null;
              user_rating: number | null;
            }[]
          | null
      )?.[0];
      setAvgRating(row?.avg_rating ?? optimisticAvg);
      setRatingCount(row?.rating_count ?? optimisticCount);
      const resolvedRating = row?.user_rating ?? rating;
      queryClient.setQueryData(ratingQueryKey, resolvedRating);
      if (ratingCacheKey) {
        setVenueRatingCache(ratingCacheKey, {
          rating: resolvedRating,
          loadedAt: Date.now(),
        });
      }
      setRatingModalOpen(false);
      toast.success("Thanks for rating this venue!");
      setRatingLoading(false);
    },
    [
      avgRating,
      lastKnownAvg,
      lastKnownCount,
      queryClient,
      ratingCacheKey,
      ratingCount,
      ratingLoading,
      userRating,
      userId,
      venueId,
    ]
  );

  return {
    user,
    debugVenue,
    venue,
    venueLoading,
    topCatches,
    topLoading,
    recentCatches,
    recentLoading,
    recentHasMore,
    upcomingEvents,
    eventsLoading,
    pastEvents,
    pastEventsLoading,
    pastHasMore,
    showPastEvents,
    photos,
    photosLoading,
    openingHours,
    pricingTiers,
    rulesText,
    operationalLoading,
    avgRating,
    ratingCount,
    userRating,
    userRatingResolved,
    ratingLoading,
    ratingModalOpen,
    pendingRating,
    lastKnownAvg,
    lastKnownCount,
    isAdmin,
    isOwner,
    setShowPastEvents,
    setRatingModalOpen,
    setPendingRating,
    handleRatingSelect,
    loadMoreRecentCatches,
    loadMorePastEvents,
  };
};
