const SVGS = {
    clearDay: `
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="22" fill="#FFD700">
            <animate attributeName="r" values="22;24;22" dur="3s" repeatCount="indefinite" />
        </circle>
        <g stroke="#FFA500" stroke-width="4" stroke-linecap="round">
            <path d="M50 10V22 M50 78V90 M10 50H22 M78 50H90 M21.72 21.72L30.2 30.2 M69.8 69.8L78.28 78.28 M21.72 78.28L30.2 69.8 M69.8 30.2L78.28 21.72">
                 <animate attributeName="stroke-opacity" values="1;0.5;1" dur="3s" repeatCount="indefinite" />
            </path>
        </g>
    </svg>`,
    clearNight: `
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="moonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
        <path d="M65 65 C65 81 51 90 35 90 C18 90 5 77 5 60 C5 43 18 30 35 30 C40 30 45 31 50 34 C40 38 35 48 35 60 C35 72 40 82 50 86 C45 89 40 90 35 90 Z" fill="#B0BEC5" filter="url(#moonGlow)" />
        <circle cx="80" cy="20" r="1.5" fill="#fff">
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="70" cy="45" r="1" fill="#fff">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="90" cy="50" r="1.2" fill="#fff">
            <animate attributeName="opacity" values="1;0.1;1" dur="2.5s" repeatCount="indefinite" />
        </circle>
    </svg>`,
    cloudDay: `
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="65" cy="35" r="18" fill="#FFD700" opacity="0.9"/>
        <path d="M25 65 C10 65 10 45 25 45 C25 25 55 25 65 40 C80 40 80 65 65 65 Z" fill="#F0F0F0"/>
    </svg>`,
    cloudNight: `
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
         <path d="M55 35 C55 46 46 55 35 55 C24 55 15 46 15 35 C15 24 24 15 35 15 C40 15 43 16 46 18 C39 21 35 28 35 35 C35 42 39 49 46 52 C43 54 40 55 35 55 Z" fill="#B0BEC5" opacity="0.8" />
        <path d="M30 75 C15 75 15 55 30 55 C30 35 60 35 70 50 C85 50 85 75 70 75 Z" fill="#455A64" opacity="0.9"/>
    </svg>`,
    rain: `
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 55 C15 55 15 35 30 35 C30 15 60 15 70 30 C85 30 85 55 70 55 Z" fill="#B0BEC5"/>
        <g stroke="#4facfe" stroke-width="3" stroke-linecap="round">
            <line x1="40" y1="65" x2="35" y2="80">
                <animate attributeName="y1" values="60;70;60" dur="1s" repeatCount="indefinite" />
                <animate attributeName="y2" values="75;85;75" dur="1s" repeatCount="indefinite" />
            </line>
            <line x1="55" y1="65" x2="50" y2="80">
                <animate attributeName="y1" values="65;75;65" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="y2" values="80;90;80" dur="1.2s" repeatCount="indefinite" />
            </line>
            <line x1="70" y1="65" x2="65" y2="80">
                <animate attributeName="y1" values="62;72;62" dur="0.8s" repeatCount="indefinite" />
                <animate attributeName="y2" values="77;87;77" dur="0.8s" repeatCount="indefinite" />
            </line>
        </g>
    </svg>`,
    storm: `
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 55 C15 55 15 35 30 35 C30 15 60 15 70 30 C85 30 85 55 70 55 Z" fill="#455A64"/>
        <path d="M55 55 L40 75 H55 L45 95 L65 70 H50 L55 55 Z" fill="#FFEB3B">
            <animate attributeName="opacity" values="1;0;1;0.5;1" dur="1.5s" repeatCount="indefinite" />
        </path>
    </svg>`,
    snow: `
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 55 C15 55 15 35 30 35 C30 15 60 15 70 30 C85 30 85 55 70 55 Z" fill="#CFD8DC"/>
        <g fill="#FFF">
            <circle cx="40" cy="70" r="3"><animate attributeName="cy" values="65;95" dur="2s" repeatCount="indefinite" /></circle>
            <circle cx="55" cy="70" r="3"><animate attributeName="cy" values="60;90" dur="2.5s" repeatCount="indefinite" /></circle>
            <circle cx="70" cy="70" r="3"><animate attributeName="cy" values="70;98" dur="1.8s" repeatCount="indefinite" /></circle>
        </g>
    </svg>`
};

export const getIconForCondition = (condition, isDay = true) => {
    if (!condition) return isDay ? SVGS.clearDay : SVGS.clearNight;
    const c = condition.toLowerCase();

    if (c.includes('storm') || c.includes('thunder')) return SVGS.storm;
    if (c.includes('snow')) return SVGS.snow;
    if (c.includes('rain') || c.includes('drizzle')) return SVGS.rain;
    if (c.includes('cloud') || c.includes('mist') || c.includes('fog')) {
        return isDay ? SVGS.cloudDay : SVGS.cloudNight;
    }

    return isDay ? SVGS.clearDay : SVGS.clearNight;
};
