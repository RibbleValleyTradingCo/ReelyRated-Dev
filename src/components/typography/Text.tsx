import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type TextVariant = "body" | "muted" | "small";

const variantClasses: Record<TextVariant, string> = {
  body: "text-sm text-foreground",
  muted: "text-sm text-muted-foreground",
  small: "text-xs text-muted-foreground",
};

type TextProps = {
  variant?: TextVariant;
  className?: string;
  children: ReactNode;
};

export const Text = ({ variant = "body", className, children }: TextProps) => {
  return <p className={cn(variantClasses[variant], className)}>{children}</p>;
};

export default Text;
