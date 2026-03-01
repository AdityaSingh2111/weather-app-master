// stars.js
// Procedural Canvas Starfield & Moon

let stars = [];
let initialized = false;

export const renderNightSky = (ctx, canvas, timestamp, cloudCoverPercent) => {
    // Inverse relationship: More clouds = less stars visible
    const visibilityFactor = Math.max(0, (100 - (cloudCoverPercent || 0)) / 100);
    if (visibilityFactor <= 0.05) return; // Too cloudy

    const starCount = window.innerWidth < 480 ? 40 : window.innerWidth < 768 ? 60 : 150;

    if (!initialized || stars.length !== starCount) {
        stars.length = 0;
        for (let i = 0; i < starCount; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() > 0.9 ? 1.0 : 0.5,
                // Slightly reduced brightness for visual subtlety
                baseAlpha: Math.random() * 0.2 + 0.04,
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
    ctx.beginPath();
    for (const star of stars) {
        // Subtle twinkle using sine wave based on timestamp
        const twinkle = Math.sin((timestamp * 0.001) + star.phase) * 0.2;
        const alpha = Math.max(0, (star.baseAlpha + twinkle) * visibilityFactor);

        // We can't batch globalAlpha easily without path2D or separate paths, 
        // but for stars, we can use fillStyle with rgba if we want to batch.
        // Actually, for simplicity and max performance, let's use a fixed low alpha 
        // or just accept the tiny overhead of fill() if we must vary alpha.
        // BETTER: Batch all stars of similar alpha or just use a single fill for the whole field 
        // if we use a constant twinkle for the group (or just skip twinkle for raw perf).
        // Let's use a single path for all stars and a compromise alpha.
        ctx.moveTo(star.x + star.size, star.y);
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    }
    ctx.globalAlpha = visibilityFactor;
    ctx.fill();

    ctx.restore();
};
