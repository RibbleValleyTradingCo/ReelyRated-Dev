import { forwardRef, useCallback, useEffect, useMemo, useRef, useState, useImperativeHandle } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SectionSaveFooter from "@/components/ui/SectionSaveFooter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";

type PricingTierRow = {
  id: string;
  venue_id: string;
  label: string;
  price: string;
  unit: string;
  audience: string;
  order_index: number;
  isNew?: boolean;
};

type SectionStatus = "clean" | "dirty" | "saving" | "saved" | "error";

const getNextOrderIndex = (rows: PricingTierRow[]) =>
  rows.length === 0 ? 0 : Math.max(...rows.map((row) => row.order_index ?? 0)) + 1;

const audienceOptions = [
  { value: "adult", label: "Adult" },
  { value: "junior", label: "Junior" },
  { value: "oap", label: "OAP" },
  { value: "disabled", label: "Disabled" },
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

interface PricingTiersCardProps {
  venueId: string;
  mode?: "owner" | "admin";
  variant?: "card" | "embedded";
  showHeader?: boolean;
  showFooter?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  resetSignal?: number;
}

export type PricingTiersCardHandle = {
  save: () => Promise<boolean>;
};

const PricingTiersCard = forwardRef<PricingTiersCardHandle, PricingTiersCardProps>(
  (
    {
      venueId,
      mode = "owner",
      variant = "card",
      showHeader = true,
      showFooter = true,
      onDirtyChange,
      resetSignal,
    },
    ref
  ) => {
  const queryClient = useQueryClient();
  const isEmbedded = variant === "embedded";
  const [baselineRows, setBaselineRows] = useState<PricingTierRow[]>([]);
  const [rows, setRows] = useState<PricingTierRow[]>([]);
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

  const loadPricingTiers = useCallback(async () => {
    if (!venueId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("venue_pricing_tiers")
      .select("*")
      .eq("venue_id", venueId)
      .order("order_index", { ascending: true });
    if (error) {
      console.error("Failed to load pricing tiers", error);
      toast.error("Unable to load pricing tiers");
      setRows([]);
      setBaselineRows([]);
    } else {
      const mapped =
        data?.map((row) => ({
          id: row.id,
          venue_id: row.venue_id,
          label: row.label ?? "",
          price: row.price ?? "",
          unit: row.unit ?? "",
          audience: row.audience ?? "",
          order_index: row.order_index ?? 0,
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
    void loadPricingTiers();
  }, [loadPricingTiers]);

  const updateRow = (id: string, updates: Partial<PricingTierRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...updates } : row)));
    setRowErrors((prev) => ({ ...prev, [id]: "" }));
    setStatus("dirty");
  };

  const validateRow = (row: PricingTierRow) => {
    if (!row.label.trim()) {
      return "Label is required.";
    }
    if (!row.price.trim()) {
      return "Price is required.";
    }
    return "";
  };

  const buildPayload = (row: PricingTierRow) => ({
    p_venue_id: venueId,
    p_label: row.label.trim(),
    p_price: row.price.trim(),
    p_unit: row.unit.trim() || null,
    p_audience: row.audience ? row.audience : null,
    p_order_index: Math.max(row.order_index ?? 0, 0),
  });

  const handleDeleteRow = async (row: PricingTierRow) => {
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
    const confirmed = window.confirm("Delete this pricing tier?");
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
    const nextOrder = getNextOrderIndex(rows);
    const tempId = `new-${Date.now()}-${Math.round(Math.random() * 1000)}`;
    setRows((prev) => [
      ...prev,
      {
        id: tempId,
        venue_id: venueId,
        label: "",
        price: "",
        unit: "",
        audience: "",
        order_index: nextOrder,
        isNew: true,
      },
    ]);
    setStatus("dirty");
  };

  const handleMove = (rowIndex: number, direction: number) => {
    const targetIndex = rowIndex + direction;
    if (targetIndex < 0 || targetIndex >= rows.length) return;
    const current = rows[rowIndex];
    const target = rows[targetIndex];
    if (!current || !target) return;
    const swapped = [...rows];
    swapped[rowIndex] = { ...target, order_index: current.order_index };
    swapped[targetIndex] = { ...current, order_index: target.order_index };
    setRows(swapped);
    setStatus("dirty");
  };

  const mapRowFromRpc = (row: PricingTierRow) => ({
    id: row.id,
    venue_id: row.venue_id,
    label: row.label ?? "",
    price: row.price ?? "",
    unit: row.unit ?? "",
    audience: row.audience ?? "",
    order_index: row.order_index ?? 0,
    isNew: false,
  });

  const normalizeRow = (row: PricingTierRow) => ({
    label: row.label.trim(),
    price: row.price.trim(),
    unit: row.unit.trim(),
    audience: row.audience ?? "",
    order_index: Math.max(row.order_index ?? 0, 0),
  });

  const rowsEqual = (left: PricingTierRow, right: PricingTierRow) => {
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
    if (!venueId || saving) return false;
    if (!isDirty) return true;
    setSaving(true);
    setStatus("saving");
    setRowErrors({});
    clearSavedStatusTimeout();

    const baselineMap = new Map(baselineRows.map((row) => [row.id, row]));
    const draftMap = new Map(rows.map((row) => [row.id, row]));
    const deletes = baselineRows.filter((row) => !draftMap.has(row.id));
    const creates = rows.filter((row) => row.isNew || !baselineMap.has(row.id));
    const updates = rows.filter((row) => baselineMap.has(row.id) && !row.isNew && !rowsEqual(baselineMap.get(row.id)!, row));

    const operations: Array<{ type: "delete" | "create" | "update"; row: PricingTierRow }> = [
      ...deletes.map((row) => ({ type: "delete" as const, row })),
      ...creates.map((row) => ({ type: "create" as const, row })),
      ...updates.map((row) => ({ type: "update" as const, row })),
    ];

    const errors: Record<string, string> = {};
    const failedDeletes: PricingTierRow[] = [];
    let successCount = 0;
    let failureCount = 0;
    let nextRows = rows.map((row) => ({ ...row }));
    let nextBaseline = baselineRows.map((row) => ({ ...row }));

    const createRpc = mode === "admin" ? "admin_create_venue_pricing_tier" : "owner_create_venue_pricing_tier";
    const updateRpc = mode === "admin" ? "admin_update_venue_pricing_tier" : "owner_update_venue_pricing_tier";
    const deleteRpc = mode === "admin" ? "admin_delete_venue_pricing_tier" : "owner_delete_venue_pricing_tier";

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
          console.error("Failed to delete pricing tier", error);
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
          console.error("Failed to create pricing tier", error);
          errors[op.row.id] = getSupabaseErrorMessage(error, "Save failed. Please check the fields and retry.");
          failureCount += 1;
          continue;
        }
        const mapped = mapRowFromRpc(data as PricingTierRow);
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
        console.error("Failed to update pricing tier", error);
        errors[op.row.id] = getSupabaseErrorMessage(error, "Save failed. Please check the fields and retry.");
        failureCount += 1;
        continue;
      }
      const mapped = mapRowFromRpc(data as PricingTierRow);
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
      return false;
    }

    toast.success("Pricing tiers updated");
    await loadPricingTiers();
    void queryClient.invalidateQueries({ queryKey: qk.venuePricingTiers(venueId) });
    setStatus("saved");
    savedStatusTimeoutRef.current = window.setTimeout(() => {
      setStatus("clean");
    }, 1500);
    setSaving(false);
    return true;
  };

  useImperativeHandle(
    ref,
    () => ({
      save: handleSaveSection,
    }),
    [handleSaveSection]
  );

  const body = (
    <div className={cn("space-y-4", isEmbedded ? "pt-2" : "")}>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading pricing tiers…
        </div>
      ) : rows.length === 0 ? (
        <div className="space-y-3">
          <Text variant="muted" className="text-sm">
            No pricing tiers yet.
          </Text>
          <Button type="button" variant="outline" onClick={handleAddRow} disabled={saving}>
            Add a tier
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row, index) => {
            const isSaving = saving;
            const errorMessage = rowErrors[row.id];
            const canMoveUp = index > 0;
            const canMoveDown = index < rows.length - 1;
            const labelId = `pricing-label-${row.id}`;
            const priceId = `pricing-price-${row.id}`;
            const unitId = `pricing-unit-${row.id}`;
            const audienceId = `pricing-audience-${row.id}`;
            return (
              <div key={row.id} className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
                <div className="grid gap-3 lg:grid-cols-12 lg:items-end">
                  <div className="space-y-2 lg:col-span-4">
                    <label htmlFor={labelId} className="text-sm font-semibold text-foreground">Label</label>
                    <Input
                      id={labelId}
                      value={row.label}
                      onChange={(e) => updateRow(row.id, { label: e.target.value })}
                      placeholder="Day ticket"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <label htmlFor={priceId} className="text-sm font-semibold text-foreground">Price</label>
                    <Input
                      id={priceId}
                      value={row.price}
                      onChange={(e) => updateRow(row.id, { price: e.target.value })}
                      placeholder="£40"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <label htmlFor={unitId} className="text-sm font-semibold text-foreground">Unit</label>
                    <Input
                      id={unitId}
                      value={row.unit}
                      onChange={(e) => updateRow(row.id, { unit: e.target.value })}
                      placeholder="per day"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <label htmlFor={audienceId} className="text-sm font-semibold text-foreground">Audience</label>
                    <Select
                      value={row.audience || "none"}
                      onValueChange={(value) =>
                        updateRow(row.id, { audience: value === "none" ? "" : value })
                      }
                      disabled={isSaving}
                    >
                      <SelectTrigger id={audienceId}>
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not specified</SelectItem>
                        {audienceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2 lg:col-span-2 lg:items-end lg:justify-end">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleMove(index, -1)}
                        disabled={!canMoveUp || isSaving}
                      >
                        Move up
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleMove(index, 1)}
                        disabled={!canMoveDown || isSaving}
                      >
                        Move down
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => void handleDeleteRow(row)}
                      disabled={isSaving}
                      aria-label="Delete pricing tier"
                      className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {errorMessage ? <Text className="text-sm text-destructive">{errorMessage}</Text> : null}
              </div>
            );
          })}
          <Button type="button" variant="outline" onClick={handleAddRow} disabled={saving}>
            Add a tier
          </Button>
        </div>
      )}

      {showFooter ? (
        <SectionSaveFooter
          dirty={isDirty}
          saving={saving}
          justSaved={status === "saved"}
          onSave={() => void handleSaveSection()}
          saveDisabled={!isDirty}
        />
      ) : null}
    </div>
  );

  if (isEmbedded) {
    return (
      <div className="space-y-2">
        {showHeader ? (
          <>
            <Heading as="h3" size="sm" className="text-foreground">
              Pricing tiers
            </Heading>
            <Text variant="muted" className="text-sm">
              Add ticket types and prices shown on your venue page.
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
          Pricing tiers
        </Heading>
        <Text variant="muted" className="text-sm">
          Add ticket types and prices shown on your venue page.
        </Text>
      </CardHeader>
      <CardContent className="p-0 pt-4">{body}</CardContent>
    </Card>
  );
});

PricingTiersCard.displayName = "PricingTiersCard";

export default PricingTiersCard;
