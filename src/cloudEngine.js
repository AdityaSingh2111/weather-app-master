// cloudEngine.js
// Procedural vector cloud generation

const clouds = [];
let initialized = false;

// Cloud cluster definition
class Cloud {
    constructor(canvasWidth, canvasHeight, zIndex) {
        this.x = Math.random() * canvasWidth;
        this.y = (Math.random() * (canvasHeight * 0.4)) + (zIndex * 50); // Higher zIndex = lower in sky
        this.size = 100 + Math.random() * 300 + (zIndex * 50);
        this.speed = (0.1 + Math.random() * 0.5) * (1 / (zIndex + 1));
        this.opacity = 0.1 + (Math.random() * 0.3) * (1 / (zIndex + 1));

        // Procedural puffs making up the cloud
        this.puffs = [];
        const puffCount = 3 + Math.floor(Math.random() * 5);
        for (let i = 0; i < puffCount; i++) {
            this.puffs.push({
                offsetX: (Math.random() - 0.5) * this.size,
                offsetY: (Math.random() - 0.5) * (this.size * 0.4),
                radius: this.size * 0.3 + (Math.random() * this.size * 0.3)
            });
        }
    }

    update(windSpeed, canvasWidth) {
        // Wind speed directly influences cloud drift
        const velocity = this.speed * (windSpeed > 0 ? windSpeed : 1);
        this.x += velocity;

        if (this.x - this.size > canvasWidth) {
            this.x = -this.size;
        } else if (this.x + this.size < 0) {
            this.x = canvasWidth + this.size;
        }
    }

    draw(ctx, isStorm) {
        ctx.save();
        ctx.globalAlpha = this.opacity;

        // Darken clouds heavily during storms
        if (isStorm) {
            ctx.fillStyle = '#222936';
        } else {
            ctx.fillStyle = '#FFFFFF';
        }

        ctx.beginPath();
        for (let puff of this.puffs) {
            ctx.arc(this.x + puff.offsetX, this.y + puff.offsetY, puff.radius, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
    }
}

export const renderClouds = (ctx, canvas, timestamp, state) => {
    const cloudCover = state.clouds || 0; // 0 to 100 percentage
    const windSpeed = state.windSpeed || 1;
    const isStorm = state.weatherId >= 200 && state.weatherId < 300;

    // Scale cloud objects to OpenWeather percent
    const targetCloudCount = Math.floor((cloudCover / 100) * 30); // Max 30 large clusters

    if (!initialized || clouds.length !== targetCloudCount) {
        clouds.length = 0; // Clear
        for (let i = 0; i < targetCloudCount; i++) {
            const zIndex = i % 3; // 3 parallax layers
            clouds.push(new Cloud(canvas.width, canvas.height, zIndex));
        }
        initialized = true;
    }

    for (let cloud of clouds) {
        cloud.update(windSpeed, canvas.width);
        cloud.draw(ctx, isStorm);
    }
};
