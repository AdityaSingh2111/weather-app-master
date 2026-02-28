import { getCache, setCache } from './cache.js';

const API_KEY = "f146799a557e8ab658304c1b30cc3cfd";
const BASE_DOMAIN = 'https://api.openweathermap.org/data/2.5';

/**
 * Fetches data from all three required endpoints in parallel, wrapped in a caching layer.
 * Cache expires after 10 minutes to avoid duplicate API calls while maintaining freshness.
 */
export const fetchAllWeatherData = async (lat, lon) => {
    // Round coords slightly to create a consistent cache key for minor jitter
    const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;

    const fetchFresh = async () => {
        try {
            const [weatherRes, forecastRes, uviRes, aqiRes] = await Promise.all([
                fetch(`${BASE_DOMAIN}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
                fetch(`${BASE_DOMAIN}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
                fetch(`${BASE_DOMAIN}/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`),
                fetch(`${BASE_DOMAIN}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
            ]);

            if (!weatherRes.ok || !forecastRes.ok || !uviRes.ok || !aqiRes.ok) {
                throw new Error(`Server returned an error from one of the endpoints.`);
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
            console.error("fetchAllWeatherData SWR Error:", error);
            throw error;
        }
    };

    // 1. Check Cache
    const { data: cachedData, stale } = getCache(cacheKey, 10);

    if (cachedData && !stale) {
        console.log("Serving fresh weather from cache...");
        return { data: cachedData, revalidate: null };
    }

    if (cachedData && stale) {
        console.log("Serving stale weather from cache, revalidating in background...");
        return { data: cachedData, revalidate: fetchFresh() };
    }

    // 2. Network Fetch (No Cache)
    console.log("No cache found. Fetching from network...");
    const freshData = await fetchFresh();
    return { data: freshData, revalidate: null };
};

/**
 * Searches for geographical coordinates based on a city name query.
 * @param {string} query - The name of the city to search for.
 * @returns {Array} - Array of matched location objects.
 */
export const searchCityList = async (query) => {
    try {
        if (!query.trim()) return [];
        const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`);

        if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("searchCityList Error:", error);
        return [];
    }
};
