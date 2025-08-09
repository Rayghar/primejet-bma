// src/hooks/useFirestoreQuery.js
import { useState, useEffect } from 'react';
import { onSnapshot } from 'firebase/firestore';

export const useFirestoreQuery = (query) => {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!query) {
            setDocs([]);
            setLoading(false);
            return;
        }

        // Subscribe to the query
        const unsubscribe = onSnapshot(query, 
            (querySnapshot) => { // Success
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setDocs(data);
                setLoading(false);
            }, 
            (err) => { // Error
                console.error("Firestore query error:", err);
                setError("Error fetching data from Firestore.");
                setLoading(false);
            }
        );

        // Unsubscribe on unmount
        return () => unsubscribe();
    }, [query]); // Re-run effect if query changes

    return { docs, loading, error };
};