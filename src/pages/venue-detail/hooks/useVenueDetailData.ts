import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { isAdminUser } from "@/lib/admin";
import { qk } from "@/lib/queryKeys";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  CatchRow,
  Venue,
  VenueEvent,
  VenueOpeningHour,
  VenuePhoto,
  VenuePricingTier,
  VenueSpeciesStock,
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
  speciesStock: VenueSpeciesStock[];
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
  ownershipResolved: boolean;
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
  const { user, loading: authLoading } = useAuth();
  const debugVenue =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("debugVenue");
  const venueQuery = useQuery<Venue | null>({
    queryKey: qk.venueBySlug(slug),
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [ownerChecked, setOwnerChecked] = useState(false);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [avgRating, setAvgRating] = useState<number | null>(
    venue?.avg_rating ?? null
  );
  const [ratingCount, setRatingCount] = useState<number | null>(
    venue?.rating_count ?? null
  );
  const ratingQuery = useQuery<number | null>({
    queryKey: qk.venueRating(userId, venueId),
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
  });
  const userRating = ratingQuery.data ?? null;
  const userRatingResolved = Boolean(userId && venueId && ratingQuery.isFetched);
  const openingHoursQuery = useQuery<VenueOpeningHour[]>({
    queryKey: qk.venueOpeningHours(venueId),
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
    queryKey: qk.venuePricingTiers(venueId),
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
    queryKey: qk.venueRules(venueId),
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
  const speciesStockQuery = useQuery<VenueSpeciesStock[]>({
    queryKey: qk.venueSpeciesStock(venueId),
    enabled: Boolean(venueId),
    queryFn: async () => {
      if (!venueId) return [];
      const result = await supabase
        .from("venue_species_stock")
        .select("*")
        .eq("venue_id", venueId)
        .order("created_at", { ascending: true });
      if (result.error) {
        console.error("Failed to load venue species stock", result.error);
        if (debugVenue) {
          toast.error("Failed to load species stock.");
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
  const upcomingEventsQuery = useQuery<VenueEvent[]>({
    queryKey: qk.venueUpcomingEvents(venueId),
    enabled: Boolean(venueId),
    queryFn: async () => {
      if (!venueId) return [];
      const { data, error } = await supabase.rpc("get_venue_upcoming_events", {
        p_venue_id: venueId,
      });
      if (error) {
        console.error("Failed to load events", error);
        return [];
      }
      return (data as VenueEvent[]) ?? [];
    },
    staleTime: VENUE_STALE_MS,
    refetchOnWindowFocus: false,
    retry: false,
    placeholderData: [],
  });
  const photosQuery = useQuery<VenuePhoto[]>({
    queryKey: qk.venuePhotos(venueId),
    enabled: Boolean(venueId),
    queryFn: async () => {
      if (!venueId) return [];
      const { data, error } = await supabase.rpc("get_venue_photos", {
        p_venue_id: venueId,
        p_limit: 20,
        p_offset: 0,
      });
      if (error) {
        console.error("Failed to load venue photos", error);
        return [];
      }
      return (data as VenuePhoto[]) ?? [];
    },
    staleTime: VENUE_STALE_MS,
    refetchOnWindowFocus: false,
    retry: false,
    placeholderData: [],
  });
  const openingHours = openingHoursQuery.data ?? [];
  const pricingTiers = pricingTiersQuery.data ?? [];
  const speciesStock = speciesStockQuery.data ?? [];
  const rulesText = rulesQuery.data ?? null;
  const upcomingEvents = upcomingEventsQuery.data ?? [];
  const eventsLoading = upcomingEventsQuery.isFetching;
  const photos = photosQuery.data ?? [];
  const photosLoading = photosQuery.isFetching;
  const operationalLoading =
    openingHoursQuery.isLoading ||
    pricingTiersQuery.isLoading ||
    speciesStockQuery.isLoading ||
    rulesQuery.isLoading;
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [pendingRating, setPendingRating] = useState<number | null>(null);
  const [lastKnownAvg, setLastKnownAvg] = useState<number | null>(null);
  const [lastKnownCount, setLastKnownCount] = useState<number | null>(null);
  const topCatchesQuery = useQuery<CatchRow[]>({
    queryKey: qk.venueTopCatches(venueId),
    enabled: Boolean(venueId),
    queryFn: async () => {
      if (!venueId) return [];
      const { data, error } = await supabase.rpc("get_venue_top_catches", {
        p_venue_id: venueId,
        p_limit: 6,
      });
      if (error) {
        console.error("Failed to load top catches", error);
        return [];
      }
      return ((data as CatchRow[]) ?? []).map(normalizeCatchRow);
    },
    staleTime: VENUE_STALE_MS,
    refetchOnWindowFocus: false,
    retry: false,
    placeholderData: [],
  });
  const topCatches = topCatchesQuery.data ?? [];
  const topLoading = topCatchesQuery.isFetching && topCatches.length === 0;

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
    if (avgRating !== null && avgRating !== undefined) {
      setLastKnownAvg(avgRating);
    }
    if (ratingCount !== null && ratingCount !== undefined) {
      setLastKnownCount(ratingCount);
    }
  }, [avgRating, ratingCount]);

  const RECENT_LIMIT = 12;
  const recentCatchesQuery = useInfiniteQuery<CatchRow[]>({
    queryKey: qk.venueRecentCatches(venueId),
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
    queryKey: qk.venuePastEvents(venueId),
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

  const ownershipResolved =
    !authLoading && (!user || (adminChecked && ownerChecked));

  useEffect(() => {
    let cancelled = false;
    const checkAdmin = async () => {
      if (authLoading) {
        setIsAdmin(false);
        setAdminChecked(false);
        return;
      }
      if (!user) {
        setIsAdmin(false);
        setAdminChecked(true);
        return;
      }
      setAdminChecked(false);
      const adminStatus = await isAdminUser(user.id);
      if (cancelled) return;
      setIsAdmin(adminStatus);
      setAdminChecked(true);
      if (debugVenue) {
        console.log("[VenueDetail] admin status", {
          userId: user.id,
          isAdmin: adminStatus,
        });
      }
    };
    void checkAdmin();
    return () => {
      cancelled = true;
    };
  }, [authLoading, debugVenue, user]);

  useEffect(() => {
    let cancelled = false;
    const checkOwner = async () => {
      if (authLoading) {
        setIsOwner(false);
        setOwnerChecked(false);
        return;
      }
      if (!venue?.id || !user) {
        setIsOwner(false);
        setOwnerChecked(!user);
        return;
      }
      setOwnerChecked(false);
      const { data, error } = await supabase
        .from("venue_owners")
        .select("venue_id")
        .eq("venue_id", venue.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setIsOwner(false);
        setOwnerChecked(true);
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
      setOwnerChecked(true);
      if (debugVenue) {
        console.log("[VenueDetail] owner status", {
          userId: user.id,
          venueId: venue.id,
          isOwner: true,
        });
      }
    };
    void checkOwner();
    return () => {
      cancelled = true;
    };
  }, [authLoading, debugVenue, user, venue?.id]);

  const handleRatingSelect = useCallback(
    async (rating: number) => {
      if (!venueId || !userId || ratingLoading) return;
      const previous = userRating;
      const prevAvg = avgRating;
      const prevCount = ratingCount;
      const prevLastAvg = lastKnownAvg;
      const prevLastCount = lastKnownCount;
      const ratingQueryKey = qk.venueRating(userId, venueId);
      queryClient.setQueryData(ratingQueryKey, rating);
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
      setRatingModalOpen(false);
      toast.success("Thanks for rating this venue!");
      setRatingLoading(false);
    },
    [
      avgRating,
      lastKnownAvg,
      lastKnownCount,
      queryClient,
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
    speciesStock,
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
    ownershipResolved,
    setShowPastEvents,
    setRatingModalOpen,
    setPendingRating,
    handleRatingSelect,
    loadMoreRecentCatches,
    loadMorePastEvents,
  };
};
