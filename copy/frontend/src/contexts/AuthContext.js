import React, { createContext, useState, useEffect } from 'react';
import { getCurrentUser, logoutUser, signInUser } from '../api/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = getCurrentUser();
        if (storedUser) setUser(storedUser);
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const data = await signInUser(email, password);
        setUser(data.user);
        return data;
    };

    const logout = () => {
        logoutUser();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};