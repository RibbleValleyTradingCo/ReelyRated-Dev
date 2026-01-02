import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SectionSaveFooter from "@/components/ui/SectionSaveFooter";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import { Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";


type OpeningHourRow = {
  id: string;
  venue_id: string;
  label: string;
  day_of_week: number | null;
  opens_at: string;
  closes_at: string;
  is_closed: boolean;
  order_index: number;
};

type OpeningHoursGroup = {
  id: string;
  label: string;
  days: number[];
  opens_at: string;
  closes_at: string;
  is_closed: boolean;
  order_index: number;
  rowIdsByDay: Record<number, string>;
  isNew?: boolean;
};

type SectionStatus = "clean" | "dirty" | "saving" | "saved" | "error";

const dayOptions = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const dayLabelsLong = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const presetOptions = [
  { value: "weekdays", label: "Weekdays (Mon–Fri)", days: [1, 2, 3, 4, 5] },
  { value: "weekends", label: "Weekends (Sat–Sun)", days: [6, 0] },
  { value: "all_week", label: "All week", days: [0, 1, 2, 3, 4, 5, 6] },
  { value: "bank_holidays", label: "Bank holidays (closed)", days: [] },
];

const getSupabaseErrorMessage = (error: unknown, fallback: string) => {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case "23502":
      return "Missing required fields. Please complete all required inputs.";
    case "23505":
      return "This entry already exists.";
    case "22001":
      return "One of the values is too long. Please shorten it.";
    case "22P02":
      return "One of the values has an invalid format.";
    case "42501":
      return "You don't have permission to update this section.";
    default:
      return fallback;
  }
};

const normalizeTime = (value: string | null) => {
  if (!value) return "";
  return value.slice(0, 5);
};

const getNextOrderIndex = (rows: OpeningHoursGroup[]) =>
  rows.length === 0 ? 0 : Math.max(...rows.map((row) => row.order_index ?? 0)) + 1;

const buildGroupKey = (row: OpeningHourRow) =>
  `${row.label ?? ""}::${row.is_closed ? "1" : "0"}::${row.opens_at ?? ""}::${row.closes_at ?? ""}`;

const groupOpeningHours = (rows: OpeningHourRow[]): OpeningHoursGroup[] => {
  const sortedRows = [...rows].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const groupsMap = new Map<string, OpeningHoursGroup>();

  sortedRows.forEach((row) => {
    const key = buildGroupKey(row);
    const day = row.day_of_week;
    const existing = groupsMap.get(key);
    if (!existing) {
      const group: OpeningHoursGroup = {
        id: row.id,
        label: row.label ?? "",
        days: day === null || day === undefined ? [] : [day],
        opens_at: row.opens_at ?? "",
        closes_at: row.closes_at ?? "",
        is_closed: row.is_closed ?? false,
        order_index: row.order_index ?? 0,
        rowIdsByDay: day === null || day === undefined ? {} : { [day]: row.id },
      };
      groupsMap.set(key, group);
      return;
    }
    if (day !== null && day !== undefined) {
      if (!existing.days.includes(day)) {
        existing.days.push(day);
      }
      existing.rowIdsByDay[day] = row.id;
    }
    existing.order_index = Math.min(existing.order_index, row.order_index ?? existing.order_index);
  });

  const grouped = Array.from(groupsMap.values());
  grouped.forEach((group) => {
    group.days = [...new Set(group.days)].sort((a, b) => a - b);
  });

  return grouped.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
};

