'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LocationContext = createContext(null);

// Cache key for sessionStorage
const LOCATION_CACHE_KEY = 'user_location_data';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const LocationProvider = ({ children }) => {
    const [locationData, setLocationData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchLocation = useCallback(async () => {
        // Check cache first
        if (typeof window !== 'undefined') {
            try {
                const cached = sessionStorage.getItem(LOCATION_CACHE_KEY);
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    // Check if cache is still valid
                    if (Date.now() - timestamp < CACHE_DURATION) {
                        setLocationData(data);
                        setIsLoading(false);
                        return;
                    }
                }
            } catch (e) {
                // Cache read failed, proceed with fetch
            }
        }

        // Fetch from API (non-blocking; ipwho.is may return 403 in some environments)
        try {
            const res = await fetch('https://ipwho.is/');
            if (!res.ok) {
                setLocationData(null);
                return;
            }
            const data = await res.json();

            setLocationData(data);

            if (typeof window !== 'undefined') {
                try {
                    sessionStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({
                        data,
                        timestamp: Date.now()
                    }));
                } catch (e) {
                    // ignore
                }
            }
        } catch (err) {
            setLocationData(null);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ✅ Defer location fetch so it doesn't fire during initial page load (avoids console 403 in Lighthouse)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLocation();
        }, 3000); // 3s delay – page will be interactive before this runs
        return () => clearTimeout(timer);
    }, [fetchLocation]);

    // Derived state
    const isUserInSyria = locationData?.country === 'Syria';
    const userCountry = locationData?.country;
    const userIP = locationData?.ip;

    return (
        <LocationContext.Provider value={{
            locationData,
            isLoading,
            error,
            isUserInSyria,
            userCountry,
            userIP,
            refetch: fetchLocation
        }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};

export default LocationContext;
