// Time Engine Module: Detects device time and updates the base light engine CSS variables.

export const initTimeEngine = () => {
    const updateTimeContext = () => {
        const hour = new Date().getHours();
        let timeClass = '';

        // Define 4 time ranges
        if (hour >= 5 && hour < 8) {
            timeClass = 'time-sunrise';
        } else if (hour >= 8 && hour < 17) {
            timeClass = 'time-day';
        } else if (hour >= 17 && hour < 20) {
            timeClass = 'time-dusk';
        } else {
            timeClass = 'time-night';
        }

        const body = document.body;

        // Clean out old time classes, preserving other classes like themes
        body.className = Array.from(body.classList)
            .filter(c => !c.startsWith('time-'))
            .join(' ');

        // Apply new time class
        body.classList.add(timeClass);
    };

    // Initial check
    updateTimeContext();

    // Auto-update every minute
    setInterval(updateTimeContext, 60000);
};
