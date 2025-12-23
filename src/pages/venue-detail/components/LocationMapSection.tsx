import SectionHeader from "@/components/layout/SectionHeader";
import { Button } from "@/components/ui/button";

type LocationMapSectionProps = {
  mapEmbedUrl: string | null;
  mapsUrl: string;
  venueName: string;
  venueLocation: string | null;
  contactPhone: string;
  stickyCtaOffset?: number;
};

const LocationMapSection = ({
  mapEmbedUrl,
  mapsUrl,
  venueName,
  venueLocation,
  contactPhone,
  stickyCtaOffset = 0,
}: LocationMapSectionProps) => (
  <div
    className="bg-slate-50 space-y-6 border-t border-slate-200/70 pt-12 pb-[calc(16px+env(safe-area-inset-bottom))] md:pt-14"
    style={
      stickyCtaOffset > 0
        ? {
            paddingBottom: `calc(${stickyCtaOffset}px + env(safe-area-inset-bottom, 0px) + 16px)`,
          }
        : undefined
    }
  >
    <div className="px-4 md:px-6 lg:px-8">
      <SectionHeader
        title="Location"
        subtitle="Find this venue on the map."
        titleClassName="text-3xl font-bold text-gray-900 md:text-4xl"
        className="px-0"
      />
    </div>
    <div className="px-4 md:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-8 md:border-r md:border-slate-200">
            {mapEmbedUrl ? (
              <div className="relative h-[260px] overflow-hidden bg-slate-100 sm:h-[320px] lg:h-[420px]">
                <iframe
                  title={`${venueName} map`}
                  src={mapEmbedUrl}
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              <div className="relative flex h-[260px] items-center justify-center bg-slate-100 text-sm text-slate-600 sm:h-[320px] lg:h-[420px]">
                Location not provided — open Maps to search this venue.
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4 p-5 md:col-span-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">Address</p>
              <p className="mt-1 text-sm text-slate-600">
                {venueLocation || "Location details coming soon."}
              </p>
            </div>
            <Button
              asChild
              className="h-11 w-full rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700"
            >
              <a href={mapsUrl} target="_blank" rel="noreferrer">
                Get Directions
              </a>
            </Button>
            {contactPhone ? (
              <Button
                asChild
                variant="outline"
                className="h-11 w-full rounded-lg border-slate-200 bg-white"
              >
                <a href={`tel:${contactPhone}`}>Call Venue</a>
              </Button>
            ) : (
              <Button
                disabled
                variant="outline"
                className="h-11 w-full rounded-lg border-slate-200 bg-white"
              >
                Call Venue
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default LocationMapSection;
