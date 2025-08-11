// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { loginUser, getMyProfile, logoutUser } from '../api/authService'; // Import the new auth service functions

// Create the AuthContext. This will be used by components to access auth state.
const AuthContext = createContext();

/**
 * AuthProvider component.
 * This component wraps your application and provides the authentication state
 * (user data, loading status) and authentication actions (login, logout)
 * to all its children components via the AuthContext.
 * It manages the JWT token in local storage and synchronizes the user state
 * with the backend.
 * @param {object} { children } - React children to be rendered within the provider's scope.
 */
const AuthProvider = ({ children }) => {
  // State to hold the authenticated user's data. Null if not authenticated.
  const [user, setUser] = useState(null);
  // State to indicate if the authentication status is currently being loaded/checked.
  const [loading, setLoading] = useState(true);

  // useEffect hook to check authentication status when the component mounts.
  // This ensures that the user remains logged in across page refreshes if a valid
  // token exists in local storage.
  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true); // Start loading state
      const token = localStorage.getItem('token'); // Attempt to retrieve JWT from local storage

      if (token) {
        try {
          // If a token is found, try to fetch the user's profile from the backend.
          // This validates the token and gets up-to-date user information.
          const profile = await getMyProfile();
          // Ensure the user object always has a 'role' property, defaulting if necessary
          setUser({
            id: profile.id,
            email: profile.email,
            role: profile.role || 'customer', // IMPORTANT FIX: Default to 'customer' if role is missing
            name: profile.name, // Include name for display in sidebar
            // Copy other necessary profile properties from the backend response
            // e.g., phone: profile.phone, walletBalance: profile.walletBalance, etc.
          });
        } catch (error) {
          // If fetching the profile fails (e.g., token is expired, invalid, or user not found),
          // log the error and perform a client-side logout to clear the invalid token.
          console.error('Authentication check failed during profile fetch:', error);
          logoutUser(); // Clear the invalid token from local storage
          setUser(null); // Ensure user state is null
        }
      }
      setLoading(false); // Authentication check is complete, regardless of outcome
    };

    checkAuthStatus();
  }, []); // Empty dependency array ensures this effect runs only once on initial mount

  /**
   * Handles the user login process.
   * This function sends credentials to the backend, stores the received JWT,
   * and updates the application's user state.
   * @param {string} email - The email address provided by the user.
   * @param {string} password - The password provided by the user.
   * @returns {Promise<void>} A promise that resolves if login is successful.
   * @throws {Error} Throws an error if the login operation fails, allowing the
   * calling component (e.g., Login.js) to display an error message.
   */
  const login = async (email, password) => {
    setLoading(true); // Indicate that a login attempt is in progress
    try {
      // Call the loginUser service to authenticate with the Node.js backend
      const { token, user: userData } = await loginUser(email, password);
      localStorage.setItem('token', token); // Store the received JWT in local storage for persistence
      // Ensure the user object set after login also has a 'role' property, defaulting if necessary
      setUser({
        id: userData.id,
        email: userData.email,
        role: userData.role || 'customer', // IMPORTANT FIX: Default to 'customer' if role is missing
        name: userData.name, // Include name for display
        // Copy other necessary properties from userData
      });
      setLoading(false); // Login successful, clear loading state
    } catch (error) {
      setLoading(false); // Login failed, clear loading state
      // Re-throw the error so that the Login component can catch it and display
      // appropriate feedback to the user (e.g., "Invalid credentials").
      throw error;
    }
  };

  /**
   * Handles the user logout process.
   * This function clears the user state in the application and removes the
   * authentication token from local storage, effectively ending the user's session.
   */
  const logout = () => {
    logoutUser(); // Call the logoutUser service to remove the token from local storage
    setUser(null); // Clear the user state, effectively logging out the user in the UI
  };

  // The value provided by the context. Any component consuming this context
  // will receive these values.
  const authContextValue = {
    user,      // The authenticated user object (or null)
    loading,   // Boolean indicating if auth status is being determined
    login,     // Function to initiate login
    logout     // Function to initiate logout
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };