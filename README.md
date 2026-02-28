# Mausam — Premium Meteorological PWA

> A hyper-realistic, production-grade Progressive Web Application delivering real-time weather forecasts, air quality data, and atmospheric intelligence.

![Mausam Weather](https://mausamweb.vercel.app/mausam-icon-512.png)

## 🌪️ Overview

Mausam is designed to push the boundaries of what's possible with vanilla web technologies. By combining procedural canvas rendering with a modular JavaScript architecture, it delivers a native-grade, fluid, and immersive meteorological experience directly in the browser. 

The application is fully PWA-compliant, offline-capable, and optimized for maximum performance on both ultra-wide desktops and mobile devices.

## ✨ Core Features

- **Hyper-Realistic Atmospheric Engine**: Procedural canvas-based rendering for rain, snow, and thunderstorms (`precipitationEngine.js`) combined with a dynamic time-of-day sky gradient system.
- **Cinematic UI/UX**: Features an engineered glassmorphism interface with sub-pixel perfect kerning, elegant depth layering, and a dedicated iOS-compliant safe-area layout.
- **Real-Time Forecasting**: Granular current conditions, 24-hour snap-scrolling timelines, and 7-day predictive models powered by OpenWeatherMap.
- **Advanced Metrics**: UV Index, Humidity, Visibility, Pressure, and Air Quality (AQI) visualizations.
- **Offline First**: A dynamic service worker (`sw.js`) utilizing a strictly partitioned Network-First/Cache-Fallback strategy guarantees the app launches seamlessly without an internet connection.
- **Serverless API Protection**: A secure Vercel Edge proxy (`/api/weather`) completely obfuscates all OpenWeatherMap API keys from the client-side bundle.

## 🛠️ Technology Stack

- **Core**: Vanilla HTML5, CSS3, ES2020 JavaScript (No heavy UI frameworks)
- **Build Pipeline**: [Vite](https://vitejs.dev/) (for aggressive JS minification, CSS hashing, and dead-code elimination)
- **Deployment**: [Vercel](https://vercel.com) (Serverless edge network & API proxy)
- **Weather Data**: [OpenWeatherMap API](https://openweathermap.org/) (OneCall v3.0 & Geo API)

## 📂 Architecture

Mausam utilizes a strictly decoupled, modular architecture to prevent 'God-module' bloat:

```text
/src
 ├── main.js                 # Orchestrator & lifecycle manager
 ├── api.js                  # Fetch routines & Vercel proxy router
 ├── state.js                # Minimal reactive state store
 ├── searchUI.js             # Autocomplete binding & XSS-safe DOM injection
 ├── precipitationEngine.js  # GPU-accelerated canvas particle physics
 ├── themeEngine.js          # Time-of-day CSS variable mutations
 └── ...
```

## 🚀 Local Development

### Prerequisites
- Node.js (v18+)
- An active `OPENWEATHER_API_KEY`

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/weather-app-master.git
   cd weather-app-master
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Rename `.env.example` to `.env` and add your API key:
   ```env
   OPENWEATHER_API_KEY=your_actual_api_key_here
   ```

4. **Start the Vite Dev Server**
   ```bash
   npm run dev
   ```
   The local server will spin up (defaults to `http://localhost:3001` with HMR enabled).

## 📦 Production Build

Mausam utilizes Vite to bundle its 27+ ES modules into a strictly serialized, minified payload.

```bash
npm run build
```
This commands generates a `/dist` folder containing the heavily compressed HTML, mapped CSS chunks, and a minified service worker (`sw.js`). Total production JS payload is strictly kept under `25KB` (Gzipped).

## 🛡️ Security & Performance

- **XSS Sanitization**: All external DOM injections utilize `.textContent` or `document.createElement()`.
- **API Security**: Secrets never reach the browser. `api/weather.js` intercepts all data requests on the server edge.
- **Layout Shift (CLS)**: Hardcoded placeholder dimensions prevent vertical shifts during async data hydration.
- **Asset Optimization**: All icons are generated via `sharp-cli` for minimal footprint (~200KB standard payload).

---
*Architected and engineered for the modern web.*
