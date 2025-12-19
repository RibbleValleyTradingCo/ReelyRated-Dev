import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

export const PageContainer = ({ children, className }: PageContainerProps) => {
  return <div className={cn("section-container", className)}>{children}</div>;
};

export default PageContainer;
