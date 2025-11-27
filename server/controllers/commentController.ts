import { Request, Response } from 'express';
import { Comment } from '../models/Comment';
import { File } from '../models/File';
import { User } from '../models/User';
import { sendCommentMentionEmail } from '../services/emailService';

// Add Comment
export const addComment = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const { fileId } = req.params;
        const { text, parentId } = req.body;

        // Check if file exists
        const file = await File.findById(fileId);
        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        // Extract mentions (@username)
        const mentionRegex = /@(\w+)/g;
        const mentions = [];
        let match;

        while ((match = mentionRegex.exec(text)) !== null) {
            const user = await User.findOne({ email: match[1] });
            if (user) {
                mentions.push(user._id);
            }
        }

        const comment = new Comment({
            file: fileId,
            user: req.user.userId,
            text,
            parent: parentId || null,
            mentions,
        });

        await comment.save();

        // Send email notifications to mentioned users
        const commenter = await User.findById(req.user.userId);
        for (const mentionedUserId of mentions) {
            const mentionedUser = await User.findById(mentionedUserId);
            if (mentionedUser) {
                await sendCommentMentionEmail(
                    mentionedUser.email,
                    mentionedUser.firstName || 'there',
                    commenter?.firstName || 'Someone',
                    file.name,
                    text,
                    `${process.env.FRONTEND_URL}/file/${fileId}`
                );
            }
        }

        const populatedComment = await Comment.findById(comment._id)
            .populate('user', 'email firstName lastName')
            .populate('mentions', 'email firstName lastName');

        res.status(201).json({ comment: populatedComment });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ message: 'Failed to add comment' });
    }
};

// Get Comments
export const getComments = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const { fileId } = req.params;

        const comments = await Comment.find({ file: fileId })
            .populate('user', 'email firstName lastName')
            .populate('mentions', 'email firstName lastName')
            .sort({ createdAt: 1 });

        res.json({ comments });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ message: 'Failed to fetch comments' });
    }
};

// Update Comment
export const updateComment = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const { commentId } = req.params;
        const { text } = req.body;

        const comment = await Comment.findOne({
            _id: commentId,
            user: req.user.userId,
        });

        if (!comment) {
            res.status(404).json({ message: 'Comment not found or unauthorized' });
            return;
        }

        comment.text = text;
        comment.updatedAt = new Date();
        await comment.save();

        const populatedComment = await Comment.findById(comment._id)
            .populate('user', 'email firstName lastName')
            .populate('mentions', 'email firstName lastName');

        res.json({ comment: populatedComment });
    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({ message: 'Failed to update comment' });
    }
};

// Delete Comment
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const { commentId } = req.params;

        const comment = await Comment.findOne({
            _id: commentId,
            user: req.user.userId,
        });

        if (!comment) {
            res.status(404).json({ message: 'Comment not found or unauthorized' });
            return;
        }

        // Delete all replies
        await Comment.deleteMany({ parent: commentId });

        // Delete the comment
        await Comment.deleteOne({ _id: commentId });

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ message: 'Failed to delete comment' });
    }
};
