import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import { getPublicAssetUrl } from "@/lib/storage";
import { Loader2, Upload, ImagePlus } from "lucide-react";
import { toast } from "sonner";

type VenuePhotoRow = {
  id: string;
  venue_id: string;
  image_path: string;
  caption: string | null;
  created_at: string;
  created_by: string | null;
};

type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
  status: "pending" | "uploading" | "error" | "done";
  error?: string;
};

const VENUE_PHOTOS_BUCKET = "venue-photos";

interface VenuePhotosCardProps {
  venueId: string;
}

const VenuePhotosCard = ({ venueId }: VenuePhotosCardProps) => {
  const [photos, setPhotos] = useState<VenuePhotoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const loadPhotos = useCallback(async () => {
    if (!venueId) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("get_venue_photos", {
      p_venue_id: venueId,
      p_limit: 60,
      p_offset: 0,
    });
    if (error) {
      console.error("Failed to load venue photos", error);
      toast.error("Unable to load venue photos");
      setPhotos([]);
    } else {
      setPhotos(data ?? []);
    }
    setLoading(false);
  }, [venueId]);

  useEffect(() => {
    void loadPhotos();
  }, [loadPhotos]);

  useEffect(() => {
    return () => {
      uploadQueue.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingCount = useMemo(
    () => uploadQueue.filter((item) => item.status === "pending").length,
    [uploadQueue]
  );

  const handleFileSelection = (files: FileList | null) => {
    if (!files?.length) return;
    const items = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        caption: "",
        status: "pending" as const,
      }));
    if (items.length === 0) {
      toast.error("Please choose image files only.");
      return;
    }
    setUploadQueue((prev) => [...prev, ...items]);
  };

  const updateQueueItem = (id: string, updates: Partial<UploadItem>) => {
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeQueueItem = (id: string) => {
    setUploadQueue((prev) => {
      const item = prev.find((entry) => entry.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((entry) => entry.id !== id);
    });
  };

  const buildStoragePath = (file: File, index: number) => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const stamp = `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
    return `${venueId}/${stamp}.${extension}`;
  };

  const handleUploadAll = async () => {
    if (!venueId || pendingCount === 0 || uploading) return;
    setUploading(true);
    for (let i = 0; i < uploadQueue.length; i += 1) {
      const item = uploadQueue[i];
      if (item.status !== "pending") continue;
      updateQueueItem(item.id, { status: "uploading", error: undefined });
      const storagePath = buildStoragePath(item.file, i);
      const { error: uploadError } = await supabase.storage
        .from(VENUE_PHOTOS_BUCKET)
        .upload(storagePath, item.file, {
          cacheControl: "3600",
          upsert: false,
          contentType: item.file.type,
        });
      if (uploadError) {
        console.error("Failed to upload venue photo", uploadError);
        updateQueueItem(item.id, {
          status: "error",
          error: "Upload failed",
        });
        toast.error(`Upload failed for ${item.file.name}`);
        continue;
      }
      const dbPath = `${VENUE_PHOTOS_BUCKET}/${storagePath}`;
      const { error: insertError } = await supabase.rpc("owner_add_venue_photo", {
        p_venue_id: venueId,
        p_image_path: dbPath,
        p_caption: item.caption || null,
      });
      if (insertError) {
        console.error("Failed to save venue photo", insertError);
        updateQueueItem(item.id, {
          status: "error",
          error: "Save failed",
        });
        toast.error(`Save failed for ${item.file.name}`);
        continue;
      }
      updateQueueItem(item.id, { status: "done" });
    }
    setUploading(false);
    setUploadQueue((prev) => prev.filter((item) => item.status !== "done"));
    await loadPhotos();
  };

  const handleDeletePhoto = async (photo: VenuePhotoRow) => {
    if (deletingIds.has(photo.id)) return;
    const confirmed = window.confirm("Delete this venue photo?");
    if (!confirmed) return;
    setDeletingIds((prev) => new Set(prev).add(photo.id));
    const { error } = await supabase.rpc("owner_delete_venue_photo", {
      p_id: photo.id,
    });
    if (error) {
      console.error("Failed to delete venue photo", error);
      toast.error("Failed to delete venue photo");
    } else {
      toast.success("Venue photo deleted");
      await loadPhotos();
    }
    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.delete(photo.id);
      return next;
    });
  };

  return (
    <Card className="w-full border-border/70">
      <CardHeader className="space-y-1">
        <Heading as="h2" size="md" className="text-foreground">
          Venue photos
        </Heading>
        <Text variant="muted" className="text-sm">
          Upload photos for your venue page. Primary selection is coming soon.
        </Text>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading venue photos…
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Text className="text-sm text-muted-foreground">
                  {photos.length > 0
                    ? `${photos.length} photo${photos.length === 1 ? "" : "s"} uploaded`
                    : "No photos uploaded yet."}
                </Text>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(event) => handleFileSelection(event.target.files)}
                />
                <Button
                  type="button"
                  onClick={handleUploadAll}
                  disabled={uploading || pendingCount === 0}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Upload {pendingCount > 0 ? `(${pendingCount})` : ""}
                </Button>
              </div>
            </div>

            {uploadQueue.length > 0 ? (
              <div className="space-y-3">
                <Text className="text-sm font-semibold text-foreground">
                  Upload queue
                </Text>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {uploadQueue.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border/60 bg-card/60 p-3 space-y-2"
                    >
                      <div className="aspect-[4/3] overflow-hidden rounded-md bg-slate-100">
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p className="truncate">{item.file.name}</p>
                        {item.status === "uploading" ? (
                          <p className="flex items-center gap-1 text-blue-600">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Uploading…
                          </p>
                        ) : item.status === "error" ? (
                          <p className="text-destructive">{item.error ?? "Error"}</p>
                        ) : item.status === "done" ? (
                          <p className="text-emerald-600">Uploaded</p>
                        ) : (
                          <p className="text-slate-500">Ready to upload</p>
                        )}
                      </div>
                      <Input
                        value={item.caption}
                        onChange={(event) =>
                          updateQueueItem(item.id, { caption: event.target.value })
                        }
                        placeholder="Caption (optional)"
                        disabled={item.status === "uploading"}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeQueueItem(item.id)}
                        disabled={item.status === "uploading"}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {photos.length > 0 ? (
              <div className="space-y-3">
                <Text className="text-sm font-semibold text-foreground">
                  Current photos
                </Text>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {photos.map((photo) => {
                    const publicUrl = getPublicAssetUrl(photo.image_path);
                    return (
                      <div
                        key={photo.id}
                        className="rounded-lg border border-border/60 bg-card/60 p-3 space-y-2"
                      >
                        <div className="aspect-[4/3] overflow-hidden rounded-md bg-slate-100">
                          {publicUrl ? (
                            <img
                              src={publicUrl}
                              alt={photo.caption ?? "Venue photo"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-slate-400">
                              <ImagePlus className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        {photo.caption ? (
                          <Text className="text-xs text-slate-600">
                            {photo.caption}
                          </Text>
                        ) : (
                          <Text className="text-xs text-slate-400">
                            No caption
                          </Text>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" size="sm" disabled>
                            Set primary
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => void handleDeletePhoto(photo)}
                            disabled={deletingIds.has(photo.id)}
                          >
                            {deletingIds.has(photo.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Delete"
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default VenuePhotosCard;
