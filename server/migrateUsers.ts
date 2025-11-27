import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function migrateUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('✅ Connected to MongoDB');

        // Get the users collection directly
        const db = mongoose.connection.db;
        const usersCollection = db!.collection('users');

        // Find all users
        const users = await usersCollection.find({}).toArray();
        console.log(`\nFound ${users.length} users in database`);

        if (users.length === 0) {
            console.log('\n❌ No users found. Creating a test user...');

            // Create test user with hashed password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Ronak@95865', salt);

            await usersCollection.insertOne({
                email: '22amtics221@gmail.com',
                password: hashedPassword,
                firstName: 'Ronak',
                lastName: 'User',
                isVerified: true,
                storageUsed: 0,
                storageLimit: 5368709120, // 5GB
                createdAt: new Date(),
            });

            console.log('✅ Created user: 22amtics221@gmail.com with password: Ronak@95865');
        } else {
            // Update existing users
            for (const user of users) {
                console.log('\n---');
                console.log('Email:', user.email);
                console.log('Has password field:', !!user.password);
                console.log('Is verified:', user.isVerified);

                // Check if password looks like bcrypt hash (starts with $2a$ or $2b$)
                const isBcryptHash = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));

                if (!isBcryptHash) {
                    console.log('⚠️  Password is not bcrypt hashed, needs migration');

                    // For existing users without proper password, set a default hashed password
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash('Ronak@95865', salt);

                    await usersCollection.updateOne(
                        { _id: user._id },
                        {
                            $set: {
                                password: hashedPassword,
                                isVerified: true, // Set to true for existing users
                                storageUsed: user.storageUsed || 0,
                                storageLimit: user.storageLimit || 5368709120,
                                firstName: user.firstName || 'User',
                                lastName: user.lastName || '',
                            }
                        }
                    );

                    console.log('✅ Updated user with hashed password: Ronak@95865');
                } else {
                    console.log('✅ Password already hashed, no migration needed');

                    // Just ensure required fields exist
                    await usersCollection.updateOne(
                        { _id: user._id },
                        {
                            $set: {
                                isVerified: user.isVerified !== undefined ? user.isVerified : true,
                                storageUsed: user.storageUsed || 0,
                                storageLimit: user.storageLimit || 5368709120,
                            }
                        }
                    );
                }
            }
        }

        // Verify the migration
        console.log('\n\n=== Verification ===');
        const updatedUsers = await usersCollection.find({}).toArray();
        for (const user of updatedUsers) {
            console.log('\nEmail:', user.email);
            console.log('Password hash exists:', !!user.password);
            console.log('Is verified:', user.isVerified);
            console.log('Storage used:', user.storageUsed);
            console.log('Storage limit:', user.storageLimit);

            // Test password comparison
            if (user.password) {
                const isValid = await bcrypt.compare('Ronak@95865', user.password);
                console.log('Password "Ronak@95865" valid:', isValid ? '✅ YES' : '❌ NO');
            }
        }

        await mongoose.disconnect();
        console.log('\n✅ Migration completed successfully');
        console.log('\n📝 You can now login with:');
        console.log('   Email: 22amtics221@gmail.com');
        console.log('   Password: Ronak@95865');

    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
}

migrateUsers();
