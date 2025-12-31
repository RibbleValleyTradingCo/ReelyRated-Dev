import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  iconClassName?: string;
  label?: string;
};

export const ThemeToggle = ({ className, iconClassName, label = "Toggle theme" }: ThemeToggleProps) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("rounded-xl", className)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      aria-pressed={isDark}
      data-testid="theme-toggle"
    >
      {isDark ? <Sun className={cn("h-5 w-5", iconClassName)} /> : <Moon className={cn("h-5 w-5", iconClassName)} />}
    </Button>
  );
};

export default ThemeToggle;
