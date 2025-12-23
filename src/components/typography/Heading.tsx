import { cn } from "@/lib/utils";
import { ElementType, ReactNode } from "react";

type HeadingSize = "xl" | "lg" | "md" | "sm";
type HeadingLevel = "h1" | "h2" | "h3" | "h4";

const sizeClasses: Record<HeadingSize, string> = {
  xl: "text-3xl font-bold leading-tight md:text-4xl",
  lg: "text-2xl font-bold leading-tight md:text-3xl",
  md: "text-xl font-semibold leading-snug",
  sm: "text-lg font-semibold leading-snug",
};

type HeadingProps = {
  as?: HeadingLevel;
  size?: HeadingSize;
  className?: string;
  children: ReactNode;
};

export const Heading = ({
  as: Component = "h2",
  size = "lg",
  className,
  children,
}: HeadingProps) => {
  return <Component className={cn(sizeClasses[size], className)}>{children}</Component>;
};

export default Heading;
