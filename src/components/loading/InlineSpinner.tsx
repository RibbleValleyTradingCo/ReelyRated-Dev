import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type InlineSpinnerProps = {
  size?: "sm" | "md";
  label?: string;
  className?: string;
};

export const InlineSpinner = ({
  size = "sm",
  label = "Loading",
  className,
}: InlineSpinnerProps) => {
  const iconSize = size === "md" ? "h-5 w-5" : "h-4 w-4";
  const accessibleLabel = label ?? "Loading";

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center gap-2 text-sm", className)}
    >
      <Loader2 className={cn(iconSize, "animate-spin")} aria-hidden="true" />
      {label ? <span className="font-medium">{label}</span> : null}
      <span className="sr-only">{accessibleLabel}</span>
    </span>
  );
};

export default InlineSpinner;
