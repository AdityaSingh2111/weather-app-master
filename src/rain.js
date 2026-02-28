// Lightweight Canvas Rain Particle System
// Max 60fps, activates only on "rain" or "storm" conditions.

let canvas, ctx;
let particles = [];
let isRaining = false;
let animationFrameId = null;

const INACTIVE_CONDITIONS = ['clear', 'clouds', 'snow', 'mist', 'fog'];

class Drop {
    constructor() {
        this.reset();
        // Randomize initial Y so they don't all start at the top on load
        this.y = Math.random() * canvas.height;
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -20; // Start slightly above the canvas
        // Randomize speed and length for depth simulation
        this.speed = Math.random() * 15 + 10;
        this.length = Math.random() * 20 + 15;
        this.opacity = Math.random() * 0.3 + 0.1; // Low opacity, subtle
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.reset();
        }
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.length);
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
}

const resizeCanvas = () => {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

const animate = () => {
    if (!isRaining) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    // Semi-transparent clear for subtle motion blur
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }

    animationFrameId = requestAnimationFrame(animate);
};

export const initRainSystem = () => {
    canvas = document.getElementById('rain-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d', { alpha: true });

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Determine drop count based on screen width (mobile vs desktop)
    const dropCount = window.innerWidth < 768 ? 50 : 120;

    for (let i = 0; i < dropCount; i++) {
        particles.push(new Drop());
    }
};

export const toggleRain = (condition) => {
    if (!condition) {
        isRaining = false;
        return;
    }

    const c = condition.toLowerCase();

    // Check if condition warrants rain
    const shouldRain = c.includes('rain') || c.includes('drizzle') || c.includes('storm') || c.includes('thunder');

    if (shouldRain && !isRaining) {
        isRaining = true;
        animate();
    } else if (!shouldRain && isRaining) {
        isRaining = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        // Final clear to remove remaining drops immediately
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
};
