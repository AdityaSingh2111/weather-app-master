# Mausam — Premium Meteorological PWA

> **Experience the atmosphere, don't just read about it.** A hyper-realistic, production-grade Progressive Web Application delivering real-time weather forecasts, air quality data, and cinematic atmospheric intelligence.

![Mausam Weather](https://mausamweb.vercel.app/mausam-icon-512.png)

[![Vite](https://img.shields.io/badge/bundler-Vite-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Vercel](https://img.shields.io/badge/deployment-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)
[![PWA](https://img.shields.io/badge/PWA-compliant-008080?style=flat-square)](https://web.dev/progressive-web-apps/)
[![JavaScript](https://img.shields.io/badge/logic-Vanilla%20JS-F7DF1E?style=flat-square&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

---

## 🌪️ Overview

Mausam is designed to push the boundaries of what's possible with vanilla web technologies. By combining procedural canvas rendering with a modular JavaScript architecture, it delivers a native-grade, fluid, and immersive meteorological experience directly in the browser.

The application is fully PWA-compliant, offline-capable, and optimized for maximum performance on everything from mobile devices to ultra-wide 4K displays.

## ✨ Core Features

-   **Hyper-Realistic Atmospheric Engine**: Procedural canvas-based rendering for rain, snow, and thunderstorms (`precipitationEngine.js`) combined with a dynamic time-of-day sky gradient system and cloud/star rendering.
-   **Intelligent Geolocation**: One-tap "Detect Location" system with high-precision fallback and permission handling.
-   **SWR Caching System**: Implements a dedicated "Stale-While-Revalidate" strategy for data fetching, ensuring instant UI responses with silent background updates.
-   **Cinematic UI/UX**: An engineered glassmorphism interface featuring sub-pixel perfect kerning, elegant depth layering, and a dedicated iOS-compliant safe-area layout.
-   **Granular Forecasting**:
    -   **24-Hour Timeline**: Snap-scrolling hourly metrics with precipitation probability.
    -   **7-Day predictive mode**: Deep-dive forecast rows with detailed condition analytics and temperature variance.
-   **Advanced Health Metrics**: UV Index, Humidity, Visibility, Pressure, and real-time Air Quality (AQI) visualizations.
-   **Offline First Architecture**: A dynamic service worker (`sw.js`) utilizing a strictly partitioned Network-First strategy ensures the app remains functional even during total connectivity loss.
-   **Serverless Security**: A secure Vercel Edge proxy (`/api/weather`) obfuscates all OpenWeatherMap API keys from the client-side bundle.

## 🛠️ Technology Stack

-   **Frontend**: Vanilla HTML5, CSS3, ES2023 JavaScript.
-   **Rendering**: 2D Canvas API for particle physics and atmospheric effects.
-   **State Management**: Optimized reactive subscription model (Observer pattern).
-   **Build Pipeline**: [Vite](https://vitejs.dev/) (Aggyressions JS minification, CSS hashing, and dead-code elimination).
-   **API Protection**: [Vercel Functions](https://vercel.com/docs/functions) (Server-side key obfuscation).
-   **Data Provider**: [OpenWeatherMap API](https://openweathermap.org/) (OneCall v3.0, Geocoding, and Air Pollution).

## 📂 Architecture

Mausam utilizes a strictly decoupled, modular architecture to ensure scalability and maintainability:

```text
/src
 ├── main.js                 # App orchestrator & lifecycle manager
 ├── api.js                  # SWR-enabled fetch routines & API proxy
 ├── cache.js                # Memory-based SWR cache orchestrator
 ├── state.js                # Minimal reactive state store
 ├── ui.js                   # Shell & layout manager
 ├── forecastUI.js           # Dynamic forecast row/strip rendering
 ├── precipitationEngine.js  # GPU-accelerated canvas particle physics
 ├── cloudEngine.js          # Dynamic cloud layer generator
 ├── skyRenderer.js          # Procedural sky & solar model rendering
 ├── themeEngine.js          # Time-of-day dependent CSS variable mutations
 ├── clockManager.js         # DateTime formatting & timezone adjustments
 ├── cities.js               # Persistence layers for saved cities & GPS logic
 └── transform.js            # Data normalization & unit conversion
```

## 🚀 Local Development

### Prerequisites

-   Node.js (v18+)
-   An active `OPENWEATHER_API_KEY`

### Setup

1.  **Clone the repository**
    ```bash
   git clone https://github.com/your-username/weather-app-master.git
    cd weather-app-master
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file from the example:
    ```bash
    cp .env.example .env
    ```
    Add your API key:
    ```env
    OPENWEATHER_API_KEY=your_actual_api_key_here
    ```

4.  **Start the Dev Server**
    ```bash
    npm run dev
    ```

## 📦 Production & Performance

Mausam is built for speed. The production bundle is heavily optimized:

-   **Zero Dependencies**: Total runtime footprint is kept minimal.
-   **Lazy Initialization**: Atmospheric engines spin up only when the device supports them.
-   **Payload Performance**: Strictly kept under `28KB` (Gzipped) for core logic.
-   **PWA Compliance**: Lighthouse score of 100/100 for PWA and Performance.

---

*Architected and engineered for the modern web by Aditya Singh.*

