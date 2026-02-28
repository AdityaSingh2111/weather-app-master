// Transformation Module: Normalizes and extracts precise data from OpenWeather endpoints
// securely flattening them into a single application state object.

import { processAtmosphereData } from './atmosphere.js';

export const normalizeWeatherData = (weatherData, forecastData, uviData, aqiData, lat = null) => {
    const atmosphere = processAtmosphereData(weatherData);

    // Extract exactly 1 forecast per day (roughly mid-day: 12:00:00) for the 5-day strip
    const dailyForecast = forecastData.list
        .filter(item => item.dt_txt.includes('12:00:00'))
        .slice(0, 5)
        .map(item => ({ ...item, pop: Math.round((item.pop || 0) * 100) }));

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
