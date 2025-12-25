import { useAuthLoading, useAuthUser } from "@/components/AuthProvider";
import { CatchCard } from "@/components/feed/CatchCard";
import { FeedFilters } from "@/components/feed/FeedFilters";
import PageSpinner from "@/components/loading/PageSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import SectionHeader from "@/components/layout/SectionHeader";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import { useFeedData, type FeedScope } from "@/pages/feed/useFeedData";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const capitalizeFirstWord = (value: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
};

const Feed = () => {
  const { user } = useAuthUser();
  const { loading } = useAuthLoading();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const venueSlug = searchParams.get("venue");
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [customSpeciesFilter, setCustomSpeciesFilter] = useState("");
  const [feedScope, setFeedScope] = useState<FeedScope>("all");
  const sessionFilter = searchParams.get("session");

  const {
    catches,
    filteredCatches,
    isLoading,
    isFetchingMore,
    hasMore,
    loadMore,
    venueFilter,
    venueFilterError,
    isAdmin,
  } = useFeedData({
    userId: user?.id,
    venueSlug,
    sessionFilter,
    feedScope,
    speciesFilter,
    customSpeciesFilter,
    sortBy,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) {
      setFeedScope("all");
    }
  }, [user]);

  const clearVenueFilter = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    params.delete("venue");
    navigate({
      pathname: "/feed",
      search: params.toString() ? `?${params.toString()}` : "",
    });
  }, [navigate, searchParams]);

  useEffect(() => {
    if (speciesFilter !== "other" && customSpeciesFilter) {
      setCustomSpeciesFilter("");
    }
  }, [speciesFilter, customSpeciesFilter]);

  const isBusy = loading || isLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted" data-testid="feed-root">
      <PageContainer className="py-8 space-y-6 md:space-y-8">
        <Section>
          <SectionHeader
            title="Community Catches"
            subtitle="See what anglers across the community are catching right now. Filter by venue, species or rating."
            actions={
              !isAdmin ? (
                <Button
                  variant="ocean"
                  size="lg"
                  className="w-full md:w-auto rounded-2xl px-6 py-3 font-semibold shadow-[0_12px_28px_-18px_rgba(14,165,233,0.5)]"
                  onClick={() => navigate("/add-catch")}
                >
                  Log a catch
                </Button>
              ) : undefined
            }
          />
        </Section>

        {venueSlug ? (
          <Section>
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="space-y-2">
                  <Text variant="small" className="font-semibold uppercase tracking-wide text-primary">
                    Venue filter
                  </Text>
                  <Heading size="md">Catches from {venueFilter?.name ?? venueSlug}</Heading>
                  <Text variant="muted">
                    {venueFilterError
                      ? "We couldn't find this venue. Clear the filter to see all catches."
                      : "You're viewing catches logged at this venue."}
                  </Text>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  onClick={clearVenueFilter}
                >
                  Clear filter
                </Button>
              </CardContent>
            </Card>
          </Section>
        ) : null}

        <Section>
          <FeedFilters
            feedScope={feedScope}
            onFeedScopeChange={setFeedScope}
            speciesFilter={speciesFilter}
            onSpeciesFilterChange={setSpeciesFilter}
            customSpeciesFilter={customSpeciesFilter}
            onCustomSpeciesFilterChange={setCustomSpeciesFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            userDisabled={!user}
          />
        </Section>

        <Section>
          {isBusy ? (
            <PageSpinner label="Loading your feed…" />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 sm:gap-7">
              {filteredCatches.map((catchItem) => (
                <CatchCard
                  key={catchItem.id}
                  catchItem={catchItem}
                  userId={user?.id}
                />
              ))}
            </div>
          )}
        </Section>

        {!isBusy && !sessionFilter && hasMore && (
          <Section>
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isFetchingMore}
                className="min-w-[200px]"
              >
                {isFetchingMore ? "Loading…" : "Load more catches"}
              </Button>
            </div>
          </Section>
        )}

        {filteredCatches.length === 0 && (
          <Section>
            <EmptyState
              message={
                catches.length === 0
                  ? "No catches yet. Be the first to share!"
                  : sessionFilter
                  ? "No catches logged for this session yet."
                  : feedScope === "following"
                  ? "No catches from anglers you follow yet. Explore the full feed or follow more people."
                  : "No catches match your filters"
              }
              actionLabel={isAdmin ? undefined : "Log Your First Catch"}
              onActionClick={isAdmin ? undefined : () => navigate("/add-catch")}
            />
          </Section>
        )}
      </PageContainer>
    </div>
  );
};

export default Feed;
