import apiClient from './apiClient';

// --- Logistics & Runs ---
export const getUnassignedOrders = async (zoneId = null) => {
    const params = zoneId ? { zoneId } : {};
    const res = await apiClient.get('/runs/admin/unassigned-orders', { params });
    return res.data.orders || [];
};

export const getOnlineDrivers = async () => {
    // Uses the V1 user endpoint but filters for drivers + online status
    const res = await apiClient.get('/users', { 
        params: { role: 'driver', isAvailableOnline: true } 
    });
    return res.data || [];
};

export const createRunFromBatch = async (orderIds) => {
    const res = await apiClient.post('/runs/admin/create-batch', { orderIds });
    return res.data;
};

export const getActiveRuns = async () => {
    const res = await apiClient.get('/runs/admin/active');
    return res.data;
};

// --- Plant Operations ---
export const getPlants = async () => {
    const res = await apiClient.get('/api/v2/operations/plants');
    return res.data;
};

export const getMaintenanceLogs = async (plantId) => {
    const res = await apiClient.get(`/api/v2/operations/plants/${plantId}/maintenance`);
    return res.data;
};

export const addMaintenanceLog = async (plantId, logData) => {
    const res = await apiClient.post(`/api/v2/operations/plants/${plantId}/maintenance`, logData);
    return res.data;
};