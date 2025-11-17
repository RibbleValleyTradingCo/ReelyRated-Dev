import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown } from "lucide-react";

const capitalizeFirstWord = (value: string) => {
  if (!value) return "";
  const trimmed = value.trimStart();
  if (!trimmed) return "";
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
};

const toTitleCase = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const formatGroupLabel = (value: string | null | undefined) => {
  if (!value) return "Other";
  return toTitleCase(value.replace(/[-_]/g, " "));
};

interface TacticsSectionProps {
  formData: {
    baitUsed: string;
    method: string;
    customMethod: string;
    equipmentUsed: string;
  };
  onFormDataChange: (updates: Partial<TacticsSectionProps["formData"]>) => void;
  baitOptions: { slug: string; label: string; category: string }[];
  isLoadingBaits: boolean;
  methodOptions: { slug: string; label: string; group: string }[];
  isLoadingMethods: boolean;
}

export const TacticsSection = ({
  formData,
  onFormDataChange,
  baitOptions,
  isLoadingBaits,
  methodOptions,
  isLoadingMethods,
}: TacticsSectionProps) => {
  const [baitPopoverOpen, setBaitPopoverOpen] = React.useState(false);
  const [baitSearch, setBaitSearch] = React.useState("");
  const [methodPopoverOpen, setMethodPopoverOpen] = React.useState(false);
  const [methodSearch, setMethodSearch] = React.useState("");

  const trimmedBaitSearch = baitSearch.trim().toLowerCase();
  const filteredBaits = baitOptions.filter((bait) => {
    if (!trimmedBaitSearch) return true;
    return (
      bait.label.toLowerCase().includes(trimmedBaitSearch) ||
      bait.slug.toLowerCase().includes(trimmedBaitSearch)
    );
  });

  const baitsByCategory = filteredBaits.reduce<Record<string, { slug: string; label: string }[]>>((acc, bait) => {
    const key = formatGroupLabel(bait.category);
    if (!acc[key]) acc[key] = [];
    acc[key].push({ slug: bait.slug, label: bait.label });
    return acc;
  }, {});

  const trimmedMethodSearch = methodSearch.trim().toLowerCase();
  const filteredMethods = methodOptions.filter((method) => {
    if (!trimmedMethodSearch) return true;
    return (
      method.label.toLowerCase().includes(trimmedMethodSearch) ||
      method.slug.toLowerCase().includes(trimmedMethodSearch)
    );
  });

  const methodsByGroup = filteredMethods.reduce<Record<string, { slug: string; label: string }[]>>((acc, method) => {
    const key = method.group || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push({ slug: method.slug, label: method.label });
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Tactics</h3>

      <div className="space-y-2">
        <Label htmlFor="baitUsed">Bait Used</Label>
        <Popover
          open={baitPopoverOpen}
          onOpenChange={(isOpen) => {
            setBaitPopoverOpen(isOpen);
            if (!isOpen) {
              setBaitSearch("");
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={baitPopoverOpen}
              className="w-full justify-between"
            >
              {(() => {
                if (isLoadingBaits) return "Loading baits…";
                if (formData.baitUsed) return formData.baitUsed;
                return "Select bait";
              })()}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0">
            <Command>
              <CommandInput
                placeholder="Search baits…"
                value={baitSearch}
                onValueChange={setBaitSearch}
              />
              <CommandList>
                <CommandEmpty>
                  {isLoadingBaits
                    ? "Loading baits…"
                    : trimmedBaitSearch
                      ? `No baits found for "${baitSearch}"`
                      : "Start typing to search baits"}
                </CommandEmpty>
                <CommandGroup heading="Quick actions">
                  {trimmedBaitSearch && (
                    <CommandItem
                      value={`custom-bait-${trimmedBaitSearch}`}
                      onSelect={() => {
                        const customValue = toTitleCase(baitSearch.trim());
                        if (!customValue) return;
                        onFormDataChange({
                          baitUsed: customValue,
                        });
                        setBaitSearch("");
                        setBaitPopoverOpen(false);
                      }}
                    >
                      Use "{toTitleCase(baitSearch.trim())}"
                    </CommandItem>
                  )}
                  {formData.baitUsed && (
                    <CommandItem
                      value="clear-bait-selection"
                      onSelect={() => {
                        onFormDataChange({
                          baitUsed: "",
                        });
                        setBaitSearch("");
                        setBaitPopoverOpen(false);
                      }}
                    >
                      Clear selection
                    </CommandItem>
                  )}
                </CommandGroup>
                {Object.entries(baitsByCategory).map(([category, items]) => (
                  <CommandGroup key={category} heading={category}>
                    {items.map((bait) => (
                      <CommandItem
                        key={bait.slug}
                        value={bait.slug}
                        onSelect={() => {
                          onFormDataChange({
                            baitUsed: bait.label,
                          });
                          setBaitSearch("");
                          setBaitPopoverOpen(false);
                        }}
                      >
                        {bait.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="method">Method</Label>
        <Popover
          open={methodPopoverOpen}
          onOpenChange={(isOpen) => {
            setMethodPopoverOpen(isOpen);
            if (!isOpen) {
              setMethodSearch("");
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={methodPopoverOpen}
              className="w-full justify-between"
            >
              {(() => {
                if (isLoadingMethods) return "Loading methods…";
                if (formData.method === "other") {
                  return formData.customMethod || "Other";
                }
                if (formData.method) {
                  const selected = methodOptions.find((item) => item.slug === formData.method);
                  if (selected) return selected.label;
                  return toTitleCase(formData.method.replace(/[-_]/g, " "));
                }
                return "Select method";
              })()}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0">
            <Command>
              <CommandInput
                placeholder="Search methods…"
                value={methodSearch}
                onValueChange={setMethodSearch}
              />
              <CommandList>
                <CommandEmpty>
                  {isLoadingMethods
                    ? "Loading methods…"
                    : trimmedMethodSearch
                      ? `No methods found for "${methodSearch}"`
                      : "Start typing to search methods"}
                </CommandEmpty>
                <CommandGroup heading="Quick actions">
                  {trimmedMethodSearch && (
                    <CommandItem
                      value={`custom-${trimmedMethodSearch}`}
                      onSelect={() => {
                        const customValue = toTitleCase(methodSearch.trim());
                        onFormDataChange({
                          method: "other",
                          customMethod: customValue,
                        });
                        setMethodSearch("");
                        setMethodPopoverOpen(false);
                      }}
                    >
                      Use "{toTitleCase(methodSearch.trim())}"
                    </CommandItem>
                  )}
                  {formData.method || formData.customMethod ? (
                    <CommandItem
                      value="clear-method-selection"
                      onSelect={() => {
                        onFormDataChange({
                          method: "",
                          customMethod: "",
                        });
                        setMethodSearch("");
                        setMethodPopoverOpen(false);
                      }}
                    >
                      Clear selection
                    </CommandItem>
                  ) : null}
                  <CommandItem
                    value="select-other-method"
                    onSelect={() => {
                      onFormDataChange({
                        method: "other",
                        customMethod: formData.customMethod,
                      });
                      setMethodPopoverOpen(false);
                      setMethodSearch("");
                    }}
                  >
                    Other (describe manually)
                  </CommandItem>
                </CommandGroup>
                {Object.entries(methodsByGroup).map(([groupLabel, items]) => (
                  <CommandGroup key={groupLabel} heading={groupLabel}>
                    {items.map((method) => (
                      <CommandItem
                        key={method.slug}
                        value={method.slug}
                        onSelect={() => {
                          onFormDataChange({
                            method: method.slug,
                            customMethod: "",
                          });
                          setMethodSearch("");
                          setMethodPopoverOpen(false);
                        }}
                      >
                        {method.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {formData.method === "other" && (
          <div className="space-y-1">
            <Label htmlFor="customMethod" className="text-xs text-muted-foreground">
              Describe the method
            </Label>
            <Input
              id="customMethod"
              value={formData.customMethod}
              onChange={(e) =>
                onFormDataChange({
                  customMethod: capitalizeFirstWord(e.target.value),
                })
              }
              placeholder="e.g., Zigs"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="equipmentUsed">Equipment</Label>
        <Input
          id="equipmentUsed"
          value={formData.equipmentUsed}
          onChange={(e) =>
            onFormDataChange({
              equipmentUsed: capitalizeFirstWord(e.target.value),
            })
          }
          placeholder="e.g., 12ft carp rod, baitrunner reel"
        />
      </div>
    </div>
  );
};
