import axios from 'axios';

// ✅ Production Backend
const BASE_URL = 'https://primejet-backend.onrender.com/api/v1';

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 45000, // Extended timeout for heavy reports
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, (error) => Promise.reject(error));

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.clear();
            window.location.href = '/'; 
        }
        return Promise.reject(error);
    }
);

export default apiClient;