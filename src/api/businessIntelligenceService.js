// src/api/businessIntelligenceService.js
import apiClient from './apiClient';

const normalizeApiError = (err, fallback = 'Request failed') => {
  const status = err?.response?.status;
  const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback;
  const e = new Error(msg);
  e.status = status;
  e.raw = err;
  return e;
};

const mergeConfig = (options = {}, extra = {}) => ({
  ...options,
  ...extra,
  params: { ...(options?.params || {}), ...(extra?.params || {}) },
});

export const getExecutiveIntelligence = async (params = {}, options = {}) => {
  try {
    const res = await apiClient.get('/api/v2/business-intelligence/executive', mergeConfig(options, { params }));
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load executive intelligence');
  }
};

export const getActionRecommendations = async (params = {}, options = {}) => {
  try {
    const res = await apiClient.get('/api/v2/business-intelligence/actions', mergeConfig(options, { params }));
    return res.data || { actions: [] };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load action recommendations');
  }
};

export const getModuleIntelligence = async (params = {}, options = {}) => {
  try {
    const res = await apiClient.get('/api/v2/business-intelligence/modules', mergeConfig(options, { params }));
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load module intelligence');
  }
};
