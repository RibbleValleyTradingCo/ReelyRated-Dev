import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface ProfileSettingsDangerZoneCardProps {
  onSignOut: () => void;
}

const ProfileSettingsDangerZoneCard = ({ onSignOut }: ProfileSettingsDangerZoneCardProps) => {
  return (
    <Card className="rounded-xl border border-destructive/30 bg-destructive/10">
      <CardHeader className="px-5 pb-2 pt-5 md:px-8 md:pt-8 md:pb-4">
        <CardTitle className="text-lg font-semibold text-destructive">Log out</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-5 pb-5 md:flex-row md:items-center md:justify-between md:px-8 md:pb-8">
        <p className="text-sm text-destructive/80 md:max-w-md">End your session on shared devices.</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button variant="destructive" className="h-11 min-w-[140px]" onClick={onSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSettingsDangerZoneCard;
