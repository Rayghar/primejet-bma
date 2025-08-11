// src/api/logisticsService.js
import httpClient from './httpClient';

/**
 * Assigns a specific order to a van/driver.
 * @param {string} vanId - The ID of the van.
 * @param {string} orderId - The ID of the order to assign.
 * @returns {Promise<object>} The backend response.
 */
const assignOrderToVan = async (vanId, orderId) => {
    const { data } = await httpClient.post('/logistics/assign-order', { vanId, orderId });
    return data;
};

export { assignOrderToVan };