import mongoose from 'mongoose';
import { User } from './models/User';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkAndFixUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('✅ Connected to MongoDB');

        // Find all users
        const users = await User.find({});
        console.log(`\nFound ${users.length} users in database:`);

        for (const user of users) {
            console.log('\n---');
            console.log('Email:', user.email);
            console.log('First Name:', user.firstName);
            console.log('Last Name:', user.lastName);
            console.log('Is Verified:', user.isVerified);
            console.log('Storage Used:', user.storageUsed);
            console.log('Storage Limit:', user.storageLimit);
            console.log('Password Hash Exists:', !!user.password);
            console.log('Password Hash Length:', user.password?.length);
        }

        // Check if the specific user exists
        const testUser = await User.findOne({ email: '22amtics221@gmail.com' });

        if (!testUser) {
            console.log('\n❌ User 22amtics221@gmail.com not found in database');
            console.log('Creating new user...');

            const newUser = new User({
                email: '22amtics221@gmail.com',
                password: 'Ronak@95865', // Will be hashed automatically
                firstName: 'Ronak',
                lastName: 'User',
                isVerified: true, // Set to true for testing
            });

            await newUser.save();
            console.log('✅ User created successfully');
        } else {
            console.log('\n✅ User 22amtics221@gmail.com found');

            // Update user to be verified and reset password
            console.log('Updating user: setting isVerified=true and resetting password...');
            testUser.isVerified = true;
            testUser.password = 'Ronak@95865'; // Will be hashed automatically
            await testUser.save();
            console.log('✅ User updated successfully');
        }

        // Test password comparison
        const updatedUser = await User.findOne({ email: '22amtics221@gmail.com' });
        if (updatedUser) {
            const isValid = await updatedUser.comparePassword('Ronak@95865');
            console.log('\n🔐 Password comparison test:', isValid ? '✅ PASS' : '❌ FAIL');
        }

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkAndFixUsers();
