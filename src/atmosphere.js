// Atmosphere Module: Formats atmospheric conditions and extracts relevant weather data.

export const processAtmosphereData = (apiData) => {
    if (!apiData || !apiData.weather || !apiData.weather[0]) {
        return { condition: 'Unknown', description: 'Unknown' };
    }

    const mainCondition = apiData.weather[0].main;
    const description = apiData.weather[0].description;

    return {
        condition: mainCondition,
        // Capitalize the first letter of the description
        description: description.charAt(0).toUpperCase() + description.slice(1),
    };
};
