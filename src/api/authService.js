import apiClient from './apiClient';

export const signInUser = async (email, password) => {
    // Hits V1 Auth Endpoint
    const response = await apiClient.post('/auth/login', { email, password });
    
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
};

export const logoutUser = () => {
    localStorage.clear();
    window.location.href = '/';
};

export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    try {
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        return null;
    }
};