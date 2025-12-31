import Section from "@/components/layout/Section";
import Text from "@/components/typography/Text";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CatchRow } from "@/pages/venue-detail/types";
import {
  humanizeSpecies,
  resolveAvatarUrl,
  sanitizeCatchTitle,
} from "@/pages/venue-detail/utils";
import { Link } from "react-router-dom";

type RecentCatchesSectionProps = {
  recentCatches: CatchRow[];
  totalCatches: number | null;
  recentWindow: number | null;
  venueName: string;
  venueSlug: string;
  isLoggedIn: boolean;
  isAdmin: boolean;
  viewAllCount: number | null;
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
  const hasTotalCatches = totalCatches !== null && totalCatches !== undefined;
  const showUnknownState = !hasTotalCatches && recentCatches.length === 0;
  const showEmptyState = hasTotalCatches ? totalCatches <= 0 : false;
  const formatCatchWeight = (catchItem: CatchRow) =>
    catchItem.weight
      ? `${catchItem.weight}${
          catchItem.weight_unit === "kg" ? "kg" : "lb"
        }`
      : "Weight pending";

  return (
    <Section className="space-y-6">
      <div id="catches" className="text-center space-y-2 md:space-y-3 scroll-mt-24">
        <h2 className="text-3xl font-bold text-foreground md:text-4xl">
          Recent Catches
        </h2>
        <p className="text-base text-muted-foreground md:text-lg">
          See what anglers are landing at {venueName} right now.
        </p>
      </div>
      {showUnknownState ? (
        <Card className="rounded-2xl border border-dashed border-border/60 bg-gradient-to-br from-muted/40 to-background shadow-none">
          <CardContent className="space-y-2 p-5 text-sm text-muted-foreground">
            <Text>Catches are unavailable right now.</Text>
            <Text>Please check back later.</Text>
          </CardContent>
        </Card>
      ) : showEmptyState ? (
        <Card className="rounded-2xl border border-dashed border-border/60 bg-gradient-to-br from-muted/40 to-background shadow-none">
          <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
            <Text>No catches have been logged at this venue yet.</Text>
            <Text>Be the first to add one from your catch log.</Text>
            <Button asChild variant="outline" className="rounded-full">
              <Link to={`/add-catch${venueSlug ? `?venue=${venueSlug}` : ""}`}>
                Be the first to log a catch
              </Link>
            </Button>
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
                    className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:border-border/80 hover:shadow-card-hover"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      {catchItem.image_url ? (
                        <img
                          src={catchItem.image_url}
                          alt={catchTitle || "Recent catch"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="space-y-4 p-6">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={
                              resolveAvatarUrl(
                                catchItem.profiles?.avatar_path,
                                catchItem.profiles?.avatar_url
                              ) ?? undefined
                            }
                          />
                          <AvatarFallback>
                            {catchItem.profiles?.username
                              ?.charAt(0)
                              .toUpperCase() ?? "A"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {catchItem.profiles?.username ?? "Unknown angler"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(catchItem.created_at).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric" }
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-foreground">
                          {formatCatchWeight(catchItem)}
                        </span>
                        <span className="text-base text-muted-foreground">
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
          {viewAllCount !== null && viewAllCount > 3 ? (
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
