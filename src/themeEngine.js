// Theme Engine Module: Dynamically calculates weather modifiers over the base time theme.

export const computeAtmosphere = (condition) => {
    // Default base modifiers for 'clear' or unmapped conditions
    const modifiers = {
        '--weather-brightness': '1',
        '--weather-saturation': '1',
        '--haze-opacity': '0',
        '--bloom-multiplier': '1'
    };

    if (!condition) return modifiers;

    const c = condition.toLowerCase();

    if (c.includes('cloud')) {
        modifiers['--weather-brightness'] = '0.85';
        modifiers['--weather-saturation'] = '0.8';
        modifiers['--haze-opacity'] = '0.4';
        modifiers['--bloom-multiplier'] = '0.8';
    } else if (c.includes('rain') || c.includes('drizzle') || c.includes('mist') || c.includes('fog')) {
        modifiers['--weather-brightness'] = '0.7';
        modifiers['--weather-saturation'] = '0.6';
        modifiers['--haze-opacity'] = '0.6';
        modifiers['--bloom-multiplier'] = '0.5';
    } else if (c.includes('storm') || c.includes('thunder') || c.includes('snow') || c.includes('extreme')) {
        modifiers['--weather-brightness'] = '0.5';
        modifiers['--weather-saturation'] = '0.4';
        modifiers['--haze-opacity'] = '0.8';
        modifiers['--bloom-multiplier'] = '0.2';
    }

    return modifiers;
};

const computeTemperatureHue = (temperature) => {
    if (temperature === null || temperature === undefined) {
        return '0deg'; // Neutral default
    }

    // < 10°C: Cool blue shift
    if (temperature < 10) {
        return '-15deg';
    }
    // > 25°C: Warm coral shift
    if (temperature > 25) {
        return '15deg';
    }

    // 10-25°C: Neutral
    return '0deg';
};

export const applyTheme = (condition, temperature) => {
    const modifiers = computeAtmosphere(condition);
    const hueShift = computeTemperatureHue(temperature);

    modifiers['--temperature-hue-shift'] = hueShift;

    // Apply final CSS variable values to body to smoothly modify the active time theme
    for (const [key, value] of Object.entries(modifiers)) {
        document.body.style.setProperty(key, value);
    }

    // Update PWA Meta Theme Color dynamically for iOS/Android status bars
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
        if (document.body.classList.contains('time-night')) {
            themeMeta.setAttribute('content', '#141E30');
        } else if (document.body.classList.contains('time-day')) {
            themeMeta.setAttribute('content', '#4facfe');
        } else if (document.body.classList.contains('time-dusk')) {
            themeMeta.setAttribute('content', '#fa709a');
        } else if (document.body.classList.contains('time-sunrise')) {
            themeMeta.setAttribute('content', '#ff9a9e');
        }
    }
};
