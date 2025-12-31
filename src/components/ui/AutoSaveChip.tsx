import { cn } from "@/lib/utils";

type AutoSaveChipProps = {
  variant?: "auto" | "saving";
  label?: string;
  className?: string;
};

const AutoSaveChip = ({ variant = "auto", label, className }: AutoSaveChipProps) => {
  const text = label ?? (variant === "saving" ? "Saving…" : "Auto-saves");
  const toneClasses =
    variant === "saving"
      ? "border-primary/30 bg-primary/10 text-primary"
      : "border-border bg-muted/70 text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-2 rounded-full border px-2.5 text-[11px] font-semibold",
        toneClasses,
        className
      )}
    >
      {variant === "saving" ? <span className="h-1.5 w-1.5 rounded-full bg-primary" /> : null}
      {text}
    </span>
  );
};

export default AutoSaveChip;
