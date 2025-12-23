import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MarkdownEditor from "@/components/inputs/MarkdownEditor";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RulesCardProps {
  venueId: string;
  venueName?: string;
  mode?: "owner" | "admin";
}

const RulesCard = ({ venueId, venueName, mode = "owner" }: RulesCardProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rulesText, setRulesText] = useState("");

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
      setRulesText(data?.rules_text ?? "");
    }
    setLoading(false);
  }, [venueId]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const handleSave = async () => {
    if (!venueId || saving) return;
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
    }
    setSaving(false);
  };

  const handleClear = () => setRulesText("");

  return (
    <Card className="w-full border-border/70">
      <CardHeader className="space-y-1">
        <Heading as="h2" size="md" className="text-foreground">
          Rules
        </Heading>
        <Text variant="muted" className="text-sm">
          Help anglers understand what&apos;s allowed at your venue{venueName ? ` at ${venueName}.` : "."}
        </Text>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading rules…
          </div>
        ) : (
          <>
            <MarkdownEditor
              id="venueRules"
              label="Rules text"
              value={rulesText}
              onChange={setRulesText}
              rows={6}
              placeholder="e.g. Barbless hooks only. No lead core. No fires…"
              disabled={saving}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:items-center">
              <Button type="button" variant="outline" onClick={handleClear} disabled={saving}>
                Clear
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save rules"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RulesCard;
