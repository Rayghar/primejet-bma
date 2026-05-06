// File: src/api/whatsappService.js
import apiClient from './apiClient';

const normalizeApiError = (err, fallback = 'WhatsApp request failed') => {
  const status = err?.response?.status;
  const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback;
  const e = new Error(msg);
  e.status = status;
  e.raw = err;
  return e;
};

export const getWhatsAppDashboard = async (params = {}) => {
  try {
    const res = await apiClient.get('/api/v2/whatsapp/dashboard', { params });
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load WhatsApp dashboard');
  }
};

export const getWhatsAppSetupChecklist = async () => {
  try {
    const res = await apiClient.get('/api/v2/whatsapp/setup-checklist');
    return res.data || { checklist: [] };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load WhatsApp setup checklist');
  }
};

export const getWhatsAppRequests = async (params = {}) => {
  try {
    const res = await apiClient.get('/api/v2/whatsapp/requests', { params });
    return res.data || { requests: [] };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load WhatsApp requests');
  }
};

export const getWhatsAppConversations = async (params = {}) => {
  try {
    const res = await apiClient.get('/api/v2/whatsapp/conversations', { params });
    return res.data || { contacts: [] };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load WhatsApp conversations');
  }
};

export const getWhatsAppMessages = async (phone, params = {}) => {
  try {
    const res = await apiClient.get(`/api/v2/whatsapp/conversations/${encodeURIComponent(phone)}/messages`, { params });
    return res.data || { messages: [] };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load WhatsApp messages');
  }
};

export const simulateWhatsAppInbound = async (payload) => {
  try {
    const res = await apiClient.post('/api/v2/whatsapp/simulate-inbound', payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to simulate WhatsApp inbound message');
  }
};

export const sendWhatsAppMessage = async (payload) => {
  try {
    const res = await apiClient.post('/api/v2/whatsapp/send-message', payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to send WhatsApp message');
  }
};

export const updateWhatsAppRequestStatus = async (requestId, payload) => {
  try {
    const res = await apiClient.patch(`/api/v2/whatsapp/requests/${requestId}/resolve`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to update WhatsApp request');
  }
};

export const getWhatsAppOrderDrafts = async (params = {}) => {
  try {
    const res = await apiClient.get('/api/v2/whatsapp/order-drafts', { params });
    return res.data || { drafts: [] };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load WhatsApp order drafts');
  }
};

export const updateWhatsAppOrderDraft = async (draftId, payload) => {
  try {
    const res = await apiClient.patch(`/api/v2/whatsapp/order-drafts/${encodeURIComponent(draftId)}`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to update WhatsApp order draft');
  }
};

export const cancelWhatsAppOrderDraft = async (draftId, payload = {}) => {
  try {
    const res = await apiClient.patch(`/api/v2/whatsapp/order-drafts/${encodeURIComponent(draftId)}/cancel`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to cancel WhatsApp order draft');
  }
};

export const convertWhatsAppDraftToOrder = async (draftId, payload = {}) => {
  try {
    const res = await apiClient.post(`/api/v2/whatsapp/order-drafts/${encodeURIComponent(draftId)}/convert-to-order`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to convert WhatsApp draft to order');
  }
};

export const searchWhatsAppCustomers = async (params = {}) => {
  try {
    const res = await apiClient.get('/api/v2/whatsapp/customers/search', { params });
    return res.data || { customers: [] };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to search customers');
  }
};

export const linkWhatsAppContactToCustomer = async (contactId, payload) => {
  try {
    const res = await apiClient.patch(`/api/v2/whatsapp/contacts/${encodeURIComponent(contactId)}/link-customer`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to link WhatsApp contact to customer');
  }
};

export const createCustomerFromWhatsAppContact = async (contactId, payload = {}) => {
  try {
    const res = await apiClient.post(`/api/v2/whatsapp/contacts/${encodeURIComponent(contactId)}/create-customer`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to create customer from WhatsApp contact');
  }
};

export const getWhatsAppSettings = async () => {
  try {
    const res = await apiClient.get('/api/v2/whatsapp/settings');
    return res.data || { settings: {}, runtime: {} };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load WhatsApp settings');
  }
};

export const updateWhatsAppSettings = async (payload) => {
  try {
    const res = await apiClient.patch('/api/v2/whatsapp/settings', payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to update WhatsApp settings');
  }
};

export const getWhatsAppHealth = async () => {
  try {
    const res = await apiClient.get('/api/v2/whatsapp/health');
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load WhatsApp integration health');
  }
};

export const testWhatsAppConnection = async () => {
  try {
    const res = await apiClient.post('/api/v2/whatsapp/test-connection');
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to test WhatsApp connection');
  }
};

export const sendWhatsAppTestMessage = async (payload) => {
  try {
    const res = await apiClient.post('/api/v2/whatsapp/test-message', payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to send WhatsApp test message');
  }
};

export const syncWhatsAppTemplates = async () => {
  try {
    const res = await apiClient.post('/api/v2/whatsapp/templates/sync');
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to sync WhatsApp templates');
  }
};
