import { Request, Response } from 'express';
import { Folder } from '../models/Folder';
import { File } from '../models/File';
import { deleteFromR2 } from '../services/storageService';

// Create Folder
export const createFolder = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const { name, description, parentId, color } = req.body;

        // Build path
        let path = '/';
        if (parentId) {
            const parentFolder = await Folder.findOne({
                _id: parentId,
                owner: req.user.userId,
            });

            if (!parentFolder) {
                res.status(404).json({ message: 'Parent folder not found' });
                return;
            }

            path = `${parentFolder.path}${parentFolder.name}/`;
        }

        const folder = new Folder({
            name,
            description,
            owner: req.user.userId,
            parent: parentId || null,
            path,
            color,
        });

        await folder.save();

        res.status(201).json({ folder });
    } catch (error) {
        console.error('Create folder error:', error);
        res.status(500).json({ message: 'Failed to create folder' });
    }
};

// Get Folders
export const getFolders = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const { parentId } = req.query;

        const folders = await Folder.find({
            owner: req.user.userId,
            parent: parentId || null,
        }).sort({ createdAt: -1 });

        res.json({ folders });
    } catch (error) {
        console.error('Get folders error:', error);
        res.status(500).json({ message: 'Failed to fetch folders' });
    }
};

// Get Single Folder
export const getFolder = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const folder = await Folder.findOne({
            _id: req.params.id,
            owner: req.user.userId,
        });

        if (!folder) {
            res.status(404).json({ message: 'Folder not found' });
            return;
        }

        // Fetch ancestors
        const ancestors = [];
        let currentParentId = folder.parent;
        while (currentParentId) {
            const parent = await Folder.findOne({ _id: currentParentId });
            if (parent) {
                ancestors.unshift({ _id: parent._id, name: parent.name });
                currentParentId = parent.parent;
            } else {
                break;
            }
        }

        res.json({ folder, ancestors });
    } catch (error) {
        console.error('Get folder error:', error);
        res.status(500).json({ message: 'Failed to fetch folder' });
    }
};

// Update Folder
export const updateFolder = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const { name, description, color } = req.body;

        const folder = await Folder.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.userId },
            { name, description, color, updatedAt: new Date() },
            { new: true }
        );

        if (!folder) {
            res.status(404).json({ message: 'Folder not found' });
            return;
        }

        res.json({ folder });
    } catch (error) {
        console.error('Update folder error:', error);
        res.status(500).json({ message: 'Failed to update folder' });
    }
};

// Delete Folder
export const deleteFolder = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const folder = await Folder.findOne({
            _id: req.params.id,
            owner: req.user.userId,
        });

        if (!folder) {
            res.status(404).json({ message: 'Folder not found' });
            return;
        }

        // Helper to delete files in a folder from R2
        const deleteFolderFiles = async (folderId: string) => {
            const files = await File.find({ folder: folderId });
            for (const file of files) {
                try {
                    await deleteFromR2(file.r2Key);
                } catch (err) {
                    console.error(`Failed to delete file ${file._id} from R2:`, err);
                }
            }
            await File.deleteMany({ folder: folderId });
        };

        // Delete all subfolders recursively
        const deleteSubfolders = async (folderId: string) => {
            const subfolders = await Folder.find({ parent: folderId });
            for (const subfolder of subfolders) {
                await deleteSubfolders(subfolder._id.toString());
                await deleteFolderFiles(subfolder._id.toString());
                await Folder.deleteOne({ _id: subfolder._id });
            }
        };

        // Delete subfolders and their files
        await deleteSubfolders(folder._id.toString());

        // Delete files in the current folder
        await deleteFolderFiles(folder._id.toString());

        // Delete the folder itself
        await Folder.deleteOne({ _id: folder._id });

        res.json({ message: 'Folder deleted successfully' });
    } catch (error) {
        console.error('Delete folder error:', error);
        res.status(500).json({ message: 'Failed to delete folder' });
    }
};

// Move Folder
export const moveFolder = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const { parentId } = req.body;

        // Build new path
        let newPath = '/';
        if (parentId) {
            const parentFolder = await Folder.findOne({
                _id: parentId,
                owner: req.user.userId,
            });

            if (!parentFolder) {
                res.status(404).json({ message: 'Parent folder not found' });
                return;
            }

            newPath = `${parentFolder.path}${parentFolder.name}/`;
        }

        const folder = await Folder.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.userId },
            { parent: parentId || null, path: newPath, updatedAt: new Date() },
            { new: true }
        );

        if (!folder) {
            res.status(404).json({ message: 'Folder not found' });
            return;
        }

        res.json({ folder });
    } catch (error) {
        console.error('Move folder error:', error);
        res.status(500).json({ message: 'Failed to move folder' });
    }
};
