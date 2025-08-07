// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { auth } from '../api/firebase';
import { getUserProfile, createUserProfile } from '../api/firestoreService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleAuth = async (firebaseUser) => {
            if (firebaseUser && !firebaseUser.isAnonymous) {
                const userProfile = await getUserProfile(firebaseUser.uid);
                setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...(userProfile || await createUserProfile(firebaseUser.uid, firebaseUser.email)) });
            } else {
                setUser(null); // No user or anonymous user
            }
            setLoading(false);
        };

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                await handleAuth(firebaseUser);
            } else {
                const customToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                if (customToken) {
                    try {
                        await signInWithCustomToken(auth, customToken);
                    } catch (e) { setLoading(false); }
                } else {
                    setLoading(false);
                }
            }
        });
        return unsubscribe;
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
