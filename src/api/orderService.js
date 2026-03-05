// src/api/orderService.js
import httpClient from './httpClient';

/**
 * Order Service
 * - Keeps current logistics functions
 * - Adds GL trace helpers for the new Order "Financial" tab:
 *   - getOrderById
 *   - getOrderFinancialTrace (expects backend endpoint; safe fallback)
 */

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

export const getUnassignedOrders = async (options = {}) => {
  try {
    const { data } = await httpClient.get('/orders/unassigned', options);
    return data?.orders || data || [];
  } catch (err) {
    throwNormalized(err, 'Failed to load unassigned orders');
  }
};

export const getOrderById = async (orderId, options = {}) => {
  try {
    if (!orderId) throw new Error('orderId is required');
    const { data } = await httpClient.get(`/orders/${orderId}`, options);
    return data || null;
  } catch (err) {
    throwNormalized(err, 'Failed to load order');
  }
};

/**
 * GL Trace for an order (Financial tab)
 * Backend recommended endpoint:
 *   GET /api/v2/gl/journals?sourceType=ORDER&sourceId=<mongoId>
 *
 * If it doesn't exist yet, returns null and UI can hide the section.
 */
export const getOrderFinancialTrace = async (orderMongoId, options = {}) => {
  try {
    if (!orderMongoId) throw new Error('orderMongoId is required');
    const { data } = await httpClient.get('/api/v2/gl/journals', {
      params: { sourceType: 'ORDER', sourceId: String(orderMongoId) },
      ...options,
    });
    return data || null;
  } catch (err) {
    const status = err?.response?.status;
    // If the endpoint isn't implemented yet, don't crash the UI.
    if ([404, 405].includes(status)) return null;
    throwNormalized(err, 'Failed to load order financial trace');
  }
};

export const assignOrderToVan = async (vanId, orderId, orderDetails = {}, options = {}) => {
  try {
    if (!vanId) throw new Error('vanId is required');
    if (!orderId) throw new Error('orderId is required');

    try {
      const { data } = await httpClient.post(`/runs/${orderId}/assign-driver`, { driverId: vanId, orderDetails }, options);
      return data;
    } catch (legacyErr) {
      const status = legacyErr?.response?.status;
      if (![404, 405].includes(status)) throw legacyErr;

      const { data } = await httpClient.post('/api/v2/logistics/assign-order', { vanId, orderId, orderDetails }, options);
      return data;
    }
  } catch (err) {
    throwNormalized(err, 'Failed to assign order to driver');
  }
};