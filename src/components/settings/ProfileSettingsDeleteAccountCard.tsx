import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dispatch, SetStateAction } from "react";
import { Loader2 } from "lucide-react";

interface ProfileSettingsDeleteAccountCardProps {
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: Dispatch<SetStateAction<boolean>>;
  deleteReason: string;
  setDeleteReason: Dispatch<SetStateAction<string>>;
  isDeletingAccount: boolean;
  onDeleteAccount: () => void;
}

const ProfileSettingsDeleteAccountCard = ({
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  deleteReason,
  setDeleteReason,
  isDeletingAccount,
  onDeleteAccount,
}: ProfileSettingsDeleteAccountCardProps) => {
  return (
    <Card className="rounded-xl">
      <CardContent className="flex min-w-0 flex-col gap-4 px-5 pb-5 pt-5 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-6 md:px-8 md:pb-8 md:pt-6">
        <p className="text-sm text-muted-foreground md:flex-1 md:min-w-0 md:max-w-none">
          Delete your account and data permanently.
        </p>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="h-11 min-w-[200px]">
              Request account deletion
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will log you out, anonymise your profile, and hide your catches/comments. Some data is retained for
                moderation and safety. This cannot be undone from the UI.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="deleteReason">Reason for leaving (optional)</Label>
              <Textarea
                id="deleteReason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Let us know why you’re leaving..."
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingAccount}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDeleteAccount}
                disabled={isDeletingAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Delete my account"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default ProfileSettingsDeleteAccountCard;
