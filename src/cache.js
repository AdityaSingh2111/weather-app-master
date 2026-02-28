// Cache Module: Provides a simple `localStorage` layer to prevent duplicate API calls
// and load the application instantly on refresh.

const CACHE_PREFIX = 'weather_app_';

/**
 * Retrieves valid data from the cache.
 * @param {string} key - The unique identifier for the data.
 * @param {number} maxAgeMinutes - How long the cache remains valid before expiring.
 * @returns {Object} An object `{ data: any|null, stale: boolean }`.
 */
export const getCache = (key, maxAgeMinutes = 10) => {
    try {
        const itemStr = localStorage.getItem(`${CACHE_PREFIX}${key}`);
        if (!itemStr) return { data: null, stale: false };

        const item = JSON.parse(itemStr);
        const now = new Date();
        const expirationTime = new Date(item.timestamp + maxAgeMinutes * 60000);

        const isStale = now > expirationTime;

        return { data: item.value, stale: isStale };
    } catch (err) {
        console.warn('Failed to read from cache:', err);
        return { data: null, stale: false };
    }
};

/**
 * Saves data into the cache with a timestamp.
 * @param {string} key - The unique identifier.
 * @param {any} value - The data payload to store.
 */
export const setCache = (key, value) => {
    try {
        const item = {
            value: value,
            timestamp: new Date().getTime()
        };
        localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
    } catch (err) {
        console.warn('Failed to write to cache:', err);
    }
};
