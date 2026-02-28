// precipitationEngine.js
// Particle simulation for rain, snow, and lightning

const particles = [];
let maxParticles = 0;
let lastWeatherType = 'clear';

// Thunderstorm handling
let flashOpacity = 0;
let nextFlashTime = 0;

export const renderPrecipitation = (ctx, canvas, timestamp, state) => {
    const id = state.weatherId || 800; // OpenWeather ID
    let currentType = 'clear';
    let targetParticleCount = 0;

    // Classification
    if (id >= 200 && id < 300) { currentType = 'storm'; targetParticleCount = 800; }
    else if (id >= 300 && id < 600) { currentType = 'rain'; targetParticleCount = 500; }
    else if (id >= 600 && id < 700) { currentType = 'snow'; targetParticleCount = 300; }

    // Optimization for mobile (halve particles)
    if (window.innerWidth <= 768) targetParticleCount = Math.floor(targetParticleCount / 2);

    // Rebuild pool if weather changes
    if (currentType !== lastWeatherType) {
        particles.length = 0;
        maxParticles = targetParticleCount;
        for (let i = 0; i < maxParticles; i++) {
            particles.push(createParticle(canvas, currentType));
        }
        lastWeatherType = currentType;
    }

    if (currentType === 'clear' || maxParticles === 0) return;

    // Draw Particles
    ctx.save();
    if (currentType === 'snow') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    } else {
        ctx.strokeStyle = 'rgba(200, 220, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
    }

    for (let p of particles) {
        // Move
        p.y += p.vy;
        p.x += p.vx;

        // Reset if offscreen
        if (p.y > canvas.height) {
            p.y = -10;
            p.x = Math.random() * canvas.width;
        }

        // Draw
        if (currentType === 'snow') {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2); // Streak
        }
    }

    if (currentType !== 'snow') ctx.stroke();
    ctx.restore();

    // ─── Procedural Lightning ────────────────────────────────
    if (currentType === 'storm') {
        if (timestamp > nextFlashTime) {
            // Trigger flash
            flashOpacity = 1.0;
            // Next flash between 2 and 10 seconds
            nextFlashTime = timestamp + 2000 + Math.random() * 8000;
        }

        if (flashOpacity > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Decay
            flashOpacity -= 0.05;
        }
    }
};

const createParticle = (canvas, type) => {
    if (type === 'snow') {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            vy: Math.random() * 1 + 0.5,
            vx: (Math.random() - 0.5) * 0.5 // Soft drift
        };
    } else {
        // Rain / Storm
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vy: Math.random() * 15 + 10, // Fast drop
            vx: Math.random() * 2 + 1    // Slight wind shear
        };
    }
};
