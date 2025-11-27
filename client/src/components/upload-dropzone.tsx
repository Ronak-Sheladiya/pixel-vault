import { useState, useEffect } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useUploadHandler } from "./upload-handler";

interface UploadDropzoneProps {
  onTrigger?: () => void;
  folderId?: string | null;
  accept?: Record<string, string[]>;
}

export function UploadDropzone({ onTrigger, folderId, accept }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const { uploadMutation, handleFiles, setProgressCallback } = useUploadHandler(folderId);

  useEffect(() => {
    setProgressCallback(setUploadProgress);
  }, [setProgressCallback]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith("image/") || file.type.startsWith("video/")
    );

    if (files.length > 0) {
      handleDropFiles(files);
    } else {
      toast({
        title: "Invalid files",
        description: "Please upload image or video files only",
        variant: "destructive",
      });
    }
  };

  const handleDropFiles = (files: File[]) => {
    handleFiles(files);
  };

  return (
    <Card
      className={`relative border-2 border-dashed transition-all duration-300 ${isDragging
        ? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
        : "border-border hover-elevate"
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="dropzone-upload"
    >
      <div className="p-12 md:p-20 text-center space-y-6">
        <div className="flex justify-center">
          <div className={`h-24 w-24 rounded-full flex items-center justify-center transition-all ${isDragging ? "bg-primary/20 scale-110" : "bg-muted"
            }`}>
            {isDragging ? (
              <Upload className="h-12 w-12 text-primary animate-bounce" />
            ) : (
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
        </div>

        {uploadMutation.isPending ? (
          <div className="space-y-4 max-w-md mx-auto">
            <h3 className="text-xl font-heading font-semibold">Uploading...</h3>
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-sm text-muted-foreground">{uploadProgress}% complete</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <h3 className="text-2xl font-heading font-semibold">
                {isDragging ? "Drop photos here" : "Upload your photos"}
              </h3>
              <p className="text-muted-foreground">
                Drag and drop your images here, or click to browse
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={onTrigger}
                data-testid="button-browse-files"
              >
                <Upload className="mr-2 h-5 w-5" />
                Browse Files
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-sm text-muted-foreground">
              <span>Supports: Images & Videos</span>
              <span>•</span>
              <span>Max size: 10MB per file</span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
