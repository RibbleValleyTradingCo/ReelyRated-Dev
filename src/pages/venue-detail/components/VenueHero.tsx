import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import { Button } from "@/components/ui/button";
import { externalLinkProps } from "@/lib/urls";
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
  isUserRatingResolved: boolean;
  isLoggedIn: boolean;
  onOpenRatingModal: (trigger?: HTMLButtonElement | null) => void;
  isOwner: boolean;
  isAdmin: boolean;
  ownershipResolved: boolean;
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
  isUserRatingResolved,
  isLoggedIn,
  onOpenRatingModal,
  isOwner,
  isAdmin,
  ownershipResolved,
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
}: VenueHeroProps) => {
  const primaryCtaLink = externalLinkProps(primaryCtaUrl);
  const secondaryCtaLink = externalLinkProps(secondaryCtaUrl);
  const mapsLink = externalLinkProps(mapsUrl);
  const phoneLink = externalLinkProps(contactPhone ? `tel:${contactPhone}` : null);

  const outlineButtonClass =
    "h-12 w-full rounded-xl border border-inverse/30 bg-inverse/10 text-inverse shadow-card backdrop-blur-sm transition hover:bg-inverse/15 sm:w-[180px] dark:border-inverse-foreground/30 dark:bg-inverse-foreground/10 dark:text-inverse-foreground dark:hover:bg-inverse-foreground/15";

  return (
    <div className="relative w-full overflow-hidden text-inverse dark:text-inverse-foreground">
      <div className="relative">
        <div
          className={`absolute inset-0 ${heroHasImage ? "bg-cover bg-center" : "bg-overlay"}`}
          style={{
            backgroundImage:
              heroHasImage && activeHeroImage
                ? `url(${activeHeroImage})`
                : "radial-gradient(circle at top, hsl(var(--overlay) / 0.35) 0%, hsl(var(--overlay) / 0.85) 50%, hsl(var(--overlay) / 0.95) 100%)",
            backgroundColor: "hsl(var(--overlay))",
          }}
        />
        {!heroHasImage ? (
          <>
            <div
              className="absolute -top-24 right-10 h-56 w-56 rounded-full bg-primary/25 blur-3xl"
              aria-hidden
            />
            <div
              className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/3 translate-y-1/3 rounded-full bg-secondary/20 blur-3xl"
              aria-hidden
            />
          </>
        ) : null}
        {activeHeroImage && !heroReady ? (
          <div
            className="absolute inset-0 animate-pulse bg-muted/80"
            aria-hidden
          />
        ) : null}
        <div className={`absolute inset-0 ${scrimClass}`} />
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, hsl(var(--inverse) / 0.12) 0, transparent 35%), radial-gradient(circle at 80% 30%, hsl(var(--inverse) / 0.08) 0, transparent 30%), radial-gradient(circle at 40% 70%, hsl(var(--inverse) / 0.06) 0, transparent 30%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-10 text-center sm:px-6 sm:py-12 lg:px-8 lg:py-14">
          <div className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-inverse/80 sm:text-xs dark:text-inverse-foreground/80">
            <Link to="/venues" className="hover:underline">
              Venues
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-secondary">{venue.name}</span>
          </div>
          <div className="mt-4 w-full space-y-5 lg:space-y-6">
            <div className="space-y-3 min-w-0">
              <Heading
                as="h1"
                className="text-4xl font-extrabold leading-tight text-inverse sm:text-5xl lg:text-6xl dark:text-inverse-foreground"
              >
                {venue.name}
              </Heading>
              {venue.is_published === false && (isOwner || isAdmin) ? (
                <span className="inline-flex items-center justify-center gap-2 rounded-full bg-inverse/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary dark:bg-inverse-foreground/15">
                  Unpublished — only visible to you and admins
                </span>
              ) : null}
              <div className="flex items-center justify-center gap-2 text-sm text-inverse min-w-0 sm:text-base dark:text-inverse-foreground">
                {venue.location ? (
                  <span className="inline-flex items-center gap-2 min-w-0 text-inverse dark:text-inverse-foreground">
                    <MapPin className="h-4 w-4 text-inverse/80 dark:text-inverse-foreground/80" />
                    <span className="truncate">{venue.location}</span>
                  </span>
                ) : null}
              </div>
              <Text className="mx-auto max-w-3xl text-base text-inverse/90 sm:text-lg lg:text-xl dark:text-inverse-foreground/90">
                {heroTagline}
              </Text>
              <div className="flex flex-col gap-2 text-sm text-inverse/85 sm:flex-row sm:items-center sm:justify-center sm:gap-3 min-w-0 sm:text-base dark:text-inverse-foreground/85">
                <div className="flex min-w-0 items-center justify-center gap-2 text-sm font-semibold text-inverse sm:text-base dark:text-inverse-foreground">
                  <Star className="h-5 w-5 fill-accent text-accent" />
                  <span className="truncate">{ratingSummaryText}</span>
                </div>
                {isLoggedIn ? (
                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-inverse/85 min-w-0 min-h-[28px] sm:min-h-[24px] sm:text-sm dark:text-inverse-foreground/85">
                    {!isUserRatingResolved ? (
                      <>
                        <span
                          className="inline-flex h-3 w-24 rounded-full bg-inverse/20 animate-pulse dark:bg-inverse-foreground/20"
                          aria-hidden="true"
                        />
                        <span className="sr-only">Loading your rating</span>
                      </>
                    ) : userRating !== null ? (
                      <>
                        <span className="truncate text-inverse/80 dark:text-inverse-foreground/80">
                          You rated this {userRating} star
                          {userRating === 1 ? "" : "s"}
                        </span>
                        <button
                          type="button"
                          onClick={(event) => onOpenRatingModal(event.currentTarget)}
                          className="text-xs font-semibold text-inverse underline underline-offset-2 hover:text-inverse/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inverse/70 sm:text-sm dark:text-inverse-foreground dark:hover:text-inverse-foreground/90 dark:focus-visible:ring-inverse-foreground/70"
                        >
                          Change
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={(event) => onOpenRatingModal(event.currentTarget)}
                        className="text-xs font-semibold text-inverse underline underline-offset-2 hover:text-inverse/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inverse/70 sm:text-sm dark:text-inverse-foreground dark:hover:text-inverse-foreground/90 dark:focus-visible:ring-inverse-foreground/70"
                      >
                        Rate this venue
                      </button>
                    )}
                  </div>
                ) : (
                  <Text className="text-xs text-inverse/80 sm:text-sm dark:text-inverse-foreground/80">
                    <Link
                      to="/auth"
                      className="underline hover:text-inverse dark:hover:text-inverse-foreground"
                    >
                      Log in
                    </Link>{" "}
                    to rate this venue.
                  </Text>
                )}
              </div>
              {ownershipResolved ? (
                <>
                  <div className="mt-4 flex w-full flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                    {primaryCtaLink && bookingEnabled ? (
                      <Button
                        asChild
                        className="h-12 w-full rounded-xl shadow-card sm:w-[180px]"
                      >
                        <a {...primaryCtaLink}>
                          <ExternalLink className="h-4 w-4" />
                          Book Now
                        </a>
                      </Button>
                    ) : (
                      <Button
                        disabled
                        className="h-12 w-full rounded-xl shadow-card sm:w-[180px]"
                      >
                        Book Now
                      </Button>
                    )}
                    {phoneLink ? (
                      <Button
                        asChild
                        className="h-12 w-full rounded-xl shadow-card sm:w-[180px]"
                      >
                        <a {...phoneLink}>
                          <Phone className="h-4 w-4" />
                          Call Venue
                        </a>
                      </Button>
                    ) : (
                      <Button
                        disabled
                        className="h-12 w-full rounded-xl shadow-card sm:w-[180px]"
                      >
                        Call Venue
                      </Button>
                    )}
                    {secondaryCtaLink ? (
                      <Button
                        asChild
                        className={outlineButtonClass}
                      >
                        <a {...secondaryCtaLink}>
                          <Globe2 className="h-4 w-4" />
                          {secondaryCtaLabel}
                        </a>
                      </Button>
                    ) : (
                      <Button
                        disabled
                        className={outlineButtonClass}
                      >
                        {secondaryCtaLabel}
                      </Button>
                    )}
                    {mapsLink ? (
                      <Button
                        asChild
                        className={outlineButtonClass}
                      >
                        <a {...mapsLink}>
                          <MapPin className="h-4 w-4" />
                          Get Directions
                        </a>
                      </Button>
                    ) : (
                      <Button
                        disabled
                        className={outlineButtonClass}
                      >
                        Get Directions
                      </Button>
                    )}
                    {isOwner ? (
                      <Button
                        asChild
                        className={outlineButtonClass}
                      >
                        <Link to={`/my/venues/${venue.slug}`}>
                          Manage venue
                        </Link>
                      </Button>
                    ) : isAdmin ? (
                      <Button
                        asChild
                        className={outlineButtonClass}
                      >
                        <Link to={`/admin/venues/${venue.slug}`}>
                          Edit Venue
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                  {!bookingEnabled ? (
                    <Text className="text-xs text-inverse/80 dark:text-inverse-foreground/80">
                      Bookings currently closed.
                    </Text>
                  ) : null}
                </>
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
                className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-inverse/15 text-inverse shadow-overlay ring-1 ring-inverse/20 backdrop-blur transition hover:bg-inverse/25 dark:bg-inverse-foreground/15 dark:text-inverse-foreground dark:ring-inverse-foreground/20 dark:hover:bg-inverse-foreground/25"
                aria-label="Previous hero image"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() =>
                  setHeroIndex((prev) => (prev + 1) % heroImages.length)
                }
                className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-inverse/15 text-inverse shadow-overlay ring-1 ring-inverse/20 backdrop-blur transition hover:bg-inverse/25 dark:bg-inverse-foreground/15 dark:text-inverse-foreground dark:ring-inverse-foreground/20 dark:hover:bg-inverse-foreground/25"
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
                      ? "w-6 bg-inverse dark:bg-inverse-foreground"
                      : "w-2.5 bg-inverse/50 hover:bg-inverse/70 dark:bg-inverse-foreground/50 dark:hover:bg-inverse-foreground/70"
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
            // @ts-expect-error fetchpriority is supported in modern browsers but not in TS lib yet.
            fetchpriority="high"
            onLoad={onHeroImageLoad}
            onError={onHeroImageError}
          />
        ) : (
          <div className="hidden" aria-hidden="true" />
        )}
      </div>
    </div>
  );
};

export default VenueHero;
