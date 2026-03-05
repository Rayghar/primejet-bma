// src/api/inventoryService.js
import apiClient from './apiClient';

// -----------------------------
// Helpers
// -----------------------------
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
};

const normalizeApiError = (err, fallback = 'Request failed') => {
  const status = err?.response?.status;
  const serverMsg =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.response?.data?.msg;

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

const buildScopeParams = (branchIdOrOptions, maybeOptions = {}) => {
  // supports:
  //   fn()
  //   fn(branchId)
  //   fn({ signal, headers })
  //   fn(branchId, { signal })
  let branchId = null;
  let options = {};

  if (
    branchIdOrOptions &&
    typeof branchIdOrOptions === 'object' &&
    !Array.isArray(branchIdOrOptions)
  ) {
    options = branchIdOrOptions;
  } else if (branchIdOrOptions) {
    branchId = branchIdOrOptions;
    options = maybeOptions || {};
  }

  const params = {
    ...(options.params || {}),
  };

  if (branchId) {
    params.branchId = branchId;
  }

  return {
    ...options,
    params,
  };
};

// --- Inventory & Stock ---
export const getInventorySummary = async (branchIdOrOptions, options) => {
  try {
    const config = buildScopeParams(branchIdOrOptions, options);
    const res = await apiClient.get('/api/v2/inventory/summary', config);
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to load inventory summary');
  }
};

export const getStockInHistory = async (branchIdOrOptions, options) => {
  try {
    const config = buildScopeParams(branchIdOrOptions, options);
    const res = await apiClient.get('/api/v2/inventory/stock-in-history', config);
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to load stock-in history');
  }
};

export const addStockIn = async (data, options = {}) => {
  try {
    // Normalize numeric fields defensively (UI sometimes sends strings)
    const payload = {
      ...data,
      quantityKg: data?.quantityKg !== undefined ? toNum(data.quantityKg) : data?.quantityKg,
      costPerKg: data?.costPerKg !== undefined ? toNum(data.costPerKg) : data?.costPerKg,
      targetSalePricePerKg:
        data?.targetSalePricePerKg !== undefined
          ? toNum(data.targetSalePricePerKg)
          : data?.targetSalePricePerKg,
      // ✅ backend supports branchId (or serviceZoneId alias)
      branchId: data?.branchId || data?.serviceZoneId,
    };

    const res = await apiClient.post('/api/v2/inventory/stock-in', payload, options);
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to add stock-in');
  }
};

// --- Cylinders ---
export const getCylinders = async (branchIdOrOptions, options) => {
  try {
    const config = buildScopeParams(branchIdOrOptions, options);
    const res = await apiClient.get('/api/v2/inventory/cylinders', config);
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to load cylinders');
  }
};

export const addCylinder = async (data, options = {}) => {
  try {
    const payload = {
      ...data,
      quantity: data?.quantity !== undefined ? toNum(data.quantity) : data?.quantity,
      branchId: data?.branchId || data?.serviceZoneId,
    };
    const res = await apiClient.post('/api/v2/inventory/cylinders', payload, options);
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to add cylinder');
  }
};

export const deleteCylinder = async (id, options = {}) => {
  try {
    if (!id) throw new Error('cylinder id is required');
    const res = await apiClient.delete(`/api/v2/inventory/cylinders/${id}`, options);
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to delete cylinder');
  }
};

// --- Assets ---
export const getAssets = async (branchIdOrOptions, options) => {
  try {
    const config = buildScopeParams(branchIdOrOptions, options);
    const res = await apiClient.get('/api/v2/inventory/assets', config);
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to load assets');
  }
};

export const addAsset = async (data, options = {}) => {
  try {
    const payload = {
      ...data,
      cost: data?.cost !== undefined ? toNum(data.cost) : data?.cost,
      branchId: data?.branchId || data?.serviceZoneId,
    };
    const res = await apiClient.post('/api/v2/inventory/assets', payload, options);
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to add asset');
  }
};

export const deleteAsset = async (id, options = {}) => {
  try {
    if (!id) throw new Error('asset id is required');
    const res = await apiClient.delete(`/api/v2/inventory/assets/${id}`, options);
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to delete asset');
  }
};

// --- Loans ---
export const getLoans = async (branchIdOrOptions, options) => {
  try {
    const config = buildScopeParams(branchIdOrOptions, options);
    const res = await apiClient.get('/api/v2/inventory/loans', config);
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to load loans');
  }
};

export const addLoan = async (data, options = {}) => {
  try {
    const payload = {
      ...data,
      principal: data?.principal !== undefined ? toNum(data.principal) : data?.principal,
      interestRate: data?.interestRate !== undefined ? toNum(data.interestRate) : data?.interestRate,
      term: data?.term !== undefined ? toNum(data.term) : data?.term,
      branchId: data?.branchId || data?.serviceZoneId,
    };
    const res = await apiClient.post('/api/v2/inventory/loans', payload, options);
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to add loan');
  }
};

export const deleteLoan = async (id, options = {}) => {
  try {
    if (!id) throw new Error('loan id is required');
    const res = await apiClient.delete(`/api/v2/inventory/loans/${id}`, options);
    return res.data;
  } catch (err) {
    throwNormalized(err, 'Failed to delete loan');
  }
};
