import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Copy, Check, Trash2, UserPlus, Globe, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareDialogProps {
    folderId: string;
    folderName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface Member {
    _id: string;
    sharedWith: {
        _id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
    permission: "view" | "upload" | "admin";
}

export function ShareDialog({ folderId, folderName, open, onOpenChange }: ShareDialogProps) {
    const [email, setEmail] = useState("");
    const [permission, setPermission] = useState<"view" | "upload" | "admin">("view");
    const [copied, setCopied] = useState(false);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Fetch members
    const { data: members, isLoading: isLoadingMembers } = useQuery<{ members: Member[] }>({
        queryKey: ["/api/share/folder", folderId, "members"],
        queryFn: async () => {
            const response = await api.get(`/share/folder/${folderId}/members`);
            return response.data;
        },
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to share folder",
    });
    },

// Remove member mutation
const removeMemberMutation = useMutation({
    mutationFn: async (shareId: string) => {
        await api.delete(`/share/${shareId}`);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/share/folder", folderId, "members"] });
        toast({
            title: "Member removed",
            description: "Access has been revoked",
        });
    },
    onError: (error: any) => {
        toast({
            variant: "destructive",
            title: "Error",
            description: error.response?.data?.message || "Failed to remove member",
        },
});

// Generate public link mutation (placeholder logic for now as UI needs to support it)
// For this implementation, we'll focus on email sharing first as per requirements.

const handleCopyLink = () => {
    // This would be the public link if generated
    const link = `${window.location.origin}/shared/${folderId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
        title: "Link copied",
        description: "Folder link copied to clipboard",
    });
};

return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>Share "{folderName}"</DialogTitle>
                <DialogDescription>
                    Invite people to collaborate on this folder.
                </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="invite" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="invite">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite
                    </TabsTrigger>
                    <TabsTrigger value="members">
                        <Users className="mr-2 h-4 w-4" />
                        Members
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="invite" className="space-y-4 py-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Select
                            value={permission}
                            onValueChange={(value: any) => setPermission(value)}
                        >
                            <SelectTrigger className="w-[110px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="view">Viewer</SelectItem>
                                <SelectItem value="upload">Editor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={() => shareMutation.mutate()}
                            disabled={!email || shareMutation.isPending}
                        >
                            {shareMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Invite"
                            )}
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or share via link
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <div className="grid flex-1 gap-2">
                            <Label htmlFor="link" className="sr-only">
                                Link
                            </Label>
                            <Input
                                id="link"
                                defaultValue={`${window.location.origin}/shared/${folderId}`}
                                readOnly
                                className="h-9"
                            />
                        </div>
                        <Button type="submit" size="sm" className="px-3" onClick={handleCopyLink}>
                            {copied ? (
                                <Check className="h-4 w-4" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                            <span className="sr-only">Copy</span>
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="members" className="space-y-4 py-4">
                    {isLoadingMembers ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : members?.members?.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No members yet. Invite someone to get started!
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {members?.members?.map((member) => (
                                <div key={member._id} className="flex items-center justify-between space-x-4">
                                    <div className="flex items-center space-x-4">
                                        <Avatar>
                                            <AvatarImage src="" />
                                            <AvatarFallback>
                                                {member.sharedWith.firstName?.[0]}
                                                {member.sharedWith.lastName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium leading-none">
                                                {member.sharedWith.firstName} {member.sharedWith.lastName}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {member.sharedWith.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Select
                                            defaultValue={member.permission}
                                            onValueChange={(value) =>
                                                updatePermissionMutation.mutate({
                                                    shareId: member._id,
                                                    newPermission: value
                                                })
                                            }
                                        >
                                            <SelectTrigger className="w-[100px] h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="view">Viewer</SelectItem>
                                                <SelectItem value="upload">Editor</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => removeMemberMutation.mutate(member._id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </DialogContent>
    </Dialog>
);
}
