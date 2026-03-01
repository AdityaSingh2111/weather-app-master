// Parallax Engine: Monitors mouse position and updates CSS variables to drive native 3D acceleration.

// Throttle interval to prevent 1000Hz gaming mice from swamping the main thread
let requestRef = null;
let targetX = 0;
let targetY = 0;
// Use easing for buttery smooth dampening
let currentX = 0;
let currentY = 0;
const easeFactor = 0.05;

/**
 * The actual RAF tick loop calculating buttery smooth X/Y floats
 */
const updateParallax = () => {
    // Lerp (Linear Interpolate) current towards target
    currentX += (targetX - currentX) * easeFactor;
    currentY += (targetY - currentY) * easeFactor;

    // Check if we reached the target closely enough to pause RAF rendering
    if (Math.abs(targetX - currentX) > 0.0001 || Math.abs(targetY - currentY) > 0.0001) {
        const app = document.getElementById('app-content');
        if (app) {
            app.style.setProperty('--mouse-x', currentX.toFixed(3));
            app.style.setProperty('--mouse-y', currentY.toFixed(3));
        }
        requestRef = requestAnimationFrame(updateParallax);
    } else {
        requestRef = null;
    }
};

/**
 * Initializes the document bindings for tracking hardware coordinates.
 */
export const initParallax = () => {
    window.addEventListener('mousemove', (e) => {
        // Calculate raw offset between -1.0 and 1.0 (Center of screen is 0,0)
        targetX = (e.clientX / window.innerWidth - 0.5) * 2;
        targetY = (e.clientY / window.innerHeight - 0.5) * 2;

        // Boot up the Render Loop if it settled
        if (!requestRef) {
            requestRef = requestAnimationFrame(updateParallax);
        }
    });

    // Provide a gentle initialization bump
    requestRef = requestAnimationFrame(updateParallax);
};
