import { Request, Response } from 'express';
import { File } from '../models/File';
import { User } from '../models/User';
import { getGlobalStorage } from '../models/GlobalStorage';
import { uploadToR2, deleteFromR2, getSignedR2Url, getFileStream } from '../services/storageService';
import sharp from 'sharp';
import { Readable } from 'stream';

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

        // Check against GLOBAL storage limit (9GB total for all users)
        const globalStorage = await getGlobalStorage();
        if (globalStorage.totalUsed + totalSize > globalStorage.totalLimit) {
            res.status(413).json({
                message: 'Global storage full! Cannot upload files. The system has reached its 9GB total storage limit.',
                globalStorageUsed: globalStorage.totalUsed,
                globalStorageLimit: globalStorage.totalLimit,
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

        // Update global storage
        const updatedGlobalStorage = await getGlobalStorage();
        updatedGlobalStorage.totalUsed += totalSize;
        updatedGlobalStorage.lastUpdated = new Date();
        await updatedGlobalStorage.save();

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

        // Use proxy URL instead of signed URL
        const filesWithProxyUrls = files.map((file) => {
            const fileObj = file.toObject();
            // Point to our own backend proxy
            // Note: We use the file ID to fetch the content
            fileObj.r2Url = `/api/files/${file._id}/content`;
            return fileObj;
        });

        res.json({ files: filesWithProxyUrls });
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
        // Use proxy URL
        fileObj.r2Url = `/api/files/${file._id}/content`;

        res.json({ file: fileObj });
    } catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({ message: 'Failed to fetch file' });
    }
};

// Serve File Content (Proxy)
export const serveFileContent = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log(`[DEBUG] serveFileContent called for ID: ${req.params.id}`);
        console.log(`[DEBUG] Auth status: ${req.user ? 'Authenticated' : 'Not Authenticated'}`);
        console.log(`[DEBUG] Headers:`, JSON.stringify(req.headers));

        // Note: We might want to allow public access for shared links in the future,
        // but for now, let's require auth or implement a shared token check.
        // If the middleware didn't find a user, we can't serve private files.
        // if (!req.user) {
        //      res.status(401).json({ message: 'Authentication required' });
        //      return;
        // }

        const file = await File.findOne({
            _id: req.params.id,
            // owner: req.user.userId // Disabled owner check for debugging
        });

        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        if (!file.r2Key) {
            res.status(404).json({ message: 'File content not found' });
            return;
        }

        // Get stream from R2
        const { Body, ContentType, ContentLength } = await getFileStream(file.r2Key);

        // Set headers
        if (ContentType) res.setHeader('Content-Type', ContentType);
        if (ContentLength) res.setHeader('Content-Length', ContentLength);

        // Cache control for better performance
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year

        // Pipe stream to response
        if (Body instanceof Readable) {
            Body.pipe(res);
        } else {
            // Fallback if not a stream (e.g. Buffer/Blob/String)
            res.send(Body);
        }

    } catch (error) {
        console.error('Serve file content error:', error);
        res.status(500).json({ message: 'Failed to serve file content' });
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

        // Update global storage
        const globalStorage = await getGlobalStorage();
        globalStorage.totalUsed = Math.max(0, globalStorage.totalUsed - file.size);
        globalStorage.lastUpdated = new Date();
        await globalStorage.save();

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
