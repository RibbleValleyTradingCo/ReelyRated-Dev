import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { PasswordChangeFormData } from "@/schemas";

interface ProfileSettingsPasswordCardProps {
  passwordForm: UseFormReturn<PasswordChangeFormData>;
  onSubmit: (values: PasswordChangeFormData) => void;
}

const ProfileSettingsPasswordCard = ({ passwordForm, onSubmit }: ProfileSettingsPasswordCardProps) => {
  return (
    <form onSubmit={passwordForm.handleSubmit(onSubmit)} className="space-y-6">
      <Card className="rounded-xl">
        <CardHeader className="px-5 pb-2 pt-5 md:px-8 md:pt-8 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Change password
          </CardTitle>
          <p className="text-sm text-muted-foreground">Update your password to keep your account secure.</p>
        </CardHeader>
        <CardContent className="space-y-6 px-5 pb-5 md:px-8 md:pb-8">
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            Use at least 8 characters with a mix of letters, numbers, or symbols for your new password.
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                {...passwordForm.register("currentPassword")}
                placeholder="••••••••"
                aria-invalid={!!passwordForm.formState.errors.currentPassword}
                className="mt-1 w-full"
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                {...passwordForm.register("newPassword")}
                placeholder="••••••••"
                aria-invalid={!!passwordForm.formState.errors.newPassword}
                className="mt-1 w-full"
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...passwordForm.register("confirmPassword")}
                placeholder="••••••••"
                aria-invalid={!!passwordForm.formState.errors.confirmPassword}
                className="mt-1 w-full"
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={passwordForm.formState.isSubmitting}
              className="h-11 w-full md:w-auto"
            >
              {passwordForm.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default ProfileSettingsPasswordCard;
