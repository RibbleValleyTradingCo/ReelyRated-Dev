import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export const SectionHeader = ({
  title,
  subtitle,
  eyebrow,
  actions,
  className,
}: SectionHeaderProps) => {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          {eyebrow ? <div>{eyebrow}</div> : null}
          <h2 className="text-2xl font-bold text-gray-900 md:text-3xl mb-2">{title}</h2>
          {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
        </div>
        {actions ? <div className="sm:pl-4">{actions}</div> : null}
      </div>
    </div>
  );
};

export default SectionHeader;
