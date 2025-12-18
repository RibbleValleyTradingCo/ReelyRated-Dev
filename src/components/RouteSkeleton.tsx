import { useEffect } from "react";

const shimmerBase = "bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse";
const skeletonLine = `h-4 w-full rounded-full ${shimmerBase}`;

export const RouteSkeleton = () => {
  useEffect(() => {
    if (import.meta.env.DEV) console.log("RouteSkeleton render");
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="space-y-3">
          <div className={`${skeletonLine} max-w-[220px]`} />
          <div className={`${skeletonLine} max-w-[320px]`} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <div className={`${skeletonLine} max-w-[240px]`} />
            <div className={`${skeletonLine} max-w-[180px]`} />
            <div className={`${skeletonLine} max-w-[300px]`} />
          </div>
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <div className={`${skeletonLine} max-w-[260px]`} />
            <div className={`${skeletonLine} max-w-[200px]`} />
            <div className={`${skeletonLine} max-w-[280px]`} />
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
          <div className={`${skeletonLine} max-w-[180px]`} />
          <div className={`${skeletonLine} max-w-[90%]`} />
          <div className={`${skeletonLine} max-w-[85%]`} />
          <div className={`${skeletonLine} max-w-[80%]`} />
        </div>
      </div>
    </div>
  );
};

export default RouteSkeleton;
