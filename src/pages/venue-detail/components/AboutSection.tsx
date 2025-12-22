import Section from "@/components/layout/Section";
import Text from "@/components/typography/Text";
import type { CatchRow } from "@/pages/venue-detail/types";
import VenueRecordCard from "@/pages/venue-detail/components/VenueRecordSection";

type AboutSectionProps = {
  aboutText: string;
  aboutExpanded: boolean;
  onToggleAboutExpanded: () => void;
  showAdminHint: boolean;
  venueName: string;
  recordWeightLabel: string | null;
  recordSpeciesLabel: string | null;
  featuredCatch?: CatchRow;
  featuredCatchTitle: string | null;
  venueSlug: string;
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
  featuredCatchTitle,
  venueSlug,
}: AboutSectionProps) => {
  return (
    <Section className="space-y-8 py-14 md:py-16">
      <div id="about" className="-mt-24 h-24" aria-hidden="true" />
      <div className="grid gap-8 md:grid-cols-2 md:items-start">
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-slate-900">
              About This Venue
            </h2>
            <p className="text-sm text-slate-600">
              What to expect when visiting this venue.
            </p>
          </div>
          <Text
            className={`text-lg text-slate-800 ${
              aboutExpanded ? "" : "line-clamp-4"
            }`}
          >
            {aboutText}
          </Text>
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
            <h2 className="text-2xl font-semibold text-slate-900">
              Venue Record
            </h2>
            <p className="text-sm text-slate-600">
              The heaviest catch at {venueName}.
            </p>
          </div>
          <div className="md:sticky md:top-24 md:self-start">
            <VenueRecordCard
              recordWeightLabel={recordWeightLabel}
              recordSpeciesLabel={recordSpeciesLabel}
              featuredCatch={featuredCatch}
              featuredCatchTitle={featuredCatchTitle}
              venueSlug={venueSlug}
            />
          </div>
        </div>
      </div>
    </Section>
  );
};

export default AboutSection;
