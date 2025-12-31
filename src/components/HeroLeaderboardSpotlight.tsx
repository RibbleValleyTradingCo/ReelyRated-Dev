import { useCallback, useEffect, useRef, useState } from "react";
import { Crown, Fish, Sparkles, Trophy } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import heroFish from "@/assets/hero-fish.jpg";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getFreshwaterSpeciesLabel } from "@/lib/freshwater-data";
import { getProfilePath } from "@/lib/profile";
import { cn } from "@/lib/utils";

interface TopCatch {
  id: string;
  user_id: string | null;
  title: string | null;
  species_slug: string | null;
  weight: number | null;
  weight_unit: string | null;
  image_url: string | null;
  total_score: number | null;
  avg_rating: number | null;
  rating_count: number | null;
  created_at: string | null;
}

interface AnglerProfile {
  username: string | null;
}

type StatsPalette = {
  id: string;
  label: string;
  stops: [string, string, string];
  foreground: string;
  muted: string;
  mutedStrong: string;
  surface: string;
};

const STATS_BAR_THEMES: StatsPalette[] = [
  {
    id: "blue",
    label: "Blue",
    stops: ["#1D4ED8", "#0EA5E9", "#38BDF8"],
    foreground: "#F8FAFC",
    muted: "rgba(248, 250, 252, 0.68)",
    mutedStrong: "rgba(248, 250, 252, 0.82)",
    surface: "rgba(248, 250, 252, 0.18)",
  },
  {
    id: "midnight",
    label: "Midnight",
    stops: ["#0F172A", "#1E293B", "#1E1B4B"],
    foreground: "#F8FAFC",
    muted: "rgba(226, 232, 240, 0.7)",
    mutedStrong: "rgba(226, 232, 240, 0.85)",
    surface: "rgba(248, 250, 252, 0.14)",
  },
  {
    id: "emerald",
    label: "Emerald",
    stops: ["#047857", "#10B981", "#14B8A6"],
    foreground: "#F8FAFC",
    muted: "rgba(240, 253, 250, 0.7)",
    mutedStrong: "rgba(240, 253, 250, 0.86)",
    surface: "rgba(240, 253, 250, 0.18)",
  },
  {
    id: "sunset",
    label: "Sunset",
    stops: ["#F97316", "#F43F5E", "#8B5CF6"],
    foreground: "#FEF2F2",
    muted: "rgba(255, 241, 242, 0.7)",
    mutedStrong: "rgba(255, 241, 242, 0.86)",
    surface: "rgba(255, 241, 242, 0.18)",
  },
];

const buildPaletteGradient = (palette: StatsPalette) =>
  `linear-gradient(120deg, ${palette.stops.join(", ")})`;

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const formatWeight = (weight: number | null, unit: string | null) => {
  if (weight === null || weight === undefined) return null;
  if (!unit) return `${weight}`;
  return `${weight} ${unit}`;
};

const formatSpecies = (species: string | null) => {
  if (!species) return "Unknown species";
  if (species === "other") return "Other species";
  return getFreshwaterSpeciesLabel(species) ?? species.replace(/_/g, " ");
};

