import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateCardProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const ErrorStateCard = ({
  title,
  message,
  actionLabel,
  onAction,
  className,
}: ErrorStateCardProps) => {
  return (
    <div
      className={cn(
        "rounded-lg border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive",
        className,
      )}
    >
      {title ? <div className="text-base font-semibold text-foreground">{title}</div> : null}
      <p className={title ? "mt-1" : undefined}>{message}</p>
      {actionLabel && onAction ? (
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
};

export default ErrorStateCard;
