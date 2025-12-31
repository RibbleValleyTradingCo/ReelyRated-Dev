import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useBeforeUnload, useBlocker, useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import MarkdownEditor from "@/components/inputs/MarkdownEditor";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Activity,
  Camera,
  Car,
  Coffee,
  Loader2,
  ParkingCircle,
  Shield,
  ShieldCheck,
  ShowerHead,
  Store,
  Tent,
  Toilet,
  Users,
  Utensils,
  Waves,
  Wrench,
  Fish,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdminUser } from "@/lib/admin";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import SectionHeader from "@/components/layout/SectionHeader";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import Eyebrow from "@/components/typography/Eyebrow";
import AutoSaveChip from "@/components/ui/AutoSaveChip";
import SectionSaveFooter from "@/components/ui/SectionSaveFooter";
import BookingCard from "@/pages/venue-owner-admin/components/BookingCard";
import OpeningHoursCard from "@/pages/venue-owner-admin/components/OpeningHoursCard";
import PricingTiersCard, { PricingTiersCardHandle } from "@/pages/venue-owner-admin/components/PricingTiersCard";
import RulesCard from "@/pages/my-venues/components/RulesCard";
import SpeciesStockCard from "@/pages/venue-owner-admin/components/SpeciesStockCard";
import VenuePhotosCard from "@/pages/venue-owner-admin/components/VenuePhotosCard";
import { qk } from "@/lib/queryKeys";
import UnsavedChangesDialog from "@/components/ui/unsaved-changes-dialog";

type Venue = {
  id: string;
  slug: string;
  name: string;
  location: string | null;
  description: string | null;
  short_tagline: string | null;
  ticket_type: string | null;
  price_from: string | null;
  facilities: string[] | null;
  website_url: string | null;
  booking_url: string | null;
  contact_phone: string | null;
  notes_for_rr_team: string | null;
  booking_enabled?: boolean | null;
  payment_methods: string[] | null;
  payment_notes: string | null;
};

