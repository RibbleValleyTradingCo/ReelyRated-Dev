import { cn } from "@/lib/utils";

interface PulsingDotProps {
  className?: string;
}

export const PulsingDot = ({ className }: PulsingDotProps) => (
  <span className={cn("relative inline-flex h-3 w-3 items-center justify-center", className)}>
    <span
      className="absolute h-3 w-3 rounded-full bg-background/35 motion-safe:animate-ping"
      aria-hidden="true"
    />
    <span
      className="relative h-2 w-2 rounded-full bg-background shadow-[0_0_10px_hsl(var(--background)/0.55)]"
      aria-hidden="true"
    />
  </span>
);

export default PulsingDot;
