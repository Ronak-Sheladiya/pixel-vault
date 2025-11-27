import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, Share2, Info } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { useState } from "react";

interface FilePreviewModalProps {
    file: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FilePreviewModal({ file, open, onOpenChange }: FilePreviewModalProps) {
    const [showInfo, setShowInfo] = useState(false);

    if (!file) return null;

    const isImage = file.mimeType?.startsWith("image/");
    const isVideo = file.mimeType?.startsWith("video/");

    // Construct R2 URL
    const fileUrl = file.r2Url || (file.filename
        ? `https://storage-project.c56a0b5deb7568b708edf3a06756423d.r2.cloudflarestorage.com/${file.filename}`
        : "");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-full h-[80vh] p-0 bg-black/95 border-none text-white overflow-hidden flex flex-col">
                <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/70 hover:text-white hover:bg-white/10"
                        onClick={() => setShowInfo(!showInfo)}
                    >
                        <Info className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/70 hover:text-white hover:bg-white/10"
                        onClick={() => window.open(fileUrl, "_blank")}
                    >
                        <Download className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/70 hover:text-white hover:bg-white/10"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                <div className="flex-1 flex items-center justify-center p-4 relative">
                    {isImage && (
                        <img
                            src={fileUrl}
                            alt={file.originalName}
                            className="max-w-full max-h-full object-contain"
                        />
                    )}
                    {isVideo && (
                        <video
                            src={fileUrl}
                            controls
                            className="max-w-full max-h-full"
                            autoPlay
                        />
                    )}
                    {!isImage && !isVideo && (
                        <div className="text-center">
                            <p className="text-lg mb-2">Preview not available</p>
                            <Button variant="outline" onClick={() => window.open(fileUrl, "_blank")}>
                                Download File
                            </Button>
                        </div>
                    )}
                </div>

                {showInfo && (
                    <div className="absolute right-0 top-0 bottom-0 w-80 bg-background/95 backdrop-blur border-l border-border p-6 text-foreground transform transition-transform">
                        <h3 className="font-heading font-semibold text-lg mb-6">File Details</h3>

                        <div className="space-y-6">
                            <div>
                                <label className="text-sm text-muted-foreground block mb-1">Name</label>
                                <p className="font-medium break-all">{file.originalName}</p>
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground block mb-1">Size</label>
                                <p className="font-medium">{formatBytes(file.size)}</p>
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground block mb-1">Type</label>
                                <p className="font-medium">{file.mimeType}</p>
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground block mb-1">Uploaded</label>
                                <p className="font-medium">
                                    {new Date(file.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
