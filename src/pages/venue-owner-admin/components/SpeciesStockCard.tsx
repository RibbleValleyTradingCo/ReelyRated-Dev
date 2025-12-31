import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SectionSaveFooter from "@/components/ui/SectionSaveFooter";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";

type SpeciesStockRow = {
  id: string;
  venue_id: string;
  species_name: string;
  record_weight: string;
  record_unit: string;
  avg_weight: string;
  size_range_min: string;
  size_range_max: string;
  stock_density: "low" | "medium" | "high";
  stock_notes: string;
  isNew?: boolean;
};

type SectionStatus = "clean" | "dirty" | "saving" | "saved" | "error";

const densityOptions = [
  { value: "low", label: "Low density" },
  { value: "medium", label: "Medium density" },
  { value: "high", label: "High density" },
];

const parseNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

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

interface SpeciesStockCardProps {
  venueId: string;
  mode?: "owner" | "admin";
  variant?: "card" | "embedded";
  showHeader?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  resetSignal?: number;
}

const SpeciesStockCard = ({
  venueId,
  mode = "owner",
  variant = "card",
  showHeader = true,
  onDirtyChange,
  resetSignal,
}: SpeciesStockCardProps) => {
  const queryClient = useQueryClient();
  const isEmbedded = variant === "embedded";
  const [baselineRows, setBaselineRows] = useState<SpeciesStockRow[]>([]);
  const [rows, setRows] = useState<SpeciesStockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<SectionStatus>("clean");
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const savedStatusTimeoutRef = useRef<number | null>(null);

  const clearSavedStatusTimeout = useCallback(() => {
    if (savedStatusTimeoutRef.current) {
      window.clearTimeout(savedStatusTimeoutRef.current);
      savedStatusTimeoutRef.current = null;
    }
  }, []);

  const loadSpeciesStock = useCallback(async () => {
    if (!venueId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("venue_species_stock")
      .select("*")
      .eq("venue_id", venueId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Failed to load species stock", error);
      toast.error("Unable to load species stock");
      setRows([]);
      setBaselineRows([]);
    } else {
      const mapped =
        data?.map((row) => ({
          id: row.id,
          venue_id: row.venue_id,
          species_name: row.species_name ?? "",
          record_weight: row.record_weight?.toString() ?? "",
          record_unit: row.record_unit ?? "",
          avg_weight: row.avg_weight?.toString() ?? "",
          size_range_min: row.size_range_min?.toString() ?? "",
          size_range_max: row.size_range_max?.toString() ?? "",
          stock_density: (row.stock_density ?? "medium") as SpeciesStockRow["stock_density"],
          stock_notes: row.stock_notes ?? "",
          isNew: false,
        })) ?? [];
      setBaselineRows(mapped);
      setRows(mapped);
      setRowErrors({});
      setStatus("clean");
      clearSavedStatusTimeout();
    }
    setLoading(false);
  }, [clearSavedStatusTimeout, venueId]);

  useEffect(() => {
    void loadSpeciesStock();
  }, [loadSpeciesStock]);

  const updateRow = (id: string, updates: Partial<SpeciesStockRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...updates } : row)));
    setRowErrors((prev) => ({ ...prev, [id]: "" }));
    setStatus("dirty");
  };

  const validateRow = (row: SpeciesStockRow) => {
    if (!row.species_name.trim()) {
      return "Species name is required.";
    }
    const recordWeight = parseNumber(row.record_weight);
    if (recordWeight === null) {
      return "Record weight is required.";
    }
    if (!row.record_unit.trim()) {
      return "Record unit is required.";
    }
    return "";
  };

  const buildPayload = (row: SpeciesStockRow) => ({
    p_venue_id: venueId,
    p_species_name: row.species_name.trim(),
    p_record_weight: parseNumber(row.record_weight),
    p_record_unit: row.record_unit.trim(),
    p_avg_weight: parseNumber(row.avg_weight),
    p_size_range_min: parseNumber(row.size_range_min),
    p_size_range_max: parseNumber(row.size_range_max),
    p_stock_density: row.stock_density ?? "medium",
    p_stock_notes: row.stock_notes.trim() || null,
  });

  const handleDeleteRow = async (row: SpeciesStockRow) => {
    if (row.isNew) {
      setRows((prev) => prev.filter((item) => item.id !== row.id));
      setRowErrors((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      setStatus("dirty");
      return;
    }
    const confirmed = window.confirm("Delete this species entry?");
    if (!confirmed) return;
    setRows((prev) => prev.filter((item) => item.id !== row.id));
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });
    setStatus("dirty");
  };

  const handleAddRow = () => {
    const tempId = `new-${Date.now()}-${Math.round(Math.random() * 1000)}`;
    setRows((prev) => [
      ...prev,
      {
        id: tempId,
        venue_id: venueId,
        species_name: "",
        record_weight: "",
        record_unit: "",
        avg_weight: "",
        size_range_min: "",
        size_range_max: "",
        stock_density: "medium",
        stock_notes: "",
        isNew: true,
      },
    ]);
    setStatus("dirty");
  };

  const mapRowFromRpc = (row: SpeciesStockRow) => ({
    id: row.id,
    venue_id: row.venue_id,
    species_name: row.species_name ?? "",
    record_weight: row.record_weight?.toString?.() ?? String(row.record_weight ?? ""),
    record_unit: row.record_unit ?? "",
    avg_weight: row.avg_weight?.toString?.() ?? String(row.avg_weight ?? ""),
    size_range_min: row.size_range_min?.toString?.() ?? String(row.size_range_min ?? ""),
    size_range_max: row.size_range_max?.toString?.() ?? String(row.size_range_max ?? ""),
    stock_density: (row.stock_density ?? "medium") as SpeciesStockRow["stock_density"],
    stock_notes: row.stock_notes ?? "",
    isNew: false,
  });

  const normalizeRow = (row: SpeciesStockRow) => ({
    species_name: row.species_name.trim(),
    record_weight: parseNumber(row.record_weight),
    record_unit: row.record_unit.trim(),
    avg_weight: parseNumber(row.avg_weight),
    size_range_min: parseNumber(row.size_range_min),
    size_range_max: parseNumber(row.size_range_max),
    stock_density: row.stock_density ?? "medium",
    stock_notes: row.stock_notes.trim(),
  });

  const rowsEqual = (left: SpeciesStockRow, right: SpeciesStockRow) => {
    const leftNormalized = normalizeRow(left);
    const rightNormalized = normalizeRow(right);
    return Object.keys(leftNormalized).every((key) => leftNormalized[key as keyof typeof leftNormalized] === rightNormalized[key as keyof typeof rightNormalized]);
  };

  const isDirty = useMemo(() => {
    if (baselineRows.length !== rows.length) return true;
    const baselineMap = new Map(baselineRows.map((row) => [row.id, row]));
    for (const row of rows) {
      const baseline = baselineMap.get(row.id);
      if (!baseline) return true;
      if (!rowsEqual(baseline, row)) return true;
    }
    return false;
  }, [baselineRows, rows]);

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
    setRows(baselineRows.map((row) => ({ ...row, isNew: false })));
    setRowErrors({});
    setStatus("clean");
    clearSavedStatusTimeout();
  }, [baselineRows, clearSavedStatusTimeout, resetSignal]);

  const handleSaveSection = async () => {
    if (!venueId || saving || !isDirty) return;
    setSaving(true);
    setStatus("saving");
    setRowErrors({});
    clearSavedStatusTimeout();

    const baselineMap = new Map(baselineRows.map((row) => [row.id, row]));
    const draftMap = new Map(rows.map((row) => [row.id, row]));
    const deletes = baselineRows.filter((row) => !draftMap.has(row.id));
    const creates = rows.filter((row) => row.isNew || !baselineMap.has(row.id));
    const updates = rows.filter((row) => baselineMap.has(row.id) && !row.isNew && !rowsEqual(baselineMap.get(row.id)!, row));

    const operations: Array<{ type: "delete" | "create" | "update"; row: SpeciesStockRow }> = [
      ...deletes.map((row) => ({ type: "delete" as const, row })),
      ...creates.map((row) => ({ type: "create" as const, row })),
      ...updates.map((row) => ({ type: "update" as const, row })),
    ];

    const errors: Record<string, string> = {};
    const failedDeletes: SpeciesStockRow[] = [];
    let successCount = 0;
    let failureCount = 0;
    let nextRows = rows.map((row) => ({ ...row }));
    let nextBaseline = baselineRows.map((row) => ({ ...row }));

    const createRpc = mode === "admin" ? "admin_create_venue_species_stock" : "owner_create_venue_species_stock";
    const updateRpc = mode === "admin" ? "admin_update_venue_species_stock" : "owner_update_venue_species_stock";
    const deleteRpc = mode === "admin" ? "admin_delete_venue_species_stock" : "owner_delete_venue_species_stock";

    for (const op of operations) {
      if (op.type !== "delete") {
        const errorMessage = validateRow(op.row);
        if (errorMessage) {
          errors[op.row.id] = errorMessage;
          failureCount += 1;
          continue;
        }
      }

      if (op.type === "delete") {
        const { error } = await supabase.rpc(deleteRpc, { p_id: op.row.id });
        if (error) {
          console.error("Failed to delete species stock", error);
          errors[op.row.id] = getSupabaseErrorMessage(error, "Delete failed. Please retry.");
          failedDeletes.push(op.row);
          failureCount += 1;
        } else {
          successCount += 1;
          nextBaseline = nextBaseline.filter((row) => row.id !== op.row.id);
        }
        continue;
      }

      const payload = buildPayload(op.row);
      if (op.type === "create") {
        const { data, error } = await supabase.rpc(createRpc, payload);
        if (error || !data) {
          console.error("Failed to create species stock", error);
          errors[op.row.id] = getSupabaseErrorMessage(error, "Save failed. Please check the fields and retry.");
          failureCount += 1;
          continue;
        }
        const mapped = mapRowFromRpc(data as SpeciesStockRow);
        const index = nextRows.findIndex((row) => row.id === op.row.id);
        if (index >= 0) {
          nextRows[index] = mapped;
        } else {
          nextRows.push(mapped);
        }
        nextBaseline = [...nextBaseline.filter((row) => row.id !== mapped.id), mapped];
        successCount += 1;
        continue;
      }

      const { data, error } = await supabase.rpc(updateRpc, { p_id: op.row.id, ...payload });
      if (error || !data) {
        console.error("Failed to update species stock", error);
        errors[op.row.id] = getSupabaseErrorMessage(error, "Save failed. Please check the fields and retry.");
        failureCount += 1;
        continue;
      }
      const mapped = mapRowFromRpc(data as SpeciesStockRow);
      nextRows = nextRows.map((row) => (row.id === mapped.id ? mapped : row));
      nextBaseline = nextBaseline.map((row) => (row.id === mapped.id ? mapped : row));
      successCount += 1;
    }

    if (failedDeletes.length > 0) {
      failedDeletes.forEach((row) => {
        if (!nextRows.find((item) => item.id === row.id)) {
          nextRows.push({ ...row, isNew: false });
        }
      });
    }

    setRows(nextRows);
    setBaselineRows(nextBaseline);
    setRowErrors(errors);

    if (failureCount > 0) {
      setStatus("error");
      toast.error(`${successCount} saved, ${failureCount} failed`);
      setSaving(false);
      return;
    }

    toast.success("Species stock updated");
    await loadSpeciesStock();
    void queryClient.invalidateQueries({ queryKey: qk.venueSpeciesStock(venueId) });
    setStatus("saved");
    savedStatusTimeoutRef.current = window.setTimeout(() => {
      setStatus("clean");
    }, 1500);
    setSaving(false);
  };

  const header = showHeader ? (
    <div className="space-y-1">
      <Heading as="h2" size="md" className="text-foreground">
        Stock & Species
      </Heading>
      <Text variant="muted" className="text-sm">
        Add species records, size ranges, and stock density for this venue.
      </Text>
    </div>
  ) : null;

  const body = (
    <div className="space-y-5">
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading species stock…
        </div>
      ) : rows.length === 0 ? (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">No species added yet.</p>
          <p className="text-muted-foreground">
            Add your main stocked species so anglers can quickly assess this venue.
          </p>
          <Button onClick={handleAddRow} variant="outline" className="w-full sm:w-auto" disabled={saving}>
            Add species
          </Button>
        </div>
      ) : null}

      {rows.map((row) => {
        const isSaving = saving;
        return (
          <div key={row.id} className="space-y-4 rounded-xl border border-border bg-muted/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <Text className="text-sm font-semibold text-foreground">Species entry</Text>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => void handleDeleteRow(row)}
                  disabled={isSaving}
                  aria-label="Delete species entry"
                  className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Species name</label>
                <Input
                  value={row.species_name}
                  onChange={(e) => updateRow(row.id, { species_name: e.target.value })}
                  placeholder="Carp (Mirror/Common)"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Stock density</label>
                <Select
                  value={row.stock_density}
                  onValueChange={(value) =>
                    updateRow(row.id, { stock_density: value as SpeciesStockRow["stock_density"] })
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select density" />
                  </SelectTrigger>
                  <SelectContent>
                    {densityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Record weight</label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={row.record_weight}
                  onChange={(e) => updateRow(row.id, { record_weight: e.target.value })}
                  placeholder="34.4"
                  disabled={isSaving}
                />
                <Text variant="muted" className="text-xs">
                  Use numbers only (e.g., 34.4).
                </Text>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Record unit</label>
                <Input
                  value={row.record_unit}
                  onChange={(e) => updateRow(row.id, { record_unit: e.target.value })}
                  placeholder="lb"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Average weight</label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={row.avg_weight}
                  onChange={(e) => updateRow(row.id, { avg_weight: e.target.value })}
                  placeholder="18"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Size range min</label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={row.size_range_min}
                  onChange={(e) => updateRow(row.id, { size_range_min: e.target.value })}
                  placeholder="10"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Size range max</label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={row.size_range_max}
                  onChange={(e) => updateRow(row.id, { size_range_max: e.target.value })}
                  placeholder="30"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                <label className="text-sm font-semibold text-foreground">Notes</label>
                <Textarea
                  value={row.stock_notes}
                  onChange={(e) => updateRow(row.id, { stock_notes: e.target.value })}
                  placeholder="Runs water, specimen, etc."
                  rows={2}
                  disabled={isSaving}
                />
              </div>
            </div>

            {rowErrors[row.id] ? (
              <Text variant="muted" className="text-xs text-destructive">
                {rowErrors[row.id]}
              </Text>
            ) : null}
          </div>
        );
      })}

      {rows.length > 0 ? (
        <Button onClick={handleAddRow} variant="outline" className="w-full sm:w-auto" disabled={saving}>
          Add species
        </Button>
      ) : null}

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
      <div className="space-y-4">
        {header}
        {body}
      </div>
    );
  }

  return (
    <Card className="w-full rounded-2xl border border-border bg-card p-6 shadow-card">
      <CardHeader className="space-y-1 p-0">{header}</CardHeader>
      <CardContent className="p-0 pt-4">{body}</CardContent>
    </Card>
  );
};

export default SpeciesStockCard;
