// src/api/supportService.js
import apiClient from './apiClient';

const normalizeApiError = (err, fallback = 'Request failed') => {
  const status = err?.response?.status;
  const serverMsg = err?.response?.data?.message || err?.response?.data?.error || err?.response?.data?.msg;
  const msg = serverMsg || err?.message || fallback;
  return { message: msg, status, raw: err };
};

const throwNormalized = (err, fallback) => {
  const ex = normalizeApiError(err, fallback);
  const e = new Error(ex.message);
  e.status = ex.status;
  e.raw = ex.raw;
  throw e;
};

const mergeConfig = (options = {}, extra = {}) => ({
  ...options,
  ...extra,
  params: {
    ...(options?.params || {}),
    ...(extra?.params || {}),
  },
});

// -----------------------------
// Support dashboard / hub
// -----------------------------
export const getSupportHub = async (params = {}, options = {}) => {
  try {
    const res = await apiClient.get('/api/v2/support/hub', mergeConfig(options, { params }));
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to load support hub');
  }
};

export const getSupportDashboard = async (options = {}) => {
  try {
    const res = await apiClient.get('/api/v2/support/dashboard', options);
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to load support dashboard');
  }
};

// -----------------------------
// Tickets / complaints
// -----------------------------
export const listSupportTickets = async (params = {}, options = {}) => {
  try {
    const res = await apiClient.get('/api/v2/support/tickets', mergeConfig(options, { params }));
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to load support tickets');
  }
};

export const createSupportTicket = async (payload, options = {}) => {
  try {
    const res = await apiClient.post('/api/v2/support/tickets', payload, options);
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to create support ticket');
  }
};

export const updateSupportTicket = async (ticketId, payload, options = {}) => {
  try {
    if (!ticketId) throw new Error('ticketId is required');
    const res = await apiClient.patch(`/api/v2/support/tickets/${ticketId}`, payload, options);
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to update support ticket');
  }
};

export const addTicketNote = async (ticketId, text, noteType = 'INTERNAL', options = {}) => {
  try {
    if (!ticketId) throw new Error('ticketId is required');
    if (!text?.trim()) throw new Error('note text is required');
    const res = await apiClient.post(`/api/v2/support/tickets/${ticketId}/notes`, { text: text.trim(), noteType }, options);
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to add ticket note');
  }
};

export const createFailedDeliveryTicket = async (payload, options = {}) => {
  try {
    const res = await apiClient.post('/api/v2/support/tickets/from-failed-delivery', payload, options);
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to create failed-delivery ticket');
  }
};

// -----------------------------
// Customer 360 / timeline
// -----------------------------
export const getCustomer360 = async (customerId, options = {}) => {
  try {
    if (!customerId) throw new Error('customerId is required');
    const res = await apiClient.get(`/api/v2/support/customers/${customerId}/360`, options);
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to load customer 360');
  }
};

export const getCustomerTimeline = async (customerId, params = {}, options = {}) => {
  try {
    if (!customerId) throw new Error('customerId is required');
    const res = await apiClient.get(`/api/v2/support/customers/${customerId}/timeline`, mergeConfig(options, { params }));
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to load customer timeline');
  }
};

// -----------------------------
// Customers
// -----------------------------
export const getCustomers = async (search = '', page = 1, options = {}) => {
  try {
    const params = { page, limit: 20, search };
    const res = await apiClient.get('/api/v2/customers', mergeConfig(options, { params }));
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to load customers');
  }
};

export const getCustomerOrders = async (customerId, options = {}) => {
  try {
    if (!customerId) throw new Error('customerId is required');
    const res = await apiClient.get(`/api/v2/customers/${customerId}/orders`, options);
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to load customer orders');
  }
};

// -----------------------------
// Chat
// -----------------------------
export const getActiveChatThreads = async (options = {}) => {
  try {
    const res = await apiClient.get('/api/v1/chat/threads', options);
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to load chat threads');
  }
};

export const getChatHistory = async (chatId, options = {}) => {
  try {
    if (!chatId) throw new Error('chatId is required');
    const res = await apiClient.get(`/api/v1/chat/${chatId}/history`, options);
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to load chat history');
  }
};

export const sendMessage = async (chatId, text, recipientId, options = {}) => {
  try {
    if (!chatId) throw new Error('chatId is required');
    if (!text?.trim()) throw new Error('message text is required');
    const res = await apiClient.post('/api/v1/chat/message', { chatId, text: text.trim(), recipientId }, options);
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to send message');
  }
};
