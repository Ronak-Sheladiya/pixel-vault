import mongoose from 'mongoose';

export interface IFile extends mongoose.Document {
    name: string;
    originalName: string;
    type: 'image' | 'video';
    mimeType: string;
    size: number;
    r2Key: string;
    r2Url: string;
    folder: mongoose.Types.ObjectId | null;
    owner: mongoose.Types.ObjectId;
    uploadedAt: Date;
    metadata: {
        width?: number;
        height?: number;
        duration?: number;
        dimensions?: string;
    };
}

const fileSchema = new mongoose.Schema<IFile>({
    name: {
        type: String,
        required: true,
    },
    originalName: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['image', 'video'],
        required: true,
    },
    mimeType: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        required: true,
    },
    r2Key: {
        type: String,
        required: true,
    },
    r2Url: {
        type: String,
        required: true,
    },
    folder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
    },
    metadata: {
        width: Number,
        height: Number,
        duration: Number,
        dimensions: String,
    },
});

// Create indexes
fileSchema.index({ owner: 1, folder: 1 });
fileSchema.index({ folder: 1 });
fileSchema.index({ name: 'text' });

export const File = mongoose.model<IFile>('File', fileSchema);
