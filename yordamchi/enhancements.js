/* ============================================
   YANGI MO'JIZA — Enhancements JS
   Premium interactions: scroll-reveal, ripple,
   counters, magnetic buttons, stagger, etc.
   Non-destructive — wraps around existing code.
   ============================================ */
(function () {
    'use strict';

    /* ---------- 1. SCROLL-REVEAL via IntersectionObserver ---------- */
    function initScrollReveal() {
        const targets = document.querySelectorAll(
            '.task-card, .category-item, .safety-item, .step-card, ' +
            '.metric-item, .stat-users, .stat-meta, .hero-text, .hero-preview, ' +
            '.section-header, .footer-about, .footer-links, .footer-bottom, ' +
            '.card, .stat-card, .info-card, .listing-card, .helper-card, ' +
            '.baholash-card, .kuzatish-card, .poster-card, .daromad-card, ' +
            '.chat-item, .muammo-card, .natija-card, .onboarding-card, ' +
            '.bildirishnoma-card, .profile-card, .notification-item'
        );

        targets.forEach((el, idx) => {
            el.setAttribute('data-reveal', 'fade');
            // Compute stagger within parent
            const parent = el.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children).filter(c => c.hasAttribute('data-reveal'));
                const localIdx = siblings.indexOf(el);
                el.style.setProperty('--xm-reveal-delay', (localIdx * 60) + 'ms');
            }
        });

        if (!('IntersectionObserver' in window)) {
            targets.forEach(el => el.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.08,
            rootMargin: '0px 0px -40px 0px'
        });

        targets.forEach(el => observer.observe(el));
    }

    /* ---------- 2. NAVBAR SCROLL STATE ---------- */
    function initNavbarScroll() {
        const nav = document.querySelector('.navbar, .header, .topbar, .app-header');
        if (!nav) return;
        const update = () => {
            if (window.scrollY > 8) {
                nav.classList.add('is-scrolled');
            } else {
                nav.classList.remove('is-scrolled');
            }
        };
        window.addEventListener('scroll', update, { passive: true });
        update();
    }

    /* ---------- 3. RIPPLE EFFECT on buttons & links ---------- */
    function initRipple() {
        const selectors = '.btn-primary, .btn-action-link, .btn-dark, .btn-outline, .btn-login, .see-all';
        document.addEventListener('pointerdown', (e) => {
            const btn = e.target.closest(selectors);
            if (!btn) return;
            const rect = btn.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            btn.style.setProperty('--xm-ripple-x', x + '%');
            btn.style.setProperty('--xm-ripple-y', y + '%');
        });
    }

    /* ---------- 4. COUNT-UP ANIMATION for stats ---------- */
    function animateCounter(el) {
        const text = el.textContent.trim();
        const match = text.match(/^([\D]*)([\d.,]+)([\D]*)$/);
        if (!match) return;

        const prefix = match[1] || '';
        const numStr = match[2];
        const suffix = match[3] || '';
        const hasComma = numStr.includes(',');
        const hasDot = numStr.includes('.');
        const raw = numStr.replace(/,/g, '');
        const target = parseFloat(raw);
        if (isNaN(target)) return;

        const decimals = hasDot ? (numStr.split('.')[1] || '').length : 0;
        const duration = 1400;
        const startTime = performance.now();

        function frame(now) {
            const t = Math.min((now - startTime) / duration, 1);
            // easeOutExpo
            const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            const current = target * eased;
            let displayValue;
            if (decimals > 0) {
                displayValue = current.toFixed(decimals);
            } else {
                displayValue = Math.round(current).toString();
            }
            if (hasComma) {
                displayValue = displayValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            }
            el.textContent = prefix + displayValue + suffix;
            if (t < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    function initCounters() {
        const selectors = '.metric-item h3, .stat-meta h4, .stat-value, [data-counter]';
        const counters = document.querySelectorAll(selectors);
        if (!counters.length) return;

        if (!('IntersectionObserver' in window)) {
            counters.forEach(animateCounter);
            return;
        }

        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(c => obs.observe(c));
    }

    /* ---------- 5. MAGNETIC BUTTONS (subtle hover follow) ---------- */
    function initMagnetic() {
        if (window.matchMedia('(hover: none)').matches) return; // skip on touch
        const selectors = '.btn-primary, .btn-dark, .logo-icon, .avatar-nav';
        document.querySelectorAll(selectors).forEach(el => {
            el.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                const strength = 0.2;
                el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
            });
            el.addEventListener('mouseleave', () => {
                el.style.transform = '';
            });
        });
    }

    /* ---------- 6. SMOOTH PAGE FADE-OUT on internal navigation ---------- */
    function initPageTransitions() {
        // Only fade in on load (CSS handles it via @keyframes xm-page-fade)
        // Add fade-out on internal link click
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;
            const href = link.getAttribute('href');
            if (!href) return;
            // Same-origin, not target=_blank, not hash
            if (link.target === '_blank') return;
            if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
            if (href.startsWith('http://') || href.startsWith('https://')) {
                try {
                    const url = new URL(href);
                    if (url.origin !== window.location.origin) return;
                } catch (_) { return; }
            }
            if (href.endsWith('.html') || href === '/' || href === '' || href.startsWith('./') || href.startsWith('../')) {
                e.preventDefault();
                document.body.style.transition = 'opacity 0.18s ease';
                document.body.style.opacity = '0';
                setTimeout(() => {
                    window.location.href = link.href;
                }, 180);
            }
        });
    }

    /* ---------- 7. SUBTLE 3D TILT on premium cards ---------- */
    function initTilt() {
        if (window.matchMedia('(hover: none)').matches) return;
        const selectors = '.phone-mockup, .task-card, .safety-item, .listing-card, .helper-card';
        document.querySelectorAll(selectors).forEach(el => {
            let raf = null;
            el.addEventListener('mousemove', (e) => {
                if (raf) cancelAnimationFrame(raf);
                raf = requestAnimationFrame(() => {
                    const rect = el.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width - 0.5;
                    const y = (e.clientY - rect.top) / rect.height - 0.5;
                    const rotY = x * 4;
                    const rotX = -y * 4;
                    el.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
                });
            });
            el.addEventListener('mouseleave', () => {
                if (raf) cancelAnimationFrame(raf);
                el.style.transform = '';
            });
        });
    }

    /* ---------- 8. AUTO-HIDE shimmer placeholders ---------- */
    function initShimmer() {
        const shimmers = document.querySelectorAll('.xm-shimmer');
        shimmers.forEach(s => {
            // Auto-remove shimmer after 2.5s for demo purposes
            setTimeout(() => s.classList.remove('xm-shimmer'), 2500);
        });
    }

    /* ---------- 9. KEYBOARD ENHANCEMENT: focus rings ---------- */
    function initKeyboardFocus() {
        let isKeyboard = false;
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' || e.key.startsWith('Arrow')) {
                isKeyboard = true;
                document.body.classList.add('xm-keyboard');
            }
        });
        document.addEventListener('mousedown', () => {
            isKeyboard = false;
            document.body.classList.remove('xm-keyboard');
        });
    }

    /* ---------- 10. INIT ALL ---------- */
    function init() {
        try {
            initScrollReveal();
            initNavbarScroll();
            initRipple();
            initCounters();
            initMagnetic();
            initPageTransitions();
            initTilt();
            initShimmer();
            initKeyboardFocus();
        } catch (err) {
            console.warn('[enhancements] init error:', err);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
