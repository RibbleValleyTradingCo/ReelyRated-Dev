import PageContainer from "@/components/layout/PageContainer";
import PageSpinner from "@/components/loading/PageSpinner";
import Text from "@/components/typography/Text";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { externalLinkProps } from "@/lib/urls";
import AboutSection from "@/pages/venue-detail/components/AboutSection";
import EventsSection from "@/pages/venue-detail/components/EventsSection";
import HeroStatsStrip from "@/pages/venue-detail/components/HeroStatsStrip";
import LeaderboardSection from "@/pages/venue-detail/components/LeaderboardSection";
import LocationMapSection from "@/pages/venue-detail/components/LocationMapSection";
import PlanYourVisitSection from "@/pages/venue-detail/components/PlanYourVisitSection";
import RecentCatchesSection from "@/pages/venue-detail/components/RecentCatchesSection";
import VenueCarouselSection from "@/pages/venue-detail/components/VenueCarouselSection";
import VenueHero from "@/pages/venue-detail/components/VenueHero";
import { useVenueDetailData } from "@/pages/venue-detail/hooks/useVenueDetailData";
import type { Venue } from "@/pages/venue-detail/types";
import { buildVenueDetailViewModel } from "@/pages/venue-detail/viewModel";
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

const LazyRatingModal = lazy(
  () => import("@/pages/venue-detail/components/RatingModal")
);

const VenueDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const {
    user,
    debugVenue,
    venue,
    venueLoading,
    topCatches,
    topLoading,
    recentCatches,
    upcomingEvents,
    eventsLoading,
    pastEvents,
    pastEventsLoading,
    pastHasMore,
    showPastEvents,
    photos,
    openingHours,
    pricingTiers,
    speciesStock,
    rulesText,
    operationalLoading,
    avgRating,
    ratingCount,
    userRating,
    userRatingResolved,
    ratingLoading,
    ratingModalOpen,
    pendingRating,
    lastKnownAvg,
    lastKnownCount,
    isAdmin,
    isOwner,
    ownershipResolved,
    setShowPastEvents,
    setRatingModalOpen,
    setPendingRating,
    handleRatingSelect,
    loadMorePastEvents,
  } = useVenueDetailData(slug);
  const [heroHasImage, setHeroHasImage] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [stickyCtaHeight, setStickyCtaHeight] = useState(0);
  const ratingTriggerRef = useRef<HTMLButtonElement | null>(null);
  const carouselSwipeStartRef = useRef<number | null>(null);
  const stickyCtaRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const handleHeroImageLoad = useCallback(() => {
    setHeroHasImage(true);
    setHeroReady(true);
    if (debugVenue) {
      console.log("[VenueHero] image loaded");
    }
  }, [debugVenue]);

  const handleHeroImageError = useCallback(() => {
    setHeroHasImage(false);
    setHeroReady(true);
    if (debugVenue) {
      console.log("[VenueHero] image failed to load");
    }
  }, [debugVenue]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [slug]);
  const safeVenue: Venue = venue ?? {
    id: "",
    slug: "",
    name: "",
    location: null,
    description: null,
    created_at: "",
    updated_at: "",
    short_tagline: null,
    ticket_type: null,
    price_from: null,
    facilities: null,
    website_url: null,
    booking_url: null,
    booking_enabled: null,
    contact_phone: null,
    payment_methods: null,
    payment_notes: null,
    total_catches: 0,
    recent_catches_30d: 0,
    headline_pb_weight: null,
    headline_pb_unit: null,
    headline_pb_species: null,
    top_species: null,
    avg_rating: null,
    rating_count: null,
    is_published: null,
  };

  const viewModel = buildVenueDetailViewModel({
    venue: safeVenue,
    topCatches,
    recentCatches,
    photos,
    speciesStock,
    userId: user?.id ?? null,
    isAdmin,
    isOwner,
    avgRating,
    ratingCount,
    userRating,
    ratingLoading,
    lastKnownAvg,
    lastKnownCount,
    heroIndex,
    heroHasImage,
    upcomingEventsCount: upcomingEvents.length,
    pastEventsCount: pastEvents.length,
  });

  const {
    ticketType,
    websiteUrl,
    bookingUrl,
    contactPhone,
    paymentMethods,
    paymentNotes,
    totalCatches,
    recentWindow,
    displayPriceFrom,
    hasPlanContent,
    facilitiesList,
    speciesStock: viewModelSpeciesStock,
    pricingLines,
    heroTagline,
    aboutText,
    heroImages,
    activeHeroImage,
    hasHeroCarousel,
    carouselItems,
    carouselLabel,
    showStickyActions,
    hasEvents,
    activeAnglers,
    recordWeightLabel,
    statsRecordWeightLabel,
    recordSpeciesLabel,
    topSpeciesLabel,
    featuredCatchTitle,
    primaryCtaUrl,
    secondaryCtaUrl,
    secondaryCtaLabel,
    ratingSummaryText,
    scrimClass,
    mapsUrl,
    mapEmbedUrl,
    viewAllCount,
    showAboutAdminHint,
  } = viewModel;

  const bookingEnabled = venue?.booking_enabled !== false;
  const hasOperationalContent =
    openingHours.length > 0 || pricingTiers.length > 0 || Boolean(rulesText);
  const planHasContent =
    hasPlanContent || hasOperationalContent || operationalLoading;

  const featuredCatch = topCatches[0];
  const mapsLink = externalLinkProps(mapsUrl);

  useEffect(() => {
    setHeroIndex(0);
  }, [heroImages.length]);

  useEffect(() => {
    setCarouselIndex(0);
  }, [carouselItems.length]);

  useEffect(() => {
    setHeroHasImage(false);
    setHeroReady(!activeHeroImage);
  }, [activeHeroImage]);

  useEffect(() => {
    const pageEl = pageRef.current;
    if (!pageEl) return;
    if (!showStickyActions) {
      setStickyCtaHeight(0);
      pageEl.style.setProperty("--sticky-cta-h", "0px");
      return;
    }
    const element = stickyCtaRef.current;
    if (!element) return;
    const updateHeight = () => {
      const height = element.getBoundingClientRect().height;
      setStickyCtaHeight(height);
      pageEl.style.setProperty("--sticky-cta-h", `${height + 12}px`);
    };
    updateHeight();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, [showStickyActions]);

  const openRatingModal = (trigger?: HTMLButtonElement | null) => {
    if (!user) return;
    setPendingRating(userRating ?? 3);
    setRatingModalOpen(true);
    if (trigger) ratingTriggerRef.current = trigger;
  };

  const closeRatingModal = () => {
    setRatingModalOpen(false);
    setPendingRating(null);
  };

  useEffect(() => {
    if (!activeHeroImage) return;
    let cancelled = false;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (!cancelled) handleHeroImageLoad();
    };
    img.onerror = () => {
      if (!cancelled) handleHeroImageError();
    };
    img.src = activeHeroImage;
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [activeHeroImage, handleHeroImageError, handleHeroImageLoad]);

  useEffect(() => {
    if (!debugVenue) return;
    console.log("[VenueHero] state", {
      activeHeroImage,
      heroHasImage,
      heroReady,
      hasHeroCarousel,
      heroIndex,
    });
  }, [
    activeHeroImage,
    debugVenue,
    hasHeroCarousel,
    heroHasImage,
    heroIndex,
    heroReady,
  ]);

  const handleCarouselPrev = () => {
    const count = carouselItems.length;
    if (count < 2) return;
    setCarouselIndex((prev) => (prev - 1 + count) % count);
  };

  const handleCarouselNext = () => {
    const count = carouselItems.length;
    if (count < 2) return;
    setCarouselIndex((prev) => (prev + 1) % count);
  };

  const handleCarouselIndexChange = (index: number) => {
    setCarouselIndex(index);
  };

  const handleToggleAboutExpanded = () => {
    setAboutExpanded((prev) => !prev);
  };

  const handleTogglePastEvents = () => {
    setShowPastEvents((prev) => !prev);
  };

  const handleLoadPastEvents = () => {
    loadMorePastEvents();
  };

  if (venueLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <PageContainer className="py-8 md:py-10 lg:py-12">
          <PageSpinner label="Loading venue…" />
        </PageContainer>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="bg-gradient-to-b from-background to-muted">
        <PageContainer className="space-y-6 pb-16 pt-8 md:pt-10 lg:pb-20">
          <Card className="border border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Venue not found</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Text variant="muted">
                This venue doesn&apos;t exist or isn&apos;t published.
              </Text>
              <Button asChild variant="outline">
                <Link to="/venues">Back to venues</Link>
              </Button>
            </CardContent>
          </Card>
        </PageContainer>
      </div>
    );
  }

  return (
    <div
      ref={pageRef}
      className="bg-gradient-to-b from-background to-muted pb-[var(--sticky-cta-h,70px)]"
    >
      <VenueHero
        venue={venue}
        heroTagline={heroTagline}
        ratingSummaryText={ratingSummaryText}
        userRating={userRating}
        isUserRatingResolved={userRatingResolved}
        isLoggedIn={!!user}
        onOpenRatingModal={openRatingModal}
        isOwner={isOwner}
        isAdmin={isAdmin}
        ownershipResolved={ownershipResolved}
        primaryCtaUrl={primaryCtaUrl}
        secondaryCtaUrl={secondaryCtaUrl}
        secondaryCtaLabel={secondaryCtaLabel}
        contactPhone={contactPhone}
        mapsUrl={mapsUrl}
        bookingEnabled={bookingEnabled}
        heroHasImage={heroHasImage}
        heroReady={heroReady}
        activeHeroImage={activeHeroImage}
        scrimClass={scrimClass}
        hasHeroCarousel={hasHeroCarousel}
        heroImages={heroImages}
        heroIndex={heroIndex}
        setHeroIndex={setHeroIndex}
        onHeroImageLoad={handleHeroImageLoad}
        onHeroImageError={handleHeroImageError}
      />
      <PageContainer className="pb-16 pt-2 md:pt-4 lg:pb-20">
        <div>
          <HeroStatsStrip
            totalCatches={totalCatches}
            recentWindow={recentWindow}
            recordWeightLabel={statsRecordWeightLabel}
            topSpeciesLabel={topSpeciesLabel}
          />
          <div className="-mx-4 bg-background md:-mx-6 lg:-mx-8">
            <div className="px-4 md:px-6 lg:px-8">
              <AboutSection
                aboutText={aboutText}
                aboutExpanded={aboutExpanded}
                onToggleAboutExpanded={handleToggleAboutExpanded}
                showAdminHint={showAboutAdminHint}
                venueName={venue.name}
                recordWeightLabel={recordWeightLabel}
                recordSpeciesLabel={recordSpeciesLabel}
                featuredCatch={featuredCatch}
              />
            </div>
          </div>
          <div className="-mx-4 bg-muted/40 md:-mx-6 lg:-mx-8">
            <div className="px-4 md:px-6 lg:px-8">
              <VenueCarouselSection
                items={carouselItems}
                label={carouselLabel}
                index={carouselIndex}
                onPrev={handleCarouselPrev}
                onNext={handleCarouselNext}
                onIndexChange={handleCarouselIndexChange}
                swipeStartRef={carouselSwipeStartRef}
              />
            </div>
          </div>
          <div className="-mx-4 bg-background py-16 md:-mx-6 md:py-20 lg:-mx-8">
            <div className="px-4 md:px-6 lg:px-8">
              <RecentCatchesSection
                recentCatches={recentCatches}
                totalCatches={totalCatches}
                recentWindow={recentWindow}
                venueName={venue.name}
                venueSlug={venue.slug}
                isLoggedIn={!!user}
                isAdmin={isAdmin}
                viewAllCount={viewAllCount}
              />
            </div>
          </div>
          <div className="-mx-4 bg-muted/30 md:-mx-6 lg:-mx-8">
            <div className="px-4 md:px-6 lg:px-8">
              <PlanYourVisitSection
                hasPlanContent={planHasContent}
                isOwner={isOwner}
                isAdmin={isAdmin}
                pricingLines={pricingLines}
                ticketType={ticketType}
                contactPhone={contactPhone}
                facilitiesList={facilitiesList}
                openingHours={openingHours}
                pricingTiers={pricingTiers}
                speciesStock={viewModelSpeciesStock}
                rulesText={rulesText}
                bookingEnabled={bookingEnabled}
                isOperationalLoading={operationalLoading}
                bookingUrl={bookingUrl}
                websiteUrl={websiteUrl}
                mapsUrl={mapsUrl}
                venueName={venue.name}
                recentWindow={recentWindow}
                displayPriceFrom={displayPriceFrom}
                activeAnglers={activeAnglers}
                paymentMethods={paymentMethods}
                paymentNotes={paymentNotes}
              />
            </div>
          </div>
          {hasEvents ? (
            <div className="-mx-4 bg-primary/5 py-16 md:-mx-6 md:py-20 lg:-mx-8">
              <div className="px-4 md:px-6 lg:px-8">
                <EventsSection
                  upcomingEvents={upcomingEvents}
                  pastEvents={pastEvents}
                  eventsLoading={eventsLoading}
                  pastEventsLoading={pastEventsLoading}
                  pastHasMore={pastHasMore}
                  showPastEvents={showPastEvents}
                  onTogglePastEvents={handleTogglePastEvents}
                  onLoadPastEvents={handleLoadPastEvents}
                />
              </div>
            </div>
          ) : null}
          <div className="-mx-4 bg-background md:-mx-6 lg:-mx-8">
            <div className="px-4 md:px-6 lg:px-8">
              <LeaderboardSection
                topCatches={topCatches}
                topLoading={topLoading}
                venueSlug={venue.slug}
              />
            </div>
          </div>
        </div>
      </PageContainer>
      <LocationMapSection
        mapEmbedUrl={mapEmbedUrl}
        mapsUrl={mapsUrl}
        venueName={venue.name}
        venueLocation={venue.location}
        contactPhone={contactPhone}
        stickyCtaOffset={0}
      />
      {ratingModalOpen ? (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-overlay/70 px-4 py-6">
              <div className="h-40 w-full max-w-md rounded-2xl bg-card p-6 shadow-overlay" />
            </div>
          }
        >
          <LazyRatingModal
            open={ratingModalOpen}
            onClose={closeRatingModal}
            pendingRating={pendingRating}
            onPendingRatingChange={setPendingRating}
            onSubmit={handleRatingSelect}
            loading={ratingLoading}
            ratingSummaryText={ratingSummaryText}
            venueName={venue.name}
            triggerRef={ratingTriggerRef}
          />
        </Suspense>
      ) : null}
      {showStickyActions ? (
        <div
          ref={stickyCtaRef}
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/90 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-overlay backdrop-blur md:hidden"
        >
          <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
            <Button
              asChild
              className="flex-1 h-12 rounded-full shadow-card"
            >
              <Link
                to={`/add-catch${venue.slug ? `?venue=${venue.slug}` : ""}`}
              >
                Log catch
              </Link>
            </Button>
            {mapsLink ? (
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-full"
              >
                <a {...mapsLink}>Maps</a>
              </Button>
            ) : (
              <Button
                disabled
                variant="outline"
                className="h-12 rounded-full"
              >
                Maps
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default VenueDetail;
