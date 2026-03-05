// src/api/glService.js
import apiClient from './apiClient';

/**
 * GL Service (v2)
 * - Calls GL orchestrator endpoints (GL-first flow)
 * - NOTE: these endpoints must exist in backend gl.routes.js + gl.controller.js
 */

const hasVal = (v) => v !== undefined && v !== null && String(v).trim() !== '';

const normalizeApiError = (err, fallback = 'Request failed') => {
  const status = err?.response?.status;
  const serverMsg = err?.response?.data?.message || err?.response?.data?.error || err?.response?.data?.msg;
  const msg = serverMsg || err?.message || fallback;

  const e = new Error(msg);
  e.status = status;
  e.raw = err;
  throw e;
};

export const glBootstrap = async () => {
  try {
    const res = await apiClient.post('/api/v2/gl/bootstrap');
    return res.data;
  } catch (err) {
    normalizeApiError(err, 'Failed to bootstrap GL');
  }
};

export const glRebuild = async ({ startDate, endDate, branchIdOrZoneId } = {}) => {
  try {
    if (!hasVal(startDate) || !hasVal(endDate)) throw new Error('startDate and endDate are required');

    const params = {
      startDate,
      endDate,
    };

    if (hasVal(branchIdOrZoneId)) {
      params.branchId = branchIdOrZoneId;
      params.serviceZoneId = branchIdOrZoneId;
    }

    const res = await apiClient.post('/api/v2/gl/rebuild', null, { params });
    return res.data;
  } catch (err) {
    normalizeApiError(err, 'Failed to rebuild GL');
  }
};

export const glTrialBalance = async ({ startDate, endDate, branchIdOrZoneId } = {}) => {
  try {
    if (!hasVal(startDate) || !hasVal(endDate)) throw new Error('startDate and endDate are required');

    const params = { startDate, endDate };
    if (hasVal(branchIdOrZoneId)) {
      params.branchId = branchIdOrZoneId;
      params.serviceZoneId = branchIdOrZoneId;
    }

    const res = await apiClient.get('/api/v2/gl/trial-balance', { params });
    return res.data;
  } catch (err) {
    normalizeApiError(err, 'Failed to load trial balance');
  }
};

export const glPostApproved = async ({ businessDate, branchIdOrZoneId } = {}) => {
  try {
    if (!hasVal(businessDate)) throw new Error('businessDate is required');

    const params = { date: businessDate };
    if (hasVal(branchIdOrZoneId)) {
      params.branchId = branchIdOrZoneId;
      params.serviceZoneId = branchIdOrZoneId;
    }

    // Your backend workplan calls this: POST /api/v2/gl/post-approved?date=YYYY-MM-DD&branchId=
    const res = await apiClient.post('/api/v2/gl/post-approved', null, { params });
    return res.data;
  } catch (err) {
    normalizeApiError(err, 'Failed to post approved documents to GL');
  }
};

export const glRetryFailed = async ({ startDate, endDate, branchIdOrZoneId } = {}) => {
  try {
    if (!hasVal(startDate) || !hasVal(endDate)) throw new Error('startDate and endDate are required');

    const params = { startDate, endDate };
    if (hasVal(branchIdOrZoneId)) {
      params.branchId = branchIdOrZoneId;
      params.serviceZoneId = branchIdOrZoneId;
    }

    // Your backend workplan calls this: POST /api/v2/gl/retry-failed?startDate=...&endDate=...
    const res = await apiClient.post('/api/v2/gl/retry-failed', null, { params });
    return res.data;
  } catch (err) {
    normalizeApiError(err, 'Failed to retry failed postings');
  }
};

export const glPostingExceptions = async ({ startDate, endDate, branchIdOrZoneId } = {}) => {
  try {
    if (!hasVal(startDate) || !hasVal(endDate)) throw new Error('startDate and endDate are required');

    const params = { startDate, endDate };
    if (hasVal(branchIdOrZoneId)) {
      params.branchId = branchIdOrZoneId;
      params.serviceZoneId = branchIdOrZoneId;
    }

    // Your backend workplan calls this: GET /api/v2/gl/posting-exceptions?startDate=...&endDate=...
    const res = await apiClient.get('/api/v2/gl/posting-exceptions', { params });
    return res.data;
  } catch (err) {
    normalizeApiError(err, 'Failed to load posting exceptions');
  }
};