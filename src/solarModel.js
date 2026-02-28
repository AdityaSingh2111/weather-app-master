// solarModel.js
// Mathematical mapping of the sun's position and atmospheric Rayleigh scattering colors

/**
 * Calculates continuous solar ratio to classify lighting.
 * Ratio < 0 or > 1 is night.
 * 0.0 is exact sunrise, 0.5 is solar noon, 1.0 is exact sunset.
 */
export const calculateSolarRatio = (sunrise, sunset) => {
    const rawNowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const nowParts = rawNowStr.split(' ');
    // use UTC time to map against exact unix timestamps of local timezone provided by API
    const now = Math.floor(Date.now() / 1000);
    const dayLength = sunset - sunrise;

    if (dayLength <= 0) return -1; // Polar night
    return (now - sunrise) / dayLength;
};

/**
 * Maps the solar ratio into a dynamic, multi-stop sky gradient.
 * Emulates Rayleigh scattering:
 * - High noon: Deep blue top, lighter blue horizon.
 * - Sunrise/Sunset: Darker blue top, intense orange/red/magenta horizon.
 * - Night: Near black/deep navy top, dark blue horizon.
 */
export const getSkyGradient = (ratio, cloudCoverPercent) => {
    let top, bottom;

    // Darken skies dynamically if heavy cloud cover exists
    const cloudDarkenFactor = Math.min(0.5, cloudCoverPercent / 100);

    if (ratio < -0.1 || ratio > 1.1) {
        // Deep Night
        top = [4, 9, 20];      //#040914
        bottom = [10, 20, 40];   //#0a1428
    } else if (ratio >= -0.1 && ratio < 0.1) {
        // Civil Twilight / Sunrise
        // Blending from night into vibrant dawn
        const progress = (ratio + 0.1) / 0.2; // 0 to 1
        top = lerpColor([4, 9, 20], [30, 45, 90], progress);       // Night to Dawn Blue
        bottom = lerpColor([10, 20, 40], [255, 120, 60], progress); // Night to Vibrant Orange
    } else if (ratio >= 0.1 && ratio <= 0.9) {
        // Daylight / Midday
        // Transition from Dawn/Dusk to Noon Blue
        // Distance from solar noon (0.5)
        const noonDistance = Math.abs(ratio - 0.5) * 2; // 0 at noon, 0.8 at 0.1/0.9

        // Noon colors
        const noonTop = [40, 100, 200];    // Bright azure overhead
        const noonBottom = [130, 180, 240]; // Soft blue horizon

        // Golden hour / late afternoon colors
        const goldenTop = [60, 90, 160];
        const goldenBottom = [240, 180, 110];

        top = lerpColor(noonTop, goldenTop, noonDistance);
        bottom = lerpColor(noonBottom, goldenBottom, noonDistance);
    } else {
        // Sunset
        const progress = (ratio - 0.9) / 0.2; // 0 to 1
        top = lerpColor([60, 90, 160], [10, 20, 50], progress);       // Blue to Night
        bottom = lerpColor([255, 100, 50], [20, 30, 60], progress);    // Orange to Night
    }

    // Apply cloud darkening
    top = top.map(c => Math.max(0, Math.floor(c * (1 - cloudDarkenFactor))));
    bottom = bottom.map(c => Math.max(0, Math.floor(c * (1 - cloudDarkenFactor))));

    return {
        top: `rgb(${top[0]}, ${top[1]}, ${top[2]})`,
        bottom: `rgb(${bottom[0]}, ${bottom[1]}, ${bottom[2]})`
    };
};

// Linear interpolation for RGB arrays
const lerpColor = (c1, c2, t) => [
    Math.floor(c1[0] + (c2[0] - c1[0]) * t),
    Math.floor(c1[1] + (c2[1] - c1[1]) * t),
    Math.floor(c1[2] + (c2[2] - c1[2]) * t)
];