type VenueEvent = {
  id: string;
  venue_id: string;
  title: string;
  event_type: string | null;
  starts_at: string;
  ends_at: string | null;
  description: string | null;
  ticket_info: string | null;
  website_url: string | null;
  booking_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

type MetadataStatus = "clean" | "dirty" | "saving" | "saved" | "error";

type MetadataSnapshot = {
  short_tagline: string;
  description: string;
  ticket_type: string;
  price_from: string;
  facilities: string[];
  website_url: string;
  booking_url: string;
  contact_phone: string;
  notes_for_rr_team: string;
  payment_methods: string[];
  payment_notes: string;
};

const defaultEventForm = {
  id: "" as string | "",
  title: "",
  event_type: "",
  starts_at: "",
  ends_at: "",
  description: "",
  ticket_info: "",
  website_url: "",
  booking_url: "",
  is_published: false,
};

const toDateTimeLocalInput = (value?: string | null) => {
  if (!value) return "";
  const match = value.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  if (match) return match[1];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIdSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const AdminVenueEdit = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [adminStatus, setAdminStatus] = useState<"checking" | "authorized" | "unauthorized">("checking");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [form, setForm] = useState({
    short_tagline: "",
    description: "",
    ticket_type: "",
    price_from: "",
    facilities: "",
    website_url: "",
    booking_url: "",
    contact_phone: "",
    notes_for_rr_team: "",
    payment_methods: [] as string[],
    payment_notes: "",
  });
  const [events, setEvents] = useState<VenueEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventForm, setEventForm] = useState(defaultEventForm);
  const [eventBaseline, setEventBaseline] = useState(defaultEventForm);
  const [eventJustSaved, setEventJustSaved] = useState(false);
  const eventSavedTimeoutRef = useRef<number | null>(null);
  const [eventSaving, setEventSaving] = useState(false);
  const [metadataBaseline, setMetadataBaseline] = useState<MetadataSnapshot | null>(null);
  const [metadataStatus, setMetadataStatus] = useState<MetadataStatus>("clean");
  const [rowSectionDirty, setRowSectionDirty] = useState({
    species: false,
    pricing: false,
    openingHours: false,
  });
  const [rowSectionResetSignal, setRowSectionResetSignal] = useState(0);
  const [accordionValue, setAccordionValue] = useState<string[]>(["species"]);
  const savedStatusTimeoutRef = useRef<number | null>(null);
  const [pricingSectionSaving, setPricingSectionSaving] = useState(false);
  const [pricingSectionJustSaved, setPricingSectionJustSaved] = useState(false);
  const pricingSavedTimeoutRef = useRef<number | null>(null);
  const pricingTiersRef = useRef<PricingTiersCardHandle | null>(null);
  const [pendingAction, setPendingAction] = useState<"navigation" | "accordion" | null>(null);
  const [pendingAccordionValue, setPendingAccordionValue] = useState<string[] | null>(null);
  const [owners, setOwners] = useState<{ user_id: string; username: string | null; role: string }[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [ownerInput, setOwnerInput] = useState("");
  const [ownerSaving, setOwnerSaving] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<VenueEvent | null>(null);
  const [eventDeleteLoading, setEventDeleteLoading] = useState(false);
  const [ownerToRemove, setOwnerToRemove] = useState<{ userId: string; label: string } | null>(null);
  const [ownerRemoveLoading, setOwnerRemoveLoading] = useState(false);
  const idPrefix = useId();
  const ids = useMemo(
    () => ({
      facilities: `${idPrefix}-facilities`,
      ticketType: `${idPrefix}-ticket-type`,
      priceFrom: `${idPrefix}-price-from`,
      paymentNotes: `${idPrefix}-payment-notes`,
      shortTagline: `${idPrefix}-short-tagline`,
      websiteUrl: `${idPrefix}-website-url`,
      bookingUrl: `${idPrefix}-booking-url`,
      contactPhone: `${idPrefix}-contact-phone`,
      internalNotes: `${idPrefix}-internal-notes`,
      eventTitle: `${idPrefix}-event-title`,
      eventType: `${idPrefix}-event-type`,
      eventStarts: `${idPrefix}-event-starts`,
      eventEnds: `${idPrefix}-event-ends`,
      eventTicketInfo: `${idPrefix}-event-ticket-info`,
      eventWebsiteUrl: `${idPrefix}-event-website-url`,
      eventBookingUrl: `${idPrefix}-event-booking-url`,
      eventDescription: `${idPrefix}-event-description`,
      eventPublished: `${idPrefix}-event-published`,
      ownerInput: `${idPrefix}-owner-input`,
    }),
    [idPrefix]
  );
  const idPrefixes = useMemo(
    () => ({
      payment: `${idPrefix}-payment`,
      facility: `${idPrefix}-facility`,
      customFacility: `${idPrefix}-custom-facility`,
    }),
    [idPrefix]
  );

  const parseCsv = (value: string | undefined | null) =>
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const normalizeText = (value: string) => value.trim();

  const normalizeList = (value: string[] | null | undefined) =>
    (value ?? []).map((item) => item.trim()).filter(Boolean);

  const buildMetadataSnapshotFromForm = (nextForm: typeof form): MetadataSnapshot => ({
    short_tagline: nextForm.short_tagline,
    description: nextForm.description,
    ticket_type: nextForm.ticket_type,
    price_from: nextForm.price_from,
    facilities: normalizeList(parseCsv(nextForm.facilities)),
    website_url: nextForm.website_url,
    booking_url: nextForm.booking_url,
    contact_phone: nextForm.contact_phone,
    notes_for_rr_team: nextForm.notes_for_rr_team,
    payment_methods: nextForm.payment_methods,
    payment_notes: nextForm.payment_notes,
  });

  const buildMetadataSnapshotFromVenue = (row: Venue | null): MetadataSnapshot => ({
    short_tagline: row?.short_tagline ?? "",
    description: row?.description ?? "",
    ticket_type: row?.ticket_type ?? "",
    price_from: row?.price_from ?? "",
    facilities: normalizeList(row?.facilities),
    website_url: row?.website_url ?? "",
    booking_url: row?.booking_url ?? "",
    contact_phone: row?.contact_phone ?? "",
    notes_for_rr_team: row?.notes_for_rr_team ?? "",
    payment_methods: row?.payment_methods ?? [],
    payment_notes: row?.payment_notes ?? "",
  });

  const applyMetadataSnapshotToForm = useCallback((snapshot: MetadataSnapshot) => {
    setForm({
      short_tagline: snapshot.short_tagline,
      description: snapshot.description,
      ticket_type: snapshot.ticket_type,
      price_from: snapshot.price_from,
      facilities: snapshot.facilities.join(", "),
      website_url: snapshot.website_url,
      booking_url: snapshot.booking_url,
      contact_phone: snapshot.contact_phone,
      notes_for_rr_team: snapshot.notes_for_rr_team,
      payment_methods: snapshot.payment_methods,
      payment_notes: snapshot.payment_notes,
    });
  }, []);

  const normalizeMetadata = (snapshot: MetadataSnapshot) => ({
    short_tagline: normalizeText(snapshot.short_tagline),
    description: normalizeText(snapshot.description),
    ticket_type: normalizeText(snapshot.ticket_type),
    price_from: normalizeText(snapshot.price_from),
    facilities: normalizeList(snapshot.facilities).sort(),
    website_url: normalizeText(snapshot.website_url),
    booking_url: normalizeText(snapshot.booking_url),
    contact_phone: normalizeText(snapshot.contact_phone),
    notes_for_rr_team: normalizeText(snapshot.notes_for_rr_team),
    payment_methods: normalizeList(snapshot.payment_methods).sort(),
    payment_notes: normalizeText(snapshot.payment_notes),
  });

  const arraysEqual = (left: string[], right: string[]) =>
    left.length === right.length && left.every((value, index) => value === right[index]);

  const metadataDraftSnapshot = useMemo(
    () => buildMetadataSnapshotFromForm(form),
    [form]
  );

  const isMetadataDirty = useMemo(() => {
    if (!metadataBaseline) return false;
    const normalizedDraft = normalizeMetadata(metadataDraftSnapshot);
    const normalizedBaseline = normalizeMetadata(metadataBaseline);
    return JSON.stringify(normalizedDraft) !== JSON.stringify(normalizedBaseline);
  }, [metadataBaseline, metadataDraftSnapshot]);

  const handleRowSectionDirtyChange = useCallback(
    (section: "species" | "pricing" | "openingHours", dirty: boolean) => {
      setRowSectionDirty((prev) => {
        if (prev[section] === dirty) return prev;
        return { ...prev, [section]: dirty };
      });
    },
    []
  );

  const isEventDirty = useMemo(
    () =>
      eventForm.id !== eventBaseline.id ||
      eventForm.title !== eventBaseline.title ||
      eventForm.event_type !== eventBaseline.event_type ||
      eventForm.starts_at !== eventBaseline.starts_at ||
      eventForm.ends_at !== eventBaseline.ends_at ||
      eventForm.description !== eventBaseline.description ||
      eventForm.ticket_info !== eventBaseline.ticket_info ||
      eventForm.website_url !== eventBaseline.website_url ||
      eventForm.booking_url !== eventBaseline.booking_url ||
      eventForm.is_published !== eventBaseline.is_published,
    [eventBaseline, eventForm]
  );

  const isAnyRowSectionDirty =
    rowSectionDirty.species || rowSectionDirty.pricing || rowSectionDirty.openingHours;
  const isAnyDirty = isMetadataDirty || isAnyRowSectionDirty;
  const pricingSectionDirty = isMetadataDirty || rowSectionDirty.pricing;

  const clearSavedStatusTimeout = useCallback(() => {
    if (savedStatusTimeoutRef.current !== null) {
      window.clearTimeout(savedStatusTimeoutRef.current);
      savedStatusTimeoutRef.current = null;
    }
  }, []);

  const clearPricingSavedStatus = useCallback(() => {
    if (pricingSavedTimeoutRef.current !== null) {
      window.clearTimeout(pricingSavedTimeoutRef.current);
      pricingSavedTimeoutRef.current = null;
    }
  }, []);

  const clearEventSavedStatus = useCallback(() => {
    if (eventSavedTimeoutRef.current !== null) {
      window.clearTimeout(eventSavedTimeoutRef.current);
      eventSavedTimeoutRef.current = null;
    }
  }, []);

  const scheduleSavedStatusClear = () => {
    clearSavedStatusTimeout();
    savedStatusTimeoutRef.current = window.setTimeout(() => {
      setMetadataStatus("clean");
    }, 1500);
  };

  const schedulePricingSavedClear = () => {
    clearPricingSavedStatus();
    pricingSavedTimeoutRef.current = window.setTimeout(() => {
      setPricingSectionJustSaved(false);
    }, 1500);
  };

  const scheduleEventSavedClear = () => {
    clearEventSavedStatus();
    eventSavedTimeoutRef.current = window.setTimeout(() => {
      setEventJustSaved(false);
    }, 1500);
  };

  useEffect(
    () => () => {
      clearSavedStatusTimeout();
      clearPricingSavedStatus();
      clearEventSavedStatus();
    },
    [clearSavedStatusTimeout, clearPricingSavedStatus, clearEventSavedStatus]
  );

  useEffect(() => {
    if (!metadataBaseline) return;
    if (metadataStatus === "saving") return;
    if (isMetadataDirty) {
      if (metadataStatus !== "dirty" && metadataStatus !== "error") {
        setMetadataStatus("dirty");
      }
      return;
    }
    if (metadataStatus === "saved") return;
    if (metadataStatus !== "clean") {
      setMetadataStatus("clean");
    }
  }, [isMetadataDirty, metadataBaseline, metadataStatus]);

  useEffect(() => {
    if (!pricingSectionDirty) return;
    if (!pricingSectionJustSaved) return;
    setPricingSectionJustSaved(false);
    clearPricingSavedStatus();
  }, [clearPricingSavedStatus, pricingSectionDirty, pricingSectionJustSaved]);

  useEffect(() => {
    if (!isEventDirty) return;
    if (!eventJustSaved) return;
    setEventJustSaved(false);
    clearEventSavedStatus();
  }, [clearEventSavedStatus, eventJustSaved, isEventDirty]);

  const resetMetadataDraftToBaseline = useCallback(() => {
    if (!metadataBaseline) return;
    applyMetadataSnapshotToForm(metadataBaseline);
    setMetadataStatus("clean");
    clearSavedStatusTimeout();
  }, [applyMetadataSnapshotToForm, clearSavedStatusTimeout, metadataBaseline]);

  const hydrateVenueState = (row: Venue | null) => {
    setVenue(row);
    const snapshot = buildMetadataSnapshotFromVenue(row);
    setMetadataBaseline(row ? snapshot : null);
    applyMetadataSnapshotToForm(snapshot);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      if (authLoading) return;
      setAdminStatus("checking");
      if (!user) {
        setAdminStatus("unauthorized");
        toast.error("You must be an admin to view this page.");
        navigate("/");
        return;
      }
      const isAdmin = await isAdminUser(user.id);
      if (!isAdmin) {
        setAdminStatus("unauthorized");
        toast.error("You must be an admin to view this page.");
        navigate("/");
      } else {
        setAdminStatus("authorized");
      }
    };
    void checkAdmin();
  }, [authLoading, navigate, user]);

  useEffect(() => {
    const loadVenue = async () => {
      if (!slug || adminStatus !== "authorized") return;
      setLoading(true);
      const { data, error } = await supabase.rpc("admin_get_venue_by_slug", { p_slug: slug });
      if (error) {
        console.error("Failed to load venue", error);
        toast.error("Failed to load venue");
        setVenue(null);
        setLoading(false);
        return;
      }
      const row = (data as Venue[] | null)?.[0] ?? null;
      hydrateVenueState(row);
      setMetadataStatus("clean");
      clearSavedStatusTimeout();
      setLoading(false);
    };
    void loadVenue();
  }, [adminStatus, clearSavedStatusTimeout, slug]);

  const blocker = useBlocker(isAnyDirty);
  const discardDialogOpen = pendingAction !== null;

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    setPendingAction("navigation");
    setPendingAccordionValue(null);
  }, [blocker.state]);

  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (!isAnyDirty) return;
        event.preventDefault();
        event.returnValue = "";
      },
      [isAnyDirty]
    )
  );

  const handleAccordionChange = (nextValue: string[]) => {
    if (arraysEqual(nextValue, accordionValue)) return;
    if (!isAnyDirty) {
      setAccordionValue(nextValue);
      return;
    }
    setPendingAction("accordion");
    setPendingAccordionValue(nextValue);
  };

  const handleDiscard = () => {
    resetMetadataDraftToBaseline();
    setRowSectionResetSignal((prev) => prev + 1);
    setRowSectionDirty({ species: false, pricing: false, openingHours: false });
    setPricingSectionJustSaved(false);
    clearPricingSavedStatus();
    if (pendingAction === "accordion" && pendingAccordionValue) {
      setAccordionValue(pendingAccordionValue);
    }
    setPendingAction(null);
    setPendingAccordionValue(null);
    if (blocker.state === "blocked") {
      blocker.proceed();
    }
  };

  const handleStay = () => {
    setPendingAction(null);
    setPendingAccordionValue(null);
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  };

  const handleDiscardDialogOpenChange = (open: boolean) => {
    if (!open) {
      handleStay();
      return;
    }
  };

  useEffect(() => {
    const loadEvents = async () => {
      if (!venue?.id) return;
      setEventsLoading(true);
      const { data, error } = await supabase.rpc("admin_get_venue_events", {
        p_venue_id: venue.id,
      });
      if (error) {
        console.error("Failed to load events", error);
        toast.error("Failed to load events");
        setEvents([]);
      } else {
        setEvents((data as VenueEvent[]) ?? []);
      }
      setEventsLoading(false);
    };
    void loadEvents();
  }, [venue?.id]);

  useEffect(() => {
    const loadOwners = async () => {
      if (!venue?.id) return;
      setOwnersLoading(true);
      const { data, error } = await supabase
        .from("venue_owners")
        .select("user_id, role, profiles:user_id (username)")
        .eq("venue_id", venue.id);
      if (error) {
        console.error("Failed to load owners", error);
        toast.error("Failed to load venue owners");
        setOwners([]);
      } else {
        type OwnerRow = {
          user_id: string;
          role: string | null;
          profiles: { username: string | null } | null;
        };
        const rows = (data ?? []) as unknown as OwnerRow[];
        setOwners(
          rows.map((row) => ({
            user_id: row.user_id,
            username: row.profiles?.username ?? null,
            role: row.role ?? "owner",
          }))
        );
      }
      setOwnersLoading(false);
    };
    void loadOwners();
  }, [venue?.id]);

  const paymentOptions = [
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "bank_transfer", label: "Bank transfer" },
    { value: "online", label: "Online payment" },
  ];

  const facilityGroups = [
    {
      title: "Logistics",
      options: [
        { value: "Secure parking", label: "Secure parking", icon: ParkingCircle },
        { value: "Parking", label: "Parking", icon: ParkingCircle },
        { value: "Barrow access", label: "Barrow access", icon: Car },
      ],
    },
    {
      title: "Fishing services",
      options: [
        { value: "Bait shop", label: "Bait shop", icon: Store },
        { value: "Equipment hire", label: "Equipment hire", icon: Wrench },
        { value: "Tackle shop", label: "Tackle shop", icon: Store },
      ],
    },
    {
      title: "Amenities",
      options: [
        { value: "Toilets", label: "Toilets", icon: Toilet },
        { value: "Showers", label: "Showers", icon: ShowerHead },
        { value: "Cafe", label: "Cafe", icon: Coffee },
        { value: "Food on site", label: "Food on site", icon: Utensils },
        { value: "Charging points", label: "Charging points", icon: Activity },
        { value: "Drinking water", label: "Drinking water", icon: Waves },
        { value: "Wi-Fi", label: "Wi-Fi", icon: Activity },
        { value: "Accommodation", label: "Accommodation", icon: Tent },
      ],
    },
    {
      title: "Safety & welfare",
      options: [
        { value: "Nets/Mats provided", label: "Nets/Mats provided", icon: Fish },
        { value: "First aid / Defibrillator", label: "First aid / Defibrillator", icon: ShieldCheck },
        { value: "CCTV", label: "CCTV", icon: Camera },
      ],
    },
    {
      title: "Accessibility & inclusion",
      options: [
        { value: "Disabled pegs", label: "Disabled pegs", icon: ShieldCheck },
        { value: "Family friendly", label: "Family friendly", icon: Users },
      ],
    },
  ];

  const togglePaymentMethod = (value: string, checked: boolean) => {
    setForm((prev) => {
      const next = new Set(prev.payment_methods);
      if (checked) {
        next.add(value);
      } else {
        next.delete(value);
      }
      return { ...prev, payment_methods: Array.from(next) };
    });
  };

  const facilityOptions = facilityGroups.flatMap((group) => group.options);
  const knownFacilityValues = new Set(facilityOptions.map((option) => option.value));
  const selectedFacilities = new Set(parseCsv(form.facilities));
  const customFacilities = Array.from(selectedFacilities).filter(
    (value) => !knownFacilityValues.has(value)
  );
  const toggleFacility = (value: string, checked: boolean) => {
    setForm((prev) => {
      const next = new Set(parseCsv(prev.facilities));
      if (checked) {
        next.add(value);
      } else {
        next.delete(value);
      }
      return { ...prev, facilities: Array.from(next).join(", ") };
    });
  };

  const buildMetadataPayload = () => ({
    p_short_tagline: form.short_tagline || null,
    p_description: form.description || null,
    p_ticket_type: form.ticket_type || null,
    p_price_from: form.price_from || null,
    p_best_for_tags: [],
    p_facilities: parseCsv(form.facilities),
    p_website_url: form.website_url || null,
    p_booking_url: form.booking_url || null,
    p_contact_phone: form.contact_phone || null,
    p_notes_for_rr_team: form.notes_for_rr_team || null,
    p_payment_methods: form.payment_methods,
    p_payment_notes: form.payment_notes || null,
  });

  const saveMetadataGroup = async () => {
    if (!venue?.id) return false;
    if (!isMetadataDirty) return true;
    if (saving) return false;
    clearSavedStatusTimeout();
    setSaving(true);
    setMetadataStatus("saving");
    try {
      const { data, error } = await supabase.rpc("admin_update_venue_metadata", {
        p_venue_id: venue.id,
        ...buildMetadataPayload(),
      });
      if (error) {
        console.error("Failed to update venue", error);
        toast.error("Failed to save changes");
        setMetadataStatus("error");
        return false;
      }
      toast.success("Venue updated");
      console.log("Admin updated venue metadata, returned:", data);
      if (slug) {
        const { data: refreshed, error: refreshError } = await supabase.rpc("admin_get_venue_by_slug", { p_slug: slug });
        if (refreshError) {
          console.error("Failed to refresh venue", refreshError);
          toast.info("Saved, but refresh failed — changes still marked unsaved. Please reload.");
          setMetadataStatus("error");
          void queryClient.invalidateQueries({ queryKey: qk.venueBySlug(slug) });
          return false;
        } else {
          const row = (refreshed as Venue[] | null)?.[0] ?? null;
          if (!row) {
            console.error("No venue returned from admin_get_venue_by_slug");
            toast.info("Saved, but refresh failed — changes still marked unsaved. Please reload.");
            setMetadataStatus("error");
            void queryClient.invalidateQueries({ queryKey: qk.venueBySlug(slug) });
            return false;
          } else {
            hydrateVenueState(row);
          }
        }
        void queryClient.invalidateQueries({ queryKey: qk.venueBySlug(slug) });
      } else {
        toast.info("Saved, but refresh failed — changes still marked unsaved. Please reload.");
        setMetadataStatus("error");
        return false;
      }
      setMetadataStatus("saved");
      scheduleSavedStatusClear();
      return true;
    } finally {
      setSaving(false);
    }
  };

  const savePricingAndMetadata = async () => {
    if (pricingSectionSaving) return;
    if (!pricingSectionDirty) return;
    setPricingSectionSaving(true);
    clearPricingSavedStatus();
    try {
      let metadataOk = true;
      if (isMetadataDirty) {
        metadataOk = await saveMetadataGroup();
      }

      let tiersOk = true;
      if (metadataOk && rowSectionDirty.pricing) {
        const handle = pricingTiersRef.current;
        tiersOk = handle ? await handle.save() : false;
      } else if (rowSectionDirty.pricing) {
        tiersOk = false;
      }

      if (metadataOk && tiersOk) {
        setPricingSectionJustSaved(true);
        schedulePricingSavedClear();
      }
    } finally {
      setPricingSectionSaving(false);
    }
  };

  const resetEventForm = () => {
    setEventForm(defaultEventForm);
    setEventBaseline(defaultEventForm);
    clearEventSavedStatus();
    setEventJustSaved(false);
  };

  const resolveOwnerUser = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username")
      .or(`id.eq.${trimmed},username.eq.${trimmed}`)
      .maybeSingle();
    if (error || !data) {
      return null;
    }
    return data.id as string;
  };

  const handleAddOwner = async () => {
    if (!venue?.id) return;
    const userId = await resolveOwnerUser(ownerInput);
    if (!userId) {
      toast.error("User not found. Enter a valid username or user ID.");
      return;
    }
    setOwnerSaving(true);
    const { error } = await supabase.rpc("admin_add_venue_owner", {
      p_venue_id: venue.id,
      p_user_id: userId,
      p_role: "owner",
    });
    if (error) {
      console.error("Failed to add owner", error);
      toast.error("Unable to add owner");
    } else {
      toast.success("Owner added");
      setOwnerInput("");
      const { data } = await supabase
        .from("venue_owners")
        .select("user_id, role, profiles:user_id (username)")
        .eq("venue_id", venue.id);
      type OwnerRow = {
        user_id: string;
        role: string | null;
        profiles: { username: string | null } | null;
      };
      const rows = (data ?? []) as unknown as OwnerRow[];
      setOwners(
        rows.map((row) => ({
          user_id: row.user_id,
          username: row.profiles?.username ?? null,
          role: row.role ?? "owner",
        }))
      );
    }
    setOwnerSaving(false);
  };

  const handleConfirmRemoveOwner = async () => {
    if (!venue?.id || !ownerToRemove?.userId || ownerRemoveLoading) return;
    setOwnerRemoveLoading(true);
    const { error } = await supabase.rpc("admin_remove_venue_owner", {
      p_venue_id: venue.id,
      p_user_id: ownerToRemove.userId,
    });
    if (error) {
      console.error("Failed to remove owner", error);
      toast.error("Unable to remove owner");
      setOwnerRemoveLoading(false);
      return;
    }
    toast.success("Owner removed");
    setOwners((prev) => prev.filter((o) => o.user_id !== ownerToRemove.userId));
    setOwnerRemoveLoading(false);
    setOwnerToRemove(null);
  };

  const handleEditEvent = (event?: VenueEvent) => {
    if (!event) {
      resetEventForm();
      return;
    }
    const nextForm = {
      id: event.id,
      title: event.title,
      event_type: event.event_type ?? "",
      starts_at: toDateTimeLocalInput(event.starts_at),
      ends_at: toDateTimeLocalInput(event.ends_at),
      description: event.description ?? "",
      ticket_info: event.ticket_info ?? "",
      website_url: event.website_url ?? "",
      booking_url: event.booking_url ?? "",
      is_published: event.is_published,
    };
    setEventForm(nextForm);
    setEventBaseline(nextForm);
    clearEventSavedStatus();
    setEventJustSaved(false);
  };

  const handleSaveEvent = async () => {
    if (!venue?.id) return;
    if (!eventForm.title || !eventForm.starts_at) {
      toast.error("Title and start date/time are required");
      return;
    }
    setEventSaving(true);
    try {
      if (eventForm.id) {
        const { error } = await supabase.rpc("admin_update_venue_event", {
          p_event_id: eventForm.id,
          p_venue_id: venue.id,
          p_title: eventForm.title,
          p_event_type: eventForm.event_type || null,
          p_starts_at: eventForm.starts_at,
          p_ends_at: eventForm.ends_at || null,
          p_description: eventForm.description || null,
          p_ticket_info: eventForm.ticket_info || null,
          p_website_url: eventForm.website_url || null,
          p_booking_url: eventForm.booking_url || null,
          p_is_published: eventForm.is_published,
        });
        if (error) {
          console.error("Failed to update event", error);
          toast.error("Failed to update event");
          return;
        }
        toast.success("Event updated");
      } else {
        const { error } = await supabase.rpc("admin_create_venue_event", {
          p_venue_id: venue.id,
          p_title: eventForm.title,
          p_event_type: eventForm.event_type || null,
          p_starts_at: eventForm.starts_at,
          p_ends_at: eventForm.ends_at || null,
          p_description: eventForm.description || null,
          p_ticket_info: eventForm.ticket_info || null,
          p_website_url: eventForm.website_url || null,
          p_booking_url: eventForm.booking_url || null,
          p_is_published: eventForm.is_published,
        });
        if (error) {
          console.error("Failed to create event", error);
          toast.error("Failed to create event");
          return;
        }
        toast.success("Event created");
      }
      const { data: refreshed, error: refreshError } = await supabase.rpc("admin_get_venue_events", {
        p_venue_id: venue.id,
      });
      if (!refreshError) {
        setEvents((refreshed as VenueEvent[]) ?? []);
      }
      resetEventForm();
      setEventJustSaved(true);
      scheduleEventSavedClear();
      if (venue?.id) {
        void queryClient.invalidateQueries({ queryKey: qk.venuePastEvents(venue.id) });
        void queryClient.invalidateQueries({ queryKey: qk.venueUpcomingEvents(venue.id) });
      }
    } finally {
      setEventSaving(false);
    }
  };

  const classifyEventStatus = (event: VenueEvent) => {
    if (!event.is_published) return "draft";
    const now = new Date();
    const starts = new Date(event.starts_at);
    return starts >= now ? "upcoming" : "past";
  };

  const handleConfirmDeleteEvent = async () => {
    if (!eventToDelete?.id || eventDeleteLoading) return;
    setEventDeleteLoading(true);
    const { error } = await supabase.rpc("admin_delete_venue_event", { p_event_id: eventToDelete.id });
    if (error) {
      console.error("Failed to delete event", error);
      toast.error("Failed to delete event");
      setEventDeleteLoading(false);
      return;
    }
    toast.success("Event deleted");
    if (venue?.id) {
      const { data: refreshed } = await supabase.rpc("admin_get_venue_events", { p_venue_id: venue.id });
      setEvents((refreshed as VenueEvent[]) ?? []);
      void queryClient.invalidateQueries({ queryKey: qk.venuePastEvents(venue.id) });
      void queryClient.invalidateQueries({ queryKey: qk.venueUpcomingEvents(venue.id) });
    }
    if (eventForm.id === eventToDelete.id) {
      resetEventForm();
    }
    setEventDeleteLoading(false);
    setEventToDelete(null);
  };

  const metadataJustSaved = metadataStatus === "saved";
  const eventDeleteLabel = eventToDelete?.title ?? "this event";
  const ownerRemoveLabel = ownerToRemove?.label ?? "this owner";

  const renderSectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="space-y-1 border-b border-border pb-4">
      <Heading as="h3" size="sm" className="text-foreground">
        {title}
      </Heading>
      <Text className="text-sm text-muted-foreground">{subtitle}</Text>
    </div>
  );

  if (adminStatus === "checking") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <PageContainer className="flex items-center justify-center px-4 sm:px-6 py-16 overflow-x-hidden">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-muted-foreground" />
          <Text variant="muted">Checking admin access…</Text>
        </PageContainer>
      </div>
    );
  }

  if (adminStatus === "unauthorized") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <PageContainer className="px-4 sm:px-6 py-12 overflow-x-hidden">
          <Card className="border border-border bg-card shadow-card w-full">
            <CardHeader>
              <Heading as="h2" size="md" className="text-foreground">
                Access denied
              </Heading>
            </CardHeader>
            <CardContent className="space-y-3">
              <Text variant="muted" className="text-sm">
                You don&apos;t have permission to view this page.
              </Text>
              <Button asChild variant="outline">
                <Link to="/">Back to home</Link>
              </Button>
            </CardContent>
          </Card>
        </PageContainer>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <PageContainer className="flex items-center justify-center px-4 sm:px-6 py-16 overflow-x-hidden">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-muted-foreground" />
          <Text variant="muted">Loading venue…</Text>
        </PageContainer>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <PageContainer className="px-4 sm:px-6 py-12 overflow-x-hidden">
          <Card className="border border-border bg-card shadow-card w-full">
            <CardHeader>
              <Heading as="h2" size="md" className="text-foreground">
                Venue not found
              </Heading>
            </CardHeader>
            <CardContent className="space-y-3">
              <Text variant="muted" className="text-sm">
                This venue doesn&apos;t exist or isn&apos;t published.
              </Text>
              <Button asChild variant="outline">
                <Link to="/admin/venues">Back to admin venues</Link>
              </Button>
            </CardContent>
          </Card>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <PageContainer className="w-full px-4 sm:px-6 md:mx-auto md:max-w-6xl pt-8 pb-24 md:pt-10 md:pb-24 overflow-x-hidden">
        <UnsavedChangesDialog
          open={discardDialogOpen}
          onOpenChange={handleDiscardDialogOpenChange}
          onStay={handleStay}
          onDiscard={handleDiscard}
        />
        <AlertDialog
          open={Boolean(eventToDelete)}
          onOpenChange={(open) => {
            if (!open && !eventDeleteLoading) {
              setEventToDelete(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete event?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {eventDeleteLabel}. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={eventDeleteLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={eventDeleteLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={(event) => {
                  event.preventDefault();
                  void handleConfirmDeleteEvent();
                }}
              >
                {eventDeleteLoading ? "Deleting…" : "Delete event"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog
          open={Boolean(ownerToRemove)}
          onOpenChange={(open) => {
            if (!open && !ownerRemoveLoading) {
              setOwnerToRemove(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove owner?</AlertDialogTitle>
              <AlertDialogDescription>
                Remove {ownerRemoveLabel} from this venue. They will lose owner access immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={ownerRemoveLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={ownerRemoveLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={(event) => {
                  event.preventDefault();
                  void handleConfirmRemoveOwner();
                }}
              >
                {ownerRemoveLoading ? "Removing…" : "Remove owner"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div className="space-y-6 min-w-0">
          <Section>
            <SectionHeader
              eyebrow={
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <Eyebrow className="text-muted-foreground">Admin</Eyebrow>
                </div>
              }
              title={venue.name || "Edit venue"}
              subtitle="Manage venue metadata, owners, and events."
              titleAs="h1"
              actions={
                <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                  <Button variant="ghost" asChild className="rounded-full w-full sm:w-auto">
                    <Link to={`/venues/${venue.slug}`}>View public page</Link>
                  </Button>
                  <Button variant="outline" asChild className="rounded-full w-full sm:w-auto">
                    <Link to="/admin/venues">Back to list</Link>
                  </Button>
                </div>
              }
            />
          </Section>

          <Section>
            <Accordion
              type="multiple"
              value={accordionValue}
              onValueChange={handleAccordionChange}
              className="space-y-3"
            >
              <AccordionItem
                value="species"
                className="rounded-2xl border border-border bg-card shadow-card overflow-hidden"
              >
                <AccordionTrigger className="flex w-full min-h-[44px] items-center justify-between px-4 py-3 text-left text-sm font-semibold text-foreground hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <span>Species Stocked</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <div className="space-y-6">
                    {renderSectionHeader({
                      title: "Species Stocked",
                      subtitle: "Record weights, ranges, and density for anglers.",
                    })}
                    <SpeciesStockCard
                      venueId={venue.id}
                      mode="admin"
                      variant="embedded"
                      showHeader={false}
                      onDirtyChange={(dirty) => handleRowSectionDirtyChange("species", dirty)}
                      resetSignal={rowSectionResetSignal}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="facilities"
                className="rounded-2xl border border-border bg-card shadow-card overflow-hidden"
              >
                <AccordionTrigger className="flex w-full min-h-[44px] items-center justify-between px-4 py-3 text-left text-sm font-semibold text-foreground hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <span>Facilities & Comfort</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <div className="space-y-6">
                    {renderSectionHeader({
                      title: "Facilities & Comfort",
                      subtitle: "Highlight comfort and amenities for longer sessions.",
                    })}
                    <div className="space-y-4">
                      {facilityGroups.map((group) => (
                        <div key={group.title} className="space-y-2">
                          <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {group.title}
                          </Text>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {group.options.map((option) => {
                              const Icon = option.icon;
                              const isSelected = selectedFacilities.has(option.value);
                              const facilityId = `${idPrefixes.facility}-${toIdSlug(option.value)}`;
                              return (
                                <label
                                  key={option.value}
                                  htmlFor={facilityId}
                                  className="group cursor-pointer rounded-xl focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
                                >
                                  <input
                                    id={facilityId}
                                    type="checkbox"
                                    className="peer sr-only"
                                    checked={isSelected}
                                    onChange={(event) =>
                                      toggleFacility(option.value, event.target.checked)
                                    }
                                  />
                                  <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-sm font-semibold text-foreground shadow-card transition hover:border-border/80 hover:bg-muted/40 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-foreground">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition peer-checked:bg-primary/15 peer-checked:text-primary">
                                      <Icon className="h-4 w-4" />
                                    </span>
                                    <span className="flex-1">{option.label}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      {customFacilities.length > 0 ? (
                        <div className="space-y-2">
                          <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Other saved facilities
                          </Text>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {customFacilities.map((facility, index) => {
                              const isSelected = selectedFacilities.has(facility);
                              const customFacilityId = `${idPrefixes.customFacility}-${index}-${toIdSlug(facility)}`;
                              return (
                                <label
                                  key={facility}
                                  htmlFor={customFacilityId}
                                  className="group cursor-pointer rounded-xl focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
                                >
                                  <input
                                    id={customFacilityId}
                                    type="checkbox"
                                    className="peer sr-only"
                                    checked={isSelected}
                                    onChange={(event) => toggleFacility(facility, event.target.checked)}
                                  />
                                  <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-sm font-semibold text-foreground shadow-card transition hover:border-border/80 hover:bg-muted/40 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-foreground">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition peer-checked:bg-primary/15 peer-checked:text-primary">
                                      <Wrench className="h-4 w-4" />
                                    </span>
                                    <span className="flex-1 truncate">{facility}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor={ids.facilities} className="text-sm font-semibold text-foreground">
                        Facilities (comma separated)
                      </label>
                      <Input
                        id={ids.facilities}
                        value={form.facilities}
                        onChange={(e) => setForm((prev) => ({ ...prev, facilities: e.target.value }))}
                        placeholder="Toilets, Café, Tackle shop"
                      />
                      <Text variant="muted" className="text-xs">
                        Add any custom facilities not listed above.
                      </Text>
                    </div>
                    <SectionSaveFooter
                      dirty={isMetadataDirty}
                      saving={saving}
                      justSaved={metadataJustSaved}
                      onSave={() => void saveMetadataGroup()}
                      saveDisabled={!isMetadataDirty}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="pricing"
                className="rounded-2xl border border-border bg-card shadow-card overflow-hidden"
              >
                <AccordionTrigger className="flex w-full min-h-[44px] items-center justify-between px-4 py-3 text-left text-sm font-semibold text-foreground hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <span>Pricing & Tickets</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <div className="space-y-6">
                    {renderSectionHeader({
                      title: "Pricing & Tickets",
                      subtitle: "Ticket summaries and payment details.",
                    })}
                    <div className="grid gap-4 md:grid-cols-2 min-w-0">
                      <div className="space-y-2 min-w-0">
                        <label htmlFor={ids.ticketType} className="text-sm font-semibold text-foreground">
                          Ticket type
                        </label>
                        <Input
                          id={ids.ticketType}
                          value={form.ticket_type}
                          onChange={(e) => setForm((prev) => ({ ...prev, ticket_type: e.target.value }))}
                          placeholder="Day ticket, Syndicate, Club water, Coaching venue"
                        />
                        <Text variant="muted" className="text-xs">
                          Short description shown in pricing summaries.
                        </Text>
                      </div>
                      <div className="space-y-2 min-w-0">
                        <label htmlFor={ids.priceFrom} className="text-sm font-semibold text-foreground">
                          Price from
                        </label>
                        <Input
                          id={ids.priceFrom}
                          value={form.price_from}
                          onChange={(e) => setForm((prev) => ({ ...prev, price_from: e.target.value }))}
                          placeholder="from £10 / day"
                        />
                        <Text variant="muted" className="text-xs">
                          Use a simple headline price to anchor the list.
                        </Text>
                      </div>
                      <fieldset className="space-y-2 min-w-0 md:col-span-2">
                        <legend className="text-sm font-semibold text-foreground">Payment methods</legend>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {paymentOptions.map((option) => {
                            const paymentId = `${idPrefixes.payment}-${toIdSlug(option.value)}`;
                            return (
                              <div
                                key={option.value}
                                className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground"
                              >
                                <Checkbox
                                  id={paymentId}
                                  checked={form.payment_methods.includes(option.value)}
                                  onCheckedChange={(checked) =>
                                    togglePaymentMethod(option.value, Boolean(checked))
                                  }
                                />
                                <label htmlFor={paymentId} className="cursor-pointer">
                                  {option.label}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </fieldset>
                      <div className="space-y-2 min-w-0 md:col-span-2">
                        <label htmlFor={ids.paymentNotes} className="text-sm font-semibold text-foreground">
                          Payment notes
                        </label>
                        <Textarea
                          id={ids.paymentNotes}
                          value={form.payment_notes}
                          onChange={(e) => setForm((prev) => ({ ...prev, payment_notes: e.target.value }))}
                          placeholder="Cash only on bank. No card facilities."
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/40 p-4">
                      <PricingTiersCard
                        ref={pricingTiersRef}
                        venueId={venue.id}
                        mode="admin"
                        variant="embedded"
                        showHeader={false}
                        showFooter={false}
                        onDirtyChange={(dirty) => handleRowSectionDirtyChange("pricing", dirty)}
                        resetSignal={rowSectionResetSignal}
                      />
                    </div>
                    <SectionSaveFooter
                      dirty={pricingSectionDirty}
                      saving={pricingSectionSaving || saving}
                      justSaved={pricingSectionJustSaved}
                      onSave={() => void savePricingAndMetadata()}
                      saveDisabled={!pricingSectionDirty}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="contact"
                className="rounded-2xl border border-border bg-card shadow-card overflow-hidden"
              >
                <AccordionTrigger className="flex w-full min-h-[44px] items-center justify-between px-4 py-3 text-left text-sm font-semibold text-foreground hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <span>Contact & Handoff</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <div className="space-y-6">
                    {renderSectionHeader({
                      title: "Contact & Handoff",
                      subtitle: "Booking instructions and public contact details.",
                    })}
                    <div className="grid gap-4 md:grid-cols-2 min-w-0">
                      <div className="space-y-2 min-w-0">
                        <label htmlFor={ids.shortTagline} className="text-sm font-semibold text-foreground">
                          Short tagline
                        </label>
                        <Input
                          id={ids.shortTagline}
                          value={form.short_tagline}
                          onChange={(e) => setForm((prev) => ({ ...prev, short_tagline: e.target.value }))}
                          placeholder="Big carp day-ticket venue with 3 main lakes"
                        />
                        <Text variant="muted" className="text-xs">
                          Appears near the venue title on the public page.
                        </Text>
                      </div>
                      <div className="space-y-2 md:col-span-2 min-w-0">
                        <MarkdownEditor
                          id="venueDescription"
                          label="Description"
                          value={form.description}
                          onChange={(value) =>
                            setForm((prev) => ({ ...prev, description: value }))
                          }
                          rows={4}
                          placeholder="Brief description of the venue"
                        />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <label htmlFor={ids.websiteUrl} className="text-sm font-semibold text-foreground">
                          Website URL
                        </label>
                        <Input
                          id={ids.websiteUrl}
                          value={form.website_url}
                          onChange={(e) => setForm((prev) => ({ ...prev, website_url: e.target.value }))}
                          placeholder="https://example.com"
                        />
                        <Text variant="muted" className="text-xs">
                          Include the full URL with https://
                        </Text>
                      </div>
                      <div className="space-y-2 min-w-0">
                        <label htmlFor={ids.bookingUrl} className="text-sm font-semibold text-foreground">
                          Booking URL
                        </label>
                        <Input
                          id={ids.bookingUrl}
                          value={form.booking_url}
                          onChange={(e) => setForm((prev) => ({ ...prev, booking_url: e.target.value }))}
                          placeholder="https://example.com/book"
                        />
                        <Text variant="muted" className="text-xs">
                          Direct anglers to the booking page if available.
                        </Text>
                      </div>
                      <div className="space-y-2 min-w-0">
                        <label htmlFor={ids.contactPhone} className="text-sm font-semibold text-foreground">
                          Contact phone
                        </label>
                        <Input
                          id={ids.contactPhone}
                          value={form.contact_phone}
                          onChange={(e) => setForm((prev) => ({ ...prev, contact_phone: e.target.value }))}
                          placeholder="+44 ..."
                        />
                        <Text variant="muted" className="text-xs">
                          Include the area code for clarity.
                        </Text>
                      </div>
                    </div>
                    <div className="space-y-4 rounded-xl border border-border bg-muted/40 p-4">
                      <BookingCard
                        venueId={venue.id}
                        initialEnabled={venue.booking_enabled ?? true}
                        mode="admin"
                        variant="embedded"
                        showHeader={false}
                        onUpdated={(nextValue) =>
                          {
                            setVenue((current) => (current ? { ...current, booking_enabled: nextValue } : current));
                            if (slug) {
                              void queryClient.invalidateQueries({ queryKey: qk.venueBySlug(slug) });
                            }
                          }
                        }
                      />
                    </div>
                    <div className="space-y-2 min-w-0">
                      <label htmlFor={ids.internalNotes} className="text-sm font-semibold text-foreground">
                        Internal notes (RR team only)
                      </label>
                      <Textarea
                        id={ids.internalNotes}
                        value={form.notes_for_rr_team}
                        onChange={(e) => setForm((prev) => ({ ...prev, notes_for_rr_team: e.target.value }))}
                        placeholder="Internal notes not shown publicly"
                        rows={3}
                      />
                    </div>
                    <SectionSaveFooter
                      dirty={isMetadataDirty}
                      saving={saving}
                      justSaved={metadataJustSaved}
                      onSave={() => void saveMetadataGroup()}
                      saveDisabled={!isMetadataDirty}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="hours"
                className="rounded-2xl border border-border bg-card shadow-card overflow-hidden"
              >
                <AccordionTrigger className="flex w-full min-h-[44px] items-center justify-between px-4 py-3 text-left text-sm font-semibold text-foreground hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <span>Opening Hours</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <div className="space-y-6">
                    {renderSectionHeader({
                      title: "Opening Hours",
                      subtitle: "Seasonal or day-by-day hours with grouping support.",
                    })}
                    <OpeningHoursCard
                      venueId={venue.id}
                      mode="admin"
                      variant="embedded"
                      showHeader={false}
                      onDirtyChange={(dirty) => handleRowSectionDirtyChange("openingHours", dirty)}
                      resetSignal={rowSectionResetSignal}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="rules"
                className="rounded-2xl border border-border bg-card shadow-card overflow-hidden"
              >
                <AccordionTrigger className="flex w-full min-h-[44px] items-center justify-between px-4 py-3 text-left text-sm font-semibold text-foreground hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <span>Rules</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <div className="space-y-6">
                    <RulesCard
                      venueId={venue.id}
                      venueName={venue.name}
                      mode="admin"
                      variant="embedded"
                      showHeader
                      actionsPlacement="footer"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="photos"
                className="rounded-2xl border border-border bg-card shadow-card overflow-hidden"
              >
                <AccordionTrigger className="flex w-full min-h-[44px] items-center justify-between px-4 py-3 text-left text-sm font-semibold text-foreground hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <span>Photos</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <div className="space-y-6">
                    {renderSectionHeader({
                      title: "Photos",
                      subtitle: "Upload and manage venue imagery.",
                    })}
                    <VenuePhotosCard venueId={venue.id} mode="admin" variant="embedded" showHeader={false} />
                    <SectionSaveFooter hideSave secondaryActions={<AutoSaveChip variant="auto" />} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="events"
                className="rounded-2xl border border-border bg-card shadow-card overflow-hidden"
              >
                <AccordionTrigger className="flex w-full min-h-[44px] items-center justify-between px-4 py-3 text-left text-sm font-semibold text-foreground hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <span>Events</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <div className="space-y-6">
                    {renderSectionHeader({
                      title: "Events",
                      subtitle: "Publish upcoming events and announcements.",
                    })}
                    <div className="space-y-2">
                      <Heading as="h3" size="sm" className="text-foreground">
                        Create / edit event
                      </Heading>
                      <div className="grid gap-4 md:grid-cols-2 min-w-0">
                        <div className="space-y-1 min-w-0">
                          <label htmlFor={ids.eventTitle} className="text-sm font-semibold text-foreground">
                            Title*
                          </label>
                          <Input
                            id={ids.eventTitle}
                            value={eventForm.title}
                            onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <label htmlFor={ids.eventType} className="text-sm font-semibold text-foreground">
                            Event type
                          </label>
                          <Input
                            id={ids.eventType}
                            value={eventForm.event_type}
                            onChange={(e) => setEventForm((prev) => ({ ...prev, event_type: e.target.value }))}
                            placeholder="Match, open_day, maintenance..."
                          />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <label htmlFor={ids.eventStarts} className="text-sm font-semibold text-foreground">
                            Starts at*
                          </label>
                          <Input
                            id={ids.eventStarts}
                            type="datetime-local"
                            value={eventForm.starts_at}
                            onChange={(e) => setEventForm((prev) => ({ ...prev, starts_at: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <label htmlFor={ids.eventEnds} className="text-sm font-semibold text-foreground">
                            Ends at
                          </label>
                          <Input
                            id={ids.eventEnds}
                            type="datetime-local"
                            value={eventForm.ends_at}
                            onChange={(e) => setEventForm((prev) => ({ ...prev, ends_at: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <label htmlFor={ids.eventTicketInfo} className="text-sm font-semibold text-foreground">
                            Ticket info
                          </label>
                          <Input
                            id={ids.eventTicketInfo}
                            value={eventForm.ticket_info}
                            onChange={(e) => setEventForm((prev) => ({ ...prev, ticket_info: e.target.value }))}
                            placeholder="£25, 30 pegs, payout to top 3"
                          />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <label htmlFor={ids.eventWebsiteUrl} className="text-sm font-semibold text-foreground">
                            Website URL
                          </label>
                          <Input
                            id={ids.eventWebsiteUrl}
                            value={eventForm.website_url}
                            onChange={(e) => setEventForm((prev) => ({ ...prev, website_url: e.target.value }))}
                            placeholder="https://example.com"
                          />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <label htmlFor={ids.eventBookingUrl} className="text-sm font-semibold text-foreground">
                            Booking URL
                          </label>
                          <Input
                            id={ids.eventBookingUrl}
                            value={eventForm.booking_url}
                            onChange={(e) => setEventForm((prev) => ({ ...prev, booking_url: e.target.value }))}
                            placeholder="https://example.com/book"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2 min-w-0">
                          <label htmlFor={ids.eventDescription} className="text-sm font-semibold text-foreground">
                            Description
                          </label>
                          <Textarea
                            id={ids.eventDescription}
                            value={eventForm.description}
                            onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                            rows={3}
                          />
                        </div>
                        <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2 w-full sm:w-auto">
                          <input
                            id={ids.eventPublished}
                            type="checkbox"
                            checked={eventForm.is_published}
                            onChange={(e) => setEventForm((prev) => ({ ...prev, is_published: e.target.checked }))}
                          />
                          <label htmlFor={ids.eventPublished} className="text-sm font-semibold text-foreground">
                            Published
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Heading as="h3" size="sm" className="text-foreground">
                          All events
                        </Heading>
                        {eventsLoading ? (
                          <Text variant="muted" className="text-xs">
                            Loading…
                          </Text>
                        ) : (
                          <Text variant="muted" className="text-xs">
                            {events.length} event{events.length === 1 ? "" : "s"}
                          </Text>
                        )}
                      </div>
                      {eventsLoading ? (
                        <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading events…
                        </div>
                      ) : events.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
                          No events yet.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {events.map((event) => {
                            const status = classifyEventStatus(event);
                            const statusStyle =
                              status === "draft"
                                ? "bg-accent/20 text-accent"
                                : status === "upcoming"
                                ? "bg-secondary/20 text-secondary"
                                : "bg-muted text-foreground";
                            return (
                              <div
                                key={event.id}
                                className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                              >
                                <div className="space-y-1 min-w-0">
                                  <Heading as="h4" size="sm" className="text-foreground line-clamp-1">
                                    {event.title}
                                  </Heading>
                                  <Text variant="muted" className="text-xs truncate">
                                    {new Date(event.starts_at).toLocaleString()} {event.event_type ? `• ${event.event_type}` : ""}
                                  </Text>
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyle}`}>
                                    {status === "draft" ? "Draft" : status === "upcoming" ? "Upcoming" : "Past"}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full w-full sm:w-auto"
                                    onClick={() => handleEditEvent(event)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full text-destructive hover:text-destructive/90 w-full sm:w-auto"
                                    onClick={() => setEventToDelete(event)}
                                    disabled={eventDeleteLoading}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <SectionSaveFooter
                      dirty={isEventDirty}
                      saving={eventSaving}
                      justSaved={eventJustSaved}
                      onSave={() => void handleSaveEvent()}
                      saveDisabled={!isEventDirty}
                      secondaryActions={
                        <Button
                          variant="outline"
                          onClick={() => handleEditEvent(undefined)}
                          className="h-11 rounded-xl border border-border bg-card px-4 font-semibold text-foreground hover:bg-muted/40"
                        >
                          Clear form
                        </Button>
                      }
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="owners"
                className="rounded-2xl border border-border bg-card shadow-card overflow-hidden"
              >
                <AccordionTrigger className="flex w-full min-h-[44px] items-center justify-between px-4 py-3 text-left text-sm font-semibold text-foreground hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <span>Owners</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <div className="space-y-4">
                    {renderSectionHeader({
                      title: "Owners",
                      subtitle: "Manage venue owners and managers.",
                    })}
                    <div className="space-y-2">
                      {ownersLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading owners…
                        </div>
                      ) : owners.length === 0 ? (
                        <Text variant="muted" className="text-sm">
                          No owners assigned yet.
                        </Text>
                      ) : (
                        <div className="space-y-2">
                          {owners.map((owner) => (
                            <div
                              key={owner.user_id}
                              className="flex min-w-0 flex-col gap-2 rounded border border-border/70 bg-muted/40 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                            >
                              <Text className="text-sm text-foreground truncate">
                                {owner.username ? `@${owner.username}` : owner.user_id}{" "}
                                <span className="text-xs text-muted-foreground whitespace-nowrap">({owner.role})</span>
                              </Text>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full sm:w-auto justify-start"
                                onClick={() =>
                                  setOwnerToRemove({
                                    userId: owner.user_id,
                                    label: owner.username ? `@${owner.username}` : owner.user_id,
                                  })
                                }
                                disabled={ownerRemoveLoading}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor={ids.ownerInput} className="text-sm font-medium text-foreground">
                        Add owner by username or user ID
                      </label>
                      <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                        <Input
                          id={ids.ownerInput}
                          value={ownerInput}
                          onChange={(e) => setOwnerInput(e.target.value)}
                          placeholder="username or user id"
                          className="w-full sm:w-72 sm:max-w-sm"
                        />
                        <Button onClick={() => void handleAddOwner()} disabled={ownerSaving} className="w-full sm:w-auto">
                          {ownerSaving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding…
                            </>
                          ) : (
                            "Add owner"
                          )}
                        </Button>
                      </div>
                    </div>
                    <SectionSaveFooter
                      hideSave
                      secondaryActions={ownerSaving ? <AutoSaveChip variant="saving" /> : <AutoSaveChip variant="auto" />}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Section>
        </div>
      </PageContainer>
    </div>
  );
};

export default AdminVenueEdit;
