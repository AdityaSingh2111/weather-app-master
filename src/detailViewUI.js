// Modular Detail View Engine
// Handles the Apple-style modal overlay, animations, and specific content rendering
import { getIconForCondition } from './icons.js';

let currentState = null;
let currentSelectedIndex = 0;
let currentUnits = { temp: 'C', precip: 'mm' }; // Local state for Detail Options
let currentHourlyTempMode = 'actual'; // actual or feels_like
let activeDropdown = null; // Track currently open dropdown

// DOM Elements
const container = document.getElementById('detail-view-container');
const contentBox = document.getElementById('detail-view-content');
const closeBtn = document.getElementById('close-detail-btn');
const titleEl = document.getElementById('detail-title');
const scrollArea = document.getElementById('detail-scroll-area');

// Lock scrolling on body when modal is open
const toggleBodyScroll = (lock) => {
    if (lock) {
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none'; // Prevent iOS background rubber-banding
    } else {
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
    }
};

export const initDetailViews = () => {
    // Bind close button
    closeBtn.addEventListener('click', closeDetailView);

    // Close on background click
    container.addEventListener('click', (e) => {
        if (e.target === container) {
            closeDetailView();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && container.classList.contains('active')) {
            closeDetailView();
        }
    });

    // Handle touch swipe down to close (basic implementation)
    let touchStartY = 0;
    contentBox.addEventListener('touchstart', (e) => {
        // Only track swipe if we're at the top of the scroll area
        if (scrollArea.scrollTop === 0) {
            touchStartY = e.changedTouches[0].screenY;
        }
    }, { passive: true });

    contentBox.addEventListener('touchend', (e) => {
        if (scrollArea.scrollTop === 0) {
            const touchEndY = e.changedTouches[0].screenY;
            if (touchEndY - touchStartY > 100) { // Swipe down threshold
                closeDetailView();
            }
        }
    }, { passive: true });

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
        if (activeDropdown && !e.target.closest('.smart-dropdown')) {
            closeActiveDropdown();
        }
    });

    // Global Options Event Delegation for Detail Views (e.g. unit toggles)
    scrollArea.addEventListener('click', (e) => {
        // Toggle Dropdown
        if (e.target.closest('.dropdown-trigger')) {
            const dropdown = e.target.closest('.smart-dropdown');
            toggleDropdown(dropdown);
            return;
        }

        // Handle Unit Selection from Dropdown or Toggle Button
        if (e.target.classList.contains('dropdown-item') || e.target.classList.contains('unit-toggle-btn')) {
            const unitType = e.target.getAttribute('data-type');
            const unitVal = e.target.getAttribute('data-val');

            if (unitType === 'temp') currentUnits.temp = unitVal;
            if (unitType === 'precip') currentUnits.precip = unitVal;
            if (unitType === 'tempMode') currentHourlyTempMode = unitVal;

            if (activeDropdown) closeActiveDropdown();

            // Re-render the current view
            if (currentState && container.classList.contains('active')) {
                const t = titleEl.textContent;
                if (t.includes("Hourly")) {
                    scrollArea.innerHTML = withFooter(renderHourlyDetail(currentState, currentSelectedIndex));
                }
            }
            return;
        }
    });

    const toggleDropdown = (dropdown) => {
        if (activeDropdown && activeDropdown !== dropdown) {
            closeActiveDropdown();
        }
        dropdown.classList.toggle('open');
        activeDropdown = dropdown.classList.contains('open') ? dropdown : null;
    };

    const closeActiveDropdown = () => {
        if (activeDropdown) {
            activeDropdown.classList.remove('open');
            activeDropdown = null;
        }
    };
};

const withFooter = (html) => {
    const footerHTML = `
        <div class="modal-footer" style="margin-top: 5rem; padding: 3rem 0; border-top: 1px solid rgba(255,255,255,0.05); text-align: center; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 100px; height: 1px; background: linear-gradient(90deg, transparent, #4facfe, transparent);"></div>
            <div style="font-size: 0.9rem; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.5; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 8px;">
                Built with 
                <span class="heart-pulse" style="color: #ff4757; font-size: 1.2rem; display: inline-block; filter: drop-shadow(0 0 8px rgba(255, 71, 87, 0.4));">❤</span> 
                by <span style="color: #fff; font-weight: 700; background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Aditya</span>
            </div>
            <div style="margin-top: 1rem; font-size: 0.75rem; opacity: 0.3; font-weight: 400;">DESIGNED FOR EXCELLENCE • 2026</div>
        </div>
    `;
    return html + footerHTML;
};

