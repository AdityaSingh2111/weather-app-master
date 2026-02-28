const CACHE_NAME = 'mausam-app-v3';
const DYNAMIC_CACHE = 'mausam-dynamic-v1';
const IMAGE_CACHE = 'mausam-images-v1';
const MAX_DYNAMIC_ENTRIES = 10;
const MAX_IMAGE_ENTRIES = 30;

// App Shell assets to preload immediately
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/manifest.json',
    '/mausam-logo.png',
    '/robots.txt',
    '/sitemap.xml',
    '/src/main.js',
    '/src/api.js',
    '/src/atmosphere.js',
    '/src/solarModel.js',
    '/src/skyRenderer.js',
    '/src/cloudEngine.js',
    '/src/precipitationEngine.js',
    '/src/cache.js',
    '/src/cities.js',
    '/src/forecastUI.js',
    '/src/icons.js',
    '/src/nav.js',
    '/src/parallax.js',
    '/src/rain.js',
    '/src/stars.js',
    '/src/state.js',
    '/src/themeEngine.js',
    '/src/timeEngine.js',
    '/src/transform.js',
    '/src/ui.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
            .catch(err => console.error('[SW] Install cache.addAll failed:', err))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME && key !== DYNAMIC_CACHE && key !== IMAGE_CACHE) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Trim cache to a max number of entries (FIFO eviction)
const trimCache = async (cacheName, maxEntries) => {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    while (keys.length > maxEntries) {
        await cache.delete(keys.shift());
    }
};

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // ─── Strategy: External Images → Network First, cache fallback ──────────
    if (url.origin !== location.origin && event.request.destination === 'image') {
        event.respondWith((async () => {
            try {
                const networkResponse = await fetch(event.request);
                if (!networkResponse.ok) throw new Error('Image fetch failed');
                const responseClone = networkResponse.clone();
                const cache = await caches.open(IMAGE_CACHE);
                await cache.put(event.request, responseClone);
                trimCache(IMAGE_CACHE, MAX_IMAGE_ENTRIES);
                return networkResponse;
            } catch (error) {
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) return cachedResponse;
                return new Response('', { status: 404, statusText: 'Image unavailable offline' });
            }
        })());
        return;
    }

    // ─── Strategy: OpenWeather API → Network First, fallback cache ───────
    if (url.origin === 'https://api.openweathermap.org' || url.pathname.startsWith('/geo/')) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    const responseClone = networkResponse.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(event.request, responseClone);
                        trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_ENTRIES);
                    });
                    return networkResponse;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }

    // ─── Strategy: App Shell → Cache First, fallback network ────────────
    event.respondWith((async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        try {
            const networkResponse = await fetch(event.request);
            if (!networkResponse.ok) return networkResponse; // Don't cache 404s

            const responseClone = networkResponse.clone();
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, responseClone);

            return networkResponse;
        } catch (error) {
            if (event.request.mode === 'navigate') {
                return caches.match('/index.html');
            }
            return new Response('', { status: 404, statusText: 'Offline' });
        }
    })());
});
