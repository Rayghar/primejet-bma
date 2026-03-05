// src/api/dataEntryService.js
import httpClient from './httpClient';
import { glPostApproved, glRetryFailed, glPostingExceptions } from './glService';

/**
 * Data Entry Service
 * - Keeps your existing data-entry routes intact
 * - Adds GL-first helpers used by Close Workspace UI:
 *   - post approved for day (calls GL)
 *   - retry failed (calls GL)
 *   - posting exceptions (calls GL)
 *
 * This avoids mixing accounting logic into UI.
 */

// -------------------- existing API wrappers --------------------

export const getDataEntries = async (filters = {}, options = {}) => {
  const { data } = await httpClient.get('/api/v2/data-entry', { params: filters, ...options });
  return data;
};

export const createDataEntry = async (payload, options = {}) => {
  const { data } = await httpClient.post('/api/v2/data-entry', payload, options);
  return data;
};

export const updateDataEntry = async (id, payload, options = {}) => {
  const { data } = await httpClient.patch(`/api/v2/data-entry/${id}`, payload, options);
  return data;
};

export const submitDataEntry = async (id, options = {}) => {
  const { data } = await httpClient.post(`/api/v2/data-entry/${id}/submit`, null, options);
  return data;
};

export const approveDataEntry = async (id, options = {}) => {
  const { data } = await httpClient.post(`/api/v2/data-entry/${id}/approve`, null, options);
  return data;
};

export const rejectDataEntry = async (id, payload, options = {}) => {
  const { data } = await httpClient.post(`/api/v2/data-entry/${id}/reject`, payload, options);
  return data;
};

// -------------------- NEW GL-first helpers --------------------

/**
 * Post all approved operational docs for a business date + branch.
 * This is what “Close Day” uses in the new UI.
 */
export const postApprovedToGLForDay = async ({ businessDate, branchIdOrZoneId }) => {
  return glPostApproved({ businessDate, branchIdOrZoneId });
};

/**
 * Retry failed postings in a date range (migration or daily ops).
 */
export const retryFailedPostings = async ({ startDate, endDate, branchIdOrZoneId }) => {
  return glRetryFailed({ startDate, endDate, branchIdOrZoneId });
};

/**
 * Fetch posting exceptions grouped by reason.
 */
export const getPostingExceptions = async ({ startDate, endDate, branchIdOrZoneId }) => {
  return glPostingExceptions({ startDate, endDate, branchIdOrZoneId });
};