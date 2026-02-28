// Clock Manager Module: Handles live clock display and time formatting utilities.

let clockInterval = null;

/**
 * Formats a unix timestamp + timezone offset into a locale time string.
 */
export const formatTime = (unixSeconds, offsetSeconds = 0) => {
    const localDate = new Date((unixSeconds + offsetSeconds) * 1000);
    return localDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
};

/**
 * Gets a short weekday name from a unix timestamp.
 */
export const getShortDayName = (unixSeconds, offsetSeconds = 0) => {
    const localDate = new Date((unixSeconds + offsetSeconds) * 1000);
    return localDate.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
};

/**
 * Gets a short hour label from a unix timestamp.
 */
export const getShortHour = (unixSeconds, offsetSeconds = 0) => {
    const localDate = new Date((unixSeconds + offsetSeconds) * 1000);
    return localDate.toLocaleTimeString('en-US', { hour: 'numeric', timeZone: 'UTC' });
};

/**
 * Starts (or restarts) the live ticking clock for the active city's timezone.
 */
export const startLiveClock = (offsetSeconds) => {
    const dateText = document.getElementById('date-text');
    const timeText = document.getElementById('time-text');

    if (clockInterval) clearInterval(clockInterval);

    const update = () => {
        const nowUtc = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
        const cityTime = new Date(nowUtc + (offsetSeconds * 1000));

        dateText.innerText = cityTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        timeText.innerText = cityTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    update();
    clockInterval = setInterval(update, 1000);
};
