// src/api/dataEntryService.js
import httpClient from './httpClient';

/**
 * Logs a new sales transaction by sending data to the backend.
 * @param {object} saleData - The sales transaction data.
 * @returns {Promise<object>} The backend response.
 */
const logSale = async (saleData) => {
    const { data } = await httpClient.post('/data-entry/sales', saleData);
    return data;
};

/**
 * Logs a new expense by sending data to the backend.
 * @param {object} expenseData - The expense transaction data.
 * @returns {Promise<object>} The backend response.
 */
const logExpense = async (expenseData) => {
    const { data } = await httpClient.post('/data-entry/expenses', expenseData);
    return data;
};

/**
 * Submits a new end-of-day summary for approval.
 * @param {object} summaryData - The daily summary data.
 * @returns {Promise<object>} The backend response.
 */
const addDailySummary = async (summaryData) => {
    const { data } = await httpClient.post('/data-entry/daily-summary', summaryData);
    return data;
};

/**
 * Fetches a list of daily summaries that are pending approval.
 * @returns {Promise<Array<object>>} A list of pending summaries.
 */
const getPendingSummaries = async () => {
    const { data } = await httpClient.get('/data-entry/daily-summaries/pending');
    return data;
};

/**
 * Updates the status of a specific daily summary.
 * @param {string} summaryId - The ID of the summary to update.
 * @param {string} status - The new status ('approved' or 'rejected').
 * @returns {Promise<object>} The backend response.
 */
const updateSummaryStatus = async (summaryId, status) => {
    const { data } = await httpClient.put(`/data-entry/daily-summaries/${summaryId}/status`, { status });
    return data;
};

/**
 * Fetches the paginated transaction history with optional filters.
 * @param {object} filters - The query filters (e.g., { branchId, type, page, limit }).
 * @returns {Promise<object>} The paginated transaction history.
 */
const getTransactionHistory = async (filters) => {
    const { data } = await httpClient.get('/data-entry/transactions', { params: filters });
    return data;
};

/**
 * Fetches a detailed end-of-day report for a specific daily summary ID.
 * @param {string} summaryId - The ID of the daily summary.
 * @returns {Promise<object>} The report data including summary, sales, expenses, and totals.
 */
const getDailySummaryReport = async (summaryId) => {
    const { data } = await httpClient.get(`/data-entry/daily-summaries/${summaryId}`);
    return data;
};

/**
 * Fetches the in-progress daily summary for the current user and day.
 * @returns {Promise<object|null>} The in-progress summary or null if not found.
 */
const getDailySummaryInProgress = async () => {
    const { data } = await httpClient.get('/data-entry/daily-summaries/in-progress');
    // The backend now returns null with a 200 OK status if no summary is found.
    return data; 
};

export { 
    logSale, 
    logExpense, 
    addDailySummary, 
    getPendingSummaries, 
    getTransactionHistory, 
    updateSummaryStatus,
    getDailySummaryReport,
    getDailySummaryInProgress 
};