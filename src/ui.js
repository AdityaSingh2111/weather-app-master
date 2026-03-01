// UI Module: Slim orchestrator — delegates to focused sub-modules.
import { applyTheme } from './themeEngine.js';
import { getIconForCondition } from './icons.js';
import { updateProceduralSky } from './skyRenderer.js';
import { calculateSolarRatio } from './solarModel.js';
import { startLiveClock, formatTime } from './clockManager.js';
import { initDetailViews, openDetailView } from './detailViewUI.js';

// Re-export sub-module APIs for main.js
export { renderSearchResults, bindSearchInput } from './searchUI.js';
export { renderCityPreviews } from './cityRibbon.js';

let liveState = null; // Stores latest fetch for detail views

const elements = {
    app: document.getElementById('app-content'),
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    errorTitle: document.querySelector('#error h2'),
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

// Bind detail view triggers
export const initUI = () => {
    initDetailViews(); // Initialize modal listeners

    document.querySelectorAll('.clickable-card').forEach(card => {
        card.addEventListener('click', () => {
            const type = card.getAttribute('data-detail');
            openDetailView(type, liveState);
        });
    });

    const hourlyStrip = document.getElementById('hourly-strip');
    if (hourlyStrip) {
        hourlyStrip.addEventListener('click', (e) => {
            const item = e.target.closest('.hourly-item');
            const index = item ? parseInt(item.getAttribute('data-index')) : 0;
            openDetailView('hourly', liveState, index);
        });
    }

    const forecastStrip = document.getElementById('forecast-strip');
    if (forecastStrip) {
        forecastStrip.addEventListener('click', () => {
            openDetailView('daily', liveState);
        });
    }
};

/**
 * Binds Apple-style real-time horizontal swipe gestures to the main dashboard.
 * Features 1:1 tracking, elastic snap-back, and high-performance RAF.
 */
export const bindDashboardSwipes = (onNext, onPrev) => {
    const card = elements.dashboardCard;
    if (!card) return;

    let startX = 0;
    let currentX = 0;
    let isSwiping = false;
    let rafId = null;

    const updatePosition = () => {
        if (!isSwiping) return;
        const diffX = currentX - startX;

        // Apply resistance as user pulls further (Apple feel)
        const resistance = 0.8;
        const translateX = diffX * resistance;

        card.style.transform = `translateX(${translateX}px)`;

        // Subtle opacity fade during swipe
        const opacity = Math.max(0.6, 1 - Math.abs(diffX) / (window.innerWidth * 0.8));
        card.style.opacity = opacity;

        rafId = requestAnimationFrame(updatePosition);
    };

    card.addEventListener('touchstart', (e) => {
        // Only trigger if one finger is used
        if (e.touches.length !== 1) return;

        startX = e.touches[0].clientX;
        currentX = startX;
        isSwiping = true;

        card.classList.add('swiping');
        card.classList.remove('snap-back');

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(updatePosition);
    }, { passive: true });

    card.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        currentX = e.touches[0].clientX;
    }, { passive: true });

    card.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        isSwiping = false;
        if (rafId) cancelAnimationFrame(rafId);

        const diffX = e.changedTouches[0].clientX - startX;
        const threshold = window.innerWidth * 0.25; // 25% width to trigger

        card.classList.remove('swiping');

        if (Math.abs(diffX) > threshold) {
            // Success! Trigger switch
            if (diffX < 0) {
                onNext();
            } else {
                onPrev();
            }
            // Reset styles immediately before transition-fade takes over
            card.style.transform = '';
            card.style.opacity = '';
        } else {
            // Abort - Elastic snap back
            card.classList.add('snap-back');
            card.style.transform = 'translateX(0)';
            card.style.opacity = '1';

            // Clean up class after animation
            setTimeout(() => {
                card.classList.remove('snap-back');
                card.style.transform = '';
            }, 500);
        }
    }, { passive: true });
};

export const animateDashboardTransition = (callback) => {
    const card = elements.dashboardCard;
    if (!card) { callback(); return; }

    // Fast fade-out
    card.classList.add('city-transitioning');

    const onFadeOut = () => {
        card.removeEventListener('transitionend', onFadeOut);
        // Apply new data while hidden
        callback();
        // Force re-reveal all sections immediately
        document.querySelectorAll('.dash-section').forEach(s => s.classList.add('revealed'));
        // Trigger reflow then fade back in
        void card.offsetHeight;
        card.classList.remove('city-transitioning');
    };

    card.addEventListener('transitionend', onFadeOut, { once: true });

    // Safety fallback in case transitionend doesn't fire (e.g., reduced-motion)
    setTimeout(() => {
        if (card.classList.contains('city-transitioning')) {
            onFadeOut();
        }
    }, 350);
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
    liveState = state; // Save state for modal usage

    if (state.loading) {
        elements.loading.classList.remove('hidden');
        elements.error.classList.add('hidden');
        elements.app.classList.add('hidden');
        return;
    }

    if (state.error) {
        elements.loading.classList.add('hidden');
        elements.error.classList.remove('hidden');

        // Dynamically rotate titles to distinguish "Empty/First Load" from "True Errors"
        if (state.error.toLowerCase().includes('welcome') ||
            state.error.toLowerCase().includes('search')) {
            if (elements.errorTitle) elements.errorTitle.textContent = "Your Weather Journey";
        } else {
            if (elements.errorTitle) elements.errorTitle.textContent = "System Interruption";
        }

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
        const now = Date.now() / 1000;
        const isDay = now >= state.sunrise && now < state.sunset;
        elements.description.textContent = state.condition;
        elements.weatherIconContainer.innerHTML = getIconForCondition(state.rawCondition, isDay);
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

    // Update main dashboard metrics
    document.getElementById('uv-index').textContent = state.uvIndex !== null ? state.uvIndex : '--';
    document.getElementById('visibility').textContent = `${(state.visibility / 1000).toFixed(1)} km`;
    document.getElementById('card-humidity').textContent = `${state.humidity}%`;
    document.getElementById('pressure').textContent = `${state.pressure} hPa`;
    document.getElementById('aqi').textContent = state.aqi !== null ? state.aqi : '--';
    document.getElementById('card-wind').textContent = `${Math.round(state.windSpeed * 3.6)} km/h`;

    // Dynamic Summaries on Dashboard Cards
    document.getElementById('uv-summary').textContent = state.uvIndex <= 2 ? "Low" : (state.uvIndex <= 5 ? "Moderate" : "High/Extreme");
    document.getElementById('visibility-summary').textContent = state.visibility < 5000 ? "Reduced clear view" : "Perfectly clear view";
    document.getElementById('humidity-summary').textContent = `The dew point feels ${state.humidity > 60 ? "muggy" : "comfortable"}.`;

    const val = Math.floor((state.windDirection / 22.5) + 0.5);
    const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    document.getElementById('wind-summary').textContent = `Direction ${arr[(val % 16)]}`;

    document.getElementById('aqi-summary').textContent = state.aqi <= 2 ? "Air quality is favorable." : "Presents health risks.";
    document.getElementById('pressure-summary').textContent = state.pressure < 1005 ? "Dropping" : "Stable";

    // Ensure backwards compatibility with mobile nav menu
    if (state.uvIndex !== null && elements.uvIndex) elements.uvIndex.textContent = state.uvIndex.toFixed(1);

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
