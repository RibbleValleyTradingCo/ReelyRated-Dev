import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { isAdminUser } from "@/lib/admin";
import { qk } from "@/lib/queryKeys";
import { useCatchComments } from "@/hooks/useCatchComments";
import type { CatchData, Rating, CatchRatingSummary } from "@/hooks/useCatchData";

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

type RatingSummaryResponse = {
  summary: CatchRatingSummary | null;
  accessError: boolean;
  error: boolean;
};

type ReactionSummary = {
  count: number;
  userHasReacted: boolean;
};

interface UseCatchDetailDataParams {
  catchId: string | undefined;
  userId: string | undefined;
}

export const useCatchDetailData = ({ catchId, userId }: UseCatchDetailDataParams) => {
  const navigate = useNavigate();
  const commentsData = useCatchComments(catchId);
  const handledInaccessibleRef = useRef(false);

  const catchQuery = useQuery({
    queryKey: qk.catchById(catchId),
    enabled: Boolean(catchId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catches")
        .select(
          "*, profiles:user_id (username, avatar_path, avatar_url), session:session_id (id, title, venue_name_manual, date), venues:venue_id (id, slug, name)"
        )
        .eq("id", catchId)
        .maybeSingle();

      if (error) {
        logger.error("Failed to load catch", error, { catchId });
        return null;
      }

      return (data as unknown as CatchData) ?? null;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    handledInaccessibleRef.current = false;
  }, [catchId]);

  useEffect(() => {
    if (!catchId) return;
    if (catchQuery.isLoading) return;
    if (catchQuery.data) return;

    if (handledInaccessibleCatchIds.has(catchId)) return;
    if (handledInaccessibleRef.current) return;

    handledInaccessibleCatchIds.add(catchId);
    handledInaccessibleRef.current = true;

    toast.error(
      "This catch isn’t available. It may have been deleted, made private, or you don’t have permission to view it.",
      { id: `catch-inaccessible-${catchId}` }
    );
    navigate("/feed", { replace: true });
  }, [catchId, catchQuery.data, catchQuery.isLoading, navigate]);

  const ratingQuery = useQuery<RatingSummaryResponse>({
    queryKey: qk.catchRatingSummary(catchId, userId),
    enabled: Boolean(catchId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_catch_rating_summary" as unknown as keyof Database["public"]["Functions"],
        { p_catch_id: catchId }
      );

      if (error) {
        const { message, code } = extractPgError(error);
        const isAccessError =
          code === "P0001" || (message && message.includes("Catch is not accessible"));

        if (!isAccessError) {
          logger.error("Failed to load rating summary", error, { catchId, message, code });
        }

        return { summary: null, accessError: isAccessError, error: !isAccessError };
      }

      const summary = (data as unknown as CatchRatingSummary[] | null)?.[0] ?? null;
      if (!summary) {
        return { summary: null, accessError: true, error: false };
      }

      return { summary, accessError: false, error: false };
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
    placeholderData: (prev) => prev,
  });

  const reactionsQuery = useQuery<ReactionSummary>({
    queryKey: qk.catchReactions(catchId, userId ?? null),
    enabled: Boolean(catchId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catch_reactions")
        .select("user_id")
        .eq("catch_id", catchId);

      if (error) {
        logger.error("Failed to load reactions", error, { catchId });
        return { count: 0, userHasReacted: false };
      }

      const reactions = data ?? [];
      const hasReacted = userId ? reactions.some((row) => row.user_id === userId) : false;
      return { count: reactions.length, userHasReacted: hasReacted };
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
    placeholderData: (prev) => prev,
  });

  const ownerId = catchQuery.data?.user_id ?? null;
  const followQuery = useQuery<boolean>({
    queryKey: qk.catchFollowStatus(userId ?? null, ownerId ?? null),
    enabled: Boolean(userId && ownerId && userId !== ownerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_follows")
        .select("id")
        .eq("follower_id", userId)
        .eq("following_id", ownerId)
        .maybeSingle();

      if (error) {
        logger.error("Failed to check following status", error, { ownerId, userId });
        return false;
      }

      return !!data;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
    placeholderData: (prev) => prev,
  });

  const adminQuery = useQuery({
    queryKey: qk.adminStatus(userId ?? null),
    enabled: Boolean(userId),
    queryFn: async () => isAdminUser(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const ratingSummary = ratingQuery.data?.summary ?? null;
  const ratingSummaryAccessError = ratingQuery.data?.accessError ?? false;
  const ratingSummaryError = ratingQuery.data?.error ?? false;

  const hasRated = Boolean(ratingSummary?.your_rating && userId);
  const ratings: Rating[] = hasRated && userId
    ? [{ rating: ratingSummary?.your_rating ?? 0, user_id: userId, profiles: null }]
    : [];

  const reactionSummary = reactionsQuery.data ?? { count: 0, userHasReacted: false };

  const isFollowing = Boolean(userId && ownerId && userId !== ownerId ? followQuery.data : false);

  const isAdmin = adminQuery.data ?? false;

  return {
    catchData: catchQuery.data,
    isLoading: catchQuery.isLoading,
    ratings,
    hasRated,
    reactionCount: reactionSummary.count,
    userHasReacted: reactionSummary.userHasReacted,
    isFollowing,
    ratingSummary,
    ratingSummaryAccessError,
    ratingSummaryError,
    isAdmin,
    refetchCatch: catchQuery.refetch,
    commentsData,
  };
};
