
// src/api/authService.js
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, appId } from './firebase';

/**
 * Listens for changes to the user's authentication state.
 * @param {function} callback - The function to call with the user data.
 * @returns {function} - The unsubscribe function.
 */
export const onAuthStateChangedListener = (callback) => {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userProfile = await getUserProfile(user.uid);
            if (userProfile) {
                callback({ ...user, ...userProfile });
            } else {
                // If user exists in Auth but not Firestore, create a default profile
                const newUserProfile = await createUserProfile(user.uid, user.email);
                callback({ ...user, ...newUserProfile });
            }
        } else {
            // Handle anonymous or custom token sign-in
            try {
                const customToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                if (customToken) {
                    await signInWithCustomToken(auth, customToken);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Authentication failed:", error);
                callback(null);
            }
        }
    });
};

/**
 * Fetches a user's profile from Firestore.
 * @param {string} uid - The user's unique ID.
 * @returns {object|null} - The user profile data or null.
 */
export const getUserProfile = async (uid) => {
    const userDocRef = doc(db, `artifacts/${appId}/users`, uid);
    const userDocSnap = await getDoc(userDocRef);
    return userDocSnap.exists() ? userDocSnap.data() : null;
};

/**
 * Creates a new user profile in Firestore.
 * @param {string} uid - The user's unique ID.
 * @param {string} email - The user's email.
 * @returns {object} - The newly created user profile data.
 */
export const createUserProfile = async (uid, email) => {
    const userDocRef = doc(db, `artifacts/${appId}/users`, uid);
    const newUserProfile = {
        email,
        role: 'Cashier', // Default role for new sign-ups
        status: 'active',
        createdAt: serverTimestamp(),
    };
    await setDoc(userDocRef, newUserProfile);
    return newUserProfile;
};
