import React from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Layers } from "lucide-react";
import { format } from "date-fns";
import { getProfilePath } from "@/lib/profile";
import type { User } from "@supabase/supabase-js";

interface CatchDetailHeroProps {
  imageUrl: string;
  title: string;
  species: string | null;
  weight: number | null;
  weightUnit: string | null;
  location: string | null;
  hideExactSpot: boolean | null;
  caughtAt: string | null;
  session: { id: string; title: string | null } | null;
  ownerUsername: string;
  ownerId: string;
  ownerAvatarUrl: string | null;
  formatSpecies: (species: string | null, custom?: string) => string | null;
  customSpecies?: string;
  canShowExactLocation: boolean;
  user: User | null;
  isFollowing: boolean;
  followLoading: boolean;
  onToggleFollow: () => void;
}

export const CatchDetailHero = ({
  imageUrl,
  title,
  species,
  weight,
  weightUnit,
  location,
  hideExactSpot,
  caughtAt,
  session,
  ownerUsername,
  ownerId,
  ownerAvatarUrl,
  formatSpecies,
  customSpecies,
  canShowExactLocation,
  user,
  isFollowing,
  followLoading,
  onToggleFollow,
}: CatchDetailHeroProps) => {
  return (
    <div className="relative mb-8">
      <img
        src={imageUrl}
        alt={title}
        className="w-full h-[500px] object-cover rounded-xl"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-8 rounded-b-xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {species && weight && (
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl font-bold text-white">
                  {weight}{weightUnit === 'kg' ? 'kg' : 'lb'}
                </span>
                <span className="text-2xl text-white/90">{formatSpecies(species, customSpecies)}</span>
              </div>
            )}
            <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
            {canShowExactLocation && location ? (
              <Link
                to={`/venues/${encodeURIComponent(location)}`}
                className="flex items-center gap-2 text-white/90 underline-offset-4 hover:underline"
              >
                <MapPin className="w-4 h-4" />
                <span>{location}</span>
              </Link>
            ) : hideExactSpot ? (
              <div className="flex items-center gap-2 text-white/70">
                <MapPin className="w-4 h-4" />
                <span>Undisclosed venue</span>
              </div>
            ) : null}
            {session && (
              <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
                <Layers className="w-4 h-4" />
                <Link
                  to={`/sessions?session=${session.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  View session{session.title ? `: ${session.title}` : ""}
                </Link>
              </div>
            )}
            {caughtAt && (
              <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(caughtAt), "MMMM dd, yyyy")}</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={getProfilePath({ username: ownerUsername, id: ownerId })}
              className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3"
            >
              <Avatar className="w-12 h-12">
                <AvatarImage src={ownerAvatarUrl ?? ""} />
                <AvatarFallback>{ownerUsername?.[0]?.toUpperCase() ?? "A"}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-white">{ownerUsername}</span>
            </Link>
            {user && user.id !== ownerId && (
              <Button
                size="sm"
                onClick={onToggleFollow}
                disabled={followLoading}
                className={`border border-white/40 text-white ${
                  isFollowing ? "bg-white/30 hover:bg-white/40" : "bg-white/10 hover:bg-white/20"
                }`}
                variant="ghost"
              >
                {followLoading ? "Updating…" : isFollowing ? "Following" : "Follow"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
