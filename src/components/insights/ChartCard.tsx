import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface ChartCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
}

export const ChartCard = memo(({
  icon: Icon,
  title,
  description,
  isEmpty,
  emptyMessage,
  children,
}: ChartCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {isEmpty ? <p className="text-sm text-muted-foreground">{emptyMessage}</p> : children}
      </CardContent>
    </Card>
  );
});

ChartCard.displayName = "ChartCard";
