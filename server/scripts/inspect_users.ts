import mongoose from 'mongoose';
import { User } from '../models/User';
import dotenv from 'dotenv';
import { connectDatabase } from '../config/database';

dotenv.config({ path: './server/.env' });

async function inspectUsers() {
    try {
        await connectDatabase();
        const users = await User.find({});
        console.log(`Total users: ${users.length}`);
        users.forEach(u => {
            console.log(`ID: ${u._id}, Email: ${u.email}, Name: ${u.name}`);
        });
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

inspectUsers();
