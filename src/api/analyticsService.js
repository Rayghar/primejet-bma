// src/api/analyticsService.js
import httpClient from './httpClient';

const getDashboardKpis = async () => {
  const { data } = await httpClient.get('/analytics/dashboard-kpis');
  return data;
};

const getSalesReport = async () => {
  const { data } = await httpClient.get('/analytics/sales-report');
  return data;
};

// NEW: Fetch sales by payment method
const getSalesByPaymentMethod = async () => {
  const { data } = await httpClient.get('/analytics/sales-by-payment-method');
  return data;
};

// NEW: Fetch sales by branch
const getSalesByBranch = async () => {
  const { data } = await httpClient.get('/analytics/sales-by-branch');
  return data;
};

// NEW: Fetch top-selling products
const getTopSellingProducts = async () => {
  const { data } = await httpClient.get('/analytics/top-selling-products');
  return data;
};

export { 
  getDashboardKpis, 
  getSalesReport,
  getSalesByPaymentMethod, // Export new functions
  getSalesByBranch,
  getTopSellingProducts,
};