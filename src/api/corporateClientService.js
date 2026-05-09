// File: src/api/corporateClientService.js
import apiClient from './apiClient';

const normalizeApiError = (err, fallback = 'Corporate client request failed') => {
  const status = err?.response?.status;
  const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback;
  const e = new Error(msg);
  e.status = status;
  e.raw = err;
  return e;
};

export const getCorporateDashboard = async (params = {}, options = {}) => {
  try {
    const res = await apiClient.get('/api/v2/corporate-clients/dashboard', { ...options, params });
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load corporate dashboard');
  }
};


export const getCorporateFulfilmentControl = async (options = {}) => {
  try {
    const res = await apiClient.get('/api/v2/corporate-clients/fulfilment-control', options);
    return res.data || { metrics: {}, pipeline: {}, latestFulfilments: [] };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load corporate fulfilment control');
  }
};

export const getCorporateClients = async (params = {}) => {
  try {
    const res = await apiClient.get('/api/v2/corporate-clients', { params });
    return res.data || { rows: [] };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load corporate clients');
  }
};

export const createCorporateClient = async (payload) => {
  try {
    const res = await apiClient.post('/api/v2/corporate-clients', payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to create corporate client');
  }
};

export const updateCorporateClient = async (clientId, payload) => {
  try {
    const res = await apiClient.patch(`/api/v2/corporate-clients/${encodeURIComponent(clientId)}`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to update corporate client');
  }
};

export const getCorporateClientDetails = async (clientId) => {
  try {
    const res = await apiClient.get(`/api/v2/corporate-clients/${encodeURIComponent(clientId)}`);
    return res.data || { client: null, fulfilments: [] };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load corporate client details');
  }
};

export const addCorporateActivity = async (clientId, payload) => {
  try {
    const res = await apiClient.post(`/api/v2/corporate-clients/${encodeURIComponent(clientId)}/activities`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to add corporate activity');
  }
};

export const getCorporateFulfilments = async (params = {}) => {
  try {
    const res = await apiClient.get('/api/v2/corporate-clients/fulfilments', { params });
    return res.data || { rows: [] };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load corporate fulfilments');
  }
};

export const createCorporateFulfilment = async (clientId, payload) => {
  try {
    const res = await apiClient.post(`/api/v2/corporate-clients/${encodeURIComponent(clientId)}/fulfilments`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to create corporate fulfilment');
  }
};

export const updateCorporateFulfilment = async (clientId, fulfilmentId, payload) => {
  try {
    const res = await apiClient.patch(`/api/v2/corporate-clients/${encodeURIComponent(clientId)}/fulfilments/${encodeURIComponent(fulfilmentId)}`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to update corporate fulfilment');
  }
};

export const linkCorporateWhatsApp = async (clientId, payload) => {
  try {
    const res = await apiClient.patch(`/api/v2/corporate-clients/${encodeURIComponent(clientId)}/link-whatsapp`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to link WhatsApp contact');
  }
};

export const getRelationshipManagers = async (options = {}) => {
  try {
    const res = await apiClient.get('/api/v2/corporate-clients/relationship-managers', options);
    return res.data || { rows: [] };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load relationship managers');
  }
};


export const updateCorporateFulfilmentStatus = async (fulfilmentId, payload) => {
  try {
    const res = await apiClient.patch(`/api/v2/corporate-clients/fulfilments/${encodeURIComponent(fulfilmentId)}/status`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to update corporate fulfilment status');
  }
};


export const getCorporatePortalUsers = async (clientId) => {
  try {
    const res = await apiClient.get(`/api/v2/corporate-clients/${encodeURIComponent(clientId)}/users`);
    return res.data || { rows: [] };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load corporate portal users');
  }
};

export const createCorporatePortalUser = async (clientId, payload) => {
  try {
    const res = await apiClient.post(`/api/v2/corporate-clients/${encodeURIComponent(clientId)}/users`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to create corporate portal user');
  }
};

export const updateCorporatePortalUser = async (clientId, userId, payload) => {
  try {
    const res = await apiClient.patch(`/api/v2/corporate-clients/${encodeURIComponent(clientId)}/users/${encodeURIComponent(userId)}`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to update corporate portal user');
  }
};

export const getCorporateSites = async (clientId) => {
  try {
    const res = await apiClient.get(`/api/v2/corporate-clients/${encodeURIComponent(clientId)}/sites`);
    return res.data || { rows: [] };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load corporate sites');
  }
};

export const createCorporateSite = async (clientId, payload) => {
  try {
    const res = await apiClient.post(`/api/v2/corporate-clients/${encodeURIComponent(clientId)}/sites`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to create corporate site');
  }
};

export const getCorporateRequests = async (params = {}) => {
  try {
    const res = await apiClient.get('/api/v2/corporate-clients/requests', { params });
    return res.data || { rows: [] };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load corporate requests');
  }
};

export const reviewCorporateRequest = async (requestId, payload) => {
  try {
    const res = await apiClient.patch(`/api/v2/corporate-clients/requests/${encodeURIComponent(requestId)}/review`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to review corporate request');
  }
};

export const convertCorporateRequestToFulfilment = async (requestId, payload = {}) => {
  try {
    const res = await apiClient.post(`/api/v2/corporate-clients/requests/${encodeURIComponent(requestId)}/convert-to-fulfilment`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to convert corporate request');
  }
};


export const createCorporateOperationalOrder = async (fulfilmentId, payload = {}) => {
  try {
    const res = await apiClient.post(`/api/v2/corporate-clients/fulfilments/${encodeURIComponent(fulfilmentId)}/create-operational-order`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to create operational order');
  }
};

export const linkCorporateFulfilmentRun = async (fulfilmentId, payload = {}) => {
  try {
    const res = await apiClient.patch(`/api/v2/corporate-clients/fulfilments/${encodeURIComponent(fulfilmentId)}/link-run`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to link fulfilment to run');
  }
};

export const getCorporateBillingDashboard = async (options = {}) => {
  try {
    const res = await apiClient.get('/api/v2/corporate-clients/billing-dashboard', options);
    return res.data || { metrics: {}, byClient: [], openInvoices: [], overdueInvoices: [] };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load corporate billing dashboard');
  }
};

export const recordCorporateFulfilmentPayment = async (fulfilmentId, payload = {}) => {
  try {
    const res = await apiClient.post(`/api/v2/corporate-clients/fulfilments/${encodeURIComponent(fulfilmentId)}/payments`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to record corporate payment');
  }
};
