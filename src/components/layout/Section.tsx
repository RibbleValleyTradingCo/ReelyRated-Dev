import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  className?: string;
};

export const Section = ({ children, className }: SectionProps) => {
  return <section className={cn("space-y-4", className)}>{children}</section>;
};

export default Section;
