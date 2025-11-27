import { MoreVertical, Download, Trash2, FolderInput, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Photo {
  _id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  r2Url: string;
  folderId?: string;
}

interface PhotoListProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo) => void;
}

export function PhotoList({ photos, onPhotoClick }: PhotoListProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (photoId: string) => {
      await apiRequest("DELETE", `/api/photos/${photoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      toast({
        title: "Photo deleted",
        description: "The photo has been removed from your library",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "There was an error deleting the photo",
        variant: "destructive",
      });
    },
  });

  const togglePhotoSelection = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPhotos(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const handleDelete = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this photo?")) {
      deleteMutation.mutate(photoId);
    }
  };

  const handleDownload = (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = photo.r2Url || `https://storage-project.c56a0b5deb7568b708edf3a06756423d.r2.cloudflarestorage.com/${photo.filename}`;
    link.download = photo.originalName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-2">
      {photos.map((photo) => (
        <Card
          key={photo._id}
          className="hover-elevate active-elevate-2 cursor-pointer transition-all"
          onClick={() => onPhotoClick(photo)}
          data-testid={`photo-row-${photo._id}`}
        >
          <div className="flex items-center gap-4 p-4">
            <Checkbox
              checked={selectedPhotos.has(photo._id)}
              onClick={(e) => togglePhotoSelection(photo._id, e as any)}
              data-testid={`checkbox-photo-${photo._id}`}
            />

            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden relative">
              {photo.mimeType.startsWith('image/') ? (
                <img
                  src={photo.r2Url || `https://storage-project.c56a0b5deb7568b708edf3a06756423d.r2.cloudflarestorage.com/${photo.filename}`}
                  alt={photo.originalName}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                  }}
                />
              ) : photo.mimeType.startsWith('video/') ? (
                <video
                  src={photo.r2Url || `https://storage-project.c56a0b5deb7568b708edf3a06756423d.r2.cloudflarestorage.com/${photo.filename}`}
                  className="w-full h-full object-contain bg-black"
                  preload="metadata"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`fallback-icon ${photo.mimeType.startsWith('image/') || photo.mimeType.startsWith('video/') ? 'hidden' : ''} flex items-center justify-center w-full h-full`}>
                <FileImage className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{photo.originalName}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(photo.size)} • {photo.mimeType}
              </p>
            </div>

            <div className="hidden md:block text-sm text-muted-foreground">
              {formatDate(photo.uploadedAt)}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid={`button-menu-${photo._id}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => handleDownload(photo, e)}
                  data-testid={`menu-download-${photo._id}`}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem data-testid={`menu-move-${photo._id}`}>
                  <FolderInput className="mr-2 h-4 w-4" />
                  Move to folder
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => handleDelete(photo._id, e as any)}
                  data-testid={`menu-delete-${photo._id}`}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      ))}
    </div>
  );
}
