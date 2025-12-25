import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createNotification } from "@/lib/notifications";
import { isRateLimitError, getRateLimitMessage } from "@/lib/rateLimit";
import { isUuid } from "@/lib/profile";
import { isAdminUser } from "@/lib/admin";
import { qk } from "@/lib/queryKeys";
import { logger } from "@/lib/logger";
import type { Catch, FollowingProfile, Profile } from "../types";

const PROFILE_SELECT =
  "id, username, avatar_path, avatar_url, bio, is_private, is_deleted";
const CATCHES_SELECT =
  "id, user_id, location, hide_exact_spot, visibility, title, image_url, weight, weight_unit, species, created_at, ratings (rating), venues:venue_id (id, slug, name)";
const PAGE_SIZE = 24;

type BlockStatus = {
  isBlockedByMe: boolean;
  isViewerBlockedByProfileOwner: boolean;
};

interface UseProfileDataParams {
  slug: string | undefined;
  viewerId: string | undefined;
  viewerEmail?: string | null;
  viewerUsername?: string | null;
}

export const useProfileData = ({
  slug,
  viewerId,
  viewerEmail,
  viewerUsername,
}: UseProfileDataParams) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const slugIsUuid = useMemo(() => (slug ? isUuid(slug) : false), [slug]);

  const profileQuery = useQuery({
    queryKey: qk.profile(slug),
    enabled: Boolean(slug),
    queryFn: async () => {
      if (!slug) return null;
      let query = supabase.from("profiles").select(PROFILE_SELECT).limit(1);
      query = slugIsUuid ? query.eq("id", slug) : query.eq("username", slug);
      const { data, error } = await query.maybeSingle();
      if (error) {
        logger.error("Failed to load profile", error, { slug });
        return null;
      }
      return (data as Profile) ?? null;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const profile = profileQuery.data ?? null;
  const profileId = profile?.id ?? null;

  useEffect(() => {
    if (!profile || !slug) return;
    if ((slugIsUuid || profile.username !== slug) && profile.username) {
      navigate(`/profile/${profile.username}`, { replace: true });
    }
  }, [navigate, profile, slug, slugIsUuid]);

  const followerCountQuery = useQuery({
    queryKey: qk.profileFollowerCount(profileId),
    enabled: Boolean(profileId),
    queryFn: async () => {
      if (!profileId) return 0;
      const { data, error } = await supabase.rpc("get_follower_count", {
        p_profile_id: profileId,
      });
      if (error) {
        logger.error("Failed to load follower count", error, { profileId });
        return 0;
      }
      return data ?? 0;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const followingProfilesQuery = useQuery({
    queryKey: qk.profileFollowing(profileId),
    enabled: Boolean(profileId),
    queryFn: async () => {
      if (!profileId) return [];
      const { data, error } = await supabase
        .from("profile_follows")
        .select(
          `
          followed_profile:profiles!profile_follows_following_id_fkey (
            id,
            username,
            avatar_path,
            avatar_url,
            bio
          )
        `
        )
        .eq("follower_id", profileId);

      if (error) {
        logger.error("Failed to load following profiles", error, { profileId });
        return [];
      }

      const parsed = (data as { followed_profile: FollowingProfile | null }[])
        .map((row) => row.followed_profile)
        .filter((profileRow): profileRow is FollowingProfile => !!profileRow);
      return parsed;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const catchesQuery = useInfiniteQuery({
    queryKey: qk.profileCatches(profileId),
    enabled: Boolean(profileId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!profileId) return [];
      const from = typeof pageParam === "number" ? pageParam : 0;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("catches")
        .select(CATCHES_SELECT)
        .eq("user_id", profileId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        logger.error("Failed to load profile catches", error, { profileId });
        return [];
      }

      return (data as Catch[]) ?? [];
    },
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) {
        return undefined;
      }
      return (typeof lastPageParam === "number" ? lastPageParam : 0) + PAGE_SIZE;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const catches = useMemo(() => {
    const pages = catchesQuery.data?.pages ?? [];
    const map = new Map<string, Catch>();
    pages.forEach((page) => {
      page.forEach((catchItem) => {
        if (!map.has(catchItem.id)) {
          map.set(catchItem.id, catchItem);
        }
      });
    });
    return Array.from(map.values());
  }, [catchesQuery.data]);

  const followStatusQuery = useQuery({
    queryKey: qk.profileFollowStatus(viewerId ?? null, profileId),
    enabled: Boolean(viewerId && profileId && viewerId !== profileId),
    queryFn: async () => {
      if (!viewerId || !profileId || viewerId === profileId) return false;
      const { data, error } = await supabase
        .from("profile_follows")
        .select("id")
        .eq("follower_id", viewerId)
        .eq("following_id", profileId)
        .maybeSingle();

      if (error) {
        logger.error("Failed to load follow status", error, { profileId, viewerId });
        return false;
      }

      return !!data;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
    placeholderData: (prev) => prev,
  });

  const blockStatusQuery = useQuery<BlockStatus>({
    queryKey: qk.profileBlockStatus(viewerId ?? null, profileId),
    enabled: Boolean(viewerId && profileId),
    queryFn: async () => {
      if (!viewerId || !profileId) {
        return { isBlockedByMe: false, isViewerBlockedByProfileOwner: false };
      }

      const { data, error } = await supabase
        .from("profile_blocks")
        .select("blocker_id, blocked_id")
        .eq("blocker_id", viewerId)
        .eq("blocked_id", profileId)
        .maybeSingle();

      const isBlockedByMe = !error && !!data;

      const { data: blockedViewerRow, error: blockedViewerError } = await supabase
        .from("profile_blocks")
        .select("blocker_id, blocked_id")
        .eq("blocker_id", profileId)
        .eq("blocked_id", viewerId)
        .maybeSingle();

      const isViewerBlockedByProfileOwner = !blockedViewerError && !!blockedViewerRow;

      return { isBlockedByMe, isViewerBlockedByProfileOwner };
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const adminViewerQuery = useQuery({
    queryKey: qk.adminStatus(viewerId ?? null),
    enabled: Boolean(viewerId),
    queryFn: async () => isAdminUser(viewerId),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const adminProfileQuery = useQuery({
    queryKey: qk.adminStatus(profileId),
    enabled: Boolean(profileId),
    queryFn: async () => isAdminUser(profileId),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const followMutation = useMutation({
    mutationFn: async (action: "follow" | "unfollow") => {
      if (!viewerId || !profileId) {
        throw new Error("AUTH_REQUIRED");
      }

      if (action === "unfollow") {
        const { error } = await supabase
          .from("profile_follows")
          .delete()
          .eq("follower_id", viewerId)
          .eq("following_id", profileId);

        if (error) throw error;
        return action;
      }

      const { error } = await supabase.rpc("follow_profile_with_rate_limit", {
        p_following_id: profileId,
      });

      if (error) throw error;
      return action;
    },
    retry: false,
  });

  const updateBioMutation = useMutation({
    mutationFn: async (nextBio: string) => {
      if (!viewerId || !profileId) {
        throw new Error("AUTH_REQUIRED");
      }
      const { error } = await supabase
        .from("profiles")
        .update({ bio: nextBio })
        .eq("id", viewerId);
      if (error) throw error;
      return nextBio;
    },
    retry: false,
  });

  const blockMutation = useMutation({
    mutationFn: async (action: "block" | "unblock") => {
      if (!viewerId || !profileId) {
        throw new Error("AUTH_REQUIRED");
      }
      if (action === "block") {
        const { error } = await supabase.rpc("block_profile", {
          p_blocked_id: profileId,
          p_reason: null,
        });
        if (error) throw error;
        return action;
      }
      const { error } = await supabase.rpc("unblock_profile", {
        p_blocked_id: profileId,
      });
      if (error) throw error;
      return action;
    },
    retry: false,
  });

  const toggleFollow = useCallback(async () => {
    if (!viewerId || !profileId) {
      toast.error("Sign in to follow anglers");
      navigate("/auth");
      return;
    }
    if (viewerId === profileId) return;

    const action: "follow" | "unfollow" = followStatusQuery.data ? "unfollow" : "follow";
    try {
      await followMutation.mutateAsync(action);
      queryClient.setQueryData(
        qk.profileFollowStatus(viewerId, profileId),
        action === "follow"
      );
      queryClient.setQueryData(qk.profileFollowerCount(profileId), (prev?: number) => {
        const current = prev ?? 0;
        return action === "follow" ? current + 1 : Math.max(0, current - 1);
      });

      if (action === "follow") {
        void createNotification({
          userId: profileId,
          actorId: viewerId,
          type: "new_follower",
          payload: {
            message: `${viewerUsername ?? viewerEmail ?? "Someone"} started following you.`,
          },
        });
      }
    } catch (error) {
      if (isRateLimitError(error)) {
        toast.error(getRateLimitMessage(error));
      } else {
        toast.error(action === "follow" ? "Failed to follow" : "Failed to unfollow");
      }
    }
  }, [
    followMutation,
    followStatusQuery.data,
    navigate,
    profileId,
    queryClient,
    viewerEmail,
    viewerId,
    viewerUsername,
  ]);

  const updateBio = useCallback(async (nextBio: string) => {
    if (!viewerId || !profileId || viewerId !== profileId) return false;
    try {
      const updated = await updateBioMutation.mutateAsync(nextBio);
      const updateCache = (current: Profile | null) =>
        current ? { ...current, bio: updated } : current;
      queryClient.setQueryData(qk.profile(slug), updateCache);
      if (profile?.username && profile.username !== slug) {
        queryClient.setQueryData(qk.profile(profile.username), updateCache);
      }
      toast.success("Bio updated!");
      return true;
    } catch (error) {
      toast.error("Failed to update bio");
      return false;
    }
  }, [profile, profileId, queryClient, slug, updateBioMutation, viewerId]);

  const blockProfile = useCallback(async () => {
    if (!viewerId || !profileId) return false;
    try {
      await blockMutation.mutateAsync("block");
      toast.success("User blocked. You won’t see their catches or comments.");
      queryClient.setQueryData(qk.profileBlockStatus(viewerId, profileId), {
        isBlockedByMe: true,
        isViewerBlockedByProfileOwner: blockStatusQuery.data?.isViewerBlockedByProfileOwner ?? false,
      });
      return true;
    } catch (err) {
      logger.error("Failed to block profile", err, { profileId, viewerId });
      toast.error("Something went wrong blocking this user.");
      return false;
    }
  }, [blockMutation, blockStatusQuery.data, profileId, queryClient, viewerId]);

  const unblockProfile = useCallback(async () => {
    if (!viewerId || !profileId) return false;
    try {
      await blockMutation.mutateAsync("unblock");
      toast.success("User unblocked. Their content will reappear based on privacy settings.");
      queryClient.setQueryData(qk.profileBlockStatus(viewerId, profileId), {
        isBlockedByMe: false,
        isViewerBlockedByProfileOwner: blockStatusQuery.data?.isViewerBlockedByProfileOwner ?? false,
      });
      return true;
    } catch (err) {
      logger.error("Failed to unblock profile", err, { profileId, viewerId });
      toast.error("Something went wrong unblocking this user.");
      return false;
    }
  }, [blockMutation, blockStatusQuery.data, profileId, queryClient, viewerId]);

  const isNotFound =
    !slug || profileQuery.isError || (profileQuery.isSuccess && !profile);
  const isLoading = profileQuery.isLoading;

  return {
    profile,
    profileId,
    catches,
    hasNextPage: Boolean(catchesQuery.hasNextPage),
    isFetchingNextPage: catchesQuery.isFetchingNextPage,
    fetchNextPage: catchesQuery.fetchNextPage,
    followersCount: followerCountQuery.data ?? 0,
    followingProfiles: followingProfilesQuery.data ?? [],
    isFollowing: Boolean(viewerId && profileId && viewerId !== profileId ? followStatusQuery.data : false),
    followLoading: followMutation.isPending,
    isAdminViewer: adminViewerQuery.data ?? false,
    isAdminProfileOwner: adminProfileQuery.data ?? false,
    isBlockedByMe: blockStatusQuery.data?.isBlockedByMe ?? false,
    isViewerBlockedByProfileOwner: blockStatusQuery.data?.isViewerBlockedByProfileOwner ?? false,
    blockStatusLoading: blockStatusQuery.isLoading,
    blockLoading: blockMutation.isPending,
    isLoading,
    isNotFound,
    toggleFollow,
    updateBio,
    blockProfile,
    unblockProfile,
  };
};
