import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageSpinnerProps {
  label?: string;
  className?: string;
}

export const PageSpinner = ({ label = "Loading…", className }: PageSpinnerProps) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "section-container py-10 md:py-14 flex items-center justify-center text-slate-500",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
};

export default PageSpinner;
