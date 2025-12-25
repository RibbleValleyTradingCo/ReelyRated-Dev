import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Star, Trophy, Fish, BarChart3, AlertTriangle } from "lucide-react";
import { getFreshwaterSpeciesLabel } from "@/lib/freshwater-data";
import { resolveAvatarUrl } from "@/lib/storage";
import { ProfileNotificationsSection } from "@/components/ProfileNotificationsSection";
import ProfileNotFound from "@/components/ProfileNotFound";
import ProfileHero from "@/components/profile/ProfileHero";
import ProfileAdminModerationTools from "@/components/profile/ProfileAdminModerationTools";
import ProfileAboutStaffCard from "@/components/profile/ProfileAboutStaffCard";
import ProfileAnglerStatsSection from "@/components/profile/ProfileAnglerStatsSection";
import ProfileFollowingStrip from "@/components/profile/ProfileFollowingStrip";
import ProfileCatchesGrid from "@/components/profile/ProfileCatchesGrid";
import ProfileDeletedStub from "@/components/profile/ProfileDeletedStub";
import ProfileBlockedViewerStub from "@/components/profile/ProfileBlockedViewerStub";
import PageSpinner from "@/components/loading/PageSpinner";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import Text from "@/components/typography/Text";
import { useProfileData } from "@/pages/profile/hooks/useProfileData";
import type { Catch } from "@/pages/profile/types";

const PROFILE_STATUS_PLACEHOLDER = "No intro yet. Tell others where you fish and what you target.";

const formatWeight = (weight: number | null, unit: string | null) => {
  if (weight === null || weight === undefined) return "-";
  return `${weight}${unit === "kg" ? "kg" : "lb"}`;
};

const formatSpecies = (species: string | null) => {
  if (!species) return "-";
  return getFreshwaterSpeciesLabel(species) ?? species.replace(/_/g, " ");
};

const buildProfileStatCards = (stats: {
  total: number;
  avgRating: string;
  heaviestCatch: Catch | null;
  topSpecies: { species: string; count: number } | null;
}) => [
  {
    label: "Total catches",
    value: stats.total ?? 0,
    hint: stats.total > 0 ? null : "Log your first catch",
    icon: <Fish className="h-5 w-5" />,
  },
  {
    label: "Average rating",
    value: stats.avgRating !== "-" ? stats.avgRating : "–",
    hint:
      stats.avgRating !== "-"
        ? null
        : "Ratings will appear once others review your catches.",
    icon: <Star className="h-5 w-5" />,
  },
  {
    label: "Heaviest catch",
    value: stats.heaviestCatch
      ? formatWeight(stats.heaviestCatch.weight, stats.heaviestCatch.weight_unit)
      : "–",
    hint: stats.heaviestCatch ? null : "Add weights to your catches to track PBs.",
    icon: <Trophy className="h-5 w-5" />,
  },
  {
    label: "Top species",
    value: stats.topSpecies
      ? `${formatSpecies(stats.topSpecies.species)} (${stats.topSpecies.count})`
      : "–",
    hint: stats.topSpecies ? null : "No catches yet — species will appear here.",
    icon: <BarChart3 className="h-5 w-5" />,
  },
];

