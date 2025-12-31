import { ChevronLeft, ChevronRight } from "lucide-react";
import type { RefObject } from "react";

type VenueCarouselSectionProps = {
  items: { url: string; alt: string }[];
  label: string;
  index: number;
  onPrev: () => void;
  onNext: () => void;
  onIndexChange: (index: number) => void;
  swipeStartRef: RefObject<number | null>;
};

const VenueCarouselSection = ({
  items,
  label,
  index,
  onPrev,
  onNext,
  onIndexChange,
  swipeStartRef,
}: VenueCarouselSectionProps) => {
  const hasMultiple = items.length > 1;
  const activeItem = items[index];

  return (
    <section className="py-10 md:py-12">
      <div className="px-4 md:px-6 lg:px-8">
        <div className="mb-4 text-center md:mb-6">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            {label}
          </h2>
          <p className="mt-2 text-base text-muted-foreground md:text-lg">
            Uploads from the venue and the community.
          </p>
        </div>
      </div>
      <div className="-mx-4 md:-mx-6 lg:-mx-8">
        <div className="relative overflow-hidden bg-muted/60 rounded-none md:rounded-3xl">
          <div
            className="relative aspect-[16/9] w-full overflow-hidden bg-muted/60 md:aspect-[3/1] touch-pan-y"
            onTouchStart={(event) => {
              swipeStartRef.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              const startX = swipeStartRef.current;
              if (startX === null || items.length <= 1) {
                swipeStartRef.current = null;
                return;
              }
              const endX = event.changedTouches[0]?.clientX ?? startX;
              const delta = endX - startX;
              if (Math.abs(delta) > 40) {
                if (delta > 0) {
                  onPrev();
                } else {
                  onNext();
                }
              }
              swipeStartRef.current = null;
            }}
          >
            {activeItem ? (
              <img
                src={activeItem.url}
                alt={activeItem.alt}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                No photos yet.
              </div>
            )}
            {hasMultiple ? (
              <>
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-foreground/35 to-transparent"
                  aria-hidden
                />
                <button
                  type="button"
                  onClick={onPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-card/90 p-2.5 text-foreground shadow-card transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-card/90 p-2.5 text-foreground shadow-card transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
                  {items.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onIndexChange(idx)}
                      className={`h-2.5 rounded-full transition ${
                        index === idx
                          ? "w-6 bg-inverse dark:bg-inverse-foreground"
                          : "w-2.5 bg-inverse/60 dark:bg-inverse-foreground/60"
                      }`}
                      aria-label={`Show photo ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VenueCarouselSection;
