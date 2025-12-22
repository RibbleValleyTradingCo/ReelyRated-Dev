import SectionHeader from "@/components/layout/SectionHeader";
import { Button } from "@/components/ui/button";

type LocationMapSectionProps = {
  mapEmbedUrl: string | null;
  mapsUrl: string;
  venueName: string;
};

const LocationMapSection = ({
  mapEmbedUrl,
  mapsUrl,
  venueName,
}: LocationMapSectionProps) => (
  <div className="space-y-6 border-t border-slate-200/70 pt-12 pb-[calc(16px+env(safe-area-inset-bottom))] md:pt-14">
    <div className="px-4 md:px-6 lg:px-8">
      <SectionHeader
        title="Location"
        subtitle="Find this venue on the map."
        className="px-0"
      />
    </div>
    <div className="w-full max-w-none">
      <div className="relative w-full max-w-none bg-gradient-to-br from-primary/10 via-white to-white">
        {mapEmbedUrl ? (
          <div className="relative h-[280px] overflow-hidden bg-slate-100 sm:h-[360px] lg:h-[440px]">
            <iframe
              title={`${venueName} map`}
              src={mapEmbedUrl}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          <div className="relative flex h-[280px] items-center justify-center bg-slate-100 text-sm text-slate-600 sm:h-[360px] lg:h-[440px]">
            Location not provided — open Maps to search this venue.
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 ring-1 ring-slate-200/80" />
        <div className="absolute bottom-4 right-4 sm:bottom-5 sm:right-6 lg:bottom-4">
          <Button
            asChild
            size="sm"
            className="pointer-events-auto h-10 rounded-xl bg-white/90 text-slate-900 shadow-md hover:bg-white"
          >
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              Open in Google Maps
            </a>
          </Button>
        </div>
      </div>
    </div>
  </div>
);

export default LocationMapSection;
