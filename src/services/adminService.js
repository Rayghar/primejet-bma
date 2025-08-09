// src/services/adminService.js
import http from './httpService';

const getDashboardStats = async () => {
    const { data } = await http.get('/admin/dashboard-stats');
    return data;
};

const adminService = { getDashboardStats };
export default adminService;