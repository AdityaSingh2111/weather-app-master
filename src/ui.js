// UI Module: Isolates all DOM manipulations and reacts to state changes.
import { applyTheme } from './themeEngine.js';
import { toggleRain } from './rain.js';
import { getIconForCondition } from './icons.js';
import { updateProceduralSky } from './skyRenderer.js';
import { calculateSolarRatio } from './solarModel.js';

const elements = {
    app: document.getElementById('app-content'),
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    errorText: document.getElementById('error-text'),
    location: document.getElementById('location'),
    dateText: document.getElementById('date-text'),
    timeText: document.getElementById('time-text'),
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
    forecastStrip: document.getElementById('forecast-strip'),
    hourlyStrip: document.getElementById('hourly-strip'),
    searchInput: document.getElementById('city-search'),
    searchResults: document.getElementById('search-results'),
    savedCitiesList: document.getElementById('saved-cities-list'),
    dashboardCard: document.getElementById('dashboard-card')
};

let clockInterval = null;

export const animateDashboardTransition = (callback) => {
    elements.dashboardCard.classList.add('city-transitioning');

    setTimeout(() => {
        callback(); // Swap data while hidden

        // Brief pause to ensure DOM paints new data before sliding up
        setTimeout(() => {
            elements.dashboardCard.classList.remove('city-transitioning');
        }, 50);
    }, 200); // 200ms fade down
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

const formatTime = (unixSeconds, offsetSeconds = 0) => {
    // OpenWeather provides exact unix UTC seconds, plus an exact offset in seconds.
    // To format using standard JS Date methods without the browser forcing local time,
    // we convert to a Date object, apply the offset, and output as UTC.
    const localDate = new Date((unixSeconds + offsetSeconds) * 1000);
    return localDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
};

const getShortDayName = (unixSeconds, offsetSeconds = 0) => {
    const localDate = new Date((unixSeconds + offsetSeconds) * 1000);
    return localDate.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
};

const getShortHour = (unixSeconds, offsetSeconds = 0) => {
    const localDate = new Date((unixSeconds + offsetSeconds) * 1000);
    return localDate.toLocaleTimeString('en-US', { hour: 'numeric', timeZone: 'UTC' });
}

const startLiveClock = (offsetSeconds) => {
    if (clockInterval) clearInterval(clockInterval);

    const update = () => {
        // Get current real-world UTC time in milliseconds
        const nowUtc = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
        // Add the city's offset
        const cityTime = new Date(nowUtc + (offsetSeconds * 1000));

        elements.dateText.innerText = cityTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        elements.timeText.innerText = cityTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    update(); // Run immediately
    clockInterval = setInterval(update, 1000); // And every second thereafter
};

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

    // Left Column: Time & Location
    if (state.locationName) elements.location.innerHTML = state.locationName;
    if (state.sunrise) elements.sunriseTime.innerHTML = formatTime(state.sunrise, state.timezoneOffset);
    if (state.sunset) elements.sunsetTime.innerHTML = formatTime(state.sunset, state.timezoneOffset);
    startLiveClock(state.timezoneOffset); // Starts or resets the ticking clock

    // Visualize Solar Arc
    if (state.sunrise && state.sunset) {
        // Calculate current solar position (0.0 sunrise -> 1.0 sunset)
        let ratio = calculateSolarRatio(state.sunrise, state.sunset);

        // Arc Center: (100, 60), Radius: 90
        // Angle needs to go from 180deg (left/sunrise) to 0deg (right/sunset)
        if (ratio >= 0 && ratio <= 1) {
            const angle = Math.PI - (ratio * Math.PI);
            const x = 100 + Math.cos(angle) * 90;
            const y = 60 - Math.sin(angle) * 90;

            elements.sunIndicator.style.transform = `translate(${x}px, ${y}px)`;
            elements.sunIndicator.style.opacity = 1;
            elements.sunIndicator.classList.remove('night-mode');
        } else {
            // Night time - Hide orbital sun below horizon line or dim it
            elements.sunIndicator.style.opacity = 0;
            // Optionally could place moon at 50% here wrapped in a night-mode class
        }
    }

    // Center Column: Condition SVG
    if (state.rawCondition) {
        elements.description.innerHTML = state.condition;
        elements.weatherIconContainer.innerHTML = getIconForCondition(state.rawCondition);
    }

    // Right Column: Temperatures
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
    if (state.humidity !== null) elements.humidity.innerHTML = `${state.humidity}%`;
    if (state.windSpeed !== null) {
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const dir = state.windDirection != null ? dirs[Math.round(state.windDirection / 45) % 8] : '';
        elements.wind.innerHTML = `${Math.round(state.windSpeed)} m/s ${dir}`;
    }

    // Advanced Middle Metrics
    if (state.uvIndex !== null) elements.uvIndex.innerHTML = state.uvIndex.toFixed(1);
    if (state.visibility !== null) elements.visibility.innerHTML = `${(state.visibility / 1000).toFixed(1)} km`;
    if (state.cloudCoverage !== null) elements.cloudCover.innerHTML = `${state.cloudCoverage}%`;
    if (state.pressure !== null) elements.pressure.innerHTML = `${state.pressure} hPa`;

    const aqiMap = { 1: 'Good', 2: 'Fair', 3: 'Moderate', 4: 'Poor', 5: 'Very Poor' };
    if (state.aqi !== null) elements.aqi.innerHTML = `${state.aqi} - ${aqiMap[state.aqi] || 'Unknown'}`;

    import('./forecastUI.js')
        .then(({ renderForecasts }) => {
            renderForecasts(state);
        }).catch(err => console.error("Failed to load forecast UI module dynamically:", err));

    // Call the theme engine and rain system based on live active weather
    if (state.rawCondition) {
        applyTheme(state.rawCondition, state.temperature);
        toggleRain(state.rawCondition);

        updateProceduralSky(state);
    }
};

/**
 * Renders the dropdown list of geographical search results.
 * @param {Array} results 
 * @param {Function} onSelect 
 */
export const renderSearchResults = (results, onSelect) => {
    if (!results || results.length === 0) {
        elements.searchResults.innerHTML = '';
        elements.searchResults.classList.add('hidden');
        return;
    }

    elements.searchResults.innerHTML = results.map((res, index) => `
        <div class="search-result-item" data-index="${index}">
            <span><strong>${res.name}</strong>${res.state ? `, ${res.state}` : ''}, ${res.country}</span>
        </div>
    `).join('');

    elements.searchResults.classList.remove('hidden');

    // Attach click listeners
    const items = elements.searchResults.querySelectorAll('.search-result-item');
    items.forEach(item => {
        item.addEventListener('click', () => {
            const result = results[parseInt(item.dataset.index)];
            elements.searchInput.value = '';
            elements.searchResults.classList.add('hidden');
            onSelect({ lat: result.lat, lon: result.lon, name: result.name, country: result.country });
        });
    });
};

/**
 * Binds the main search input so `main.js` can perform debounced API calls.
 * @param {Function} onInput 
 */
export const bindSearchInput = (onInput) => {
    elements.searchInput.addEventListener('input', (e) => {
        onInput(e.target.value);
    });

    // Hide results if clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.searchInput.contains(e.target) && !elements.searchResults.contains(e.target)) {
            elements.searchResults.classList.add('hidden');
        }
    });
};

