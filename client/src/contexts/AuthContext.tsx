import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';
import { useCrossTabSync } from '../hooks/useCrossTabSync';

interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    storageUsed: number;
    storageLimit: number;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Cross-tab sync
    const { broadcastLogin, broadcastLogout } = useCrossTabSync(
        (syncedUser) => {
            console.log('Cross-tab: Received login broadcast', syncedUser);
            setUser(syncedUser);
            // If we're on a public page (login/signup), redirect to dashboard
            if (window.location.pathname === '/login' || window.location.pathname === '/signup') {
                window.location.href = '/dashboard';
            }
        },
        () => {
            console.log('Cross-tab: Received logout broadcast');
            setUser(null);
            // Redirect to login page
            if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
                window.location.href = '/login';
            }
        }
    );

    // Check if user is already logged in
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.get('/auth/me');
                setUser(response.data.user);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string, rememberMe = false) => {
        try {
            console.log('AuthContext: Attempting login for', email);
            const response = await api.post('/auth/login', { email, password, rememberMe });
            console.log('AuthContext: Login response:', response.data);
            setUser(response.data.user);
            broadcastLogin(response.data.user);
        } catch (error: any) {
            console.error('AuthContext: Login error:', error);
            console.error('AuthContext: Error response:', error.response?.data);
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    };

    const signup = async (email: string, password: string, firstName?: string, lastName?: string) => {
        try {
            console.log('AuthContext: Attempting signup for', email);
            const response = await api.post('/auth/signup', { email, password, firstName, lastName });
            console.log('AuthContext: Signup response:', response.data);
        } catch (error: any) {
            console.error('AuthContext: Signup error:', error);
            console.error('AuthContext: Error response:', error.response?.data);
            throw new Error(error.response?.data?.message || 'Signup failed');
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
            setUser(null);
            broadcastLogout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const value: AuthContextType = {
        user,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