export const openDetailView = (type, state, selectedIndex = 0) => {
    if (!state) return;
    currentState = state;
    currentSelectedIndex = selectedIndex;

    // Based on type, render different content
    let title = "";
    let contentHTML = "";

    switch (type) {
        case 'uv':
            title = "UV Index";
            contentHTML = renderUVIDetail(state);
            break;
        case 'visibility':
            title = "Visibility";
            contentHTML = renderVisibilityDetail(state);
            break;
        case 'humidity':
            title = "Humidity";
            contentHTML = renderHumidityDetail(state);
            break;
        case 'wind':
            title = "Wind";
            contentHTML = renderWindDetail(state);
            break;
        case 'aqi':
            title = "Air Quality";
            contentHTML = renderAQIDetail(state);
            break;
        case 'pressure':
            title = "Pressure";
            contentHTML = renderPressureDetail(state);
            break;
        case 'hourly':
            title = "Hourly Forecast";
            contentHTML = renderHourlyDetail(state, currentSelectedIndex);
            break;
        case 'daily':
            title = "Next 5 Days Forecast";
            contentHTML = renderDailyDetail(state);
            break;
        default:
            return;
    }

    titleEl.textContent = title;
    scrollArea.innerHTML = withFooter(contentHTML);
    // Reset scroll position
    scrollArea.scrollTop = 0;

    // Show modal with animation
    container.classList.remove('hidden');
    scrollArea.innerHTML = withFooter(contentHTML);
    titleEl.textContent = title;

    // Show modal
    container.classList.add('active');
    toggleBodyScroll(true);
};

export const closeDetailView = () => {
    container.classList.remove('active');
    toggleBodyScroll(false);

    // Wait for slide down animation to finish before hiding display
    setTimeout(() => {
        if (!container.classList.contains('active')) {
            container.classList.add('hidden');
            scrollArea.innerHTML = '';
            currentState = null;
        }
    }, 400); // Matches CSS transition duration
};

// ==========================================
// RENDERERS
// ==========================================

const getUVCategory = (uv) => {
    if (uv <= 2) return "Low";
    if (uv <= 5) return "Moderate";
    if (uv <= 7) return "High";
    if (uv <= 10) return "Very High";
    return "Extreme";
};

const renderUVIDetail = (state) => {
    const uv = state.uvIndex || 0;
    const cat = getUVCategory(uv);
    const maxUVLoc = Math.min((uv / 11) * 100, 100);

    return `
        <div class="detail-hero-value">${uv}</div>
        <div style="font-size: 1.2rem; font-weight: 500; margin-bottom: 2rem;">${cat}</div>

        <div class="detail-graph-card">
            <h5>Current Exposure Status</h5>
            <div style="height: 12px; border-radius: 6px; background: linear-gradient(90deg, #5EE032, #F8E034, #F28C32, #EF3234, #8757C8); position: relative; margin: 2rem 0;">
                <div style="position: absolute; left: ${maxUVLoc}%; top: -8px; width: 28px; height: 28px; background: white; border-radius: 50%; border: 3px solid #141e30; transform: translateX(-50%); box-shadow: 0 2px 8px rgba(0,0,0,0.5);"></div>
            </div>
            <p style="opacity: 0.8; font-size: 0.9rem;">
                Use sun protection until 4:00 PM. Seek shade during midday hours.
            </p>
        </div>

        <div class="detail-text-card">
            <h5>About UV Index</h5>
            <p>The World Health Organization's UV Index measures the strength of sunburn-producing ultraviolet radiation. Higher numbers mean greater risk of exposure and a faster time to sunburn.</p>
        </div>
    `;
};

