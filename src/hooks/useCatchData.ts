import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { logger } from "@/lib/logger";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const handledInaccessibleCatchIds = new Set<string>();

const extractPgError = (
  error: unknown
): { message?: string; code?: string } => {
  if (
    error &&
    typeof error === "object" &&
    ("message" in error || "code" in error)
  ) {
    const errObj = error as { message?: string; code?: string };
    return { message: errObj.message, code: errObj.code };
  }
  return {};
};

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
  weather?: string;
  airTemp?: number;
  waterClarity?: string;
  windDirection?: string;
  [key: string]: unknown;
} | null;

type VisibilityType = Database["public"]["Enums"]["visibility_type"];

export interface CatchData {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  location_label: string | null;
  species_slug: string | null;
  custom_species: string | null;
  weight: number | null;
  weight_unit: string | null;
  length: number | null;
  length_unit: string | null;
  water_type_code: string | null;
  method_tag: string | null;
  peg_or_swim: string | null;
  time_of_day: string | null;
  bait_used: string | null;
  equipment_used: string | null;
  caught_at: string | null;
  conditions: CatchConditions;
  tags: string[] | null;
  gallery_photos: string[] | null;
  video_url: string | null;
  visibility: VisibilityType | null;
  hide_exact_spot: boolean | null;
  allow_ratings: boolean | null;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_path: string | null;
    avatar_url: string | null;
  };
  session: {
    id: string;
    title: string | null;
    venue_name_manual: string | null;
    date: string | null;
  } | null;
  species: string | null;
  venues?: {
    id: string;
    slug: string;
    name: string;
  } | null;
}

export interface Rating {
  rating: number;
  user_id: string;
  profiles: {
    username: string;
  } | null;
}

export interface CatchRatingSummary {
  catch_id: string;
  rating_count: number;
  average_rating: number | null;
  your_rating: number | null;
}

interface UseCatchDataParams {
  catchId: string | undefined;
  userId: string | undefined;
}

export const useCatchData = ({ catchId, userId }: UseCatchDataParams) => {
  const navigate = useNavigate();
  const [catchData, setCatchData] = useState<CatchData | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [hasRated, setHasRated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reactionCount, setReactionCount] = useState(0);
  const [userHasReacted, setUserHasReacted] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStatusLoaded, setFollowStatusLoaded] = useState(false);
  const [ratingSummary, setRatingSummary] = useState<CatchRatingSummary | null>(
    null
  );
  const [ratingSummaryAccessError, setRatingSummaryAccessError] = useState(false);
  const [ratingSummaryError, setRatingSummaryError] = useState(false);
  const hasHandledInaccessibleRef = useRef(false);

  const fetchCatchData = useCallback(async () => {
    if (!catchId) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("catches")
      .select(
        "*, profiles:user_id (username, avatar_path, avatar_url), session:session_id (id, title, venue_name_manual, date), venues:venue_id (id, slug, name)"
      )
      .eq("id", catchId)
      .maybeSingle();

    const handleInaccessible = () => {
      if (!catchId) return;
      if (handledInaccessibleCatchIds.has(catchId)) return;
      handledInaccessibleCatchIds.add(catchId);
      toast.error(
        "This catch isn’t available. It may have been deleted, made private, or you don’t have permission to view it.",
        { id: `catch-inaccessible-${catchId}` }
      );
      navigate("/feed", { replace: true });
    };

    if (error || !data) {
      handleInaccessible();
    } else {
      handledInaccessibleCatchIds.delete(catchId);
      // Supabase view/joins aren't in generated types; cast via unknown to align with CatchData
      setCatchData(data as unknown as CatchData);
    }
    setIsLoading(false);
  }, [catchId, navigate]);

  useEffect(() => {
    hasHandledInaccessibleRef.current = false;
  }, [catchId]);

  const fetchRatings = useCallback(async () => {
    if (!catchId) return;
    const { data, error } = await supabase.rpc(
      "get_catch_rating_summary" as unknown as keyof Database["public"]["Functions"],
      { p_catch_id: catchId }
    );

    if (error) {
      const { message, code } = extractPgError(error);
      const isAccessError =
        code === "P0001" || (message && message.includes("Catch is not accessible"));

      if (isAccessError) {
        setRatingSummaryAccessError(true);
      } else {
        setRatingSummaryError(true);
      }

      logger.error("Failed to load rating summary", error, {
        catchId,
        message,
        code,
      });
      setRatingSummary(null);
      setRatings([]);
      setHasRated(false);
      return;
    }

    setRatingSummaryAccessError(false);
    setRatingSummaryError(false);

    const summary =
      (data as unknown as CatchRatingSummary[] | null)?.[0] ?? null;

    // If the function returned no rows (blocked/unauthorized), treat as access denied without toasting.
    if (!summary) {
      setRatingSummaryAccessError(true);
      setRatingSummary(null);
      setRatings([]);
      setHasRated(false);
      return;
    }

    setRatingSummary(summary);

    if (summary?.your_rating && userId) {
      setHasRated(true);
      setRatings([
        { rating: summary.your_rating, user_id: userId, profiles: null },
      ]);
    } else {
      setHasRated(false);
      setRatings([]);
    }
  }, [catchId, userId]);

  const fetchReactions = useCallback(async () => {
    if (!catchId) return;
    const { data, error } = await supabase
      .from("catch_reactions")
      .select("user_id")
      .eq("catch_id", catchId);

    if (error) {
      logger.error("Failed to load reactions", error, { catchId });
      return;
    }

    const reactions = data ?? [];
    setReactionCount(reactions.length);
    if (userId) {
      setUserHasReacted(reactions.some((row) => row.user_id === userId));
    } else {
      setUserHasReacted(false);
    }
  }, [catchId, userId]);

  const checkFollowStatus = useCallback(async () => {
    const ownerId = catchData?.user_id;
    if (!userId || !ownerId || userId === ownerId) {
      setIsFollowing(false);
      setFollowStatusLoaded(true);
      return;
    }

    const { data, error } = await supabase
      .from("profile_follows")
      .select("id")
      .eq("follower_id", userId)
      .eq("following_id", ownerId)
      .maybeSingle();

    if (error) {
      logger.error("Failed to check following status", error, {
        ownerId,
        userId,
      });
      setFollowStatusLoaded(true);
      return;
    }
    setIsFollowing(!!data);
    setFollowStatusLoaded(true);
  }, [catchData?.user_id, userId]);

  useEffect(() => {
    void fetchCatchData();
  }, [fetchCatchData]);

  useEffect(() => {
    void fetchRatings();
  }, [fetchRatings]);

  useEffect(() => {
    void fetchReactions();
  }, [fetchReactions]);

  useEffect(() => {
    const ownerId = catchData?.user_id;
    if (!ownerId) {
      setIsFollowing(false);
      setFollowStatusLoaded(true);
      return;
    }
    if (!userId || userId === ownerId) {
      setIsFollowing(false);
      setFollowStatusLoaded(true);
      return;
    }
    setFollowStatusLoaded(false);
    void checkFollowStatus();
  }, [catchData?.user_id, userId, checkFollowStatus]);

  return {
    catchData,
    ratings,
    ratingSummary,
    ratingSummaryAccessError,
    ratingSummaryError,
    hasRated,
    isLoading,
    reactionCount,
    userHasReacted,
    isFollowing,
    followStatusLoaded,
    setHasRated,
    setRatings,
    setReactionCount,
    setUserHasReacted,
    setIsFollowing,
    fetchReactions,
    fetchRatings,
    fetchCatchData,
  };
};
