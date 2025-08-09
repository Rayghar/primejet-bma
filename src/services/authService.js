import http from './httpService';

const login = async (email, password) => {
    const { data } = await http.post('/auth/login', { email, password });
    return data;
};

const getCurrentUserProfile = async () => {
    const { data } = await http.get('/users/me');
    return data;
};

const logout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
};

const authService = { login, logout, getCurrentUserProfile };
export default authService;