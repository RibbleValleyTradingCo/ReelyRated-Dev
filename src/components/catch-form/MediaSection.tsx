import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

interface MediaSectionProps {
  galleryFiles: File[];
  galleryPreviews: string[];
  onGalleryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveGalleryImage: (index: number) => void;
  videoUrl: string;
  onVideoUrlChange: (url: string) => void;
}

export const MediaSection = ({
  galleryFiles,
  galleryPreviews,
  onGalleryChange,
  onRemoveGalleryImage,
  videoUrl,
  onVideoUrlChange,
}: MediaSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Additional Media</h3>

      <div className="space-y-2">
        <Label htmlFor="gallery">Gallery Photos (up to 6)</Label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {galleryPreviews.map((preview, index) => (
          <div key={index} className="relative">
            <img src={preview} alt={`Gallery ${index + 1}`} className="w-full h-24 object-cover rounded" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6"
              aria-label={`Remove gallery image ${index + 1}`}
              title={`Remove gallery image ${index + 1}`}
              onClick={() => onRemoveGalleryImage(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {galleryFiles.length < 6 && (
          <label className="border-2 border-dashed rounded flex items-center justify-center h-24 cursor-pointer hover:bg-accent focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
            <span className="sr-only">Add a gallery photo</span>
            <Plus className="h-6 w-6 text-muted-foreground" />
            <Input
              id="gallery"
              type="file"
              accept="image/*"
              multiple
              onChange={onGalleryChange}
              className="sr-only"
            />
          </label>
        )}
      </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="videoUrl">Video URL (optional)</Label>
        <Input
          id="videoUrl"
          value={videoUrl}
          onChange={(e) => onVideoUrlChange(e.target.value)}
          placeholder="e.g., YouTube or Vimeo link"
        />
      </div>
    </div>
  );
};
