import apiClient from './apiClient';

// --- Inventory & Stock ---
export const getInventorySummary = async () => {
    const res = await apiClient.get('/api/v2/inventory/summary');
    return res.data;
};

export const getStockInHistory = async () => {
    const res = await apiClient.get('/api/v2/inventory/stock-in-history');
    return res.data;
};

export const addStockIn = async (data) => {
    const res = await apiClient.post('/api/v2/inventory/stock-in', data);
    return res.data;
};

// --- Cylinders (Fixed) ---
export const getCylinders = async () => {
    const res = await apiClient.get('/api/v2/inventory/cylinders');
    return res.data;
};

export const addCylinder = async (data) => {
    const res = await apiClient.post('/api/v2/inventory/cylinders', data);
    return res.data;
};

export const deleteCylinder = async (id) => {
    const res = await apiClient.delete(`/api/v2/inventory/cylinders/${id}`);
    return res.data;
};

// --- Assets (Fixed) ---
export const getAssets = async () => {
    const res = await apiClient.get('/api/v2/inventory/assets');
    return res.data;
};

export const addAsset = async (data) => {
    const res = await apiClient.post('/api/v2/inventory/assets', data);
    return res.data;
};

export const deleteAsset = async (id) => {
    const res = await apiClient.delete(`/api/v2/inventory/assets/${id}`);
    return res.data;
};

// --- Loans (Fixed) ---
export const getLoans = async () => {
    const res = await apiClient.get('/api/v2/inventory/loans');
    return res.data;
};

export const addLoan = async (data) => {
    const res = await apiClient.post('/api/v2/inventory/loans', data);
    return res.data;
};

export const deleteLoan = async (id) => {
    const res = await apiClient.delete(`/api/v2/inventory/loans/${id}`);
    return res.data;
};

// --- Reports (Shared) ---
export const getFinancialStatements = async (period = 'monthly') => {
    const res = await apiClient.get('/api/v2/financials/statements', { params: { period } });
    return res.data;
};

export const getTaxComplianceReport = async () => {
    const res = await apiClient.get('/api/v2/financials/tax-compliance');
    return res.data;
};

export const getRevenueAssuranceReport = async () => {
    const res = await apiClient.get('/api/v2/financials/revenue-assurance');
    return res.data;
};