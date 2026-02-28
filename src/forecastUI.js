import { getIconForCondition } from './icons.js';
import { getShortDayName, getLongDayName, getDateString, getShortHour } from './clockManager.js';


export const renderForecasts = (state) => {
    const forecastStrip = document.getElementById('forecast-strip');
    const hourlyStrip = document.getElementById('hourly-strip');

    // Bottom Row: 5-Day Forecast Strip
    if (forecastStrip) {
        if (!state.dailyForecast || state.dailyForecast.length === 0) {
            forecastStrip.innerHTML = `<div class="daily-forecast-row" style="opacity: 0.5; justify-content: center;">Forecast data unavailable</div>`;
        } else {
            // Header Row for labels
            let html = `
                <div class="df-header-row">
                    <div class="df-date-group">DATE</div>
                    <div class="df-icon-spacer"></div>
                    <div class="df-condition-text">CONDITION</div>
                    <div class="df-pop-header">RAIN %</div>
                    <div class="df-temps-header">LOW / HIGH</div>
                </div>
            `;

            state.dailyForecast.forEach((dayData) => {
                try {
                    const dayName = getLongDayName(dayData.dt, state.timezoneOffset);
                    const dateStr = getDateString(dayData.dt, state.timezoneOffset);
                    const max = Math.round(dayData.main.temp_max);
                    const min = Math.round(dayData.main.temp_min);
                    const weather = dayData.weather && dayData.weather[0] ? dayData.weather[0] : { main: 'Clear', description: 'clear' };
                    const svgIcon = getIconForCondition(weather.main);

                    // Rain Chance UI with icon
                    const popValue = dayData.pop || 0;
                    const popIcon = popValue > 0 ? `<span class="pop-icon">💧</span> ` : `<span class="pop-icon-empty"></span>`;
                    const popHtml = `<div class="df-pop">${popIcon}${popValue}%</div>`;

                    html += `
                        <div class="daily-forecast-row">
                            <div class="df-date-group">
                                <span class="df-day-name">${dayName}</span>
                                <span class="df-date-label">${dateStr}</span>
                            </div>
                            <div class="df-icon">${svgIcon}</div>
                            <div class="df-condition-text">${weather.main}</div>
                            ${popHtml}
                            <div class="df-temps">
                                <div class="temp-group">
                                    <span class="temp-type-label">L</span>
                                    <span class="min">${min}&deg;</span>
                                </div>
                                <div class="temp-group">
                                    <span class="temp-type-label">H</span>
                                    <span class="max">${max}&deg;</span>
                                </div>
                            </div>
                        </div>
                    `;
                } catch (err) {
                    console.error("Error rendering forecast row:", err, dayData);
                }
            });
            forecastStrip.innerHTML = html;
        }
    }

    // Hourly Strip
    if (hourlyStrip) {
        if (!state.hourlyForecast || state.hourlyForecast.length === 0) {
            hourlyStrip.innerHTML = `<div class="forecast-day" style="opacity: 0.5;">No data</div>`;
        } else {
            let html = '';
            state.hourlyForecast.forEach((hourData) => {
                try {
                    const hourText = getShortHour(hourData.dt, state.timezoneOffset);
                    const temp = Math.round(hourData.main.temp);
                    const weatherMain = hourData.weather && hourData.weather[0] ? hourData.weather[0].main : 'Clear';
                    const svgIcon = getIconForCondition(weatherMain);
                    const popHtml = hourData.pop > 0 ? `<div class="fc-pop">${hourData.pop}%</div>` : ``;

                    html += `
                        <div class="forecast-day">
                            <span class="fc-day-name">${hourText || '--:--'}</span>
                            <div class="fc-icon">${svgIcon}</div>
                            ${popHtml}
                            <div class="fc-temps">
                                <span class="fc-temp-max">${isNaN(temp) ? '--' : temp}&deg;</span>
                            </div>
                        </div>
                    `;
                } catch (err) {
                    console.error("Error rendering hourly forecast item:", err, hourData);
                }
            });
            hourlyStrip.innerHTML = html;
        }
    }
};
