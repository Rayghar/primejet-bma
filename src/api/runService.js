// src/api/runService.js
import httpClient from './httpClient';

/**
 * Fetches all active runs.
 * @returns {Promise<Array<object>>} List of active runs.
 */
const getActiveRuns = async () => {
  const { data } = await httpClient.get('/runs/admin/active'); // Assuming this is admin endpoint
  return data;
};

/**
 * Fetches a specific run's details.
 * @param {string} runId - The ID of the run.
 * @returns {Promise<object>} Detailed run object.
 */
const getRunDetails = async (runId) => {
  const { data } = await httpClient.get(`/runs/${runId}`);
  return data;
};

/**
 * Fetches a driver's run history.
 * @param {string} driverId - The ID of the driver.
 * @param {object} filters - Pagination and other filters.
 * @returns {Promise<object>} Paginated run history.
 */
const getDriverRunHistory = async (driverId, filters = {}) => {
  const { data } = await httpClient.get(`/runs/driver/${driverId}/history`, { params: filters });
  return data;
};

/**
 * Fetches unassigned orders.
 * @returns {Promise<Array<object>>} List of unassigned orders.
 */
const getUnassignedOrders = async () => {
  const { data } = await httpClient.get('/runs/admin/unassigned-orders');
  return data.orders; // Assuming backend returns { orders: [...], ... }
};

/**
 * Assigns a driver to a run.
 * @param {string} runId - The ID of the run.
 * @param {string} driverId - The ID of the driver to assign.
 * @returns {Promise<object>} The updated run.
 */
const assignDriverToRun = async (runId, driverId) => {
  const { data } = await httpClient.put(`/runs/${runId}/assign-driver`, { driverId });
  return data;
};

export {
  getActiveRuns,
  getRunDetails,
  getDriverRunHistory,
  getUnassignedOrders,
  assignDriverToRun,
};