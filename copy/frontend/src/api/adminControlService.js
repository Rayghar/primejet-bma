// src/api/adminControlService.js
import apiClient from './apiClient';

const normalize = (err, fallback) => {
  const e = new Error(err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback);
  e.status = err?.response?.status;
  e.raw = err;
  return e;
};

export const getAdminControlCenter = async (options = {}) => {
  try {
    const res = await apiClient.get('/api/v2/admin-control/control-center', options);
    return res.data || {};
  } catch (err) {
    throw normalize(err, 'Failed to load admin control center');
  }
};

export const getAdminDataQuality = async (options = {}) => {
  try {
    const res = await apiClient.get('/api/v2/admin-control/data-quality', options);
    return res.data || { checks: [] };
  } catch (err) {
    throw normalize(err, 'Failed to load data quality dashboard');
  }
};

export const getAdminSystemHealth = async (options = {}) => {
  try {
    const res = await apiClient.get('/api/v2/admin-control/system-health', options);
    return res.data || {};
  } catch (err) {
    throw normalize(err, 'Failed to load system health');
  }
};

export const getAdminOperationsGuide = async (options = {}) => {
  try {
    const res = await apiClient.get('/api/v2/admin-control/operations-guide', options);
    return res.data || { modules: [] };
  } catch (err) {
    throw normalize(err, 'Failed to load operations guide');
  }
};
