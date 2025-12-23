import type { Venue } from "@/pages/venue-detail/types";

type VenueCacheEntry = {
  data: Venue;
  loadedAt: number;
};

type RatingCacheEntry = {
  rating: number | null;
  loadedAt: number;
};

const MAX_VENUE_ENTRIES = 20;
const MAX_RATING_ENTRIES = 100;

const venueCache = new Map<string, VenueCacheEntry>();
const ratingCache = new Map<string, RatingCacheEntry>();

export const getVenueCache = (slug: string) => {
  const entry = venueCache.get(slug);
  if (!entry) return null;
  venueCache.delete(slug);
  venueCache.set(slug, entry);
  return entry;
};

export const setVenueCache = (slug: string, entry: VenueCacheEntry) => {
  if (!slug) return;
  if (venueCache.has(slug)) {
    venueCache.delete(slug);
  }
  venueCache.set(slug, entry);
  if (venueCache.size > MAX_VENUE_ENTRIES) {
    const oldestKey = venueCache.keys().next().value;
    if (oldestKey) venueCache.delete(oldestKey);
  }
};

export const clearVenueCache = () => {
  venueCache.clear();
};

export const getVenueRatingCache = (key: string) => {
  const entry = ratingCache.get(key);
  if (!entry) return null;
  ratingCache.delete(key);
  ratingCache.set(key, entry);
  return entry;
};

export const setVenueRatingCache = (key: string, entry: RatingCacheEntry) => {
  if (!key) return;
  if (ratingCache.has(key)) {
    ratingCache.delete(key);
  }
  ratingCache.set(key, entry);
  if (ratingCache.size > MAX_RATING_ENTRIES) {
    const oldestKey = ratingCache.keys().next().value;
    if (oldestKey) ratingCache.delete(oldestKey);
  }
};

export const clearVenueRatingCache = () => {
  ratingCache.clear();
};
