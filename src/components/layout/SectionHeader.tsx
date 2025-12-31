import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  titleAs?: HeadingLevel;
};

export const SectionHeader = ({
  title,
  subtitle,
  eyebrow,
  actions,
  className,
  titleClassName,
  subtitleClassName,
  titleAs = "h2",
}: SectionHeaderProps) => {
  const HeadingTag = titleAs;

  return (
    <div className={cn("mb-6", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          {eyebrow ? <div>{eyebrow}</div> : null}
          <HeadingTag className={cn("text-2xl font-bold text-foreground md:text-3xl mb-2", titleClassName)}>
            {title}
          </HeadingTag>
          {subtitle ? (
            <p className={cn("text-sm text-muted-foreground", subtitleClassName)}>{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="sm:pl-4">{actions}</div> : null}
      </div>
    </div>
  );
};

export default SectionHeader;
