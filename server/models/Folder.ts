import mongoose from 'mongoose';

export interface IFolder extends mongoose.Document {
    name: string;
    description?: string;
    owner: mongoose.Types.ObjectId;
    parent: mongoose.Types.ObjectId | null;
    path: string;
    color?: string;
    createdAt: Date;
    updatedAt: Date;
}

const folderSchema = new mongoose.Schema<IFolder>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: String,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null,
    },
    path: {
        type: String,
        default: '/',
    },
    color: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Update timestamp on save
folderSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Create indexes
folderSchema.index({ owner: 1, parent: 1 });
folderSchema.index({ parent: 1 });

export const Folder = mongoose.model<IFolder>('Folder', folderSchema);
