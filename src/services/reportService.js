// src/services/reportService.js (UPDATED)
import http from './httpService';

const getReport = async (params) => {
    const { data } = await http.get('/reports', { params });
    return data;
};

// NEW: Function to fetch the detailed end-of-day report
const getEndOfDayReport = async (date, branchId) => {
    const params = { date: date.toISOString().split('T')[0], branchId };
    const { data } = await http.get('/reports/end-of-day', { params });
    return data;
};

const reportService = {
    getReport,
    getEndOfDayReport, // Export the new function
};

export default reportService;