const renderAQIDetail = (state) => {
    const aqiNum = state.aqi || 1;
    let label = "Good";
    let color = "#5EE032";
    let desc = "Air quality is considered satisfactory, and air pollution poses little or no risk.";

    switch (aqiNum) {
        case 2: label = "Fair"; color = "#F8E034"; desc = "Air quality is acceptable; however, for some pollutants there may be a moderate health concern."; break;
        case 3: label = "Moderate"; color = "#F28C32"; desc = "Members of sensitive groups may experience health effects."; break;
        case 4: label = "Poor"; color = "#EF3234"; desc = "Everyone may begin to experience health effects; sensitive groups may experience more serious effects."; break;
        case 5: label = "Very Poor"; color = "#8757C8"; desc = "Health warnings of emergency conditions. The entire population is more likely to be affected."; break;
    }

    // Default API values if missing
    const comps = state.aqiComponents || { pm2_5: 0, pm10: 0, o3: 0, no2: 0, so2: 0, co: 0 };

    return `
        <div class="detail-hero-value" style="color: ${color};">${aqiNum} - ${label}</div>
        <div style="font-size: 1.1rem; opacity: 0.9; margin-bottom: 2rem;">${desc}</div>

        <div class="detail-graph-card">
            <h5>Pollutant Breakdown (μg/m3)</h5>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">
                    <span style="opacity: 0.7;">PM2.5</span>
                    <strong>${comps.pm2_5.toFixed(1)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">
                    <span style="opacity: 0.7;">PM10</span>
                    <strong>${comps.pm10.toFixed(1)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">
                    <span style="opacity: 0.7;">O3 (Ozone)</span>
                    <strong>${comps.o3.toFixed(1)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">
                    <span style="opacity: 0.7;">NO2</span>
                    <strong>${comps.no2.toFixed(1)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">
                    <span style="opacity: 0.7;">SO2</span>
                    <strong>${comps.so2.toFixed(1)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">
                    <span style="opacity: 0.7;">CO</span>
                    <strong>${comps.co.toFixed(1)}</strong>
                </div>
            </div>
        </div>

        <div class="detail-text-card">
            <h5>About Air Quality</h5>
            <p>The Air Quality Index (AQI) is used for reporting daily air quality. It tells you how clean or polluted your air is, and what associated health effects might be a concern for you.</p>
        </div>
    `;
};

const renderVisibilityDetail = (state) => {
    const visKm = (state.visibility / 1000).toFixed(1);
    let desc = "Perfectly clear view.";
    if (visKm < 2) desc = "Dense fog or heavy haze. Driving may be dangerous.";
    else if (visKm < 5) desc = "Haze or light fog is reducing visibility.";
    else if (visKm < 10) desc = "Slightly reduced visibility.";

    return `
        <div class="detail-hero-value">${visKm} <span style="font-size: 1.5rem; opacity: 0.6; font-weight: 500;">km</span></div>
        <div style="font-size: 1.1rem; opacity: 0.9; margin-bottom: 2rem;">${desc}</div>

        <div class="detail-text-card">
            <h5>About Visibility</h5>
            <p>Visibility refers to the distance at which an object or light can be clearly discerned. It is a crucial factor for aviation and road safety, and is affected by fog, haze, precipitation, and air pollution.</p>
        </div>
    `;
};

const renderHumidityDetail = (state) => {
    const humidity = state.humidity;
    const temp = state.temperature;

    // Simple Dew Point approximation
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100.0);
    const dewPoint = Math.round((b * alpha) / (a - alpha));

    let desc = "";
    if (dewPoint < 10) desc = "Dry and comfortable.";
    else if (dewPoint <= 15) desc = "Comfortable.";
    else if (dewPoint <= 20) desc = "Starting to feel humid.";
    else desc = "Uncomfortable and muggy.";

    return `
        <div class="detail-hero-value">${humidity}%</div>
        <div style="font-size: 1.1rem; opacity: 0.9; margin-bottom: 2rem;">The dew point is ${dewPoint}&deg; right now. ${desc}</div>

        <div class="detail-text-card">
            <h5>About Humidity</h5>
            <p>Relative humidity measures the current amount of water vapor in the air compared to the maximum amount the air can hold at that temperature. High humidity combined with high temperatures increases the apparent temperature (feels like).</p>
        </div>
    `;
};

