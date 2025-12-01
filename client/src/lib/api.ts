import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Important for cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Don't retry if it's an auth endpoint (login, signup, refresh, or me check)
        const isAuthEndpoint = originalRequest.url?.includes('/auth/refresh-token') ||
            originalRequest.url?.includes('/auth/me') ||
            originalRequest.url?.includes('/auth/login') ||
            originalRequest.url?.includes('/auth/signup');

        // If 401 and not already retried and not an auth endpoint, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            try {
                await api.post('/auth/refresh-token');
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, don't redirect here - let AuthContext handle it
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
