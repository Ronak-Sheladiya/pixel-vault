import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface DeleteFileDialogProps {
    fileId: string;
    fileName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteFileDialog({
    fileId,
    fileName,
    open,
    onOpenChange,
}: DeleteFileDialogProps) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const deleteFileMutation = useMutation({
        mutationFn: async () => {
            await api.delete(`/files/${fileId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
            onOpenChange(false);
            toast({
                title: "File deleted",
                description: `File "${fileName}" has been deleted successfully.`,
            });
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Failed to delete file",
            });
        },
    });

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the file
                        "{fileName}" from your storage.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            deleteFileMutation.mutate();
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {deleteFileMutation.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
