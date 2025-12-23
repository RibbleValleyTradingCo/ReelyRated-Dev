import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type OpeningHourRow = {
  id: string;
  venue_id: string;
  label: string;
  day_of_week: number | null;
  opens_at: string;
  closes_at: string;
  is_closed: boolean;
  order_index: number;
  isNew?: boolean;
};

const dayOptions = [
  { value: 0, label: "Mon" },
  { value: 1, label: "Tue" },
  { value: 2, label: "Wed" },
  { value: 3, label: "Thu" },
  { value: 4, label: "Fri" },
  { value: 5, label: "Sat" },
  { value: 6, label: "Sun" },
];

const normalizeTime = (value: string | null) => {
  if (!value) return "";
  return value.slice(0, 5);
};

const getNextOrderIndex = (rows: OpeningHourRow[]) =>
  rows.length === 0 ? 0 : Math.max(...rows.map((row) => row.order_index ?? 0)) + 1;

const dayLabelsLong = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const getNextAvailableDay = (rows: OpeningHourRow[]) => {
  const usedDays = new Set(
    rows
      .map((row) => row.day_of_week)
      .filter((value): value is number => value !== null && value !== undefined)
  );
  for (let day = 0; day < 7; day += 1) {
    if (!usedDays.has(day)) return day;
  }
  return 0;
};

interface OpeningHoursCardProps {
  venueId: string;
  mode?: "owner" | "admin";
}

