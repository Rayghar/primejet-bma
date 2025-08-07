// src/hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
    return useContext(AuthContext);
};

// src/hooks/useFirestoreQuery.js
import { useState, useEffect } from 'react';
import { onSnapshot } from 'firebase/firestore';

export const useFirestoreQuery = (query) => {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!query) {
            setDocs([]);
            setLoading(false);
            return;
        }
        const unsubscribe = onSnapshot(query, 
            (querySnapshot) => {
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setDocs(data);
                setLoading(false);
            },
            (err) => {
                console.error(err);
                setLoading(false);
            }
        );
        return unsubscribe;
    }, [query]);

    return { docs, loading };
};