export const qk = {
  venueBySlug: (slug: string | undefined) => ["venueBySlug", slug] as const,
  venueRating: (userId: string | null | undefined, venueId: string | null | undefined) =>
    ["venueRating", userId, venueId] as const,
  venueOpeningHours: (venueId: string | null | undefined) =>
    ["venueOpeningHours", venueId] as const,
  venuePricingTiers: (venueId: string | null | undefined) =>
    ["venuePricingTiers", venueId] as const,
  venueRules: (venueId: string | null | undefined) => ["venueRules", venueId] as const,
  venueRecentCatches: (venueId: string | null | undefined) =>
    ["venueRecentCatches", venueId] as const,
  venuePastEvents: (venueId: string | null | undefined) =>
    ["venuePastEvents", venueId] as const,
  feed: (params: {
    scope?: string;
    filter?: string;
    customSpecies?: string | null;
    venueId?: string | null;
    userId?: string | null;
    sort?: string;
    sessionId?: string | null;
  }) => ["feed", params] as const,
  profile: (slug: string | undefined) => ["profile", slug] as const,
  profileCatches: (profileId: string | null | undefined) =>
    ["profileCatches", profileId] as const,
  profileFollowerCount: (profileId: string | null | undefined) =>
    ["profileFollowerCount", profileId] as const,
  profileFollowing: (profileId: string | null | undefined) =>
    ["profileFollowing", profileId] as const,
  profileFollowStatus: (viewerId: string | null | undefined, profileId: string | null | undefined) =>
    ["profileFollowStatus", viewerId, profileId] as const,
  profileBlockStatus: (viewerId: string | null | undefined, profileId: string | null | undefined) =>
    ["profileBlockStatus", viewerId, profileId] as const,
  notificationsList: (userId: string | null | undefined, limit: number) =>
    ["notificationsList", userId, limit] as const,
  catchById: (catchId: string | undefined) => ["catchById", catchId] as const,
  catchRatingSummary: (catchId: string | undefined, userId: string | null | undefined) =>
    ["catchRatingSummary", catchId, userId] as const,
  catchReactions: (catchId: string | undefined, userId: string | null | undefined) =>
    ["catchReactions", catchId, userId] as const,
  catchFollowStatus: (userId: string | null | undefined, ownerId: string | null | undefined) =>
    ["catchFollowStatus", userId, ownerId] as const,
  catchComments: (catchId: string | undefined) =>
    ["catchComments", catchId] as const,
  catchMentionCandidates: (catchId: string | undefined) =>
    ["catchMentionCandidates", catchId] as const,
  adminStatus: (userId: string | null | undefined) => ["adminStatus", userId] as const,
};

export type QueryKeyFactory = typeof qk;
