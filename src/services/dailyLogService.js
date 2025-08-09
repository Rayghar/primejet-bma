// src/services/dailyLogService.js (NEW FILE)
// This service will handle all communication with the new backend endpoints.
import http from './httpService';

const addDailyLog = (logData, type) => {
    return http.post('/dailylogs', { ...logData, type });
};

const getPendingLogs = () => {
    return http.get('/dailylogs/pending');
};

const updateLogStatus = (logId, status) => {
    return http.put(`/dailylogs/${logId}/status`, { status });
};

const dailyLogService = {
    addDailyLog,
    getPendingLogs,
    updateLogStatus,
};

export default dailyLogService;