const parseTimeToMinutes = (value: string) => {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

interface OpeningHoursCardProps {
  venueId: string;
  mode?: "owner" | "admin";
  variant?: "card" | "embedded";
  showHeader?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  resetSignal?: number;
}

const OpeningHoursCard = ({
  venueId,
  mode = "owner",
  variant = "card",
  showHeader = true,
  onDirtyChange,
  resetSignal,
}: OpeningHoursCardProps) => {
  const queryClient = useQueryClient();
  const isEmbedded = variant === "embedded";
  const [baselineGroups, setBaselineGroups] = useState<OpeningHoursGroup[]>([]);
  const [groups, setGroups] = useState<OpeningHoursGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<SectionStatus>("clean");
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [copyTarget, setCopyTarget] = useState<{ groupId: string; days: number[] } | null>(null);
  const [presetValue, setPresetValue] = useState("");
  const savedStatusTimeoutRef = useRef<number | null>(null);

  const clearSavedStatusTimeout = useCallback(() => {
    if (savedStatusTimeoutRef.current) {
      window.clearTimeout(savedStatusTimeoutRef.current);
      savedStatusTimeoutRef.current = null;
    }
  }, []);

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
      setGroups([]);
      setBaselineGroups([]);
    } else {
      const mapped: OpeningHourRow[] =
        data?.map((row) => ({
          id: row.id,
          venue_id: row.venue_id,
          label: row.label ?? "",
          day_of_week: row.day_of_week ?? null,
          opens_at: normalizeTime(row.opens_at),
          closes_at: normalizeTime(row.closes_at),
          is_closed: row.is_closed ?? false,
          order_index: row.order_index ?? 0,
        })) ?? [];
      const grouped = groupOpeningHours(mapped);
      setBaselineGroups(grouped);
      setGroups(grouped);
      setRowErrors({});
      setStatus("clean");
      clearSavedStatusTimeout();
    }
    setLoading(false);
  }, [clearSavedStatusTimeout, venueId]);

  useEffect(() => {
    void loadOpeningHours();
  }, [loadOpeningHours]);

  const updateGroup = (id: string, updates: Partial<OpeningHoursGroup>) => {
    setGroups((prev) => prev.map((row) => (row.id === id ? { ...row, ...updates } : row)));
    setRowErrors((prev) => ({ ...prev, [id]: "" }));
    setStatus("dirty");
  };

  const toggleDay = (groupId: string, day: number) => {
    setGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        const hasDay = group.days.includes(day);
        const nextDays = hasDay
          ? group.days.filter((value) => value !== day)
          : [...group.days, day];
        return { ...group, days: nextDays.sort((a, b) => a - b) };
      })
    );
    setStatus("dirty");
  };

  const validateGroup = (row: OpeningHoursGroup) => {
    if (row.days.length === 0) {
      return "Select at least one day.";
    }
    if (!row.is_closed && (!row.opens_at || !row.closes_at)) {
      return "Opens and closes times are required unless closed.";
    }
    return "";
  };

  const handleDeleteGroup = (row: OpeningHoursGroup) => {
    if (row.isNew) {
      setGroups((prev) => prev.filter((item) => item.id !== row.id));
      setRowErrors((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      setStatus("dirty");
      return;
    }
    const confirmed = window.confirm("Delete this opening hours entry?");
    if (!confirmed) return;
    setGroups((prev) => prev.filter((item) => item.id !== row.id));
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });
    setStatus("dirty");
  };

  const handleAddGroup = (preset?: typeof presetOptions[number]) => {
    const tempId = `new-${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const presetDays = preset?.days ?? [];
    const isClosed = preset?.value === "bank_holidays" ? true : false;
    setGroups((prev) => [
      ...prev,
      {
        id: tempId,
        label: preset?.value === "bank_holidays" ? "Bank holidays" : "",
        days: [...presetDays].sort((a, b) => a - b),
        opens_at: "",
        closes_at: "",
        is_closed: isClosed,
        order_index: getNextOrderIndex(prev),
        rowIdsByDay: {},
        isNew: true,
      },
    ]);
    setStatus("dirty");
  };

  const handlePresetAdd = (value: string) => {
    const preset = presetOptions.find((option) => option.value === value);
    if (!preset) return;
    handleAddGroup(preset);
  };

  const handleCopyToDays = (row: OpeningHoursGroup, days: number[]) => {
    if (days.length === 0) return;
    setGroups((prev) =>
      prev.map((group) => {
        if (group.id !== row.id) return group;
        const nextDays = Array.from(new Set([...group.days, ...days])).sort((a, b) => a - b);
        return { ...group, days: nextDays };
      })
    );
    setCopyTarget(null);
    setStatus("dirty");
  };

  const normalizeGroupFields = (group: OpeningHoursGroup) => ({
    label: group.label.trim(),
    opens_at: normalizeTime(group.opens_at),
    closes_at: normalizeTime(group.closes_at),
    is_closed: group.is_closed,
    order_index: Math.max(group.order_index ?? 0, 0),
  });

  const groupFieldsEqual = (left: OpeningHoursGroup, right: OpeningHoursGroup) => {
    const leftFields = normalizeGroupFields(left);
    const rightFields = normalizeGroupFields(right);
    return Object.keys(leftFields).every((key) => leftFields[key as keyof typeof leftFields] === rightFields[key as keyof typeof rightFields]);
  };

  const groupsEqual = (left: OpeningHoursGroup, right: OpeningHoursGroup) => {
    if (!groupFieldsEqual(left, right)) return false;
    const leftDays = [...new Set(left.days)].sort((a, b) => a - b);
    const rightDays = [...new Set(right.days)].sort((a, b) => a - b);
    if (leftDays.length !== rightDays.length) return false;
    return leftDays.every((day, index) => day === rightDays[index]);
  };

  const isDirty = useMemo(() => {
    if (baselineGroups.length !== groups.length) return true;
    const baselineMap = new Map(baselineGroups.map((group) => [group.id, group]));
    for (const group of groups) {
      const baseline = baselineMap.get(group.id);
      if (!baseline) return true;
      if (!groupsEqual(baseline, group)) return true;
    }
    return false;
  }, [baselineGroups, groups]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (saving) return;
    if (isDirty && (status === "clean" || status === "saved")) {
      setStatus("dirty");
    }
    if (!isDirty && status !== "clean" && status !== "saved") {
      setStatus("clean");
    }
  }, [isDirty, saving, status]);

  useEffect(() => {
    if (!resetSignal) return;
    setGroups(
      baselineGroups.map((group) => ({
        ...group,
        days: [...group.days],
        rowIdsByDay: { ...group.rowIdsByDay },
        isNew: false,
      }))
    );
    setRowErrors({});
    setStatus("clean");
    clearSavedStatusTimeout();
  }, [baselineGroups, clearSavedStatusTimeout, resetSignal]);

  const handleSaveSection = async () => {
    if (!venueId || saving || !isDirty) return;
    setSaving(true);
    setStatus("saving");
    setRowErrors({});
    clearSavedStatusTimeout();

    const baselineMap = new Map(baselineGroups.map((group) => [group.id, group]));
    const draftMap = new Map(groups.map((group) => [group.id, group]));
    const deletedGroupIds = new Set(baselineGroups.filter((group) => !draftMap.has(group.id)).map((group) => group.id));

    const deleteOps: Array<{ groupId: string; day: number; rowId: string }> = [];
    const createOps: Array<{ groupId: string; day: number }> = [];
    const updateOps: Array<{ groupId: string; day: number; rowId: string }> = [];

    const invalidGroups = new Map<string, string>();
    const groupUpdateNeeded = new Set<string>();

    baselineGroups.forEach((baselineGroup) => {
      const draftGroup = draftMap.get(baselineGroup.id);
      if (!draftGroup) {
        Object.entries(baselineGroup.rowIdsByDay).forEach(([dayKey, rowId]) => {
          const day = Number(dayKey);
          if (rowId) {
            deleteOps.push({ groupId: baselineGroup.id, day, rowId });
          }
        });
        return;
      }
      baselineGroup.days.forEach((day) => {
        if (!draftGroup.days.includes(day)) {
          const rowId = baselineGroup.rowIdsByDay[day];
          if (rowId) {
            deleteOps.push({ groupId: baselineGroup.id, day, rowId });
          }
        }
      });
    });

    groups.forEach((group) => {
      const validationError = validateGroup(group);
      if (validationError) {
        invalidGroups.set(group.id, validationError);
      }
      const baseGroup = baselineMap.get(group.id);
      const fieldsChanged = baseGroup ? !groupFieldsEqual(baseGroup, group) : true;
      if (baseGroup && fieldsChanged) {
        groupUpdateNeeded.add(group.id);
      }
      if (validationError) return;
      group.days.forEach((day) => {
        const existingId = group.rowIdsByDay[day];
        if (existingId) {
          if (fieldsChanged) {
            updateOps.push({ groupId: group.id, day, rowId: existingId });
          }
        } else {
          createOps.push({ groupId: group.id, day });
        }
      });
    });

    const errors: Record<string, string> = {};
    invalidGroups.forEach((message, groupId) => {
      errors[groupId] = message;
    });

    let successCount = 0;
    let failureCount = invalidGroups.size;
    const failedDeleteGroupIds = new Set<string>();
    const failedDeleteDays: Array<{ groupId: string; day: number; rowId: string }> = [];
    const groupUpdateFailed = new Set<string>();

    let nextGroups = groups.map((group) => ({
      ...group,
      days: [...group.days],
      rowIdsByDay: { ...group.rowIdsByDay },
    }));
    let nextBaseline = baselineGroups.map((group) => ({
      ...group,
      days: [...group.days],
      rowIdsByDay: { ...group.rowIdsByDay },
      isNew: false,
    }));

    const findNextGroup = (groupId: string) => nextGroups.find((group) => group.id === groupId);
    const findBaselineGroup = (groupId: string) => nextBaseline.find((group) => group.id === groupId);

    const createRpc = mode === "admin" ? "admin_create_venue_opening_hour" : "owner_create_venue_opening_hour";
    const updateRpc = mode === "admin" ? "admin_update_venue_opening_hour" : "owner_update_venue_opening_hour";
    const deleteRpc = mode === "admin" ? "admin_delete_venue_opening_hour" : "owner_delete_venue_opening_hour";

    const buildPayloadBase = (group: OpeningHoursGroup) => ({
      p_venue_id: venueId,
      p_label: group.label || null,
      p_opens_at: group.is_closed ? null : group.opens_at,
      p_closes_at: group.is_closed ? null : group.closes_at,
      p_is_closed: group.is_closed,
      p_order_index: group.order_index ?? 0,
    });

    for (const op of deleteOps) {
      const { error } = await supabase.rpc(deleteRpc, { p_id: op.rowId });
      if (error) {
        console.error("Failed to delete opening hour", error);
        errors[op.groupId] = getSupabaseErrorMessage(error, "Delete failed. Please retry.");
        failureCount += 1;
        if (deletedGroupIds.has(op.groupId)) {
          failedDeleteGroupIds.add(op.groupId);
        } else {
          failedDeleteDays.push(op);
        }
        continue;
      }
      successCount += 1;
      const baselineGroup = findBaselineGroup(op.groupId);
      if (baselineGroup) {
        baselineGroup.days = baselineGroup.days.filter((day) => day !== op.day);
        delete baselineGroup.rowIdsByDay[op.day];
        if (baselineGroup.days.length === 0) {
          nextBaseline = nextBaseline.filter((group) => group.id !== op.groupId);
        }
      }
    }

    for (const op of createOps) {
      const group = findNextGroup(op.groupId);
      if (!group) {
        failureCount += 1;
        continue;
      }
      const { data, error } = await supabase.rpc(createRpc, {
        p_day_of_week: op.day,
        ...buildPayloadBase(group),
      });
      if (error || !data) {
        console.error("Failed to create opening hour", error);
        errors[op.groupId] = getSupabaseErrorMessage(error, "Save failed. Please check the fields and retry.");
        failureCount += 1;
        continue;
      }
      const created = data as OpeningHourRow;
      group.rowIdsByDay[op.day] = created.id;
      group.isNew = false;
      if (!group.days.includes(op.day)) {
        group.days = [...group.days, op.day].sort((a, b) => a - b);
      }
      const baselineGroup = findBaselineGroup(op.groupId);
      if (baselineGroup) {
        baselineGroup.rowIdsByDay[op.day] = created.id;
        if (!baselineGroup.days.includes(op.day)) {
          baselineGroup.days = [...baselineGroup.days, op.day].sort((a, b) => a - b);
        }
      } else {
        nextBaseline.push({
          ...group,
          days: [op.day],
          rowIdsByDay: { [op.day]: created.id },
          isNew: false,
        });
      }
      successCount += 1;
    }

    for (const op of updateOps) {
      const group = findNextGroup(op.groupId);
      if (!group) {
        failureCount += 1;
        continue;
      }
      const { error } = await supabase.rpc(updateRpc, {
        p_id: op.rowId,
        p_day_of_week: op.day,
        ...buildPayloadBase(group),
      });
      if (error) {
        console.error("Failed to update opening hour", error);
        errors[op.groupId] = getSupabaseErrorMessage(error, "Save failed. Please check the fields and retry.");
        groupUpdateFailed.add(op.groupId);
        failureCount += 1;
        continue;
      }
      successCount += 1;
    }

    failedDeleteGroupIds.forEach((groupId) => {
      if (!nextGroups.find((group) => group.id === groupId)) {
        const baselineGroup = baselineGroups.find((group) => group.id === groupId);
        if (baselineGroup) {
          nextGroups.push({
            ...baselineGroup,
            days: [...baselineGroup.days],
            rowIdsByDay: { ...baselineGroup.rowIdsByDay },
            isNew: false,
          });
        }
      }
    });

    failedDeleteDays.forEach((failed) => {
      const group = findNextGroup(failed.groupId);
      if (!group) return;
      if (!group.days.includes(failed.day)) {
        group.days = [...group.days, failed.day].sort((a, b) => a - b);
      }
      group.rowIdsByDay[failed.day] = failed.rowId;
    });

    groupUpdateNeeded.forEach((groupId) => {
      if (groupUpdateFailed.has(groupId)) return;
      const draftGroup = findNextGroup(groupId);
      const baselineGroup = findBaselineGroup(groupId);
      if (!draftGroup || !baselineGroup) return;
      baselineGroup.label = draftGroup.label;
      baselineGroup.opens_at = draftGroup.opens_at;
      baselineGroup.closes_at = draftGroup.closes_at;
      baselineGroup.is_closed = draftGroup.is_closed;
      baselineGroup.order_index = draftGroup.order_index;
    });

    setGroups(nextGroups);
    setBaselineGroups(nextBaseline);
    setRowErrors(errors);

    if (failureCount > 0) {
      setStatus("error");
      toast.error(`${successCount} saved, ${failureCount} failed`);
      setSaving(false);
      return;
    }

    toast.success("Opening hours updated");
    await loadOpeningHours();
    void queryClient.invalidateQueries({ queryKey: qk.venueOpeningHours(venueId) });
    setStatus("saved");
    savedStatusTimeoutRef.current = window.setTimeout(() => {
      setStatus("clean");
    }, 1500);
    setSaving(false);
  };

  const previewByDay = useMemo(() => {
    const map = new Map<number, OpeningHoursGroup[]>();
    groups.forEach((group) => {
      group.days.forEach((day) => {
        const next = map.get(day) ?? [];
        next.push(group);
        map.set(day, next);
      });
    });
    return map;
  }, [groups]);

  const body = (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tip: group multiple days to save time (e.g., Mon–Fri).
          </Text>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={presetValue}
            onValueChange={(value) => {
              setPresetValue(value);
              handlePresetAdd(value);
              setPresetValue("");
            }}
            disabled={saving}
          >
            <SelectTrigger className="min-w-[200px]" aria-label="Add preset">
              <SelectValue placeholder="Add preset" />
            </SelectTrigger>
            <SelectContent>
              {presetOptions.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={() => handleAddGroup()} disabled={saving}>
            <Plus className="mr-2 h-4 w-4" />
            Add row
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading opening hours…
        </div>
      ) : groups.length === 0 ? (
        <div className="space-y-2">
          <Text variant="muted" className="text-sm">
            No opening hours added yet.
          </Text>
          <Text variant="muted" className="text-xs">
            Add day-by-day or seasonal hours so anglers know when to visit.
          </Text>
        </div>
      ) : null}

      {groups.length > 0 ? (
        <div className="space-y-4">
          {groups.map((row) => {
            const isSaving = saving;
            const errorMessage = rowErrors[row.id];
            const opensMinutes = parseTimeToMinutes(row.opens_at);
            const closesMinutes = parseTimeToMinutes(row.closes_at);
            const showTimeWarning =
              !row.is_closed &&
              opensMinutes !== null &&
              closesMinutes !== null &&
              closesMinutes <= opensMinutes;
            const copyOpen = copyTarget?.groupId === row.id;
            const copyDays = copyTarget?.groupId === row.id ? copyTarget.days : [];
            const labelId = `opening-label-${row.id}`;
            const opensId = `opening-opens-${row.id}`;
            const closesId = `opening-closes-${row.id}`;

            return (
              <div key={row.id} className="rounded-xl border border-border bg-muted/40 p-4 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Text className="text-sm font-semibold text-foreground">Opening entry</Text>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCopyTarget({ groupId: row.id, days: [] })}
                      disabled={isSaving}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy to days
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Delete opening hours"
                      onClick={() => void handleDeleteGroup(row)}
                      disabled={isSaving}
                      className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Days</Text>
                  <div className="flex flex-wrap gap-2">
                    {dayOptions.map((day) => {
                      const isSelected = row.days.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => toggleDay(row.id, day.value)}
                          className={`min-h-[44px] rounded-full px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "border border-border bg-background text-muted-foreground hover:border-border/80 hover:bg-muted/40"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
                  <div className="space-y-2 lg:col-span-4">
                    <label htmlFor={labelId} className="text-sm font-semibold text-foreground">Label</label>
                    <Input
                      id={labelId}
                      value={row.label}
                      onChange={(e) => updateGroup(row.id, { label: e.target.value })}
                      placeholder="Summer"
                      disabled={isSaving}
                    />
                    <Text variant="muted" className="text-xs">
                      Optional season label.
                    </Text>
                  </div>
                  <div className="flex items-center gap-3 lg:col-span-3">
                    <Switch
                      id={`closed-${row.id}`}
                      checked={row.is_closed}
                      onCheckedChange={(checked) =>
                        updateGroup(row.id, {
                          is_closed: checked,
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
                  <div className="space-y-2 lg:col-span-2">
                    <label htmlFor={opensId} className="text-sm font-semibold text-foreground">Opens</label>
                    <Input
                      id={opensId}
                      type="time"
                      value={row.opens_at}
                      onChange={(e) => updateGroup(row.id, { opens_at: e.target.value })}
                      disabled={isSaving || row.is_closed}
                      className={row.is_closed ? "opacity-60" : ""}
                    />
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <label htmlFor={closesId} className="text-sm font-semibold text-foreground">Closes</label>
                    <Input
                      id={closesId}
                      type="time"
                      value={row.closes_at}
                      onChange={(e) => updateGroup(row.id, { closes_at: e.target.value })}
                      disabled={isSaving || row.is_closed}
                      className={row.is_closed ? "opacity-60" : ""}
                    />
                  </div>
                </div>

                {errorMessage ? <Text className="text-sm text-destructive">{errorMessage}</Text> : null}
                {showTimeWarning ? (
                  <Text className="text-xs text-destructive/90">
                    Closing time is earlier than opening time.
                  </Text>
                ) : null}

                {copyOpen ? (
                  <div className="rounded-lg border border-border bg-card p-3 space-y-3">
                    <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Copy to days
                    </Text>
                    <div className="flex flex-wrap gap-2">
                      {dayOptions.map((day) => {
                        const isSelected = copyDays.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => {
                              setCopyTarget((prev) => {
                                if (!prev || prev.groupId !== row.id) return prev;
                                const nextDays = isSelected
                                  ? prev.days.filter((value) => value !== day.value)
                                  : [...prev.days, day.value];
                                return { ...prev, days: nextDays };
                              });
                            }}
                            className={`min-h-[40px] rounded-full px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "border border-border bg-background text-muted-foreground hover:border-border/80 hover:bg-muted/40"
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleCopyToDays(row, copyDays)}
                        disabled={copyDays.length === 0}
                      >
                        Apply to days
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCopyTarget(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <Text className="text-sm font-semibold text-foreground">Weekly preview</Text>
          <Text variant="muted" className="text-xs">
            Read-only summary for quick checks.
          </Text>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {dayOptions.map((day) => {
            const entries = previewByDay.get(day.value) ?? [];
            let content = "Not set";
            let tone = "text-muted-foreground";
            if (entries.length === 1) {
              const entry = entries[0];
              if (entry.is_closed) {
                content = "Closed";
                tone = "text-destructive";
              } else if (entry.opens_at && entry.closes_at) {
                content = `${entry.opens_at} – ${entry.closes_at}`;
                tone = "text-foreground";
              }
            } else if (entries.length > 1) {
              content = "Multiple entries";
              tone = "text-accent";
            }
            return (
              <div key={day.value} className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">{dayLabelsLong[day.value]}</span>
                <span className={tone}>{content}</span>
              </div>
            );
          })}
        </div>
      </div>

      <SectionSaveFooter
        dirty={isDirty}
        saving={saving}
        justSaved={status === "saved"}
        onSave={() => void handleSaveSection()}
        saveDisabled={!isDirty}
      />
    </div>
  );

  if (isEmbedded) {
    return (
      <div className="space-y-2">
        {showHeader ? (
          <>
            <Heading as="h3" size="sm" className="text-foreground">
              Opening hours
            </Heading>
            <Text variant="muted" className="text-sm">
              Set seasonal or day-by-day opening times. Leave blank if unknown.
            </Text>
          </>
        ) : null}
        {body}
      </div>
    );
  }

  return (
    <Card className="w-full rounded-2xl border border-border bg-card p-6 shadow-card">
      <CardHeader className="space-y-1 p-0">
        <Heading as="h2" size="md" className="text-foreground">
          Opening Hours
        </Heading>
        <Text variant="muted" className="text-sm">
          Set seasonal or day-by-day opening times. Leave blank if unknown.
        </Text>
      </CardHeader>
      <CardContent className="p-0 pt-4">{body}</CardContent>
    </Card>
  );
};

export default OpeningHoursCard;
