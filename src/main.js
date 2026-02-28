// Main Entry Point
import { fetchAllWeatherData, searchCityList } from './api.js';
import { setState, subscribe } from './state.js';
import { updateUI, bindSearchInput, renderSearchResults, renderCityPreviews, animateDashboardTransition } from './ui.js';
import { normalizeWeatherData } from './transform.js';
import { initTimeEngine } from './timeEngine.js';

import { getSavedCities, addCity, removeCity } from './cities.js';
import { initParallax } from './parallax.js';
import { initNavigation } from './nav.js';

let activeIndex = 0;
let citiesDataCache = [];

/**
 * Fetches the weather data for all saved cities and re-renders the ribbon and dashboard.
 */
const loadAndRenderCities = async () => {
    const savedCities = getSavedCities();

    if (savedCities.length === 0) return;

    if (activeIndex >= savedCities.length) activeIndex = Math.max(0, savedCities.length - 1);

    setState({ loading: true, error: null });

    try {
        // Fetch weather for all saved cities sequentially or parallel
        citiesDataCache = await Promise.all(savedCities.map(async (city) => {
            const result = await fetchAllWeatherData(city.lat, city.lon);
            const masterData = result.data;
            const normalizedState = normalizeWeatherData(
                masterData.weatherData,
                masterData.forecastData,
                masterData.uviData,
                masterData.aqiData,
                city.lat
            );

            // Handle SWR Background Revalidation
            if (result.revalidate) {
                result.revalidate.then(freshMasterData => {
                    const freshState = normalizeWeatherData(
                        freshMasterData.weatherData,
                        freshMasterData.forecastData,
                        freshMasterData.uviData,
                        freshMasterData.aqiData,
                        city.lat
                    );

                    const cacheIndex = citiesDataCache.findIndex(c => c.city.lat === city.lat && c.city.lon === city.lon);
                    if (cacheIndex !== -1) {
                        citiesDataCache[cacheIndex] = { city, state: freshState };

                        // If this is the active city, silently hot-swap the UI without loading screens
                        if (activeIndex === cacheIndex) {
                            setState({ ...freshState, loading: false });
                        }
                    }
                }).catch(err => {
                    console.error("Silent SWR revalidation failed for", city.name, err);
                });
            }

            return { city, state: normalizedState };
        }));

        // Update the Active Dashboard View immediately
        switchDashboardView(activeIndex);
    } catch (err) {
        setState({
            loading: false,
            error: "Failed to load cities weather data. " + err.message
        });
    }
};

/**
 * Animates the switch between active city data nodes.
 */
const switchDashboardView = (index) => {
    activeIndex = index;
    if (citiesDataCache[activeIndex]) {
        // Re-render ribbon to apply active class synchronously
        renderCityPreviews(citiesDataCache, activeIndex, handleCityClick, handleCityRemove);

        const stateToApply = { ...citiesDataCache[activeIndex].state, loading: false };

        animateDashboardTransition(() => {
            setState(stateToApply);
        });
    }
};

const handleCityClick = (index) => {
    if (index !== activeIndex) {
        switchDashboardView(index);
    }
};

const handleCityRemove = (index) => {
    removeCity(index);
    const savedCities = getSavedCities();

    if (savedCities.length === 0) {
        // Edge Case: Removed last active city
        citiesDataCache = [];
        renderCityPreviews([], 0, handleCityClick, handleCityRemove);
        setState({ loading: false, error: "No cities saved. Please search for a city above or use current location to get started." });
    } else {
        // Adjust index and reload
        if (activeIndex === index) activeIndex = Math.max(0, index - 1);
        else if (activeIndex > index) activeIndex--;
        loadAndRenderCities();
    }
};

/**
 * Binds the Autocomplete functionality to the DOM input.
 */
