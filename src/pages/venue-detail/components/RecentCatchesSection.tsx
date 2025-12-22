import Section from "@/components/layout/Section";
import Text from "@/components/typography/Text";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CatchRow } from "@/pages/venue-detail/types";
import { humanizeSpecies, sanitizeCatchTitle } from "@/pages/venue-detail/utils";
import { Link } from "react-router-dom";

type RecentCatchesSectionProps = {
  recentCatches: CatchRow[];
  totalCatches: number;
  recentWindow: number;
  venueName: string;
  venueSlug: string;
  isLoggedIn: boolean;
  isAdmin: boolean;
  viewAllCount: number;
};

const RecentCatchesSection = ({
  recentCatches,
  totalCatches,
  recentWindow,
  venueName,
  venueSlug,
  isLoggedIn,
  isAdmin,
  viewAllCount,
}: RecentCatchesSectionProps) => {
  const recentToShow = recentCatches.slice(0, 3);
  const formatCatchWeight = (catchItem: CatchRow) =>
    catchItem.weight
      ? `${catchItem.weight}${
          catchItem.weight_unit === "kg" ? "kg" : "lb"
        }`
      : "Weight pending";

  return (
    <Section className="space-y-6">
      <div id="catches" className="h-0" aria-hidden="true" />
      <div className="text-center space-y-2 md:space-y-3">
        {recentWindow > 0 ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {recentWindow} catches in the last 30 days
          </div>
        ) : null}
        <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
          Recent Catches
        </h2>
        <p className="text-base text-slate-600 md:text-lg">
          See what anglers are landing at {venueName} right now.
        </p>
      </div>
      {totalCatches <= 0 ? (
        <Card className="rounded-2xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-white shadow-none">
          <CardContent className="space-y-3 p-5 text-sm text-slate-600">
            <Text>No catches have been logged at this venue yet.</Text>
            <Text>Be the first to add one from your catch log.</Text>
            {isLoggedIn && !isAdmin ? (
              <Button asChild className="rounded-full">
                <Link to={`/add-catch${venueSlug ? `?venue=${venueSlug}` : ""}`}>
                  Log a catch at this venue
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <>
          {recentToShow.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {recentToShow.map((catchItem) => {
                const catchTitle = sanitizeCatchTitle(catchItem.title);
                return (
                  <Link
                    key={catchItem.id}
                    to={`/catch/${catchItem.id}`}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                      {catchItem.image_url ? (
                        <img
                          src={catchItem.image_url}
                          alt={catchTitle || "Recent catch"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-500">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="space-y-4 p-6">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={
                              catchItem.profiles?.avatar_path
                                ? undefined
                                : catchItem.profiles?.avatar_url ?? undefined
                            }
                          />
                          <AvatarFallback>
                            {catchItem.profiles?.username
                              ?.charAt(0)
                              .toUpperCase() ?? "A"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {catchItem.profiles?.username ?? "Unknown angler"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(catchItem.created_at).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric" }
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">
                          {formatCatchWeight(catchItem)}
                        </span>
                        <span className="text-base text-slate-600">
                          {catchItem.species
                            ? humanizeSpecies(catchItem.species)
                            : "Species unknown"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : null}
          {viewAllCount > 3 ? (
            <div className="flex justify-center pt-4">
              <Button asChild variant="outline" className="rounded-full px-6">
                <Link to={`/feed?venue=${venueSlug}`}>
                  View all {viewAllCount} catches
                </Link>
              </Button>
            </div>
          ) : null}
        </>
      )}
    </Section>
  );
};

export default RecentCatchesSection;
