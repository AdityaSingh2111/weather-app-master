// UI Module: Slim orchestrator — delegates to focused sub-modules.
import { applyTheme } from './themeEngine.js';
import { getIconForCondition } from './icons.js';
import { updateProceduralSky } from './skyRenderer.js';
import { calculateSolarRatio } from './solarModel.js';
import { startLiveClock, formatTime } from './clockManager.js';

// Re-export sub-module APIs for main.js
export { renderSearchResults, bindSearchInput } from './searchUI.js';
export { renderCityPreviews } from './cityRibbon.js';

const elements = {
    app: document.getElementById('app-content'),
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    errorText: document.getElementById('error-text'),
    location: document.getElementById('location'),
    sunriseTime: document.getElementById('sunrise-time'),
    sunsetTime: document.getElementById('sunset-time'),
    sunIndicator: document.getElementById('sun-indicator'),
    weatherIconContainer: document.getElementById('weather-icon-container'),
    description: document.getElementById('description'),
    temperature: document.getElementById('temperature'),
    feelsLike: document.getElementById('feels-like'),
    humidity: document.getElementById('humidity'),
    wind: document.getElementById('wind'),
    uvIndex: document.getElementById('uv-index'),
    visibility: document.getElementById('visibility'),
    cloudCover: document.getElementById('cloud-cover'),
    pressure: document.getElementById('pressure'),
    aqi: document.getElementById('aqi'),
    dashboardCard: document.getElementById('dashboard-card')
};

export const animateDashboardTransition = (callback) => {
    elements.dashboardCard.classList.add('city-transitioning');

    setTimeout(() => {
        callback();
        setTimeout(() => {
            elements.dashboardCard.classList.remove('city-transitioning');
        }, 50);
    }, 200);
};

const easeOutCubic = x => 1 - Math.pow(1 - x, 3);

const animateValue = (element, start, end, duration, formatFn) => {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeProgress = easeOutCubic(progress);
        const current = start + easeProgress * (end - start);
        element.innerHTML = formatFn(current);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
};

let lastTemp = null;
let lastFeelsLike = null;

export const updateUI = (state) => {
    if (state.loading) {
        elements.loading.classList.remove('hidden');
        elements.error.classList.add('hidden');
        elements.app.classList.add('hidden');
        return;
    }

    if (state.error) {
        elements.loading.classList.add('hidden');
        elements.error.classList.remove('hidden');
        elements.errorText.innerText = state.error;
        elements.app.classList.add('hidden');
        return;
    }

    elements.loading.classList.add('hidden');
    elements.error.classList.add('hidden');
    elements.app.classList.remove('hidden');

    // Location & Clock
    if (state.locationName) elements.location.textContent = state.locationName;
    if (state.sunrise) elements.sunriseTime.textContent = formatTime(state.sunrise, state.timezoneOffset);
    if (state.sunset) elements.sunsetTime.textContent = formatTime(state.sunset, state.timezoneOffset);
    startLiveClock(state.timezoneOffset);

    // Solar Arc
    if (state.sunrise && state.sunset) {
        let ratio = calculateSolarRatio(state.sunrise, state.sunset);

        if (ratio >= 0 && ratio <= 1) {
            const angle = Math.PI - (ratio * Math.PI);
            const x = 100 + Math.cos(angle) * 90;
            const y = 60 - Math.sin(angle) * 90;

            elements.sunIndicator.style.transform = `translate(${x}px, ${y}px)`;
            elements.sunIndicator.style.opacity = 1;
            elements.sunIndicator.classList.remove('night-mode');
        } else {
            elements.sunIndicator.style.opacity = 0;
        }
    }

    // Weather Condition SVG (internal SVG strings — safe for innerHTML)
    if (state.rawCondition) {
        elements.description.textContent = state.condition;
        elements.weatherIconContainer.innerHTML = getIconForCondition(state.rawCondition);
    }

    // Animated Temperatures
    if (state.temperature !== null) {
        const start = lastTemp !== null ? lastTemp : 0;
        animateValue(elements.temperature, start, state.temperature, 500, v => `${Math.round(v)}&deg;`);
        lastTemp = state.temperature;
    }

    if (state.feelsLike !== null) {
        const start = lastFeelsLike !== null ? lastFeelsLike : 0;
        animateValue(elements.feelsLike, start, state.feelsLike, 500, v => `${Math.round(v)}&deg;`);
        lastFeelsLike = state.feelsLike;
    }

    // Metrics (safe — all numeric values)
    if (state.humidity !== null) elements.humidity.textContent = `${state.humidity}%`;
    if (state.windSpeed !== null) {
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const dir = state.windDirection != null ? dirs[Math.round(state.windDirection / 45) % 8] : '';
        elements.wind.textContent = `${Math.round(state.windSpeed)} m/s ${dir}`;
    }

    if (state.uvIndex !== null) elements.uvIndex.textContent = state.uvIndex.toFixed(1);
    if (state.visibility !== null) elements.visibility.textContent = `${(state.visibility / 1000).toFixed(1)} km`;
    if (state.cloudCoverage !== null) elements.cloudCover.textContent = `${state.cloudCoverage}%`;
    if (state.pressure !== null) elements.pressure.textContent = `${state.pressure} hPa`;

    const aqiMap = { 1: 'Good', 2: 'Fair', 3: 'Moderate', 4: 'Poor', 5: 'Very Poor' };
    if (state.aqi !== null) elements.aqi.textContent = `${state.aqi} - ${aqiMap[state.aqi] || 'Unknown'}`;

    // Lazy-load forecast renderer
    import('./forecastUI.js')
        .then(({ renderForecasts }) => {
            renderForecasts(state);
        }).catch(err => console.error('Failed to load forecast UI module:', err));

    // Theme & Procedural Sky
    if (state.rawCondition) {
        applyTheme(state.rawCondition, state.temperature);
        updateProceduralSky(state);
    }
};
