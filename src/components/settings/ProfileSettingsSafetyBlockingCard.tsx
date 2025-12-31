import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveAvatarUrl } from "@/lib/storage";
import LoadingState from "@/components/ui/LoadingState";
import EmptyStateCard from "@/components/ui/EmptyStateCard";
import ErrorStateCard from "@/components/ui/ErrorStateCard";

interface BlockedProfileEntry {
  blocked_id: string;
  profiles: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_path: string | null;
    avatar_url: string | null;
    bio: string | null;
    is_deleted: boolean | null;
  } | null;
}

interface ProfileSettingsSafetyBlockingCardProps {
  blockedProfiles: BlockedProfileEntry[];
  blockedLoading: boolean;
  blockedError: string | null;
  onUnblock: (blockedId: string, username?: string | null) => void;
}

const ProfileSettingsSafetyBlockingCard = ({
  blockedProfiles,
  blockedLoading,
  blockedError,
  onUnblock,
}: ProfileSettingsSafetyBlockingCardProps) => {
  return (
    <Card className="rounded-xl">
      <CardHeader className="px-5 pb-2 pt-5 md:px-8 md:pt-8 md:pb-4">
        <CardTitle className="text-lg">Blocked anglers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-5 pb-5 md:px-8 md:pb-8">
        {blockedLoading ? (
          <LoadingState message="Loading blocked anglers..." />
        ) : blockedError ? (
          <ErrorStateCard title="Unable to load blocked anglers" message={blockedError} />
        ) : blockedProfiles.length === 0 ? (
          <EmptyStateCard
            title="No blocked anglers"
            message="Search for anglers to block."
          />
        ) : (
          <div className="space-y-3">
            {blockedProfiles.map((row) => {
              const blockedProfile = row.profiles;
              const isDeleted = blockedProfile?.is_deleted ?? false;
              const username = blockedProfile?.username ?? "";
              const displayName = isDeleted ? "Deleted angler" : blockedProfile?.full_name || username || "Unknown angler";
              const secondaryLine = isDeleted ? "Account deleted" : username ? `@${username}` : "No username";
              const bio = isDeleted ? "This angler deleted their account." : blockedProfile?.bio?.trim() || "No bio yet.";
              const avatarUrl = isDeleted
                ? undefined
                : resolveAvatarUrl({
                    path: blockedProfile?.avatar_path,
                    legacyUrl: blockedProfile?.avatar_url,
                  });
              return (
                <div
                  key={row.blocked_id}
                  className="flex min-w-0 items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={avatarUrl ?? undefined} />
                      <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 space-y-1">
                      <div className="truncate text-sm font-medium text-foreground">{displayName}</div>
                      <div className="truncate text-xs text-muted-foreground">{secondaryLine}</div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{bio}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="h-9" onClick={() => onUnblock(row.blocked_id, username)}>
                    Unblock
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export type { BlockedProfileEntry };
export default ProfileSettingsSafetyBlockingCard;
