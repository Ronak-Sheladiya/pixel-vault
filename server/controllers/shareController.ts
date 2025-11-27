import { Request, Response } from 'express';
import { Share } from '../models/Share';
import { Folder } from '../models/Folder';
import { User } from '../models/User';
import { sendFolderSharedEmail, sendInvitationEmail } from '../services/emailService';
import { v4 as uuidv4 } from 'uuid';

// Share Folder with User
export const shareFolder = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const { folderId } = req.params;
        const { email, permission } = req.body;

        // Check if folder exists and user owns it
        const folder = await Folder.findOne({
            _id: folderId,
            owner: req.user.userId,
        });

        if (!folder) {
            res.status(404).json({ message: 'Folder not found' });
            return;
        }

        // Find user to share with
        const userToShareWith = await User.findOne({ email });

        if (!userToShareWith) {
            // User not found - Invite them
            console.log(`User ${email} not found, sending invitation`);

            // Check if already invited
            const existingInvite = await Share.findOne({
                folder: folderId,
                invitedEmail: email,
            });

            if (existingInvite) {
                // Update permission if already invited
                existingInvite.permission = permission;
                await existingInvite.save();
                res.json({ message: 'Invitation updated', share: existingInvite });
                return;
            }

            // Create pending share
            const share = new Share({
                folder: folderId,
                sharedBy: req.user.userId,
                sharedWith: null,
                invitedEmail: email,
                permission,
            });

            await share.save();

            // Send invitation email
            const sharer = await User.findById(req.user.userId);
            await sendInvitationEmail(
                email,
                sharer?.firstName || 'Someone',
                folder.name,
                permission
            );

            res.status(201).json({ message: 'Invitation sent successfully', share });
            return;
        }

        // Check if already shared
        const existingShare = await Share.findOne({
            folder: folderId,
            sharedWith: userToShareWith._id,
        });

        if (existingShare) {
            // Update permission
            existingShare.permission = permission;
            await existingShare.save();
            res.json({ message: 'Permission updated', share: existingShare });
            return;
        }

        // Create share
        const share = new Share({
            folder: folderId,
            sharedBy: req.user.userId,
            sharedWith: userToShareWith._id,
            permission,
        });

        await share.save();

        // Send email notification
        const sharer = await User.findById(req.user.userId);
        await sendFolderSharedEmail(
            email,
            userToShareWith.firstName || 'there',
            sharer?.firstName || 'Someone',
            folder.name,
            permission,
            `${process.env.FRONTEND_URL}/dashboard/${folderId}`
        );

        res.status(201).json({ message: 'Folder shared successfully', share });
    } catch (error) {
        console.error('Share folder error:', error);
        res.status(500).json({ message: 'Failed to share folder' });
    }
};

// Generate Public Link
export const generatePublicLink = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const { folderId } = req.params;
        const { permission, expiresIn } = req.body;

        const folder = await Folder.findOne({
            _id: folderId,
            owner: req.user.userId,
        });

        if (!folder) {
            res.status(404).json({ message: 'Folder not found' });
            return;
        }

        const publicLink = uuidv4();
        const linkExpires = expiresIn ? new Date(Date.now() + expiresIn) : undefined;

        const share = new Share({
            folder: folderId,
            sharedBy: req.user.userId,
            publicLink,
            linkExpires,
            permission: permission || 'view',
            isPublic: true,
        });

        await share.save();

        const shareUrl = `${process.env.FRONTEND_URL}/shared/${publicLink}`;

        res.status(201).json({
            message: 'Public link generated',
            shareUrl,
            share,
        });
    } catch (error) {
        console.error('Generate public link error:', error);
        res.status(500).json({ message: 'Failed to generate public link' });
    }
};

// Get Folder Members
export const getFolderMembers = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const { folderId } = req.params;

        const shares = await Share.find({ folder: folderId })
            .populate('sharedWith', 'email firstName lastName')
            .populate('sharedBy', 'email firstName lastName');

        res.json({ members: shares });
    } catch (error) {
        console.error('Get folder members error:', error);
        res.status(500).json({ message: 'Failed to fetch members' });
    }
};

// Remove Member
export const removeMember = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const { shareId } = req.params;

        const share = await Share.findById(shareId).populate('folder');

        if (!share) {
            res.status(404).json({ message: 'Share not found' });
            return;
        }

        // Check if user owns the folder
        const folder = share.folder as any;
        if (folder.owner.toString() !== req.user.userId) {
            res.status(403).json({ message: 'Only folder owner can remove members' });
            return;
        }

        await Share.deleteOne({ _id: shareId });

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ message: 'Failed to remove member' });
    }
};

// Update Permission
export const updatePermission = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const { shareId } = req.params;
        const { permission } = req.body;

        const share = await Share.findById(shareId).populate('folder');

        if (!share) {
            res.status(404).json({ message: 'Share not found' });
            return;
        }

        // Check if user owns the folder
        const folder = share.folder as any;
        if (folder.owner.toString() !== req.user.userId) {
            res.status(403).json({ message: 'Only folder owner can update permissions' });
            return;
        }

        share.permission = permission;
        await share.save();

        res.json({ message: 'Permission updated', share });
    } catch (error) {
        console.error('Update permission error:', error);
        res.status(500).json({ message: 'Failed to update permission' });
    }
};

// Get Shared Folders (folders shared with me)
export const getSharedFolders = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const shares = await Share.find({ sharedWith: req.user.userId })
            .populate('folder')
            .populate('sharedBy', 'email firstName lastName');

        res.json({ sharedFolders: shares });
    } catch (error) {
        console.error('Get shared folders error:', error);
        res.status(500).json({ message: 'Failed to fetch shared folders' });
    }
};
