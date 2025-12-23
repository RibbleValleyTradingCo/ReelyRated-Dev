import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import { Button } from "@/components/ui/button";
import type { Venue } from "@/pages/venue-detail/types";
import {
  ExternalLink,
  Globe2,
  MapPin,
  Phone,
  Star,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Link } from "react-router-dom";

type VenueHeroProps = {
  venue: Venue;
  heroTagline: string;
  ratingSummaryText: string;
  userRating: number | null;
  isLoggedIn: boolean;
  onOpenRatingModal: (trigger?: HTMLButtonElement | null) => void;
  isOwner: boolean;
  isAdmin: boolean;
  primaryCtaUrl: string;
  secondaryCtaUrl: string;
  secondaryCtaLabel: string;
  contactPhone: string;
  mapsUrl: string;
  bookingEnabled: boolean;
  heroHasImage: boolean;
  heroReady: boolean;
  activeHeroImage: string | null;
  scrimClass: string;
  hasHeroCarousel: boolean;
  heroImages: string[];
  heroIndex: number;
  setHeroIndex: Dispatch<SetStateAction<number>>;
  onHeroImageLoad: () => void;
  onHeroImageError: () => void;
};

const VenueHero = ({
  venue,
  heroTagline,
  ratingSummaryText,
  userRating,
  isLoggedIn,
  onOpenRatingModal,
  isOwner,
  isAdmin,
  primaryCtaUrl,
  secondaryCtaUrl,
  secondaryCtaLabel,
  contactPhone,
  mapsUrl,
  bookingEnabled,
  heroHasImage,
  heroReady,
  activeHeroImage,
  scrimClass,
  hasHeroCarousel,
  heroImages,
  heroIndex,
  setHeroIndex,
  onHeroImageLoad,
  onHeroImageError,
}: VenueHeroProps) => (
  <div className="relative w-full overflow-hidden text-white">
    <div className="relative">
      <div
        className={`absolute inset-0 ${heroHasImage ? "bg-cover bg-center" : "bg-slate-950"}`}
        style={{
          backgroundImage:
            heroHasImage && activeHeroImage
              ? `url(${activeHeroImage})`
              : "radial-gradient(circle at top, rgba(148,163,184,0.2) 0%, rgba(15,23,42,0.94) 50%, rgba(8,12,20,0.98) 100%)",
          backgroundColor: "#0b1220",
        }}
      />
      {!heroHasImage ? (
        <>
          <div
            className="absolute -top-24 right-10 h-56 w-56 rounded-full bg-sky-500/25 blur-3xl"
            aria-hidden
          />
          <div
            className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/3 translate-y-1/3 rounded-full bg-sky-600/20 blur-3xl"
            aria-hidden
          />
        </>
      ) : null}
      {activeHeroImage && !heroReady ? (
        <div
          className="absolute inset-0 animate-pulse bg-slate-200/80"
          aria-hidden
        />
      ) : null}
      <div className={`absolute inset-0 ${scrimClass}`} />
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.12) 0, transparent 35%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.08) 0, transparent 30%), radial-gradient(circle at 40% 70%, rgba(255,255,255,0.06) 0, transparent 30%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-10 text-center sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-200/80 sm:text-xs">
          <Link to="/venues" className="hover:underline">
            Venues
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-sky-300">{venue.name}</span>
        </div>
        <div className="mt-4 w-full space-y-5 lg:space-y-6">
          <div className="space-y-3 min-w-0">
            <Heading
              as="h1"
              className="text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl"
            >
              {venue.name}
            </Heading>
            {venue.is_published === false && (isOwner || isAdmin) ? (
              <span className="inline-flex items-center justify-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
                Unpublished — only visible to you and admins
              </span>
            ) : null}
            <div className="flex items-center justify-center gap-2 text-sm text-slate-100 min-w-0 sm:text-base">
              {venue.location ? (
                <span className="inline-flex items-center gap-2 min-w-0 text-slate-100">
                  <MapPin className="h-4 w-4 text-slate-200" />
                  <span className="truncate">{venue.location}</span>
                </span>
              ) : null}
            </div>
            <Text className="mx-auto max-w-3xl text-base text-slate-100/90 sm:text-lg lg:text-xl">
              {heroTagline}
            </Text>
            <div className="flex flex-col gap-2 text-sm text-slate-200/85 sm:flex-row sm:items-center sm:justify-center sm:gap-3 min-w-0 sm:text-base">
              <div className="flex min-w-0 items-center justify-center gap-2 text-sm font-semibold text-white sm:text-base">
                <Star className="h-5 w-5 fill-amber-300 text-amber-300" />
                <span className="truncate">{ratingSummaryText}</span>
              </div>
              {isLoggedIn ? (
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-200/85 min-w-0 min-h-[28px] sm:min-h-[24px] sm:text-sm">
                  {userRating !== null ? (
                    <>
                      <span className="truncate text-slate-200/80">
                        You rated this {userRating} star
                        {userRating === 1 ? "" : "s"}
                      </span>
                      <button
                        type="button"
                        onClick={(event) => onOpenRatingModal(event.currentTarget)}
                        className="text-xs font-semibold text-white underline underline-offset-2 hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:text-sm"
                      >
                        Change
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={(event) => onOpenRatingModal(event.currentTarget)}
                      className="text-xs font-semibold text-white underline underline-offset-2 hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:text-sm"
                    >
                      Rate this venue
                    </button>
                  )}
                </div>
              ) : (
                <Text className="text-xs text-slate-200/80 sm:text-sm">
                  <Link to="/auth" className="underline hover:text-white">
                    Log in
                  </Link>{" "}
                  to rate this venue.
                </Text>
              )}
            </div>
            <div className="mt-4 flex w-full flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
              {primaryCtaUrl && bookingEnabled ? (
                <Button
                  asChild
                  className="h-12 w-full rounded-xl bg-blue-600 text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg sm:w-[180px]"
                >
                  <a href={primaryCtaUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Book Now
                  </a>
                </Button>
              ) : (
                <Button
                  disabled
                  className="h-12 w-full rounded-xl bg-blue-600 text-white shadow-md sm:w-[180px]"
                >
                  Book Now
                </Button>
              )}
              {contactPhone ? (
                <Button
                  asChild
                  className="h-12 w-full rounded-xl bg-blue-600/90 text-white shadow-md transition hover:bg-blue-600 sm:w-[180px]"
                >
                  <a href={`tel:${contactPhone}`}>
                    <Phone className="h-4 w-4" />
                    Call Venue
                  </a>
                </Button>
              ) : (
                <Button
                  disabled
                  className="h-12 w-full rounded-xl bg-blue-600/70 text-white shadow-md sm:w-[180px]"
                >
                  Call Venue
                </Button>
              )}
              {secondaryCtaUrl ? (
                <Button
                  asChild
                  className="h-12 w-full rounded-xl border border-white/30 bg-white/10 text-white shadow-sm backdrop-blur-sm transition hover:bg-white/15 sm:w-[180px]"
                >
                  <a href={secondaryCtaUrl} target="_blank" rel="noreferrer">
                    <Globe2 className="h-4 w-4" />
                    {secondaryCtaLabel}
                  </a>
                </Button>
              ) : (
                <Button
                  disabled
                  className="h-12 w-full rounded-xl border border-white/30 bg-white/10 text-white shadow-sm sm:w-[180px]"
                >
                  {secondaryCtaLabel}
                </Button>
              )}
              <Button
                asChild
                className="h-12 w-full rounded-xl border border-white/30 bg-white/10 text-white shadow-sm backdrop-blur-sm transition hover:bg-white/15 sm:w-[180px]"
              >
                <a href={mapsUrl} target="_blank" rel="noreferrer">
                  <MapPin className="h-4 w-4" />
                  Get Directions
                </a>
              </Button>
              {isOwner ? (
                <Button
                  asChild
                  className="h-12 w-full rounded-xl border border-white/30 bg-white/10 text-white shadow-sm backdrop-blur-sm transition hover:bg-white/15 sm:w-[180px]"
                >
                  <Link to={`/my/venues/${venue.slug}`}>
                    Manage venue
                  </Link>
                </Button>
              ) : isAdmin ? (
                <Button
                  asChild
                  className="h-12 w-full rounded-xl border border-white/30 bg-white/10 text-white shadow-sm backdrop-blur-sm transition hover:bg-white/15 sm:w-[180px]"
                >
                  <Link to={`/admin/venues/${venue.slug}`}>
                    Edit Venue
                  </Link>
                </Button>
              ) : null}
            </div>
            {!bookingEnabled ? (
              <Text className="text-xs text-slate-200/80">
                Bookings currently closed.
              </Text>
            ) : null}
          </div>
        </div>
      </div>
      {hasHeroCarousel ? (
        <>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-3 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() =>
                setHeroIndex(
                  (prev) => (prev - 1 + heroImages.length) % heroImages.length
                )
              }
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white shadow-lg ring-1 ring-white/20 backdrop-blur transition hover:bg-white/25"
              aria-label="Previous hero image"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() =>
                setHeroIndex((prev) => (prev + 1) % heroImages.length)
              }
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white shadow-lg ring-1 ring-white/20 backdrop-blur transition hover:bg-white/25"
              aria-label="Next hero image"
            >
              ›
            </button>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-2">
            {heroImages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setHeroIndex(idx)}
                className={`pointer-events-auto h-2.5 rounded-full transition ${
                  heroIndex === idx
                    ? "w-6 bg-white"
                    : "w-2.5 bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Show hero image ${idx + 1}`}
              />
            ))}
          </div>
        </>
      ) : null}
      {activeHeroImage ? (
        <img
          src={activeHeroImage}
          alt=""
          aria-hidden="true"
          className="absolute left-0 top-0 h-px w-px opacity-0 pointer-events-none"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          onLoad={onHeroImageLoad}
          onError={onHeroImageError}
        />
      ) : (
        <div className="hidden" aria-hidden="true" />
      )}
    </div>
  </div>
);

export default VenueHero;
