import axios from 'axios';

// Create an instance of axios
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api', // Uses VITE_API_URL or defaults to proxy
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // 15 seconds timeout
});

// Add a request interceptor to add the token to every request
api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('inventory_user'));
        if (user && user.token) {
            config.headers['Authorization'] = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('blob:')) return url;

    // Remove trailing slash from BASE_URL if present for consistency
    const baseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

    // Case 1: URL is already absolute path from root (starts with /api/uploads)
    if (url.startsWith('/api')) {
        // If BASE_URL ends with /api, strip it to avoid duplication
        if (baseUrl.endsWith('/api')) {
            return `${baseUrl.slice(0, -4)}${url}`;
        }
        return `${baseUrl}${url}`;
    }

    // Case 2: URL is relative (starts with /uploads without /api)
    // We expect BASE_URL to end with /api, or we append it
    // But safely: if BASE_URL ends with /api, just append
    if (baseUrl.endsWith('/api')) {
        return `${baseUrl}${url}`;
    } else {
        // If BASE_URL is just root (e.g. host.com), append /api
        return `${baseUrl}/api${url}`;
    }
};

export default api;
