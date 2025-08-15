import httpClient from './httpClient';

// API endpoints for data entry
const BASE_URL = '/data-entry';

// Create or get daily summary for a branch
export const createOrGetDailySummary = async (branchId, cashierName, pricePerKg) => {
    try {
        const payload = { branchId, cashierName, pricePerKg };
        console.debug('[DEBUG] dataEntryService: Sending createOrGetDailySummary with payload:', payload, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        const response = await httpClient.post(`${BASE_URL}/daily-summary`, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.debug('[DEBUG] dataEntryService: Received response:', response.data);
        return response.data;
    } catch (error) {
        console.error('[DEBUG] dataEntryService: API Error in createOrGetDailySummary:', error, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        throw error;
    }
};

// Update meters on a daily summary
export const updateSummaryMeters = async (summaryId, metersData) => {
    try {
        console.debug('[DEBUG] dataEntryService: Sending updateSummaryMeters with payload:', metersData, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        const response = await httpClient.put(`${BASE_URL}/daily-summary/${summaryId}/meters`, metersData, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        console.error('[DEBUG] dataEntryService: API Error in updateSummaryMeters:', error, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        throw error;
    }
};

// Log a new sale transaction
export const createSaleEntry = async (saleData) => {
    try {
        console.debug('[DEBUG] dataEntryService: Sending createSaleEntry with payload:', saleData, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        const response = await httpClient.post(`${BASE_URL}/sales`, saleData, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        console.error('[DEBUG] dataEntryService: API Error in createSaleEntry:', error, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        throw error;
    }
};

// Log a new expense transaction
export const createExpenseEntry = async (expenseData) => {
    try {
        console.debug('[DEBUG] dataEntryService: Sending createExpenseEntry with payload:', expenseData, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        const response = await httpClient.post(`${BASE_URL}/expenses`, expenseData, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        console.error('[DEBUG] dataEntryService: API Error in createExpenseEntry:', error, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        throw error;
    }
};

// Get all daily entries for a given daily summary
export const getDailyEntries = async (summaryId) => {
    try {
        console.debug('[DEBUG] dataEntryService: Fetching daily entries for summary ID:', summaryId, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        const response = await httpClient.get(`${BASE_URL}/daily-entries/${summaryId}`);
        return response.data;
    } catch (error) {
        console.error('[DEBUG] dataEntryService: API Error in getDailyEntries:', error, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        throw error;
    }
};

// Finalize daily summary
export const finalizeDailySummary = async (summaryId) => {
    try {
        console.debug('[DEBUG] dataEntryService: Finalizing summary ID:', summaryId, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        const response = await httpClient.put(`${BASE_URL}/daily-summary/${summaryId}/finalize`, {}, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        console.error('[DEBUG] dataEntryService: API Error in finalizeDailySummary:', error, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        throw error;
    }
};

// Get daily summary report
export const getDailySummaryReport = async (summaryId) => {
    try {
        console.debug('[DEBUG] dataEntryService: Fetching summary report for ID:', summaryId, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        const response = await httpClient.get(`${BASE_URL}/daily-summary/${summaryId}/report`);
        return response.data;
    } catch (error) {
        console.error('[DEBUG] dataEntryService: API Error in getDailySummaryReport:', error, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        throw error;
    }
};

// Get pending summaries for approval
export const getPendingSummaries = async () => {
    try {
        console.debug('[DEBUG] dataEntryService: Fetching pending summaries at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        const response = await httpClient.get(`${BASE_URL}/daily-summary/pending-approval`, {
            params: { select: 'date branchId cashierName sales expenses managerApproval' } // Explicitly select fields
        });
        // Transform branchId to string if it's an object
        const summaries = response.data.map(summary => ({
            ...summary,
            branchId: typeof summary.branchId === 'object' ? summary.branchId.id || summary.branchId._id || 'Unknown' : summary.branchId
        }));
        console.debug('[DEBUG] dataEntryService: Transformed pending summaries:', summaries);
        return summaries;
    } catch (error) {
        console.error('[DEBUG] dataEntryService: API Error in getPendingSummaries:', error, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        throw error;
    }
};

// Update daily summary status
export const updateSummaryStatus = async (summaryId, status, reason = null) => {
    try {
        console.debug('[DEBUG] dataEntryService: Updating summary status for ID:', summaryId, 'to:', status, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        let url = `${BASE_URL}/daily-summary/${summaryId}/${status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : status}`;
        let data = {};
        if (reason) data.reason = reason;
        const response = await httpClient.put(url, data, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        console.error('[DEBUG] dataEntryService: API Error in updateSummaryStatus:', error, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        throw error;
    }
};

// Get transaction history
export const getTransactionHistory = async (filters) => {
    try {
        console.debug('[DEBUG] dataEntryService: Fetching transaction history with filters:', filters, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        const response = await httpClient.get(`${BASE_URL}/transaction-history`, { params: filters });
        return response.data;
    } catch (error) {
        console.error('[DEBUG] dataEntryService: API Error in getTransactionHistory:', error, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        throw error;
    }
};

// Migrate daily summaries
export const migrateDailySummaries = async (summaries) => {
    try {
        console.debug('[DEBUG] dataEntryService: Migrating daily summaries:', summaries, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        const response = await httpClient.post(`${BASE_URL}/migration/daily-summaries`, summaries, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        console.error('[DEBUG] dataEntryService: API Error in migrateDailySummaries:', error, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        throw error;
    }
};

// Migrate expense transactions
export const migrateExpenseTransactions = async (expenses) => {
    try {
        console.debug('[DEBUG] dataEntryService: Migrating expense transactions:', expenses, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        const response = await httpClient.post(`${BASE_URL}/migration/expenses`, expenses, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        console.error('[DEBUG] dataEntryService: API Error in migrateExpenseTransactions:', error, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        throw error;
    }
};

// Get manager sales view
export const getManagerSalesView = async () => {
    try {
        console.debug('[DEBUG] dataEntryService: Fetching manager sales view at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        const response = await httpClient.get('/api/v2/financials/sales');
        return response.data;
    } catch (error) {
        console.error('[DEBUG] dataEntryService: API Error in getManagerSalesView:', error, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        throw error;
    }
};

// Mark cash paid to bank
export const markCashPaidToBank = async (summaryId, data) => {
    try {
        console.debug('[DEBUG] dataEntryService: Marking cash paid to bank for summary ID:', summaryId, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        const response = await httpClient.post(`/api/v2/financials/sales/${summaryId}/cash-paid`, data, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        console.error('[DEBUG] dataEntryService: API Error in markCashPaidToBank:', error, 'at', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
        throw error;
    }
};