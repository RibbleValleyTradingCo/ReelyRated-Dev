import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UseFormReturn } from "react-hook-form";
import { Loader2 } from "lucide-react";

interface ProfileSettingsEmailChangeCardProps {
  initialEmail: string;
  emailForm: UseFormReturn<{ newEmail: string; confirmEmail: string }>;
  onSubmit: (values: { newEmail: string; confirmEmail: string }) => void;
}

const ProfileSettingsEmailChangeCard = ({
  initialEmail,
  emailForm,
  onSubmit,
}: ProfileSettingsEmailChangeCardProps) => {
  return (
    <Card className="rounded-xl">
      <CardHeader className="px-5 pb-2 pt-5 md:px-8 md:pt-8 md:pb-4">
        <CardTitle className="text-lg">Change email</CardTitle>
        <p className="text-sm text-muted-foreground">
          Current email:{" "}
          <span className="font-medium break-all">{initialEmail || "Not set"}</span>.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 px-5 pb-5 md:px-8 md:pb-8">
        <form className="space-y-6" onSubmit={emailForm.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="newEmail">New email address</Label>
            <Input
              id="newEmail"
              type="email"
              placeholder="angler+new@example.com"
              {...emailForm.register("newEmail")}
              aria-invalid={!!emailForm.formState.errors?.newEmail}
              className="mt-1 w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmEmail">Confirm new email</Label>
            <Input
              id="confirmEmail"
              type="email"
              placeholder="Repeat the new email"
              {...emailForm.register("confirmEmail")}
              aria-invalid={!!emailForm.formState.errors?.confirmEmail}
              className="mt-1 w-full"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={emailForm.formState.isSubmitting}
              className="h-11"
              title="Requires verification"
            >
              {emailForm.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending confirmation…
                </>
              ) : (
                "Send verification email"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileSettingsEmailChangeCard;
