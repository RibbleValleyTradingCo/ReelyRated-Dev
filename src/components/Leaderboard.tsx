import heroFish from "@/assets/hero-fish.jpg";
import { useLeaderboardRealtime } from "@/hooks/useLeaderboardRealtime";
import { getFreshwaterSpeciesLabel } from "@/lib/freshwater-data";
import { Crown } from "lucide-react";
import {
  memo,
  useCallback,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Link } from "react-router-dom";
import { FeedSelect } from "@/components/feed/FeedSelect";
import { useSpeciesOptions } from "@/hooks/useSpeciesOptions";

import "./Leaderboard.css";

const formatSpeciesLabel = (species: string | null) => {
  if (!species) return "Unknown";
  if (species === "other") return "Other";
  return getFreshwaterSpeciesLabel(species) ?? species.replace(/_/g, " ");
};

const formatWeight = (weight: number | null, unit: string | null) => {
  if (weight === null || weight === undefined) return "—";
  if (!unit) return `${weight}`;
  return `${weight} ${unit}`;
};

const formatRating = (avg: number | null, count: number | null) => {
  if (!count || count <= 0 || avg === null) return "—";
  return `⭐ ${avg.toFixed(1)} (${count})`;
};

interface LeaderboardProps {
  limit?: number;
}

const LeaderboardComponent = ({ limit = 50 }: LeaderboardProps) => {
  const [selectedSpecies, setSelectedSpecies] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  const { entries, loading, error } = useLeaderboardRealtime(
    selectedSpecies !== "all" ? selectedSpecies : null,
    limit,
    {
      enableRealtime: false,
      refreshIntervalMs: 3 * 60 * 1000,
    },
  );
  const { options: speciesOptions, isLoading: speciesLoading } = useSpeciesOptions({
    onlyWithCatches: true,
  });
  const speciesFilterOptions = useMemo(
    () => [{ value: "all", label: "All species" }, ...speciesOptions],
    [speciesOptions],
  );

  const handleSpeciesChange = useCallback(
    (value: string) => {
      startTransition(() => {
        setSelectedSpecies(value);
      });
    },
    [startTransition],
  );

  const tableIsBusy = loading || isPending;

  return (
    <div className="leaderboard-wrapper">
      <div className={`leaderboard-controls${tableIsBusy ? " leaderboard-controls--busy" : ""}`}>
        <div className="leaderboard-controls__group">
          <p className="leaderboard-controls__heading">Filter leaderboard by species</p>
          <div className="leaderboard-controls__select">
            <FeedSelect
              label="Species"
              value={selectedSpecies}
              options={speciesFilterOptions}
              onChange={handleSpeciesChange}
              disabled={speciesLoading || loading}
              hideLabel
            />
          </div>
          <span className="leaderboard-meta" aria-live="polite">
            Showing {entries.length} catch{entries.length === 1 ? "" : "es"}
          </span>
        </div>
      </div>

      {error ? (
        <div className="leaderboard-error">
          <p>Error loading leaderboard: {error}</p>
        </div>
      ) : null}

      {tableIsBusy ? (
        <div className="leaderboard-loading" role="status" aria-live="assertive">
          Updating leaderboard…
        </div>
      ) : null}

      {!loading && entries.length === 0 ? (
        <div className="leaderboard-empty">
          No catches yet. Be the first to catch something great! 🎣
        </div>
      ) : null}

      {entries.length > 0 ? (
        <>
          <div className="leaderboard-table-wrapper">
            <table
              className={`leaderboard-table${tableIsBusy ? " leaderboard-table--busy" : ""}`}
              aria-busy={tableIsBusy}
            >
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Score</th>
                  <th>Catch</th>
                  <th>Species</th>
                  <th className="hide-md">Weight</th>
                  <th className="hide-md">Rating</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => {
                  const thumbnail =
                    (entry.gallery_photos && entry.gallery_photos[0]) ||
                    entry.image_url ||
                    heroFish;
                  const isLeader = index === 0;

                  return (
                    <tr
                      key={entry.id}
                      className={`leaderboard-row${isLeader ? " leaderboard-row--leader" : ""}`}
                    >
                      <td className="rank-col">
                        <span className="rank-wrapper">
                          {isLeader ? <Crown className="rank-crown" aria-hidden="true" /> : null}
                          <span>#{index + 1}</span>
                        </span>
                      </td>
                      <td className="score-col">
                        <span className="score-chip">
                          {entry.total_score !== null && entry.total_score !== undefined
                            ? entry.total_score.toFixed(1)
                            : "—"}
                        </span>
                      </td>
                      <td className="title-col">
                        <Link
                          to={`/catch/${entry.id}`}
                          className="catch-cell leaderboard-link"
                          aria-label={`View catch: ${entry.title ?? "Untitled catch"}`}
                        >
                          <div className="catch-thumb">
                            <img src={thumbnail} alt="" />
                          </div>
                          <span className="catch-title">{entry.title ?? "Untitled catch"}</span>
                        </Link>
                      </td>
                      <td className="species-col">{formatSpeciesLabel(entry.species_slug)}</td>
                      <td className="weight-col hide-md">
                        {formatWeight(entry.weight, entry.weight_unit)}
                      </td>
                      <td className="rating-col hide-md">
                        {formatRating(entry.avg_rating, entry.rating_count)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="leaderboard-scroll-hint">Swipe horizontally to see catch stats &raquo;</p>
        </>
      ) : null}
    </div>
  );
};

export const Leaderboard = memo(LeaderboardComponent);

Leaderboard.displayName = "Leaderboard";

export default Leaderboard;
