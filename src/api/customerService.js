import apiClient from './apiClient';

export const getCustomers = async (search = '', page = 1) => {
    const params = { page, limit: 20, search };
    const res = await apiClient.get('/api/v2/customers', { params });
    return res.data;
};

// ✅ ADDED
export const addCustomer = async (customerData) => {
    const res = await apiClient.post('/api/v2/customers', customerData);
    return res.data;
};

export const getCustomerDetails = async (customerId) => {
    const res = await apiClient.get(`/api/v2/customers/${customerId}`);
    return res.data;
};

export const getCustomerOrders = async (customerId) => {
    const res = await apiClient.get(`/api/v2/customers/${customerId}/orders`);
    return res.data;
};

// ✅ ADDED
export const addCustomerNote = async (customerId, text, authorEmail) => {
    const res = await apiClient.post(`/api/v2/customers/${customerId}/notes`, { text, authorEmail });
    return res.data;
};

// ✅ ADDED
export const getCustomerNotes = async (customerId) => {
    const res = await apiClient.get(`/api/v2/customers/${customerId}/notes`);
    return res.data;
};

// Chat Support
export const getActiveChatThreads = async () => {
    const res = await apiClient.get('/api/v1/chat/threads?role=admin');
    return res.data;
};

export const getChatHistory = async (chatId) => {
    const res = await apiClient.get(`/api/v1/chat/${chatId}/history`);
    return res.data;
};

export const sendMessage = async (chatId, text, recipientId) => {
    return await apiClient.post('/api/v1/chat/message', { chatId, text, recipientId });
};