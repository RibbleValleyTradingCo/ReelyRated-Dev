import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const capitalizeFirstWord = (value: string) => {
  if (!value) return "";
  const trimmed = value.trimStart();
  if (!trimmed) return "";
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
};

interface ConditionsSectionProps {
  formData: {
    weather: string;
    airTemp: string;
    waterClarity: string;
    windDirection: string;
  };
  onFormDataChange: (updates: Partial<ConditionsSectionProps["formData"]>) => void;
  showConditions: boolean;
  setShowConditions: (show: boolean) => void;
}

export const ConditionsSection = ({
  formData,
  onFormDataChange,
  showConditions,
  setShowConditions,
}: ConditionsSectionProps) => {
  return (
    <Collapsible open={showConditions} onOpenChange={setShowConditions}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full flex justify-between" type="button">
          <span>Conditions (optional)</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", showConditions && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 mt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="weather">Weather</Label>
            <Select value={formData.weather} onValueChange={(value) => onFormDataChange({ weather: value })}>
              <SelectTrigger id="weather">
                <SelectValue placeholder="Select weather" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sunny">Sunny</SelectItem>
                <SelectItem value="overcast">Overcast</SelectItem>
                <SelectItem value="raining">Raining</SelectItem>
                <SelectItem value="windy">Windy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="airTemp">Air Temp (°C)</Label>
            <Input
              id="airTemp"
              type="number"
              value={formData.airTemp}
              onChange={(e) => onFormDataChange({ airTemp: e.target.value })}
              placeholder="e.g., 18"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="waterClarity">Water Clarity</Label>
            <Select value={formData.waterClarity} onValueChange={(value) => onFormDataChange({ waterClarity: value })}>
              <SelectTrigger id="waterClarity">
                <SelectValue placeholder="Select clarity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">Clear</SelectItem>
                <SelectItem value="coloured">Coloured</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="windDirection">Wind Direction</Label>
            <Input
              id="windDirection"
              value={formData.windDirection}
              onChange={(e) =>
                onFormDataChange({
                  windDirection: capitalizeFirstWord(e.target.value),
                })
              }
              placeholder="e.g., SW"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
