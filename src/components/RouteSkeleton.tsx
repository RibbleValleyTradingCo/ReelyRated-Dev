import { Skeleton } from "@/components/ui/skeleton";

export const RouteSkeleton = () => {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-[220px]" />
          <Skeleton className="h-4 w-[320px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <Skeleton className="h-4 w-[240px]" />
            <Skeleton className="h-4 w-[180px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <Skeleton className="h-4 w-[260px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[280px]" />
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
          <Skeleton className="h-4 w-[180px]" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[85%]" />
          <Skeleton className="h-4 w-[80%]" />
        </div>
      </div>
    </div>
  );
};

export default RouteSkeleton;
