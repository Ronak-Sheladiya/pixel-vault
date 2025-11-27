import { Request, Response } from 'express';
import { User } from '../models/User';
import { Share } from '../models/Share';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService';
import { v4 as uuidv4 } from 'uuid';

// Signup
export const signup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, firstName, lastName } = req.body;

        console.log('Signup attempt for:', email);

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists:', email);
            res.status(400).json({ message: 'Email already registered' });
            return;
        }

        console.log('Creating new user...');

        // Generate verification token
        const verificationToken = uuidv4();

        // Create user
        const user = new User({
            email,
            password,
            firstName,
            lastName,
            verificationToken,
            isVerified: false,
        });

        console.log('Saving user to database...');
        await user.save();
        console.log('User saved successfully:', user._id);

        // Send verification email
        try {
            await sendVerificationEmail(email, verificationToken, firstName);
            console.log('Verification email sent to:', email);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Continue anyway - user is created
        }

        // Link any pending shares (invitations)
        try {
            const pendingShares = await Share.find({ invitedEmail: email });
            if (pendingShares.length > 0) {
                console.log(`Found ${pendingShares.length} pending shares for ${email}`);
                await Share.updateMany(
                    { invitedEmail: email },
                    {
                        $set: { sharedWith: user._id },
                        $unset: { invitedEmail: "" }
                    }
                );
            }
        } catch (shareError) {
            console.error('Failed to link pending shares:', shareError);
        }

        res.status(201).json({
            message: 'Account created successfully. Please check your email to verify your account.',
            userId: user._id,
        });
    } catch (error: any) {
        console.error('Signup error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Failed to create account', error: error.message });
    }
};

// Verify Email
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.params;

        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            res.status(400).json({ message: 'Invalid or expired verification token' });
            return;
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ message: 'Failed to verify email' });
    }
};

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, rememberMe } = req.body;

        console.log('Login attempt for:', email);

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found:', email);
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        console.log('User found:', { email: user.email, isVerified: user.isVerified });

        // Check if verified (skip in development)
        if (!user.isVerified && process.env.NODE_ENV === 'production') {
            console.log('Email not verified for:', email);
            res.status(401).json({ message: 'Please verify your email before logging in' });
            return;
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        console.log('Password valid:', isPasswordValid);

        if (!isPasswordValid) {
            console.log('Invalid password for:', email);
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        // Generate tokens
        const accessToken = generateAccessToken({
            userId: user._id.toString(),
            email: user.email,
        });

        const refreshToken = generateRefreshToken({
            userId: user._id.toString(),
            email: user.email,
        });

        // Set cookies
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' as const,
            maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined, // 30 days if remember me
        };

        res.cookie('accessToken', accessToken, cookieOptions);
        res.cookie('refreshToken', refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        console.log('Login successful for:', email);

        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                storageUsed: user.storageUsed,
                storageLimit: user.storageLimit,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed' });
    }
};

// Logout
export const logout = async (req: Request, res: Response): Promise<void> => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
};

// Refresh Token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            res.status(401).json({ message: 'Refresh token required' });
            return;
        }

        const payload = verifyToken(refreshToken);

        // Generate new access token
        const newAccessToken = generateAccessToken({
            userId: payload.userId,
            email: payload.email,
        });

        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });

        res.json({ message: 'Token refreshed successfully' });
    } catch (error) {
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};

// Get Current User
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }

        const user = await User.findById(req.user.userId).select('-password -verificationToken -resetPasswordToken');

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.json({ user });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ message: 'Failed to get user info' });
    }
};

// Forgot Password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if user exists
            res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
            return;
        }

        // Generate reset token
        const resetToken = uuidv4();
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
        await user.save();

        // Send reset email
        await sendPasswordResetEmail(email, resetToken, user.firstName);

        res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Failed to process request' });
    }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() },
        });

        if (!user) {
            res.status(400).json({ message: 'Invalid or expired reset token' });
            return;
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Failed to reset password' });
    }
};
