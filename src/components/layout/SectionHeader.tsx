import { ReactNode } from "react";
import { cn } from "@/lib/utils";

import { Eyebrow, Heading, Text } from "@/components/typography";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

export const SectionHeader = ({ eyebrow, title, subtitle, actions, className }: SectionHeaderProps) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-start md:justify-between",
        className
      )}
    >
      <div className="space-y-2">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <div className="space-y-2">
          <Heading as="h1" size="xl">
            {title}
          </Heading>
          {subtitle ? <Text variant="muted">{subtitle}</Text> : null}
        </div>
      </div>
      {actions ? <div className="w-full md:w-auto">{actions}</div> : null}
    </div>
  );
};

export default SectionHeader;
