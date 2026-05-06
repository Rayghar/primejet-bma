import httpClient from './httpClient';

export const getMigrationTemplate = async (options = {}) => {
  const { data } = await httpClient.get('/migration/template', options);
  return data;
};

export const listMigrationBatches = async (params = {}, options = {}) => {
  const { data } = await httpClient.get('/migration/batches', { params, ...options });
  return data;
};

export const createMigrationBatch = async (payload = {}, options = {}) => {
  const { data } = await httpClient.post('/migration/batches', payload, options);
  return data;
};

export const getMigrationBatch = async (batchId, params = {}, options = {}) => {
  const { data } = await httpClient.get(`/migration/batches/${batchId}`, { params, ...options });
  return data;
};

export const updateMigrationStagingRecord = async (recordId, payload = {}, options = {}) => {
  const { data } = await httpClient.patch(`/migration/staging/${recordId}`, payload, options);
  return data;
};

export const dryRunMigrationBatch = async (batchId, payload = {}, options = {}) => {
  const { data } = await httpClient.post(`/migration/batches/${batchId}/dry-run`, payload, options);
  return data;
};

export const importMigrationBatch = async (batchId, payload = {}, options = {}) => {
  const { data } = await httpClient.post(`/migration/batches/${batchId}/import`, payload, options);
  return data;
};

export const startTenderRepairJob = async (payload = {}, options = {}) => {
  const { data } = await httpClient.post('/migration/repair-tender-splits/jobs', payload, options);
  return data;
};

export const getTenderRepairJob = async (jobId, options = {}) => {
  const { data } = await httpClient.get(`/migration/repair-tender-splits/jobs/${jobId}`, options);
  return data;
};

export const listTenderRepairJobs = async (options = {}) => {
  const { data } = await httpClient.get('/migration/repair-tender-splits/jobs', options);
  return data;
};