const renderWindDetail = (state) => {
    // Convert m/s to km/h
    const speed = Math.round(state.windSpeed * 3.6);
    const direction = state.windDirection;

    // Determine cardinal direction
    const val = Math.floor((direction / 22.5) + 0.5);
    const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const cardinal = arr[(val % 16)];

    let desc = "Light breeze.";
    if (speed > 50) desc = "Gale force winds. Dangerous conditions.";
    else if (speed > 30) desc = "Strong winds. Unpleasant conditions.";
    else if (speed > 15) desc = "Moderate to fresh breeze.";

    return `
        <div class="detail-hero-value" style="display: flex; align-items: center; gap: 1rem;">
            ${speed} <span style="font-size: 1.5rem; opacity: 0.6; font-weight: 500;">km/h</span>
            
            <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); display: flex; justify-content: center; align-items: center; position: relative;">
                <svg viewBox="0 0 24 24" fill="white" width="24" height="24" style="transform: rotate(${direction}deg);"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
                <div style="position: absolute; font-size: 10px; top: -15px; width: 100%; text-align: center; color: rgba(255,255,255,0.6);">${cardinal}</div>
            </div>
        </div>
        <div style="font-size: 1.1rem; opacity: 0.9; margin-bottom: 2rem;">Wind is blowing from the ${cardinal}. ${desc}</div>

        <div class="detail-text-card">
            <h5>About Wind</h5>
            <p>Wind speed is measured at 10 meters above the ground. Wind chill is how cold it feels to human skin due to the wind, which strips away the thin layer of warm air near the skin.</p>
        </div>
    `;
};

const renderPressureDetail = (state) => {
    const p = state.pressure;
    let desc = "Stable pressure.";
    if (p < 1000) desc = "Low pressure. Often indicates an incoming storm or precipitation.";
    else if (p > 1020) desc = "High pressure. Usually brings clear skies and fair weather.";

    return `
        <div class="detail-hero-value">${p} <span style="font-size: 1.5rem; opacity: 0.6; font-weight: 500;">hPa</span></div>
        <div style="font-size: 1.1rem; opacity: 0.9; margin-bottom: 2rem;">${desc}</div>

        <div class="detail-text-card">
            <h5>About Atmospheric Pressure</h5>
            <p>Atmospheric pressure is the weight of the air above you. Changes in pressure are highly indicative of changing weather patterns. Rapidly dropping pressure often warns of a storm.</p>
        </div>
    `;
};

