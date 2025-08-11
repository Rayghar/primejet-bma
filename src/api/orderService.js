// src/api/orderService.js
import httpClient from './httpClient';

/**
 * Fetches a list of unassigned orders from the backend.
 * @returns {Promise<Array<object>>} A list of unassigned orders.
 */
const getUnassignedOrders = async () => {
  const { data } = await httpClient.get('/orders/unassigned'); // Assuming /orders/unassigned endpoint
  return data.orders; // Assuming backend returns { orders: [...], ... }
};

/**
 * Assigns an order to a van (driver) on the backend.
 * @param {string} vanId - The ID of the van.
 * @param {string} orderId - The ID of the order.
 * @param {object} orderDetails - Details of the order (e.g., location data).
 * @returns {Promise<object>} The backend response.
 */
const assignOrderToVan = async (vanId, orderId, orderDetails) => {
  // This endpoint might be under /runs or /orders depending on backend design
  const { data } = await httpClient.post(`/runs/${orderId}/assign-driver`, { driverId: vanId, orderDetails }); // Assuming vanId maps to driverId on backend
  return data;
};

export { getUnassignedOrders, assignOrderToVan };