import Section from "@/components/layout/Section";
import SectionHeader from "@/components/layout/SectionHeader";
import type { CatchRow } from "@/pages/venue-detail/types";
import { humanizeSpecies, sanitizeCatchTitle } from "@/pages/venue-detail/utils";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

type LeaderboardSectionProps = {
  topCatches: CatchRow[];
  topLoading: boolean;
};

const LeaderboardSection = ({ topCatches, topLoading }: LeaderboardSectionProps) => {
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
        className="px-0 mb-6"
      />
      {topLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-5 text-slate-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading leaderboard…
        </div>
      ) : topCatches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-600">
          No leaderboard data yet.
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
                  ? "border-amber-200 bg-amber-50/70"
                  : rank === 2
                  ? "border-slate-200 bg-slate-50/80"
                  : rank === 3
                  ? "border-orange-200 bg-orange-50/70"
                  : "border-slate-200 bg-white";
              const badgeTint =
                rank === 1
                  ? "bg-amber-100 text-amber-800"
                  : rank === 2
                  ? "bg-slate-100 text-slate-700"
                  : rank === 3
                  ? "bg-orange-100 text-orange-800"
                  : "bg-slate-100 text-slate-700";
              const catchTitle = sanitizeCatchTitle(item.title);
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 rounded-2xl border p-4 shadow-sm ${cardTint}`}
                >
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${badgeTint}`}
                  >
                    <span className="mr-0.5">{medal ?? ""}</span>
                    <span>#{rank}</span>
                  </span>
                  <div className="h-16 w-20 overflow-hidden rounded-lg bg-slate-100">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={catchTitle || "Catch photo"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-slate-500">
                        No photo
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatWeight(item)}
                    </p>
                    <p className="truncate text-xs text-slate-600">
                      {item.profiles?.username ?? "Unknown angler"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200/70 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-200/70 text-xs font-semibold uppercase tracking-wider text-slate-700">
                <tr className="border-b border-slate-300">
                  <th className="relative px-4 py-4 pl-5">Rank</th>
                  <th className="px-4 py-4">Catch</th>
                  <th className="px-4 py-4">Weight</th>
                  <th className="px-4 py-4">Species</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
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
                      ? "bg-amber-50/80"
                      : rank === 2
                      ? "bg-slate-100/80"
                      : rank === 3
                      ? "bg-orange-50/80"
                      : index % 2 === 0
                      ? "bg-white"
                      : "bg-slate-50/60";
                  const rankAccent =
                    rank === 1
                      ? "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-amber-400"
                      : rank === 2
                      ? "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-slate-300"
                      : rank === 3
                      ? "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-orange-400"
                      : "";
                  const catchTitle = sanitizeCatchTitle(item.title);
                  return (
                    <tr key={item.id} className={`text-slate-700 ${rowTint}`}>
                      <td
                        className={`relative px-4 py-6 pl-5 font-semibold text-slate-900 ${rankAccent}`}
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
                          <div className="h-14 w-20 overflow-hidden rounded-lg bg-slate-100">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={catchTitle || "Catch photo"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[10px] text-slate-500">
                                No photo
                              </div>
                            )}
                          </div>
                          <Link
                            to={`/catch/${item.id}`}
                            className="truncate font-semibold text-slate-900 hover:text-primary"
                          >
                            {catchTitle || "Community catch"}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-6 font-semibold text-slate-900 tabular-nums">
                        {formatWeight(item)}
                      </td>
                      <td className="px-4 py-6 text-slate-600">
                        {item.species
                          ? humanizeSpecies(item.species)
                          : "Species unknown"}
                      </td>
                      <td className="px-4 py-6 text-slate-600">
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-6 text-slate-600">
                        <Link
                          to={`/profile/${
                            item.profiles?.username ?? item.user_id
                          }`}
                          className="font-semibold text-slate-900 hover:text-primary"
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
