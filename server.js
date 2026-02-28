require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENWEATHER_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the root and src directories
app.use(express.static(path.join(__dirname)));
app.use('/src', express.static(path.join(__dirname, 'src')));

// Weather API Proxy Endpoint
app.get('/api/weather', async (req, res) => {
    const { lat, lon, units } = req.query;

    if (!API_KEY) {
        return res.status(500).json({ error: "Server configuration error: Missing API Key." });
    }

    if (!lat || !lon) {
        return res.status(400).json({ error: "Missing required parameters: lat and lon." });
    }

    try {
        const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
            params: {
                lat,
                lon,
                units: units || 'metric',
                appid: API_KEY
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error("Proxy Error:", error.response ? error.response.data : error.message);
        const status = error.response ? error.response.status : 500;
        const message = error.response ? error.response.data.message : "Internal Server Error";
        res.status(status).json({ error: message });
    }
});

// Fallback to index.html for SPA-like behavior (optional)
app.get('/:path(.*)', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Weather App Backend running at http://localhost:${PORT}`);
    console.log(`Make sure your OPENWEATHER_API_KEY is set in the .env file.`);
});