const setupSearch = () => {
    let searchTimeout = null;
    bindSearchInput((query) => {
        if (searchTimeout) clearTimeout(searchTimeout);
        if (!query.trim()) {
            renderSearchResults([]);
            return;
        }

        searchTimeout = setTimeout(async () => {
            const results = await searchCityList(query);
            renderSearchResults(results, async (selectedCity) => {
                const added = addCity(selectedCity);
                if (added) {
                    activeIndex = getSavedCities().length - 1; // Slide to the front of new city
                    await loadAndRenderCities();
                }
            });
        }, 500); // 500ms debounce window
    });
};

/**
 * Handles fetching weather by Geolocation
 */
const handleGeolocationClick = () => {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    const geoBtn = document.getElementById('geo-btn');
    if (geoBtn) {
        geoBtn.style.opacity = '0.5';
        geoBtn.style.pointerEvents = 'none';
    }

    // Optional: Show a subtle loading indicator or set global loading state
    setState({ loading: true, error: null });

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            if (geoBtn) {
                geoBtn.style.opacity = '';
                geoBtn.style.pointerEvents = '';
            }
            const { latitude, longitude } = position.coords;
            try {
                const result = await fetchAllWeatherData(latitude, longitude);
                const masterData = result.data;
                const cityObj = {
                    lat: latitude,
                    lon: longitude,
                    name: masterData.weatherData.name,
                    country: masterData.weatherData.sys.country
                };

                // Try to find if city already exists
                const savedCities = getSavedCities();
                const existingIndex = savedCities.findIndex(c =>
                    (c.name === cityObj.name && c.country === cityObj.country) ||
                    (Math.abs(c.lat - cityObj.lat) < 0.05 && Math.abs(c.lon - cityObj.lon) < 0.05)
                );

                if (existingIndex !== -1) {
                    // Switch to existing context
                    switchDashboardView(existingIndex);
                } else {
                    const added = addCity(cityObj);
                    if (added || savedCities.length === 0) {
                        // added cleanly, switch to it
                        activeIndex = getSavedCities().length - 1;
                        await loadAndRenderCities();
                    } else if (!added && savedCities.length >= 5) {
                        // limit handling handled internally by `addCity` which emits its own alert
                        setState({ ...citiesDataCache[activeIndex].state, loading: false });
                    }
                }
            } catch (err) {
                if (citiesDataCache[activeIndex]) {
                    setState({ ...citiesDataCache[activeIndex].state, loading: false });
                } else {
                    setState({ loading: false, error: "Unable to retrieve meteorological data for your coordinate." });
                }
                alert("Unable to retrieve meteorological data for your coordinate.");
            }
        },
        (err) => {
            if (geoBtn) {
                geoBtn.style.opacity = '';
                geoBtn.style.pointerEvents = '';
            }
            let errorMsg = "Unable to retrieve your location.";
            if (err.code === err.PERMISSION_DENIED) {
                errorMsg = "Location access was denied. Please allow location permissions in your browser.";
            }

            if (citiesDataCache[activeIndex]) {
                setState({ ...citiesDataCache[activeIndex].state, loading: false });
            } else {
                setState({ loading: false, error: errorMsg });
            }
            alert(errorMsg);
        }
    );
};

const init = async () => {
    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(err => {
                console.error("Service Worker registration failed:", err);
            });
        });
    }

    // Spin up environmental systems
    initTimeEngine();

    initParallax();
    initNavigation();

    // Bind main render flow
    subscribe(updateUI);
    setupSearch();

    const geoBtn = document.getElementById('geo-btn');
    if (geoBtn) {
        geoBtn.addEventListener('click', handleGeolocationClick);
    }

    setState({ loading: true, error: null });

    // Handle Offline/Online Status
    const offlineBanner = document.getElementById('offline-banner');
    if (offlineBanner) offlineBanner.classList.add('hidden');

    window.addEventListener('online', () => {
        if (offlineBanner) offlineBanner.classList.add('hidden');
        loadAndRenderCities(); // Refresh data now that we're back
    });

    window.addEventListener('offline', () => {
        if (offlineBanner) offlineBanner.classList.remove('hidden');
    });

    const savedCities = getSavedCities();

    if (savedCities.length > 0) {
        await loadAndRenderCities();
    } else {
        handleGeolocationClick();
    }
};

document.addEventListener('DOMContentLoaded', init);
