import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type PricingTierRow = {
  id: string;
  venue_id: string;
  label: string;
  price: string;
  unit: string;
  order_index: number;
  isNew?: boolean;
};

const getNextOrderIndex = (rows: PricingTierRow[]) =>
  rows.length === 0 ? 0 : Math.max(...rows.map((row) => row.order_index ?? 0)) + 1;

interface PricingTiersCardProps {
  venueId: string;
  mode?: "owner" | "admin";
}

const PricingTiersCard = ({ venueId, mode = "owner" }: PricingTiersCardProps) => {
  const [rows, setRows] = useState<PricingTierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

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
    } else {
      const mapped =
        data?.map((row) => ({
          id: row.id,
          venue_id: row.venue_id,
          label: row.label ?? "",
          price: row.price ?? "",
          unit: row.unit ?? "",
          order_index: row.order_index ?? 0,
          isNew: false,
        })) ?? [];
      setRows(mapped);
      setRowErrors({});
    }
    setLoading(false);
  }, [venueId]);

  useEffect(() => {
    void loadPricingTiers();
  }, [loadPricingTiers]);

  const updateRow = (id: string, updates: Partial<PricingTierRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...updates } : row)));
    setRowErrors((prev) => ({ ...prev, [id]: "" }));
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
    p_order_index: Math.max(row.order_index ?? 0, 0),
  });

  const handleSaveRow = async (row: PricingTierRow) => {
    const errorMessage = validateRow(row);
    if (errorMessage) {
      setRowErrors((prev) => ({ ...prev, [row.id]: errorMessage }));
      return;
    }
    markSaving(row.id, true);
    const payload = buildPayload(row);
    const createRpc = mode === "admin" ? "admin_create_venue_pricing_tier" : "owner_create_venue_pricing_tier";
    const updateRpc = mode === "admin" ? "admin_update_venue_pricing_tier" : "owner_update_venue_pricing_tier";
    if (row.isNew) {
      const { error } = await supabase.rpc(createRpc, payload);
      if (error) {
        console.error("Failed to create pricing tier", error);
        toast.error("Failed to save pricing tier");
        markSaving(row.id, false);
        return;
      }
      toast.success("Pricing tier added");
    } else {
      const { error } = await supabase.rpc(updateRpc, {
        p_id: row.id,
        ...payload,
      });
      if (error) {
        console.error("Failed to update pricing tier", error);
        toast.error("Failed to save pricing tier");
        markSaving(row.id, false);
        return;
      }
      toast.success("Pricing tier updated");
    }
    await loadPricingTiers();
    markSaving(row.id, false);
  };

  const handleDeleteRow = async (row: PricingTierRow) => {
    if (row.isNew) {
      setRows((prev) => prev.filter((item) => item.id !== row.id));
      return;
    }
    const confirmed = window.confirm("Delete this pricing tier?");
    if (!confirmed) return;
    markSaving(row.id, true);
    const deleteRpc = mode === "admin" ? "admin_delete_venue_pricing_tier" : "owner_delete_venue_pricing_tier";
    const { error } = await supabase.rpc(deleteRpc, { p_id: row.id });
    if (error) {
      console.error("Failed to delete pricing tier", error);
      toast.error("Failed to delete pricing tier");
      markSaving(row.id, false);
      return;
    }
    toast.success("Pricing tier deleted");
    await loadPricingTiers();
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
        price: "",
        unit: "",
        order_index: nextOrder,
        isNew: true,
      },
    ]);
  };

  const handleMove = async (rowIndex: number, direction: number) => {
    const targetIndex = rowIndex + direction;
    if (targetIndex < 0 || targetIndex >= rows.length) return;
    const current = rows[rowIndex];
    const target = rows[targetIndex];
    if (!current || !target) return;
    if (current.isNew || target.isNew) return;

    const swapped = [...rows];
    swapped[rowIndex] = { ...current, order_index: target.order_index };
    swapped[targetIndex] = { ...target, order_index: current.order_index };
    setRows(swapped);
    markSaving(current.id, true);
    markSaving(target.id, true);

    const currentPayload = buildPayload(swapped[rowIndex]);
    const targetPayload = buildPayload(swapped[targetIndex]);
    const updateRpc = mode === "admin" ? "admin_update_venue_pricing_tier" : "owner_update_venue_pricing_tier";
    const [{ error: currentError }, { error: targetError }] = await Promise.all([
      supabase.rpc(updateRpc, { p_id: current.id, ...currentPayload }),
      supabase.rpc(updateRpc, { p_id: target.id, ...targetPayload }),
    ]);

    if (currentError || targetError) {
      console.error("Failed to reorder pricing tiers", currentError || targetError);
      toast.error("Failed to reorder pricing tiers");
      await loadPricingTiers();
    } else {
      toast.success("Pricing tiers reordered");
    }
    markSaving(current.id, false);
    markSaving(target.id, false);
  };

  return (
    <Card className="w-full border-border/70">
      <CardHeader className="space-y-1">
        <Heading as="h2" size="md" className="text-foreground">
          Pricing tiers
        </Heading>
        <Text variant="muted" className="text-sm">
          Add ticket types and prices shown on your venue page.
        </Text>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <Button type="button" variant="outline" onClick={handleAddRow}>
              Add a tier
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((row, index) => {
              const isSaving = savingIds.has(row.id);
              const errorMessage = rowErrors[row.id];
              const canMoveUp = index > 0 && !row.isNew && !rows[index - 1]?.isNew;
              const canMoveDown = index < rows.length - 1 && !row.isNew && !rows[index + 1]?.isNew;
              return (
                <div key={row.id} className="rounded-lg border border-border/60 bg-card/60 p-4 space-y-3">
                  <div className="grid gap-3 md:grid-cols-12 md:items-end">
                    <div className="space-y-2 md:col-span-4">
                      <label className="text-sm font-semibold text-foreground">Label</label>
                      <Input
                        value={row.label}
                        onChange={(e) => updateRow(row.id, { label: e.target.value })}
                        placeholder="Day ticket"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <label className="text-sm font-semibold text-foreground">Price</label>
                      <Input
                        value={row.price}
                        onChange={(e) => updateRow(row.id, { price: e.target.value })}
                        placeholder="£40"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <label className="text-sm font-semibold text-foreground">Unit</label>
                      <Input
                        value={row.unit}
                        onChange={(e) => updateRow(row.id, { unit: e.target.value })}
                        placeholder="per day"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-2 md:items-end md:justify-end">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void handleMove(index, -1)}
                          disabled={!canMoveUp || isSaving}
                        >
                          Move up
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void handleMove(index, 1)}
                          disabled={!canMoveDown || isSaving}
                        >
                          Move down
                        </Button>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => void handleSaveRow(row)} disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
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
              Add a tier
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PricingTiersCard;