const formatRelativeTime = (iso: string | null) => {
  if (!iso) return "Moments ago";
  const created = new Date(iso);
  if (Number.isNaN(created.getTime())) return "Recently";
  const diff = Date.now() - created.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";
  if (diff < hour) {
    const mins = Math.round(diff / minute);
    return `${mins} min${mins === 1 ? "" : "s"} ago`;
  }
  if (diff < day) {
    const hrs = Math.round(diff / hour);
    return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  }
  const days = Math.round(diff / day);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

export const HeroLeaderboardSpotlight = () => {
  const navigate = useNavigate();
  const [topCatch, setTopCatch] = useState<TopCatch | null>(null);
  const [angler, setAngler] = useState<AnglerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsThemeIndex, setStatsThemeIndex] = useState(0);

  const loadingRef = useRef(false);

  const fetchTopCatch = useCallback(
    async (isBackground = false) => {
      if (loadingRef.current && isBackground) {
        return;
      }

      if (!isBackground) {
        setLoading(true);
      }
      loadingRef.current = true;
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from("leaderboard_scores_detailed")
          .select(
            "id, user_id, title, species_slug, weight, weight_unit, image_url, total_score, avg_rating, rating_count, created_at",
          )
          .eq("is_blocked_from_viewer", false)
          .order("total_score", { ascending: false })
          .order("created_at", { ascending: true })
          .order("id", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (queryError) {
          throw queryError;
        }

        if (!data) {
          setTopCatch(null);
          setAngler(null);
          return;
        }

        const normalized: TopCatch = {
          id: data.id,
          user_id: data.user_id ?? null,
          title: data.title ?? null,
          species_slug: data.species_slug ?? null,
          weight: toNumber(data.weight),
          weight_unit: data.weight_unit ?? null,
          image_url: data.image_url ?? null,
          total_score: toNumber(data.total_score),
          avg_rating: toNumber(data.avg_rating),
          rating_count: toNumber(data.rating_count),
          created_at: data.created_at ?? null,
        };

        setTopCatch(normalized);

        if (normalized.user_id) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", normalized.user_id)
            .maybeSingle();

          if (profileError) {
            console.warn("Failed to fetch angler profile", profileError);
            setAngler(null);
          } else {
            setAngler(profileData ?? null);
          }
        } else {
          setAngler(null);
        }
      } catch (caughtError) {
        console.error("Error loading leaderboard spotlight", caughtError);
        setError("Leaderboard is warming up. Be the first to claim the spotlight!");
        setTopCatch(null);
        setAngler(null);
      } finally {
        loadingRef.current = false;
        if (!isBackground) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void fetchTopCatch(false);
  }, [fetchTopCatch]);

  useEffect(() => {
    // Periodic refresh keeps the spotlight current without noisy realtime updates.
    const interval = window.setInterval(() => {
      void fetchTopCatch(true);
    }, 5 * 60 * 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [fetchTopCatch]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/70 px-6 py-10 text-center text-sm font-medium text-muted-foreground">
        Loading top catch…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/70 px-6 py-10 text-center text-sm font-medium text-muted-foreground">
        {error}
      </div>
    );
  }

  if (!topCatch) {
    return (
      <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/70 px-6 py-10 text-center text-sm font-medium text-muted-foreground">
        Be the first to log a catch and get featured here! 🎣
      </div>
    );
  }

  const scoreValue =
    topCatch.total_score !== null && topCatch.total_score !== undefined
      ? topCatch.total_score.toFixed(1)
      : "—";
  const weightLabel = formatWeight(topCatch.weight, topCatch.weight_unit) ?? "—";
  const hasRatings =
    topCatch.rating_count && topCatch.rating_count > 0 && topCatch.avg_rating !== null;
  const ratingValue =
    hasRatings && topCatch.avg_rating !== null ? topCatch.avg_rating.toFixed(1) : "—";
  const ratingCount = topCatch.rating_count ?? 0;
  const ratingCountLabel = `(${ratingCount})`;
  const initials =
    angler?.username && angler.username.length > 0
      ? angler.username
          .split("")
          .filter((char) => /[a-z0-9]/i.test(char))
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "RR";
  const relativeTime = formatRelativeTime(topCatch.created_at);
  const speciesLabel = formatSpecies(topCatch.species_slug);
  const usernameDisplay = angler?.username ? `@${angler.username}` : "ReelyRated";
  const statsTheme = STATS_BAR_THEMES[statsThemeIndex] ?? STATS_BAR_THEMES[0];
  const statsGradient = buildPaletteGradient(statsTheme);
  const valueClassName = "text-3xl font-black md:text-4xl";

  return (
    <div className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:slide-in-from-right-6 motion-safe:duration-500">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Live • Featured Catch
        </span>
      </div>

      <div className="relative overflow-hidden rounded-3xl shadow-ocean">
        <div className="relative h-64 overflow-hidden bg-muted md:h-72">
          <img
            src={topCatch.image_url ?? heroFish}
            alt={topCatch.title ?? speciesLabel}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-inverse-foreground/60 via-inverse-foreground/5 to-transparent md:from-inverse-foreground/45" />

          <div className="absolute right-4 top-4">
            <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/80 via-secondary/80 to-secondary px-4 py-2 text-sm font-semibold text-inverse shadow-card">
              <Crown className="h-4 w-4" aria-hidden="true" />
              <span>#1 Ranked</span>
            </div>
          </div>
        </div>

        <div
          className="px-6 py-5 transition-colors duration-300"
          style={{ backgroundImage: statsGradient, color: statsTheme.foreground }}
        >
          <div className="flex flex-wrap items-center justify-center gap-5 text-center sm:gap-8">
            <div className="flex min-w-[120px] flex-col items-center gap-2">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full shadow-card backdrop-blur-md"
                style={{ backgroundColor: statsTheme.surface }}
              >
                <Trophy className="h-5 w-5" style={{ color: statsTheme.foreground }} aria-hidden="true" />
              </div>
              <span
                className="text-xs font-semibold uppercase tracking-[0.28em]"
                style={{ color: statsTheme.muted }}
              >
                Overall Score
              </span>
              <div className="flex items-end gap-1">
                <span className={valueClassName}>{scoreValue}</span>
              </div>
            </div>
            <div className="flex min-w-[120px] flex-col items-center gap-2">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full shadow-card backdrop-blur-md"
                style={{ backgroundColor: statsTheme.surface }}
              >
                <Fish className="h-5 w-5" style={{ color: statsTheme.foreground }} aria-hidden="true" />
              </div>
              <span
                className="text-xs font-semibold uppercase tracking-[0.28em]"
                style={{ color: statsTheme.muted }}
              >
                Recorded Weight
              </span>
              <div className="flex items-center gap-2">
                <span className={valueClassName}>{weightLabel}</span>
              </div>
            </div>
            <div className="flex min-w-[120px] flex-col items-center gap-2">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full shadow-card backdrop-blur-md"
                style={{ backgroundColor: statsTheme.surface }}
              >
                <Sparkles className="h-5 w-5" style={{ color: statsTheme.mutedStrong }} aria-hidden="true" />
              </div>
              <span
                className="text-xs font-semibold uppercase tracking-[0.28em]"
                style={{ color: statsTheme.muted }}
              >
                Average Rating
              </span>
              <div className="flex flex-wrap items-baseline justify-center gap-2">
                <span className={valueClassName}>{ratingValue}</span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: statsTheme.mutedStrong, opacity: 0.8 }}
                >
                  {ratingCountLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================
             INFO SECTION - REFINED DETAILS
             ======================================== */}
        <div className="border-t-4 border-primary bg-card">
          {/* Title & Species Section */}
          <div className="px-5 pb-4 pt-5">
            <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary transition-colors hover:bg-primary/15">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="truncate">{speciesLabel}</span>
            </div>

            <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground md:text-lg">
              {topCatch.title ?? "Untitled catch"}
            </h3>
          </div>

          {/* ENHANCED Angler Section - Gray background for separation */}
          <div className="border-t border-border bg-muted/70 px-5 pb-4 pt-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div className="relative flex-shrink-0">
                  <div
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/60 to-secondary/60 opacity-75 blur-sm"
                    aria-hidden="true"
                  />
                  <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-sm font-bold text-inverse shadow-card ring-2 ring-inverse md:h-10 md:w-10">
                    {initials.slice(0, 1)}
                  </div>
                </div>
                <div className="flex min-w-0 flex-col">
                  {angler?.username && topCatch.user_id ? (
                    <Link
                      to={getProfilePath({ username: angler.username, id: topCatch.user_id })}
                      className="truncate text-sm font-bold text-foreground transition-colors hover:text-primary"
                    >
                      {usernameDisplay}
                    </Link>
                  ) : (
                    <span className="truncate text-sm font-bold text-foreground">{usernameDisplay}</span>
                  )}
                  <span className="text-xs text-muted-foreground">{relativeTime}</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 rounded-lg"
                onClick={() => navigate(`/catch/${topCatch.id}`)}
              >
                <span>View</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span className="uppercase tracking-[0.24em] text-muted-foreground/70">Data palette</span>
        {STATS_BAR_THEMES.map((theme, index) => {
          const selected = index === statsThemeIndex;
          return (
            <button
              key={theme.id}
              type="button"
              className={cn(
                "focus-ring inline-flex items-center rounded-full border px-3 py-1 transition-colors",
                selected
                  ? "border-primary/60 bg-primary/10 text-foreground shadow-card"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground",
              )}
              onClick={() => setStatsThemeIndex(index)}
              aria-pressed={selected}
            >
              {theme.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HeroLeaderboardSpotlight;
