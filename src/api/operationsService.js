// src/api/operationsService.js
import httpClient from './httpClient';

const getPlants = async () => {
  const { data } = await httpClient.get('/operations/plants');
  return data;
};

const addPlant = async (plantData) => {
  const { data } = await httpClient.post('/operations/plants', plantData);
  return data;
};

const deletePlant = async (plantId) => {
  const { data } = await httpClient.delete(`/operations/plants/${plantId}`);
  return data;
};

const getVans = async () => {
  const { data } = await httpClient.get('/operations/vans');
  return data;
};

// NEW: Add maintenance log
const addMaintenanceLog = async (plantId, logData) => {
  const { data } = await httpClient.post(`/operations/plants/${plantId}/maintenance`, logData);
  return data;
};

// NEW: Get maintenance logs for a plant
const getMaintenanceLogs = async (plantId) => {
  const { data } = await httpClient.get(`/operations/plants/${plantId}/maintenance`);
  return data;
};

// NEW: Get plant daily output history
const getPlantDailyOutputHistory = async (plantId, days = 7) => {
  const { data } = await httpClient.get(`/operations/plants/${plantId}/daily-output-history`, { params: { days } });
  return data;
};


export { 
  getPlants, addPlant, deletePlant, getVans,
  addMaintenanceLog, getMaintenanceLogs, getPlantDailyOutputHistory // Export new functions
};