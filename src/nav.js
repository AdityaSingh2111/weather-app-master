// Navigation Engine: Handles scroll anchoring and intersection observation
// for the fixed vertical sidebar navigation.

export const initNavigation = () => {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.dash-section');
    const scrollContainer = document.getElementById('dashboard-card');

    if (!navButtons.length || !sections.length || !scrollContainer) return;

    // 1. Handle Click-to-Scroll
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);

            if (targetSection && scrollContainer) {
                // Determine precision offset within the scrollable parent 
                // to prevent mobile Safari/Chrome from scrolling the whole document body
                const containerRect = scrollContainer.getBoundingClientRect();
                const targetRect = targetSection.getBoundingClientRect();
                const currentScroll = scrollContainer.scrollTop;

                // Calculate absolute position within container, minus a top buffer
                const targetScroll = (targetRect.top - containerRect.top) + currentScroll - 20;

                scrollContainer.scrollTo({
                    top: targetScroll,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 2. Handle Continuous Scroll Observation
    // Using an IntersectionObserver bounded to the scrollable dashboard card
    const observerOptions = {
        root: scrollContainer,
        rootMargin: '0px 0px -40% 0px', // Trigger slightly above center
        threshold: 0.1 // Just 10% visible triggers evaluation
    };

    const observerCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Remove active class from all buttons
                navButtons.forEach(btn => btn.classList.remove('active'));

                // Add active class to corresponding button
                const activeId = entry.target.id;
                const activeBtn = document.querySelector(`.nav-btn[data-target="${activeId}"]`);
                if (activeBtn) {
                    activeBtn.classList.add('active');
                }
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all sections
    sections.forEach(section => {
        observer.observe(section);
    });

    // 3. Scroll-Reveal Animation Observer
    // Adds .revealed class to each section as it enters view for the first time
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, {
        root: scrollContainer,
        threshold: 0.05
    });

    sections.forEach(section => {
        // The first section (pt-0) should be immediately revealed
        if (section.classList.contains('pt-0')) {
            section.classList.add('revealed');
        }
        revealObserver.observe(section);
    });
};
