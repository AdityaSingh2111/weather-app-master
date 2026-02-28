// skyRenderer.js
import { calculateSolarRatio, getSkyGradient } from './solarModel.js';
import { renderClouds } from './cloudEngine.js';
import { renderPrecipitation } from './precipitationEngine.js';
import { renderNightSky } from './stars.js'; // Assuming we modify or reuse old stars logic

let canvas, ctx;
let animationId;
let engineState = null;

// Debounce resize
let resizeTimeout;

export const initSkyCanvas = () => {
    // Inject Canvas into DOM if missing
    let skyContainer = document.getElementById('sky-container');
    if (!skyContainer) {
        skyContainer = document.createElement('div');
        skyContainer.id = 'sky-container';
        skyContainer.style.position = 'fixed';
        skyContainer.style.top = '0';
        skyContainer.style.left = '0';
        skyContainer.style.width = '100vw';
        skyContainer.style.height = '100vh';
        skyContainer.style.zIndex = '0'; // Behind UI, in front of old background buffers
        skyContainer.style.pointerEvents = 'none';

        canvas = document.createElement('canvas');
        canvas.id = 'procedural-sky';
        skyContainer.appendChild(canvas);
        document.body.prepend(skyContainer);
    }

    ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha channel for performance since it's the absolute background
    resizeCanvas();

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resizeCanvas, 200);
    });
};

const resizeCanvas = () => {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

// ─── Main Render Loop ────────────────────────────────────────────────────────

const drawSkyGradient = (state) => {
    const ratio = calculateSolarRatio(state.sunrise, state.sunset);
    const cloudCover = state.clouds || 0;

    const colors = getSkyGradient(ratio, cloudCover);

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, colors.top);
    grad.addColorStop(1, colors.bottom); // Horizon

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
};

const renderLoop = (timestamp) => {
    if (!ctx || !engineState) return;

    // 1. Draw mathematical sky gradient
    drawSkyGradient(engineState);

    // 2. Render celestial bodies / stars if night
    const ratio = calculateSolarRatio(engineState.sunrise, engineState.sunset);
    if (ratio < 0 || ratio > 1) {
        renderNightSky(ctx, canvas, timestamp, engineState.clouds);
    }

    // 3. Render Clouds
    renderClouds(ctx, canvas, timestamp, engineState);

    // 4. Render Precipitation (Rain/Snow)
    renderPrecipitation(ctx, canvas, timestamp, engineState);

    // 5. Volume/Haze Diffusion Overlay
    drawAtmosphericHaze(engineState);

    animationId = requestAnimationFrame(renderLoop);
};

const drawAtmosphericHaze = (state) => {
    const visibility = state.visibility || 10000;
    const humidity = state.humidity || 50;

    let hazeAlpha = 0;
    if (visibility < 5000) {
        hazeAlpha = (5000 - visibility) / 5000; // 0 to 1
    }
    // High humidity slightly desaturates/washes out the simulation
    const humidityWash = Math.max(0, (humidity - 70) / 100);

    const totalAlpha = Math.min(0.8, hazeAlpha * 0.7 + humidityWash * 0.3);

    if (totalAlpha > 0.05) {
        ctx.fillStyle = `rgba(200, 210, 220, ${totalAlpha.toFixed(2)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
};

/**
 * Triggers re-computation of physics systems and starts the simulation loop.
 */
export const updateProceduralSky = (state) => {
    if (!canvas) initSkyCanvas();

    // Bind state globally to loop
    engineState = state;

    if (!animationId) {
        renderLoop(0);
    }
};
