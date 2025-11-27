import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { File } from '../models/File';
import dotenv from 'dotenv';
import { connectDatabase } from '../config/database';

dotenv.config({ path: './server/.env' });

async function cleanupLocalFiles() {
    try {
        console.log('Connecting to database...');
        await connectDatabase();

        console.log('Scanning for local files...');
        // Find files that have a local URL (starting with /uploads/) or no r2Url
        const localFiles = await File.find({
            $or: [
                { r2Url: { $regex: /^\/uploads\// } },
                { r2Url: { $exists: false } },
                { r2Url: null }
            ]
        });

        console.log(`Found ${localFiles.length} local files to cleanup.`);

        let deletedCount = 0;
        let errorCount = 0;

        for (const file of localFiles) {
            try {
                // Delete from database
                await File.deleteOne({ _id: file._id });
                console.log(`Deleted record for: ${file.originalName}`);
                deletedCount++;

            } catch (error: any) {
                console.error(`Error processing file ${file._id}:`, error.message);
                errorCount++;
            }
        }

        console.log('Cleaning up uploads directory...');
        const uploadsDir = path.join(process.cwd(), 'uploads');
        try {
            const files = await fs.readdir(uploadsDir);
            for (const file of files) {
                const filePath = path.join(uploadsDir, file);
                const stat = await fs.stat(filePath);
                if (stat.isFile()) {
                    await fs.unlink(filePath);
                    console.log(`Deleted orphaned file: ${file}`);
                    deletedCount++;
                }
            }
        } catch (err: any) {
            if (err.code !== 'ENOENT') {
                console.error('Error reading uploads directory:', err.message);
            }
        }

        console.log('Cleanup complete.');
        console.log(`Successfully deleted: ${deletedCount}`);
        console.log(`Errors: ${errorCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}

cleanupLocalFiles();
