
// Topshiriq.uz — script.js (asosiy sahifa)

document.addEventListener('DOMContentLoaded', () => {

    // ── Smooth scroll for nav links ──
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ── Navbar: active link highlight on scroll ──
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a');

    if (sections.length && navLinks.length) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    navLinks.forEach(link => link.classList.remove('active'));
                    const activeLink = document.querySelector(`.nav-menu a[href="#${entry.target.id}"]`);
                    if (activeLink) activeLink.classList.add('active');
                }
            });
        }, { rootMargin: '-40% 0px -55%' });

        sections.forEach(section => observer.observe(section));
    }

    // ── Counter animation for metrics ──
    const metricItems = document.querySelectorAll('.metric-item h3');

    const countUp = (el) => {
        const text = el.getAttribute('data-target') || el.textContent;
        el.setAttribute('data-target', text);

        const isFloat = text.includes('.');
        const suffix = text.replace(/[\d.,]+/, '');
        const rawNum = parseFloat(text.replace(/[^0-9.]/g, ''));

        if (isNaN(rawNum)) return;

        let start = 0;
        const duration = 1400;
        const step = 16;
        const increment = rawNum / (duration / step);

        const timer = setInterval(() => {
            start += increment;
            if (start >= rawNum) {
                start = rawNum;
                clearInterval(timer);
            }
            el.textContent = (isFloat ? start.toFixed(1) : Math.floor(start).toLocaleString()) + suffix;
        }, step);
    };

    const metricsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                countUp(entry.target);
                metricsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    metricItems.forEach(el => metricsObserver.observe(el));

});
