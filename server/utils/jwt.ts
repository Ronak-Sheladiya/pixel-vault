import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-this';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export interface TokenPayload {
    userId: string;
    email: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_ACCESS_EXPIRY,
    });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRY,
    });
};

export const verifyToken = (token: string): TokenPayload => {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

export const generateVerificationToken = (): string => {
    return jwt.sign({ purpose: 'verification' }, JWT_SECRET, {
        expiresIn: '24h',
    });
};

export const generateResetToken = (): string => {
    return jwt.sign({ purpose: 'reset' }, JWT_SECRET, {
        expiresIn: '1h',
    });
};
