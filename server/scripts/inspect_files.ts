import mongoose from 'mongoose';
import { File } from '../models/File';
import { User } from '../models/User';
import dotenv from 'dotenv';
import { connectDatabase } from '../config/database';

dotenv.config({ path: './server/.env' });

async function inspectFiles() {
    try {
        await connectDatabase();
        const user = await User.findOne({ email: '22amtics221@gmail.com' });
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }

        console.log(`Checking files for user: ${user._id}`);
        const files = await File.find({ owner: user._id });
        console.log(`Total files: ${files.length}`);

        files.forEach(f => {
            console.log(`File: ${f.name} (${f.originalName})`);
            console.log(`  ID: ${f._id}`);
            console.log(`  Folder: ${f.folder}`);
            console.log(`  Type: ${f.type}`);
            console.log(`  Mime: ${f.mimeType}`);
            console.log(`  R2Key: ${f.r2Key}`);
            console.log('---');
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

inspectFiles();
