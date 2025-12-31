import heroFish from "@/assets/hero-fish.jpg";
import "@/components/Leaderboard.css";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import SectionHeader from "@/components/layout/SectionHeader";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import { useLeaderboardRealtime } from "@/hooks/useLeaderboardRealtime";
import { getFreshwaterSpeciesLabel } from "@/lib/freshwater-data";
import { getProfilePath } from "@/lib/profile";
import { Crown } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

const dateFormatter = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

const formatSpeciesLabel = (species: string | null, custom?: string | null) => {
  if (custom) return custom;
  if (!species) return "Unknown";
  if (species === "other") return "Other";
  return getFreshwaterSpeciesLabel(species) ?? species.replace(/_/g, " ");
};

const formatWeight = (weight: number | null, unit: string | null) => {
  if (weight === null || weight === undefined) return "—";
  if (!unit) return `${weight}`;
  return `${weight} ${unit}`;
};

const formatLength = (length: number | null, unit: string | null) => {
  if (length === null || length === undefined) return "—";
  if (!unit) return `${length}`;
  return `${length} ${unit}`;
};

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
};

const getThumbnail = (gallery: string[] | null, fallback?: string | null) => {
  if (gallery && gallery.length > 0) return gallery[0];
  if (fallback) return fallback;
  return heroFish;
};

const parseConditions = (conditions: unknown) => {
  if (!conditions || typeof conditions !== "object") return {};
  const data = conditions as Record<string, unknown>;
  const customFields = (data.customFields as Record<string, unknown> | undefined) ?? {};
  return {
    customSpecies:
      typeof customFields.species === "string" ? (customFields.species as string) : null,
    customMethod:
      typeof customFields.method === "string" ? (customFields.method as string) : null,
    customLocationLabel:
      typeof (data.gps as Record<string, unknown> | undefined)?.label === "string"
        ? ((data.gps as Record<string, unknown>).label as string)
        : null,
  };
};

const LeaderboardPage = () => {
  const { entries, loading, error } = useLeaderboardRealtime(null, 100);

  const rows = useMemo(() => {
    return entries.map((entry, index) => {
      const { customSpecies, customMethod, customLocationLabel } = parseConditions(
        entry.conditions,
      );

      const speciesSlugOrRaw = entry.species_slug ?? entry.species ?? null;
      const locationLabel = customLocationLabel ?? entry.location_label ?? "—";
      const methodLabel = customMethod ?? entry.method_tag ?? entry.method ?? "—";

      return {
        rank: index + 1,
        id: entry.id,
        catchTitle: entry.title ?? "Untitled catch",
        thumbnail: getThumbnail(entry.gallery_photos, entry.image_url),
        anglerUsername: entry.owner_username,
        anglerId: entry.user_id,
        species: formatSpeciesLabel(speciesSlugOrRaw, customSpecies),
        weight: formatWeight(entry.weight, entry.weight_unit),
        length: formatLength(entry.length, entry.length_unit),
        location: locationLabel,
        method: methodLabel,
        caughtAt: formatDate(entry.caught_at),
        score:
          entry.total_score !== null && entry.total_score !== undefined
            ? entry.total_score.toFixed(1)
            : "—",
      };
    });
  }, [entries]);

  return (
    <div className="min-h-screen bg-background">
      <PageContainer className="py-10 md:py-12 space-y-6 md:space-y-8">
        <Section>
          <SectionHeader
            eyebrow={
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <Crown className="h-4 w-4" aria-hidden="true" />
                Top 100 Leaderboard
              </span>
            }
            title="The most complete catches across the community"
            subtitle="Scores blend weight, ratings, evidence, and logbook completeness. Explore the top 100 catches and jump into the details behind every standout moment on the water."
          />
        </Section>

        {error ? (
          <Section>
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          </Section>
        ) : null}

        <Section>
          {loading ? (
            <div className="rounded-xl border border-border bg-card px-6 py-10 text-center text-muted-foreground shadow-card">
              Loading leaderboard…
            </div>
          ) : (
            <div className="leaderboard-table-wrapper leaderboard-table-wrapper--wide">
              <table className="leaderboard-table text-sm">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Score</th>
                    <th>Catch</th>
                    <th>Angler</th>
                    <th>Species</th>
                    <th>Weight</th>
                    <th>Length</th>
                    <th>Location</th>
                    <th>Method</th>
                    <th>Caught</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="leaderboard-row">
                      <td className="rank-col">
                        <span className="rank-wrapper">
                          {row.rank === 1 ? (
                            <Crown className="rank-crown" aria-hidden="true" />
                          ) : null}
                          #{row.rank}
                        </span>
                      </td>
                      <td className="score-col">
                        <span className="score-chip">{row.score}</span>
                      </td>
                      <td className="title-col">
                        <div className="catch-cell">
                          <div className="catch-thumb">
                            <img
                              src={row.thumbnail}
                              alt=""
                              width={48}
                              height={48}
                              loading="lazy"
                            />
                          </div>
                          <span>{row.catchTitle}</span>
                        </div>
                      </td>
                      <td className="detail-col">
                        {row.anglerUsername && row.anglerId ? (
                          <Link
                            to={getProfilePath({ username: row.anglerUsername, id: row.anglerId })}
                            className="leaderboard-link"
                          >
                            @{row.anglerUsername}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="detail-col">{row.species}</td>
                      <td className="detail-col">{row.weight}</td>
                      <td className="detail-col">{row.length}</td>
                      <td className="detail-col">{row.location}</td>
                      <td className="detail-col">{row.method}</td>
                      <td className="detail-col">{row.caughtAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 ? (
                <Text className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No public catches have been ranked yet. Share your first catch to kick off the leaderboard.
                </Text>
              ) : (
                <p className="leaderboard-scroll-hint">Swipe or scroll sideways to see every stat →</p>
              )}
            </div>
          )}
        </Section>
      </PageContainer>
    </div>
  );
};

export default LeaderboardPage;
