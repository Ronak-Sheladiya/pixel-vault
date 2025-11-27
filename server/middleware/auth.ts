import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from cookies or Authorization header
        const token = req.cookies?.accessToken ||
            req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        // Verify token
        const payload = verifyToken(token);
        req.user = payload;

        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token = req.cookies?.accessToken ||
            req.headers.authorization?.replace('Bearer ', '');

        if (token) {
            const payload = verifyToken(token);
            req.user = payload;
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};
