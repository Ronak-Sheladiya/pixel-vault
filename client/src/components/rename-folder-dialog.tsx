import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RenameFolderDialogProps {
    folderId: string;
    currentName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RenameFolderDialog({
    folderId,
    currentName,
    open,
    onOpenChange,
}: RenameFolderDialogProps) {
    const [name, setName] = useState(currentName);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            setName(currentName);
        }
    }, [open, currentName]);

    const renameFolderMutation = useMutation({
        mutationFn: async (newName: string) => {
            const response = await api.patch(`/folders/${folderId}`, {
                name: newName,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
            onOpenChange(false);
            toast({
                title: "Folder renamed",
                description: `Folder has been renamed to "${name}" successfully.`,
            });
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Failed to rename folder",
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || name === currentName) return;
        renameFolderMutation.mutate(name);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Rename Folder</DialogTitle>
                        <DialogDescription>
                            Enter a new name for the folder.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="rename-name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="rename-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                placeholder="Folder Name"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={renameFolderMutation.isPending || !name.trim() || name === currentName}
                        >
                            {renameFolderMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Rename
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
