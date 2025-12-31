import { useCallback, RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createNotification } from "@/lib/notifications";
import { formatSpecies, formatWeight } from "@/lib/catch-formatting";
import type { CatchData, CatchRatingSummary } from "./useCatchData";
import { logger } from "@/lib/logger";
import { isRateLimitError, getRateLimitMessage } from "@/lib/rateLimit";
import { deleteCatch } from "@/lib/supabase-queries";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "@/lib/queryKeys";

const extractPgError = (
  error: unknown,
): { code?: string; message?: string } => {
  if (error && typeof error === "object") {
    const maybe = error as { code?: string; message?: string };
    return {
      code: maybe.code,
      message: maybe.message,
    };
  }
  return {};
};

interface UseCatchInteractionsParams {
  catchId: string | undefined;
  catchData: CatchData | null;
  userId: string | undefined;
  userEmail: string | undefined;
  username: string | undefined;
  userRating: number;
  hasRated: boolean;
  isFollowing: boolean;
  userHasReacted: boolean;
  setFollowLoading: (value: boolean) => void;
  setReactionLoading: (value: boolean) => void;
  setDeleteLoading: (value: boolean) => void;
  setDeleteDialogOpen: (value: boolean) => void;
  setShareCopied: (value: boolean) => void;
  setDownloadLoading: (value: boolean) => void;
  shareCardRef: RefObject<HTMLDivElement>;
}

