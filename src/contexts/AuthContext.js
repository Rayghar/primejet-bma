// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChangedListener } from '../api/authService';

// Create the context that components will consume
export const AuthContext = createContext({
  user: null,
  loading: true,
});

// Create the provider component that will wrap the application
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use useEffect to subscribe to the Firebase auth state listener
  // This will run once when the component mounts
  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener((user) => {
      // The listener returns the user object from Firebase/Firestore
      // or null if they are logged out.
      setUser(user);
      // Once we get the first response, we are no longer loading
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []); // Empty dependency array ensures this runs only once

  const value = { user, loading };

  return (
    <AuthContext.Provider value={value}>
      {/* Render children only when not loading to prevent flicker */}
      {!loading && children}
    </AuthContext.Provider>
  );
};
