import ProfileAvatarSection from "@/components/settings/ProfileAvatarSection";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProfileSettingsIdentityHeaderProps {
  userId: string;
  username: string;
  fullName?: string | null;
  bio?: string | null;
  avatarPath: string | null;
  legacyAvatarUrl: string | null;
  onAvatarChange: (path: string | null) => void;
  onEditBio: () => void;
}

const ProfileSettingsIdentityHeader = ({
  userId,
  username,
  fullName,
  bio,
  avatarPath,
  legacyAvatarUrl,
  onAvatarChange,
  onEditBio,
}: ProfileSettingsIdentityHeaderProps) => {
  const trimmedBio = bio?.trim() ?? "";
  const previewBio =
    trimmedBio.length > 0
      ? trimmedBio
      : "Add a short bio about your angling interests.";

  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-5 px-5 py-6 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
          <ProfileAvatarSection
            userId={userId}
            username={username}
            avatarPath={avatarPath}
            legacyAvatarUrl={legacyAvatarUrl}
            onAvatarChange={onAvatarChange}
            buttonLabel="Change photo"
          />
          <div className="min-w-0 space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Identity</p>
              <div className="break-words text-xl font-semibold text-foreground">@{username}</div>
              {fullName ? <div className="break-words text-sm text-muted-foreground">{fullName}</div> : null}
            </div>
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-muted-foreground">Bio preview</p>
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={onEditBio}>
                  Edit bio
                </Button>
              </div>
              <p className="mt-2 text-sm text-foreground line-clamp-2">{previewBio}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSettingsIdentityHeader;
