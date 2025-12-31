import { Button } from "@/components/ui/button";
import { Loader2, Star } from "lucide-react";
import { useEffect, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";

type RatingModalProps = {
  open: boolean;
  onClose: () => void;
  pendingRating: number | null;
  onPendingRatingChange: (next: number) => void;
  onSubmit: (rating: number) => void;
  loading: boolean;
  ratingSummaryText: string;
  venueName: string;
  triggerRef?: RefObject<HTMLButtonElement>;
};

const StarRating = ({
  value,
  onSelect,
  disabled,
}: {
  value: number | null;
  onSelect?: (next: number) => void;
  disabled?: boolean;
}) => {
  const current = value ?? 0;
  return (
    <div
      className="inline-flex items-center gap-1"
      role="radiogroup"
      aria-label="Your rating"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = current >= star;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={filled}
            disabled={disabled}
            onClick={() => onSelect?.(star)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect?.(star);
              }
            }}
            className={`rounded-full p-1 transition ${
              disabled
                ? "cursor-not-allowed opacity-60"
                : "hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            }`}
          >
            <Star
              className={`h-4 w-4 ${
                filled ? "fill-accent text-accent" : "text-muted-foreground/40"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

const RatingModal = ({
  open,
  onClose,
  pendingRating,
  onPendingRatingChange,
  onSubmit,
  loading,
  ratingSummaryText,
  venueName,
  triggerRef,
}: RatingModalProps) => {
  const modalRef = useRef<HTMLDivElement | null>(null);

  const handleClose = () => {
    onClose();
    triggerRef?.current?.focus();
  };

  useEffect(() => {
    if (!open) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const modal = modalRef.current;
    const focusableSelectors =
      'button, [href], [tabindex]:not([tabindex="-1"])';
    const focusable = modal
      ? Array.from(
          modal.querySelectorAll<HTMLElement>(focusableSelectors)
        ).filter((el) => !el.hasAttribute("disabled"))
      : [];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
      if (event.key === "Tab" && focusable.length > 0) {
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-overlay/70 px-4 py-6">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Rate ${venueName}`}
        className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-overlay"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">
              Rate this venue
            </h3>
            <p className="text-sm text-muted-foreground">
              Your feedback helps others plan their trip.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span>{ratingSummaryText}</span>
          </div>
          <div className="flex flex-col items-start gap-3">
            <StarRating
              value={pendingRating}
              onSelect={onPendingRatingChange}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              {pendingRating
                ? `You’re about to rate this ${pendingRating} star${
                    pendingRating === 1 ? "" : "s"
                  }.`
                : "Select a rating to submit."}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => pendingRating && void onSubmit(pendingRating)}
              disabled={!pendingRating || loading}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </span>
              ) : (
                "Submit rating"
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Press Esc to close.</p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RatingModal;
