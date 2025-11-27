import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'wouter';
import api from '@/lib/api';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const { toast } = useToast();
    const { isAuthenticated } = useAuth();
    const [, setLocation] = useLocation();

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated) {
            setLocation('/dashboard');
        }
    }, [isAuthenticated, setLocation]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
            toast({
                title: 'Success',
                description: 'If an account exists with this email, a password reset link has been sent.',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to send reset email',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
                    <CardDescription className="text-center">
                        Enter your email to receive a password reset link
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={sent}
                            />
                        </div>
                        {sent && (
                            <p className="text-sm text-green-600 dark:text-green-400">
                                Check your email for a password reset link.
                            </p>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={loading || sent}>
                            {loading ? 'Sending...' : sent ? 'Email Sent' : 'Send Reset Link'}
                        </Button>
                        <div className="text-sm text-center">
                            Remember your password?{' '}
                            <a href="/login" className="text-primary hover:underline font-medium">
                                Sign in
                            </a>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
