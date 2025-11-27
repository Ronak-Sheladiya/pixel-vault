import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, Trash2, Reply } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface CommentSectionProps {
    fileId: string;
}

interface Comment {
    _id: string;
    text: string;
    user: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    createdAt: string;
    parent: string | null;
}

export function CommentSection({ fileId }: CommentSectionProps) {
    const [text, setText] = useState("");
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: commentsData, isLoading } = useQuery<{ comments: Comment[] }>({
        queryKey: ["/api/comments", fileId],
        queryFn: async () => {
            const response = await api.get(`/comments/${fileId}`);
            return response.data;
        },
    });

    const addCommentMutation = useMutation({
        mutationFn: async ({ text, parentId }: { text: string; parentId?: string }) => {
            await api.post(`/comments/${fileId}`, { text, parentId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/comments", fileId] });
            setText("");
            setReplyTo(null);
            toast({
                title: "Comment added",
                description: "Your comment has been posted successfully.",
            });
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Failed to add comment",
            });
        },
    });

    const deleteCommentMutation = useMutation({
        mutationFn: async (commentId: string) => {
            await api.delete(`/comments/${commentId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/comments", fileId] });
            toast({
                title: "Comment deleted",
                description: "The comment has been removed.",
            });
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Failed to delete comment",
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        addCommentMutation.mutate({ text, parentId: replyTo || undefined });
    };

    const comments = commentsData?.comments || [];
    const rootComments = comments.filter(c => !c.parent);
    const getReplies = (parentId: string) => comments.filter(c => c.parent === parentId);

    const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
        const replies = getReplies(comment._id);

        return (
            <div className={`flex gap-3 ${isReply ? "ml-8 mt-2" : "mt-4"}`}>
                <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback>
                        {comment.user.firstName?.[0]}
                        {comment.user.lastName?.[0]}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                                {comment.user.firstName} {comment.user.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground"
                                onClick={() => setReplyTo(replyTo === comment._id ? null : comment._id)}
                            >
                                <Reply className="h-3 w-3" />
                            </Button>
                            {/* Add check for current user ownership if needed */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteCommentMutation.mutate(comment._id)}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                    <p className="text-sm text-foreground/90">{comment.text}</p>

                    {replyTo === comment._id && (
                        <div className="mt-2 flex gap-2">
                            <Textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Write a reply..."
                                className="min-h-[60px]"
                            />
                            <Button
                                size="icon"
                                className="h-[60px] w-[60px]"
                                onClick={handleSubmit}
                                disabled={addCommentMutation.isPending || !text.trim()}
                            >
                                {addCommentMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    )}

                    {replies.map(reply => (
                        <CommentItem key={reply._id} comment={reply} isReply />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto pr-2">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No comments yet. Be the first to share your thoughts!
                    </div>
                ) : (
                    <div className="space-y-4">
                        {rootComments.map((comment) => (
                            <CommentItem key={comment._id} comment={comment} />
                        ))}
                    </div>
                )}
            </div>

            {!replyTo && (
                <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex gap-2">
                        <Textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Add a comment..."
                            className="min-h-[80px]"
                        />
                        <Button
                            className="h-[80px] w-16"
                            onClick={handleSubmit}
                            disabled={addCommentMutation.isPending || !text.trim()}
                        >
                            {addCommentMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
