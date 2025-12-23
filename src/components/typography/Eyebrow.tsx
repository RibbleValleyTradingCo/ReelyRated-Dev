import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type EyebrowProps = {
  className?: string;
  children: ReactNode;
};

export const Eyebrow = ({ className, children }: EyebrowProps) => {
  return (
    <span className={cn("inline-block text-sm font-semibold uppercase tracking-wide text-primary", className)}>
      {children}
    </span>
  );
};

export default Eyebrow;
