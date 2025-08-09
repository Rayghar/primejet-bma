// src/services/userService.js
import http from './httpService';

const adminGetUsers = (params) => http.get('/users/admin', { params });
const adminCreateUser = (userData) => http.post('/users/admin', userData);
const adminUpdateUser = (userId, updateData) => http.put(`/users/admin/${userId}`, updateData);

const userService = { adminGetUsers, adminCreateUser, adminUpdateUser };
export default userService;