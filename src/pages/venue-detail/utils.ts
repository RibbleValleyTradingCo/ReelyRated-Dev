import { getPublicAssetUrl } from "@/lib/storage";
import type { CatchRow } from "./types";

export const normalizeCatchRow = (row: CatchRow): CatchRow => ({
  ...row,
  profiles: row.profiles ?? {
    username: "Unknown",
    avatar_path: null,
    avatar_url: null,
  },
  ratings: (row.ratings ?? []) as CatchRow["ratings"],
  comments: (row.comments ?? []) as CatchRow["comments"],
  reactions: (row.reactions ?? []) as CatchRow["reactions"],
  venues: row.venues ?? null,
});

export const humanizeSpecies = (species?: string | null) =>
  species
    ? species.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    : "Species unknown";

export const sanitizeCatchTitle = (title?: string | null) => {
  if (!title) return null;
  const trimmed = title.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (lower.includes("<nav") || lower.includes("</nav")) return null;
  const navTokens = [
    "reelyrated",
    "feed",
    "venues",
    "leaderboard",
    "profile",
    "settings",
  ];
  const tokenMatches = navTokens.filter((token) => lower.includes(token)).length;
  if (tokenMatches >= 2) return null;
  if (lower.includes("|") && tokenMatches >= 1) return null;
  return trimmed;
};

export const getDisplayPriceFrom = (raw: string | null | undefined) => {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.toLowerCase().startsWith("from ")) return trimmed;
  return `From ${trimmed}`;
};

export const normalizeTag = (value: string) => value.trim().toLowerCase();

export const resolveAvatarUrl = (
  avatarPath?: string | null,
  avatarUrl?: string | null
) => {
  if (avatarPath) {
    return getPublicAssetUrl(avatarPath);
  }
  return avatarUrl ?? null;
};

export const formatEventDate = (startsAt: string, endsAt: string | null) => {
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : null;
  const startDate = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const startTime = start.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const endTime = end
    ? end.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;
  return endTime ? `${startDate} · ${startTime}–${endTime}` : `${startDate} · ${startTime}`;
};
