import Section from "@/components/layout/Section";
import Text from "@/components/typography/Text";
import MarkdownContent from "@/components/typography/MarkdownContent";
import type { CatchRow } from "@/pages/venue-detail/types";
import { humanizeSpecies } from "@/pages/venue-detail/utils";
import VenueRecordCard from "@/pages/venue-detail/components/VenueRecordCard";

type AboutSectionProps = {
  aboutText: string;
  aboutExpanded: boolean;
  onToggleAboutExpanded: () => void;
  showAdminHint: boolean;
  venueName: string;
  recordWeightLabel: string | null;
  recordSpeciesLabel: string | null;
  featuredCatch?: CatchRow;
};

const AboutSection = ({
  aboutText,
  aboutExpanded,
  onToggleAboutExpanded,
  showAdminHint,
  venueName,
  recordWeightLabel,
  recordSpeciesLabel,
  featuredCatch,
}: AboutSectionProps) => {
  const ratingAverage =
    featuredCatch?.ratings?.length
      ? (
          featuredCatch.ratings.reduce((sum, rating) => sum + rating.rating, 0) /
          featuredCatch.ratings.length
        ).toFixed(1)
      : null;

  return (
    <Section className="space-y-8 py-14 md:py-16">
      <div id="about" className="-mt-24 h-24" aria-hidden="true" />
      <div className="grid gap-8 md:grid-cols-2 md:items-start">
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              About This Venue
            </h2>
            <p className="text-sm text-slate-600">
              What to expect when visiting this venue.
            </p>
          </div>
          <MarkdownContent
            content={aboutText}
            className={`text-lg text-slate-800 ${
              aboutExpanded ? "" : "line-clamp-4"
            }`}
          />
          {aboutText && aboutText.length > 220 ? (
            <button
              type="button"
              onClick={onToggleAboutExpanded}
              aria-expanded={aboutExpanded}
              className="text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary/90"
            >
              {aboutExpanded ? "Show less" : "Read full venue guide"}
            </button>
          ) : null}
          {showAdminHint ? (
            <Text variant="small" className="text-slate-500">
              Add more information about this venue from the Manage venue page.
            </Text>
          ) : null}
        </div>
        <div className="space-y-4">
          <div id="stats" className="space-y-1 scroll-mt-24">
            <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              Venue Record
            </h2>
            <p className="text-sm text-slate-600">
              The heaviest catch at {venueName}.
            </p>
          </div>
          <div className="md:sticky md:top-24 md:self-start">
            <VenueRecordCard
              venueName={venueName}
              catchWeightLabel={
                recordWeightLabel ||
                (featuredCatch?.weight
                  ? `${featuredCatch.weight}${
                      featuredCatch.weight_unit === "kg" ? "kg" : "lb"
                    }`
                  : "Record pending")
              }
              speciesLabel={
                recordSpeciesLabel
                  ? humanizeSpecies(recordSpeciesLabel)
                  : featuredCatch?.species
                  ? humanizeSpecies(featuredCatch.species)
                  : undefined
              }
              anglerName={
                featuredCatch
                  ? featuredCatch.profiles?.username ?? "Unknown angler"
                  : undefined
              }
              timestamp={featuredCatch?.created_at}
              lakeName={featuredCatch?.location ?? null}
              imageUrl={featuredCatch?.image_url ?? null}
              catchUrl={featuredCatch ? `/catch/${featuredCatch.id}` : undefined}
              ratingCount={featuredCatch?.ratings?.length}
              ratingAverage={ratingAverage}
              commentCount={featuredCatch?.comments?.length}
              reactionCount={featuredCatch?.reactions?.length ?? undefined}
              isRecord
            />
          </div>
        </div>
      </div>
    </Section>
  );
};

export default AboutSection;
