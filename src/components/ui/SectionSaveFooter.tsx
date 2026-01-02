import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, CircleDot, Loader2 } from "lucide-react";

type SectionSaveFooterProps = {
  dirty?: boolean;
  saving?: boolean;
  justSaved?: boolean;
  onSave?: () => void;
  saveDisabled?: boolean;
  saveLabel?: string;
  secondaryActions?: ReactNode;
  hideSave?: boolean;
  className?: string;
};

const SectionSaveFooter = ({
  dirty = false,
  saving = false,
  justSaved = false,
  onSave,
  saveDisabled = false,
  saveLabel = "Save",
  secondaryActions,
  hideSave = false,
  className,
}: SectionSaveFooterProps) => {
  const showStatus = dirty || justSaved;
  const statusText = justSaved ? "Changes saved" : dirty ? "Unsaved changes" : "";
  const StatusIcon = justSaved ? CheckCircle2 : CircleDot;
  const statusTone = justSaved
    ? "border-secondary/50 bg-secondary/20 text-foreground"
    : "border-primary/50 bg-primary/15 text-foreground";

  return (
    <div className={cn("border-t border-border pt-4", className)}>
      <div
        className={cn(
          "flex flex-col gap-2 sm:flex-row sm:items-center",
          showStatus ? "sm:justify-between" : "sm:justify-end"
        )}
      >
        {showStatus ? (
          <span
            role="status"
            aria-live="polite"
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
              statusTone
            )}
          >
            <StatusIcon className="h-4 w-4" />
            {statusText}
          </span>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {secondaryActions}
          {!hideSave && onSave ? (
            <Button
              type="button"
              onClick={onSave}
              disabled={saving || saveDisabled}
              className="rounded-xl px-4"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                saveLabel
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SectionSaveFooter;
