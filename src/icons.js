// Scalable, animated SVG Path definitions for weather conditions.
// Uses neutral white styling to fit professional SaaS look against thematic backgrounds.

const SVGS = {
    clear: `
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="20" fill="currentColor" opacity="0.9"/>
        <path d="M50 15V25 M50 75V85 M15 50H25 M75 50H85 M25 25L32 32 M68 68L75 75 M25 75L32 68 M68 32L75 25" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
    </svg>`,
    cloud: `
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 65 C15 65 15 45 30 45 C30 25 60 25 70 40 C85 40 85 65 70 65 Z" fill="currentColor" opacity="0.9"/>
        <animateTransform attributeName="transform" type="translate" values="-2,0; 2,0; -2,0" dur="12s" repeatCount="indefinite"/>
    </svg>`,
    rain: `
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 55 C15 55 15 35 30 35 C30 15 60 15 70 30 C85 30 85 55 70 55 Z" fill="currentColor" opacity="0.8"/>
        <path d="M35 65 L28 80 M50 65 L43 80 M65 65 L58 80" stroke="currentColor" stroke-width="4" stroke-linecap="round">
            <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/>
        </path>
    </svg>`,
    storm: `
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 55 C15 55 15 35 30 35 C30 15 60 15 70 30 C85 30 85 55 70 55 Z" fill="currentColor" opacity="0.8"/>
        <path d="M55 55 L40 75 H55 L45 95 L65 70 H50 L55 55 Z" fill="#ffeb3b" opacity="0.9">
            <animate attributeName="opacity" values="0.9;0;0.9;0.1;0.9" dur="2s" repeatCount="indefinite"/>
        </path>
    </svg>`,
    snow: `
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 55 C15 55 15 35 30 35 C30 15 60 15 70 30 C85 30 85 55 70 55 Z" fill="currentColor" opacity="0.8"/>
        <circle cx="35" cy="70" r="3" fill="currentColor">
            <animate attributeName="cy" values="60; 90" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="50" cy="70" r="3" fill="currentColor">
            <animate attributeName="cy" values="55; 95" dur="2.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="65" cy="70" r="3" fill="currentColor">
            <animate attributeName="cy" values="65; 85" dur="1.8s" repeatCount="indefinite"/>
        </circle>
    </svg>`
};

export const getIconForCondition = (condition) => {
    if (!condition) return SVGS.clear;
    const c = condition.toLowerCase();

    if (c.includes('storm') || c.includes('thunder')) return SVGS.storm;
    if (c.includes('snow')) return SVGS.snow;
    if (c.includes('rain') || c.includes('drizzle')) return SVGS.rain;
    if (c.includes('cloud') || c.includes('mist') || c.includes('fog')) return SVGS.cloud;

    return SVGS.clear;
};
