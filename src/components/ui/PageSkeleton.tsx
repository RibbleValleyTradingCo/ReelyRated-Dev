import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SectionSkeleton } from "@/components/ui/SectionSkeleton";

interface PageSkeletonProps {
  sections?: number;
  className?: string;
}

export const PageSkeleton = ({ sections = 3, className }: PageSkeletonProps) => {
  const sectionCount = Math.max(1, sections);
  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      {Array.from({ length: sectionCount }).map((_, index) => (
        <SectionSkeleton key={index} lines={3} />
      ))}
    </div>
  );
};

export default PageSkeleton;
