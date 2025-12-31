import { memo, useId } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MessageCircle, Fish, Heart, MapPin } from "lucide-react";
import { getFreshwaterSpeciesLabel } from "@/lib/freshwater-data";
import { shouldShowExactLocation } from "@/lib/visibility";
import { resolveAvatarUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

type CustomFields = {
  species?: string;
  method?: string;
};

type CatchConditions = {
  customFields?: CustomFields;
  gps?: {
    lat: number;
    lng: number;
    accuracy?: number;
    label?: string;
  };
  [key: string]: unknown;
} | null;

interface CatchItem {
  id: string;
  title: string;
  image_url: string;
  user_id: string;
  location: string | null;
  species: string | null;
  weight: number | null;
  weight_unit: string | null;
  visibility: string | null;
  hide_exact_spot: boolean | null;
  profiles: {
    username: string;
    avatar_path: string | null;
    avatar_url: string | null;
  };
  ratings: { rating: number }[];
  comments: { id: string }[];
  reactions: { user_id: string }[] | null;
  conditions: CatchConditions;
  avg_rating?: number | null;
  rating_count?: number | null;
  venues?: {
    slug: string;
    name: string;
  } | null;
}

interface CatchCardProps {
  catchItem: CatchItem;
  userId: string | undefined;
}

const formatSpecies = (catchItem: CatchItem) => {
  if (!catchItem.species) return "";
  if (catchItem.species === "other") {
    const customSpecies = catchItem.conditions?.customFields?.species;
    if (customSpecies) {
      return customSpecies;
    }
    return "Other";
  }
  return getFreshwaterSpeciesLabel(catchItem.species) || "Unknown";
};

const formatWeight = (weight: number | null, unit: string | null) => {
  if (!weight) return "";
  return `${weight}${unit === 'kg' ? 'kg' : 'lb'}`;
};

export const CatchCard = memo(({ catchItem, userId }: CatchCardProps) => {
  const navigate = useNavigate();
  const titleId = useId();
  const handleNavigate = () => {
    navigate(`/catch/${catchItem.id}`);
  };

  const ratingsCount = catchItem.ratings.length;
  const commentsCount = catchItem.comments.length;
  const reactionsCount = catchItem.reactions?.length ?? 0;
  const summaryCount = catchItem.rating_count ?? ratingsCount;
  const summaryAvg =
    catchItem.avg_rating !== null && catchItem.avg_rating !== undefined
      ? Number(catchItem.avg_rating).toFixed(1)
      : ratingsCount > 0
      ? (catchItem.ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratingsCount).toFixed(1)
      : null;

  return (
    <Card
      className="group flex h-full flex-col cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
      onClick={handleNavigate}
      onKeyDown={(event) => {
        if (event.currentTarget !== event.target) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleNavigate();
        }
      }}
      role="link"
      tabIndex={0}
      aria-labelledby={titleId}
      data-testid="catch-card"
    >
      <CardContent className="relative p-0">
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
          <img
            src={catchItem.image_url}
            alt={catchItem.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        </div>
        {catchItem.species && catchItem.weight && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-overlay/85 via-overlay/35 to-transparent p-4 text-inverse dark:text-inverse-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fish className="w-5 h-5" />
                <span className="font-semibold text-base md:text-lg drop-shadow">{formatSpecies(catchItem)}</span>
              </div>
              <span className="font-bold text-xl md:text-2xl drop-shadow">
                {formatWeight(catchItem.weight, catchItem.weight_unit)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-1 flex-col items-start gap-3 p-4">
        <h3
          id={titleId}
          className="text-lg font-semibold text-foreground md:text-xl line-clamp-2"
          data-testid="catch-title"
        >
          {catchItem.title || "Untitled catch"}
        </h3>
        <div className="flex items-center gap-2 w-full min-w-0">
          <Avatar className="w-9 h-9 shrink-0">
            <AvatarImage
              src={
                resolveAvatarUrl({
                  path: catchItem.profiles?.avatar_path ?? null,
                  legacyUrl: catchItem.profiles?.avatar_url ?? null,
                }) ?? ""
              }
            />
            <AvatarFallback>
              {catchItem.profiles?.username?.[0]?.toUpperCase() ?? "A"}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-sm font-medium text-foreground">
            {catchItem.profiles?.username ?? "Unknown angler"}
          </span>
        </div>
        {catchItem.venues ? (
          <Link
            to={`/venues/${catchItem.venues.slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary min-w-0"
            onClick={(event) => event.stopPropagation()}
          >
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{catchItem.venues.name}</span>
          </Link>
        ) : catchItem.location ? (
          <p className="text-sm text-muted-foreground truncate w-full">
            {shouldShowExactLocation(catchItem.hide_exact_spot, catchItem.user_id, userId)
              ? catchItem.location
              : "Undisclosed venue"}
          </p>
        ) : null}
        <div className="mt-auto flex items-center gap-5 w-full pt-2 min-w-0">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-accent fill-accent/90" />
            <span className="text-sm font-semibold text-foreground">
              {summaryAvg ?? "–"}
            </span>
            <span className="text-xs text-muted-foreground">
              ({summaryCount})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageCircle className={cn("w-4 h-4", commentsCount === 0 ? "text-muted-foreground/60" : "text-muted-foreground")} />
            <span className={cn("text-sm", commentsCount === 0 ? "text-muted-foreground/70" : "text-muted-foreground")}>
              {commentsCount}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart
              className={cn(
                "w-4 h-4",
                reactionsCount === 0 ? "text-muted-foreground/60" : "text-primary"
              )}
              fill={reactionsCount > 0 ? "currentColor" : "none"}
            />
            <span className={cn("text-sm", reactionsCount === 0 ? "text-muted-foreground/70" : "text-muted-foreground")}>
              {reactionsCount}
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
});

CatchCard.displayName = "CatchCard";
