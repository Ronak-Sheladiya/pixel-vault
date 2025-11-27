import mongoose from 'mongoose';

export interface IComment extends mongoose.Document {
    file: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    text: string;
    mentions: mongoose.Types.ObjectId[];
    parent: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const commentSchema = new mongoose.Schema<IComment>({
    file: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null,
    },
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
commentSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Create indexes
commentSchema.index({ file: 1, parent: 1 });

export const Comment = mongoose.model<IComment>('Comment', commentSchema);
