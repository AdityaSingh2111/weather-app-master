// Transformation Module: Normalizes and extracts precise data from OpenWeather endpoints
// securely flattening them into a single application state object.

import { processAtmosphereData } from './atmosphere.js';

export const normalizeWeatherData = (weatherData, forecastData, uviData, aqiData, lat = null) => {
    const atmosphere = processAtmosphereData(weatherData);

    // Robust 5-Day Forecast Aggregation from 3-hourly data
    const buildDailyForecast = (forecastList) => {
        const dailyData = {};

        // Get today's date string in YYYY-MM-DD (local to the timezone offset if provided)
        // For simplicity, we can use the first item in the list as "today" or a marker.
        const firstEntryDate = forecastList[0].dt_txt.split(' ')[0];

        forecastList.forEach(item => {
            const date = item.dt_txt.split(' ')[0];

            // Skip "today" to avoid repeating current data shown in the hero section
            if (date === firstEntryDate) return;

            if (!dailyData[date]) {
                dailyData[date] = {
                    dt: item.dt,
                    date: date,
                    temp_max: item.main.temp_max,
                    temp_min: item.main.temp_min,
                    weather: item.weather,
                    pop: item.pop || 0
                };
            } else {
                // Update Min/Max
                dailyData[date].temp_max = Math.max(dailyData[date].temp_max, item.main.temp_max);
                dailyData[date].temp_min = Math.min(dailyData[date].temp_min, item.main.temp_min);
                // Grab the closest thing to mid-day for the icon if it passes 12:00
                if (item.dt_txt.includes('12:00:00')) {
                    dailyData[date].weather = item.weather;
                }
                // Maximize pop
                dailyData[date].pop = Math.max(dailyData[date].pop, item.pop || 0);
            }
        });

        // Convert to array and format to strictly 5 days
        return Object.values(dailyData).slice(0, 5).map(day => ({
            dt: day.dt,
            date: day.date,
            main: { temp_max: day.temp_max, temp_min: day.temp_min },
            weather: day.weather,
            pop: Math.round(day.pop * 100)
        }));
    };

    const dailyForecast = buildDailyForecast(forecastData.list);

    // Extract next 24 hours of forecast, 3-hour increments
    const hourlyForecast = forecastData.list
        .slice(0, 8)
        .map(item => ({ ...item, pop: Math.round((item.pop || 0) * 100) }));

    return {
        // Base Info
        locationName: weatherData.name,
        latitude: lat,
        timezoneOffset: weatherData.timezone,

        // Conditions
        condition: atmosphere.description,
        rawCondition: atmosphere.condition,
        weatherId: weatherData.weather[0].id,

        // Temperatures
        temperature: weatherData.main.temp,
        feelsLike: weatherData.main.feels_like,

        // Atmosphere Metrics
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure,
        visibility: weatherData.visibility, // in meters
        cloudCoverage: weatherData.clouds.all, // percentage

        // Wind
        windSpeed: weatherData.wind.speed,
        windDirection: weatherData.wind.deg,

        // Astronomy
        sunrise: weatherData.sys.sunrise,
        sunset: weatherData.sys.sunset,

        // Solar & Environment
        uvIndex: uviData ? uviData.value : null,
        aqi: aqiData?.list?.[0]?.main?.aqi || null,

        // Aggregated Arrays
        dailyForecast: dailyForecast,
        hourlyForecast: hourlyForecast
    };
};
