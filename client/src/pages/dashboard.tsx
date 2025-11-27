import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Grid, List, Upload, Search, Filter, FolderPlus, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PhotoGrid } from "@/components/photo-grid";
import { PhotoList } from "@/components/photo-list";
import { UploadDropzone } from "@/components/upload-dropzone";
import { PhotoModal } from "@/components/photo-modal";
import { useUploadHandler } from "@/components/upload-handler";
import { CreateFolderDialog } from "@/components/create-folder-dialog";
import { FolderGrid } from "@/components/folder-grid";
import { Breadcrumb } from "@/components/breadcrumb";
import { api } from "@/lib/api";

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

type ViewMode = "grid" | "list";

import { useRoute } from "wouter";

export default function Dashboard() {
  const [match, params] = useRoute("/dashboard/folders/:folderId");
  const folderId = match ? params.folderId : null;

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { fileInputRef, onFileChange, triggerFileInput } = useUploadHandler(folderId);

  const { data: folderData } = useQuery<{ folder: any; ancestors: any[] }>({
    queryKey: ["/api/folders", folderId],
    queryFn: async () => {
      if (!folderId) return null;
      const response = await api.get(`/folders/${folderId}`);
      return response.data;
    },
    enabled: !!folderId,
  });

  const { data: photosData, isLoading } = useQuery<{ files: Photo[] }>({
    queryKey: ["/api/photos", folderId],
    queryFn: async () => {
      const response = await api.get(`/photos${folderId ? `?folderId=${folderId}` : ''}`);
      return response.data;
    }
  });

  const photos = photosData?.files || [];

  const filteredPhotos = photos.filter(photo =>
    (photo.originalName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="border-b border-border bg-card/30 backdrop-blur-sm">
        <div className="px-6 py-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              {folderId && folderData ? (
                <Breadcrumb
                  items={folderData.ancestors || []}
                  currentItem={folderData.folder}
                />
              ) : (
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold">My Photos</h1>
              <p className="text-muted-foreground mt-1">
                {photos?.length || 0} photos in your library
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CreateFolderDialog parentId={folderId} />
              <label htmlFor="file-upload-input">
                <Button asChild data-testid="button-upload">
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photos
                  </span>
                </Button>
              </label>
              <input
                id="file-upload-input"
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={onFileChange}
                data-testid="input-file-hidden"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search photos..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" data-testid="button-filter">
                <Filter className="h-4 w-4" />
              </Button>
              <div className="flex items-center border border-border rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("grid")}
                  data-testid="button-view-grid"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("list")}
                  data-testid="button-view-list"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-6 overflow-y-auto">
          <FolderGrid parentId={folderId} />

          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            </div>
          ) : filteredPhotos.length === 0 && !searchQuery ? (
            <UploadDropzone onTrigger={triggerFileInput} folderId={folderId} accept={{ 'image/*': [], 'video/*': [] }} />
          ) : filteredPhotos.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-heading font-semibold">No photos found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search terms
                  </p>
                </div>
                <Button variant="outline" onClick={() => setSearchQuery("")} data-testid="button-clear-search">
                  Clear Search
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {viewMode === "grid" ? (
                <PhotoGrid photos={filteredPhotos} onPhotoClick={setSelectedPhoto} />
              ) : (
                <PhotoList photos={filteredPhotos} onPhotoClick={setSelectedPhoto} />
              )}
            </>
          )}
        </div>
      </div>

      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          photos={filteredPhotos}
          onClose={() => setSelectedPhoto(null)}
          onNavigate={setSelectedPhoto}
        />
      )}
    </div>
  );
}
