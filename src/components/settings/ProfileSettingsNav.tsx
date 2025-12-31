import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SectionId = "profile" | "security" | "data-privacy" | "safety-blocking" | "data" | "danger-zone";

interface NavSection {
  id: SectionId;
  label: string;
  active: boolean;
}

interface ProfileSettingsNavProps {
  sections: NavSection[];
  onSelect: (id: SectionId) => void;
  variant?: "tabs" | "rail";
  className?: string;
}

const ProfileSettingsNav = ({
  sections,
  onSelect,
  variant = "tabs",
  className,
}: ProfileSettingsNavProps) => {
  const isRail = variant === "rail";
  return (
    <nav className={cn("w-full", className)}>
      <div
        className={cn(
          isRail
            ? "flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-card"
            : "flex flex-wrap gap-2 rounded-lg border border-border bg-card p-2 shadow-card md:flex-nowrap md:justify-center"
        )}
      >
        {sections.map((section) => (
          <Button
            key={section.id}
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onSelect(section.id)}
            aria-current={section.active ? "page" : undefined}
            className={cn(
              "border text-sm shadow-none transition",
              isRail ? "justify-start rounded-lg px-3 py-2" : "rounded-full px-4 py-2",
              section.active
                ? "border-transparent bg-primary text-primary-foreground hover:bg-primary/90"
                : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            {section.label}
          </Button>
        ))}
      </div>
    </nav>
  );
};

export type { SectionId, NavSection };
export default ProfileSettingsNav;
