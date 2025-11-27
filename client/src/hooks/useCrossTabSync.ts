import { useEffect } from 'react';

interface AuthMessage {
    type: 'LOGIN' | 'LOGOUT';
    user?: any;
}

export const useCrossTabSync = (
    onLogin: (user: any) => void,
    onLogout: () => void
) => {
    useEffect(() => {
        const channel = new BroadcastChannel('auth_channel');

        channel.onmessage = (event: MessageEvent<AuthMessage>) => {
            if (event.data.type === 'LOGIN' && event.data.user) {
                onLogin(event.data.user);
            } else if (event.data.type === 'LOGOUT') {
                onLogout();
            }
        };

        return () => {
            channel.close();
        };
    }, [onLogin, onLogout]);

    const broadcastLogin = (user: any) => {
        const channel = new BroadcastChannel('auth_channel');
        channel.postMessage({ type: 'LOGIN', user });
        channel.close();
    };

    const broadcastLogout = () => {
        const channel = new BroadcastChannel('auth_channel');
        channel.postMessage({ type: 'LOGOUT' });
        channel.close();
    };

    return { broadcastLogin, broadcastLogout };
};
