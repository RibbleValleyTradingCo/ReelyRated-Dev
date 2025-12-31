import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import SectionSaveFooter from "@/components/ui/SectionSaveFooter";
import MarkdownEditor from "@/components/inputs/MarkdownEditor";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";

interface RulesCardProps {
  venueId: string;
  venueName?: string;
  mode?: "owner" | "admin";
  variant?: "card" | "embedded";
  showHeader?: boolean;
  actionsPlacement?: "footer" | "header";
}

const RulesCard = ({
  venueId,
  venueName,
  mode = "owner",
  variant = "card",
  showHeader = true,
}: RulesCardProps) => {
  const queryClient = useQueryClient();
  const isEmbedded = variant === "embedded";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rulesText, setRulesText] = useState("");
  const [baselineRulesText, setBaselineRulesText] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const savedStatusTimeoutRef = useRef<number | null>(null);

  const clearSavedStatusTimeout = useCallback(() => {
    if (savedStatusTimeoutRef.current !== null) {
      window.clearTimeout(savedStatusTimeoutRef.current);
      savedStatusTimeoutRef.current = null;
    }
  }, []);

  const loadRules = useCallback(async () => {
    if (!venueId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("venue_rules")
      .select("rules_text")
      .eq("venue_id", venueId)
      .maybeSingle();
    if (error) {
      console.error("Failed to load rules", error);
      toast.error("Unable to load rules");
    } else {
      const nextRules = data?.rules_text ?? "";
      setRulesText(nextRules);
      setBaselineRulesText(nextRules);
      setJustSaved(false);
      clearSavedStatusTimeout();
    }
    setLoading(false);
  }, [clearSavedStatusTimeout, venueId]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  useEffect(() => () => clearSavedStatusTimeout(), [clearSavedStatusTimeout]);

  const handleRulesChange = (value: string) => {
    setRulesText(value);
    if (justSaved) {
      setJustSaved(false);
    }
    clearSavedStatusTimeout();
  };

  const isDirty = rulesText !== baselineRulesText;

  const scheduleSavedStatusClear = () => {
    clearSavedStatusTimeout();
    savedStatusTimeoutRef.current = window.setTimeout(() => {
      setJustSaved(false);
    }, 1500);
  };

  const handleSave = async () => {
    if (!venueId || saving || !isDirty) return;
    setSaving(true);
    const rpcName = mode === "admin" ? "admin_update_venue_rules" : "owner_update_venue_rules";
    const { error } = await supabase.rpc(rpcName, {
      p_venue_id: venueId,
      p_rules_text: rulesText || null,
    });
    if (error) {
      console.error("Failed to update rules", error);
      toast.error("Failed to update rules");
    } else {
      toast.success("Rules updated");
      setBaselineRulesText(rulesText);
      setJustSaved(true);
      scheduleSavedStatusClear();
      void queryClient.invalidateQueries({ queryKey: qk.venueRules(venueId) });
    }
    setSaving(false);
  };

  const header = showHeader ? (
    <div className="space-y-1">
      <Heading as="h2" size="md" className="text-foreground">
        Rules
      </Heading>
      <Text variant="muted" className="text-sm">
        Help anglers understand what&apos;s allowed at your venue{venueName ? ` at ${venueName}.` : "."}
      </Text>
    </div>
  ) : null;

  const body = loading ? (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading rules…
    </div>
  ) : (
    <div className="space-y-4">
      <MarkdownEditor
        id="venueRules"
        label="Rules text"
        value={rulesText}
        onChange={handleRulesChange}
        rows={6}
        placeholder="e.g. Barbless hooks only. No lead core. No fires…"
        disabled={saving}
      />
      <SectionSaveFooter
        dirty={isDirty}
        saving={saving}
        justSaved={justSaved}
        onSave={handleSave}
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

export default RulesCard;
