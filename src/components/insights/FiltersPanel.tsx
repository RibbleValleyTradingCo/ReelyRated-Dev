import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";
import type { DateRange } from "react-day-picker";
import type { DatePreset } from "@/lib/insights-utils";

interface SessionOption {
  value: string;
  label: string;
}

interface FiltersPanelProps {
  datePreset: DatePreset;
  onDatePresetChange: (value: DatePreset) => void;
  selectedSessionId: string;
  onSessionChange: (value: string) => void;
  selectedVenue: string;
  onVenueChange: (value: string) => void;
  customRange: DateRange | undefined;
  customRangeOpen: boolean;
  onCustomRangeOpenChange: (open: boolean) => void;
  onCustomRangeSelect: (range: DateRange | undefined) => void;
  onClearCustomRange: () => void;
  customRangeLabel: string;
  customRangeActive: boolean;
  latestSessionId: string | null;
  sessionOptions: SessionOption[];
  sessionsDisabled: boolean;
  venueOptions: string[];
  showLastSessionHint: boolean;
}

export const FiltersPanel = ({
  datePreset,
  onDatePresetChange,
  selectedSessionId,
  onSessionChange,
  selectedVenue,
  onVenueChange,
  customRange,
  customRangeOpen,
  onCustomRangeOpenChange,
  onCustomRangeSelect,
  onClearCustomRange,
  customRangeLabel,
  customRangeActive,
  latestSessionId,
  sessionOptions,
  sessionsDisabled,
  venueOptions,
  showLastSessionHint,
}: FiltersPanelProps) => {
  return (
    <div className="mb-6 rounded-2xl border border-border bg-card/70 p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="grid gap-2">
          <Label className="text-sm font-medium text-muted-foreground">Time range</Label>
          <Select value={datePreset} onValueChange={(value) => onDatePresetChange(value as DatePreset)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="last-30">Last 30 days</SelectItem>
              <SelectItem value="season">This season</SelectItem>
              <SelectItem value="last-session" disabled={!latestSessionId}>
                Last session
              </SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          <div className="min-h-[16px]" />
        </div>
        <div className="grid gap-2">
          <Label className="text-sm font-medium text-muted-foreground">Session</Label>
          <Select value={selectedSessionId} onValueChange={onSessionChange}>
            <SelectTrigger disabled={sessionsDisabled} className="w-full">
              <SelectValue placeholder="All sessions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sessions</SelectItem>
              {sessionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="min-h-[16px] text-xs text-muted-foreground">
            {sessionsDisabled ? "Log a session to enable this filter." : ""}
          </p>
        </div>
        <div className="grid gap-2">
          <Label className="text-sm font-medium text-muted-foreground">Venue</Label>
          <Select value={selectedVenue} onValueChange={onVenueChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All venues" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All venues</SelectItem>
              {venueOptions.map((venue) => (
                <SelectItem key={venue} value={venue}>
                  {venue}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="min-h-[16px]" />
        </div>
        <div className="grid gap-2">
          <Label className="text-sm font-medium text-muted-foreground">Custom range</Label>
          <Popover open={customRangeOpen} onOpenChange={onCustomRangeOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  customRangeActive ? "border-primary text-primary shadow-sm" : "text-muted-foreground"
                )}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                <span>{customRangeLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0" sideOffset={8}>
              <Calendar
                mode="range"
                numberOfMonths={2}
                selected={customRange}
                onSelect={onCustomRangeSelect}
                defaultMonth={customRange?.from}
                disabled={(date) => date > new Date()}
                initialFocus
              />
              <div className="flex items-center justify-between border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearCustomRange}
                  disabled={!customRange?.from && !customRange?.to}
                >
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCustomRangeOpenChange(false)}
                  disabled={!customRange?.from}
                >
                  Done
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <div className="min-h-[16px]" />
        </div>
      </div>
      {showLastSessionHint && (
        <p className="mt-3 text-xs text-muted-foreground">
          You haven&apos;t logged any sessions yet. Create one to unlock the "Last session" range.
        </p>
      )}
    </div>
  );
};
