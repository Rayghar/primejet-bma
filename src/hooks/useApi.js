// src/hooks/useApi.js (NEW)
// A reusable hook to handle API loading, data, and error states.
// =======================================================================
import { useState, useEffect, useCallback } from 'react';

export const useApi = (apiFunc, ...args) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await apiFunc(...args);
            setData(result);
        } catch (err) {
            setError(err.response?.data?.error || 'An API error occurred.');
        } finally {
            setLoading(false);
        }
    }, [apiFunc, ...args]); // Dependency array includes args to refetch if they change

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
};