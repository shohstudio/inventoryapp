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

export default api;
