// src/api/userService.js
import httpClient from './httpClient';

const normalizeUsersResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.data?.users)) return payload.data.users;
  return [];
};


const normalizeBranchOptionsResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.branches)) return payload.branches;
  if (Array.isArray(payload?.data?.branches)) return payload.data.branches;
  if (Array.isArray(payload?.plants)) return payload.plants;
  if (Array.isArray(payload?.data?.plants)) return payload.data.plants;
  if (Array.isArray(payload?.zones)) return payload.zones;
  if (Array.isArray(payload?.data?.zones)) return payload.data.zones;
  return [];
};

const getBranchOptions = async () => {
  const { data } = await httpClient.get('/users/admin/branch-options');
  return normalizeBranchOptionsResponse(data);
};

const getUsers = async () => {
  const { data } = await httpClient.get('/users/admin');
  return normalizeUsersResponse(data);
};

const buildStaffPayload = (payloadOrEmail, role, name) => {
  if (typeof payloadOrEmail === 'object' && payloadOrEmail !== null) return payloadOrEmail;
  return {
    email: payloadOrEmail,
    role,
    name: name || 'New User',
  };
};

const inviteUser = async (payloadOrEmail, role, name) => {
  const payload = buildStaffPayload(payloadOrEmail, role, name);
  const requestBody = {
    name: payload.name || 'New User',
    email: payload.email,
    phone: payload.phone || '',
    role: payload.role || 'cashier',
    password: payload.password || 'Temporary1!',
    branchScope: payload.branchScope || 'all',
    allowedBranches: Array.isArray(payload.allowedBranches) ? payload.allowedBranches : [],
    permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    permissionOverrides: payload.permissionOverrides || { add: [], remove: [] },
    status: payload.status || 'active',
    mustChangePassword: payload.mustChangePassword !== false,
    accessNotes: payload.accessNotes || '',
  };
  const { data } = await httpClient.post('/users/admin', requestBody);
  return data;
};

const updateUserRole = async (userId, role) => {
  const { data } = await httpClient.put(`/users/admin/${userId}/role`, { role });
  return data;
};

const getSingleUser = async (userId) => {
  const { data } = await httpClient.get(`/users/admin/${userId}`);
  return data;
};

const updateUser = async (userId, updateData) => {
  const { data } = await httpClient.put(`/users/admin/${userId}`, updateData);
  return data;
};

const deleteUser = async (userId) => {
  const { data } = await httpClient.delete(`/users/admin/${userId}`);
  return data;
};

const getDriverStats = async (driverId, period = 'allTime') => {
  const { data } = await httpClient.get(`/users/drivers/${driverId}/stats`, { params: { period } });
  return data;
};

export { getUsers, getBranchOptions, inviteUser, updateUserRole, getSingleUser, updateUser, deleteUser, getDriverStats };
