import { useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useUploadHandler(folderId?: string | null) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const uploadProgressRef = useRef<(progress: number) => void>(() => { });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => formData.append("files", file));
      if (folderId) {
        formData.append("folderId", folderId);
      } // Changed from "photos" to "files"

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            uploadProgressRef.current(progress);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error("Upload failed"));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));

        xhr.open("POST", "/api/photos/upload");
        xhr.send(formData);
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      uploadProgressRef.current(0);
      toast({
        title: "Upload complete!",
        description: `Successfully uploaded ${data.length} ${data.length === 1 ? 'photo' : 'photos'}`,
      });
    },
    onError: () => {
      uploadProgressRef.current(0);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your photos",
        variant: "destructive",
      });
    },
  });

  const handleFiles = (files: File[]) => {
    if (files.length > 10) {
      toast({
        title: "Too many files",
        description: "You can upload up to 10 files at once",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(files);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const setProgressCallback = (callback: (progress: number) => void) => {
    uploadProgressRef.current = callback;
  };

  return {
    fileInputRef,
    uploadMutation,
    handleFiles,
    triggerFileInput,
    onFileChange,
    setProgressCallback,
  };
}
