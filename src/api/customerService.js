// src/api/customerService.js
import httpClient from './httpClient';

/**
 * Fetches a list of all customers.
 * @returns {Promise<Array<object>>} An array of customer objects.
 */
const getCustomers = async () => {
  const { data } = await httpClient.get('/customers');
  return data;
};

/**
 * Adds a new customer to the system.
 * @param {object} customerData - The data for the new customer.
 * @returns {Promise<object>} The newly created customer object.
 */
const addCustomer = async (customerData) => {
  const { data } = await httpClient.post('/customers', customerData);
  return data.customer; // Assuming backend returns { message, customer }
};

/**
 * Fetches detailed information for a single customer.
 * @param {string} customerId - The ID of the customer.
 * @returns {Promise<object>} The detailed customer object.
 */
const getCustomerDetails = async (customerId) => {
  const { data } = await httpClient.get(`/customers/${customerId}`);
  return data;
};

/**
 * Fetches a customer's order history.
 * @param {string} customerId - The ID of the customer.
 * @returns {Promise<Array<object>>} An array of order objects.
 */
const getCustomerOrders = async (customerId) => {
  const { data } = await httpClient.get(`/customers/${customerId}/orders`);
  return data;
};

/**
 * Adds a new note to a customer's profile.
 * @param {string} customerId - The ID of the customer.
 * @param {string} noteText - The content of the note.
 * @param {string} authorEmail - The email of the user adding the note.
 * @returns {Promise<object>} The newly created note object.
 */
const addCustomerNote = async (customerId, noteText, authorEmail) => {
  const { data } = await httpClient.post(`/customers/${customerId}/notes`, { text: noteText, authorEmail });
  return data.note; // Assuming backend returns { message, note }
};

/**
 * Fetches all notes for a specific customer.
 * @param {string} customerId - The ID of the customer.
 * @returns {Promise<Array<object>>} An array of note objects.
 */
const getCustomerNotes = async (customerId) => {
  const { data } = await httpClient.get(`/customers/${customerId}/notes`);
  return data;
};

export {
  getCustomers,
  addCustomer,
  getCustomerDetails,
  getCustomerOrders,
  addCustomerNote,
  getCustomerNotes,
};