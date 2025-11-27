import { X, ChevronLeft, ChevronRight, Download, Trash2, Share2, FileImage, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CommentSection } from "@/components/comment-section";

interface Photo {
  _id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  r2Url: string;
}

interface PhotoModalProps {
  photo: Photo;
  photos: Photo[];
  onClose: () => void;
  onNavigate: (photo: Photo) => void;
}

export function PhotoModal({ photo, photos, onClose, onNavigate }: PhotoModalProps) {
  const currentIndex = photos.findIndex(p => p._id === photo._id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;
  const { toast } = useToast();
  const [showSidebar, setShowSidebar] = useState(true);

  const deleteMutation = useMutation({
    mutationFn: async (photoId: string) => {
      await apiRequest("DELETE", `/api/photos/${photoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      onClose();
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

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this photo?")) {
      deleteMutation.mutate(photo._id);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrevious) {
        onNavigate(photos[currentIndex - 1]);
      }
      if (e.key === "ArrowRight" && hasNext) {
        onNavigate(photos[currentIndex + 1]);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, hasPrevious, hasNext, onClose, onNavigate, photos]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownload = async () => {
    try {
      const url = photo.r2Url || `https://storage-project.c56a0b5deb7568b708edf3a06756423d.r2.cloudflarestorage.com/${photo.filename}`;
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = photo.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);

      toast({
        title: "Download started",
        description: `Downloading ${photo.originalName}`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the file",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg flex"
      onClick={onClose}
      data-testid="modal-photo"
    >
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${showSidebar ? 'mr-80' : ''}`}>
        <div className="border-b border-border bg-card/30 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold truncate" data-testid="text-photo-name">
                {photo.originalName}
              </h2>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(photo.size)} • {formatDate(photo.uploadedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); setShowSidebar(!showSidebar); }}
                className={showSidebar ? "bg-accent" : ""}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                data-testid="button-close-modal"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <div
          className="flex-1 flex items-center justify-center p-8 relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {hasPrevious && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-8 h-12 w-12 rounded-full shadow-lg z-10"
              onClick={() => onNavigate(photos[currentIndex - 1])}
              data-testid="button-previous-photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          <div className="max-w-full max-h-full flex items-center justify-center w-full h-full">
            {photo.mimeType?.startsWith("image/") ? (
              <img
                src={photo.r2Url || `https://storage-project.c56a0b5deb7568b708edf3a06756423d.r2.cloudflarestorage.com/${photo.filename}`}
                alt={photo.originalName}
                className="max-w-full max-h-full object-contain"
              />
            ) : photo.mimeType?.startsWith("video/") ? (
              <video
                src={photo.r2Url || `https://storage-project.c56a0b5deb7568b708edf3a06756423d.r2.cloudflarestorage.com/${photo.filename}`}
                controls
                className="max-w-full max-h-full"
                autoPlay
              />
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-muted border-2 border-border shadow-2xl">
                <div className="aspect-video w-full max-w-4xl bg-gradient-to-br from-primary/20 to-chart-2/20 flex items-center justify-center p-20">
                  <FileImage className="h-48 w-48 text-muted-foreground/30" />
                </div>
              </div>
            )}
          </div>

          {hasNext && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-8 h-12 w-12 rounded-full shadow-lg z-10"
              onClick={() => onNavigate(photos[currentIndex + 1])}
              data-testid="button-next-photo"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}
        </div>

        <div
          className="border-t border-border bg-card/30 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-center gap-2 px-6 py-4">
            <Button
              variant="outline"
              onClick={handleDownload}
              data-testid="button-download-photo"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" data-testid="button-share-photo" onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: photo.originalName,
                  text: `Check out this file: ${photo.originalName}`,
                  url: photo.r2Url || window.location.href,
                }).catch(() => {
                  // Fallback: copy link to clipboard
                  navigator.clipboard.writeText(photo.r2Url || window.location.href);
                  toast({
                    title: "Link copied",
                    description: "File link copied to clipboard",
                  });
                });
              } else {
                // Fallback: copy link to clipboard
                navigator.clipboard.writeText(photo.r2Url || window.location.href);
                toast({
                  title: "Link copied",
                  description: "File link copied to clipboard",
                });
              }
            }}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button
              variant="outline"
              className="text-destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-photo"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-80 bg-background border-l border-border transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${showSidebar ? 'translate-x-0' : 'translate-x-full'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Comments</h3>
          <Button variant="ghost" size="icon" onClick={() => setShowSidebar(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-hidden p-4">
          <CommentSection fileId={photo._id} />
        </div>
      </div>
    </div>
  );
}
