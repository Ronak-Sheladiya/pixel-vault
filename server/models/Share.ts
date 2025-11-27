import mongoose from 'mongoose';

export interface IShare extends mongoose.Document {
    folder: mongoose.Types.ObjectId;
    sharedBy: mongoose.Types.ObjectId;
    sharedWith: mongoose.Types.ObjectId | null;
    invitedEmail?: string;
    permission: 'view' | 'edit' | 'admin';
    publicLink?: string;
    linkExpires?: Date;
    isPublic: boolean;
    createdAt: Date;
}

const shareSchema = new mongoose.Schema<IShare>({
    folder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        required: true,
    },
    sharedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    sharedWith: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    invitedEmail: String,
    permission: {
        type: String,
        enum: ['view', 'edit', 'admin'],
        default: 'view',
    },
    publicLink: String,
    linkExpires: Date,
    isPublic: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Create indexes
shareSchema.index({ folder: 1, sharedWith: 1 });
shareSchema.index({ publicLink: 1 });

export const Share = mongoose.model<IShare>('Share', shareSchema);
