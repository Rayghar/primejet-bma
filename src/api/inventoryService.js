// src/api/inventoryService.js
import httpClient from './httpClient';

// Asset functions
const getAssets = async () => {
  const { data } = await httpClient.get('/inventory/assets');
  return data;
};

const addAsset = async (assetData) => {
  const { data } = await httpClient.post('/inventory/assets', assetData);
  return data;
};

// Loan functions
const getLoans = async () => {
  const { data } = await httpClient.get('/inventory/loans');
  return data;
};

const addLoan = async (loanData) => {
  const { data } = await httpClient.post('/inventory/loans', loanData);
  return data;
};

const deleteLoan = async (loanId) => {
  await httpClient.delete(`/inventory/loans/${loanId}`);
};

// Cylinder functions
const getCylinders = async () => {
  const { data } = await httpClient.get('/inventory/cylinders');
  return data;
};

const addCylinder = async (cylinderData) => {
  const { data } = await httpClient.post('/inventory/cylinders', cylinderData);
  return data;
};

const deleteCylinder = async (cylinderId) => {
  await httpClient.delete(`/inventory/cylinders/${cylinderId}`);
};

// Stock-in function
const addStockIn = async (stockInData) => {
  const { data } = await httpClient.post('/inventory/stock-in', stockInData);
  return data;
};

// Financials functions
const getFinancialStatements = async (branchId = 'all') => {
  const { data } = await httpClient.get('/financials/statements', {
    params: { branchId }
  });
  return data;
};

// Revenue Assurance function
const getRevenueAssuranceReport = async () => {
  const { data } = await httpClient.get('/financials/revenue-assurance');
  return data;
};

// Inventory Summary function for Dashboard and Inventory
const getInventorySummary = async () => {
  const { data } = await httpClient.get('/inventory/summary');
  return data;
};

const getTaxComplianceReport = async () => {
  const { data } = await httpClient.get('/financials/tax-compliance');
  return data;
};

const getLpgStockInHistory = async () => {
  const { data } = await httpClient.get('/inventory/stock-in-history');
  return data;
};

// --- Export all service functions ---
export {
  getAssets,
  addAsset,
  getLoans,
  addLoan,
  deleteLoan,
  getCylinders,
  addCylinder,
  deleteCylinder,
  addStockIn,
  getFinancialStatements,
  getRevenueAssuranceReport,
  getInventorySummary,
  getTaxComplianceReport,
  getLpgStockInHistory,
};