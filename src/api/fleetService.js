// File: src/api/fleetService.js
import apiClient from './apiClient';

const normalizeApiError = (err, fallback = 'Fleet request failed') => {
  const status = err?.response?.status;
  const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback;
  const e = new Error(msg);
  e.status = status;
  e.raw = err;
  return e;
};

export const getFleetDashboard = async () => {
  try {
    const res = await apiClient.get('/api/v2/fleet/dashboard');
    return res.data || { metrics: {}, trucks: [], activeTrips: [], recentTrips: [], byTruck: [], byDestination: [], mobileInventory: [] };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load fleet dashboard');
  }
};

export const getTruckAssets = async (params = {}) => {
  try {
    const res = await apiClient.get('/api/v2/fleet/trucks', { params });
    return res.data || { rows: [] };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load truck assets');
  }
};

export const createTruckAsset = async (payload) => {
  try {
    const res = await apiClient.post('/api/v2/fleet/trucks', payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to create truck asset');
  }
};

export const updateTruckAsset = async (truckId, payload) => {
  try {
    const res = await apiClient.patch(`/api/v2/fleet/trucks/${encodeURIComponent(truckId)}`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to update truck asset');
  }
};

export const getTruckTrips = async (params = {}) => {
  try {
    const res = await apiClient.get('/api/v2/fleet/trips', { params });
    return res.data || { rows: [] };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load truck trips');
  }
};

export const getTruckTrip = async (tripId) => {
  try {
    const res = await apiClient.get(`/api/v2/fleet/trips/${encodeURIComponent(tripId)}`);
    return res.data || { trip: null };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load truck trip');
  }
};

export const createTruckTrip = async (payload) => {
  try {
    const res = await apiClient.post('/api/v2/fleet/trips', payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to create truck trip');
  }
};

export const updateTruckTrip = async (tripId, payload) => {
  try {
    const res = await apiClient.patch(`/api/v2/fleet/trips/${encodeURIComponent(tripId)}`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to update truck trip');
  }
};

export const updateTruckTripStatus = async (tripId, payload) => {
  try {
    const res = await apiClient.patch(`/api/v2/fleet/trips/${encodeURIComponent(tripId)}/status`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to update truck trip status');
  }
};

export const addTruckTripCost = async (tripId, payload) => {
  try {
    const res = await apiClient.post(`/api/v2/fleet/trips/${encodeURIComponent(tripId)}/costs`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to add trip cost');
  }
};

export const addTruckTripOffload = async (tripId, payload) => {
  try {
    const res = await apiClient.post(`/api/v2/fleet/trips/${encodeURIComponent(tripId)}/offloads`, payload);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to add trip offload');
  }
};

export const getMobileInventory = async (params = {}) => {
  try {
    const res = await apiClient.get('/api/v2/fleet/mobile-inventory', { params });
    return res.data || { rows: [] };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to load mobile inventory');
  }
};

export const recalculateTruckTrip = async (tripId) => {
  try {
    const res = await apiClient.post(`/api/v2/fleet/trips/${encodeURIComponent(tripId)}/recalculate`);
    return res.data || {};
  } catch (err) {
    throw normalizeApiError(err, 'Failed to recalculate trip');
  }
};
