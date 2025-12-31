import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SectionSkeletonProps {
  lines?: number;
  className?: string;
}

export const SectionSkeleton = ({ lines = 3, className }: SectionSkeletonProps) => {
  const lineCount = Math.max(1, lines);
  return (
    <div className={cn("rounded-xl border border-border bg-card/70 p-6 shadow-card", className)}>
      <Skeleton className="h-5 w-40" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: lineCount }).map((_, index) => (
          <Skeleton key={index} className={cn("h-4", index === lineCount - 1 ? "w-4/5" : "w-full")} />
        ))}
      </div>
    </div>
  );
};

export default SectionSkeleton;
