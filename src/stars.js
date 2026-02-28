// stars.js
// Procedural Canvas Starfield & Moon

let stars = [];
let initialized = false;

export const renderNightSky = (ctx, canvas, timestamp, cloudCoverPercent) => {
    // Inverse relationship: More clouds = less stars visible
    const visibilityFactor = Math.max(0, (100 - (cloudCoverPercent || 0)) / 100);
    if (visibilityFactor <= 0.05) return; // Too cloudy

    const starCount = window.innerWidth < 768 ? 60 : 150;

    if (!initialized || stars.length !== starCount) {
        stars.length = 0;
        for (let i = 0; i < starCount; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() > 0.9 ? 1.5 : 0.8,
                baseAlpha: Math.random() * 0.5 + 0.1,
                // Twinkle phase offset
                phase: Math.random() * Math.PI * 2
            });
        }
        initialized = true;
    }

    ctx.save();

    // Draw Moon Glow (Radial Gradient at top right)
    const moonX = canvas.width * 0.8;
    const moonY = canvas.height * 0.2;
    const moonGlow = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 300);
    // Dim the moon if heavily clouded
    const moonAlpha = 0.2 * visibilityFactor;

    moonGlow.addColorStop(0, `rgba(220, 230, 255, ${moonAlpha * 2})`);
    moonGlow.addColorStop(1, 'rgba(220, 230, 255, 0)');
    ctx.fillStyle = moonGlow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Stars
    ctx.fillStyle = '#FFFFFF';
    for (const star of stars) {
        // Subtle twinkle using sine wave based on timestamp
        const twinkle = Math.sin((timestamp * 0.001) + star.phase) * 0.2;
        ctx.globalAlpha = Math.max(0, (star.baseAlpha + twinkle) * visibilityFactor);

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
};
