import Section from "@/components/layout/Section";
import SectionHeader from "@/components/layout/SectionHeader";
import { Button } from "@/components/ui/button";
import type { CatchRow } from "@/pages/venue-detail/types";
import { humanizeSpecies, sanitizeCatchTitle } from "@/pages/venue-detail/utils";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

type LeaderboardSectionProps = {
  topCatches: CatchRow[];
  topLoading: boolean;
  venueSlug?: string;
};

const LeaderboardSection = ({
  topCatches,
  topLoading,
  venueSlug,
}: LeaderboardSectionProps) => {
  const formatWeight = (item: CatchRow) =>
    item.weight
      ? `${item.weight}${item.weight_unit === "kg" ? "kg" : "lb"}`
      : "Weight pending";

  return (
    <Section className="space-y-6 py-14 md:py-16">
      <div id="leaderboard" className="h-0" aria-hidden="true" />
      <SectionHeader
        title="Top Catches Leaderboard"
        subtitle="Think you can beat these? Book a session and get on the board."
        titleClassName="text-3xl font-bold text-foreground md:text-4xl"
        className="px-0 mb-6"
      />
      {topLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-5 text-muted-foreground shadow-card">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading leaderboard…
        </div>
      ) : topCatches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/40 p-5 text-sm text-muted-foreground">
          <p>The leaderboard is waiting for its first entry.</p>
          <p className="mt-1">Start fishing to take the top spot.</p>
          <div className="mt-4">
            <Button asChild variant="outline" className="rounded-full">
              <Link to={`/add-catch${venueSlug ? `?venue=${venueSlug}` : ""}`}>
                Be the first to log a catch
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {topCatches.map((item, index) => {
              const rank = index + 1;
              const medal =
                rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
              const cardTint =
                rank === 1
                  ? "border-primary/30 bg-primary/10"
                  : rank === 2
                  ? "border-secondary/30 bg-secondary/10"
                  : rank === 3
                  ? "border-accent/30 bg-accent/10"
                  : "border-border bg-card";
              const badgeTint =
                rank === 1
                  ? "bg-primary/20 text-primary"
                  : rank === 2
                  ? "bg-secondary/20 text-secondary"
                  : rank === 3
                  ? "bg-accent/20 text-accent"
                  : "bg-muted/70 text-muted-foreground";
              const catchTitle = sanitizeCatchTitle(item.title);
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 rounded-2xl border p-4 shadow-card ${cardTint}`}
                >
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${badgeTint}`}
                  >
                    <span className="mr-0.5">{medal ?? ""}</span>
                    <span>#{rank}</span>
                  </span>
                  <div className="h-16 w-20 overflow-hidden rounded-lg bg-muted">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={catchTitle || "Catch photo"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                        No photo
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {formatWeight(item)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.profiles?.username ?? "Unknown angler"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="hidden overflow-hidden rounded-2xl border border-border/70 bg-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/70 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="relative px-4 py-4 pl-5">Rank</th>
                  <th className="px-4 py-4">Catch</th>
                  <th className="px-4 py-4">Weight</th>
                  <th className="px-4 py-4">Species</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topCatches.map((item, index) => {
                  const rank = index + 1;
                  const medal =
                    rank === 1
                      ? "🥇"
                      : rank === 2
                      ? "🥈"
                      : rank === 3
                      ? "🥉"
                      : null;
                  const rowTint =
                    rank === 1
                      ? "bg-primary/5"
                      : rank === 2
                      ? "bg-secondary/5"
                      : rank === 3
                      ? "bg-accent/5"
                      : index % 2 === 0
                      ? "bg-card"
                      : "bg-muted/30";
                  const rankAccent =
                    rank === 1
                      ? "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-primary"
                      : rank === 2
                      ? "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-secondary"
                      : rank === 3
                      ? "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-accent"
                      : "";
                  const catchTitle = sanitizeCatchTitle(item.title);
                  return (
                    <tr key={item.id} className={`text-muted-foreground ${rowTint}`}>
                      <td
                        className={`relative px-4 py-6 pl-5 font-semibold text-foreground ${rankAccent}`}
                      >
                        <div className="flex items-center gap-2">
                          {medal ? (
                            <span className="text-base">{medal}</span>
                          ) : null}
                          <span>#{rank}</span>
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-14 w-20 overflow-hidden rounded-lg bg-muted">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={catchTitle || "Catch photo"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                                No photo
                              </div>
                            )}
                          </div>
                          <Link
                            to={`/catch/${item.id}`}
                            className="truncate font-semibold text-foreground hover:text-primary"
                          >
                            {catchTitle || "Community catch"}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-6 font-semibold text-foreground tabular-nums">
                        {formatWeight(item)}
                      </td>
                      <td className="px-4 py-6 text-muted-foreground">
                        {item.species
                          ? humanizeSpecies(item.species)
                          : "Species unknown"}
                      </td>
                      <td className="px-4 py-6 text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-6 text-muted-foreground">
                        <Link
                          to={`/profile/${
                            item.profiles?.username ?? item.user_id
                          }`}
                          className="font-semibold text-foreground hover:text-primary"
                        >
                          {item.profiles?.username ?? "Unknown angler"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Section>
  );
};

export default LeaderboardSection;
