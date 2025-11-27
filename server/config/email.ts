import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email configuration error:', error);
    } else {
        console.log('✅ Email server is ready to send messages');
    }
});

export const EMAIL_CONFIG = {
    from: process.env.EMAIL_FROM || 'PixelVault <noreply@pixelvault.com>',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5000',
};
