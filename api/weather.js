export default async function handler(req, res) {
    const API_KEY = process.env.OPENWEATHER_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: 'API key not configured on server.' });
    }

    const { endpoint, lat, lon, q, limit } = req.query;

    if (!endpoint) {
        return res.status(400).json({ error: 'Missing endpoint parameter.' });
    }

    // Whitelist allowed endpoints to prevent open proxy abuse
    const ALLOWED_ENDPOINTS = {
        'weather': `https://api.openweathermap.org/data/2.5/weather`,
        'forecast': `https://api.openweathermap.org/data/2.5/forecast`,
        'uvi': `https://api.openweathermap.org/data/2.5/uvi`,
        'air_pollution': `https://api.openweathermap.org/data/2.5/air_pollution`,
        'geo': `https://api.openweathermap.org/geo/1.0/direct`
    };

    const baseUrl = ALLOWED_ENDPOINTS[endpoint];
    if (!baseUrl) {
        return res.status(400).json({ error: `Unknown endpoint: ${endpoint}` });
    }

    try {
        let url;
        if (endpoint === 'geo') {
            url = `${baseUrl}?q=${encodeURIComponent(q || '')}&limit=${limit || 5}&appid=${API_KEY}`;
        } else {
            url = `${baseUrl}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
        }

        const apiRes = await fetch(url);
        const data = await apiRes.json();

        // Set CORS and cache headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

        return res.status(apiRes.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(502).json({ error: 'Failed to fetch from weather API.' });
    }
}
