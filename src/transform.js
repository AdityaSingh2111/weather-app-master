// Transformation Module: Normalizes and extracts precise data from OpenWeather endpoints
// securely flattening them into a single application state object.

import { processAtmosphereData } from './atmosphere.js';

export const normalizeWeatherData = (weatherData, forecastData, uviData, aqiData, lat = null, exactName = null) => {
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
                    pop: item.pop || 0,
                    wind_speed: item.wind.speed,
                    humidity: item.main.humidity
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
                dailyData[date].wind_speed = Math.max(dailyData[date].wind_speed, item.wind.speed);
                dailyData[date].humidity = Math.max(dailyData[date].humidity, item.main.humidity);
            }
        });

        return Object.values(dailyData).slice(0, 5).map(day => ({
            dt: day.dt,
            date: day.date,
            main: { temp_max: day.temp_max, temp_min: day.temp_min },
            weather: day.weather,
            pop: Math.round(day.pop * 100),
            wind_speed: day.wind_speed,
            humidity: day.humidity
        }));
    };

    const dailyForecast = buildDailyForecast(forecastData.list);

    // Extract next 24 hours of forecast, 3-hour increments
    const hourlyForecast = forecastData.list
        .slice(0, 8)
        .map(item => ({
            dt: item.dt,
            dt_txt: item.dt_txt,
            temp: item.main.temp,
            feels_like: item.main.feels_like,
            pop: Math.round((item.pop || 0) * 100),
            weather: item.weather,
            pod: item.sys ? item.sys.pod : null,
            rain: item.rain ? (item.rain['3h'] || 0) : 0,
            snow: item.snow ? (item.snow['3h'] || 0) : 0
        }));

    // Extract detailed AQI if available
    const aqiList = aqiData?.list?.[0];
    const aqiComponents = aqiList?.components || null;

    return {
        // Base Info
        locationName: exactName || weatherData.name,
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
        rain: weatherData.rain ? (weatherData.rain['1h'] || weatherData.rain['3h'] || 0) : 0,
        snow: weatherData.snow ? (weatherData.snow['1h'] || weatherData.snow['3h'] || 0) : 0,

        // Astronomy
        sunrise: weatherData.sys.sunrise,
        sunset: weatherData.sys.sunset,

        // Solar & Environment
        uvIndex: uviData ? uviData.value : null,
        uviForecast: uviData || null, // Keeping full object in case its needed
        aqi: aqiList?.main?.aqi || null,
        aqiComponents: aqiComponents,

        // Aggregated Arrays
        dailyForecast: dailyForecast,
        hourlyForecast: hourlyForecast
    };
};
