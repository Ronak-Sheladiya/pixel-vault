import mongoose from 'mongoose';
import { File } from './models/File';
import { User } from './models/User';
import { GlobalStorage } from './models/GlobalStorage';
import { connectDatabase } from './config/database';

async function initializeGlobalStorage() {
    try {
        // Connect to database
        await connectDatabase();

        console.log('🔄 Calculating total storage used...');

        // Calculate total size of all files in the database
        const allFiles = await File.find({});
        let totalUsed = 0;

        for (const file of allFiles) {
            totalUsed += file.size;
        }

        console.log(`📊 Total files: ${allFiles.length}`);
        console.log(`📦 Total storage used: ${(totalUsed / (1024 * 1024 * 1024)).toFixed(2)} GB`);

        // Update or create global storage document
        let globalStorage = await GlobalStorage.findOne();

        if (!globalStorage) {
            globalStorage = new GlobalStorage({
                totalUsed: totalUsed,
                totalLimit: 9 * 1024 * 1024 * 1024, // 9GB
            });
            console.log('✅ Created new GlobalStorage document');
        } else {
            globalStorage.totalUsed = totalUsed;
            globalStorage.lastUpdated = new Date();
            console.log('✅ Updated existing GlobalStorage document');
        }

        await globalStorage.save();

        console.log('\n📋 Global Storage Summary:');
        console.log(`   Total Used: ${(globalStorage.totalUsed / (1024 * 1024 * 1024)).toFixed(2)} GB`);
        console.log(`   Total Limit: ${(globalStorage.totalLimit / (1024 * 1024 * 1024)).toFixed(2)} GB`);
        console.log(`   Available: ${((globalStorage.totalLimit - globalStorage.totalUsed) / (1024 * 1024 * 1024)).toFixed(2)} GB`);
        console.log(`   Usage: ${((globalStorage.totalUsed / globalStorage.totalLimit) * 100).toFixed(2)}%`);

        // Also update individual user storage for accuracy
        console.log('\n🔄 Updating individual user storage...');
        const users = await User.find({});

        for (const user of users) {
            const userFiles = await File.find({ owner: user._id });
            let userStorageUsed = 0;

            for (const file of userFiles) {
                userStorageUsed += file.size;
            }

            user.storageUsed = userStorageUsed;
            await user.save();

            console.log(`   ${user.email}: ${(userStorageUsed / (1024 * 1024 * 1024)).toFixed(2)} GB`);
        }

        console.log('\n✅ Global storage initialization complete!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing global storage:', error);
        process.exit(1);
    }
}

initializeGlobalStorage();
