import { useAuth } from "@/components/AuthProvider";
import PageContainer from "@/components/layout/PageContainer";
import PageSpinner from "@/components/loading/PageSpinner";
import Text from "@/components/typography/Text";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { isAdminUser } from "@/lib/admin";
import AboutSection from "@/pages/venue-detail/components/AboutSection";
import EventsSection from "@/pages/venue-detail/components/EventsSection";
import HeroStatsStrip from "@/pages/venue-detail/components/HeroStatsStrip";
import LeaderboardSection from "@/pages/venue-detail/components/LeaderboardSection";
import LocationMapSection from "@/pages/venue-detail/components/LocationMapSection";
import PlanYourVisitSection from "@/pages/venue-detail/components/PlanYourVisitSection";
import RecentCatchesSection from "@/pages/venue-detail/components/RecentCatchesSection";
import VenueCarouselSection from "@/pages/venue-detail/components/VenueCarouselSection";
import VenueHero from "@/pages/venue-detail/components/VenueHero";
import RatingModal from "@/pages/venue-detail/components/RatingModal";
import type {
  CatchRow,
  TopAngler,
  Venue,
  VenueEvent,
  VenueOpeningHour,
  VenuePhoto,
  VenuePricingTier,
} from "@/pages/venue-detail/types";
import { normalizeCatchRow } from "@/pages/venue-detail/utils";
import { buildVenueDetailViewModel } from "@/pages/venue-detail/viewModel";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

const VenueDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [venueLoading, setVenueLoading] = useState(true);
  const [topCatches, setTopCatches] = useState<CatchRow[]>([]);
  const [recentCatches, setRecentCatches] = useState<CatchRow[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [topLoading, setTopLoading] = useState(false);
  const [recentOffset, setRecentOffset] = useState(0);
  const [recentHasMore, setRecentHasMore] = useState(true);
  const [topAnglers, setTopAnglers] = useState<TopAngler[]>([]);
  const [topAnglersLoading, setTopAnglersLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<VenueEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [pastEvents, setPastEvents] = useState<VenueEvent[]>([]);
  const [pastEventsLoading, setPastEventsLoading] = useState(false);
  const [pastOffset, setPastOffset] = useState(0);
  const [pastHasMore, setPastHasMore] = useState(true);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [photos, setPhotos] = useState<VenuePhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [openingHours, setOpeningHours] = useState<VenueOpeningHour[]>([]);
  const [pricingTiers, setPricingTiers] = useState<VenuePricingTier[]>([]);
  const [rulesText, setRulesText] = useState<string | null>(null);
  const [operationalLoading, setOperationalLoading] = useState(false);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState<number | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [pendingRating, setPendingRating] = useState<number | null>(null);
  const [lastKnownAvg, setLastKnownAvg] = useState<number | null>(null);
  const [lastKnownCount, setLastKnownCount] = useState<number | null>(null);
  const [heroHasImage, setHeroHasImage] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [stickyCtaHeight, setStickyCtaHeight] = useState(0);
  const ratingTriggerRef = useRef<HTMLButtonElement | null>(null);
  const carouselSwipeStartRef = useRef<number | null>(null);
  const stickyCtaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadVenue = async () => {
      if (!slug) return;
      setVenueLoading(true);
      const { data, error } = await supabase.rpc("get_venue_by_slug", {
        p_slug: slug,
      });
      if (error) {
        console.error("Failed to load venue", error);
        setVenue(null);
      } else {
        const row = (data as Venue[] | null)?.[0] ?? null;
        setVenue(row);
        setAvgRating(row?.avg_rating ?? null);
        setRatingCount(row?.rating_count ?? null);
      }
      setVenueLoading(false);
    };
    void loadVenue();
  }, [slug]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [slug]);

  const loadTopCatches = async (venueId: string) => {
    setTopLoading(true);
    const { data, error } = await supabase.rpc("get_venue_top_catches", {
      p_venue_id: venueId,
      p_limit: 6,
    });
    if (error) {
      console.error("Failed to load top catches", error);
      setTopCatches([]);
    } else {
      setTopCatches(((data as CatchRow[]) ?? []).map(normalizeCatchRow));
    }
    setTopLoading(false);
  };

  const loadTopAnglers = async (venueId: string) => {
    setTopAnglersLoading(true);
    const { data, error } = await supabase.rpc("get_venue_top_anglers", {
      p_venue_id: venueId,
      p_limit: 12,
    });
    if (error) {
      console.error("Failed to load top anglers", error);
      setTopAnglers([]);
    } else {
      setTopAnglers((data as TopAngler[]) ?? []);
    }
    setTopAnglersLoading(false);
  };

  const loadRecentCatches = async (
    venueId: string,
    nextOffset = 0,
    append = false
  ) => {
    setRecentLoading(true);
    const limit = 12;
    const { data, error } = await supabase.rpc("get_venue_recent_catches", {
      p_venue_id: venueId,
      p_limit: limit,
      p_offset: nextOffset,
    });
    if (error) {
      console.error("Failed to load recent catches", error);
      if (!append) setRecentCatches([]);
      setRecentHasMore(false);
    } else {
      const fetched = ((data as CatchRow[]) ?? []).map(normalizeCatchRow);
      setRecentCatches(append ? [...recentCatches, ...fetched] : fetched);
      setRecentHasMore(fetched.length === limit);
      setRecentOffset(nextOffset + fetched.length);
    }
    setRecentLoading(false);
  };

  const loadUpcomingEvents = async (venueId: string) => {
    setEventsLoading(true);
    const { data, error } = await supabase.rpc("get_venue_upcoming_events", {
      p_venue_id: venueId,
    });
    if (error) {
      console.error("Failed to load events", error);
      setUpcomingEvents([]);
    } else {
      setUpcomingEvents((data as VenueEvent[]) ?? []);
    }
    setEventsLoading(false);
  };

  const loadPastEvents = async (
    venueId: string,
    nextOffset = 0,
    append = false
  ) => {
    setPastEventsLoading(true);
    const limit = 10;
    const { data, error } = await supabase.rpc("get_venue_past_events", {
      p_venue_id: venueId,
      p_limit: limit,
      p_offset: nextOffset,
    });
    if (error) {
      console.error("Failed to load past events", error);
      if (!append) setPastEvents([]);
      setPastHasMore(false);
    } else {
      const fetched = (data as VenueEvent[]) ?? [];
      setPastEvents(append ? [...pastEvents, ...fetched] : fetched);
      setPastHasMore(fetched.length === limit);
      setPastOffset(nextOffset + fetched.length);
    }
    setPastEventsLoading(false);
  };

  useEffect(() => {
    const loadPhotos = async () => {
      if (!venue?.id) return;
      setPhotosLoading(true);
      const { data, error } = await supabase.rpc("get_venue_photos", {
        p_venue_id: venue.id,
        p_limit: 20,
        p_offset: 0,
      });
      if (error) {
        console.error("Failed to load venue photos", error);
        setPhotos([]);
      } else {
        setPhotos((data as VenuePhoto[]) ?? []);
      }
      setPhotosLoading(false);
    };
    void loadPhotos();
  }, [venue?.id]);

  useEffect(() => {
    const loadOperationalDetails = async () => {
      if (!venue?.id) return;
      setOperationalLoading(true);
      setOpeningHours([]);
      setPricingTiers([]);
      setRulesText(null);
      const [hoursResult, tiersResult, rulesResult] = await Promise.all([
        supabase
          .from("venue_opening_hours")
          .select("*")
          .eq("venue_id", venue.id)
          .order("order_index", { ascending: true }),
        supabase
          .from("venue_pricing_tiers")
          .select("*")
          .eq("venue_id", venue.id)
          .order("order_index", { ascending: true }),
        supabase
          .from("venue_rules")
          .select("rules_text")
          .eq("venue_id", venue.id)
          .maybeSingle(),
      ]);

      if (hoursResult.error) {
        console.error("Failed to load venue opening hours", hoursResult.error);
        if (import.meta.env.DEV) {
          toast.error("Failed to load opening hours.");
        }
      } else {
        setOpeningHours(hoursResult.data ?? []);
      }

      if (tiersResult.error) {
        console.error("Failed to load venue pricing tiers", tiersResult.error);
        if (import.meta.env.DEV) {
          toast.error("Failed to load pricing tiers.");
        }
      } else {
        setPricingTiers(tiersResult.data ?? []);
      }

      if (rulesResult.error) {
        console.error("Failed to load venue rules", rulesResult.error);
        if (import.meta.env.DEV) {
          toast.error("Failed to load venue rules.");
        }
      } else {
        setRulesText(rulesResult.data?.rules_text ?? null);
      }

      setOperationalLoading(false);
    };
    void loadOperationalDetails();
  }, [venue?.id]);

  useEffect(() => {
    if (venue?.id) {
      void loadTopCatches(venue.id);
      void loadTopAnglers(venue.id);
      void loadRecentCatches(venue.id, 0, false);
      void loadUpcomingEvents(venue.id);
      void loadPastEvents(venue.id, 0, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venue?.id]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const adminStatus = await isAdminUser(user.id);
      setIsAdmin(adminStatus);
      if (import.meta.env.DEV) {
        console.log("[VenueDetail] admin status", {
          userId: user.id,
          isAdmin: adminStatus,
        });
      }
    };
    void checkAdmin();
  }, [user]);

  useEffect(() => {
    const checkOwner = async () => {
      if (!venue?.id || !user) {
        setIsOwner(false);
        return;
      }
      const { data, error } = await supabase
        .from("venue_owners")
        .select("venue_id")
        .eq("venue_id", venue.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error || !data) {
        setIsOwner(false);
        if (import.meta.env.DEV) {
          console.log("[VenueDetail] owner status", {
            userId: user.id,
            venueId: venue.id,
            isOwner: false,
          });
        }
        return;
      }
      setIsOwner(true);
      if (import.meta.env.DEV) {
        console.log("[VenueDetail] owner status", {
          userId: user.id,
          venueId: venue.id,
          isOwner: true,
        });
      }
    };
    void checkOwner();
  }, [user, venue?.id]);

  useEffect(() => {
    const loadUserRating = async () => {
      if (!venue?.id || !user) {
        setUserRating(null);
        return;
      }
      const { data, error } = await supabase.rpc("get_my_venue_rating", {
        p_venue_id: venue.id,
      });
      if (error) {
        console.error("Failed to load your venue rating", error);
        return;
      }
      const row = (
        data as { venue_id: string; user_rating: number }[] | null
      )?.[0];
      if (row?.user_rating) {
        setUserRating(row.user_rating);
      } else {
        setUserRating(null);
      }
    };
    void loadUserRating();
  }, [user, venue?.id]);

  const handleRatingSelect = async (rating: number) => {
    if (!venue?.id || !user || ratingLoading) return;
    const previous = userRating;
    const prevAvg = avgRating;
    const prevCount = ratingCount;
    const prevLastAvg = lastKnownAvg;
    const prevLastCount = lastKnownCount;
    setUserRating(rating);
    const currentAvg = avgRating ?? lastKnownAvg ?? 0;
    const currentCount = ratingCount ?? lastKnownCount ?? 0;
    const isFirst = previous === null || previous === undefined;
    const optimisticCount = isFirst ? currentCount + 1 : currentCount || 1;
    const optimisticAvg = isFirst
      ? (currentAvg * currentCount + rating) / optimisticCount
      : currentCount > 0
      ? (currentAvg * currentCount - (previous ?? 0) + rating) / currentCount
      : rating;
    setAvgRating(optimisticAvg);
    setRatingCount(optimisticCount);
    setRatingLoading(true);
    const { data, error } = await supabase.rpc("upsert_venue_rating", {
      p_venue_id: venue.id,
      p_rating: rating,
    });
    if (error) {
      console.error("Failed to submit rating", error);
      toast.error("Could not save your rating. Please try again.");
      setUserRating(previous);
      setAvgRating(prevAvg ?? null);
      setRatingCount(prevCount ?? null);
      setLastKnownAvg(prevLastAvg);
      setLastKnownCount(prevLastCount);
      setRatingLoading(false);
      return;
    }
    const row = (
      data as
        | {
            venue_id: string;
            avg_rating: number | null;
            rating_count: number | null;
            user_rating: number | null;
          }[]
        | null
    )?.[0];
    setAvgRating(row?.avg_rating ?? optimisticAvg);
    setRatingCount(row?.rating_count ?? optimisticCount);
    setUserRating(row?.user_rating ?? rating);
    setRatingModalOpen(false);
    toast.success("Thanks for rating this venue!");
    setRatingLoading(false);
  };

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
    best_for_tags: null,
    facilities: null,
    website_url: null,
    booking_url: null,
    booking_enabled: null,
    contact_phone: null,
    notes_for_rr_team: null,
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
    totalCatches,
    recentWindow,
    displayPriceFrom,
    hasPlanContent,
    facilitiesList,
    bestForTags,
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
    openingHours.length > 0 ||
    pricingTiers.length > 0 ||
    Boolean(rulesText);
  const planHasContent =
    hasPlanContent || hasOperationalContent || operationalLoading;

  const featuredCatch = topCatches[0];

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
    if (!showStickyActions) {
      setStickyCtaHeight(0);
      return;
    }
    const element = stickyCtaRef.current;
    if (!element) return;
    const updateHeight = () => {
      setStickyCtaHeight(element.getBoundingClientRect().height);
    };
    updateHeight();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, [showStickyActions]);

  useEffect(() => {
    if (avgRating !== null && avgRating !== undefined) {
      setLastKnownAvg(avgRating);
    }
    if (ratingCount !== null && ratingCount !== undefined) {
      setLastKnownCount(ratingCount);
    }
  }, [avgRating, ratingCount]);

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

  const handleHeroImageLoad = useCallback(() => {
    setHeroHasImage(true);
    setHeroReady(true);
    if (import.meta.env.DEV) {
      console.log("[VenueHero] image loaded");
    }
  }, []);

  const handleHeroImageError = useCallback(() => {
    setHeroHasImage(false);
    setHeroReady(true);
    if (import.meta.env.DEV) {
      console.log("[VenueHero] image failed to load");
    }
  }, []);

  useEffect(() => {
    if (!activeHeroImage) return;
    let cancelled = false;
    const img = new Image();
    img.decoding = "async";
    img.src = activeHeroImage;
    img.onload = () => {
      if (!cancelled) handleHeroImageLoad();
    };
    img.onerror = () => {
      if (!cancelled) handleHeroImageError();
    };
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [activeHeroImage, handleHeroImageError, handleHeroImageLoad]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.log("[VenueHero] state", {
      activeHeroImage,
      heroHasImage,
      heroReady,
      hasHeroCarousel,
      heroIndex,
    });
  }, [activeHeroImage, hasHeroCarousel, heroHasImage, heroIndex, heroReady]);

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
    if (!venue) return;
    void loadPastEvents(venue.id, pastOffset, true);
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
          <Card className="border border-slate-200 bg-white shadow-sm">
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


  const BookingCtaBanner = () => {
    const bannerPrimaryLabel = bookingUrl ? "Book your session" : "Visit website";
    const bannerPrimaryUrl =
      !bookingUrl || bookingEnabled ? bookingUrl || websiteUrl : null;
    const bannerSecondaryLabel = websiteUrl ? "Check availability" : "Get directions";
    const bannerSecondaryUrl = websiteUrl || mapsUrl;
    const bannerSubtextParts = [
      activeAnglers > 0
        ? `See ${activeAnglers} leaderboard entr${activeAnglers === 1 ? "y" : "ies"}.`
        : "",
      displayPriceFrom ? `${displayPriceFrom} day tickets.` : "",
    ].filter(Boolean);
    const bannerSubtext = bannerSubtextParts.length
      ? bannerSubtextParts.join(" ")
      : "Book your next session directly with the venue.";

    return (
      <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-10 text-white shadow-2xl md:px-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          {recentWindow > 0 ? (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              High demand last 30 days
            </div>
          ) : null}
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Ready to land your next PB?
          </h2>
          <p className="mt-3 text-base text-blue-100 md:text-lg">
            {bannerSubtext}
          </p>
          <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            {bannerPrimaryUrl ? (
              <Button
                asChild
                className="h-12 w-full rounded-xl bg-white text-blue-700 shadow-lg transition hover:bg-slate-100 sm:w-auto"
              >
                <a href={bannerPrimaryUrl} target="_blank" rel="noreferrer">
                  {bannerPrimaryLabel}
                </a>
              </Button>
            ) : (
              <Button
                disabled
                className="h-12 w-full rounded-xl bg-white text-blue-700 shadow-lg sm:w-auto"
              >
                {bannerPrimaryLabel}
              </Button>
            )}
            <Button
              asChild
              className="h-12 w-full rounded-xl border border-white/30 bg-white/10 text-white shadow-sm hover:bg-white/20 sm:w-auto"
            >
              <a href={bannerSecondaryUrl} target="_blank" rel="noreferrer">
                {bannerSecondaryLabel}
              </a>
            </Button>
          </div>
          {!bookingEnabled && bookingUrl ? (
            <p className="mt-3 text-xs text-blue-100">
              Bookings currently closed.
            </p>
          ) : null}
          <p className="mt-4 text-xs text-blue-100">
            {ticketType || "Day tickets available"}
            {recentWindow > 0
              ? ` • ${recentWindow} catches in the last 30 days`
              : ""}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-b from-background to-muted">
      <VenueHero
        venue={venue}
        heroTagline={heroTagline}
        ratingSummaryText={ratingSummaryText}
        userRating={userRating}
        isLoggedIn={!!user}
        onOpenRatingModal={openRatingModal}
        isOwner={isOwner}
        isAdmin={isAdmin}
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
            recordWeightLabel={recordWeightLabel}
            topSpeciesLabel={topSpeciesLabel}
          />
          <div className="-mx-4 bg-white md:-mx-6 lg:-mx-8">
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
          <div className="-mx-4 bg-slate-50 md:-mx-6 lg:-mx-8">
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
          <div className="-mx-4 bg-white py-16 md:-mx-6 md:py-20 lg:-mx-8">
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
          <div className="-mx-4 bg-[#F8FAFC] md:-mx-6 lg:-mx-8">
            <div className="px-4 md:px-6 lg:px-8">
              <PlanYourVisitSection
                hasPlanContent={planHasContent}
                isOwner={isOwner}
                isAdmin={isAdmin}
                pricingLines={pricingLines}
                ticketType={ticketType}
                contactPhone={contactPhone}
                facilitiesList={facilitiesList}
                bestForTags={bestForTags}
                openingHours={openingHours}
                pricingTiers={pricingTiers}
                rulesText={rulesText}
                bookingEnabled={bookingEnabled}
                isOperationalLoading={operationalLoading}
                bookingUrl={bookingUrl}
                websiteUrl={websiteUrl}
                mapsUrl={mapsUrl}
              />
            </div>
          </div>
          <div className="-mx-4 py-16 md:-mx-6 md:py-20 lg:-mx-8">
            <div className="px-4 md:px-6 lg:px-8">
              <BookingCtaBanner />
            </div>
          </div>
          {hasEvents ? (
            <div className="-mx-4 bg-blue-50 py-16 md:-mx-6 md:py-20 lg:-mx-8">
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
          <div className="-mx-4 bg-white md:-mx-6 lg:-mx-8">
            <div className="px-4 md:px-6 lg:px-8">
              <LeaderboardSection
                topCatches={topCatches}
                topLoading={topLoading}
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
        stickyCtaOffset={
          showStickyActions ? Math.max(stickyCtaHeight, 88) : 0
        }
      />
      <RatingModal
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
      {showStickyActions ? (
        <div
          ref={stickyCtaRef}
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/90 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-2xl backdrop-blur md:hidden"
        >
          <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
            <Button
              asChild
              className="flex-1 h-12 rounded-full bg-primary text-white shadow-lg"
            >
              <Link to={`/add-catch${venue.slug ? `?venue=${venue.slug}` : ""}`}>
                Log catch
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-full border-slate-200 bg-white"
            >
              <a href={mapsUrl} target="_blank" rel="noreferrer">
                Maps
              </a>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default VenueDetail;
