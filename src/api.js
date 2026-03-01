import { getCache, setCache } from './cache.js';

// In production, all API calls route through /api/weather serverless proxy.
// In local dev, fall back to direct calls with the key from .env (loaded manually).
const IS_LOCALHOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const DEV_API_KEY = IS_LOCALHOST ? 'f146799a557e8ab658304c1b30cc3cfd' : null;

const buildUrl = (endpoint, params) => {
    if (IS_LOCALHOST && DEV_API_KEY) {
        // Local dev: direct OWM calls
        if (endpoint === 'geo') {
            return `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(params.q)}&limit=${params.limit || 5}&appid=${DEV_API_KEY}`;
        }
        if (endpoint === 'reverse') {
            return `https://api.openweathermap.org/geo/1.0/reverse?lat=${params.lat}&lon=${params.lon}&limit=1&appid=${DEV_API_KEY}`;
        }
        const base = `https://api.openweathermap.org/data/2.5/${endpoint}`;
        return `${base}?lat=${params.lat}&lon=${params.lon}&units=metric&appid=${DEV_API_KEY}`;
    }

    // Production: proxy through Vercel serverless function
    const searchParams = new URLSearchParams({ endpoint, ...params });
    return `/api/weather?${searchParams.toString()}`;
};

/**
 * Fetches data from all four required endpoints in parallel, wrapped in a caching layer.
 * Cache expires after 10 minutes to avoid duplicate API calls while maintaining freshness.
 */
export const fetchAllWeatherData = async (lat, lon) => {
    const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;

    const fetchFresh = async () => {
        try {
            const [weatherRes, forecastRes, uviRes, aqiRes] = await Promise.all([
                fetch(buildUrl('weather', { lat, lon })),
                fetch(buildUrl('forecast', { lat, lon })),
                fetch(buildUrl('uvi', { lat, lon })),
                fetch(buildUrl('air_pollution', { lat, lon }))
            ]);

            if (!weatherRes.ok || !forecastRes.ok || !uviRes.ok || !aqiRes.ok) {
                throw new Error('Server returned an error from one of the endpoints.');
            }

            const [weatherData, forecastData, uviData, aqiData] = await Promise.all([
                weatherRes.json(),
                forecastRes.json(),
                uviRes.json(),
                aqiRes.json()
            ]);

            const masterData = { weatherData, forecastData, uviData, aqiData };
            setCache(cacheKey, masterData);
            return masterData;
        } catch (error) {
            console.error('fetchAllWeatherData SWR Error:', error);
            throw error;
        }
    };

    // 1. Check Cache
    const { data: cachedData, stale } = getCache(cacheKey, 10);

    if (cachedData && !stale) {
        return { data: cachedData, revalidate: null };
    }

    if (cachedData && stale) {
        return { data: cachedData, revalidate: fetchFresh() };
    }

    // 2. Network Fetch (No Cache)
    const freshData = await fetchFresh();
    return { data: freshData, revalidate: null };
};

/**
 * Searches for geographical coordinates based on a city name query.
 */
export const searchCityList = async (query) => {
    try {
        if (!query.trim()) return [];
        const response = await fetch(buildUrl('geo', { q: query, limit: 5 }));

        if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('searchCityList Error:', error);
        return [];
    }
};
/**
 * Reverse geocodes coordinates into a city name.
 */
export const fetchReverseGeocode = async (lat, lon) => {
    try {
        const response = await fetch(buildUrl('reverse', { lat, lon }));
        if (!response.ok) return null;
        const results = await response.json();
        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.error('fetchReverseGeocode Error:', error);
        return null;
    }
};
