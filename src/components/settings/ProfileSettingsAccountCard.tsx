import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { ProfileFormData } from "@/schemas";

const PROFILE_STATUS_PLACEHOLDER = "Short bio about your angling interests.";

interface ProfileSettingsAccountCardProps {
  profileForm: UseFormReturn<ProfileFormData>;
}

const ProfileSettingsAccountCard = ({ profileForm }: ProfileSettingsAccountCardProps) => {
  return (
    <Card className="rounded-xl">
      <CardHeader className="px-5 pb-2 pt-5 md:px-8 md:pt-8 md:pb-4">
        <CardTitle className="text-lg">Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-5 pb-5 md:px-8 md:pb-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div>
              <Label htmlFor="username">Username</Label>
            </div>
            <Input
              id="username"
              {...profileForm.register("username")}
              placeholder="angling_legend"
              aria-invalid={!!profileForm.formState.errors.username}
              className="mt-1 w-full"
            />
            {profileForm.formState.errors.username && (
              <p className="text-sm text-destructive">{profileForm.formState.errors.username.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <div>
              <Label htmlFor="fullName">Full name (optional)</Label>
            </div>
            <Input
              id="fullName"
              {...profileForm.register("fullName")}
              placeholder="Alex Rivers"
              aria-invalid={!!profileForm.formState.errors.fullName}
              className="mt-1 w-full"
            />
            {profileForm.formState.errors.fullName && (
              <p className="text-sm text-destructive">{profileForm.formState.errors.fullName.message}</p>
            )}
          </div>
          <div className="space-y-2 md:col-span-2">
            <div>
              <Label htmlFor="email">Email</Label>
            </div>
            <Input
              id="email"
              type="email"
              {...profileForm.register("email")}
              placeholder="angler@example.com"
              aria-invalid={!!profileForm.formState.errors.email}
              readOnly
              disabled
              className="mt-1 w-full bg-muted/30 text-muted-foreground"
            />
            {profileForm.formState.errors.email && (
              <p className="text-sm text-destructive">{profileForm.formState.errors.email.message}</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <Label htmlFor="bio">Bio</Label>
          </div>
          <Textarea
            id="bio"
            {...profileForm.register("bio")}
            placeholder={PROFILE_STATUS_PLACEHOLDER}
            rows={4}
            aria-invalid={!!profileForm.formState.errors.bio}
            className="mt-1 w-full"
          />
          {profileForm.formState.errors.bio && (
            <p className="text-sm text-destructive">{profileForm.formState.errors.bio.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSettingsAccountCard;