const renderHourlyDetail = (state, selectedIdx = 0) => {
    const isF = currentUnits.temp === 'F';
    const isK = currentUnits.temp === 'K';
    const isCM = currentUnits.precip === 'cm';
    const isIn = currentUnits.precip === 'in';
    const useFeelsLike = currentHourlyTempMode === 'feels_like';

    const tConv = (c) => {
        if (isK) return Math.round(c + 273.15);
        return isF ? Math.round((c * 9 / 5) + 32) : Math.round(c);
    };
    const tSym = isK ? 'K' : '&deg;';
    const pConv = (mm) => isCM ? (mm / 10).toFixed(1) : (isIn ? (mm / 25.4).toFixed(2) : mm.toFixed(1));
    const pSym = isCM ? 'cm' : (isIn ? 'in' : 'mm');

    const hourlyDataFull = state.hourlyForecast || [];
    // Graph always starts at "Now" (current time) and shows the next 24 hours
    const hourlyData = hourlyDataFull.slice(0, 24);

    if (hourlyData.length === 0) return `<div style="padding: 2rem;">Forecast data unavailable.</div>`;

    // --------------------------------------------------
    // 1️⃣ FORECAST SUMMARY
    // --------------------------------------------------
    let totalNext24 = 0;
    let highestPop = 0;
    let peakPopDt = null;
    let rainStart = null;
    let rainEnd = null;

    hourlyData.forEach(h => {
        // Use the newly mapped rain/snow or fallback to zero
        const rainVol = (h.rain || 0) + (h.snow || 0);
        totalNext24 += rainVol;

        if (h.pop > highestPop) {
            highestPop = h.pop;
            peakPopDt = h.dt;
        }

        if (h.pop > 30) {
            if (!rainStart) rainStart = h.dt;
            rainEnd = h.dt;
        }
    });

    const peakTime = peakPopDt ? new Date(peakPopDt * 1000).toLocaleTimeString([], { hour: 'numeric' }) : null;

    // Header specifically reflects the CLICKED card's time
    const selectedHour = hourlyDataFull[selectedIdx] || hourlyDataFull[0] || hourlyData[0];
    const startDate = new Date(selectedHour.dt * 1000);
    const dateFormatted = startDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    const timeFormatted = startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    const startT = tConv(hourlyData[0].temp);
    const endT = tConv(hourlyData[hourlyData.length - 1].temp);
    const trendDetail = endT < startT - 2 ? "expecting cooler temps later" : (endT > startT + 2 ? "with a slight warm-up ahead" : "staying fairly steady");

    let rainSum = "";
    if (highestPop > 60) {
        rainSum = `. Some rain is likely, especially around ${peakTime}`;
    } else if (highestPop > 20) {
        rainSum = `. A few showers are possible later today`;
    }

    const summaryHtml = `
        <div style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.15em; opacity: 0.5; font-weight: 700; margin-bottom: 0.75rem;">Forecast for ${dateFormatted} starting ${timeFormatted}</div>
        <div style="font-size: 1.15rem; font-weight: 500; opacity: 0.9; padding-bottom: 2.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 2.5rem; line-height: 1.7; min-height: 4em; position: relative;">
            The current conditions are primarily ${state.condition.toLowerCase()}, ${trendDetail}${rainSum}. 
            Expect a steady transition of weather patterns as we move through the next twenty-four hours in our local area.
            <div style="position: absolute; bottom: -1px; left: 0; width: 40px; height: 1px; background: #4facfe;"></div>
        </div>
    `;

    // --------------------------------------------------
    // 2️⃣ TEMPERATURE SECTION & FLUID SVG CURVE
    // --------------------------------------------------
    const temps = hourlyData.map(h => useFeelsLike ? tConv(h.feels_like) : tConv(h.temp));
    const minT = Math.min(...temps);
    const maxT = Math.max(...temps);
    const rangeT = (maxT - minT) || 1;

    // Auto-scale Y with 1-degree padding
    const displayMin = minT - 1;
    const displayMax = maxT + 1;
    const displayRange = displayMax - displayMin;

    // SVG generation (Fluid Bezier) - using internal coord system 100x100 for simplicity then scaling
    const graphW = 1000;
    const graphH = 200;
    const stepX = graphW / Math.max(1, temps.length - 1);
    const getY = (t) => graphH - (((t - displayMin) / displayRange) * (graphH * 0.6)) - (graphH * 0.2);

    // Draw Line
    let pathD = `M 0,${getY(temps[0])}`;
    for (let i = 0; i < temps.length - 1; i++) {
        const x1 = i * stepX;
        const y1 = getY(temps[i]);
        const x2 = (i + 1) * stepX;
        const y2 = getY(temps[i + 1]);
        const cpX = (x1 + x2) / 2;
        pathD += ` C ${cpX},${y1} ${cpX},${y2} ${x2},${y2}`;
    }

    // Draw Fill Area
    const fillD = `${pathD} L ${graphW},${graphH} L 0,${graphH} Z`;

    // Set inner width to ensure labels don't bunch up
    const innerGraphWidth = hourlyData.length * 45; // Estimate width needed for labels without overlap

    // Time & Icon Labels overlay
    let labelsHtml = '';
    // Show labels for EVERY hour (least interval gap) as requested
    hourlyData.forEach((h, i) => {
        const isFirst = i === 0;
        const time = isFirst ? 'Now' : new Date(h.dt * 1000).toLocaleTimeString([], { hour: 'numeric' });
        const leftPct = (i / (temps.length - 1)) * 100;

        // Dynamic transform to prevent edge clipping (Now is left-aligned, others centered)
        const transform = isFirst ? 'none' : 'translateX(-50%)';
        const leftVal = isFirst ? '0' : `${leftPct}%`;

        const isDay = h.pod ? (h.pod === 'd') : (h.dt >= state.sunrise && h.dt < state.sunset);

        labelsHtml += `
            <div style="position: absolute; left: ${leftVal}; bottom: 12px; transform: ${transform}; display: flex; flex-direction: column; align-items: ${isFirst ? 'flex-start' : 'center'}; pointer-events: none; z-index: 1000 !important; color: #fff !important;">
                <span style="font-weight: 700; font-size: 0.95rem; text-shadow: 0 2px 4px rgba(0,0,0,1); color: #fff;">${temps[i]}${tSym}</span>
                <div style="width: 32px; height: 32px; margin: 6px 0; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); display: flex; align-items: center; justify-content: center;">
                    ${getIconForCondition(h.weather[0].main, isDay)}
                </div>
                <span style="font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.9; text-shadow: 0 1px 2px rgba(0,0,0,1); color: #fff;">${time}</span>
            </div>
        `;
    });

    const peakIdx = temps.indexOf(maxT);
    const peakTimeStr = new Date(hourlyData[peakIdx].dt * 1000).toLocaleTimeString([], { hour: 'numeric' });
    const isDropping = temps[temps.length - 1] < temps[0];
    const isStable = Math.abs(maxT - minT) <= 2;

    let dynamicSummary = "";
    if (isStable) {
        dynamicSummary = "Temperatures are staying fairly stable throughput the day.";
    } else if (peakIdx > 0 && peakIdx < temps.length - 1) {
        dynamicSummary = `High of ${maxT}${tSym} expected around ${peakTimeStr}, followed by a gradual ${isDropping ? 'cooling' : 'stabilization'}.`;
    } else if (isDropping) {
        dynamicSummary = "Temperatures are trending downward as the day progresses.";
    } else {
        dynamicSummary = "Likely a steady climb in temperature over the next few hours.";
    }

    const tempSectionHtml = `
        <div class="detail-graph-card" style="margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h5 style="margin: 0;">Temperature</h5>
                <div style="display: flex; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 2px; backdrop-filter: blur(10px);">
                    <button class="unit-toggle-btn ${!useFeelsLike ? 'active' : ''}" data-type="tempMode" data-val="actual" style="padding: 6px 12px; font-size: 0.8rem; border-radius: 6px;">Actual</button>
                    <button class="unit-toggle-btn ${useFeelsLike ? 'active' : ''}" data-type="tempMode" data-val="feels_like" style="padding: 6px 12px; font-size: 0.8rem; border-radius: 6px;">Feels Like</button>
                </div>
            </div>
            
            <div class="hourly-graph-wrapper" style="position: relative; width: 100%; height: 250px; overflow-x: auto; overflow-y: hidden; margin-bottom: 2rem; scrollbar-width: none; -ms-overflow-style: none;">
                <div class="hourly-graph-inner" style="position: relative; height: 250px; width: 900px; min-width: 100%; border-radius: 12px;">
                    <div class="graph-horizontal-line" style="position: absolute; top: 20%; width: 100%; height: 1px; background: rgba(255,255,255,0.03);"></div>
                    <div class="graph-horizontal-line" style="position: absolute; top: 50%; width: 100%; height: 1px; background: rgba(255,255,255,0.03);"></div>
                    <div class="graph-horizontal-line" style="position: absolute; top: 80%; width: 100%; height: 1px; background: rgba(255,255,255,0.03);"></div>
                    
                    <svg viewBox="0 0 ${graphW} ${graphH}" preserveAspectRatio="none" style="width: 100%; height: 150px; margin-top: 10px; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3)); pointer-events: none; position: relative; z-index: 1;">
                        <defs>
                            <linearGradient id="tempGrad" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stop-color="#fa709a" stop-opacity="0.3"/>
                                <stop offset="100%" stop-color="#fee140" stop-opacity="0"/>
                            </linearGradient>
                        </defs>
                        <path d="${fillD}" fill="url(#tempGrad)" />
                        <path d="${pathD}" fill="none" stroke="#fa709a" stroke-width="4" stroke-linecap="round" />
                        
                        <circle cx="0" cy="${getY(temps[0])}" r="5" fill="white" />
                        <circle cx="${graphW}" cy="${getY(temps[temps.length - 1])}" r="5" fill="white" />
                    </svg>
                    ${labelsHtml}
                </div>
            </div>
            
            <div style="padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.95rem; line-height: 1.5; opacity: 0.8;">
                ${dynamicSummary}
            </div>
        </div>
    `;

    // --------------------------------------------------
    // 3️⃣ CHANCE OF PRECIPITATION
    // --------------------------------------------------
    let popBars = '';
    hourlyData.forEach(h => {
        const time = new Date(h.dt * 1000).toLocaleTimeString([], { hour: 'numeric' });
        const p = h.pop || 0;
        const hPct = Math.max(p, 2);
        popBars += `
            <div style="display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 32px;">
                <div style="font-size: 0.7rem; color: #4facfe; font-weight: 600; margin-bottom: 2px;">${p > 0 ? p + '%' : ''}</div>
                <div style="width: 100%; height: 80px; display: flex; align-items: flex-end; justify-content: center; background: rgba(255,255,255,0.03); border-radius: 4px;">
                    <div style="width: 100%; height: ${hPct}%; background: linear-gradient(180deg, #4facfe 0%, rgba(79,172,254,0.3) 100%); border-radius: 4px; transition: height 0.3s ease;"></div>
                </div>
                <div style="font-size: 0.7rem; opacity: 0.6; margin-top: 4px;">${time.replace(/[:00 ]/g, '')}</div>
            </div>
        `;
    });

    const popSectionHtml = `
        <div class="detail-graph-card" style="margin-bottom: 2rem;">
            <h5>Chance of Precipitation</h5>
            <div style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 1rem;">Today's max chance: <strong>${highestPop}%</strong></div>
            <div style="display: flex; overflow-x: auto; gap: 0.25rem; padding-bottom: 0.5rem; align-items: flex-end;">
                ${popBars}
            </div>
            <div style="margin-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.75rem; font-size: 0.9rem; opacity: 0.9;">
                ${highestPop > 20 ? `Highest probability is around ${peakTime}.` : `No high chance of rain today.`}
            </div>
        </div>
    `;

    // --------------------------------------------------
    // 4️⃣ PRECIPITATION TOTALS
    // --------------------------------------------------
    const precipTotalsHtml = `
        <div class="detail-graph-card" style="margin-bottom: 2rem;">
            <h5>Precipitation Totals</h5>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                <div style="background: rgba(0,0,0,0.15); padding: 1rem; border-radius: 12px; text-align: center;">
                    <div style="font-size: 0.8rem; text-transform: uppercase; opacity: 0.6; margin-bottom: 0.5rem;">Current Rate</div>
                    <div style="font-size: 1.75rem; font-weight: 500;">${pConv(state.rain || state.snow || 0)}<span style="font-size: 1rem; opacity: 0.5;"> ${pSym}</span></div>
                </div>
                <div style="background: rgba(0,0,0,0.15); padding: 1rem; border-radius: 12px; text-align: center;">
                    <div style="font-size: 0.8rem; text-transform: uppercase; opacity: 0.6; margin-bottom: 0.5rem;">Next 24 Hours</div>
                    <div style="font-size: 1.75rem; font-weight: 500; color: #4facfe;">${totalNext24 === 0 ? '0' : pConv(totalNext24)}<span style="font-size: 1rem; opacity: 0.5; color: white;"> ${pSym}</span></div>
                </div>
            </div>
        </div>
    `;

    // --------------------------------------------------
    // 5️⃣ ABOUT FEELS LIKE
    // --------------------------------------------------
    const aboutHtml = `
        <div class="detail-text-card" style="margin-bottom: 2rem;">
            <h5>About 'Feels Like' Temperature</h5>
            <p>The Feels Like temperature relies on environmental data including the ambient air temperature, relative humidity, and wind speed to determine how weather conditions feel to bare skin.</p>
            <p style="margin-top: 0.5rem; opacity: 0.8;">Higher humidity in warm temps makes it feel hotter (Heat Index), while higher wind speeds in cool temps make it feel colder (Wind Chill).</p>
        </div>
    `;

    // --------------------------------------------------
    // 6️⃣ OPTIONS PANEL
    // --------------------------------------------------
    const optionsHtml = `
        <div class="detail-graph-card" style="margin-bottom: 2rem; display: flex; flex-direction: column; gap: 1.5rem;">
            <h5 style="margin: 0; padding-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1); opacity: 0.6; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">Display Options</h5>
            
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 1rem; font-weight: 500;">Temperature</span>
                <div class="smart-dropdown">
                    <div class="dropdown-trigger">
                        <span>${isK ? 'Kelvin (K)' : (isF ? 'Fahrenheit (°F)' : 'Celsius (°C)')}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                    <div class="dropdown-menu">
                        <div class="dropdown-item ${!isF && !isK ? 'selected' : ''}" data-type="temp" data-val="C">Celsius (°C)</div>
                        <div class="dropdown-item ${isF ? 'selected' : ''}" data-type="temp" data-val="F">Fahrenheit (°F)</div>
                        <div class="dropdown-item ${isK ? 'selected' : ''}" data-type="temp" data-val="K">Kelvin (K)</div>
                    </div>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 1rem; font-weight: 500;">Precipitation</span>
                <div class="smart-dropdown">
                    <div class="dropdown-trigger">
                        <span>${isCM ? 'Centimeters (cm)' : (isIn ? 'Inches (in)' : 'Millimeters (mm)')}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                    <div class="dropdown-menu">
                        <div class="dropdown-item ${!isCM && !isIn ? 'selected' : ''}" data-type="precip" data-val="mm">Millimeters (mm)</div>
                        <div class="dropdown-item ${isCM ? 'selected' : ''}" data-type="precip" data-val="cm">Centimeters (cm)</div>
                        <div class="dropdown-item ${isIn ? 'selected' : ''}" data-type="precip" data-val="in">Inches (in)</div>
                    </div>
                </div>
            </div>
        </div>
    `;


    // Master Assembly Output 
    return summaryHtml + tempSectionHtml + popSectionHtml + precipTotalsHtml + aboutHtml + optionsHtml;
};

