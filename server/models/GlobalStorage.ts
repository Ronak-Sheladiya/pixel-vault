import mongoose from 'mongoose';

export interface IGlobalStorage extends mongoose.Document {
    totalUsed: number;
    totalLimit: number;
    lastUpdated: Date;
}

const globalStorageSchema = new mongoose.Schema<IGlobalStorage>({
    totalUsed: {
        type: Number,
        default: 0,
    },
    totalLimit: {
        type: Number,
        default: 9 * 1024 * 1024 * 1024, // 9GB total for all users
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
});

export const GlobalStorage = mongoose.model<IGlobalStorage>('GlobalStorage', globalStorageSchema);

// Helper function to get or create global storage document
export async function getGlobalStorage(): Promise<IGlobalStorage> {
    let storage = await GlobalStorage.findOne();

    if (!storage) {
        storage = new GlobalStorage({
            totalUsed: 0,
            totalLimit: 9 * 1024 * 1024 * 1024,
        });
        await storage.save();
    }

    return storage;
}
