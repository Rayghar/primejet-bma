// src/api/authService.js
import httpClient from './httpClient';

/**
 * Logs in a user with email and password by sending a request to the Node.js backend.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<object>} The server response containing the JWT token and user data.
 */
const loginUser = async (email, password) => {
  const { data } = await httpClient.post('/auth/login', { email, password });
  return data;
};

/**
 * Fetches the profile of the currently authenticated user from the backend.
 * This is used to hydrate the user state after a page refresh or initial load.
 * @returns {Promise<object>} The user's profile data.
 */
const getMyProfile = async () => {
  const { data } = await httpClient.get('/users/me');
  return data;
};

/**
 * Logs out the user by removing the JWT token from local storage.
 */
const logoutUser = () => {
  localStorage.removeItem('token');
};

export { loginUser, getMyProfile, logoutUser };