import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Folder, MoreVertical, Pencil, Trash2, Share2 } from "lucide-react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RenameFolderDialog } from "@/components/rename-folder-dialog";
import { DeleteFolderDialog } from "@/components/delete-folder-dialog";
import { ShareDialog } from "@/components/share-dialog";

interface FolderGridProps {
  parentId?: string | null;
}

interface FolderData {
  _id: string;
  name: string;
  parentId: string | null;
  path: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export function FolderGrid({ parentId = null }: FolderGridProps) {
  const [renamingFolder, setRenamingFolder] = useState<FolderData | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<FolderData | null>(null);
  const [sharingFolder, setSharingFolder] = useState<FolderData | null>(null);

  const { data: folders, isLoading } = useQuery<FolderData[]>({
    queryKey: ["/api/folders", parentId],
    queryFn: async () => {
      const response = await api.get(`/folders${parentId ? `?parentId=${parentId}` : ''}`);
      return response.data.folders;
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!folders?.length) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4">Folders</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {folders.map((folder) => (
          <div key={folder._id} className="relative group">
            <Link href={`/dashboard/folders/${folder._id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-dashed h-full">
                <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
                  <Folder
                    className="h-10 w-10"
                    style={{
                      color: folder.color || '#3b82f6',
                      fill: (folder.color || '#3b82f6') + '33' // 20% opacity
                    }}
                  />
                  <span className="font-medium text-sm truncate w-full text-center">
                    {folder.name}
                  </span>
                </CardContent>
              </Card>
            </Link>

            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSharingFolder(folder)}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRenamingFolder(folder)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeletingFolder(folder)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {sharingFolder && (
        <ShareDialog
          folderId={sharingFolder._id}
          folderName={sharingFolder.name}
          open={!!sharingFolder}
          onOpenChange={(open) => !open && setSharingFolder(null)}
        />
      )}

      {renamingFolder && (
        <RenameFolderDialog
          folderId={renamingFolder._id}
          currentName={renamingFolder.name}
          open={!!renamingFolder}
          onOpenChange={(open) => !open && setRenamingFolder(null)}
        />
      )}

      {deletingFolder && (
        <DeleteFolderDialog
          folderId={deletingFolder._id}
          folderName={deletingFolder.name}
          open={!!deletingFolder}
          onOpenChange={(open) => !open && setDeletingFolder(null)}
        />
      )}
    </div>
  );
}
