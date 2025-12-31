import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Fish, Heart, MapPin, MessageCircle, Star } from "lucide-react";
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
  const showImageOverlay = Boolean(speciesLabel || catchWeightLabel);

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover ${
        isRecord ? "border-l-2 border-l-accent" : ""
      }`}
    >
      <div className="flex flex-col">
        <div className="relative overflow-hidden bg-muted">
          <div className="aspect-[4/3] w-full overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`${venueName} record catch`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Record photo not available
              </div>
            )}
          </div>
          {showImageOverlay ? (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-overlay/85 via-overlay/35 to-transparent p-4 text-inverse dark:text-inverse-foreground">
              <div className="flex items-center justify-between">
                {speciesLabel ? (
                  <div className="flex items-center gap-2">
                    <Fish className="h-5 w-5" />
                    <span className="text-base font-semibold drop-shadow md:text-lg">
                      {speciesLabel}
                    </span>
                  </div>
                ) : (
                  <span />
                )}
                {catchWeightLabel ? (
                  <span className="text-xl font-bold drop-shadow md:text-2xl">
                    {catchWeightLabel}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
          {isRecord ? (
            <span className="absolute right-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground shadow-card">
              Record
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col justify-between gap-4 p-4">
          {!showImageOverlay ? (
            <p className="text-sm text-muted-foreground">
              {catchWeightLabel ? catchWeightLabel : `Record pending at ${venueName}`}
            </p>
          ) : null}
          <div className="space-y-2 text-sm text-muted-foreground">
            {anglerName ? (
              <div className="flex items-center gap-2 w-full min-w-0">
                <Avatar className="w-9 h-9 shrink-0">
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {anglerName?.[0]?.toUpperCase() ?? "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">
                    {anglerName}
                  </div>
                  {dateLabel ? (
                    <div className="text-xs text-muted-foreground">
                      {dateLabel}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : dateLabel ? (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{dateLabel}</span>
              </div>
            ) : null}
            {lakeName ? (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{lakeName}</span>
              </div>
            ) : null}
          </div>
          <div className="mt-auto flex items-center gap-5 pt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-accent fill-accent/90" />
              <span className="text-sm font-semibold text-foreground">
                {summaryAvg ?? "–"}
              </span>
              <span className="text-xs text-muted-foreground">({resolvedRatingCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageCircle
                className={cn(
                  "h-4 w-4",
                  resolvedCommentCount === 0 ? "text-muted-foreground/60" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-sm",
                  resolvedCommentCount === 0 ? "text-muted-foreground/70" : "text-muted-foreground"
                )}
              >
                {resolvedCommentCount}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart
                className={cn(
                  "h-4 w-4",
                  resolvedReactionCount === 0 ? "text-muted-foreground/60" : "text-primary"
                )}
                fill={resolvedReactionCount > 0 ? "currentColor" : "none"}
              />
              <span
                className={cn(
                  "text-sm",
                  resolvedReactionCount === 0 ? "text-muted-foreground/70" : "text-muted-foreground"
                )}
              >
                {resolvedReactionCount}
              </span>
            </div>
          </div>
          {catchUrl ? (
            <Button asChild className="h-10 rounded-xl px-4 shadow-card">
              <Link to={catchUrl}>View full details</Link>
            </Button>
          ) : (
            <Button
              disabled
              className="h-10 rounded-xl px-4 shadow-card"
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
