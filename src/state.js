export const state = {
  temperature: null,
  feelsLike: null,
  condition: null,
  rawCondition: null,
  weatherId: null,
  latitude: null,
  locationName: null,
  timezoneOffset: null,
  humidity: null,
  windSpeed: null,
  windDirection: null,
  sunrise: null,
  sunset: null,
  aqi: null,
  forecast: [],
  error: null,
  loading: false,
};

const listeners = [];

export const subscribe = (listener) => {
  listeners.push(listener);
};

export const setState = (newState) => {
  Object.assign(state, newState);
  listeners.forEach(listener => listener(state));
};
