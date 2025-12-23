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
}

const BookingCard = ({ venueId, initialEnabled, mode = "owner", onUpdated }: BookingCardProps) => {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

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

  return (
    <Card className="w-full border-border/70">
      <CardHeader className="space-y-1">
        <Heading as="h2" size="md" className="text-foreground">
          Bookings
        </Heading>
        <Text variant="muted" className="text-sm">
          Control whether booking calls-to-action are shown publicly.
        </Text>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <label htmlFor="bookingEnabled" className="text-sm font-semibold text-foreground">
              Bookings enabled
            </label>
            <Text variant="muted" className="text-sm">
              Disable this to hide booking CTAs when the venue is full/closed.
            </Text>
          </div>
          <Switch
            id="bookingEnabled"
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={saving}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingCard;