const OpeningHoursCard = ({ venueId, mode = "owner" }: OpeningHoursCardProps) => {
  const [rows, setRows] = useState<OpeningHourRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const loadingState = useMemo(() => ({ isLoading: loading }), [loading]);

  const markSaving = (id: string, saving: boolean) =>
    setSavingIds((prev) => {
      const next = new Set(prev);
      if (saving) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });

  const loadOpeningHours = useCallback(async () => {
    if (!venueId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("venue_opening_hours")
      .select("*")
      .eq("venue_id", venueId)
      .order("order_index", { ascending: true });
    if (error) {
      console.error("Failed to load opening hours", error);
      toast.error("Unable to load opening hours");
      setRows([]);
    } else {
      const mapped =
        data?.map((row) => ({
          id: row.id,
          venue_id: row.venue_id,
          label: row.label ?? "",
          day_of_week: row.day_of_week ?? null,
          opens_at: normalizeTime(row.opens_at),
          closes_at: normalizeTime(row.closes_at),
          is_closed: row.is_closed ?? false,
          order_index: row.order_index ?? 0,
          isNew: false,
        })) ?? [];
      setRows(mapped);
    }
    setLoading(false);
  }, [venueId]);

  useEffect(() => {
    void loadOpeningHours();
  }, [loadOpeningHours]);

  const updateRow = (id: string, updates: Partial<OpeningHourRow>) =>
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...updates } : row)));

  const validateRow = (row: OpeningHourRow) => {
    if (row.day_of_week === null || Number.isNaN(row.day_of_week)) {
      return "Day is required.";
    }
    if (!row.is_closed && (!row.opens_at || !row.closes_at)) {
      return "Opens and closes times are required unless closed.";
    }
    return "";
  };

  const handleSaveRow = async (row: OpeningHourRow) => {
    const errorMessage = validateRow(row);
    if (errorMessage) {
      setRowErrors((prev) => ({ ...prev, [row.id]: errorMessage }));
      return;
    }
    setRowErrors((prev) => ({ ...prev, [row.id]: "" }));
    markSaving(row.id, true);
    const payload = {
      p_venue_id: venueId,
      p_label: row.label || null,
      p_day_of_week: row.day_of_week ?? 0,
      p_opens_at: row.is_closed ? null : row.opens_at,
      p_closes_at: row.is_closed ? null : row.closes_at,
      p_is_closed: row.is_closed,
      p_order_index: row.order_index ?? 0,
    };

    const createRpc = mode === "admin" ? "admin_create_venue_opening_hour" : "owner_create_venue_opening_hour";
    const updateRpc = mode === "admin" ? "admin_update_venue_opening_hour" : "owner_update_venue_opening_hour";

    if (row.isNew) {
      const { error } = await supabase.rpc(createRpc, payload);
      if (error) {
        console.error("Failed to create opening hour", error);
        toast.error("Failed to save opening hour");
        markSaving(row.id, false);
        return;
      }
      toast.success("Opening hour added");
    } else {
      const { error } = await supabase.rpc(updateRpc, {
        p_id: row.id,
        ...payload,
      });
      if (error) {
        console.error("Failed to update opening hour", error);
        toast.error("Failed to save opening hour");
        markSaving(row.id, false);
        return;
      }
      toast.success("Opening hour updated");
    }
    await loadOpeningHours();
    markSaving(row.id, false);
  };

  const handleDeleteRow = async (row: OpeningHourRow) => {
    if (row.isNew) {
      setRows((prev) => prev.filter((item) => item.id !== row.id));
      return;
    }
    markSaving(row.id, true);
    const deleteRpc = mode === "admin" ? "admin_delete_venue_opening_hour" : "owner_delete_venue_opening_hour";
    const { error } = await supabase.rpc(deleteRpc, { p_id: row.id });
    if (error) {
      console.error("Failed to delete opening hour", error);
      toast.error("Failed to delete opening hour");
      markSaving(row.id, false);
      return;
    }
    toast.success("Opening hour deleted");
    await loadOpeningHours();
    markSaving(row.id, false);
  };

  const handleAddRow = () => {
    const nextOrder = getNextOrderIndex(rows);
    const tempId = `new-${Date.now()}-${Math.round(Math.random() * 1000)}`;
    setRows((prev) => [
      ...prev,
      {
        id: tempId,
        venue_id: venueId,
        label: "",
        day_of_week: null,
        opens_at: "",
        closes_at: "",
        is_closed: false,
        order_index: nextOrder,
        isNew: true,
      },
    ]);
  };

  const handleDuplicateRow = (row: OpeningHourRow, rowIndex: number) => {
    const baseDay =
      row.day_of_week === null || row.day_of_week === undefined
        ? getNextAvailableDay(rows)
        : (row.day_of_week + 1) % 7;
    const nextOrder = row.order_index ?? getNextOrderIndex(rows);
    const tempId = `new-${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const duplicateRow: OpeningHourRow = {
      id: tempId,
      venue_id: venueId,
      label: row.label,
      day_of_week: baseDay,
      opens_at: row.opens_at,
      closes_at: row.closes_at,
      is_closed: row.is_closed,
      order_index: nextOrder,
      isNew: true,
    };
    setRows((prev) => {
      const next = [...prev];
      next.splice(rowIndex + 1, 0, duplicateRow);
      return next;
    });
    toast.success(`Duplicated to ${dayLabelsLong[baseDay] ?? "next day"}`);
  };

  return (
    <Card className="w-full border-border/70">
      <CardHeader className="space-y-1">
        <Heading as="h2" size="md" className="text-foreground">
          Opening Hours
        </Heading>
        <Text variant="muted" className="text-sm">
          Set seasonal or day-by-day opening times. Leave blank if unknown.
        </Text>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingState.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading opening hours…
          </div>
        ) : rows.length === 0 ? (
          <div className="space-y-3">
            <Text variant="muted" className="text-sm">
              No opening hours added yet.
            </Text>
            <Button type="button" variant="outline" onClick={handleAddRow}>
              Add opening hour
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((row, index) => {
              const isSaving = savingIds.has(row.id);
              const errorMessage = rowErrors[row.id];
              return (
                <div key={row.id} className="rounded-lg border border-border/60 bg-card/60 p-4 space-y-3">
                  <div className="grid gap-3 md:grid-cols-6 md:items-end">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-foreground">Label</label>
                      <Input
                        value={row.label}
                        onChange={(e) => updateRow(row.id, { label: e.target.value })}
                        placeholder="Summer"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-foreground">Day</label>
                      <Select
                        value={row.day_of_week !== null ? String(row.day_of_week) : ""}
                        onValueChange={(value) => updateRow(row.id, { day_of_week: Number(value) })}
                        disabled={isSaving}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {dayOptions.map((day) => (
                            <SelectItem key={day.value} value={String(day.value)}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 md:col-span-2">
                      <Checkbox
                        id={`closed-${row.id}`}
                        checked={row.is_closed}
                        onCheckedChange={(checked) =>
                          updateRow(row.id, {
                            is_closed: Boolean(checked),
                            opens_at: checked ? "" : row.opens_at,
                            closes_at: checked ? "" : row.closes_at,
                          })
                        }
                        disabled={isSaving}
                      />
                      <label htmlFor={`closed-${row.id}`} className="text-sm font-semibold text-foreground">
                        Closed
                      </label>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Opens</label>
                      <Input
                        type="time"
                        value={row.opens_at}
                        onChange={(e) => updateRow(row.id, { opens_at: e.target.value })}
                        disabled={isSaving || row.is_closed}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Closes</label>
                      <Input
                        type="time"
                        value={row.closes_at}
                        onChange={(e) => updateRow(row.id, { closes_at: e.target.value })}
                        disabled={isSaving || row.is_closed}
                      />
                    </div>
                    <div className="flex flex-col gap-2 md:items-end md:justify-end">
                      <Button type="button" variant="outline" size="sm" onClick={() => void handleSaveRow(row)} disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicateRow(row, index)}
                        disabled={isSaving}
                      >
                        Duplicate
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleDeleteRow(row)}
                        disabled={isSaving}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  {errorMessage ? <Text className="text-sm text-destructive">{errorMessage}</Text> : null}
                </div>
              );
            })}
            <Button type="button" variant="outline" onClick={handleAddRow}>
              Add opening hour
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OpeningHoursCard;
