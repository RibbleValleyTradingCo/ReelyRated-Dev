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
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";

type VenuePhotoRow = {
  id: string;
  venue_id: string;
  image_path: string;
  caption: string | null;
  is_primary?: boolean | null;
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
  mode?: "owner" | "admin";
  variant?: "card" | "embedded";
  showHeader?: boolean;
}

const VenuePhotosCard = ({
  venueId,
  mode = "owner",
  variant = "card",
  showHeader = true,
}: VenuePhotosCardProps) => {
  const queryClient = useQueryClient();
  const isEmbedded = variant === "embedded";
  const [photos, setPhotos] = useState<VenuePhotoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [settingPrimaryIds, setSettingPrimaryIds] = useState<Set<string>>(new Set());

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

  const resolveStorageObjectPath = (imagePath: string) => {
    const normalized = imagePath.replace(/^\/+/, "");
    const prefix = `${VENUE_PHOTOS_BUCKET}/`;
    if (!normalized.startsWith(prefix)) return null;
    return normalized.slice(prefix.length);
  };

  const handleUploadAll = async () => {
    if (!venueId || pendingCount === 0 || uploading) return;
    setUploading(true);
    const addPhotoRpc = mode === "admin" ? "admin_add_venue_photo" : "owner_add_venue_photo";
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
      const { error: insertError } = await supabase.rpc(addPhotoRpc, {
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
        const { error: cleanupError } = await supabase.storage
          .from(VENUE_PHOTOS_BUCKET)
          .remove([storagePath]);
        if (cleanupError) {
          console.error("Failed to cleanup venue photo upload", cleanupError);
          toast.error(
            `Save failed for ${item.file.name}. Cleanup failed for ${storagePath}.`
          );
        } else {
          toast.error(`Save failed for ${item.file.name}. Upload rolled back.`);
        }
        continue;
      }
      updateQueueItem(item.id, { status: "done" });
    }
    setUploading(false);
    setUploadQueue((prev) => prev.filter((item) => item.status !== "done"));
    await loadPhotos();
    void queryClient.invalidateQueries({ queryKey: qk.venuePhotos(venueId) });
  };

  const handleDeletePhoto = async (photo: VenuePhotoRow) => {
    if (deletingIds.has(photo.id)) return;
    const confirmed = window.confirm("Delete this venue photo?");
    if (!confirmed) return;
    setDeletingIds((prev) => new Set(prev).add(photo.id));
    try {
      const objectPath = resolveStorageObjectPath(photo.image_path);
      if (!objectPath) {
        toast.error("Unable to delete photo: invalid storage path.");
        return;
      }
      const { error: storageError } = await supabase.storage
        .from(VENUE_PHOTOS_BUCKET)
        .remove([objectPath]);
      if (storageError) {
        console.error("Failed to delete venue photo from storage", storageError);
        toast.error("Failed to delete venue photo");
        return;
      }
      const deletePhotoRpc =
        mode === "admin" ? "admin_delete_venue_photo" : "owner_delete_venue_photo";
      const { error } = await supabase.rpc(deletePhotoRpc, {
        p_id: photo.id,
      });
      if (error) {
        console.error("Failed to delete venue photo", error);
        toast.error("Failed to delete venue photo");
        return;
      }
      toast.success("Venue photo deleted");
      await loadPhotos();
      void queryClient.invalidateQueries({ queryKey: qk.venuePhotos(venueId) });
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(photo.id);
        return next;
      });
    }
  };

  const handleSetPrimary = async (photo: VenuePhotoRow) => {
    if (settingPrimaryIds.has(photo.id)) return;
    setSettingPrimaryIds((prev) => new Set(prev).add(photo.id));
    const rpcName =
      mode === "admin" ? "admin_set_venue_photo_primary" : "owner_set_venue_photo_primary";
    const { error } = await supabase.rpc(rpcName, { p_photo_id: photo.id });
    if (error) {
      console.error("Failed to set primary photo", error);
      toast.error("Failed to set primary photo");
    } else {
      toast.success("Primary photo updated");
      await loadPhotos();
      void queryClient.invalidateQueries({ queryKey: qk.venuePhotos(venueId) });
    }
    setSettingPrimaryIds((prev) => {
      const next = new Set(prev);
      next.delete(photo.id);
      return next;
    });
  };

  const header = showHeader ? (
    <div className="space-y-1">
      <Heading as="h2" size="md" className="text-foreground">
        Venue photos
      </Heading>
      <Text variant="muted" className="text-sm">
        Upload photos for your venue page. Set a primary photo to control the hero image.
      </Text>
    </div>
  ) : null;

  const body = loading ? (
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
          {photos.length === 0 ? (
            <Text className="text-xs text-muted-foreground">
              Add a few venue shots so anglers can preview the venue.
            </Text>
          ) : null}
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
                      className="rounded-xl border border-border bg-muted/40 p-3 space-y-2"
                    >
                      <div className="aspect-[4/3] overflow-hidden rounded-md bg-muted">
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p className="truncate">{item.file.name}</p>
                        {item.status === "uploading" ? (
                          <p className="flex items-center gap-1 text-primary">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Uploading…
                          </p>
                        ) : item.status === "error" ? (
                          <p className="text-destructive">{item.error ?? "Error"}</p>
                        ) : item.status === "done" ? (
                          <p className="text-secondary">Uploaded</p>
                        ) : (
                          <p className="text-muted-foreground">Ready to upload</p>
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
                    const isPrimary = Boolean(photo.is_primary);
                    return (
                    <div
                      key={photo.id}
                      className="rounded-xl border border-border bg-muted/40 p-3 space-y-2"
                    >
                        <div className="aspect-[4/3] overflow-hidden rounded-md bg-muted">
                          {publicUrl ? (
                            <img
                              src={publicUrl}
                              alt={photo.caption ?? "Venue photo"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                              <ImagePlus className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        {photo.caption ? (
                          <Text className="text-xs text-muted-foreground">
                            {photo.caption}
                          </Text>
                        ) : (
                          <Text className="text-xs text-muted-foreground/70">
                            No caption
                          </Text>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant={isPrimary ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => void handleSetPrimary(photo)}
                            disabled={isPrimary || settingPrimaryIds.has(photo.id)}
                          >
                            {settingPrimaryIds.has(photo.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isPrimary ? (
                              "Primary"
                            ) : (
                              "Set primary"
                            )}
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
      <CardContent className="space-y-4 p-0 pt-4">{body}</CardContent>
    </Card>
  );
};

export default VenuePhotosCard;
