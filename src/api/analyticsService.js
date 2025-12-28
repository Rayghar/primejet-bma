import apiClient from './apiClient';

export const getDashboardKpis = async () => {
    const res = await apiClient.get('/api/v2/analytics/dashboard-kpis');
    return res.data;
};

export const getSalesReport = async (period = 'monthly') => {
    const res = await apiClient.get('/api/v2/analytics/sales-report', { params: { period } });
    return res.data;
};

// ✅ FIX: Alias this function so Dashboard.js can find it
export const getSalesChartData = getSalesReport; 

export const getSalesByPaymentMethod = async () => {
    const res = await apiClient.get('/api/v2/analytics/sales-by-payment-method');
    return res.data;
};

export const getTopSellingProducts = async () => {
    const res = await apiClient.get('/api/v2/analytics/top-selling-products');
    return res.data;
};

export const getHeatmapData = async () => {
    const res = await apiClient.get('/orders', { 
        params: { limit: 2000, fields: 'deliveryLatitude,deliveryLongitude,grandTotal' } 
    });
    return res.data.map(o => ({
        lat: o.deliveryLatitude,
        lng: o.deliveryLongitude,
        weight: o.grandTotal
    })).filter(p => p.lat && p.lng);
};

export const getDriverPerformance = async (period = 'monthly') => {
    const res = await apiClient.get('/api/v1/reports/driver-performance', { params: { period } });
    return res.data;
};

export const getBusinessMetrics = async () => {
    const res = await apiClient.get('/api/v2/analytics/business-metrics');
    return res.data;
};