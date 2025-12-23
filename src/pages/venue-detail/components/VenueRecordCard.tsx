import { Button } from "@/components/ui/button";
import { Calendar, Heart, MapPin, MessageCircle, Star, User } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type VenueRecordCardProps = {
  venueName: string;
  catchWeightLabel: string;
  speciesLabel?: string;
  anglerName?: string;
  timestamp?: string | Date;
  lakeName?: string | null;
  imageUrl?: string | null;
  catchUrl?: string;
  isRecord?: boolean;
  ratingCount?: number;
  ratingAverage?: string | null;
  commentCount?: number;
  reactionCount?: number;
};

const formatDate = (value?: string | Date) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const VenueRecordCard = ({
  venueName,
  catchWeightLabel,
  speciesLabel,
  anglerName,
  timestamp,
  lakeName,
  imageUrl,
  catchUrl,
  isRecord = true,
  ratingCount,
  ratingAverage,
  commentCount,
  reactionCount,
}: VenueRecordCardProps) => {
  const dateLabel = formatDate(timestamp);
  const resolvedRatingCount = ratingCount ?? 0;
  const resolvedCommentCount = commentCount ?? 0;
  const resolvedReactionCount = reactionCount ?? 0;
  const summaryAvg = ratingAverage ?? null;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.01] ${
        isRecord ? "border-l-2 border-l-amber-400" : ""
      }`}
    >
      <div className="flex flex-col">
        <div className="relative min-h-[220px] overflow-hidden bg-slate-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${venueName} record catch`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Record photo not available
            </div>
          )}
          {isRecord ? (
            <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
              Record
            </span>
          ) : null}
        </div>
        <div className="flex flex-col justify-between gap-6 p-6">
          <div className="space-y-2">
            <p className="text-4xl font-extrabold tracking-tight text-slate-900">
              {catchWeightLabel || `Record pending at ${venueName}`}
            </p>
            {speciesLabel ? (
              <p className="text-base text-slate-600">{speciesLabel}</p>
            ) : null}
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            {anglerName ? (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <span className="font-medium text-slate-700">
                  {anglerName}
                </span>
              </div>
            ) : null}
            {dateLabel ? (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>{dateLabel}</span>
              </div>
            ) : null}
            {lakeName ? (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{lakeName}</span>
              </div>
            ) : null}
          </div>
          <div className="mt-auto flex items-center gap-5 pt-2 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-amber-500 fill-amber-400/90" />
              <span className="text-sm font-semibold text-slate-900">
                {summaryAvg ?? "–"}
              </span>
              <span className="text-xs text-slate-500">({resolvedRatingCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageCircle
                className={cn(
                  "h-4 w-4",
                  resolvedCommentCount === 0 ? "text-slate-300" : "text-slate-500"
                )}
              />
              <span
                className={cn(
                  "text-sm",
                  resolvedCommentCount === 0 ? "text-slate-400" : "text-slate-600"
                )}
              >
                {resolvedCommentCount}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart
                className={cn(
                  "h-4 w-4",
                  resolvedReactionCount === 0 ? "text-slate-300" : "text-primary"
                )}
                fill={resolvedReactionCount > 0 ? "currentColor" : "none"}
              />
              <span
                className={cn(
                  "text-sm",
                  resolvedReactionCount === 0 ? "text-slate-400" : "text-slate-600"
                )}
              >
                {resolvedReactionCount}
              </span>
            </div>
          </div>
          {catchUrl ? (
            <div>
              <Button asChild className="h-11 rounded-xl bg-blue-600 px-5 text-white shadow-md hover:bg-blue-700">
                <Link to={catchUrl}>View full details</Link>
              </Button>
            </div>
          ) : (
            <Button
              disabled
              className="h-11 rounded-xl bg-blue-600 px-5 text-white shadow-md"
            >
              View full details
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VenueRecordCard;