const renderDailyDetail = (state) => {
    let html = `
        <div style="font-size: 1.1rem; opacity: 0.9; margin-bottom: 2rem;">
            5-Day Outlook. Expect mostly ${state.dailyForecast[1].weather[0].main.toLowerCase()} conditions tomorrow.
        </div>
        
        <div class="detail-graph-card">
            <div style="display: flex; flex-direction: column; gap: 1rem;">
    `;

    // Find absolute min/max across all 5 days for the bar scale
    let absoluteMin = 999;
    let absoluteMax = -999;
    state.dailyForecast.forEach(d => {
        if (d.main.temp_min < absoluteMin) absoluteMin = d.main.temp_min;
        if (d.main.temp_max > absoluteMax) absoluteMax = d.main.temp_max;
    });

    const range = absoluteMax - absoluteMin;

    state.dailyForecast.forEach((day, index) => {
        const dateObj = new Date(day.date + 'T12:00:00');
        const dayStr = index === 0 ? 'Today' : dateObj.toLocaleDateString([], { weekday: 'long' });

        const myMin = day.main.temp_min;
        const myMax = day.main.temp_max;

        const leftP = ((myMin - absoluteMin) / range) * 100;
        const widthP = ((myMax - myMin) / range) * 100;

        html += `
            <div style="display: grid; grid-template-columns: 80px 40px 1fr 40px; align-items: center; gap: 0.5rem;">
                <span style="font-weight: 500; opacity: 0.9;">${dayStr}</span>
                
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" width="32" height="32" style="margin-bottom: -4px;">
                    ${day.pop > 20 ? `<span style="color: #4facfe; font-size: 0.75rem; font-weight: bold;">${day.pop}%</span>` : ''}
                </div>
                
                <div style="display: flex; align-items: center; gap: 0.5rem; width: 100%;">
                    <span style="opacity: 0.6; font-size: 0.9rem; width: 25px; text-align: right;">${Math.round(myMin)}&deg;</span>
                    <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; position: relative;">
                         <div style="position: absolute; left: ${leftP}%; width: ${Math.max(widthP, 5)}%; height: 100%; background: linear-gradient(90deg, #4facfe, #fa709a); border-radius: 3px;"></div>
                    </div>
                    <span style="font-weight: 500; font-size: 0.9rem; width: 25px;">${Math.round(myMax)}&deg;</span>
                </div>
            </div>
        `;
    });

    html += `
            </div>
        </div>
        <div class="detail-text-card">
            <h5>About 5-Day Forecast</h5>
            <p>The 5-Day forecast uses the advanced global ensemble models to predict overarching weather patterns, temperature highs and lows, and precipitation risks for the upcoming week.</p>
        </div>
`;
    return html;
};
