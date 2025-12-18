import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const VenueCardSkeleton = () => {
  return (
    <Card className="overflow-hidden border border-slate-200 shadow-sm">
      <Skeleton className="block h-40 w-full bg-slate-200/80" />
      <CardContent className="space-y-3 p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </CardContent>
    </Card>
  );
};

export default VenueCardSkeleton;