export const useCatchInteractions = ({
  catchId,
  catchData,
  userId,
  userEmail,
  username,
  userRating,
  hasRated,
  isFollowing,
  userHasReacted,
  setFollowLoading,
  setReactionLoading,
  setDeleteLoading,
  setDeleteDialogOpen,
  setShareCopied,
  setDownloadLoading,
  shareCardRef,
}: UseCatchInteractionsParams) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: async (action: "follow" | "unfollow") => {
      if (!userId || !catchData) {
        throw new Error("AUTH_REQUIRED");
      }

      if (action === "unfollow") {
        const { error } = await supabase
          .from("profile_follows")
          .delete()
          .eq("follower_id", userId)
          .eq("following_id", catchData.user_id);

        if (error) throw error;
        return action;
      }

      const { error } = await supabase.rpc("follow_profile_with_rate_limit", {
        p_following_id: catchData.user_id,
      });

      if (error) throw error;
      return action;
    },
    retry: false,
  });

  const reactionMutation = useMutation({
    mutationFn: async (action: "add" | "remove") => {
      if (!userId || !catchData) {
        throw new Error("AUTH_REQUIRED");
      }

      if (action === "remove") {
        const { error } = await supabase
          .from("catch_reactions")
          .delete()
          .eq("catch_id", catchData.id)
          .eq("user_id", userId);

        if (error) throw error;
        return action;
      }

      const { error } = await supabase.rpc("react_to_catch_with_rate_limit", {
        p_catch_id: catchData.id,
        p_reaction: "like",
      });

      if (error) throw error;
      return action;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.feedBase() });
    },
    retry: false,
  });

  const ratingMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !catchData) {
        throw new Error("AUTH_REQUIRED");
      }
      const { error } = await supabase.rpc("rate_catch_with_rate_limit", {
        p_catch_id: catchId,
        p_rating: userRating,
      });
      if (error) throw error;
      return true;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.feedBase() });
    },
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !catchData) {
        throw new Error("AUTH_REQUIRED");
      }
      await deleteCatch(catchData.id, userId);
      return true;
    },
    retry: false,
  });

  const handleDeleteCatch = useCallback(async () => {
    if (!userId || !catchData) {
      toast.error("Unable to delete this catch");
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteMutation.mutateAsync();
      toast.success("Catch removed");
      setDeleteDialogOpen(false);
      setDeleteLoading(false);
      queryClient.removeQueries({ queryKey: qk.catchById(catchData.id) });
      queryClient.removeQueries({ queryKey: qk.catchComments(catchData.id) });
      queryClient.invalidateQueries({ queryKey: qk.feedBase() });
      navigate("/feed");
    } catch (error) {
      toast.error("Failed to delete catch");
      logger.error("Failed to delete catch", error, { catchId: catchData.id, userId });
      setDeleteLoading(false);
    }
  }, [
    catchData,
    deleteMutation,
    navigate,
    queryClient,
    userId,
    setDeleteLoading,
    setDeleteDialogOpen,
  ]);

  const handleToggleFollow = async () => {
    if (!userId || !catchData) {
      toast.error("Sign in to follow anglers");
      navigate("/auth");
      return;
    }

    if (userId === catchData.user_id) return;

    setFollowLoading(true);

    const action: "follow" | "unfollow" = isFollowing ? "unfollow" : "follow";
    try {
      await followMutation.mutateAsync(action);
      queryClient.setQueryData(
        qk.catchFollowStatus(userId, catchData.user_id),
        action === "follow"
      );

      if (action === "follow") {
        toast.success("Following angler");
        const actorName = username ?? userEmail ?? "Someone";
        void createNotification({
          userId: catchData.user_id,
          actorId: userId,
          type: "new_follower",
          payload: {
            message: `${actorName} started following you.`,
            extraData: {
              follower_username: actorName,
            },
          },
        });
      } else {
        toast.success("Unfollowed angler");
      }
    } catch (error) {
      if (isRateLimitError(error)) {
        toast.error(getRateLimitMessage(error));
      } else {
        const message = action === "follow" ? "Failed to follow angler" : "Failed to unfollow";
        toast.error(message);
      }
      logger.error("Failed to toggle follow", error, { userId, ownerId: catchData.user_id });
    }

    setFollowLoading(false);
  };

  const handleToggleReaction = async () => {
    if (!userId || !catchData) {
      toast.error("Sign in to react");
      navigate("/auth");
      return;
    }
    if (userId === catchData.user_id) {
      return;
    }

    setReactionLoading(true);

    const action: "add" | "remove" = userHasReacted ? "remove" : "add";
    try {
      await reactionMutation.mutateAsync(action);
      queryClient.setQueryData(qk.catchReactions(catchData.id, userId), (prev?: { count: number; userHasReacted: boolean }) => {
        const current = prev ?? { count: 0, userHasReacted: false };
        const nextCount = action === "add" ? current.count + 1 : Math.max(0, current.count - 1);
        return { count: nextCount, userHasReacted: action === "add" };
      });

      if (action === "add" && catchData.user_id !== userId) {
        const actorName = username ?? userEmail ?? "Someone";
        void createNotification({
          userId: catchData.user_id,
          actorId: userId,
          type: "new_reaction",
          payload: {
            message: `${actorName} liked your catch "${catchData.title}".`,
            catchId: catchData.id,
            extraData: {
              catch_title: catchData.title,
            },
          },
        });
      }
    } catch (error) {
      const { code, message } = extractPgError(error);

      if (isRateLimitError(error)) {
        toast.error(getRateLimitMessage(error));
      } else if (code === "23505") {
        queryClient.setQueryData(qk.catchReactions(catchData.id, userId), (prev?: { count: number; userHasReacted: boolean }) => ({
          count: prev?.count ?? 0,
          userHasReacted: true,
        }));
      } else {
        toast.error(action === "add" ? "Couldn't add reaction" : "Couldn't remove reaction");
        logger.error("Couldn't toggle reaction", error, {
          catchId: catchData.id,
          userId,
          code,
          message,
        });
      }
    }

    setReactionLoading(false);
  };

  const publicSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined;
  const catchUrl = publicSiteUrl
    ? `${publicSiteUrl.replace(/\/$/, "")}/catch/${catchId}`
    : typeof window !== "undefined"
    ? `${window.location.origin}/catch/${catchId}`
    : `/catch/${catchId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(catchUrl);
      setShareCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setShareCopied(false), 2000);
    } catch (error) {
      logger.error("Clipboard copy failed", error, { catchUrl });
      toast.error("Unable to copy link");
    }
  };

  const handleShareWhatsApp = (locationLabel?: string) => {
    if (!catchData) {
      window.open(`https://wa.me/?text=${encodeURIComponent(catchUrl)}`, "_blank");
      return;
    }
    const customFields = catchData.conditions?.customFields ?? {};
    const customSpecies = customFields.species;
    const speciesLabel = formatSpecies(catchData.species, customSpecies) ?? "a catch";
    const weightLabel = catchData.weight ? formatWeight(catchData.weight, catchData.weight_unit) : null;
    const messageParts = [
      `Check out ${catchData.title}`,
      weightLabel ? `(${weightLabel})` : null,
      speciesLabel ? `– ${speciesLabel}` : null,
      locationLabel ? `at ${locationLabel}` : null,
      `on ReelyRated: ${catchUrl}`,
    ].filter(Boolean);
    const waUrl = `https://wa.me/?text=${encodeURIComponent(messageParts.join(" "))}`;
    window.open(waUrl, "_blank");
  };

  const handleDownloadShareImage = async () => {
    if (!catchData || !shareCardRef.current) return;
    setDownloadLoading(true);
    try {
      const isDebugShare =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).has("debugShareImage");
      const shareRoot = shareCardRef.current;

      // Ensure fonts + images are ready before capture to avoid blank renders.
      if (document?.fonts?.ready) {
        await document.fonts.ready;
      }

      const shareImages = Array.from(shareRoot.querySelectorAll("img"));
      await Promise.all(
        shareImages.map(async (img) => {
          if (img.complete && img.naturalWidth > 0) return;
          if ("decode" in img) {
            try {
              await img.decode();
              return;
            } catch {
              // fall through to load/error listeners
            }
          }
          await new Promise<void>((resolve) => {
            const cleanup = () => {
              img.removeEventListener("load", cleanup);
              img.removeEventListener("error", cleanup);
              resolve();
            };
            img.addEventListener("load", cleanup, { once: true });
            img.addEventListener("error", cleanup, { once: true });
          });
        })
      );

      if (isDebugShare) {
        const rect = shareRoot.getBoundingClientRect();
        const readyCount = shareImages.filter((img) => img.complete && img.naturalWidth > 0).length;
        logger.info("Share image debug", {
          rect: { width: rect.width, height: rect.height },
          totalImages: shareImages.length,
          readyImages: readyCount,
        });
      }

      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(shareRoot, {
        backgroundColor: "#ffffff",
        scale: Math.min(2, window.devicePixelRatio || 1),
        useCORS: true,
        allowTaint: false,
        logging: isDebugShare,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const safeTitle = catchData.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      link.href = dataUrl;
      link.download = `${safeTitle || "catch"}-share.png`;
      link.click();
      if (isDebugShare) {
        logger.info("Share image canvas", {
          width: canvas.width,
          height: canvas.height,
        });
      }
      toast.success("Share image saved");
    } catch (error) {
      logger.error("Failed to generate share image", error, { catchId: catchData?.id });
      toast.error("Unable to generate share image");
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleAddRating = async () => {
    if (ratingMutation.isPending) return;
    if (!userId || hasRated) return;
    if (!catchData || catchData.allow_ratings === false) {
      toast.error("Ratings are disabled for this catch");
      return;
    }
    if (catchData.user_id === userId) {
      toast.error("You can't rate your own catch");
      return;
    }

    try {
      await ratingMutation.mutateAsync();
      queryClient.setQueryData(qk.catchRatingSummary(catchId, userId), (prev?: { summary: CatchRatingSummary | null; accessError: boolean; error: boolean }) => {
        const existing = prev?.summary;
        const prevCount = existing?.rating_count ?? 0;
        const prevAvg = existing?.average_rating ?? 0;
        const nextCount = prevCount + 1;
        const nextAvg = prevCount > 0 ? ((prevAvg * prevCount + userRating) / nextCount) : userRating;
        return {
          summary: {
            catch_id: catchId ?? "",
            rating_count: nextCount,
            average_rating: nextAvg,
            your_rating: userRating,
          },
          accessError: false,
          error: false,
        };
      });
      toast.success("Rating added!");
      void queryClient.invalidateQueries({ queryKey: qk.catchRatingSummary(catchId, userId) });
    } catch (error) {
      const { message } = extractPgError(error);

      if (isRateLimitError(error)) {
        toast.error(getRateLimitMessage(error));
      } else if (message?.includes("You cannot rate your own catch")) {
        toast.error("You can't rate your own catch");
      } else if (message?.includes("Ratings are disabled")) {
        toast.error("Ratings are disabled for this catch");
      } else if (message?.includes("Catch is not accessible")) {
        toast.error("You don't have access to rate this catch");
      } else if (message?.includes("Rating must be between 1 and 10")) {
        toast.error("Rating must be between 1 and 10");
      } else if (message?.startsWith("RATE_LIMITED")) {
        toast.error("You're doing that too quickly. Please try again later.");
      } else {
        toast.error("Failed to add rating");
      }
    }
  };

  const ratingLoading = ratingMutation.isPending;

  return {
    handleDeleteCatch,
    handleToggleFollow,
    handleToggleReaction,
    handleCopyLink,
    handleShareWhatsApp,
    handleDownloadShareImage,
    handleAddRating,
    ratingLoading,
    catchUrl,
  };
};
