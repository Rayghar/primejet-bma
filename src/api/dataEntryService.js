// src/api/dataEntryService.js
import httpClient from './httpClient';

// API endpoints for data entry
const BASE_URL = '/data-entry';

// Create or get daily summary for a branch
// FIX: Changed function signature to match the calling code in DailyLog.js
export const createOrGetDailySummary = async (branchId, cashierName, pricePerKg) => {
    try {
        const response = await httpClient.post(`${BASE_URL}/daily-summary`, { branchId, cashierName, pricePerKg });
        return response.data;
    } catch (error) {
        console.error("API Error in createOrGetDailySummary:", error);
        throw error;
    }
};

export const updateSummaryMeters = async (summaryId, metersData) => {
    try {
        const response = await httpClient.put(`${BASE_URL}/daily-summary/${summaryId}/meters`, metersData);
        return response.data;
    } catch (error) {
        console.error("API Error in updateSummaryMeters:", error);
        throw error;
    }
};

export const createSaleEntry = async (saleData) => {
    try {
        const response = await httpClient.post(`${BASE_URL}/sales`, saleData);
        return response.data;
    } catch (error) {
        console.error("API Error in createSaleEntry:", error);
        throw error;
    }
};

export const createExpenseEntry = async (expenseData) => {
    try {
        const response = await httpClient.post(`${BASE_URL}/expenses`, expenseData);
        return response.data;
    } catch (error) {
        console.error("API Error in createExpenseEntry:", error);
        throw error;
    }
};

export const getDailyEntries = async (summaryId) => {
    try {
        const response = await httpClient.get(`${BASE_URL}/daily-entries/${summaryId}`);
        return response.data;
    } catch (error) {
        console.error("API Error in getDailyEntries:", error);
        throw error;
    }
};

export const finalizeDailySummary = async (summaryId) => {
    try {
        const response = await httpClient.put(`${BASE_URL}/daily-summary/${summaryId}/finalize`);
        return response.data;
    } catch (error) {
        console.error("API Error in finalizeDailySummary:", error);
        throw error;
    }
};

export const getDailySummaryReport = async (summaryId) => {
    try {
        const response = await httpClient.get(`${BASE_URL}/daily-summary/${summaryId}/report`);
        return response.data;
    } catch (error) {
        console.error("API Error in getDailySummaryReport:", error);
        throw error;
    }
};

export const getPendingSummaries = async () => {
    try {
        const response = await httpClient.get(`${BASE_URL}/daily-summary/pending-approval`);
        return response.data;
    } catch (error) {
        console.error("API Error in getPendingSummaries:", error);
        throw error;
    }
};

export const updateSummaryStatus = async (summaryId, status, reason = null) => {
    try {
        let url = `${BASE_URL}/daily-summary/${summaryId}/${status}`;
        let data = {};
        if (reason) {
            data.reason = reason;
        }
        const response = await httpClient.put(url, data);
        return response.data;
    } catch (error) {
        console.error("API Error in updateSummaryStatus:", error);
        throw error;
    }
};

export const getTransactionHistory = async (filters) => {
    try {
        const response = await httpClient.get(`${BASE_URL}/transaction-history`, { params: filters });
        return response.data;
    } catch (error) {
        console.error("API Error in getTransactionHistory:", error);
        throw error;
    }
};

export const migrateDailySummaries = async (summaries) => {
    try {
        const response = await httpClient.post(`${BASE_URL}/migration/daily-summaries`, summaries);
        return response.data;
    } catch (error) {
        console.error("API Error in migrateDailySummaries:", error);
        throw error;
    }
};

export const migrateExpenseTransactions = async (expenses) => {
    try {
        const response = await httpClient.post(`${BASE_URL}/migration/expenses`, expenses);
        return response.data;
    } catch (error) {
        console.error("API Error in migrateExpenseTransactions:", error);
        throw error;
    }
};

export const getManagerSalesView = async () => {
    try {
        const response = await httpClient.get('/api/v2/financials/sales');
        return response.data;
    } catch (error) {
        console.error("API Error in getManagerSalesView:", error);
        throw error;
    }
};

export const markCashPaidToBank = async (summaryId, data) => {
    try {
        const response = await httpClient.post(`/api/v2/financials/sales/${summaryId}/cash-paid`, data);
        return response.data;
    } catch (error) {
        console.error("API Error in markCashPaidToBank:", error);
        throw error;
    }
};