/**
 * Renders the horizontal ribbon of saved cities.
 * @param {Array} citiesData - Array of { city: { lat, lon, name }, state: { temperature, rawCondition } }
 * @param {number} activeIndex 
 * @param {Function} onCityClick 
 * @param {Function} onCityRemove 
 */
export const renderCityPreviews = (citiesData, activeIndex, onCityClick, onCityRemove) => {
    elements.savedCitiesList.innerHTML = citiesData.map((data, index) => {
        const svgIcon = data.state ? getIconForCondition(data.state.rawCondition) : '';
        const temp = data.state && data.state.temperature !== null ? `${Math.round(data.state.temperature)}&deg;` : '--&deg;';
        const isActive = index === activeIndex ? 'active' : '';

        return `
            <div class="city-preview ${isActive}" data-index="${index}">
                <div style="width: 24px; height: 24px;">${svgIcon}</div>
                <span class="city-preview-temp">${temp}</span>
                <span>${data.city.name}</span>
                <div class="city-preview-remove" data-index="${index}" title="Remove city">&times;</div>
            </div>
        `;
    }).join('');

    // Attach specific listeners
    const previews = elements.savedCitiesList.querySelectorAll('.city-preview');
    previews.forEach(preview => {
        preview.addEventListener('click', (e) => {
            const index = parseInt(preview.dataset.index);
            // Handle remove vs switch
            if (e.target.classList.contains('city-preview-remove')) {
                e.stopPropagation(); // prevent triggering the main chip click
                onCityRemove(index);
            } else {
                if (index !== activeIndex) onCityClick(index);
            }
        });
    });
};
