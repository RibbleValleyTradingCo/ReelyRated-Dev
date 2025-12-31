import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateCardProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
}

export const EmptyStateCard = ({
  title,
  message,
  actionLabel,
  onAction,
  icon,
  className,
}: EmptyStateCardProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-5 py-6 text-center",
        className,
      )}
    >
      {icon ? <div className="flex h-12 w-12 items-center justify-center text-muted-foreground">{icon}</div> : null}
      {title ? <h3 className="text-base font-semibold text-foreground">{title}</h3> : null}
      <p className="text-sm text-muted-foreground">{message}</p>
      {actionLabel && onAction ? (
        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
};

export default EmptyStateCard;
