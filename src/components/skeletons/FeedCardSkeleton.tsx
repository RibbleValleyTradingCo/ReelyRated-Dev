import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const FeedCardSkeleton = () => {
  return (
    <Card className="overflow-hidden border border-slate-200 shadow-sm">
      <div className="relative">
        <Skeleton className="block h-48 w-full bg-slate-200/80 sm:h-52" />
      </div>
      <CardContent className="space-y-3 p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-10" />
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedCardSkeleton;
