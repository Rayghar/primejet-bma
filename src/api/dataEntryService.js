import apiClient from './apiClient';

export const createOrGetDailySummary = async (data) => {
    const res = await apiClient.post('/api/v2/data-entry/daily-summary', data);
    return res.data;
};

// ✅ ADDED
export const updateSummaryMeters = async (summaryId, data) => {
    const res = await apiClient.put(`/api/v2/data-entry/daily-summary/${summaryId}/meters`, data);
    return res.data;
};

export const logSale = async (saleData) => {
    const res = await apiClient.post('/api/v2/data-entry/sales', saleData);
    return res.data;
};

export const logExpense = async (expenseData) => {
    const res = await apiClient.post('/api/v2/data-entry/expenses', expenseData);
    return res.data;
};

// ✅ ADDED
export const getDailyEntries = async (summaryId) => {
    const res = await apiClient.get(`/api/v2/data-entry/daily-entries/${summaryId}`);
    return res.data;
};

// ✅ ADDED
export const finalizeDailySummary = async (summaryId) => {
    const res = await apiClient.put(`/api/v2/data-entry/daily-summary/${summaryId}/finalize`);
    return res.data;
};

export const getPendingApprovals = async () => {
    const res = await apiClient.get('/api/v2/data-entry/daily-summary/pending-approval');
    return res.data;
};

export const approveSummary = async (summaryId) => {
    return await apiClient.put(`/api/v2/data-entry/daily-summary/${summaryId}/approve`);
};

// ✅ ADDED
export const rejectSummary = async (summaryId) => {
    return await apiClient.put(`/api/v2/data-entry/daily-summary/${summaryId}/reject`);
};

// ✅ ADDED
export const getTransactionHistory = async (filters) => {
    const res = await apiClient.get('/api/v2/data-entry/transaction-history', { params: filters });
    return res.data;
};