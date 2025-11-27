import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function resetDatabase() {
    try {
        console.log('🔄 Starting database reset...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db!;

        // Drop old collections that conflict with new schema
        const collectionsToKeep = ['photos', 'folders', 'groups']; // Keep existing photo data
        const collections = await db.listCollections().toArray();

        console.log('📋 Current collections:', collections.map(c => c.name).join(', '));
        console.log('\n🗑️  Dropping authentication-related collections...\n');

        for (const collection of collections) {
            if (!collectionsToKeep.includes(collection.name)) {
                await db.dropCollection(collection.name);
                console.log(`   ✅ Dropped: ${collection.name}`);
            }
        }

        console.log('\n✅ Old collections dropped\n');

        // Create new user with proper schema
        console.log('👤 Creating new user account...\n');

        const usersCollection = db.collection('users');

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Ronak@95865', salt);

        // Create user document
        const newUser = {
            email: '22amtics221@gmail.com',
            password: hashedPassword,
            firstName: 'Ronak',
            lastName: 'Patel',
            isVerified: true,
            storageUsed: 0,
            storageLimit: 5368709120, // 5GB in bytes
            createdAt: new Date(),
        };

        await usersCollection.insertOne(newUser);
        console.log('   ✅ Created user: 22amtics221@gmail.com');
        console.log('   🔑 Password: Ronak@95865');
        console.log('   ✅ Email verified: true\n');

        // Verify the user was created correctly
        const user = await usersCollection.findOne({ email: '22amtics221@gmail.com' });
        if (user) {
            const isPasswordValid = await bcrypt.compare('Ronak@95865', user.password);
            console.log('🔐 Password verification test:', isPasswordValid ? '✅ PASS' : '❌ FAIL');
        }

        // Update photos to reference the new user if needed
        const photosCollection = db.collection('photos');
        const photoCount = await photosCollection.countDocuments();

        if (photoCount > 0 && user) {
            console.log(`\n📸 Found ${photoCount} existing photos`);
            console.log('   Linking photos to new user account...');

            await photosCollection.updateMany(
                {},
                { $set: { userId: user._id } }
            );

            console.log('   ✅ Photos linked to user account\n');
        }

        await mongoose.disconnect();
        console.log('✅ Database reset completed successfully!\n');
        console.log('═══════════════════════════════════════');
        console.log('📝 LOGIN CREDENTIALS:');
        console.log('   Email: 22amtics221@gmail.com');
        console.log('   Password: Ronak@95865');
        console.log('═══════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Reset error:', error);
        process.exit(1);
    }
}

resetDatabase();
