import { Request, Response } from 'express';
import { File } from '../models/File';
import { User } from '../models/User';
import { uploadToR2, deleteFromR2, getSignedR2Url } from '../services/storageService';
import sharp from 'sharp';

// Upload Files
export const uploadFiles = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            res.status(400).json({ message: 'No files uploaded' });
            return;
        }

        const { folderId } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const uploadedFiles = [];
        let totalSize = 0;

        // Calculate total size of files to upload
        for (const file of req.files as Express.Multer.File[]) {
            totalSize += file.size;
        }

        // Check if upload would exceed storage limit
        if (user.storageUsed + totalSize > user.storageLimit) {
            res.status(413).json({
                message: 'Storage full! Cannot upload files. You have reached your 9GB storage limit.',
                storageUsed: user.storageUsed,
                storageLimit: user.storageLimit,
                requiredSpace: totalSize
            });
            return;
        }

        for (const file of req.files as Express.Multer.File[]) {
            try {
                // Strict MIME type validation
                if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
                    throw new Error(`Invalid file type: ${file.mimetype}. Only images and videos are allowed.`);
                }

                // Determine file type
                const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';

                // Get image metadata if it's an image
                let metadata: any = {};
                if (fileType === 'image') {
                    const imageMetadata = await sharp(file.buffer).metadata();
                    metadata = {
                        width: imageMetadata.width,
                        height: imageMetadata.height,
                        dimensions: `${imageMetadata.width}x${imageMetadata.height}`,
                    };
                }

                // Upload to R2
                const uploadResult = await uploadToR2(file, req.user.userId);

                // Create file record
                const newFile = new File({
                    name: file.originalname,
                    originalName: file.originalname,
                    type: fileType,
                    mimeType: file.mimetype,
                    size: file.size,
                    r2Key: uploadResult.key,
                    r2Url: uploadResult.url,
                    folder: folderId || null,
                    owner: req.user.userId,
                    metadata,
                });

                await newFile.save();

                // Update user storage
                user.storageUsed += file.size;
                totalSize += file.size;

                uploadedFiles.push(newFile);
            } catch (error: any) {
                console.error('❌ Failed to process file:', file.originalname);
                console.error('Error details:', error.message);
            }
        }

        if (uploadedFiles.length === 0) {
            console.error('❌ No files were uploaded successfully');
            res.status(400).json({ message: 'Failed to upload any files. Ensure they are images or videos.' });
            return;
        }

        await user.save();

        res.status(201).json({
            message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
            files: uploadedFiles,
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message || 'Upload failed' });
    }
};

// Get Files
export const getFiles = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const { folderId } = req.query;
        console.log(`[DEBUG] getFiles - User: ${req.user.userId}, Folder: ${folderId}`);

        const query = {
            owner: req.user.userId,
            folder: folderId || null,
        };
        console.log('[DEBUG] Query:', JSON.stringify(query));

        const files = await File.find(query).sort({ uploadedAt: -1 });
        console.log(`[DEBUG] Found ${files.length} files`);

        // Generate signed URLs for each file
        const filesWithSignedUrls = await Promise.all(files.map(async (file) => {
            const fileObj = file.toObject();
            if (file.r2Key) {
                fileObj.r2Url = await getSignedR2Url(file.r2Key);
            }
            return fileObj;
        }));

        res.json({ files: filesWithSignedUrls });
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ message: 'Failed to fetch files' });
    }
};

// Get Single File
export const getFile = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const file = await File.findOne({
            _id: req.params.id,
            owner: req.user.userId,
        });

        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        const fileObj = file.toObject();
        if (file.r2Key) {
            fileObj.r2Url = await getSignedR2Url(file.r2Key);
        }

        res.json({ file: fileObj });
    } catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({ message: 'Failed to fetch file' });
    }
};

// Delete File
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const file = await File.findOne({
            _id: req.params.id,
            owner: req.user.userId,
        });

        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        // Delete from R2
        await deleteFromR2(file.r2Key);

        // Update user storage
        const user = await User.findById(req.user.userId);
        if (user) {
            user.storageUsed = Math.max(0, user.storageUsed - file.size);
            await user.save();
        }

        // Delete file record
        await File.deleteOne({ _id: file._id });

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ message: 'Failed to delete file' });
    }
};

// Rename File
export const renameFile = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const { name } = req.body;

        const file = await File.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.userId },
            { name },
            { new: true }
        );

        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        res.json({ file });
    } catch (error) {
        console.error('Rename file error:', error);
        res.status(500).json({ message: 'Failed to rename file' });
    }
};

// Move File
export const moveFile = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const { folderId } = req.body;

        const file = await File.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.userId },
            { folder: folderId || null },
            { new: true }
        );

        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        res.json({ file });
    } catch (error) {
        console.error('Move file error:', error);
        res.status(500).json({ message: 'Failed to move file' });
    }
};
