import apiClient from './apiClient';

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