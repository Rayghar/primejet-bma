// src/api/loanReadinessService.js
import httpClient from './httpClient';

const buildParams = (filters = {}) => {
  const params = {};
  ['startDate', 'endDate', 'branchId', 'loanAmount', 'annualInterestRate', 'tenorMonths', 'marginUpliftPerKg'].forEach((key) => {
    if (filters[key] !== undefined && filters[key] !== null && String(filters[key]).trim() !== '') params[key] = filters[key];
  });
  return params;
};

export const getManagementAccounts = async (filters = {}) => {
  const res = await httpClient.get('/loan-readiness/management-accounts', { params: buildParams(filters) });
  return res.data;
};

export const getLoanReadiness = async (filters = {}) => {
  const res = await httpClient.get('/loan-readiness/readiness', { params: buildParams(filters) });
  return res.data;
};

export const calculateLoanScenario = async (payload = {}) => {
  const res = await httpClient.post('/loan-readiness/loan-scenarios/calculate', payload);
  return res.data;
};

export const saveLoanScenario = async (payload = {}) => {
  const res = await httpClient.post('/loan-readiness/loan-scenarios', payload);
  return res.data;
};

export const listLoanScenarios = async (filters = {}) => {
  const res = await httpClient.get('/loan-readiness/loan-scenarios', { params: buildParams(filters) });
  return res.data;
};

export const getFundingPack = async (filters = {}) => {
  const res = await httpClient.get('/loan-readiness/funding-pack', { params: buildParams(filters) });
  return res.data;
};

export const getTruckEconomics = async (payload = {}) => {
  const res = await httpClient.post('/loan-readiness/truck-economics', payload);
  return res.data;
};

export const loanScheduleExportUrl = (scenarioId) => `/api/v2/loan-readiness/loan-scenarios/${scenarioId}/export`;
export const fundingPackExportUrl = () => '/api/v2/loan-readiness/funding-pack/export';

export default {
  getManagementAccounts,
  getLoanReadiness,
  calculateLoanScenario,
  saveLoanScenario,
  listLoanScenarios,
  getFundingPack,
  getTruckEconomics,
  loanScheduleExportUrl,
  fundingPackExportUrl,
};
