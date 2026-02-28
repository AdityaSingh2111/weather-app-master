import { getIconForCondition } from './icons.js';

const getShortDayName = (unixSeconds, offsetSeconds = 0) => {
    const localDate = new Date((unixSeconds + offsetSeconds) * 1000);
    return localDate.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
};

const getShortHour = (unixSeconds, offsetSeconds = 0) => {
    const localDate = new Date((unixSeconds + offsetSeconds) * 1000);
    return localDate.toLocaleTimeString('en-US', { hour: 'numeric', timeZone: 'UTC' });
};

export const renderForecasts = (state) => {
    const forecastStrip = document.getElementById('forecast-strip');
    const hourlyStrip = document.getElementById('hourly-strip');

    // Bottom Row: 5-Day (Now 7-Day Vertical) Forecast Strip
    if (state.forecast && state.forecast.length > 0 && forecastStrip) {
        let html = '';
        state.forecast.forEach((dayData) => {
            const dayName = getShortDayName(dayData.dt, state.timezoneOffset);
            const max = Math.round(dayData.main.temp_max);
            const min = Math.round(dayData.main.temp_min);
            const svgIcon = getIconForCondition(dayData.weather[0].main);
            const popHtml = dayData.pop > 0 ? `<div class="df-pop">${dayData.pop}%</div>` : `<div></div>`;

            html += `
                <div class="daily-forecast-row">
                    <span class="df-day-name">${dayName}</span>
                    <div class="df-icon">${svgIcon}</div>
                    ${popHtml}
                    <div class="df-temps">
                        <span class="min">${min}&deg;</span>
                        <span class="max">${max}&deg;</span>
                    </div>
                </div>
            `;
        });
        forecastStrip.innerHTML = html;
    }

    // Hourly Strip
    if (state.hourlyForecast && state.hourlyForecast.length > 0 && hourlyStrip) {
        let html = '';
        state.hourlyForecast.forEach((hourData) => {
            const hourText = getShortHour(hourData.dt, state.timezoneOffset);
            const temp = Math.round(hourData.main.temp);
            const svgIcon = getIconForCondition(hourData.weather[0].main);
            const popHtml = hourData.pop > 0 ? `<div class="fc-pop">${hourData.pop}%</div>` : ``;

            html += `
                <div class="forecast-day">
                    <span class="fc-day-name">${hourText}</span>
                    <div class="fc-icon">${svgIcon}</div>
                    ${popHtml}
                    <div class="fc-temps">
                        <span class="fc-temp-max">${temp}&deg;</span>
                    </div>
                </div>
            `;
        });
        hourlyStrip.innerHTML = html;
    }
};
