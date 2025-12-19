import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { normalizeVenueName } from "@/lib/freshwater-data";
import type { Database } from "@/integrations/supabase/types";
import { catchSchemaWithRefinements } from "@/schemas";
import { CatchBasicsSection } from "@/components/catch-form/CatchBasicsSection";
import { LocationSection } from "@/components/catch-form/LocationSection";
import { TacticsSection } from "@/components/catch-form/TacticsSection";
import { StorySection } from "@/components/catch-form/StorySection";
import { ConditionsSection } from "@/components/catch-form/ConditionsSection";
import { MediaSection } from "@/components/catch-form/MediaSection";
import { PrivacySection } from "@/components/catch-form/PrivacySection";
import { logger } from "@/lib/logger";
import { mapModerationError } from "@/lib/moderation-errors";
import { UK_FISHERIES } from "@/lib/freshwater-data";
import { isAdminUser } from "@/lib/admin";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import SectionHeader from "@/components/layout/SectionHeader";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import Eyebrow from "@/components/typography/Eyebrow";
import { Camera, MapPin, NotebookPen, FileText, CloudSun, Images, Tag as TagIcon } from "lucide-react";

const capitalizeFirstWord = (value: string) => {
  if (!value) return "";
  const trimmed = value.trimStart();
  if (!trimmed) return "";
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
};

const toTitleCase = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

type SessionOption = {
  id: string;
  title: string;
  venue: string | null;
  date: string | null;
};

type VenueRow = {
  id: string;
  name: string;
};

type CatchInsert = Database["public"]["Tables"]["catches"]["Insert"] & {
  venue_id?: string | null;
};

