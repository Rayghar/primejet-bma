// src/api/authService.js
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, appId } from './firebase';

/**
 * Signs in a user with their email and password.
 * This is the function the login form will call.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<UserCredential>} - A promise that resolves with the user credential.
 */
export const signInUser = async (email, password) => {
    if (!email || !password) {
        throw new Error("Email and password are required.");
    }
    return await signInWithEmailAndPassword(auth, email, password);
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

/**
 * Listens for changes to the user's authentication state.
 * @param {function} callback - The function to call with the user data.
 * @returns {function} - The unsubscribe function.
 */
export const onAuthStateChangedListener = (callback) => {
    return onAuthStateChanged(auth, async (user) => {
        if (user && !user.isAnonymous) {
            // This block only runs for named users (e.g., email/password)
            const userProfile = await getUserProfile(user.uid);
            if (userProfile) {
                // If profile exists, combine auth data and profile data
                callback({ ...user, ...userProfile });
            } else {
                // If a named user signs in for the first time and has no profile,
                // create one with the default "Cashier" role.
                const newUserProfile = await createUserProfile(user.uid, user.email);
                callback({ ...user, ...newUserProfile });
            }
        } else {
            // For anonymous users or when logged out, return null.
            callback(null);
        }
    });
};
