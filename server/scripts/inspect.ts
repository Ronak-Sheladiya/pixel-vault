import mongoose from 'mongoose';
import { File } from '../models/File';
import dotenv from 'dotenv';
import { connectDatabase } from '../config/database';

dotenv.config({ path: './server/.env' });

async function inspectFiles() {
    try {
        await connectDatabase();
        const allFiles = await File.find({});
        console.log(`Total files in DB: ${allFiles.length}`);

        const query = {
            $or: [
                { r2Url: { $regex: /^\/uploads\// } },
                { r2Url: { $exists: false } },
                { r2Url: null }
            ]
        };
        const targetFiles = await File.find(query);
        console.log(`Files matching cleanup query: ${targetFiles.length}`);

        if (allFiles.length > 0) {
            console.log('Sample file:', JSON.stringify(allFiles[0], null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

inspectFiles();
