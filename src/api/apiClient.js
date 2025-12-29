import axios from 'axios';

// ✅ BASE_URL is the root. We append paths dynamically.
const BASE_URL = 'http://localhost:3000'; 

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 45000,
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // ✅ ROBUST PATH LOGIC
    // If the URL already starts with /api/, leave it alone.
    // If it doesn't, assume it's a V1 endpoint and prepend /api/v1
    if (!config.url.startsWith('/api/')) {
        config.url = `/api/v1${config.url.startsWith('/') ? '' : '/'}${config.url}`;
    }
    
    return config;
}, (error) => Promise.reject(error));

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Prevent infinite loop if already on login page
            if (window.location.pathname !== '/') {
                localStorage.clear();
                window.location.href = '/'; 
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;