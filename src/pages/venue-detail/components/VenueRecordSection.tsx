import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { CatchRow } from "@/pages/venue-detail/types";
import { humanizeSpecies } from "@/pages/venue-detail/utils";
import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";

type VenueRecordCardProps = {
  recordWeightLabel: string | null;
  recordSpeciesLabel: string | null;
  featuredCatch?: CatchRow;
  featuredCatchTitle: string | null;
  venueSlug: string;
};

const VenueRecordCard = ({
  recordWeightLabel,
  recordSpeciesLabel,
  featuredCatch,
  featuredCatchTitle,
  venueSlug,
}: VenueRecordCardProps) => {
  const recordSpeciesText = recordSpeciesLabel
    ? humanizeSpecies(recordSpeciesLabel)
    : null;
  const hasRecord = !!recordWeightLabel;
  const recordDate = featuredCatch
    ? new Date(featuredCatch.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-6 md:min-h-[320px] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-stretch">
        <div className="order-last flex h-full flex-col gap-6 p-6 md:order-none md:p-8">
          {hasRecord ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <p className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
                    {recordWeightLabel}
                  </p>
                </div>
                {recordSpeciesText ? (
                  <p className="text-xl font-semibold text-slate-700">
                    {recordSpeciesText}
                  </p>
                ) : null}
              </div>
              {featuredCatch ? (
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={
                          featuredCatch.profiles?.avatar_path
                            ? undefined
                            : featuredCatch.profiles?.avatar_url ?? undefined
                        }
                      />
                      <AvatarFallback>
                        {featuredCatch.profiles?.username?.[0]?.toUpperCase() ??
                          "A"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Caught by
                      </p>
                      <Link
                        to={`/profile/${
                          featuredCatch.profiles?.username ??
                          featuredCatch.user_id
                        }`}
                        className="truncate text-sm font-semibold text-slate-900 hover:text-slate-700"
                      >
                        {featuredCatch.profiles?.username ?? "Unknown angler"}
                      </Link>
                    </div>
                  </div>
                  {recordDate ? (
                    <p className="text-sm text-slate-500">
                      Caught on {recordDate}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  Record details provided by the venue.
                </p>
              )}
              {featuredCatch ? (
                <div>
                  <Button asChild className="h-11 rounded-xl px-5">
                    <Link to={`/catch/${featuredCatch.id}`}>View catch</Link>
                  </Button>
                </div>
              ) : (
                <Link
                  to={`/add-catch${venueSlug ? `?venue=${venueSlug}` : ""}`}
                  className="text-sm font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-900"
                >
                  Log a catch here
                </Link>
              )}
              {featuredCatchTitle ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  "{featuredCatchTitle}"
                </div>
              ) : null}
            </>
          ) : (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-amber-800">
                <Trophy className="h-4 w-4" />
                Venue record not set yet
              </div>
              <p className="text-base text-slate-600">
                Be the first to log a catch and set the venue record.
              </p>
              <Link
                to={`/add-catch${venueSlug ? `?venue=${venueSlug}` : ""}`}
                className="text-sm font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-900"
              >
                Log a catch
              </Link>
            </div>
          )}
        </div>
        <div className="order-first overflow-hidden rounded-2xl bg-slate-100 md:order-none md:h-full md:rounded-none md:rounded-r-3xl">
          <div className="group relative aspect-[4/3] w-full bg-slate-100 md:h-full md:aspect-auto">
              {featuredCatch?.image_url ? (
                <img
                  src={featuredCatch.image_url}
                  alt={featuredCatchTitle ?? "Venue record catch"}
                  className="h-full w-full object-cover object-[center_35%] transition-transform duration-500 group-hover:scale-105"
                />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-amber-100/60 to-amber-50/30 text-sm text-slate-600">
                Record photo not available
              </div>
            )}
            {featuredCatch?.image_url ? (
              <>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent" />
                {hasRecord ? (
                  <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                    Record
                  </span>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueRecordCard;
