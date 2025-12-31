import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import { toast } from "sonner";

interface BookingCardProps {
  venueId: string;
  initialEnabled: boolean;
  mode?: "owner" | "admin";
  onUpdated?: (value: boolean) => void;
  variant?: "card" | "embedded";
  showHeader?: boolean;
}

const BookingCard = ({
  venueId,
  initialEnabled,
  mode = "owner",
  onUpdated,
  variant = "card",
  showHeader = true,
}: BookingCardProps) => {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const isEmbedded = variant === "embedded";

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  const handleToggle = async (nextValue: boolean) => {
    if (!venueId || saving) return;
    const previous = enabled;
    setEnabled(nextValue);
    setSaving(true);
    const rpcName = mode === "admin" ? "admin_update_venue_booking" : "owner_update_venue_booking";
    const { error } = await supabase.rpc(rpcName, {
      p_venue_id: venueId,
      p_booking_enabled: nextValue,
    });
    if (error) {
      console.error("Failed to update booking toggle", error);
      toast.error("Failed to update booking status");
      setEnabled(previous);
    } else {
      toast.success("Booking status updated");
      onUpdated?.(nextValue);
    }
    setSaving(false);
  };

  const body = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <label htmlFor="bookingEnabled" className="text-sm font-semibold text-foreground">
          Bookings enabled
        </label>
        <Text variant="muted" className="text-sm">
          Disable this to hide booking CTAs when the venue is full/closed.
        </Text>
      </div>
      <Switch id="bookingEnabled" checked={enabled} onCheckedChange={handleToggle} disabled={saving} />
    </div>
  );

  if (isEmbedded) {
    return (
      <div className="space-y-2">
        {showHeader ? (
          <>
            <Heading as="h3" size="sm" className="text-foreground">
              Bookings
            </Heading>
            <Text variant="muted" className="text-sm">
              Control whether booking calls-to-action are shown publicly.
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
          Bookings
        </Heading>
        <Text variant="muted" className="text-sm">
          Control whether booking calls-to-action are shown publicly.
        </Text>
      </CardHeader>
      <CardContent className="p-0 pt-4">{body}</CardContent>
    </Card>
  );
};

export default BookingCard;
