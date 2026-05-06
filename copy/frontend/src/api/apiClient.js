// src/api/apiClient.js
import axios from 'axios';

// ✅ BASE_URL matches your backend
const BASE_URL = 'http://localhost:3000'; 

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
});

// 1. Request Interceptor: Attach Token & Fix Paths
apiClient.interceptors.request.use((config) => {
    // Attach Token
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Path Logic: If path doesn't start with /api/, assume it's legacy V1
    if (!config.url.startsWith('/api/')) {
        config.url = `/api/v1${config.url.startsWith('/') ? '' : '/'}${config.url}`;
    }
    
    return config;
}, (error) => Promise.reject(error));

// 2. Response Interceptor: Handle 401 (The "Crash Fix")
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // ✅ If 401 Unauthorized (Token Invalid/Expired)
        if (error.response && error.response.status === 401) {
            console.warn("Session expired. logging out...");
            
            // 1. Remove invalid credentials
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // 2. Force Redirect to Login (unless already there)
            if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
                window.location.href = '/'; 
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;