const Profile = () => {
  const { slug } = useParams<{ slug?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState("");
  const [bioExpanded, setBioExpanded] = useState(false);

  const {
    profile,
    profileId,
    catches,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    followersCount,
    followingProfiles,
    isFollowing,
    followLoading,
    isAdminViewer,
    isAdminProfileOwner,
    isBlockedByMe,
    isViewerBlockedByProfileOwner,
    blockStatusLoading,
    blockLoading,
    isLoading,
    isNotFound,
    toggleFollow,
    updateBio,
    blockProfile,
    unblockProfile,
  } = useProfileData({
    slug,
    viewerId: user?.id,
    viewerEmail: user?.email,
    viewerUsername: user?.user_metadata?.username,
  });

  const isOwnProfile = user?.id === profileId;
  const isDeleted = !!profile?.is_deleted;

  const profileAvatarUrl = useMemo(
    () => resolveAvatarUrl({ path: profile?.avatar_path, legacyUrl: profile?.avatar_url }),
    [profile?.avatar_path, profile?.avatar_url]
  );

  useEffect(() => {
    if (!profile) return;
    setEditedBio(profile.bio || "");
  }, [profile?.bio, profile?.id]);

  const handleUpdateBio = async () => {
    if (!user || !isOwnProfile) return;
    const didUpdate = await updateBio(editedBio);
    if (didUpdate) {
      setIsEditing(false);
    }
  };

  const overallStats = useMemo(() => {
    const total = catches.length;
    const allRatings = catches.flatMap((catchItem) => catchItem.ratings.map((r) => r.rating));
    const avgRating =
      allRatings.length > 0
        ? (allRatings.reduce((acc, rating) => acc + rating, 0) / allRatings.length).toFixed(1)
        : "-";

    const heaviestCatch = catches
      .filter((catchItem) => catchItem.weight !== null)
      .reduce<Catch | null>((prev, curr) => {
        if (!prev) return curr;
        if (!prev.weight) return curr;
        if (!curr.weight) return prev;
        return curr.weight > prev.weight ? curr : prev;
      }, null);

    const speciesCount = new Map<string, number>();
    catches.forEach((catchItem) => {
      if (catchItem.species) {
        speciesCount.set(catchItem.species, (speciesCount.get(catchItem.species) ?? 0) + 1);
      }
    });
    const topSpeciesEntry = Array.from(speciesCount.entries()).sort((a, b) => b[1] - a[1])[0];

    const latestCatch = catches[0] ?? null;

    return {
      total,
      avgRating,
      heaviestCatch,
      topSpecies: topSpeciesEntry ? { species: topSpeciesEntry[0], count: topSpeciesEntry[1] } : null,
      latestCatch,
      followingCount: followingProfiles.length,
    };
  }, [catches, followingProfiles]);

  const statsCards = useMemo(
    () =>
      buildProfileStatCards({
        total: overallStats.total,
        avgRating: overallStats.avgRating,
        heaviestCatch: overallStats.heaviestCatch,
        topSpecies: overallStats.topSpecies,
      }),
    [overallStats]
  );

  if (isNotFound) {
    return <ProfileNotFound />;
  }

  if (isDeleted && !isAdminViewer && !isLoading) {
    return <ProfileDeletedStub isOwnProfile={!!isOwnProfile} />;
  }

  const profileBio =
    profile?.bio && profile.bio.trim().length > 0
      ? profile.bio
      : PROFILE_STATUS_PLACEHOLDER;

  const staffBioFallback =
    "This is an official ReelyRated staff account. It’s used for moderation, safety, and product updates.";
  const totalFollowers = followersCount ?? 0;
  const statusPill = {
    label: "Active",
    className: "border-emerald-300/60 bg-emerald-500/10 text-emerald-50",
  };
  const canViewPrivateContent = !profile?.is_private || isOwnProfile || isAdminViewer || isFollowing;
  const isDeletedBanner = isDeleted && isAdminViewer;
  const isPrivateAndBlocked = profile?.is_private && !canViewPrivateContent;
  const shouldShowBlockedViewerStub = isViewerBlockedByProfileOwner && !isAdminViewer;
  const isAdminProfile = isAdminProfileOwner;
  const isAdminSelf = isAdminProfile && isOwnProfile;
  const isAdminPublicView = isAdminProfile && !isOwnProfile;
  const isUsingStaffBioFallback = isAdminProfile && (!profile?.bio || profile.bio.trim().length === 0);
  const displayBio = isUsingStaffBioFallback ? staffBioFallback : profileBio;
  const heroBackgroundClasses = isAdminProfile
    ? "relative overflow-hidden rounded-3xl border border-indigo-200/40 bg-slate-950 text-white shadow-xl"
    : "relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 text-white shadow-xl";

  if (!isLoading && !blockStatusLoading && shouldShowBlockedViewerStub) {
    return <ProfileBlockedViewerStub />;
  }

  if (isLoading || blockStatusLoading || !profile) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PageSpinner label="Loading profile…" />
      </div>
    );
  }

  const handleBlock = async () => {
    await blockProfile();
  };

  const handleUnblock = async () => {
    await unblockProfile();
  };

  const showStatusPill = !isAdminProfile;
  const heroStatTiles = isAdminProfile
    ? []
    : [
        {
          label: "Total catches",
          value: catches.length,
          hint: catches.length === 0 ? "Log your first catch to start your profile." : null,
        },
        {
          label: "Followers",
          value: totalFollowers,
          hint: totalFollowers === 0 ? "Followers will appear once anglers subscribe to you." : null,
        },
        {
          label: "Avg rating",
          value: overallStats.avgRating !== "-" ? overallStats.avgRating : "–",
          hint: overallStats.avgRating === "-" ? "Ratings will appear after reviews." : null,
        },
      ];
  const handleNavigateToAddCatch = () => navigate("/add-catch");
  const handleNavigateToFeed = () => navigate("/feed");
  const handleNavigateToInsights = () => navigate("/insights");
  const handleNavigateToSettings = () => navigate("/settings/profile");
  const handleNavigateToReports = () => navigate("/admin/reports");
  const handleNavigateToAuditLog = () => navigate("/admin/audit-log");
  const handleNavigateToModeration = () => {
    if (profileId) {
      navigate(`/admin/users/${profileId}/moderation`);
    }
  };
  const handleOpenCatch = (catchId: string) => navigate(`/catch/${catchId}`);

  return (
    <div className="min-h-screen bg-slate-50">
      <PageContainer className="py-8 md:py-10">
        <div className="space-y-8">
          {isDeletedBanner || (isBlockedByMe && !isDeleted && !isAdminProfileOwner) ? (
            <Section className="space-y-4">
              {isDeletedBanner ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
                  This account has been deleted. You&apos;re viewing historical data as an admin.
                </div>
              ) : null}
              {isBlockedByMe && !isDeleted && !isAdminProfileOwner ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>You have blocked this angler. Unblock to see their catches again.</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-300 text-amber-800"
                    onClick={handleUnblock}
                    disabled={blockLoading}
                  >
                    {blockLoading ? "Working…" : "Unblock"}
                  </Button>
                </div>
              ) : null}
            </Section>
          ) : null}

          <Section className="space-y-4">
            <ProfileHero
              profile={profile}
              profileAvatarUrl={profileAvatarUrl}
              displayBio={displayBio}
              bio={profile.bio}
              bioExpanded={bioExpanded}
              onToggleBioExpanded={() => setBioExpanded((prev) => !prev)}
              isEditing={isEditing}
              editedBio={editedBio}
              onChangeEditedBio={setEditedBio}
              onSaveBio={handleUpdateBio}
              onCancelEditBio={() => setIsEditing(false)}
              isOwnProfile={isOwnProfile}
              isAdminProfile={isAdminProfile}
              isAdminSelf={isAdminSelf}
              isAdminPublicView={isAdminPublicView}
              isAdminViewer={isAdminViewer}
              isUsingStaffBioFallback={isUsingStaffBioFallback}
              showStatusPill={showStatusPill}
              statusPill={statusPill}
              heroBackgroundClasses={heroBackgroundClasses}
              heroStatTiles={heroStatTiles}
              onAddCatch={handleNavigateToAddCatch}
              onEditProfile={() => setIsEditing(true)}
              onViewStats={handleNavigateToInsights}
              onOpenSettings={handleNavigateToSettings}
              onViewFeed={handleNavigateToFeed}
              onModeration={profileId ? handleNavigateToModeration : undefined}
              onReports={handleNavigateToReports}
              onAuditLog={handleNavigateToAuditLog}
              onToggleFollow={toggleFollow}
              onBlockToggle={isBlockedByMe ? handleUnblock : handleBlock}
              isFollowing={isFollowing}
              followLoading={followLoading}
              isBlockedByMe={isBlockedByMe}
              blockLoading={blockLoading}
            />

            {isAdminPublicView ? (
              <Text variant="small" className="text-slate-600">
                Official ReelyRated staff account. Use report options on catches or comments to flag issues; support links live in Settings.
              </Text>
            ) : null}
          </Section>

          <Section>
            {isAdminSelf ? (
              <ProfileAdminModerationTools profileId={profileId} />
            ) : !isAdminProfile ? (
              <ProfileAnglerStatsSection statsCards={statsCards} />
            ) : (
              <ProfileAboutStaffCard onViewFeed={handleNavigateToFeed} />
            )}
          </Section>

          {isOwnProfile && !isAdminProfile ? (
            <Section>
              <ProfileNotificationsSection userId={profileId} />
            </Section>
          ) : null}

          {!isAdminProfile && !isAdminSelf ? (
            <Section>
              <ProfileFollowingStrip
                isOwnProfile={isOwnProfile}
                username={profile.username}
                followingProfiles={followingProfiles}
                onNavigateToFeed={handleNavigateToFeed}
              />
            </Section>
          ) : null}

          {!isAdminProfile && !isAdminSelf ? (
            <Section>
              <ProfileCatchesGrid
                isOwnProfile={isOwnProfile}
                username={profile.username}
                catches={catches}
                isPrivateAndBlocked={isPrivateAndBlocked}
                onLogCatch={handleNavigateToAddCatch}
                onViewFeed={handleNavigateToFeed}
                onOpenCatch={handleOpenCatch}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onLoadMore={() => void fetchNextPage()}
                formatWeight={formatWeight}
                formatSpecies={formatSpecies}
              />
            </Section>
          ) : null}
        </div>
      </PageContainer>
    </div>
  );
};

export default Profile;
