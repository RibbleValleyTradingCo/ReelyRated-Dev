import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface ProfileSettingsDataExportCardProps {
  isExporting: boolean;
  onDownload: () => void;
}

const ProfileSettingsDataExportCard = ({ isExporting, onDownload }: ProfileSettingsDataExportCardProps) => {
  return (
    <Card className="rounded-xl">
      <CardHeader className="px-5 pb-2 pt-5 md:px-8 md:pt-8 md:pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Download className="h-4 w-4 text-muted-foreground" />
          Data export
        </CardTitle>
        <p className="text-sm text-muted-foreground">Export your catches, comments, and ratings as JSON.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-5 pb-5 md:flex-row md:items-center md:justify-between md:px-8 md:pb-8">
        <Button
          type="button"
          className="h-11 min-w-[200px]"
          onClick={onDownload}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing export…
            </>
          ) : (
            "Download my data (JSON)"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileSettingsDataExportCard;
