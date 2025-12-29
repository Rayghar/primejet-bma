import apiClient from './apiClient';

// --- Logistics & Runs ---
export const getUnassignedOrders = async (zoneId = null) => {
    const params = zoneId ? { zoneId } : {};
    const res = await apiClient.get('/runs/admin/unassigned-orders', { params });
    return res.data.orders || [];
};

export const getOnlineDrivers = async () => {
    // ✅ FIX: Ensure this hits /api/v1/users correctly
    const res = await apiClient.get('/users', { 
        params: { role: 'driver', isAvailableOnline: true } 
    });
    return res.data || []; // Ensure it returns array
};

export const createRunFromBatch = async (orderIds) => {
    const res = await apiClient.post('/runs/admin/create-batch', { orderIds });
    return res.data;
};

export const getActiveRuns = async () => {
    const res = await apiClient.get('/runs/admin/active');
    return res.data;
};

// --- Operations ---
export const assignDriver = async (runId, driverId) => {
    const res = await apiClient.put(`/runs/${runId}/assign-driver`, { driverId });
    return res.data;
};

// --- Plant Operations ---
export const getPlants = async () => {
    // ✅ FIX: Ensure this hits /api/v2/operations/plants (v2 route)
    const res = await apiClient.get('/api/v2/operations/plants');
    return res.data;
};

export const addPlant = async (plantData) => {
    const res = await apiClient.post('/api/v2/operations/plants', plantData);
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