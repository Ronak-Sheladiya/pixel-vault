import { useState } from "react";
import { MoreVertical, Download, Trash2, FolderInput, FileImage, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { RenameFileDialog } from "@/components/rename-file-dialog";
import { DeleteFileDialog } from "@/components/delete-file-dialog";

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

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo) => void;
}

export function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null);
  const [renamingFile, setRenamingFile] = useState<Photo | null>(null);
  const [deletingFile, setDeletingFile] = useState<Photo | null>(null);
  const { toast } = useToast();

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

  const handleDownload = (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    // Create a temporary anchor element to trigger download
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
    });
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {photos.map((photo) => (
          <Card
            key={photo._id}
            className="group relative overflow-hidden hover-elevate active-elevate-2 cursor-pointer transition-all duration-200"
            onClick={() => onPhotoClick(photo)}
            onMouseEnter={() => setHoveredPhoto(photo._id)}
            onMouseLeave={() => setHoveredPhoto(null)}
            data-testid={`photo-card-${photo._id}`}
          >
            <div className="aspect-square bg-muted relative overflow-hidden">
              {/* Display actual image/video from R2 */}
              {photo.r2Url || photo.filename ? (
                photo.mimeType?.startsWith('video/') ? (
                  <video
                    src={photo.r2Url || `https://storage-project.c56a0b5deb7568b708edf3a06756423d.r2.cloudflarestorage.com/${photo.filename}`}
                    className="absolute inset-0 w-full h-full object-contain bg-black"
                    preload="metadata"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                    }}
                  />
                ) : (
                  <img
                    src={photo.r2Url || `https://storage-project.c56a0b5deb7568b708edf3a06756423d.r2.cloudflarestorage.com/${photo.filename}`}
                    alt={photo.originalName}
                    className="absolute inset-0 w-full h-full object-contain"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                    }}
                  />
                )
              ) : null}
              {/* Fallback placeholder */}
              <div className={`fallback-icon absolute inset-0 bg-gradient-to-br from-primary/20 to-chart-2/20 flex items-center justify-center ${photo.filename ? 'hidden' : ''}`}>
                <FileImage className="h-24 w-24 text-muted-foreground/20" />
              </div>

              {(hoveredPhoto === photo._id || selectedPhotos.has(photo._id)) && (
                <>
                  {/* Removed dark gradient overlay as requested */}

                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedPhotos.has(photo._id)}
                      onClick={(e) => togglePhotoSelection(photo._id, e as any)}
                      className="bg-background border-2"
                      data-testid={`checkbox-photo-${photo._id}`}
                    />
                  </div>

                  <div className="absolute top-2 right-2 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 bg-background/90 backdrop-blur-sm"
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
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); setRenamingFile(photo); }}
                          data-testid={`menu-rename-${photo._id}`}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem data-testid={`menu-move-${photo._id}`}>
                          <FolderInput className="mr-2 h-4 w-4" />
                          Move to folder
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); setDeletingFile(photo); }}
                          data-testid={`menu-delete-${photo._id}`}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {photo.originalName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(photo.size)} • {formatDate(photo.uploadedAt)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      {renamingFile && (
        <RenameFileDialog
          fileId={renamingFile._id}
          currentName={renamingFile.originalName}
          open={!!renamingFile}
          onOpenChange={(open) => !open && setRenamingFile(null)}
        />
      )}

      {deletingFile && (
        <DeleteFileDialog
          fileId={deletingFile._id}
          fileName={renamingFile?.originalName || deletingFile.originalName}
          open={!!deletingFile}
          onOpenChange={(open) => !open && setDeletingFile(null)}
        />
      )}
    </>
  );
}
