// City Management Module: Handles persisting, adding, and removing up to 5 saved cities.

const CITIES_STORAGE_KEY = 'weather_app_cities';
const MAX_CITIES = 5;

/**
 * Loads the saved cities from localStorage.
 * @returns {Array} List of city objects: { lat, lon, name, country }
 */
export const getSavedCities = () => {
    try {
        const stored = localStorage.getItem(CITIES_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (err) {
        console.error("Failed to load cities from storage:", err);
    }
    return [];
};

/**
 * Saves the cities array to localStorage.
 * @param {Array} cities 
 */
const saveCities = (cities) => {
    try {
        localStorage.setItem(CITIES_STORAGE_KEY, JSON.stringify(cities));
    } catch (err) {
        console.error("Failed to save cities to storage:", err);
    }
};

/**
 * Adds a new city to the saved list if it doesn't already exist and is under the max limit.
 * @param {Object} city - { lat, lon, name, country }
 * @returns {boolean} True if added successfully, false if duplicate or limit reached.
 */
export const addCity = (city) => {
    const cities = getSavedCities();

    // Check limit
    if (cities.length >= MAX_CITIES) {
        alert(`You can only save up to ${MAX_CITIES} cities. Please remove one first.`);
        return false;
    }

    // Check duplicate (using rough coordinate distance or name match)
    // Round coords to 2 decimal places to avoid false negatives.
    const isDuplicate = cities.some(c =>
        (c.name === city.name && c.country === city.country) ||
        (Math.abs(c.lat - city.lat) < 0.05 && Math.abs(c.lon - city.lon) < 0.05)
    );

    if (isDuplicate) {
        return false; // Silently ignore duplicates to avoid annoying alerts.
    }

    cities.push(city);
    saveCities(cities);
    return true;
};

/**
 * Removes a city at a specific index.
 * @param {number} index 
 */
export const removeCity = (index) => {
    const cities = getSavedCities();
    if (index >= 0 && index < cities.length) {
        cities.splice(index, 1);
        saveCities(cities);
    }
};