const AddCatch = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [showConditions, setShowConditions] = useState(false);
  const [methodOptions, setMethodOptions] = useState<{ slug: string; label: string; group: string }[]>([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);
  const [baitOptions, setBaitOptions] = useState<{ slug: string; label: string; category: string }[]>([]);
  const [isLoadingBaits, setIsLoadingBaits] = useState(false);
  const [waterTypeOptions, setWaterTypeOptions] = useState<{ code: string; label: string; group: string }[]>([]);
  const [isLoadingWaterTypes, setIsLoadingWaterTypes] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    species: "",
    customSpecies: "",
    weight: "",
    weightUnit: "lb_oz",
    length: "",
    lengthUnit: "cm",
    description: "",
    location: "",
    customLocationLabel: "",
    pegOrSwim: "",
    waterType: "",
    method: "",
    customMethod: "",
    baitUsed: "",
    equipmentUsed: "",
    caughtAt: new Date().toISOString().split('T')[0],
    timeOfDay: "",
    weather: "",
    airTemp: "",
    waterClarity: "",
    windDirection: "",
    tags: "",
    videoUrl: "",
    visibility: "public",
    hideExactSpot: false,
    allowRatings: true,
  });

  const [useGpsLocation, setUseGpsLocation] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSession, setNewSession] = useState({
    title: "",
    venue: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [prefilledVenue, setPrefilledVenue] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const slug = searchParams.get("venue");
    if (!slug) return;
    const loadVenueFromSlug = async () => {
      const venueResponse = await supabase
        .from("venues" as never)
        .select("id,name")
        .eq("slug", slug)
        .maybeSingle();
      const { data, error } = venueResponse as { data: VenueRow | null; error: unknown };
      if (error || !data) return;
      const venue = data as VenueRow;
      setPrefilledVenue({ id: venue.id, name: venue.name });
      setFormData((prev) => ({
        ...prev,
        location: venue.name,
      }));
      setNewSession((prev) => ({
        ...prev,
        venue: prev.venue || venue.name,
      }));
    };
    void loadVenueFromSlug();
  }, [searchParams]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const loadAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setAdminChecked(true);
        return;
      }

      try {
        const adminStatus = await isAdminUser(user.id);
        setIsAdmin(adminStatus);
      } catch {
        setIsAdmin(false);
      } finally {
        setAdminChecked(true);
      }
    };

    void loadAdmin();
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingMethods(true);

    const loadMethods = async () => {
      try {
        const { data, error } = await supabase
          .from("tags")
          .select("slug,label,method_group")
          .eq("category", "method")
          .order("method_group", { ascending: true, nullsFirst: false })
          .order("label", { ascending: true });

        if (!isMounted) return;

        if (error) {
          logger.error("Failed to load method tags", error);
          setMethodOptions([]);
        } else {
          setMethodOptions(
            (data ?? []).map((item) => ({
              slug: item.slug,
              label: item.label,
              group: item.method_group ?? "Other",
            }))
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingMethods(false);
        }
      }
    };

    void loadMethods();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingBaits(true);

    const loadBaits = async () => {
      try {
        const { data, error } = await supabase
          .from("baits")
          .select("slug,label,category")
          .order("category", { ascending: true })
          .order("label", { ascending: true });

        if (!isMounted) return;

        if (error) {
          logger.error("Failed to load baits", error);
          setBaitOptions([]);
        } else {
          setBaitOptions(
            (data ?? []).map((item) => ({
              slug: item.slug,
              label: item.label,
              category: item.category ?? "other",
            }))
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingBaits(false);
        }
      }
    };

    void loadBaits();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingWaterTypes(true);

    const loadWaterTypes = async () => {
      try {
        const { data, error } = await supabase
          .from("water_types")
          .select("code,label,group_name")
          .order("group_name", { ascending: true, nullsFirst: false })
          .order("label", { ascending: true });

        if (!isMounted) return;

        if (error) {
          logger.error("Failed to load water types", error);
          setWaterTypeOptions([]);
        } else {
          setWaterTypeOptions(
            (data ?? []).map((item) => ({
              code: item.code,
              label: item.label,
              group: item.group_name ?? "other",
            }))
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingWaterTypes(false);
        }
      }
    };

    void loadWaterTypes();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) {
        setSessions([]);
        return;
      }
      setIsLoadingSessions(true);
      const { data, error } = await supabase
        .from("sessions" as never)
        .select("id, title, venue, date")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(20);

      if (error) {
        logger.error("Failed to load sessions", error, { userId: user.id });
        setSessions([]);
      } else if (data) {
        const typedSessions = (data ?? []) as unknown as SessionOption[];
        setSessions(typedSessions);
      }
      setIsLoadingSessions(false);
    };

    if (!loading) {
      void fetchSessions();
    }
  }, [loading, user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (galleryFiles.length + files.length > 6) {
      toast.error("Maximum 6 gallery photos allowed");
      return;
    }

    setGalleryFiles([...galleryFiles, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGalleryPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryImage = (index: number) => {
    setGalleryFiles(galleryFiles.filter((_, i) => i !== index));
    setGalleryPreviews(galleryPreviews.filter((_, i) => i !== index));
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported on this device.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGpsAccuracy(position.coords.accuracy ?? null);
        setUseGpsLocation(true);
        setIsLocating(false);
        setFormData((prev) => ({
          ...prev,
          location: "",
        }));
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied. Please enable it in your browser settings.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Unable to determine your location. Try again in an open area.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out. Please try again.");
            break;
          default:
            setLocationError("We couldn't get your location. Please try again.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required image file
    if (!imageFile) {
      toast.error("Please upload a photo of your catch");
      return;
    }

    if (!user) return;

    // Validate form data with Zod schema
    const validationResult = catchSchemaWithRefinements.safeParse(formData);

    if (!validationResult.success) {
      // Display validation errors
      const firstError = validationResult.error.issues[0];
      if (firstError) {
        toast.error(firstError.message);
      }
      return;
    }

    // Additional validation for conditional fields
    const speciesIsOther = formData.species === "other";
    if (speciesIsOther && !formData.customSpecies) {
      toast.error("Please describe the species when selecting Other");
      return;
    }

    const methodIsOther = formData.method === "other";
    if (methodIsOther && !formData.customMethod) {
      toast.error("Please describe the method when selecting Other");
      return;
    }

    const customLocationLabel = formData.customLocationLabel
      ? capitalizeFirstWord(formData.customLocationLabel)
      : "";
    const finalLocation =
      useGpsLocation && gpsCoordinates
        ? customLocationLabel || "Pinned location"
        : formData.location;

    if (!finalLocation) {
      toast.error("Please choose a fishery or drop a GPS pin");
      return;
    }

    const normalizedLocation = normalizeVenueName(finalLocation);
    const isKnownFishery = normalizedLocation
      ? (UK_FISHERIES as readonly string[]).includes(normalizedLocation)
      : false;
    let venueId: string | null = null;

    if (prefilledVenue && prefilledVenue.name === finalLocation) {
      venueId = prefilledVenue.id;
    } else if (isKnownFishery) {
      const venueResponse = await supabase
        .from("venues" as never)
        .select("id")
        .eq("name", normalizedLocation)
        .maybeSingle();
      const { data: venueRow } = venueResponse as { data: { id: string } | null; error: unknown };
      const venue = venueRow ?? null;
      venueId = venue?.id ?? null;
    }

    setIsSubmitting(true);

    try {
      const selectedWaterTypeOption = formData.waterType
        ? waterTypeOptions.find((option) => option.code === formData.waterType)
        : undefined;
      const normalizedWaterType = formData.waterType ? formData.waterType : null;

      let sessionId: string | null = selectedSessionId || null;
      let createdSession: SessionOption | null = null;

      if (isCreatingSession) {
        if (!newSession.title.trim()) {
          toast.error("Session title is required");
          setIsSubmitting(false);
          return;
        }

        const sessionVenue = newSession.venue.trim()
          ? normalizeVenueName(newSession.venue)
          : normalizedLocation;

        const sessionValues = {
          user_id: user.id,
          title: newSession.title.trim(),
          venue: sessionVenue || null,
          date: newSession.date ? newSession.date : null,
          notes: newSession.notes.trim() || null,
        };

        const sessionResult = await supabase
          .from("sessions" as never)
          .insert(sessionValues as never)
          .select("id, title, venue, date")
          .single();

        const { data: sessionInsert, error: sessionError } = sessionResult as {
          data: SessionOption | null;
          error: unknown;
        };

        if (sessionError || !sessionInsert) {
          throw sessionError ?? new Error("Failed to create session");
        }

        sessionId = sessionInsert.id;
        createdSession = sessionInsert;
      }

      // Upload main image
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("catches")
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("catches")
        .getPublicUrl(fileName);

      // Upload gallery images
      const galleryUrls: string[] = [];
      for (const file of galleryFiles) {
        const ext = file.name.split(".").pop();
        const name = `${user.id}-${Date.now()}-${Math.random()}.${ext}`;
        const { error: galleryError } = await supabase.storage
          .from("catches")
          .upload(name, file);

        if (!galleryError) {
          const { data: { publicUrl: galleryUrl } } = supabase.storage
            .from("catches")
            .getPublicUrl(name);
          galleryUrls.push(galleryUrl);
        }
      }

      // Prepare conditions object
      const conditions: Record<string, unknown> = {};
      if (formData.weather) conditions.weather = formData.weather;
      if (formData.airTemp) conditions.airTemp = parseFloat(formData.airTemp);
      if (formData.waterClarity) conditions.waterClarity = formData.waterClarity;
      if (formData.windDirection) conditions.windDirection = formData.windDirection;

      const customFields: Record<string, string> = {};
      if (speciesIsOther && formData.customSpecies) {
        customFields.species = formData.customSpecies;
      }
      if (methodIsOther && formData.customMethod) {
        customFields.method = formData.customMethod;
      }
      if (formData.waterType) {
        const waterTypeLabel =
          selectedWaterTypeOption?.label ??
          toTitleCase(formData.waterType.replace(/[-_]/g, " "));
        if (waterTypeLabel) {
          customFields.waterType = waterTypeLabel;
        }
      }
      if (Object.keys(customFields).length > 0) {
        conditions.customFields = customFields;
      }

      if (useGpsLocation && gpsCoordinates) {
        conditions.gps = {
          lat: gpsCoordinates.lat,
          lng: gpsCoordinates.lng,
          ...(gpsAccuracy ? { accuracy: gpsAccuracy } : {}),
          ...(customLocationLabel ? { label: customLocationLabel } : {}),
        };
        conditions.locationSource = "gps";
      } else if (formData.location) {
        conditions.locationSource = "manual";
      }

      // Parse tags
      const tags = formData.tags
        ? formData.tags.split(',').map(t => t.trim()).filter(t => t)
        : [];

      const conditionsPayload =
        Object.keys(conditions).length > 0
          ? (conditions as Database["public"]["Tables"]["catches"]["Insert"]["conditions"])
          : null;

      // Insert catch record
      const catchData: CatchInsert = {
        user_id: user.id,
        image_url: publicUrl,
        title: formData.title,
        description: formData.description || null,
        location: normalizedLocation || null,
        bait_used: formData.baitUsed || null,
        equipment_used: formData.equipmentUsed || null,
        caught_at: formData.caughtAt || null,
        species: formData.species || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        weight_unit: formData.weightUnit as Database["public"]["Enums"]["weight_unit"],
        length: formData.length ? parseFloat(formData.length) : null,
        length_unit: formData.lengthUnit as string,
        peg_or_swim: formData.pegOrSwim || null,
        water_type: normalizedWaterType,
        method: formData.method || null,
        time_of_day: formData.timeOfDay || null,
        conditions: conditionsPayload,
        tags,
        gallery_photos: galleryUrls,
        video_url: formData.videoUrl || null,
        visibility: formData.visibility as Database["public"]["Enums"]["visibility_type"],
        hide_exact_spot: formData.hideExactSpot,
        allow_ratings: formData.allowRatings,
        session_id: sessionId,
        venue_id: venueId,
      };

      const { error: insertError } = await supabase.from("catches").insert(catchData);

      if (insertError) throw insertError;

      if (createdSession) {
        setSessions((prev) => [createdSession!, ...prev.filter((session) => session.id !== createdSession!.id)]);
        setSelectedSessionId(createdSession.id);
        setIsCreatingSession(false);
        setNewSession({ title: "", venue: "", date: new Date().toISOString().split("T")[0], notes: "" });
      }

      toast.success("Catch added successfully!");
      navigate("/feed");
    } catch (error) {
      logger.error("Error adding catch", error, { userId: user?.id, sessionId: selectedSessionId });
      const message =
        error && typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string"
          ? (error as { message: string }).message
          : null;
      if (message?.toLowerCase().includes("bucket")) {
        toast.error("Unable to upload images. Please create a 'catches' storage bucket in Supabase.");
      } else {
        const moderation = mapModerationError(error);
        if (moderation.type === "suspended") {
          const suspendedModeration = moderation as { type: "suspended"; until?: string };
          const untilValue = suspendedModeration.until;
          const untilText = untilValue ? ` until ${new Date(untilValue).toLocaleString()}` : "";
          toast.error(`You’re currently suspended${untilText} and can’t post new catches right now.`);
        } else if (moderation.type === "banned") {
          toast.error("Your account is banned and you can’t post new catches.");
        } else {
          toast.error(message ?? "Failed to add catch. Please try again.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !adminChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <PageContainer className="py-8">
          <Text>Loading...</Text>
        </PageContainer>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <PageContainer className="py-12">
          <Section>
            <Card className="max-w-2xl">
              <CardHeader>
                <Heading as="h2" size="md" className="text-foreground">
                  Admins can’t create catches
                </Heading>
                <Text variant="muted" className="text-sm">
                  Admin accounts are moderation-only. Please switch to an angler account to log catches.
                </Text>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="ocean" onClick={() => navigate("/feed")}>
                  Go to feed
                </Button>
                <Button variant="outline" onClick={() => navigate("/admin/reports")}>
                  Open admin tools
                </Button>
              </CardContent>
            </Card>
          </Section>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <PageContainer className="py-8">
        <div className="space-y-6">
          <Section>
            <SectionHeader
              title="Log a new catch"
              subtitle="Capture the details that actually help you catch more next time."
            />
          </Section>

          <Section>
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-8" data-testid="add-catch-form">
                  <Section className="space-y-4">
                    <div className="space-y-3 pt-1">
                      <div className="rounded-xl border border-border/60 bg-white/80 p-3 sm:p-4 space-y-2 [&_h3]:sr-only [&_.space-y-4]:space-y-2 [&_.space-y-3]:space-y-1.5 [&_.space-y-2]:space-y-1.5 [&_.grid.grid-cols-2]:gap-2 [&_.grid.grid-cols-2]:items-end [&_.border-2]:p-2.5 [&_.border-2]:py-3 [&_label[for='title']]:text-sm [&_label[for='title']]:text-muted-foreground">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Camera className="h-4 w-4" />
                          <Eyebrow className="mb-0">Catch basics</Eyebrow>
                        </div>
                        <CatchBasicsSection
                          imagePreview={imagePreview}
                          imageFile={imageFile}
                          onImageChange={handleImageChange}
                          formData={{
                            title: formData.title,
                            species: formData.species,
                            customSpecies: formData.customSpecies,
                            weight: formData.weight,
                            weightUnit: formData.weightUnit,
                            length: formData.length,
                            lengthUnit: formData.lengthUnit,
                          }}
                          onFormDataChange={(updates) => setFormData({ ...formData, ...updates })}
                        />
                      </div>

                      <div className="rounded-xl border border-border/60 bg-white/80 p-3 sm:p-4 space-y-2 [&_h3]:sr-only [&_.space-y-4]:space-y-2 [&_.space-y-3]:space-y-1.5 [&_.space-y-2]:space-y-1.5 [&_.grid.grid-cols-2]:gap-2 [&_.grid.grid-cols-2]:items-end [&_.flex.flex-wrap.items-center.gap-2]:gap-1.5">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <Eyebrow className="mb-0">Location & session</Eyebrow>
                        </div>
                        <LocationSection
                          formData={{
                            location: formData.location,
                            customLocationLabel: formData.customLocationLabel,
                            pegOrSwim: formData.pegOrSwim,
                            caughtAt: formData.caughtAt,
                            timeOfDay: formData.timeOfDay,
                            waterType: formData.waterType,
                          }}
                          onFormDataChange={(updates) => setFormData({ ...formData, ...updates })}
                          useGpsLocation={useGpsLocation}
                          setUseGpsLocation={setUseGpsLocation}
                          gpsCoordinates={gpsCoordinates}
                          setGpsCoordinates={setGpsCoordinates}
                          gpsAccuracy={gpsAccuracy}
                          setGpsAccuracy={setGpsAccuracy}
                          isLocating={isLocating}
                          setIsLocating={setIsLocating}
                          locationError={locationError}
                          setLocationError={setLocationError}
                          onHandleUseGps={handleUseGps}
                          waterTypeOptions={waterTypeOptions}
                          isLoadingWaterTypes={isLoadingWaterTypes}
                          sessions={sessions}
                          isLoadingSessions={isLoadingSessions}
                          selectedSessionId={selectedSessionId}
                          setSelectedSessionId={setSelectedSessionId}
                          isCreatingSession={isCreatingSession}
                          setIsCreatingSession={setIsCreatingSession}
                          newSession={newSession}
                          setNewSession={setNewSession}
                        />
                      </div>
                    </div>
                  </Section>

                  <Section>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground sm:text-sm">
                      <span className="h-px flex-1 bg-border" />
                      <span>More details (optional)</span>
                      <span className="h-px flex-1 bg-border" />
                    </div>
                  </Section>

                  <Section className="space-y-4">
                    <Accordion type="multiple" className="space-y-2">
                      <AccordionItem value="tactics">
                        <AccordionTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                          <div className="flex items-start gap-2 text-left">
                            <NotebookPen className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div className="space-y-1">
                              <Heading as="h4" size="sm" className="text-foreground">
                                Tactics & notes
                              </Heading>
                              <Text variant="muted" className="text-sm">
                                Method, bait, kit, and notes.
                              </Text>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-1 pb-2 pt-0 sm:px-2 sm:pb-3">
                          <div className="rounded-xl border border-border/60 bg-white/80 p-4 sm:p-5">
                            <TacticsSection
                              formData={{
                                baitUsed: formData.baitUsed,
                                method: formData.method,
                                customMethod: formData.customMethod,
                                equipmentUsed: formData.equipmentUsed,
                              }}
                              onFormDataChange={(updates) => setFormData({ ...formData, ...updates })}
                              baitOptions={baitOptions}
                              isLoadingBaits={isLoadingBaits}
                              methodOptions={methodOptions}
                              isLoadingMethods={isLoadingMethods}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="story">
                        <AccordionTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                          <div className="flex items-start gap-2 text-left">
                            <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div className="space-y-1">
                              <Heading as="h4" size="sm" className="text-foreground">
                                Your story
                              </Heading>
                              <Text variant="muted" className="text-sm">
                                Tell the story behind this catch.
                              </Text>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-1 pb-2 pt-0 sm:px-2 sm:pb-3">
                          <div className="rounded-xl border border-border/60 bg-white/80 p-4 sm:p-5">
                            <StorySection
                              description={formData.description}
                              onDescriptionChange={(description) => setFormData({ ...formData, description })}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="conditions">
                        <AccordionTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                          <div className="flex items-start gap-2 text-left">
                            <CloudSun className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div className="space-y-1">
                              <Heading as="h4" size="sm" className="text-foreground">
                                Conditions
                              </Heading>
                              <Text variant="muted" className="text-sm">
                                Weather and water details.
                              </Text>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-1 pb-2 pt-0 sm:px-2 sm:pb-3">
                          <div className="rounded-xl border border-border/60 bg-white/80 p-4 sm:p-5">
                            <ConditionsSection
                              formData={{
                                weather: formData.weather,
                                airTemp: formData.airTemp,
                                waterClarity: formData.waterClarity,
                                windDirection: formData.windDirection,
                              }}
                              onFormDataChange={(updates) => setFormData({ ...formData, ...updates })}
                              showConditions={showConditions}
                              setShowConditions={setShowConditions}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="media">
                        <AccordionTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                          <div className="flex items-start gap-2 text-left">
                            <Images className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div className="space-y-1">
                              <Heading as="h4" size="sm" className="text-foreground">
                                Media
                              </Heading>
                              <Text variant="muted" className="text-sm">
                                Extra photos or a video link.
                              </Text>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-1 pb-2 pt-0 sm:px-2 sm:pb-3">
                          <div className="rounded-xl border border-border/60 bg-white/80 p-4 sm:p-5">
                            <MediaSection
                              galleryFiles={galleryFiles}
                              galleryPreviews={galleryPreviews}
                              onGalleryChange={handleGalleryChange}
                              onRemoveGalleryImage={removeGalleryImage}
                              videoUrl={formData.videoUrl}
                              onVideoUrlChange={(videoUrl) => setFormData({ ...formData, videoUrl })}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="privacy">
                        <AccordionTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                          <div className="flex items-start gap-2 text-left">
                            <TagIcon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div className="space-y-1">
                              <Heading as="h4" size="sm" className="text-foreground">
                                Tags & privacy
                              </Heading>
                              <Text variant="muted" className="text-sm">
                                Visibility, tags, and ratings.
                              </Text>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-1 pb-2 pt-0 sm:px-2 sm:pb-3">
                          <div className="rounded-xl border border-border/60 bg-white/80 p-4 sm:p-5">
                            <PrivacySection
                              formData={{
                                tags: formData.tags,
                                visibility: formData.visibility,
                                hideExactSpot: formData.hideExactSpot,
                                allowRatings: formData.allowRatings,
                              }}
                              onFormDataChange={(updates) => setFormData({ ...formData, ...updates })}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </Section>

                  <Section>
                    <div className="mt-2 flex flex-col gap-2 rounded-xl border border-border/60 bg-white/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5 sm:py-4">
                      <Text variant="muted" className="text-xs leading-snug sm:text-sm">
                        You can log up to 10 catches per hour. We’ll save this to your logbook and update your rankings.
                      </Text>
                      <Button
                        type="submit"
                        className="w-full sm:w-auto"
                        size="lg"
                        disabled={isSubmitting || !imageFile}
                      >
                        {isSubmitting ? "Publishing catch..." : "Log this catch"}
                      </Button>
                    </div>
                  </Section>
                </form>
              </CardContent>
            </Card>
          </Section>
        </div>
      </PageContainer>
    </div>
  );
};

export default AddCatch;
