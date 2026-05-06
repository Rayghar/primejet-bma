// src/api/httpClient.js
import axios from 'axios';

// Determine the API base URL from environment variables.
// In a production environment, REACT_APP_API_URL should be set to your deployed backend URL.
// During development, it might be 'http://localhost:3000' or similar.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Create a custom Axios instance.
// This instance will be pre-configured with common settings for your API calls.
const httpClient = axios.create({
  baseURL: `${API_URL}/api/v2`, // All requests will be prefixed with your backend URL and the /api/v2 path
  headers: {
    'Content-Type': 'application/json', // Default content type for requests
  },
});

// Add a request interceptor to automatically include the JWT token.
// This ensures that every outgoing request made using this httpClient
// will have the Authorization header set if a token is available in local storage.
httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Retrieve the JWT from local storage
    if (token) {
      // If a token exists, set the Authorization header in the format "Bearer <token>"
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // Return the modified configuration
  },
  (error) => {
    // Handle request errors (e.g., network issues before sending the request)
    return Promise.reject(error);
  }
);

// You can also add response interceptors here to handle global errors (e.g., 401 Unauthorized)
// or transform responses before they reach your components.
httpClient.interceptors.response.use(
  (response) => {
    return response; // Simply return the response if it's successful
  },
  (error) => {
    // Handle response errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Response Error:', error.response.status, error.response.data);
      // You could implement global error handling here, e.g., redirect to login on 401
      // if (error.response.status === 401) {
      //   // Optionally, clear token and redirect to login
      //   localStorage.removeItem('token');
      //   window.location.href = '/login'; // Or use a router history push
      // }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Request Error: No response received', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up API request:', error.message);
    }
    return Promise.reject(error); // Re-throw the error so it can be caught by calling code
  }
);

export default httpClient;